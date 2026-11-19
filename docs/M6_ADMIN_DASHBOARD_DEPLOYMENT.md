# M6 管理看板首版发布

## 状态与范围

2026-11-19：本地研究数据回归、8 项管理边界测试、8 项契约测试、15 项媒体/浏览器测试、双路线构建和 Worker 类型检查通过。生产迁移、工作人员凭证和 EdgeOne 发布尚未执行。本机 SSH 无法以现有公钥登录服务器，服务器步骤由维护人员在现有腾讯云终端执行；不要发送密码到聊天。

本次包含独立工作人员登录、进度总览、列表筛选与下钻、单人训练时长、暂停/恢复/退出及审计。不包含训练原文/AI 记录只读查看和工作人员会话导出，不能把整个 M6 标记为完成。

- 候选分支：`release/m6-admin-dashboard`。推送候选分支不会更新当前 `release/m3-mainland-postgres` 生产分支；若 EdgeOne 配置了预览自动构建，只生成预览，不应提升为生产。
- 国内后台入口：`https://www.resilience-training.cloud/admin/`，API 仍为 `https://api.resilience-training.cloud`。不新增域名、数据库或付费服务。
- 数据保存在腾讯云 PostgreSQL；本次不发布 Worker，不迁移 D1，也不把国内后台连接到 D1。
- 工作人员账号和 `C_TEST` 分开。同事可以共用一个工作人员账号，但审计只能标记账号，无法区分具体同事。

## 1. 备份并记录回退版本

以下均在腾讯云 Ubuntu 的 Bash 终端执行。每节确认成功再进入下一节，不要在本机 PowerShell 粘贴这些 Bash 命令。

```bash
set -euo pipefail
cd /opt/resilience-training-programme-m3
test -z "$(git status --porcelain)"
git remote get-url origin
git log -1 --oneline
sudo systemctl is-active resilience-backend
sudo systemctl start resilience-backup.service
sudo systemctl show resilience-backup.service -p Result
cd /tmp
BACKUP="$(sudo -u postgres find /var/backups/resilience -maxdepth 1 -type f -name 'resilience-*.dump' -printf '%T@ %p\n' | sort -nr | sed -n '1p' | cut -d' ' -f2-)"
test -n "$BACKUP"
sudo -u postgres pg_restore --list "$BACKUP" >/dev/null
echo 'PASS: backup archive readable'
cd /opt/resilience-training-programme-m3
git rev-parse HEAD | tee /home/ubuntu/resilience-pre-m6-commit.txt
sudo install -m 600 backend/.env /home/ubuntu/resilience-pre-m6.env
```

若工作区非空或 remote 不是 `Vigorouscrap/Resilience_training_programme_cloudflare.git`，停止并检查，不强制覆盖。备份检查仅表示归档可读取，不能替代已进行的恢复演练；仍保留服务器外备份。

## 2. 获取候选代码并构建

```bash
set -euo pipefail
cd /opt/resilience-training-programme-m3
git fetch origin release/m6-admin-dashboard
git merge --ff-only origin/release/m6-admin-dashboard
git log -1 --oneline
npm --prefix backend ci
npm --prefix backend run build
npm run test:admin
npm run test:contract:unit
```

`merge --ff-only` 只前进本机当前分支，不推送原 M3 分支；如有分叉会停止，不执行 reset。本步骤尚不重启现有后端。

## 3. 运行新增 PostgreSQL 迁移

仅用 `resilience_owner` 迁移；运行服务继续使用 `resilience_app`。下列密码隐藏输入并自动 URL 编码，不会写进 `.env` 或命令历史。

```bash
set -euo pipefail
cd /opt/resilience-training-programme-m3/backend
read -r -s -p 'resilience_owner password: ' RESILIENCE_MIGRATION_PASSWORD
echo
export RESILIENCE_MIGRATION_PASSWORD
export MIGRATION_DATABASE_URL="$(node --input-type=module -e 'process.stdout.write("postgresql://resilience_owner:" + encodeURIComponent(process.env.RESILIENCE_MIGRATION_PASSWORD) + "@127.0.0.1:5432/resilience_programme")')"
unset RESILIENCE_MIGRATION_PASSWORD
trap 'unset MIGRATION_DATABASE_URL RESILIENCE_MIGRATION_PASSWORD' EXIT
npm run db:migrate
unset MIGRATION_DATABASE_URL
trap - EXIT
cd /tmp
sudo -u postgres psql -d resilience_programme -v ON_ERROR_STOP=1 -c 'SELECT name, applied_at FROM research_migrations ORDER BY name;'
sudo -u postgres psql -d resilience_programme -v ON_ERROR_STOP=1 -c "SELECT tablename, tableowner FROM pg_tables WHERE schemaname='public' AND tablename IN ('admin_sessions','admin_audit_logs','participant_status_history');"
sudo -u postgres psql -d resilience_programme -v ON_ERROR_STOP=1 -c "SELECT table_name, has_table_privilege('resilience_app',format('public.%I',table_name),'SELECT') AS can_select, has_table_privilege('resilience_app',format('public.%I',table_name),'INSERT') AS can_insert, has_table_privilege('resilience_app',format('public.%I',table_name),'UPDATE') AS can_update, has_table_privilege('resilience_app',format('public.%I',table_name),'DELETE') AS can_delete FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('admin_sessions','admin_audit_logs','participant_status_history') ORDER BY table_name;"
```

应看到 `0002_admin_dashboard.sql`，三张表 owner 为 `resilience_owner`，每张表四项权限均为 `t`。保留 `research_migrations` 对运行账号不可访问的原权限。如果迁移失败，停止，不重启。新增表兼容旧代码，不需要清空研究数据。

## 4. 设置工作人员账号并重启后端

```bash
cd /opt/resilience-training-programme-m3/backend
npm run admin:hash-password
nano .env
```

交互输入 16 至 200 位强密码两次，保存生成的整行哈希。在 `.env` 增加/更新：

```dotenv
STAFF_ADMIN_USERNAME=research-team
STAFF_ADMIN_PASSWORD_HASH=scrypt$服务器刚刚生成的完整值
```

保留现有 `DATABASE_URL`、DeepSeek 密钥、`SESSION_SECRET` 和其余参数。`CORS_ORIGIN` 必须明确包含 `https://www.resilience-training.cloud`，不可用 `*` 代替。哈希中的 `$` 必须原样保留；**不要用 `source .env` 或 shell 展开读取 dotenv**。工作人员密码另行保管，不写进仓库或发到聊天。

```bash
set -euo pipefail
cd /opt/resilience-training-programme-m3/backend
chmod 600 .env
sudo systemctl restart resilience-backend
sudo systemctl is-active resilience-backend
curl --fail --silent --show-error --max-time 10 https://api.resilience-training.cloud/health
echo
CODE="$(curl --silent --show-error --max-time 10 -o /dev/null -w '%{http_code}' https://api.resilience-training.cloud/api/v1/admin/session)"
test "$CODE" = 401
echo 'PASS: anonymous admin session rejected'
sudo journalctl -u resilience-backend -n 20 --no-pager
```

预期 health 正常且匿名管理接口返回 401，而不是 404/500。此时后台 API 已启用，前端尚不必发布。不要输出 `.env` 内容；分享日志前检查敏感信息。

## 5. 发布 EdgeOne 前端并验收

后端全部通过后，在 EdgeOne 项目控制台将本次生产构建分支选择为 `release/m6-admin-dashboard`，核对与服务器相同的 Git 提交，保持构建命令 `npm run build:mainland`、输出目录 `dist/mainland`，发布到现有 `www.resilience-training.cloud`。不要选择默认 `npm run build`，默认构建连接 Cloudflare。

本机对应发布版本执行 `npm run verify:mainland`，只读校验静态文件哈希、runtime、API health/CORS 及匿名鉴权。然后浏览器验收：

- 访问正式域名 `/admin/`，未登录不展示数据。使用新工作人员账号登录，不使用 `C_TEST`。不要用 `edgeone.cool` 临时域名验收 Cookie，后台依赖正式 HTTPS 同站域名。
- 对照数据库核对入组数、结业数、当日分母/分子、提醒人数。已入组/今日完成/结业/提醒指标点击后列表应匹配。
- 搜索、排序、分页、桌面抽屉和手机详情正常；时长缺失显示空值，不伪造 0。旧记录缺失练习计时属于历史数据限制。
- 正式参与者只读检查。不为验收暂停/退出真实被试，也不调用会写入训练记录的 smoke；确有状态变更测试需要时使用团队专用测试身份。
- 退出后刷新与直接请求 API 均无法读取后台。普通参与者仍能正常登录和完成训练，Cloudflare 路线不受影响。

当前缺勤口径、实时完成率分母及暂停日期规则见 [ADMIN_DASHBOARD_PLAN.md](ADMIN_DASHBOARD_PLAN.md)。显示“已入组”并不等同于所有进入过页面的人。

## 6. 回退与凭证轮换

前端异常先在 EdgeOne 回退前一个部署。后端需要回退时，从 `/home/ubuntu/resilience-pre-m6-commit.txt` 取回之前记录的提交，确认工作区干净后使用 `git switch --detach <该提交>`，重新 `npm --prefix backend ci`、构建并重启服务。不要 DROP 新表，不回滚研究数据库，不恢复旧备份覆盖上线期间的新研究数据。

工作人员凭证泄露时立即修改密码哈希并重启服务：旧 Cookie 将因凭证指纹变化失效。临时禁用可清空两个 `STAFF_ADMIN_*` 配置再重启；参与者登录不受影响。进一步可由数据库管理员执行 `UPDATE admin_sessions SET revoked_at=now() WHERE revoked_at IS NULL;` 撤销所有工作人员会话。共享账号不提供个人级归因，后续若需要区分同事再升级为多账号。

## 待办

- [x] 本地实现、统计/鉴权边界、100+ 人隔离数据集及桌面/手机浏览器测试。
- [ ] 腾讯云备份、候选代码构建、0002 迁移与新表权限核验。
- [ ] 生产工作人员凭证、后端重启与匿名权限检查。
- [ ] EdgeOne 同版本发布、静态哈希和真实浏览器验收。
- [ ] 后续能力：训练原文/AI 记录只读查看、工作人员会话导出及其敏感访问审计。

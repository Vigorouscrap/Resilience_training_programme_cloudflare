# M3 实现与部署

日期：2026-11-09。状态：代码和本地验证完成，生产迁移与部署待执行。M3 不标记为生产验收完成。

## 本轮结果

继续使用当前 Cloudflare 仓库作为唯一代码基线，旧 `Resilience_training_programme` 仓库不修改。生产映射始终为：

| 前端 | 后端 | 存储 |
|---|---|---|
| Cloudflare Pages | Cloudflare Worker | D1 |
| EdgeOne Pages / `www.resilience-training.cloud` | 腾讯云 Fastify / `api.resilience-training.cloud` | 同机 PostgreSQL |

`shared-contract/research.mjs` 是两套后端共用的研究服务，包含身份规范化、上海午夜解锁、模块状态、事件校验、回放和导出。两套适配只负责 SQL 参数与事务执行，数据不会互传。共享 JSON Schema 已补充身份、模块请求/响应、双时长、批量事件和回放形状；运行时校验由共享服务执行。

已完成：

- Fastify 接入参与者开始/恢复、模块 start/complete/reset、events、replay、受保护 export。
- PostgreSQL 初始迁移、外键、唯一约束、串行化事务、事务级 advisory lock 和有限冲突重试；迁移命令记录文件名与 checksum，已执行文件被改动时拒绝继续。
- D1 新增 `0004_module_durations.sql`，保留旧数据；历史记录只能回填已知的服务器经过时长，练习计时器时长保持空值。
- 首次完成结果和快照不可被重复完成覆盖；超出 500000 字符的快照拒绝保存。PostgreSQL 完成/重置采用事务，D1 的相应写入使用原子 batch 与条件 SQL。
- 完成提交右上角计时器的 `practiceDurationSeconds`；后端保存 `elapsedDurationSeconds`。到课程终点停止计时，网络等待和完成重试不增加练习时长。
- 普通事件最多 100 条/批，逐条校验；同一批写入原子化，失败返回 `202/persisted:false`，不会只存部分后误报整批成功。客户端事件 ID 使确认丢失后的重试不重复保存。
- 前端有界重试队列：最多 500 条，最多重试 5 次，最长间隔 30 秒，保留原身份/session；400/403 等不可重试请求丢弃。内存队列在关闭/刷新页面后不保证保留，尚未承诺离线可靠投递。
- 跨 session 回放按 participant + module 读取，只开放已完成模块，读取不写入研究数据。
- tester/admin 自动标记 `testData:true`；其他由测试脚本标记的身份恢复时保留标记。默认导出排除测试身份。
- 导出采用独立 Bearer Token，支持 CSV/JSON、编号、模块、时间和测试数据筛选；记录凭证标识与筛选条件，不记录 token。CSV 带 UTF-8 BOM、正确保留引号/换行，并防止表格公式执行。

导出的时间筛选逐实体执行：模块以完成时间（未完成时取开始时间），session 以开始时间，其他记录以各自创建时间筛选；日期范围内的数据不保证包含该参与者范围外的全部历史。仅填日期时按 UTC 整日解释；需要上海自然日时应提供带 `+08:00` 的完整时间戳。

## 本地验证证据

在仓库根目录运行：

```powershell
npm run test:research
npm run test:contract:unit
npm run test:contract:fastify-local
npm --prefix cloudflare-worker run check
npm run build:cloudflare
npm run build:mainland
# 仅打包，不发布：
cd cloudflare-worker
npx wrangler deploy --dry-run
cd ..
```

`test:research` 使用 PGlite 执行真实 PostgreSQL 引擎 SQL，并用内存 SQLite 模拟 D1 原子 batch，覆盖并发首次登录/完成、幂等、快照一致性、故障中途回滚、重置清理、双时长、事件去重、跨 session 回放只读、身份隔离、CSV/JSON、默认排除测试身份、导出鉴权与审计。还通过实际 Fastify HTTP 运行现有 `full` 黑盒 profile，并调用实际 Worker 入口验证接口桥接、CSV 原始 BOM 字节和无 DB 分支。两端 10 个 AI hook 均测试了正常、空白、超长输出及模型/日志失败的 fallback。

PGlite 是单连接引擎；本地并发测试排队连接，不等同于腾讯云 PostgreSQL 的真实多连接竞争。SQLite 模拟也不能代替 Cloudflare D1 线上验收。实际迁移命令、数据库权限、独立连接并发、备份恢复和完整浏览器流程仍要线上验证，不能据此宣称 M3 已上线。

2026-11-10 已在腾讯云旁路目录 `/opt/resilience-training-programme-m3` 使用 Node.js 22.22.3 完成 `npm ci`、Fastify TypeScript build、8 项共享契约测试及完整 `test:research`，全部通过。测试中的 SQLite ExperimentalWarning、AI event persistence failed、Research storage operation failed 和核心 503/普通事件 202 均为测试主动覆盖的实验 API 或故障注入分支，不代表生产服务故障；测试使用临时 PGlite/SQLite/临时 Fastify，没有连接或写入正式 `resilience_programme`。服务器首次安装报告的 3 个 high severity 已通过发布提交 `1caf07f` 移除未使用 Prisma 工具链解决，服务器更新后应重新 `npm ci` 并以 `npm audit --omit=dev` 确认 0 vulnerabilities。

2026-11-11 旁路 Fastify 连接腾讯云 PostgreSQL 14.24，在 `127.0.0.1:18787` 完成真实数据库 `full` 契约测试，health/core/AI/events/replay/module access/completion 全部通过。数据库验收为 4 个 test participants、5 sessions、2 module runs、1 event、1 message、1 snapshot、0 AI call logs；测试身份全部带 `metadata.testData=true`。首个 readiness curl 在服务 bind 前即时拒绝连接，轮询随后成功；health uptime 为 1 秒，Fastify log 有 listening 和 200 health，属正常启动竞态。测试后的日志中 AI research log 未持久化是黑盒 AI 请求未携带研究 identity 的预期非阻断情况。

2026-11-11 PostgreSQL 本机 custom-format 全量备份已生成；第一次手工列表检查因 `find` 以 ubuntu 身份访问 0700 postgres 目录而失败，且后续无条件 echo 造成误报，未被记作验证通过。随后改由 postgres 用户执行 `find` 和 `pg_restore --list`，最新归档成功读取，输出 `PASS: backup archive is readable`。正在进行独立临时库恢复演练；每日 timer 尚未启用。

2026-11-11 独立恢复演练通过：恢复库 `resilience_restore_check` 成功恢复全部 9 张表；源库与恢复库的 participants/sessions/module_runs/module_events/messages/snapshots/ai_calls 计数均为 4/5/2/1/1/1/0。每日备份 timer 已排期于 2026-11-12 03:01:41 CST 首次运行，systemd journal 最近 6 次手动 backup 均以 `Finished` 成功结束；根盘使用率 20%（7.4 GB/40 GB），备份目录当前 6 份归档。脚本最新版本每次成功验证后仅保留最新 14 份。

## 腾讯云部署顺序

已有服务器：上海 Lighthouse，4 核/4 GB/40 GB，公网 IP `1.117.58.64`。无需购买数据库或迁移 D1。2026-11-10 实机检查确认：服务目录为 `/opt/resilience-training-programme/backend`，systemd 单元为 `/etc/systemd/system/resilience-backend.service`，服务以 Linux 用户 `ubuntu` 运行；Node.js 为 `v22.22.3`；系统盘 40 GB、已用 6.9 GB、可用 31 GB（19%）；服务器尚未安装 `psql`/PostgreSQL。保留已有 DeepSeek 等配置，不直接覆盖 `.env`。

### 1. 核对代码、运行环境和旧数据

服务器必须使用本仓库的新版本，并保留仓库根目录的 `shared-contract/`。不能仅复制 `backend/dist/`，编译后的服务仍引用共享模块。

2026-11-10 实机确认当前 `/opt/resilience-training-programme` 是旧仓库 `xiaoqisong12-lgtm/Resilience_training_programme.git`，提交 `746a69d`，没有 `shared-contract/`；工作区干净，现有 systemd 直接从该目录运行。M3 发布代码则位于 `Vigorouscrap/Resilience_training_programme_cloudflare.git` 的 `release/m3-mainland-postgres` 分支，两者不是同一 Git 历史。禁止在旧目录内强改 remote、强制 reset 或直接 pull M3。采用旁路目录 `/opt/resilience-training-programme-m3`：先克隆、构建、迁移和本机验收，保留旧目录作为可恢复的代码回退点，最后才修改 systemd WorkingDirectory/EnvironmentFile。

`/opt` 由 root 管理，不能直接以 `ubuntu` 创建旁路目录。先用 `sudo install -d -o ubuntu -g ubuntu -m 755 /opt/resilience-training-programme-m3` 创建空目录，再以 `ubuntu` 执行 clone。部署命令块应使用 `set -e`，避免 clone 或 `cd` 失败后继续在 `/opt` 误运行 npm。2026-11-10 首次 clone 因该权限限制失败，后续 npm 报错均为工作目录错误的连锁结果；旧服务和数据库未被修改。

当前 Node.js 22.22.3 满足要求，无需升级。下一步安装 Ubuntu 仓库提供的 PostgreSQL 服务和客户端：

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
psql --version
sudo systemctl is-enabled postgresql
sudo systemctl is-active postgresql
sudo -u postgres psql -d postgres -c 'SHOW server_version;'
sudo -u postgres psql -d postgres -c '\l'
sudo -u postgres psql -d postgres -c '\du'
```

2026-11-10 已确认 PostgreSQL 14.24 的 `main` cluster 在 5432 在线、开机启用并仅监听 `localhost`；初始只有系统数据库和 `postgres` 管理角色，没有旧项目数据库或角色。不使用旧 Prisma migrate 命令；Prisma 模型保留为未使用的历史骨架，不是本次研究数据模型。

旁路服务器执行 `npm ci` 后报告的 3 个 high severity 均来自未被运行代码引用的旧 Prisma CLI/config 依赖及 `deepmerge-ts`。M3 使用 `pg` 和 SQL migration runner，不使用 Prisma。发布分支已移除 `prisma`、`@prisma/client` 及相应 npm scripts，历史 `backend/prisma/schema.prisma` 仅保留作早期设计参考；不要执行 `npm audit fix` 自动升级数据库工具链。

### 2. 创建独立 owner 和运行账号

仅在确认没有同名数据库和角色后，审阅 `backend/deploy/postgres-bootstrap.sql.example`，在交互式 psql 中执行，其中 `\password` 会交互询问密码，避免把密码写入命令历史：

```bash
sudo -u postgres psql
```

PostgreSQL 仅监听 `127.0.0.1`/本地 socket，5432 不开放公网；应用使用 `resilience_app`，迁移使用 `resilience_owner`。连接串密码中的特殊字符须做 URL 编码。

Fastify 同样默认监听 `127.0.0.1`，生产 `.env` 设置 `HOST=127.0.0.1`；公网只经过 Nginx 的 80/443，备用验收端口也不会直接监听公网网卡。

2026-11-10 已完成本节：`resilience_owner`、`resilience_app` 和 `resilience_programme` 已创建，public schema 归 owner，PUBLIC 的 schema CREATE 已撤销，app 获得 schema USAGE，owner 后续创建的表会自动授予 app DML 权限。误执行的 `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO resilience_app;` 报 `relation "tables" does not exist`，只是把 `TABLES` 当成表名的语法错误；当时尚未迁移建表，不会改变权限或数据库内容，无需回滚。迁移后如需补授现有表，正确语法是 `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO resilience_app;`。

同日权限核验通过：两个角色均可登录，但都不是 superuser，且没有 CREATEDB/CREATEROLE；数据库 owner 为 `resilience_owner`，`resilience_app` 仅有 CONNECT；public schema 上 owner 有 CREATE，app 有 USAGE 但没有 CREATE。默认表权限显示 `resilience_app=arwd/resilience_owner`，即后续 owner 创建的表自动授予 INSERT/SELECT/UPDATE/DELETE。`\dt` 返回无 relation，确认正式迁移前数据库为空。数据库 ACL 中 PUBLIC 仅保留 TEMP（`=T`），由于 PUBLIC 的 CONNECT 已撤销，不构成外部连接入口。

### 3. 安装、构建、迁移

```bash
cd /opt/resilience-training-programme/backend
npm ci
npm run build
read -r -s -p 'Migration DATABASE_URL: ' MIGRATION_DATABASE_URL
export MIGRATION_DATABASE_URL
npm run db:migrate
unset MIGRATION_DATABASE_URL
```

上述路径对当前服务器应替换为 `/opt/resilience-training-programme-m3/backend`。旧目录的 `.env` 可在服务器内复制到新目录作为基础，但不能提交 Git；复制后将 `DATABASE_URL` 改为 `resilience_app`，迁移连接串只在当前终端临时输入，不写入 systemd 环境文件。正式切换前保留 `/etc/systemd/system/resilience-backend.service` 备份，并记录旧提交 `746a69d`。

2026-11-10 检查确认旧 `.env` 已包含 AI provider、DeepSeek、PORT、SESSION_SECRET、DATABASE_URL 和 CORS 所需变量，可以作为旁路环境基础；但文件权限为 `0644 ubuntu:ubuntu`，其中的 API key 和 session secret 可被其他本地用户读取。复制前将旧文件收紧为 `0600`，新文件使用 `install -m 600` 创建。只输出变量名核验，不输出或上传值；数据库密码通过隐藏输入临时注入并 URL 编码。

同日已验证 `resilience_owner` 通过 TCP/密码连接 `resilience_programme`，旁路 backend 从新 `.env` 加载的 `DATABASE_URL` 也以 `resilience_app` 成功连接同一数据库。迁移密码和运行密码、连接账号及 URL 编码均已实际验证，下一步可执行首次 migration；迁移前仍未切换或重启旧 systemd 服务。

2026-11-10 首次生产迁移已完成：`0001_research.sql` checksum 前缀为 `f5b426e62822`，应用时间为 `2026-11-10 19:50:50 +08:00`。public schema 共 9 张表，owner 均为 `resilience_owner`；`resilience_app` 对 8 张业务表具备 SELECT/INSERT/UPDATE/DELETE，对 `research_migrations` 四项权限全部为 false。迁移记录表权限已收紧，数据库结构和运行账号最小权限验收通过。旧 systemd 服务尚未切换。

迁移 URL 使用 owner 账号。随后管理员执行 `REVOKE ALL ON TABLE research_migrations FROM resilience_app;`，运行账号只保留研究表 SELECT/INSERT/UPDATE/DELETE 权限。迁移再次执行应显示 up to date。

在服务器已有 `.env` 中更新：

```text
DATABASE_URL=postgresql://resilience_app:<服务器上填写>@127.0.0.1:5432/resilience_programme
CORS_ORIGIN=https://www.resilience-training.cloud
TESTER_PARTICIPANT_CODES=C_TEST
ADMIN_PARTICIPANT_CODES=
ADMIN_EXPORT_TOKEN=<服务器上生成的随机值，或留空以暂时禁用导出>
EXPORT_CREDENTIAL_ID=mainland-primary
```

导出凭证就是下载研究数据时使用的密码，不影响参与者登录和训练。不需要现在指定专门的“保管人”；未配置时导出拒绝访问，开始实际导出前在服务器配置即可。Cloudflare 与腾讯云使用不同值。真实 token、数据库密码、DeepSeek key 不发到聊天或 GitHub。

### 4. 启动及本机验收

```bash
sudo systemctl restart resilience-backend
sudo systemctl status resilience-backend --no-pager
curl --fail http://127.0.0.1:8787/health
node ../scripts/contract-test.mjs http://127.0.0.1:8787 full
```

`full` 会创建带测试标记的新身份并完成它们的 1-1，不重置已有正式身份。随后使用 `C_TEST` 验证 reset 与导出，临时停 DB 验证核心 503 / 普通事件 202，再恢复服务。生产故障注入安排在正式招募前的验收窗口，不能在正式参与者训练时执行。

### 5. 备份、恢复与服务检查

已提供本机每日备份模板，默认使用 postgres 本地认证，不额外保存备份密码：

备份使用每日 timer；本机只保留最新 14 份经 `pg_restore --list` 验证的归档。只有新归档成功且可读后才清理更旧的、符合项目文件名规则的归档。部署前已完成一次手动备份和临时库恢复演练，源库与恢复库的 participants/sessions/module_runs/module_events/messages/snapshots/ai_calls 计数均为 4/5/2/1/1/1/0，恢复库列出全部 9 张表。至少每周将最新验证归档复制到服务器之外；本机轮转不能防止实例或系统盘整体损坏。

```bash
sudo install -d -o postgres -g postgres -m 700 /var/backups/resilience
sudo cp deploy/systemd/resilience-backup.service.example /etc/systemd/system/resilience-backup.service
sudo cp deploy/systemd/resilience-backup.timer.example /etc/systemd/system/resilience-backup.timer
sudo systemctl daemon-reload
sudo systemctl start resilience-backup.service
sudo systemctl enable --now resilience-backup.timer
sudo systemctl list-timers resilience-backup.timer
```

模板中的 `/opt/...` 路径须与实际代码目录一致，确保 postgres 用户可读取脚本。脚本验证归档可读后保留最近 14 份并清理更旧的项目归档。上线前把至少一份归档复制到服务器之外；可先用负责人电脑，无须为本轮另购 COS。未选择异地位置时只能认为“本机备份已配置”，不能认为完成容灾。

在独立临时库恢复，替换为实际归档路径：

```bash
sudo -u postgres createdb resilience_restore_check
sudo -u postgres pg_restore --no-owner --no-privileges --dbname=resilience_restore_check /var/backups/resilience/<实际文件名>.dump
sudo -u postgres psql -d resilience_restore_check -c 'SELECT count(*) FROM participants; SELECT count(*) FROM module_runs;'
```

进一步比对源库与恢复库的身份、模块、消息、快照数量和一条完整回放；检查完保留临时库或由负责人手动清理，不能恢复覆盖生产库。

日志沿用 systemd journal。上线前检查 journal 的 `SystemMaxUse`/`MaxRetentionSec` 和 Nginx 现有 logrotate，防止日志占满 40 GB 磁盘；记录 `df -h`、`systemctl is-active postgresql resilience-backend`、最近备份时间及备份 service 退出状态。本轮不引入额外监控平台。

## Cloudflare 部署顺序

必须先应用 D1 的 0004 迁移，再发布引用新字段的 Worker：

```bash
cd cloudflare-worker
npm ci
npx wrangler d1 migrations list resilience_research --remote
npx wrangler d1 migrations apply resilience_research --remote
# 如需启用导出，再交互设置；不写到 wrangler.toml。
npx wrangler secret put ADMIN_EXPORT_TOKEN
npm run deploy
```

然后在仓库根目录运行：

```bash
npm run test:contract -- https://resilience-ai-worker.1362758164.workers.dev full
```

Cloudflare Pages 重建 `npm run build:cloudflare`（产物 `dist/cloudflare`），EdgeOne Pages 重建 `npm run build:mainland`（产物 `dist/mainland`），以发布双时长和事件重试接线。只更新 Worker 不会更新浏览器里的前端代码。

不回滚数据库迁移，不删除已有 D1 表。若 Worker 发布失败，可回退旧 Worker：新增列兼容旧实现。PostgreSQL 上线前保存代码版本、环境变量副本及数据库备份；已产生正式研究数据后不能随意回滚到缺少研究接口的旧 Fastify。

## 下一步所需信息与门槛

开发不缺新的业务规则或域名。要实际完成 M3 上线，需要在腾讯云控制台终端执行上述步骤，或通过已有安全方式授权服务器访问；本会话尚未建立 SSH 连接，不能把“账号权限可用”当作已经登录服务器。

服务器路径、systemd 用户、Node 版本、PostgreSQL 安装、数据库迁移、最小权限、旁路 Fastify 真实 PostgreSQL full 测试和本机备份/恢复演练已经完成。切换 Fastify 前必须先完成 `api.resilience-training.cloud` HTTPS，并确认 Nginx 只代理到 loopback；否则正式 EdgeOne 页面会遇到 HTTPS mixed-content/接口失败。HTTPS/CORS 就绪后再切换 systemd 并联调 EdgeOne。Cloudflare D1 0004、Worker 和 Cloudflare Pages 更新仍需独立发布窗口；M5 完成登录后的音视频、42 模块、手机与三网验收。

2026-11-12 实机检查：`nginx -t` 通过，HTTP `http://api.resilience-training.cloud/health` 返回 200；`api.resilience-training.cloud` A 记录正确解析到 `1.117.58.64`。Nginx 当前只监听 80，HTTPS 连接 5 秒超时；Certbot 已安装但 `certbot certificates` 显示无证书。旧 Node 进程仍监听 `0.0.0.0:8787`，而 Nginx 已代理至 `127.0.0.1:8787`。M3 切换后通过 `HOST=127.0.0.1` 收紧监听；在证书和 443 配置完成前不切换正式 EdgeOne API。

同日确认 Certbot nginx 插件已安装，但 `nginx -t` 报 `1.117.58.64` 和 `api.resilience-training.cloud` 的 conflicting server name；配置虽可加载，其中一个重复 server block 会被忽略。证书签发前必须定位并消除重复的已启用配置，避免 Certbot 修改错误的 server block；在此之前不运行 `certbot --nginx`。

2026-11-10 已完成以下只读检查；不需要重复执行，除非服务器配置发生变化：

```bash
systemctl show resilience-backend -p WorkingDirectory -p FragmentPath -p User
node --version
psql --version
sudo -u postgres psql -d postgres -c '\l'
df -h /
```

不要直接用仓库里的 systemd 示例覆盖现有单元。实际服务当前以 `ubuntu` 运行，而示例使用 `www-data`；M3 先保持现有可运行用户，数据库访问权限通过独立 PostgreSQL 角色 `resilience_app` 控制。是否进一步更换 Linux 服务用户可在上线稳定后单独加固。

M3 代码已于 2026-11-10 固化到 GitHub 分支 `release/m3-mainland-postgres`，首个实现提交为 `3775c70`，当前经依赖清理后的部署提交为 `1caf07f`；`main` 仍保持 M2 版本，避免 EdgeOne 正式环境在腾讯云数据库迁移前自动发布新前端。服务器应从该发布分支更新完整仓库，再按本指南迁移。生产验收完成后才将发布分支合入 `main`，并把 EdgeOne 前端发布与 D1/Worker 更新纳入同一发布窗口。

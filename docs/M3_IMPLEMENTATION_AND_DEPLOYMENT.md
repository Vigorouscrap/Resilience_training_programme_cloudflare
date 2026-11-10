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

## 腾讯云部署顺序

已有服务器：上海 Lighthouse，4 核/4 GB/40 GB，公网 IP `1.117.58.64`。无需购买数据库或迁移 D1。2026-11-10 实机检查确认：服务目录为 `/opt/resilience-training-programme/backend`，systemd 单元为 `/etc/systemd/system/resilience-backend.service`，服务以 Linux 用户 `ubuntu` 运行；Node.js 为 `v22.22.3`；系统盘 40 GB、已用 6.9 GB、可用 31 GB（19%）；服务器尚未安装 `psql`/PostgreSQL。保留已有 DeepSeek 等配置，不直接覆盖 `.env`。

### 1. 核对代码、运行环境和旧数据

服务器必须使用本仓库的新版本，并保留仓库根目录的 `shared-contract/`。不能仅复制 `backend/dist/`，编译后的服务仍引用共享模块。

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

### 2. 创建独立 owner 和运行账号

仅在确认没有同名数据库和角色后，审阅 `backend/deploy/postgres-bootstrap.sql.example`，在交互式 psql 中执行，其中 `\password` 会交互询问密码，避免把密码写入命令历史：

```bash
sudo -u postgres psql
```

PostgreSQL 仅监听 `127.0.0.1`/本地 socket，5432 不开放公网；应用使用 `resilience_app`，迁移使用 `resilience_owner`。连接串密码中的特殊字符须做 URL 编码。

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

```bash
sudo install -d -o postgres -g postgres -m 700 /var/backups/resilience
sudo cp deploy/systemd/resilience-backup.service.example /etc/systemd/system/resilience-backup.service
sudo cp deploy/systemd/resilience-backup.timer.example /etc/systemd/system/resilience-backup.timer
sudo systemctl daemon-reload
sudo systemctl start resilience-backup.service
sudo systemctl enable --now resilience-backup.timer
sudo systemctl list-timers resilience-backup.timer
```

模板中的 `/opt/...` 路径须与实际代码目录一致，确保 postgres 用户可读取脚本。脚本检查归档目录，保留备份、不自动删除。上线前把至少一份归档复制到服务器之外；可先用负责人电脑，无须为本轮另购 COS。未选择异地位置时只能认为“本机备份已配置”，不能认为完成容灾。

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

服务器路径、systemd 用户、Node 版本、磁盘容量、PostgreSQL 安装、项目数据库/角色初始化及权限核验已经完成。下一步先把当前 M3 代码固化并同步到 GitHub，再在服务器更新完整仓库（必须包含根目录 `shared-contract/`），以 `resilience_owner` 执行迁移；迁移后收紧 `research_migrations` 权限并验证 `resilience_app` 只能进行运行时 DML。随后记录生产契约测试、备份/恢复和磁盘日志配置，才勾选 M3 完成。M4 继续内地 API HTTPS/CORS，M5 完成登录后的音视频、42 模块、手机与三网验收。

2026-11-10 已完成以下只读检查；不需要重复执行，除非服务器配置发生变化：

```bash
systemctl show resilience-backend -p WorkingDirectory -p FragmentPath -p User
node --version
psql --version
sudo -u postgres psql -d postgres -c '\l'
df -h /
```

不要直接用仓库里的 systemd 示例覆盖现有单元。实际服务当前以 `ubuntu` 运行，而示例使用 `www-data`；M3 先保持现有可运行用户，数据库访问权限通过独立 PostgreSQL 角色 `resilience_app` 控制。是否进一步更换 Linux 服务用户可在上线稳定后单独加固。

本轮代码和文档保留在本地工作区，尚未提交或推送 GitHub。服务器更新前须先发布代码版本，再按本指南执行迁移；推送关联分支还可能触发前端自动构建，因此应将代码发布与 D1/Worker 的迁移顺序一并安排。

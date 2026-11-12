# 中国大陆部署现状评估与实施方案

最后核对日期：2026-11-06（Asia/Shanghai）

## 2026-11-06 已确认决策

- `resilience-training.cloud` 已完成域名实名认证、ICP备案和备案主体手续，继续使用该域名。
- 腾讯云账号、Lighthouse 和域名相关管理权限可用。
- 中国大陆正式前端使用 `www.resilience-training.cloud`；首选 EdgeOne Pages，Lighthouse Nginx 静态托管作为低复杂度回退方案。
- 中国大陆正式 API 使用 `api.resilience-training.cloud`。
- 正式实验规模约 100 人；预实验约 10 人产生约 16 MB 数据，当前不是容量型项目。
- 不购买独立云数据库；在现有 4 核 CPU、4 GB 内存、40 GB 系统盘的 Lighthouse 上部署 PostgreSQL，数据库仅监听本机。
- Cloudflare D1 和中国大陆 PostgreSQL 数据完全分开，不迁移、不自动同步；参与者入口和导出也按环境区分。
- 隐私与研究数据治理暂按现有产品规则执行，本轮不新增功能或专题规划；基础访问控制、密钥保护和备份不属于可省略项。

## 结论

后续开发应以当前 Cloudflare 实验仓库为唯一代码基线，不应直接回到旧 `Resilience_training_programme` 仓库继续增加业务功能。

推荐目标不是维护两套前端代码，而是：

```text
同一套前端 src/
├─ 海外/实验入口：Cloudflare Pages -> Cloudflare Worker -> D1
└─ 中国大陆入口：国内静态托管 -> 腾讯云 Fastify API -> PostgreSQL
```

两个入口使用同一套 API 契约，但生产后端必须一一绑定，不能由访问者切换：Cloudflare Pages 固定使用 Cloudflare Worker；EdgeOne Pages 固定使用腾讯云 Fastify。两端研究数据分别保存，不跨环境读取、迁移或自动同步。

原因：

- 旧仓库停在 2026-06-19，只包含 AI hook 和早期腾讯云部署骨架。
- Cloudflare 仓库从旧仓库同一提交 `a01068d` 继续开发，已经加入参与者身份、逐日解锁、模块生命周期、事件采集、对话回放和测试工具。
- 当前 Cloudflare 工作区还有 2026-08-31 的未提交修复，直接使用旧仓库会同时丢失已提交功能和这些修复。
- `backend/` 在 Cloudflare 分支中仍保留，适合在同一仓库内补齐腾讯云实现，不需要复制或倒灌整套前端。

## 两个项目的代码关系

| 项目 | Git 状态与定位 | 当前能力 |
|---|---|---|
| `Resilience_training_programme` | `main` 停在 `a01068d`（2026-06-19），工作区干净 | 静态前端、10 个 AI hook、Fastify `/health` 和 AI hook、腾讯云 VM 部署模板 |
| `Resilience_training_programme_cloudflare` | 与旧仓库的共同基线正是 `a01068d`；之后增加 10 个提交，当前另有 16 个修改文件未提交 | 旧项目全部能力，加 Cloudflare Worker、D1、参与者 session、模块 run、事件采集、回放、完成状态、测试工具 |

从共同基线到 Cloudflare 当前已提交版本共有 36 个路径发生业务变更，约增加 6,342 行、删除 1,424 行。`backend/` 没有在这段提交历史中发生业务修改；磁盘级比较看到的后端差异主要是换行符，不代表实现已经同步升级。

当前未提交改动约增加 1,133 行、删除 612 行，涉及 16 个文件，主要是：

- tester/admin 重做已完成模块及 Worker reset 数据清理；
- 完成提示、回目录/主页、焦点和新版行内完成提醒；
- 服务端完成状态纠正本地缓存；
- 共享音频、倒计时和特殊交互模块的结束检测修复；
- fast mode 不再压缩 API 网络超时；
- 对话回放中的音频按钮恢复。

迁移前必须先回归并提交这些改动，建立可复现标签，避免线上版本、本地版本和 Git 版本继续漂移。

## 当前在线状态

下表汇总 2026-11-06 的初始检查与 2026-11-12 的最新生产状态：

| 地址 | 结果 | 说明 |
|---|---|---|
| `https://resilience-training-programme-cloudflare.pages.dev/` | HTTP 200 | Cloudflare 前端在线 |
| `https://resilience-ai-worker.1362758164.workers.dev/health` | HTTP 200 | Worker 在线，返回 10 个 hook；CORS 当前为 `*` |
| `https://resilience-training-programme-two.vercel.app/` | HTTP 200 | 旧 Vercel 前端仍在线 |
| `http://api.resilience-training.cloud/health` | HTTP 301 | Nginx 已将 HTTP 跳转至 HTTPS |
| `https://api.resilience-training.cloud/health` | HTTP 200 | M3 Fastify 正式在线，返回 `fastify-node` 与 10 个 hook |
| `https://www.resilience-training.cloud/` | HTTP 200 | EdgeOne 正式前端域名与 HTTPS 已可用 |

2026-11-12 15:40 CST，systemd 已正式切换到 `/opt/resilience-training-programme-m3/backend`；服务只监听 `127.0.0.1:8787`，由 Nginx 提供公网 HTTPS。真实 PostgreSQL full 契约和公网新版 health 均通过。EdgeOne 随后通过线上静态文件哈希校验、真实登录/AI/完成/回放 smoke，以及 42/42 模块入口和初始渲染回归；每个模块的 `module-runs/start` 均返回 200，未出现控制台错误、失败请求或同源/API 4xx/5xx。42 模块结果只覆盖入口与初始渲染，仍不能代替完整交互、实际音视频播放和移动网络回归。

腾讯云生产 `CORS_ORIGIN` 已配置为 `https://www.resilience-training.cloud`。Cloudflare Worker 的 CORS 仍为 `*`，需要在 Cloudflare 发布窗口收紧。

## 接口能力对比

| API | 腾讯云 M3 Fastify | Cloudflare Worker | 当前状态 |
|---|---:|---:|---|
| `GET /health` | 已实现并生产在线 | 已实现并在线 | 两端返回各自 runtime/provider 信息 |
| `POST /api/v1/ai/hooks/:hookId` | 已实现 10 个 hook | 已实现 10 个 hook | 共享 hook 清单与错误契约 |
| `POST /api/v1/participants/start` | 已实现 | 已实现 | 生产 PostgreSQL full 契约通过 |
| `POST /api/v1/module-runs/start` | 已实现 | 已实现 | 幂等与连续解锁契约通过 |
| `POST /api/v1/module-runs/complete` | 已实现 | 已实现 | Asia/Shanghai 次日解锁契约通过 |
| `POST /api/v1/module-runs/reset` | 已实现 | 已实现 | 仅 tester/admin 可用 |
| `POST /api/v1/events` | 已实现 | 已实现 | 批量写入、去重和重试契约通过 |
| `POST /api/v1/conversation/replay` | 已实现 | 已实现 | 参与者隔离和只读回放契约通过 |
| 受保护的 CSV/JSON 导出 | 已实现 | 已实现于待发布代码 | 未配置 token 时禁用，不影响训练 |

旧 Fastify 只能承载早期 AI 演示链路；它已由 M3 共享研究服务和 PostgreSQL adapter 替换。旧目录保留用于回滚历史，不再作为开发或生产基线。

## 已经提供或已经落实的信息

- 腾讯云 Lighthouse：中国大陆上海地域，Ubuntu 22.04 LTS。
- 公网 IP：`1.117.58.64`。
- 域名：`resilience-training.cloud`。
- API DNS：`api.resilience-training.cloud -> 1.117.58.64`，HTTP 跳转 HTTPS，公网 HTTPS health 正常。
- 服务器已经安装 Node.js、Git、Nginx，并用 systemd 托管 Fastify。Node.js 为 `v22.22.3`，正式服务目录为 `/opt/resilience-training-programme-m3/backend`，服务用户为 `ubuntu`。
- 同日确认该服务目录来自旧仓库 `xiaoqisong12-lgtm/Resilience_training_programme.git`（提交 `746a69d`），工作区干净但没有 `shared-contract/`；M3 必须从 Cloudflare 主线发布分支旁路部署，不能在旧仓库内直接拉取或强制合并。
- Nginx 已将 80 跳转 443，并将 HTTPS API 反向代理到 `127.0.0.1:8787`；证书自动续期 dry-run 通过。
- 服务器曾验证 DeepSeek 真调用成功；当前健康接口仍报告 provider 为 DeepSeek。
- 原项目本地 `.env.local` 中存在已配置的 DeepSeek 和 session 项，但数据库和 CORS 仍是本地/占位配置；文件已被 Git 忽略。本文件不记录任何密钥值。
- Cloudflare Pages、Worker、DeepSeek Secret 和 D1 已创建并部署；D1 binding 的数据库名为 `resilience_research`。
- Cloudflare 正式实验前端和 Worker 地址已确定。

## 仍缺失或需要重新确认的信息

### 需要项目负责人或云账号持有人确认

- EdgeOne Pages 在当前腾讯云账号/套餐下的具体内地节点/加速范围和媒体额度；创建临时站点后通过三网实测确认。
- 不要求现在指定生产导出凭证保管人；M3 已实现凭证保护，未配置 token 时禁用导出，不影响训练。实际导出前由负责人在对应后端配置 token，见 `M3_IMPLEMENTATION_AND_DEPLOYMENT.md`。

### 工程上尚未完成

- EdgeOne M3 Mainland 产物已发布；headless Edge 已完成登录、AI、模块 1-1 完成、回放与 PostgreSQL 写入，仍需真实手机音视频和完整 42 模块人工联调。
- Cloudflare D1 应用 `0004_module_durations.sql`，发布 Worker，运行线上 full contract，再重建 Cloudflare Pages。
- Cloudflare Worker 生产 CORS 仍为 `*`，需在发布窗口收紧。
- 42 个模块、手机端、断网重试、重复提交、跨标签页和回放尚未完成发布级回归。

## EdgeOne Pages 选择说明

### 是否需要重做前端

不需要。当前前端是原生 HTML、CSS、JavaScript 静态站，没有编译步骤，EdgeOne Pages 可以直接发布现有 `src/`。课程模块、图片、音频、视频和交互代码都继续复用，前端业务代码复用程度接近 100%。

需要做的部署适配只有：

1. 从 Git 仓库根目录部署，构建命令为 `npm run build:mainland`，输出目录为 `dist/mainland`；也可先用直接上传验证，再接 Git 自动部署。
2. 构建过程复制 `src/` 并替换产物中的 `runtime-config.js`，把 `apiBaseUrl` 固定为 `https://api.resilience-training.cloud`，不改写源码；Cloudflare 部署继续固定指向 Worker。
3. 在 EdgeOne Pages 绑定 `www.resilience-training.cloud`，按控制台要求配置 CNAME 和 HTTPS 证书。
4. 腾讯云 API 的 `CORS_ORIGIN` 明确允许 `https://www.resilience-training.cloud`。
5. 部署后核对 MP3、MP4、MOV 等较大静态资源的缓存、Range 请求、MIME 类型和手机播放。

不复制第二份源代码。两个部署分别从同一份 `src/` 生成独立静态产物并注入固定配置；生产环境不接受 query string 或 sessionStorage 后端覆盖，只有 localhost 本地开发可临时覆盖。

参考：EdgeOne Pages 官方产品说明将其定义为基于腾讯 EdgeOne 的前端/全栈部署平台，并提供 Git 仓库导入、直接上传、自定义域名与 HTTPS 配置文档。实际中国大陆节点能力仍以当前腾讯云账号控制台为准：

- https://pages.edgeone.ai/document/product-introduction
- https://pages.edgeone.ai/document/importing-a-git-repository
- https://pages.edgeone.ai/document/direct-upload
- https://pages.edgeone.ai/document/custom-domain

### 优点

- Git 提交后可自动部署，前端发布和回滚比手工复制到 Nginx 更简单。
- 静态资源由边缘节点缓存，音频、视频和图片不占 Lighthouse 的主要出口带宽。
- 自定义域名、HTTPS、缓存和基础防护集中管理。
- 前端与 API 分离，更新静态课程内容通常不需要重启 Fastify。
- 与现有 Cloudflare Pages 部署模型接近，迁移成本低。

### 缺点与边界

- 增加一个腾讯云产品和相应的套餐、配额、构建日志与域名配置管理。
- EdgeOne Pages/套餐实际覆盖的中国大陆节点和访问效果必须以当前账号控制台及三网测试为准，不能只依据产品名称判断。
- 缓存配置错误可能导致旧版 `runtime-config.js` 或旧静态资源短时间继续生效，因此运行时配置应禁用长缓存或使用版本化发布。
- 大媒体文件的流量、单文件限制和免费额度需要在创建项目时核对。
- Cloudflare Worker 不等同于腾讯云 API；为确保大陆请求和研究数据留在大陆，正式前端必须固定连接腾讯云 API。海外/实验前端固定连接 Worker。
- 前端托管解决不了 API 和数据库问题；`api.resilience-training.cloud` 仍需独立完成 HTTPS、Fastify 和 PostgreSQL。

### 回退方案

如果 EdgeOne Pages 当前账号无法提供合适的内地访问效果，可直接由 Lighthouse Nginx 托管同一份 `src/`，仍使用 `www.resilience-training.cloud`。这同样不需要重写前端，但静态媒体会与 API 共用服务器带宽，发布和回滚也更依赖服务器操作。

## Lighthouse 本机数据库方案

4 核 CPU、4 GB 内存和 40 GB 系统盘足以承载约 100 名参与者的 Fastify、Nginx 和 PostgreSQL。按预实验 10 人约 16 MB 粗略线性估算，100 人原始数据约 160 MB；即使为索引、事件增长、日志和冗余预留 10 倍空间，也远低于 40 GB。实际瓶颈更可能是日志、系统更新和备份文件没有清理，而不是研究记录本身。

“不用额外搞数据库”应理解为“不购买额外云数据库实例”，不是“不使用数据库”。正式线仍使用 PostgreSQL，只是安装在同一台 Lighthouse：

- PostgreSQL 只监听 `127.0.0.1`，安全组不开放 5432。
- Fastify 使用单独的最小权限数据库账号和真实 `DATABASE_URL`。
- 数据库、应用和系统日志设置空间阈值与轮转，磁盘使用超过 70% 预警。
- 每日执行 PostgreSQL 逻辑备份，保留最近若干份；至少一份备份必须复制到服务器之外，例如私有 COS 存储桶，否则系统盘或实例损坏会同时丢失数据和本机备份。
- 上线前做一次从备份恢复到临时数据库的演练。

暂不引入腾讯云托管 PostgreSQL。只有出现参与者规模显著扩大、需要高可用、无法接受维护 PostgreSQL，或本机资源持续不足时再升级。

## 可实现方案

### 推荐方案：一个代码基线，两套部署适配

继续在 Cloudflare 仓库开发，并把它从“实验 fork”提升为当前主线：

1. 保留 `src/` 作为唯一前端源码。
2. 保留 `cloudflare-worker/` 作为海外/实验后端。
3. 在同一仓库的 `backend/` 中实现与 Worker 对等的 Fastify + PostgreSQL 后端。
4. 抽取 API 类型、请求校验、模块顺序、角色/解锁规则和 AI hook 定义到平台无关共享目录；D1 SQL 与 PostgreSQL SQL 分别维护。
5. 部署时生成不同的 `runtime-config.js`：Cloudflare Pages 指向 Worker，内地静态站指向腾讯云 HTTPS API。
6. 用契约测试对两个后端跑同一组接口用例，允许数据库实现不同，不允许业务结果不同。

优点是不会丢失 Cloudflare 后续功能，也不会形成两套前端。成本是需要把 Worker 中已经实现的业务规则移植到 Fastify/PostgreSQL，并补共享契约测试。

### 不推荐方案：直接在旧仓库继续开发

旧仓库适合保留为腾讯云早期部署证据，但不适合作为新主线。若在旧仓库继续开发，必须先移入 Cloudflare 线的所有平台无关前端改动和接口规则，实际工作量更大，也更容易漏掉未提交修复。

### 不推荐方案：只使用 Cloudflare 服务中国大陆参与者

它可以作为备用和海外入口，但当前没有中国大陆网络稳定性验收。研究编号、姓名和心理训练内容保存在境外平台还会增加个人信息、敏感信息和跨境数据评估工作。正式招募前应由项目/机构的数据保护与伦理负责人确认，不应只凭技术可访问性决定。

## 分阶段实施待办

### M0：固化当前真实基线

- [x] 审阅当前未提交文件并完成代表模块浏览器回归：`C_TEST / sxq` 登录成功且 D1 已连接，`1-1`、`1-5`、`4-4` 均成功进入练习页（2026-11-06）。
- [x] 将 2026-08-31 修复、部署评估和本路线图固化为 Git 基线，并建立可回退标签（2026-11-06）。
- [x] 核对当前 Pages、Worker、D1 在线状态；将本地 `.wrangler/` 加入忽略规则（2026-11-06）。
- [x] 确认尚缺的导出最小版本纳入 M3，与腾讯云后端同步实现，不阻塞本次代码基线。

完成标准：Git、当前本地代码和可部署版本一致。

M0 验证记录（2026-11-06）：Worker TypeScript 检查通过；全部前端 JavaScript 和两个 smoke 脚本语法检查通过；无头 Edge 加载全部前端模块资源，只有未提供 `favicon.ico` 的非阻塞 404；线上测试账号返回 tester 角色与“数据记录已连接”，三个代表模块入口和已有回放正常。未执行 42 模块完整发布验收，该项仍属于 M5。

### M1：EdgeOne Pages 前端试部署与域名接入

- [x] 域名实名认证、ICP备案和备案主体手续已完成。
- [x] 正式前端域名确定为 `www.resilience-training.cloud`，EdgeOne Pages 为首选、Lighthouse Nginx 为回退。
- [x] 腾讯云账号、Lighthouse 和域名管理权限可用。
- [x] 数据库确定为同一台 Lighthouse 上的 PostgreSQL，不购买独立云数据库。
- [x] Cloudflare D1 数据不迁移；D1 与中国大陆 PostgreSQL 分开保存。
- [x] 当前容量基线为约 100 人，预实验约 10 人/16 MB。
- [x] 确认 EdgeOne Pages 作为内地正式前端，使用 `npm run build:mainland` / `dist/mainland` 生成固定 Mainland 产物。
- [x] 腾讯云账号持有人已在 EdgeOne 控制台从 `Vigorouscrap/Resilience_training_programme_cloudflare` 导入 GitHub 仓库并创建项目，使用构建命令 `npm run build:mainland`、输出目录 `dist/mainland`（2026-11-08）。
- [x] 实验周期确认不超过一年；当前 Lighthouse 容量足够，100 人规模不需增加服务器。
- [x] 生产导出凭证保管人不纳入 M1；开发受保护导出接口前再确认授权人。
- [x] 固定生产后端映射：Cloudflare Pages -> Worker；EdgeOne Pages -> 腾讯云 API。普通用户和 URL 参数均不能跨环境切换后端。
- [x] EdgeOne 临时站点已部署；`resilience-training-programme-dpnsm3wzfcei.edgeone.cool` 的 HTTPS 首页、参与者登录界面和课程入口结构可访问（2026-11-08；访问令牌不写入仓库）。
- [x] 浏览器已确认临时站点加载 Mainland `runtime-config.js`，图片加载正常（2026-11-08）。音频/视频位于登录后的课程页面，因内地后端尚未完成而移至 M4/M5 验收，不阻塞本次域名绑定。
- [x] 已用移动/联通/电信网络正常打开 EdgeOne 临时站点首页，三网基础页面访问通过（2026-11-08）。静态媒体播放仍在上一项单独验收。
- [x] `www.resilience-training.cloud` 已关联 EdgeOne 生产环境，CNAME 生效且 HTTPS 证书部署完成；正式域名可正常打开页面（2026-11-09）。

完成标准：已完成。EdgeOne 临时及正式 HTTPS 站点、Mainland runtime、图片、三网首页访问和 `www` 域名均已通过。登录后的音视频与研究 API 流程依赖内地后端，移至 M4/M5 验收。

### M2：统一契约与环境配置

- [x] 固化 API 请求、响应、错误码、角色和时间规则，负责人已全部确认，见 `M2_SHARED_API_CONTRACT.md`。
- [x] 建立共享 hook 清单、模块顺序、输入校验与访问规则包及基础 JSON Schema；两个运行时直接接入共享规则和研究 schema 扩充纳入 M3。
- [x] 增加 Cloudflare/Mainland 独立 runtime 配置；EdgeOne 构建到 `dist/mainland/`，不改写共享源代码。
- [x] 生产环境拒绝 query string/sessionStorage API override，只允许 localhost 本地开发覆盖。
- [x] 建立可配置 base URL 的同一套黑盒测试；Worker health/core/ai/research 线上通过，Fastify health/AI 本地通过，缺失研究接口保留到 M3。
- [x] 负责人已部署新版 Worker，事件计数、跨 session 回放、身份隔离及 AI 新字段/错误码通过线上回归（2026-11-09）。

完成标准：已完成 M2 契约、测试框架与本轮部署验收。每个发布产物自动锁定唯一后端；腾讯云 M3 后端现已通过生产验收，但 Cloudflare 发布和 M4–M5 浏览器回归仍需完成。证据和未覆盖项见 `M2_DEPLOYMENT_VALIDATION.md`。

### M3：腾讯云 Fastify + PostgreSQL 补齐

- [x] 把参与者开始/恢复、模块 start/complete/reset、events、replay 接口移植到 Fastify，本地 HTTP 契约通过。
- [x] 将 D1/SQLite schema 转为 PostgreSQL migrations，并建立事务、唯一约束和幂等规则；迁移 SQL 经 PGlite 和腾讯云正式 PostgreSQL 验证。
- [x] 两端接入共享研究服务并扩充研究 schema，保存前端练习时长和服务器经过时长；修正 Worker 快照大小/重复完成幂等、回放完成检查、事件校验和鉴权错误分类。
- [x] 实现测试数据标记、受保护的 CSV/JSON 导出和导出审计，本地验证隔离、BOM、中文、引号和换行。
- [x] 提供数据库 owner/运行账号分离、每日备份 service/timer、恢复演练和部署/回滚操作说明，见 `M3_IMPLEMENTATION_AND_DEPLOYMENT.md`。
- [x] 核对腾讯云服务路径、systemd 用户、Node 版本和磁盘；安装并检查 PostgreSQL 14.24，创建 `resilience_programme`、owner/app 角色，并验证登录属性、数据库/schema 隔离及默认 DML 权限（2026-11-10）。
- [x] 在腾讯云正式 PostgreSQL 执行 `0001_research.sql`，验证 9 张表 owner、8 张业务表 app DML 权限，并撤销 app 对 `research_migrations` 的全部权限（2026-11-10）。
- [x] 数据库最小权限账号及角色已验收；手动备份、归档检查和独立临时库恢复通过；每日 timer 已排期、保留最新 14 份（2026-11-11）。
- [x] journald 设置 512 MB/30 天上限和 5 GB 保留空间，实际占用降至 360 MB；logrotate timer/dry-run、服务 active、`NRestarts=0` 和根盘 18% 均通过（2026-11-12）。
- [x] 最新 PostgreSQL custom-format 归档已下载至 Windows `E:\ResilienceOffsiteBackups`，37,536 bytes；服务器/本机 SHA-256 完全一致。传输临时副本和一次性 SSH 密钥均已删除（2026-11-12）。
- [x] 腾讯云正式 PostgreSQL migration、真实 DB full 契约、API HTTPS 和 systemd M3 切换完成；公网 health 返回 `fastify-node` 与完整 10 个 hook（2026-11-12）。
- [x] EdgeOne Production 发布 M3 Mainland 产物；线上 5 个关键文件哈希、腾讯云 full contract、CORS/预检和测试数据写入均通过（2026-11-12）。
- [ ] D1 应用 0004 迁移并部署 Worker，运行 Cloudflare full contract，随后重新发布 Cloudflare 前端并验收。
- [x] 确认不迁移 D1 数据；两个环境独立保存、独立导出。

完成标准：腾讯云环境通过与 Worker 相同的契约和数据隔离测试。内地后端 M3 生产部署与线上验收已完成；Cloudflare 线上迁移和双前端发布属于后续独立发布窗口。

### M4：恢复正式 HTTPS 与内地前端

- [x] 为 `api.resilience-training.cloud` 配置有效证书和自动续期；证书有效期至 2027-02-10，renew dry-run 通过。
- [x] 2026-11-12 完成 HTTPS 修复过程：从仅监听 80 和旧 Fastify 公网监听，推进到有效 443 SSL server、HTTP→HTTPS 和 M3 Fastify loopback 监听。
- [x] 将 Nginx 配置为 80 跳转 443，只代理到本机 `127.0.0.1:8787`。
- [x] 将腾讯云 `CORS_ORIGIN` 固定为 `https://www.resilience-training.cloud`。
- [x] M3 Mainland 产物已部署到 EdgeOne Production；`www.resilience-training.cloud` 的运行时配置、4 个关键业务脚本、API health、10 个 hook、CORS 和预检均通过自动验收（2026-11-12）。
- [x] 为内地部署生成指向腾讯云 API 的独立运行时配置，不复制第二份前端源码。
- [x] 抽查 MP3、MP4、MOV：MIME 类型正确，支持 `Accept-Ranges: bytes`，分段请求返回 HTTP 206；真实手机页面播放仍在 M5 人工验收。
- [x] 使用隔离 headless Edge 和测试账号 `C_TEST` 完成真实页面 smoke：登录、数据库连接、1-1 DeepSeek AI、完成状态保存、刷新后只读回放全部通过；观察到对应 API/CORS 请求，无失败请求和控制台错误（2026-11-12）。
- [x] 使用隔离 headless Edge 逐一打开 1-1 至 6-7：42/42 模块的 `module-runs/start` 均返回 200、页面进入 practice、标题和聊天区可见，无失败请求、控制台错误或同源/API 4xx/5xx（2026-11-12）。该项为入口与初始渲染层验收，不等同于 42 个模块完整交互和完成路径验收。
- [ ] 收紧 Worker CORS，移除 `*`。

完成标准：内地前端全程 HTTPS，不依赖 Cloudflare 或 Vercel 资源即可完成训练。

### M5：发布验收与双路线运维

- [ ] 在中国移动、联通、电信和至少一台手机上测试静态媒体实际播放、登录、AI、完成、次日解锁、回放和导出；三网首页与桌面 headless Edge 登录/AI/完成/回放已通过。
- [x] 对 42 个模块完成生产入口与初始渲染回归：42/42 的 start API、practice 页面、模块标题和聊天区均通过。
- [ ] 对 42 个模块继续执行深层交互和完成路径回归，覆盖音频、视频、倒计时、输入、特殊卡片和统一完成状态。
- [ ] 验证断网、超时、重复点击、刷新、跨设备、跨标签页和数据库暂时不可用。
- [ ] 对比两个后端的契约测试结果，并记录允许的基础设施差异。
- [ ] 建立上线、回滚、备份恢复、密钥轮换、故障联系和数据导出操作手册。
- [x] 本轮不新增隐私与数据治理功能，按现有产品规则执行；后续只有收到新要求时再调整。

完成标准：国内正式入口可独立运行，Cloudflare 入口可继续作为海外/实验环境，两个环境不会依赖两套业务源码。

## 立即执行顺序

1. M0 已完成，代码已有 GitHub 基线和回退标签。
2. EdgeOne Pages 临时 HTTPS 站点、Mainland runtime、图片和三网首页访问已通过。
3. M1 已完成：`www.resilience-training.cloud` 的 CNAME、HTTPS、Mainland runtime、图片和三网首页访问均已通过。
4. M2 已完成：契约已全部确认，新 Worker 部署后的现有黑盒 profile 全部通过，完整证据和剩余差异已记录。
5. M3 内地后端生产部署完成：PostgreSQL、备份恢复、HTTPS、loopback Fastify、systemd cutover 和真实 DB full 契约均已通过。
6. 日志轮换、EdgeOne M3 浏览器 smoke、42/42 模块入口回归和首份异地备份已完成；下一步进行真实手机音视频、42 模块深层交互/完成路径和三网业务流程回归。
7. 单独安排 Cloudflare 发布窗口：D1 0004、Worker full contract、Cloudflare Pages 重建；最后合并 `main`。

本方案不建议立刻删除或合并旧仓库。旧仓库用于保存腾讯云早期部署历史；完成 M0 后，以 Cloudflare 仓库作为主线，并在项目说明中明确这一点即可。

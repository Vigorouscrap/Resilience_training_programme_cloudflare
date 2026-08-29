# Cloudflare 实验线实施路线图

## 用途

本文件只服务于当前 Cloudflare 实验仓库：

```text
E:\2025 HKU\Lab\ResilienceProject\Resilience_training_programme_cloudflare_experiment\Resilience_training_programme_cloudflare
```

它用于记录 Cloudflare Pages + Cloudflare Workers 路线的当前阶段、已完成内容、后续用户体系与数据能力设计，以及未来是否可以通过 PR 合回原仓库。

当前执行决定：先以本 Cloudflare 仓库为唯一推进线，完成可供小规模研究使用的初版。原仓库对齐、PR 或整仓合并延后处理，不作为当前初版的阻塞项。

主项目原计划仍然保留：

```text
前端：Vercel / 后续 EdgeOne Pages 或 COS + EdgeOne
后端：腾讯云 Lighthouse + Nginx + systemd
正式 API：api.resilience-training.cloud
```

本路线图不替代主项目正式路线，而是为 Cloudflare 方案提供一条可快速验证、可迁移、可回退的实验线。

---

## 更新记录

- 2026-08-24：根据 Resilience program 收尾.docx 更新初版收尾基线：正式参与者采用“研究编号 + 姓名、无密码、首次直接创建/后续恢复”，不再要求邮箱或预录入名单；解锁改为“完成第 N 天后，次日 00:00 解锁第 N+1 天”；初版必须记录日期、开始/结束时间、总时长和用户输入/选择；补充所有模块预计时长、统一完成提示、行为数据增强项、导出与发布验收清单。当前先完成 Cloudflare 初版，再考虑与原仓库合并。
- 2026-08-26：团队讨论确认取消每个模块的预计时长展示；改为统一的模块完成确认层和训练目录完成标识，让被试明确知道当天模块已完成。复用现有 skipMode、skipCurrentWait 和 fastMode 能力，但仅在后端确认 tester 权限（当前为 C_TEST）后显示测试工具；普通参与者不能通过 URL 参数或前端存储启用。
- 2026-08-28：完成一次仓库结构与执行清单审计。确认 `module_runs`、D1 migration、参与者 start、模块 start/complete Worker 路由、Asia/Shanghai 解锁计算、前端完成弹层/训练目录完成标识和 C_TEST 工具骨架已经存在；但统一完成函数尚未被 42 个模块的结束路径调用，事件接口、AI 调用入库和导出接口仍未接通，因此 9A-3/9A-4 只能标记为“部分实现”，不能视为端到端完成。Worker `npm run check`、43 个前端 JavaScript 文件语法检查和 2 个 smoke 脚本语法检查通过。
- 2026-08-28：推进 9A-3 基本初版：`DialogueManager` 增加统一结束检测，模块流程在没有后续控件、等待或输入时调用完成 API；完成请求等待模块 start 请求，服务端确认后才更新训练目录和显示完成弹层。已用本地 Wrangler D1 验证 1-1 开始/完成、重复完成幂等、普通参与者越级 403、C_TEST 全模块权限和前端静态页面加载。
- 2026-08-28：根据本轮讨论确定初版用户与数据规则：数据保留/删除/匿名化暂不纳入初版，也不在平台向参与者提示；导出由 Worker 上的至少一个受保护凭证即可完成，不开发管理员后台；每个唯一 `moduleId` 对应一个训练日，复用处理器的模块仍分别计日，完成该模块即完成当天且无需额外确认；未完成 run 恢复原 run，已完成模块只读回放完整训练内容和对话，音频可重新播放；总时长以页面右上角计时器为准；数据写入采用异步重试和尽力而为，不得阻塞参与者完成练习；基础版完成后先用登记的测试编号回归，再提交可回退版本。

### 测试编号登记（2026-08-28）

- `C_TEST`：专用 tester 编号，当前由 Worker 配置为可访问全部模块，用于 smoke test 和桌面/移动端回归；不作为正式参与者编号。
- `C_LIMIT`：普通参与者测试编号，用于验证逐日解锁、完成进度和身份隔离；不具有特殊权限。
- 测试请求和测试完成记录应在 `metadata` 中标记为测试数据，导出正式研究数据时可以按标记排除。
- 生产 CORS 目标来源：`https://resilience-training-programme-cloudflare.pages.dev`；当前 `CORS_ORIGIN="*"` 仅作为实验配置，基础版发布前需改为正式域名，本地来源另配。

- 2026-06-22：根据验证需求调整 9A-2：前端改为强制登录浮层，输入研究编号、姓名、邮箱（邮箱可空）；Worker 增加预录入名单校验，默认测试账号为 `C_TEST/sxq`（全模块解锁）和 `C_LIMIT/sxq`（逐日解锁）。
- 2026-06-22：完成阶段 9A-2 前端最小接入：新增首页研究编号输入/保存/恢复，AI hook 请求会携带 `participantCode` 与后端 `sessionId`；前端读取 `access` 字段进行逐日解锁展示，tester/admin 可访问全部模块。
- 2026-06-22：补充阶段 9A 研究数据要求：参与者编号支持 `C0001` 这类字母+数字格式；`Cloudflare D1` 是数据库产品名，不是参与者编号；预留邮箱/手机号绑定、逐日解锁、测试/管理员账号绕过解锁、完整对话 transcript 与 CSV/Excel 导出字段。
- 2026-06-22：推进阶段 9A-2，新增 `POST /api/v1/participants/start` 后端接口和 `smoke:participant` 验证脚本；前端参与者编号输入仍待接入。
- 2026-06-22：完成阶段 9A-1，本地新增 D1 schema 草案、Worker 数据访问层接口与 D1 binding 占位说明；当前尚未要求用户创建 D1 数据库。
- 2026-06-20：建立 Cloudflare 实验线专用路线图，确认当前 Cloudflare 闭环已跑通，并将下一阶段定义为“阶段 9A：用户体系与数据能力最小原型”。

---

## 当前结论

当前先在 Cloudflare 线完成用户体系、进度解锁、研究数据记录和导出，形成可验收的初版。完成初版前不处理与原仓库的代码合并，只继续保持 API 契约和数据模型可迁移。

原因：

- Cloudflare Pages 前端已可公网访问。
- Cloudflare Worker 后端已可公网 HTTPS 访问。
- Worker 已配置 DeepSeek secret。
- 当前 10 个 AI hook 已通过线上 smoke test，且全部返回 `fallbackUsed: false`。
- 前端已确认能通过 Worker 获得个性化回复。
- 浏览器不再受腾讯云 HTTP 后端 Mixed Content 问题影响。

但需要注意：

- Cloudflare Worker 不是传统 Node.js 长驻服务，不能和 `backend/` 的 Fastify 实现完全共用运行方式。
- Cloudflare 数据能力更适合先用 D1 / KV / R2 等绑定。
- 腾讯云正式后端未来更适合 Fastify + PostgreSQL。
- 因此后端实现会不同，但前端调用的 API 契约应尽量保持一致。

---

## 当前架构

```mermaid
flowchart LR
    U["用户浏览器"] --> F["Cloudflare Pages<br/>src/ 静态前端"]
    F -->|"HTTPS API"| W["Cloudflare Worker<br/>cloudflare-worker/"]
    W -->|"Server-side Secret"| DS["DeepSeek API"]
    W -. "阶段 9A" .-> D1["Cloudflare D1<br/>用户/练习/导出数据"]
```

未来与正式线的对应关系：

```mermaid
flowchart LR
    F["同一套前端 src/"] --> API["统一 API 契约"]
    API --> CW["Cloudflare Worker<br/>实验线"]
    CW --> D1["Cloudflare D1 / KV / R2"]
    API --> VM["腾讯云 Lighthouse<br/>Fastify 后端"]
    VM --> PG["PostgreSQL<br/>正式数据方案"]
```

核心原则：

- 前端尽量只依赖统一 API，不依赖某个云平台。
- Cloudflare Worker 和腾讯云 Fastify 后端可以分别实现同一套 API。
- 用户体系与数据能力先在 Cloudflare 做成可用初版，再决定是否合回主项目。
- 初版收尾期间，Cloudflare 仓库是需求、代码和进度状态的唯一基线。

---

## 已完成

### Cloudflare 前端

- [x] 使用 Cloudflare Pages 部署 `src/` 静态前端。
- [x] Cloudflare Pages 地址已可访问。
- [x] `src/runtime-config.js` 已默认指向当前 Worker 地址。
- [x] 已确认无 URL 参数时，前端也可以通过 Worker 获得个性化回复。
- [x] 仍保留 `?apiBaseUrl=...` 临时切换后端的能力。
- [x] 首页已新增研究编号输入与本地保存/恢复。
- [x] AI hook 请求已携带参与者编号与后端 session 信息。
- [x] 前端已读取后端 `access` 字段，为逐日解锁与 tester/admin 全模块访问做准备。

当前前端地址：

```text
https://resilience-training-programme-cloudflare.pages.dev/
```

### Cloudflare Worker 后端

- [x] 新增 `cloudflare-worker/`，不直接改造原 `backend/`。
- [x] 暴露 `GET /health`。
- [x] 暴露 `POST /api/v1/ai/hooks/:hookId`。
- [x] 支持 DeepSeek API 调用。
- [x] 支持 CORS。
- [x] 支持 fallback，避免模型调用失败时前端流程卡住。
- [x] 已迁移当前全部 10 个 AI hook。
- [x] 已新增 `npm run smoke:hooks` 一键线上验证脚本。
- [x] 线上 smoke test 已通过，全部 hook 返回 `fallbackUsed: false`。

当前 Worker 地址：

```text
https://resilience-ai-worker.1362758164.workers.dev
```

当前已迁移 hook：

- `module-1-1.intro-reply`
- `module-1-3.body-sensation-reflection`
- `module-1-3.thought-reflection`
- `module-2-2.case-emotion-feedback`
- `module-3-2.positive-rumination-feedback`
- `module-4-2.thought-train-reflection`
- `module-4-2.boarding-impulse-reflection`
- `module-4-4.label-feedback`
- `module-4-6.supporter-response-feedback`
- `module-6-2.value-desire-insight`

---

## 当前阶段

当前处于：

```text
阶段 9A 收尾：Cloudflare 初版用户体系、进度解锁、研究数据与导出
```

阶段 7/8 的 Cloudflare 版本已足够支撑阶段 9A：

- [x] 公网前端可访问。
- [x] 公网后端可访问。
- [x] 前后端 HTTPS 联通。
- [x] DeepSeek 真实调用通过。
- [x] 当前 AI hook 线上验证通过。

因此可以开始做用户与数据能力，但先不要做重型账号系统。

---

## 阶段 9A 目标

阶段 9A 的目标不是一次性做完整 SaaS 用户系统，而是先支撑小规模研究使用：

- 能区分不同参与者。
- 能记录参与者每次练习的关键输入、模块、时间。
- 能记录 AI 调用结果与是否 fallback。
- 能按参与者导出数据。
- 不破坏现有固定课程流程。
- 不让前端接触任何密钥。
- 后续可以迁移到腾讯云后端 + PostgreSQL。

推荐身份方案：

```text
邀请码 / 参与者编号 > 账号密码注册
```

理由：

- 更适合小规模研究。
- 不需要邮箱、短信、找回密码。
- 降低隐私和运维复杂度。
- 足够实现多用户隔离和数据导出。

当前编号与解锁规则：

- Cloudflare D1 是数据库产品名，不是参与者编号。
- 正式参与者输入研究编号和姓名，无需密码、邮箱或预录入名单。
- 第一次输入某组编号和姓名时创建参与者，后续相同组合恢复历史进度。
- Worker 统一规范研究编号格式；姓名保留原始显示值，并使用规范化值进行身份匹配。
- 新参与者只解锁第 1 个训练日。完成第 N 个训练日后，第 N+1 个训练日在 Asia/Shanghai 时区的次日 00:00 解锁；解锁依据是连续的模块完成记录，不依据注册时间，也不假设参与者一定完成全部 42 个训练日。
- tester/admin 由 Worker 环境变量配置，仅用于内部全模块测试；前端不能自行决定权限。
- 每个唯一 `moduleId` 都是一个训练日；即使多个训练日复用同一处理器（例如 `1-4` 与 `1-6`），也必须分别记录、分别完成，不能合并成一个 run。
- `unlock_start_at` 仅保留为参与者创建/审计字段，不再作为解锁依据；解锁以服务端 `module_runs` 的连续完成状态为准。
---

## 阶段 9A 数据设计草案

优先记录“研究需要的数据”，避免过度复杂。

### `participants`

参与者表。

建议字段：

- `id`
- `participant_code`
- `display_label`
- `account_email`
- `account_phone`
- `role`
- `unlock_start_at`
- `status`
- `created_at`
- `last_seen_at`
- `metadata_json`

### `sessions`

一次浏览器/训练会话。

建议字段：

- `id`
- `participant_id`
- `client_session_id`
- `started_at`
- `last_seen_at`
- `ended_at`
- `duration_seconds`
- `user_agent`
- `metadata_json`

### `module_runs`

一个参与者对一个唯一 `moduleId` 的训练日完成记录。

建议字段：

- `id`
- `participant_id`
- `session_id`
- `module_id`
- `day_index`
- `status`（`started` / `completed`）
- `started_at`
- `completed_at`
- `duration_seconds`（以页面右上角计时器最终读数为准）
- `metadata_json`

同一参与者同一 `moduleId` 初版只保留一个 run：未完成时恢复，完成后只读回放，不生成第二个 run。

### `module_events`

用户在课程中的关键操作与输入。

建议字段：

- `id`
- `participant_id`
- `session_id`
- `module_id`
- `event_type`
- `step`
- `user_input`
- `choice_value`
- `context_json`
- `created_at`

### `conversation_messages`

完整对话 transcript 表。初版需要保存已完成模块的可回放内容，用于参与者再次打开时只读恢复“固定训练文案、用户输入/选择和 AI 个性化回复”的顺序。

建议字段：

- `id`
- `participant_id`
- `session_id`
- `module_id`
- `hook_id`
- `message_role`
- `message_text`
- `source`
- `step`
- `sequence_index`
- `duration_ms`
- `metadata_json`
- `created_at`

回放规则：已完成模块再次打开时不生成新 run、不允许修改或再次提交完成；页面按原顺序恢复消息，现有音频资源可以重新播放，计时器不重新计入研究时长。

### `ai_call_events`

AI hook 调用记录。

建议字段：

- `id`
- `participant_id`
- `session_id`
- `module_id`
- `hook_id`
- `variant`
- `user_input`
- `reply_text`
- `fallback_used`
- `prompt_version`
- `provider`
- `model`
- `metadata_json`
- `created_at`

### `exports`

导出任务记录。

建议字段：

- `id`
- `requested_by`
- `format`
- `filters_json`
- `created_at`

---

## 阶段 9A API 契约草案

这些 API 应尽量同时适配 Cloudflare Worker 和未来腾讯云 Fastify 后端。

### 参与者开始或恢复

```text
POST /api/v1/participants/start
```

请求：

```json
{
  "participantCode": "C0001",
  "clientSessionId": "browser-generated-session-id",
  "participantName": "参与者姓名",
}
```

返回：

```json
{
  "participantId": "uuid-or-d1-id",
  "participantCode": "C0001",
  "participantName": "参与者姓名",
  "sessionId": "session-id",
  "role": "participant",
  "lastCompletedDayIndex": 0,
  "nextUnlockAt": null,
  "access": {
    "canAccessAllModules": false,
    "unlockedDayIndex": 1
  }
}
```

### 记录普通模块事件

```text
POST /api/v1/events
```

请求：

```json
{
  "participantCode": "P001",
  "sessionId": "session-id",
  "moduleId": "1-1",
  "eventType": "user_input",
  "step": 1,
  "userInput": "用户输入内容",
  "context": {}
}
```

### 模块开始、完成与回放

```text
POST /api/v1/module-runs/start
POST /api/v1/module-runs/complete
GET /api/v1/module-runs/:moduleId/replay
```

- `start` 在首次进入时创建 run；刷新、返回、换设备或跨标签页再次进入未完成模块时恢复同一个 run。
- `complete` 接收并记录页面计时器的最终秒数（例如 `clientDurationSeconds`），同时保留服务端开始/结束时间作审计；同一参与者同一 `moduleId` 重复提交必须幂等。
- 已完成模块使用只读 `replay` 返回该 run 的完整 transcript（固定文案、用户输入/选择、AI 回复）和必要的音频资源信息；前端不展示可编辑输入、不创建新 run、不再次推进解锁，但允许重新播放音频。
- 每个唯一 `moduleId` 对应一个训练日；复用同一处理器的不同 `moduleId` 仍分别拥有自己的 run 和完成状态。

### AI hook 保持现有接口

```text
POST /api/v1/ai/hooks/:hookId
```

现有接口继续保留，只扩展可选字段：

```json
{
  "participantCode": "P001",
  "sessionId": "session-id",
  "moduleId": "1-1",
  "step": 1,
  "userInput": "用户输入内容",
  "context": {}
}
```

Worker 在返回 AI 回复的同时，尽力写入 `ai_call_events`；写入失败进入异步重试队列，不阻塞 AI 回复或课程流程。

### 导出数据

初版优先提供受 Worker Secret 保护的 CSV 导出；至少配置一名研究团队成员持有该凭证即可，不开发管理员网页或完整管理员账号系统。JSON 可保留为调试和后续数据处理格式。

```text
GET /api/v1/export?participantCode=P001&format=csv
```

请求必须携带 Worker Secret（例如 `Authorization: Bearer <ADMIN_EXPORT_TOKEN>`）。导出接口运行在 Cloudflare Worker 上，由 Worker 读取 D1；研究团队可以通过命令行或内部工具调用，不要求参与者网页提供入口。

后续再扩展：

- Excel 原生工作簿输出
- 更复杂的导出任务队列和管理界面
- 更多研究团队成员的凭证轮换与审计策略

导出字段优先级：

- 参与者编号与内部 `participant_id`。
- 参与者姓名；邮箱/手机号字段仅作为未来兼容预留，不纳入初版登录和导出必填项。
- session ID、开始时间、结束时间、时长。
- 模块编号、步骤、事件类型。
- 完整对话文字，包括固定脚本文案、用户输入、AI 回复。
- AI hook 信息，包括 `hook_id`、provider、model、fallback 状态、时间戳。
- 后续 CSV/Excel 可以从同一套 JSON 数据整理生成。

---

## Cloudflare 实现建议

阶段 9A 推荐使用：

```text
Cloudflare Worker + D1
```

原因：

- D1 与 Worker 集成简单。
- 适合小规模结构化数据。
- 部署和验证速度快。
- 对当前实验线成本低。

暂不建议一开始就使用：

- 完整账号密码注册
- 复杂管理员后台
- 多角色权限系统
- R2 存储大量文件
- 队列化导出任务

除非后续研究规模明确扩大。

---

## 与腾讯云正式路线的差异

| 项目 | Cloudflare 实验线 | 腾讯云正式线 |
|---|---|---|
| 前端 | Cloudflare Pages | EdgeOne Pages / COS + EdgeOne / Vercel |
| 后端 | Cloudflare Worker | Fastify + Node.js + systemd |
| 数据库 | D1 或外部数据库 | PostgreSQL 优先 |
| 密钥 | Cloudflare Secrets | `.env` / 服务器环境变量 |
| 运行模型 | Serverless request runtime | 长驻 Node 进程 |
| 适合阶段 | 快速验证、小规模实验 | 正式可控部署、长期运维 |

代码差异：

- 前端大部分可以复用。
- API client 可以复用。
- 课程模块逻辑应尽量复用。
- 后端业务逻辑可以共享设计，但 Worker 与 Fastify 的路由、数据库连接、环境变量读取方式会不同。
- 数据 schema 应保持概念一致，但 D1/SQLite 与 PostgreSQL 的迁移语法可能不同。

---

## PR 合回原仓库策略

可以从本 Cloudflare fork 向原仓库发 PR，但要拆分边界。

适合合回的内容：

- `src/` 中平台无关的前端改动。
- 统一 API client。
- 用户体系前端交互。
- 参与者编号/匿名 session 的前端状态管理。
- 平台无关的数据采集点。
- 文档中关于 API 契约和数据模型的设计。
- `cloudflare-worker/` 作为可选实验后端目录。

需要谨慎合回的内容：

- 写死当前 Worker 地址的 `src/runtime-config.js`。
- Cloudflare 专属 D1 binding 配置。
- 只适用于本账号的 `wrangler.toml` 名称、路由、项目名。
- 与主项目正式腾讯云路线冲突的部署说明。

合回建议：

1. 先在 Cloudflare fork 中完成最小原型。
2. 把平台无关前端改动整理成单独 PR。
3. 把 `cloudflare-worker/` 作为可选实验后端单独 PR。
4. 把 `runtime-config.js` 改回可由环境注入，避免原仓库默认指向个人 Worker。
5. 主项目如要使用腾讯云后端，再按同一 API 契约在 `backend/` 中实现 PostgreSQL 版本。

---

## 当前允许改动范围

阶段 9A 允许：

- 新增 Cloudflare D1 schema / migrations。
- 新增 Worker 数据访问层。
- 新增参与者编号启动接口。
- 扩展现有 AI hook 请求体的可选字段。
- 新增事件记录接口。
- 新增最小导出接口。
- 新增已完成模块只读回放接口和 transcript 恢复。
- 在前端新增轻量参与者编号输入/保存逻辑。
- 在前端关键节点记录模块事件。
- 更新 README 与本路线图。

阶段 9A 暂不主动改动：

- 原有课程文案。
- 现有 UI 视觉风格。
- 现有模块分布。
- 现有 AI hook 的基本返回结构。
- 原 `backend/` 的腾讯云正式路线，除非明确要做双实现。

---

## 测试与验收

每次改动后至少验证：

```bash
cd cloudflare-worker
npm run check
```

Worker 线上验证：

```powershell
npm.cmd run smoke:hooks -- https://resilience-ai-worker.1362758164.workers.dev
```

阶段 9A 增加后，还应验证：

- 输入参与者编号后能创建/恢复参与者，刷新页面后编号仍显示。
- 普通编号默认只解锁第 1 个训练日，后续模块显示“完成前一个训练模块后开放”或等价提示。
- tester/admin 编号在 Worker 环境变量配置并部署后，可以访问全部模块。
- 不同参与者编号的数据不会混在一起。
- AI hook 调用后能写入 AI 调用记录。
- 普通模块事件能写入事件表。
- 导出接口能按参与者返回数据。
- 未配置数据库或写入失败时，课程流程不能卡死；失败记录异步重试，无法恢复也不阻塞练习。

---

## 2026-08-24 初版收尾需求基线

本节是当前初版的权威需求基线。后文保留的邮箱、预录入名单、按注册时间自动逐日解锁等描述属于历史方案；后续实现和验收以本节及“当前执行清单”为准。

### 正式参与者身份

- 登录只保留“研究编号 + 姓名”，不设置密码，不要求邮箱，不需要个人主页。
- 第一次使用某组研究编号和姓名时直接创建参与者；后续输入相同组合时恢复同一参与者和历史进度。
- 初版按标准化后的 participantCode + participantName 识别参与者。输入不同组合时视为另一参与者，因此不会看到原进度。
- tester/admin 继续作为内部测试能力保留，但不能由前端自行声明，也不出现在正式参与者说明中。

### 登录后的温馨提示

登录成功后展示一次说明页；如果独立说明页实现成本过高，可以放在登录界面下方并要求参与者确认后进入：

1. 每次练习请选择一段不会被打扰的时间，并在安静、放松的私人空间内进行。
2. 部分训练模块会播放音频，请提前调整设备音量，并确认当前环境能够清晰听到声音。
3. 平台会记录每次练习的总用时，以及训练过程中的部分操作数据，用于研究分析。

初版只说明实际会记录的练习时间、选择和输入内容，不在平台向参与者提示数据保存期限、删除或匿名化安排；这些数据治理事项暂不作为初版功能或发布阻塞。

### 模块解锁规则

- 新参与者默认只解锁第 1 个训练日对应的模块。
- 每个唯一 `moduleId` 等同于一个训练日；复用处理器或脚本的模块仍分别计为不同训练日（例如 `1-4` 与 `1-6`）。
- 完成该训练日的唯一模块即视为“当天训练已完成”，不需要额外确认动作。
- 完成第 N 个训练日后，不立即开放第 N+1 个训练日；第 N+1 个训练日在完成后的下一个自然日 00:00 解锁，时区固定为 `Asia/Shanghai`。
- 如果第 N 个训练日未完成，第 N+1 个训练日不能仅因时间经过而自动解锁；参与者实际完成到哪一天，以服务端连续完成记录为准，不假设一定完成 42 天。
- 重复提交完成事件必须幂等，不能重复推进进度或生成多条完成记录。

### 初版必须保存的数据

- 参与者研究编号和姓名。
- 当天日期、模块编号。
- 模块开始时间、结束时间和总用时。
- 用户点击选择的内容和主动输入的内容。
- AI hook 回复、fallback 状态、provider/model 和时间戳。
- 已完成模块可回放所需的完整训练 transcript：固定文案、用户输入、按钮选择和 AI 个性化回复的顺序。

已完成模块重新打开时只读显示上述内容；不允许修改或再次提交完成，但音频等现有资源可以重新播放。

### 可选行为数据

核心流程稳定后再接入，不作为首轮 D1 上线的阻塞项：

- 短时间内快速连续点击“继续”。
- 超过 5 分钟无操作。
- 页面进入后台、窗口最小化或切换标签页。

行为数据只记录事件类型、发生时间、模块和必要时长，不记录与研究无关的浏览器内容。

### 课程体验收尾

- 不在模块开头、题目区域或其他常规位置展示“本模块完成预计需要 XX 分钟”；模块实际开始时间、结束时间和总用时仍按研究数据要求记录。
- 每个模块结束时调用统一完成逻辑；完成确认层显示“第 N 天练习已完成”或等价清晰文案。完成保存采用尽力而为，不得因 D1 暂时不可用阻塞参与者继续或结束练习。
- 完成确认层至少包含：完成状态、模块名称、保存状态（已保存/待重试/未保存）和返回训练目录的主操作；实际用时以页面右上角计时器为准。
- 同时在训练目录中保留稳定的完成标识，例如“已完成”和完成日期；不能只依赖几秒后消失的 toast。
- 完成确认层应使用原生 dialog 或等价可访问对话框，正确处理焦点、键盘关闭、移动端布局、重复点击和网络失败状态。
- 1-5 必须补上明确结束路径，并纳入统一完成事件和完成确认层。
- 每个训练日只有一个唯一模块，因此该模块完成即标记当天完成；不增加额外“当天训练已完成”确认动作。下一训练日仍按完成后的次日 00:00 解锁，不在完成瞬间开放。
- 测试加速控件属于 C_TEST 专属测试工具，不出现在普通参与者界面，也不改变正式参与者的数据规则。
### 导出与管理边界

- 初版至少提供 CSV 导出，可直接由 Excel 打开；JSON 可保留为调试或内部接口格式。
- 导出支持按参与者、日期范围和模块筛选。
- 导出接口运行在 Cloudflare Worker 上，由至少一个研究团队授权人员持有的 Worker Secret 保护；不开发管理员网页或完整管理员账号系统。
- 初版不开发个人主页、复杂管理后台、密码找回、短信或邮箱验证。

---

## 当前执行清单（2026-08-28）

### 9A-0：固化当前工作区成果

- [x] Cloudflare Pages 前端和 Worker 已部署并通过 HTTPS 联通。
- [x] 当前 10 个 AI hook 已迁移到 Worker，并保留 fallback。
- [x] 已有强制登录浮层、参与者本地 session、AI 请求身份字段和模块锁定态原型。
- [x] 已有 D1 migration 草案、D1/no-op repository 骨架和参与者 start API 原型。
- [x] 已通过 c59559f（9A-1）和 6efd3cd（9A-2）固化可回退基线；后续 9A-3/9A-4 变更单独提交。
- [x] 提交前再次运行 Worker 类型检查和前端语法检查，记录当前可用状态。

完成标准：当前成果不再只存在于本地脏工作区，后续每个阶段可以独立回退和核对。

### 9A-1：按最终需求调整登录与参与者身份

- [x] 前端登录表单移除邮箱，仅保留研究编号和姓名。
- [x] Worker 移除正式参与者的 PARTICIPANT_ALLOWLIST 强制校验。
- [x] 首次使用 participantCode + participantName 时创建参与者，再次输入相同组合时恢复原参与者。
- [x] 调整 D1 唯一约束和查询逻辑，使身份组合与产品规则一致。
- [x] 保留 tester/admin 环境变量配置，仅用于内部全模块测试。
- [x] 登录后展示温馨提示，并要求用户确认后进入课程。
- [x] 刷新页面能够恢复登录；“更换信息”只清理本地会话，不删除服务端历史。
- [x] 更新 smoke:participant，覆盖首次创建、再次恢复、不同姓名隔离和测试权限。

完成标准：不需要密码、邮箱或预录名单；同一身份稳定恢复，不同身份看不到彼此进度。

免预录入身份的已接受风险：输错信息会新建另一条身份；知道他人编号和姓名的人理论上可以冒用；后续需要管理员数据合并/纠错能力。当前以“历史进度未出现即可发现输错”作为用户侧提示，不在 9A-2 恢复正式名单校验。

验证记录（2026-08-24）：Worker npm run check、前端和 smoke JavaScript 语法检查、git diff --check 均通过；旧邮箱与 allowlist 代码扫描无残留。真实 D1 持久化已在 9A-2 完成；浏览器端视觉回归留在 9A-7。

### 9A-2：建立真实 D1 环境

- [x] 在 Cloudflare 创建正式实验用 D1 数据库。
- [x] 在 wrangler.toml 配置真实 D1 binding；当前先完成线上实验环境，预览/本地环境隔离待补。
- [x] 根据最终身份和进度模型更新 migration，不直接在已部署数据库上手改表。
- [x] 应用 migration，并验证重复执行不会破坏已有数据。
- [x] 部署 Worker 后确认参与者接口返回 persisted: true。
- [x] 已验证同编号不同姓名生成不同 participant；跨参与者 events/progress 的完整并行隔离待 9A-5/9A-7。
- [ ] D1 不可用或写入失败时不阻塞课程；参与者会话、模块完成和事件写入采用尽力而为，允许返回 `persisted: false` 并由前端异步重试，无法恢复时也不影响用户完成练习。
- [x] 初版暂不处理数据保留期限、删除/匿名化提示；D1 数据默认持续保留，备份采用 Cloudflare D1 Time Travel + Wrangler SQL 导出，具体研究治理留待后续专题。

当前验证记录（2026-08-24）：远程 D1 resilience_research 已创建并应用 migration；Worker 返回 persisted: true；同编号+姓名恢复同一 participant；同编号+不同姓名隔离；Pages 已部署 9A-1 前端。线上刷新/换设备恢复将在浏览器验收中补测。

完成标准：参与者和 session 在刷新、换设备重新登录后仍能从 D1 恢复。

### 9A-3：模块生命周期、完成状态与次日解锁

- [x] 新增 `module_runs` 结构，记录模块状态、开始时间、完成时间和总用时（migration：`cloudflare-worker/migrations/0002_module_runs.sql`）。
- [x] 定义统一的模块开始、恢复和完成 API：`POST /api/v1/module-runs/start`、`POST /api/v1/module-runs/complete`。
- [x] 用户进入模块时前端已调用 start API；Worker 能恢复已有 module run 并返回当前完成状态（前端目前不等待 start 结果后再展示模块，刷新/恢复仍需线上验收）。
- [x] 所有模块结束时由 `DialogueManager.scheduleCompletionCheck()` 调用统一完成逻辑；仅在服务端完成请求成功后更新前端完成状态并显示完成弹层。
- [x] 1-5 已纳入统一结束检测，结束时调用同一完成路径；重复点击由完成状态幂等保护（含音频/倒计时的浏览器回归仍待补）。
- [x] Worker 已实现完成第 N 天后计算第 N+1 天的 `nextUnlockAt`，固定按 `Asia/Shanghai` 次日 00:00（边界时间尚未加入 smoke 验收）。
- [x] Worker 已按连续完成记录禁止越级，并通过唯一约束与条件更新保持重复完成幂等（重复请求尚未加入 smoke 验收）。
- [x] 每个训练日只有一个唯一模块；该模块完成即代表当天完成，不增加额外确认动作。
- [x] 前端已有锁定态和逐日访问控制；文案统一为“完成前一个训练模块后，下一训练日按规则开放”，不要求展示固定的“第 N 天解锁”措辞。
- [x] Worker 根据环境变量判定 tester/admin，前端仅在响应角色为 tester/admin 时显示测试工具；尚未完成篡改请求、刷新和跨设备的端到端验收。

完成标准：验证模块完成前、完成后当日、次日 00:00 前后、刷新恢复、只读回放和重复提交六类边界；持久化完成状态以 D1 服务端数据为准，但任何写入失败都不能阻塞练习流程。
### 9A-4：统一收尾体验与 C_TEST 测试加速

- [x] 根据团队讨论取消“每个模块展示预计完成时长”的产品要求；不再建立 42 个模块的预计时长展示清单。
- [x] 已建立并接通统一完成确认弹层（等价 dialog），显示模块编号、保存状态和返回训练目录操作；完成 API 失败时显示保存失败状态。
- [x] 训练目录已显示稳定的“已完成”标识；进行中、未开始三种状态仍以现有卡片/锁定态表示，独立的保存失败标识待增强。
- [ ] 完成确认组件在移动端不遮挡正文，关闭后焦点回到合理位置；支持键盘、屏幕阅读器、重复打开，并展示异步保存状态，不因网络失败阻塞返回训练目录。
- [x] 已复用 `ui.js` 中的 `shouldSkipWaits`、`skipCurrentWait`、`skipMode` 和现有等待跳过按钮机制。
- [x] 登录响应确认 `role` 为 tester/admin 后才显示 C_TEST 测试工具区域；普通参与者不会渲染该区域。
- [x] C_TEST 登录后默认启用模块内跳过控件：复用 `ui.js` 现有等待管理器，在计时器/倒计时旁显示“跳过等待”或“跳过倒计时”按钮；等待不会自动跳过，普通参与者不可见。首页仅保留独立 fastMode 开关。
- [x] fastMode 只能在 tester/admin 会话下由控件或测试 API 开启，URL 参数和本地存储不会直接授予权限。
- [ ] 启用测试加速时写入测试模式状态或 metadata，且 `C_TEST` 的所有记录可与正式研究数据区分。
- [x] 测试工具不能绕过服务端完成事件、身份隔离和数据写入规则；完成逻辑仍统一经过 Worker API（测试数据标记与浏览器回归待补）。
- [ ] 验证 C_TEST 可快速完成至少 1-1、1-5 和含音频/倒计时的代表模块；普通参与者看不到控件且仍遵循真实等待（本轮完成静态/构建检查，浏览器回归待补）。

本轮产品反馈修订（2026-08-29）：确认旧版 `?skip=1` / `?fast=1` 入口和 `ui.js` 等待控制器可复用；C_TEST 采用模块内跳过按钮，避免在首页暴露跳过开关。训练目录的完成状态改为右侧灰色勾选标记；首页标题副标题恢复为“点击每周对应方块，开启今日练习”，保留原有虚线分隔；普通账号的锁定提示改为中性文案，不再显示“普通参与者/测试编号”等内部角色信息。首页会话状态区域的容器为 `#participantSessionChip`，文案节点为 `#participantSessionStatus`，集中由 `src/js/main.js` 的 `formatParticipantStatus()` 和各事件处理器维护。

完成标准：被试在每个模块结束后能明确看到完成反馈，并在训练目录看到状态；已完成模块可只读回放完整内容；C_TEST 能安全缩短等待完成回归，普通参与者和研究数据规则不受影响。
### 9A-5：研究数据采集

- [x] 新增并接通 POST /api/v1/events 批量事件接口；普通事件采用前端缓冲、尽力提交，不阻塞练习。
- [x] `module_runs` 已记录模块开始、结束和总用时，统一完成调用已接通；时长口径统一为页面右上角计时器，事件明细仍待 9A-5。
- [x] 在统一 UI 层记录固定引导、用户按钮选择和文本输入，保留 moduleId、step、顺序号和时间戳。
- [x] AI hook 成功或 fallback 后尽力写入 ai_call_events；写入失败只记录 Worker 警告，不阻塞课程。
- [x] 事件采集不依赖单个模块脚本，已覆盖现有 42 个模块的通用消息/输入/按钮路径；代表模块端到端浏览器回归仍待 9A-7。
- [x] 新增 POST /api/v1/conversation/replay；完成时保存聊天区受控 HTML 快照，已完成模块重新打开时优先恢复原有头像、气泡、卡片和排版；旧数据无快照时降级为结构化消息回放。音频事件保存资源路径并在回放页恢复可播放控件。
- [ ] 核心数据稳定后再接入快速连续点击、空闲超过 5 分钟和 visibilitychange 行为事件。
- [ ] 设计前端事件缓冲、异步重试和去重；普通事件丢失不阻塞模块，完成状态保存失败也优先保证练习流程可继续。
- [ ] 不修改平台提示，不加入数据保留期限、删除或匿名化说明。

完成标准：从页面操作到 D1 查询可以还原参与者当天完成了什么、用了多久、输入或选择了什么。

9A-5 实现说明（2026-08-29）：D1 已有 `conversation_messages`、`module_events`、`ai_call_events` 表，本轮补齐事件批量写入、AI 调用记录和回放查询，并新增 `conversation_snapshots` 保存完成瞬间的聊天区 HTML。回放接口要求 participantCode、sessionId 与已完成 moduleId 匹配，避免跨参与者或未完成模块读取；前端优先恢复受控快照，旧数据才使用只读气泡降级回放。用户输入统一使用文本节点，避免把输入内容当 HTML 导致乱码或注入。

### 9A-6：受保护的数据导出

- [ ] 新增至少一个 Worker Secret 导出凭证，供研究团队授权人员使用；不开发管理员后台或参与者侧导出入口。
- [ ] 新增 CSV 导出，确保中文、换行和 Excel 打开时编码正确。
- [ ] 保留 JSON 导出用于调试或后续数据处理。
- [ ] 支持按参与者、日期范围和模块筛选。
- [ ] 导出字段至少包含编号、姓名、日期、模块、开始/结束时间、总时长、输入、选择和 AI 调用状态。
- [ ] 对导出操作记录请求凭证标识、筛选条件和时间（不记录 Secret 原文）。
- [ ] 使用多参与者测试数据核对隔离、排序、时区和缺失值。

完成标准：至少一名研究团队授权人员可以获得可直接分析的 CSV，普通参与者无法访问导出接口。

### 9A-7：初版发布验收

- [x] Worker `npm run check` 通过（2026-08-28）。
- [ ] 更新 smoke 脚本，覆盖参与者创建/恢复、D1 持久化、完成事件、次日解锁、重复完成幂等、已完成模块只读回放、`C_TEST` 测试权限和导出鉴权；允许使用登记的测试编号产生并标记测试数据。
- [ ] 在桌面和手机完成 42 个模块基础回归，重点检查音频、计时器、输入、锁定、完成标识和结束状态；使用 C_TEST 加速回归。
- [ ] 验证刷新、断网重试、重复点击、跨标签页和长时间停留不会阻断练习；写入失败进入异步重试，无法恢复时不误报为已保存。
- [ ] 验证 AI 服务失败时仍能 fallback，同时保存正确的 fallback 状态。
- [ ] 收紧生产 CORS，仅允许正式 Pages 域名；本地开发来源单独配置。
- [ ] 更新 README、部署说明和本路线图中的实际地址、验证日期与已知限制。
- [ ] 完成 Cloudflare Pages + Worker + D1 线上全流程验收并标记初版版本。
- [ ] 初版后再记录中国大陆网络实测结果；测试设备、网络和判定标准另立部署验收记录，不阻塞基础版本提交。

完成标准：研究团队可以用真实编号完成登录、逐日训练、数据保存和受保护导出，且所有关键路径有验证记录。

### 初版完成后再处理

- [ ] 再讨论研究数据的保留期限、删除/匿名化和 D1 备份责任；这些事项初版不在平台提示。
- [ ] 根据基础版测试结果记录中国大陆网络实测（设备、网络、浏览器和判定标准）。
- [ ] 视研究规模决定是否增加多管理员凭证、凭证轮换、导出审计和管理员网页。
- [ ] 评估与原仓库的合并策略和提交边界。
- [ ] 参数化 src/runtime-config.js，避免主线写死个人 Worker 地址。
- [ ] 抽取共享 API 契约和 AI hook 定义，降低 Fastify/Worker 双实现漂移。
- [ ] 决定腾讯云/PostgreSQL 正式路线是否继续，以及如何迁移 D1 数据。

## 已统一确认的初版规则（2026-08-28）

以下事项已根据本轮讨论确定，后续实现和验收以此为准：

1. **数据治理暂缓**：初版不处理保存期限、删除或匿名化，也不在平台向参与者提示这些内容。只要 D1 数据库和 Cloudflare 账户仍存在，数据默认持续保存；技术备份使用 D1 Time Travel 和 Wrangler SQL 导出，研究治理以后另行决定。备份命令示例：`npx wrangler d1 export resilience_research --remote --output backup.sql`。
2. **导出权限最小化**：导出接口部署在 Worker，由至少一个研究团队授权人员持有的 Worker Secret 保护。不开发管理员网页；“管理员”仅指持有该导出凭证的授权人员。
3. **训练日定义**：每个唯一 `moduleId` 等同于一个训练日。复用处理器的模块仍分别计日；完成该模块即完成当天，不需额外确认；总结构按 42 个训练日设计，但实际进度以连续完成记录为准。
4. **中断与恢复**：未完成模块恢复原 run；已完成模块重新打开时只读回放完整训练内容，不生成新 run、不允许修改或再次完成；用户输入、按钮选择、AI 回复和固定文案按顺序恢复，音频可重新播放。
5. **时长口径**：以模块页面右上角计时器为准；不扣除后台、切换标签页或空闲时间。测试加速只服务于测试，不改变规则。
6. **初版采集范围**：必须采集参与者身份、模块/日期、开始/结束、计时器时长、用户输入/选择、AI 回复和 fallback 状态；完整 transcript 为回放需要也纳入。快速点击、5 分钟空闲、visibilitychange 暂不采集。
7. **失败策略**：写入失败允许异步重试；普通事件和 transcript 写入失败不阻塞课程；完成状态保存失败也不得阻止用户完成练习，但界面应显示待重试/未保存状态，避免误认为已持久化。
8. **测试与部署**：允许 `C_TEST` 产生测试数据，必须标记为测试记录；`C_LIMIT` 用于普通参与者逐日解锁测试。生产 CORS 只允许正式 Pages 域名；中国大陆网络实测放到基础版本测试后，不阻塞首次提交。
9. **发布基线**：先完成基础用户、进度、核心采集、回放和最小导出版本，使用测试编号回归后提交可回退版本，再根据测试结果继续修改。

---
## 历史执行清单（保留供追溯）

### 9A-1：设计与本地准备

- [x] 确认身份方案：默认采用参与者编号 / 邀请码。
- [x] 新增 D1 schema 草案：`cloudflare-worker/migrations/0001_research_data.sql`。
- [x] 新增 Worker 数据访问层接口：`cloudflare-worker/src/data/research-repository.ts`。
- [x] 明确数据字段包含参与者编号、session、模块编号、步骤、用户输入、AI 回复、fallback 状态和时间戳。
- [x] 补充参与者账号绑定字段、角色字段、逐日解锁起点、session 时长与完整对话 transcript 表。

9A-1 说明：

- D1 schema 已覆盖 `participants`、`sessions`、`module_events`、`ai_call_events`、`exports`。
- D1 schema 已预留 `conversation_messages`，用于后续导出完整文本对话。
- Worker 数据访问层提供 D1 与 no-op 双模式：未绑定 D1 时不阻断现有 AI 流程，绑定 D1 后可写入数据。
- 当前只完成本地设计和类型接口，尚未启用线上 D1 写入。

### 9A-2：参与者与 session

- [x] 新增 `POST /api/v1/participants/start`。
- [x] 新增 `npm run smoke:participant` 验证脚本。
- [x] 接口返回 `role`、`unlockStartAt` 和 `access`，为逐日解锁与测试账号绕过做准备。
- [x] Worker 配置支持 `TESTER_PARTICIPANT_CODES` / `ADMIN_PARTICIPANT_CODES`，高权限由后端编号名单决定。
- [x] 前端新增强制登录浮层，要求研究编号和姓名，并显示研究说明确认框。
- [x] 前端保存 `participantCode` 与 `sessionId`。
- [x] 前端保存 participantName；不保存 participantEmail。
- [x] AI hook 请求携带 `participantCode` 与 `sessionId`。
- [x] 前端读取 `access` 字段并对未解锁模块显示锁定态。
- [x] Worker/D1 线上部署完成；浏览器刷新和换设备恢复仍需人工验收。

9A-2 后端接口说明：

- 请求体包含 `participantCode`、可选 `clientSessionId` 和 `metadata`。
- 当前请求体必须包含 participantName；不需要邮箱。
- Worker 不使用正式预录入名单；首次提交合法的 participantCode + participantName 时创建参与者，后续相同组合恢复同一参与者。
- 线上研究环境优先使用 D1 持久化；但 D1 未绑定或写入失败时不得阻断课程，可返回 `persisted: false` 并由前端异步重试。未保存状态必须明确标记，不能误报为已持久化。
- 绑定并迁移 D1 后返回 `persisted: true`，用于证明数据已写入 Cloudflare D1。
- 参与者编号会统一转成大写，并限制为字母、数字、下划线和短横线。
- `C0001` 这类研究编号格式已支持。
- C_TEST / 任意合法姓名当前由后端编号配置授予 tester，仅限内部测试；正式招募前需移除或改为受保护配置。
- C_LIMIT / 任意合法姓名当前是普通参与者示例，不是预录入账号。

9A-2 前端验证方式：

- 本地打开前端后，应先看到登录浮层，未登录时不能进入任何模块。
- 输入 `C_TEST`、姓名 `sxq`，应显示测试权限并能访问全部模块。
- 输入 `C_LIMIT`、姓名 `sxq`，应显示普通参与者状态并按逐日解锁。
- 输入新的合法编号+姓名，应创建新的普通参与者；格式非法或缺少姓名时才拒绝。
- 刷新页面后，编号应继续保留。
- 普通编号下，第一周只应能进入 `1-1`，其它未解锁模块显示“完成前一个训练模块后开放”或等价提示，不强制显示“第 N 天解锁”。
- 点击“更换信息”后，应清除当前登录信息并允许重新输入。
- 部署 Worker 后，用默认测试号 `C_TEST / sxq` 进入，应显示“测试权限已开启，可访问全部模块”。

### 9A-3：事件与 AI 调用记录

- [ ] 新增 `POST /api/v1/events`。
- [ ] AI hook 成功或 fallback 后写入 `ai_call_events`。
- [ ] 将用户输入、固定脚本文案、AI 回复按顺序写入 `conversation_messages`。
- [ ] 选取 1-2 个模块先接入普通事件记录。
- [ ] 验证不影响现有 AI 回复流程。

### 9A-4：导出

- [ ] 新增最小 JSON 导出接口。
- [ ] 后续再评估 CSV / Excel。
- [ ] 验证可按参与者编号导出练习、AI 调用与完整对话文本。
- [ ] 验证导出字段包含编号、可选账号、sessions、对话内容、时间戳和时长。

### 9A-5：PR 准备

- [ ] 梳理哪些改动可合回原仓库。
- [ ] 移除或参数化个人 Worker 地址。
- [ ] 保持 Cloudflare 专属配置与平台无关逻辑分层。

---

## 后续每轮协作提示

继续推进本 Cloudflare 实验线时，请遵守：

1. 优先保持现有课程流程、文案和 UI 不变。
2. 前端只调用统一 API，不直接接触 DeepSeek 或数据库。
3. Worker 中所有密钥使用 Cloudflare Secret，不写入仓库。
4. 数据能力先以参与者编号和最小事件记录为主，不急于做完整账号系统。
5. 当前正式身份规则是“研究编号 + 姓名直接创建/恢复”，邮箱和预录入名单不再是初版要求。
6. 当前正式解锁规则是“完成第 N 天后，次日 00:00 解锁第 N+1 天”，不能继续使用仅按 unlock_start_at 经过天数计算的旧逻辑。
7. 后端实现可以使用 Cloudflare 专属能力，但 API 契约要为腾讯云 Fastify + PostgreSQL 预留迁移空间。
8. 每完成一个阶段或子任务，更新本路线图与 README，并附上实际验证结果。

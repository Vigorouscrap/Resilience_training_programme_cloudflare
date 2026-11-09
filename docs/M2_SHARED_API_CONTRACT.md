# M2 共享 API 契约

状态：**已由项目负责人全部确认，作为 M2 实现基线**
版本：`confirmed-2026-11-09`

确认记录：2026-11-09，项目负责人确认第 1 节全部五项规则。

实现状态（2026-11-09）：共享契约包、JSON Schema、能力矩阵、单元测试、双 base URL 黑盒测试运行器以及 Worker/Fastify 现有 health/AI 差异修正已提交。Worker 类型检查、Fastify 本地构建与注入契约测试、现有线上 Worker health/core 回归均通过。新 Worker 版本因当前执行环境没有 `CLOUDFLARE_API_TOKEN` 尚未部署；部署后还需运行线上 AI 契约及跨 session 回放测试。

本文件用于统一以下两套后端的对外行为：

- Cloudflare Pages -> Cloudflare Worker -> D1
- EdgeOne Pages -> 腾讯云 Fastify -> PostgreSQL

两套环境使用同一份前端源码和同一套 API 契约，但生产前端固定连接各自后端，数据独立保存、独立导出，不跨环境迁移或自动同步。

---

## 1. 已确认规则

以下规则是 M2 测试和 M3 实现的正式基线。

### 决策 1：核心进度与普通事件采用不同失败策略

建议：

- 参与者登录、模块开始、模块完成和模块重置属于**核心状态**。数据库不可用时返回 `503 STORAGE_UNAVAILABLE`，前端明确提示重试，不能假装保存成功。
- 课程页面和已加载的练习内容可以继续显示，但未成功保存的模块不能解锁下一天。
- 普通对话事件、按钮选择、音频播放事件和 AI 调用日志属于**尽力记录**。写入失败不得阻塞课程或 AI 回复，应在前端缓冲后重试。
- 所有成功响应必须准确返回 `persisted: true/false`，禁止将未保存数据标为已保存。

理由：完全允许核心进度静默丢失会造成次日解锁错误和正式研究数据缺失；所有写入都强制成功又会让非核心埋点影响训练。建议采用“核心状态强一致，行为事件尽力记录”的折中方案。

### 决策 2：参与者身份继续使用“研究编号 + 姓名”组合

建议保持当前规则：

- 同一研究编号 + 规范化后的同一姓名：恢复同一参与者。
- 同一研究编号 + 不同姓名：创建相互隔离的新参与者。
- 不使用密码、邮箱或预录入名单。
- 姓名仅去除首尾空白、合并连续空白并以不区分大小写的形式匹配；展示时保留用户输入的正常格式。

该规则已在 Cloudflare smoke test 中实现，但需要确认是否接受“编号输对、姓名拼写不同会生成新身份”的行为。

### 决策 3：跨设备回放按参与者读取，不按当前 session 限制

建议：

- 请求仍必须携带当前有效 `participantCode + sessionId`，用于证明当前会话属于该参与者。
- 验证通过后，按 `participantId + moduleId` 获取该参与者已完成模块的快照和消息。
- 不再要求历史消息的 `sessionId` 必须等于当前设备的新 session。

当前 Worker 查询包含当前 `sessionId`，可能导致换设备或新会话后无法恢复旧回放，与“已完成模块可只读回放”目标冲突。

### 决策 4：模块时长同时保存两个口径

建议：

- `practiceDurationSeconds`：以前端右上角练习计时器为准，作为研究分析的主要训练时长。
- `elapsedDurationSeconds`：后端根据模块开始和完成时间计算，作为排障和完整性检查字段。
- 保留 `startedAt` 和 `completedAt` 的 ISO 8601 时间。

当前 Worker 只保存服务器时间差，但既定 Roadmap 指定右上角计时器为总时长。两个口径同时保存可以避免切后台、刷新或网络重试造成含义不清。

### 决策 5：测试账号重置会替换该模块的测试数据

建议保持当前规则：

- 只有 `tester` 和 `admin` 可以重置已完成模块。
- 普通参与者不能重置已完成模块。
- 重置后该模块恢复为 `started`，清除旧的消息、事件、AI 调用和回放快照。
- 初版不保留多次尝试历史；重置用于测试回归，不用于正式参与者。

如果需要保留测试账号的每次尝试，应在 M3 改为 attempt 模型，会显著扩大数据结构和导出复杂度。

---

## 2. 通用约定

### 2.1 基础地址与版本

- API 前缀：`/api/v1`
- 健康检查：`GET /health`
- JSON 请求：`Content-Type: application/json`
- 时间：ISO 8601 UTC 字符串；解锁日历按 `Asia/Shanghai` 计算。
- 生产 CORS：Cloudflare Worker 只允许 Cloudflare 正式前端；腾讯云 Fastify 只允许 `https://www.resilience-training.cloud`。

### 2.2 成功响应

- 所有持久化相关响应明确包含 `persisted: boolean`。
- 响应可包含 `metadata.runtime` 和 `metadata.storage`，但前端业务逻辑不得依赖具体平台名称。
- 允许平台返回额外诊断字段，但本文件规定的字段不得缺失或改变类型。

### 2.3 错误响应

为兼容当前前端和 Worker，M2 v1 统一为：

```json
{
  "error": "Human-readable message",
  "code": "STABLE_MACHINE_CODE",
  "details": {}
}
```

- `error` 必填。
- `code` 应用于前端分支判断；新接口不得只依赖英文错误文案。
- `details` 可选，不得包含密钥、完整 prompt 或敏感服务器信息。

建议状态码：

| 状态码 | 含义 | 示例 code |
|---|---|---|
| `400` | 请求格式或字段不合法 | `VALIDATION_ERROR`, `INVALID_MODULE_ID` |
| `401` | 未提供管理凭证 | `AUTH_REQUIRED` |
| `403` | 无权限或模块未解锁 | `MODULE_LOCKED`, `RESET_FORBIDDEN`, `AUTH_INVALID` |
| `404` | 路由、hook 或资源不存在 | `NOT_FOUND`, `UNKNOWN_HOOK` |
| `409` | 状态冲突 | `MODULE_NOT_COMPLETED` |
| `429` | 请求过多 | `RATE_LIMITED` |
| `503` | 核心存储不可用 | `STORAGE_UNAVAILABLE` |

### 2.4 参与者编号与姓名

`participantCode`：

- 去除首尾空白并转大写。
- 长度 `2-64`。
- 只允许 `A-Z`、`0-9`、下划线和短横线。

`participantName`：

- 必填。
- 去除首尾空白并合并连续空白。
- 最长 `80` 字符。
- 匹配身份时不区分大小写。

### 2.5 模块编号与训练日

- `moduleId` 格式为 `W-D`，其中 `W=1..6`、`D=1..7`。
- `dayIndex = (W - 1) * 7 + D`，范围 `1..42`。
- 每个唯一 `moduleId` 对应一个训练日，即使多个模块复用相同前端处理器，也分别计日。

---

## 3. 角色与逐日解锁

角色：

- `participant`：按日解锁。
- `tester`：全部模块可访问，可重置已完成模块。
- `admin`：初版访问规则与 tester 相同；导出权限仍由独立 Bearer Token 控制，不能仅凭参与者角色导出。

普通参与者解锁规则：

1. 首次登录解锁第 1 天。
2. 只有从第 1 天开始连续完成的模块计入 `lastCompletedDayIndex`。
3. 完成第 N 天后，第 N+1 天在该完成时间之后的下一个上海时间 `00:00` 解锁。
4. 最多解锁第 42 天。
5. 未完成模块再次打开时恢复同一 module run；已完成模块再次打开时进入只读回放。
6. 重复调用完成接口必须幂等，不得重复推进天数或创建多个完成记录。

访问摘要：

```json
{
  "canAccessAllModules": false,
  "unlockedDayIndex": 1,
  "lastCompletedDayIndex": 0,
  "nextUnlockAt": null,
  "completedModuleIds": []
}
```

---

## 4. 接口契约

## 4.1 健康检查

`GET /health`

必填响应字段：

```json
{
  "ok": true,
  "app": "resilience-api",
  "version": "v1",
  "runtime": "cloudflare-workers-or-fastify",
  "provider": "deepseek",
  "hooks": [],
  "timestamp": "2026-11-09T00:00:00.000Z"
}
```

允许 Fastify 额外返回 `nodeEnv`、`uptimeSeconds` 等诊断字段。

## 4.2 建立或恢复参与者会话

`POST /api/v1/participants/start`

请求：

```json
{
  "participantCode": "C0001",
  "participantName": "张三",
  "clientSessionId": "web_...",
  "metadata": {}
}
```

成功 `200`：

```json
{
  "participantId": "participant_...",
  "participantCode": "C0001",
  "participantName": "张三",
  "sessionId": "session_...",
  "persisted": true,
  "role": "participant",
  "unlockStartAt": "2026-11-09T00:00:00.000Z",
  "access": {},
  "metadata": {}
}
```

规则：

- 同一身份重复请求应恢复同一 `participantId`。
- 相同 `clientSessionId` 对同一参与者应恢复同一 `sessionId`；新的 client session 创建新 session，但仍属于同一参与者。
- `tester/admin` 由服务器环境配置的编号列表判定，客户端不能在请求体中自行指定角色。

## 4.3 开始模块

`POST /api/v1/module-runs/start`

请求：

```json
{
  "participantCode": "C0001",
  "sessionId": "session_...",
  "moduleId": "1-1",
  "metadata": { "source": "module-open" }
}
```

成功 `200`：

```json
{
  "persisted": true,
  "moduleRun": {
    "id": "module_run_...",
    "moduleId": "1-1",
    "dayIndex": 1,
    "status": "started",
    "startedAt": "...",
    "completedAt": null,
    "practiceDurationSeconds": null,
    "elapsedDurationSeconds": null
  },
  "access": {}
}
```

规则：

- 已存在未完成 run 时返回原 run，不创建重复记录。
- 已完成模块调用 start 时返回 `completed` 状态，前端据此进入只读回放。
- 未解锁模块返回 `403 MODULE_LOCKED`。

## 4.4 完成模块

`POST /api/v1/module-runs/complete`

请求：

```json
{
  "participantCode": "C0001",
  "sessionId": "session_...",
  "moduleId": "1-1",
  "practiceDurationSeconds": 615,
  "snapshotHtml": "<div>...</div>",
  "metadata": {
    "clientStep": 12,
    "source": "module-terminal"
  }
}
```

规则：

- 完成即完成当天，无额外确认步骤。
- 相同模块重复 complete 必须幂等，返回原完成记录。
- 首次完成时保存 `completedAt`、`practiceDurationSeconds`、服务器计算的 `elapsedDurationSeconds` 和回放快照。
- `snapshotHtml` 当前建议最大 `500000` 字符；超限返回 `400 VALIDATION_ERROR`，不得静默截断后仍声称完整保存。
- 成功后返回更新后的 `access`。

## 4.5 重置模块

`POST /api/v1/module-runs/reset`

请求字段与 start 相同。

规则：

- 仅 `tester/admin` 可用。
- 仅已完成模块可重置；否则返回 `409 MODULE_NOT_COMPLETED`。
- 重置清除该参与者该模块的消息、事件、AI 调用和快照，并把原 module run 恢复为 `started`。
- 普通参与者返回 `403 RESET_FORBIDDEN`。

## 4.6 批量研究事件

`POST /api/v1/events`

单次最多 `100` 个事件。

```json
{
  "participantCode": "C0001",
  "sessionId": "session_...",
  "events": [
    {
      "type": "conversation_message",
      "moduleId": "1-1",
      "hookId": "",
      "messageRole": "user",
      "messageText": "...",
      "source": "user_input",
      "step": 3,
      "sequenceIndex": 8,
      "durationMs": null,
      "metadata": {}
    },
    {
      "type": "module_event",
      "moduleId": "1-1",
      "eventType": "audio_play",
      "step": 4,
      "userInput": "",
      "choiceValue": "",
      "context": {}
    }
  ]
}
```

枚举：

- `messageRole`: `system_script | user | ai | ui_event`
- `source`: `fixed_script | user_input | ai_hook | button_choice | module_event`

建议成功响应 `202`：

```json
{
  "accepted": 2,
  "rejected": 0,
  "persisted": true
}
```

规则：

- 无法识别或字段不完整的事件应计入 `rejected`，不能像当前 Worker 一样把整个输入数组长度都计为 accepted。
- 写入失败不得阻塞课程；前端保留有界重试队列。
- 前端关闭页面时的最后一批事件属于尽力提交，不能保证浏览器一定发送完成。

## 4.7 对话与课程回放

`POST /api/v1/conversation/replay`

请求：

```json
{
  "participantCode": "C0001",
  "sessionId": "current_session_...",
  "moduleId": "1-1"
}
```

成功 `200`：

```json
{
  "moduleId": "1-1",
  "snapshotHtml": "<div>...</div>",
  "messages": [],
  "persisted": true
}
```

规则：

- 仅已完成模块返回回放；未完成模块返回空消息和空快照，不泄露其他参与者数据。
- 当前 session 只用于验证参与者身份；历史数据按该参与者的 `participantId + moduleId` 读取，以支持换设备恢复。
- 按 `sequenceIndex`、`createdAt`、`id` 稳定排序。
- 回放为只读；进入回放不得产生新的研究事件或修改完成状态。
- 音频回放信息从消息 `metadata` 恢复。

## 4.8 AI hook

`POST /api/v1/ai/hooks/:hookId`

正式课程请求：

```json
{
  "participantCode": "C0001",
  "sessionId": "session_...",
  "moduleId": "1-1",
  "step": 3,
  "variant": "default",
  "userInput": "...",
  "context": {}
}
```

统一响应：

```json
{
  "sessionId": "session_...",
  "moduleId": "1-1",
  "hookId": "module-1-1.intro-reply",
  "replyText": "...",
  "fallbackUsed": false,
  "promptVersion": "v1",
  "provider": "deepseek",
  "model": "...",
  "metadata": { "variant": "default" }
}
```

规则：

- `hookId` 必须存在，否则 `404 UNKNOWN_HOOK`。
- hook 所属 module 必须与请求 `moduleId` 一致，否则 `400 HOOK_MODULE_MISMATCH`。
- `userInput` 必填。
- `step` 统一允许有限数字或字符串，并在保存时转为字符串；当前 Fastify 只接受数字，需要在 M3 对齐。
- Worker 当前不返回 `sessionId`，M2 建议补齐，与 Fastify 和前端 fallback 响应一致。
- DeepSeek 超时、返回空内容或超出 hook 字数限制时，接口仍返回 `200` 和预设 fallback，`fallbackUsed=true`。
- AI 调用日志尽力写入；日志失败不得导致 AI 回复失败。

当前支持 10 个 hook：

1. `module-1-1.intro-reply`
2. `module-1-3.body-sensation-reflection`
3. `module-1-3.thought-reflection`
4. `module-2-2.case-emotion-feedback`
5. `module-3-2.positive-rumination-feedback`
6. `module-4-2.thought-train-reflection`
7. `module-4-2.boarding-impulse-reflection`
8. `module-4-4.label-feedback`
9. `module-4-6.supporter-response-feedback`
10. `module-6-2.value-desire-insight`

## 4.9 受保护导出（M3 新增）

`GET /api/v1/export`

鉴权：

```text
Authorization: Bearer <ADMIN_EXPORT_TOKEN>
```

建议查询参数：

- `format=csv|json`，默认 `csv`。
- `participantCode` 可选。
- `moduleId` 可选。
- `dateFrom` / `dateTo` 可选，ISO 日期或时间。
- `includeTestData=true|false`，默认 `false`。

规则：

- Cloudflare 只导出 D1；腾讯云只导出 PostgreSQL。
- 不提供参与者侧入口，不开发管理员网页。
- CSV 使用 UTF-8 BOM，正确转义中文、逗号、引号和换行，可直接由 Excel 打开。
- JSON 用于内部处理和调试。
- 导出至少覆盖参与者身份、session、模块开始/完成、两个时长口径、用户输入、按钮选择、对话、AI 调用和 fallback 状态。
- 每次导出记录凭证标识、筛选条件、格式和时间，不记录 token 原文。

---

## 5. 数据模型最低要求

两套数据库使用各自迁移语法，但至少保持以下逻辑实体和字段含义一致：

- `participants`：编号、姓名、规范化姓名、角色、状态、首次解锁时间、创建/最近访问时间、metadata。
- `sessions`：参与者、client session、开始/最近访问/结束时间、user agent、metadata。
- `module_runs`：参与者、当前 session、moduleId、dayIndex、状态、开始/完成时间、两个时长口径、metadata；每个参与者每个模块最多一个当前 run。
- `module_events`：moduleId、eventType、step、用户输入、选择、context、时间。
- `conversation_messages`：角色、来源、文本、hook、step、顺序、时长、metadata、时间。
- `ai_call_events`：hook、variant、输入、回复、fallback、prompt 版本、provider/model、metadata、时间。
- `conversation_snapshots`：参与者 + moduleId 唯一，保存最终 HTML 快照和版本。
- `exports`：请求凭证标识、格式、筛选条件和时间。

PostgreSQL 不需要与 D1 使用相同主键值，也不进行跨库同步。

---

## 6. M2 黑盒契约测试清单

确认本草案后，下一步才实现以下测试。每套测试分别以 Worker 和 Fastify base URL 运行：

1. health 必填字段和 10 个 hook 清单。
2. 编号格式、姓名必填和长度校验。
3. 相同编号 + 姓名恢复同一 participant；不同姓名相互隔离。
4. 相同 client session 恢复同一 session；新 client session 创建新 session。
5. 普通参与者初始只解锁第 1 天。
6. 未解锁模块返回 `403 MODULE_LOCKED`。
7. start 幂等，complete 幂等。
8. 完成当天后，下一上海日 `00:00` 解锁下一天。
9. 非连续完成不能跳过中间天数推进解锁。
10. tester/admin 全模块访问；普通参与者不能 reset。
11. reset 清理该模块旧消息、事件、AI 调用和快照。
12. events 正确统计 accepted/rejected，失败不阻塞课程。
13. 已完成模块可跨新 session 回放；未完成模块无回放。
14. 回放不产生新事件。
15. 10 个 AI hook 的字段、module 匹配、fallback 和最大长度。
16. AI 日志写入失败不影响回复。
17. 核心数据库故障返回 `503 STORAGE_UNAVAILABLE`，不误报 persisted。
18. 导出无 token/错误 token 被拒绝；正确 token 可按筛选导出 CSV/JSON。
19. CSV 中文、换行、引号和 Excel 打开兼容。
20. 两个参与者之间不能读取进度、回放或导出数据。

---

## 7. 当前实现差异摘要

| 项目 | Cloudflare Worker | 腾讯云 Fastify | 契约动作 |
|---|---|---|---|
| health | 已有，含 hooks/runtime | 已有，不含 hooks/runtime | Fastify 补齐必填字段 |
| 参与者/进度/事件/回放 | 已实现 | 未实现 | M3 按契约实现 |
| AI 响应 `sessionId` | 缺失 | 已有 | Worker 补齐 |
| AI `step` | 数字/字符串均可 | 仅数字 | 统一类型 |
| hook-module 匹配 | 未强制 | 已强制 | Worker 补齐 |
| 核心持久化失败 | 生产返回 503 | 尚未实现 | 等待确认决策 1 |
| 事件失败 | 当前可能返回 503 | 尚未实现 | 改为尽力记录与重试 |
| 跨设备回放 | 受当前 session 限制 | 未实现 | 等待确认决策 3 |
| 研究时长 | 服务器时间差 | 未实现 | 等待确认决策 4 |
| 导出 | 未实现 | 未实现 | M3 两端分别实现 |

---

## 8. 确认后的推进边界

第 1 节五项规则确认后按以下顺序推进：

1. 将本文件状态改为“已确认”。
2. 提取共享 schema/types 和 hook 清单。
3. 建立双 base URL 黑盒契约测试。
4. 先修正 Worker 与契约的小差异，保证现有完整环境成为参考实现。
5. 再进入 M3，为 Fastify + PostgreSQL 实现缺失接口。

共享 schema、Worker 差异和双后端测试框架已经完成。M2 剩余门槛为部署 Worker 更新并完成线上契约回归；在此之前不开始 M3 数据库迁移。

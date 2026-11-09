# M2 部署验收记录

日期：2026-11-09（Asia/Shanghai）。状态：M2 契约与本轮部署验收通过；M3 尚未启动。

负责人确认已部署 Worker 后，针对 `https://resilience-ai-worker.1362758164.workers.dev` 执行：

```text
npm run test:contract -- https://resilience-ai-worker.1362758164.workers.dev full
```

全部现有 profile 通过：

| 范围 | 本次直接验证的行为 |
|---|---|
| health | 版本、运行时、provider、10 个 hook 清单及有效时间 |
| core | 非法编号拒绝、建立身份、同 client session 恢复、模块开始持久化及访问摘要 |
| AI | 未知 hook 的 404/UNKNOWN_HOOK、模块不匹配的 400/HOOK_MODULE_MISMATCH、字符串 step、sessionId 及回复必填字段 |
| events | 两条有效事件和一条未知类型返回 accepted=2、rejected=1、persisted=true |
| 进度权限 | 重复 start 恢复同一 run、第 2 天未解锁时拒绝、完成第 1 天、普通参与者 reset 被拒绝 |
| 回放 | 完成前无消息/快照；同一身份的新 client session 可读取原会话的消息和快照；重复读取内容一致 |
| 身份隔离 | 同编号不同姓名创建不同 participant 且无原回放；另一编号无原回放；编号与 session 错配请求被拒绝且无历史数据 |

所有新建研究测试身份都在 participant/session metadata 中标记 `testData:true`。research profile 本轮保留的测试编号为 `M2_1794208809996_P1UKR`（包含两个姓名身份）、`M2_1794208811721_WWEFL`。core profile 也创建独立测试记录，AI profile 使用合成 session。本轮只完成独立测试身份的 1-1 模块，未重置或删除已有参与者数据。

此前本地检查已通过：9 项共享契约单元测试、Worker TypeScript 检查、Fastify 构建及本地 health/AI 注入测试。Fastify 研究接口仍未实现，不能运行 core/research 并宣称通过。

## 完成边界与后续待办

`full` 仅表示执行当前全部 profile，不代表正式契约第 6 节的 20 项最终要求已全部通过。重复回放内容一致也不能独立证明数据库没有任何副作用；仍需数据库级检查。

M3 必须继续处理：

- Fastify/PostgreSQL 的参与者、进度、事件、回放、reset 和受保护 CSV/JSON 导出；两边数据独立保存。
- Worker 和腾讯云同时保存 `practiceDurationSeconds` 与 `elapsedDurationSeconds`；前端提交计时器值。
- 扩充研究接口 JSON Schema，并让两个运行时使用共享规则；目前共享包存在，生产代码尚未直接引用。
- Worker 快照超限当前仍截断，应改为拒绝；重复 complete 当前可能覆盖快照，应保证原完成记录及快照幂等。
- 加强事件字段/枚举、100 条上限及部分写入失败的计数与重试语义；本轮只验证基本有效/无效类型计数。
- 回放快照读取补充已完成状态保护；目前消息查询有完成检查，快照查询自身没有。
- 鉴权失败错误码对齐；当前错配 session 的回放返回 400/INVALID_MODULE_ID，已确认不会返回其他身份内容，但分类仍需改进。
- 核心存储故障注入、未绑定 DB 时 REQUIRE_PERSISTENCE 行为、AI 日志失败、10 个 hook 的 fallback/长度、tester reset 清理、complete 幂等及导出测试。

M4/M5 继续验证内地 API HTTPS/CORS、登录后的音视频、42 模块、真实设备/三网、断网恢复、数据库级回放只读及备份恢复。上海午夜解锁已有共享算法单元测试，线上跨日与异常状态仍需最终验收。

生产映射保持固定：Cloudflare Pages → Worker/D1；EdgeOne Pages → 腾讯云 Fastify/PostgreSQL。无需新增域名或迁移 D1 数据即可开展 M3 的本地实现；实际服务器部署时使用已有服务器授权方式配置数据库及服务密钥，密钥不进入仓库。

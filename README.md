# 心理弹性训练程序 - Cloudflare 实验仓库

本仓库是 `Resilience_training_programme` 的 Cloudflare 实验线，用来验证：

- 前端是否可以用 Cloudflare Pages 免费部署。
- 后端是否可以用 Cloudflare Workers 做一个轻量 AI API 代理。
- 在不影响原项目“多前端 + 腾讯云 Lighthouse 后端”正式路线的前提下，评估 Cloudflare 作为备用/实验部署方案的可行性。

原正式路线仍建议保留：

```text
前端：Vercel / 后续 EdgeOne Pages 或 COS + EdgeOne
后端：腾讯云 Lighthouse + Nginx + systemd
正式 API：api.resilience-training.cloud
```

Cloudflare 实验线用于快速验证，不直接替代正式国内部署路线。

---

## 更新记录

- 2026-06-20：新增 Cloudflare 实验线专用 `docs/IMPLEMENTATION_ROADMAP.md`，将下一阶段明确为阶段 9A 用户体系与数据能力最小原型。
- 2026-06-20：确认 Cloudflare Pages 前端可以通过 Worker 获得个性化回复，并将 `src/runtime-config.js` 默认 API 地址设置为当前 Worker。
- 2026-06-20：根据线上 smoke test 结果，放宽 `module-6-2.value-desire-insight` 的 Worker 输出校验上限，减少该节点因模型回复略长而走 fallback 的概率。
- 2026-06-20：完成 Cloudflare Worker 当前全部 10 个 AI hook 迁移，新增 `smoke:hooks` 一键验证脚本，并补充部署后验证说明。

---

## 当前仓库结构

```text
.
├─ src/
│  └─ 现有静态前端代码，可直接部署到 Cloudflare Pages
├─ backend/
│  └─ 原 Node.js + Fastify 后端，适合腾讯云 Lighthouse / ECS，不建议直接部署到 Workers
├─ cloudflare-worker/
│  ├─ src/index.ts
│  │  # Cloudflare Workers 实验后端，兼容现有 /health 和 /api/v1/ai/hooks/:hookId
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ wrangler.toml
└─ docs/
```

---

## 当前完成状态

已完成：

- [x] 保留原 `backend/`，不破坏腾讯云后端路线。
- [x] 新增 `cloudflare-worker/` 作为 Cloudflare Workers 实验后端。
- [x] Worker 暴露 `GET /health`。
- [x] Worker 暴露 `POST /api/v1/ai/hooks/:hookId`。
- [x] Worker 已迁移当前正式后端中的全部 10 个 AI hook。
- [x] Worker 支持 DeepSeek API 调用。
- [x] Worker 支持 fallback，避免模型调用失败时前端流程卡住。
- [x] Worker 支持 CORS 配置。
- [x] npm run check 已通过本地 TypeScript 校验。

待完成：

- [x] 在 Cloudflare Pages 部署前端 `src/`。
- [x] 在 Cloudflare Workers 配置 `DEEPSEEK_API_KEY` secret。
- [x] 部署 Worker 并验证 `/health`。
- [x] 逐个验证 Worker 的全部 AI hook 是否都能返回 `fallbackUsed: false`。
- [x] 将 Cloudflare Pages 前端的 `apiBaseUrl` 指向 Worker 地址。
- [ ] 评估 Cloudflare Workers 在中国大陆网络环境下的稳定性。
- [ ] 推进阶段 9A：使用参与者编号 / 邀请码 + D1 草案实现最小用户数据保存与导出原型。

当前 Worker 已包含的 hook：

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

## 为什么新增 `cloudflare-worker/` 而不是直接改 `backend/`

原 `backend/` 使用：

```text
Node.js + Fastify + systemd + Nginx
```

它适合部署在腾讯云 Lighthouse、阿里云 ECS 或其它 Linux VM 上。

Cloudflare Workers 是 serverless runtime，不是传统 Node.js 长驻进程环境。虽然都能写 TypeScript，但运行模型、部署方式、环境变量、文件读取和包兼容性都不同。

因此本仓库采用双后端结构：

```text
backend/              正式 VM 后端路线
cloudflare-worker/    Cloudflare 实验后端路线
```

这样可以实验 Cloudflare，而不污染原正式后端。

---

## Cloudflare Pages 前端部署

如果只是部署静态前端页面，代码不需要改。

Cloudflare Pages 配置：

```text
Framework preset: None
Build command: 留空
Build output directory: src
```

部署后会得到类似：

```text
https://your-project.pages.dev
```

如果只看页面显示，这一步已经足够。

当前实验仓库已经在 `src/runtime-config.js` 中默认配置 Worker 地址：

```text
https://resilience-ai-worker.1362758164.workers.dev
```

因此 Cloudflare Pages 部署完成后，直接打开页面也会默认连接 Cloudflare Worker 后端。

如果要临时切换到其它后端，仍然可以用 URL 参数覆盖 `apiBaseUrl`。

临时测试方式：

```text
https://your-project.pages.dev/?apiBaseUrl=https://your-worker.your-account.workers.dev
```

长期建议：如果后续需要同时维护多个环境，例如 Cloudflare Worker、腾讯云正式后端、测试后端，再增加构建时生成 `src/runtime-config.js` 的脚本，通过环境变量注入 API 地址。

---

## Cloudflare Worker 后端部署

进入 Worker 目录：

```bash
cd cloudflare-worker
npm install
```

本地类型检查：

```bash
npm run check
```

这个命令只检查代码能不能通过 TypeScript 编译，不会真正调用 DeepSeek。

登录 Cloudflare：

```bash
npx wrangler login
```

配置 DeepSeek API Key。

注意：不要把真实 key 写入代码或 GitHub。

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

可选配置前端来源，编辑 `wrangler.toml`：

```toml
CORS_ORIGIN = "https://your-project.pages.dev,https://resilience-training-programme-two.vercel.app"
```

部署：

```bash
npm run deploy
```

验证健康检查：

```bash
curl https://your-worker.your-account.workers.dev/health
```

部署后也可以一次性验证全部 hook：

```bash
WORKER_BASE_URL=https://your-worker.your-account.workers.dev npm run smoke:hooks
```

在 Windows PowerShell 中可以这样写：

```powershell
$env:WORKER_BASE_URL="https://your-worker.your-account.workers.dev"
npm.cmd run smoke:hooks
```

这个命令会依次检查 `/health` 和全部 10 个 AI hook。默认要求每个 hook 都返回 `fallbackUsed: false`，这样才能确认 Worker 已经真实调用 DeepSeek，而不是只走了兜底文案。如果只是想确认路由结构是否通，可以临时设置 `ALLOW_FALLBACKS=1`。

验证 AI hook，例如：

```bash
curl -X POST https://your-worker.your-account.workers.dev/api/v1/ai/hooks/module-1-1.intro-reply \
  -H "Content-Type: application/json" \
  -d '{"moduleId":"1-1","step":1,"userInput":"我最近压力有点大，希望能更好地调整自己。","context":{"source":"cloudflare-worker-smoke-test"}}'
```

成功时应返回：

```json
{
  "moduleId": "1-1",
  "hookId": "module-1-1.intro-reply",
  "replyText": "...",
  "fallbackUsed": false,
  "provider": "deepseek",
  "metadata": {
    "runtime": "cloudflare-worker"
  }
}
```

如果 DeepSeek 调用失败，接口仍会返回 fallback，并标记：

```json
{
  "fallbackUsed": true
}
```

部署后建议按下面顺序逐个验证：

```text
1. /health 可以返回 ok: true，并在 hooks 字段里列出 10 个 hook
2. module-1-1.intro-reply 可以返回 fallbackUsed: false
3. module-1-3.body-sensation-reflection 可以返回 fallbackUsed: false
4. module-1-3.thought-reflection 可以返回 fallbackUsed: false
5. module-2-2.case-emotion-feedback 分别验证 zhangtian / xiaolin / jiayi 三个 variant
6. module-3-2.positive-rumination-feedback 可以返回 fallbackUsed: false
7. module-4-2.thought-train-reflection 可以返回 fallbackUsed: false
8. module-4-2.boarding-impulse-reflection 可以返回 fallbackUsed: false
9. module-4-4.label-feedback 可以返回 fallbackUsed: false
10. module-4-6.supporter-response-feedback 可以返回包含 <br><br> 的两段式反馈
11. module-6-2.value-desire-insight 可以返回 fallbackUsed: false
```

---

## Cloudflare 实验线与正式线的区别

| 项目 | Cloudflare 实验线 | 腾讯云正式线 |
|---|---|---|
| 前端 | Cloudflare Pages | Vercel / EdgeOne Pages / COS + EdgeOne |
| 后端 | Cloudflare Workers | Lighthouse + Fastify + Nginx + systemd |
| 优点 | 部署快、免费额度友好、适合实验 | 更贴近国内正式访问、后端能力完整 |
| 风险 | 国内网络稳定性不确定，Worker 后端需重构 | 需要域名、HTTPS、ICP备案 |
| 当前定位 | 实验/备用入口 | 正式路线 |

---

## 后续开发原则

- 不要把 DeepSeek API Key 写入前端或仓库。
- Cloudflare Worker 必须保持和现有前端 API 契约兼容。
- 前端课程文案、UI、模块流程仍遵守原路线图约束，不因 Cloudflare 实验线随意改写。
- 当前已经完成全部现有 AI hook 的 Worker 迁移、线上部署与逐个 hook 验证。
- 下一阶段是阶段 9A：用户体系与数据能力最小原型，优先采用参与者编号 / 邀请码，而不是完整账号密码注册。
- 如果 Worker 后端继续扩大，建议把 prompt 与 hook 配置从 `backend/` 抽成可复用共享包，避免双后端长期复制。
- 详见 `docs/IMPLEMENTATION_ROADMAP.md`。

---

## 下一步建议

1. 确认阶段 9A 身份方案：默认采用参与者编号 / 邀请码。
2. 新增 Cloudflare D1 schema 草案。
3. 新增 `POST /api/v1/participants/start`，让前端能创建或恢复参与者 session。
4. 新增最小事件记录接口，先记录少量关键模块输入。
5. 扩展 AI hook 写入调用记录，但必须保证写入失败不影响现有课程流程。
6. 新增最小 JSON 导出接口，先按参与者编号导出。

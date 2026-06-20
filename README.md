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
- [x] Worker 初版支持 `module-1-1.intro-reply`。
- [x] Worker 支持 DeepSeek API 调用。
- [x] Worker 支持 fallback，避免模型调用失败时前端流程卡住。
- [x] Worker 支持 CORS 配置。
- [x] npm run check 已通过本地 TypeScript 校验。

待完成：

- [ ] 在 Cloudflare Pages 部署前端 `src/`。
- [ ] 在 Cloudflare Workers 配置 `DEEPSEEK_API_KEY` secret。
- [ ] 部署 Worker 并验证 `/health`。
- [ ] 验证 Worker 的 `module-1-1.intro-reply` hook。
- [ ] 将 Cloudflare Pages 前端的 `apiBaseUrl` 指向 Worker 地址。
- [ ] 逐步迁移其余 hook：`1-3`、`2-2`、`3-2`、`4-2`、`4-4`、`4-6`、`6-2`。
- [ ] 评估 Cloudflare Workers 在中国大陆网络环境下的稳定性。
- [ ] 如果继续推进，补齐用户数据保存方案，例如 D1 / R2 / 外部数据库；当前未实现数据持久化。

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

如果要连接后端 AI，则前端需要配置 `apiBaseUrl`。

临时测试方式：

```text
https://your-project.pages.dev/?apiBaseUrl=https://your-worker.your-account.workers.dev
```

长期建议：后续增加构建时生成 `src/runtime-config.js` 的脚本，通过环境变量注入 API 地址。

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

验证 AI hook：

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
- 先迁移少量 hook 做可行性验证，再决定是否迁移全部 hook。
- 如果 Worker 后端继续扩大，建议把 prompt 与 hook 配置从 `backend/` 抽成可复用共享包，避免双后端长期复制。

---

## 下一步建议

1. 先在 Cloudflare Pages 部署前端 `src/`，确认页面可访问。
2. 部署 `cloudflare-worker/`，验证 `/health`。
3. 配置 Worker secret `DEEPSEEK_API_KEY`。
4. 验证 `module-1-1.intro-reply`。
5. 用 Pages URL 参数 `?apiBaseUrl=...` 指向 Worker，测试前端完整调用。
6. 如果稳定，再迁移其它 AI hook。



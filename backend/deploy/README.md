# 轻量云服务器部署说明

本文件写给后续实际部署和联调时使用，目标是让当前后端可以部署到腾讯云 Lighthouse、阿里云 ECS 或其它轻量 Linux 云服务器上。

当前部署方案尽量不绑定某一家云厂商：

- Node.js 后端作为常驻服务运行。
- Nginx 负责公网域名、HTTPS 和反向代理。
- systemd 负责后端进程守护和开机自启。
- 真实密钥只保存在服务器环境变量或 `.env` 文件中，不提交到仓库。
- 同一个后端可以通过 `CORS_ORIGIN` 同时服务本地、Vercel 预览版、国内正式前端等多个来源。

---

## 现在你需要做什么

如果我们还没有开始真实公网部署，你暂时不需要马上购买服务器或配置数据库。

在进入真实云端联调前，需要你提供或确认这些信息：

- 云服务器：腾讯云 Lighthouse 或阿里云 ECS 均可，建议 Ubuntu 22.04 LTS 或 24.04 LTS。
- 后端公网访问方式：最好有一个域名，例如 `api.example.com`；如果暂时没有域名，也可以先用公网 IP 做短期测试。
- DeepSeek API Key：只放到服务器 `.env` 或云平台 Secret 中，不发到前端、不写入仓库。
- 前端公网地址：例如 Vercel 地址，后续要写入 `CORS_ORIGIN`。
- 是否暂时只做 AI 演示：如果是，`DATABASE_URL` 可以先用占位值；如果要做登录、保存和导出，就需要真实 PostgreSQL。

---

## 推荐服务器基础环境

- Ubuntu 22.04 LTS 或 24.04 LTS
- Node.js 20 LTS 或更新版本
- Nginx
- systemd，Ubuntu 默认自带
- 域名和 HTTPS 证书，正式使用时建议配置

云服务器安全组/防火墙建议：

- 对公网开放 `80` 和 `443`
- 不直接对公网开放后端端口 `8787`
- 让 Nginx 在服务器内部访问 `127.0.0.1:8787`

---

## 部署步骤

### 1. 上传或克隆仓库

在服务器上准备项目代码，示例路径：

```bash
/opt/resilience-training-programme
```

进入后端目录：

```bash
cd /opt/resilience-training-programme/backend
```

如何确认：

```bash
pwd
ls
```

你应该能看到 `package.json`、`src/`、`deploy/` 等文件和目录。

### 2. 安装依赖并构建

```bash
npm ci
npm run build
```

如何确认：

```bash
ls dist
ls dist/modules/ai/prompt-registry/prompts
```

你应该能看到编译后的 `server.js`，以及复制到 `dist/` 里的 prompt Markdown 文件。这个检查很重要，否则生产启动会找不到 prompt。

### 3. 准备生产环境变量

从模板复制：

```bash
cp deploy/lightweight-server.env.example .env
```

然后编辑 `.env`，填入真实值：

```text
DEEPSEEK_API_KEY
SESSION_SECRET
CORS_ORIGIN
DATABASE_URL
```

如何确认：

```bash
test -f .env && echo "env file exists"
```

不要把 `.env` 内容截图或提交到 GitHub。

### 4. 本机直接启动后端做冒烟测试

```bash
node dist/server.js
```

另开一个终端测试：

```bash
curl http://127.0.0.1:8787/health
```

如何确认：

响应里应该包含：

```json
{
  "ok": true,
  "app": "resilience-programme-backend",
  "version": "v1"
}
```

看到后即可停止这个临时进程，继续配置 systemd。

### 5. 配置 systemd 后台服务

复制模板：

```bash
sudo cp deploy/systemd/resilience-backend.service.example /etc/systemd/system/resilience-backend.service
```

根据真实路径和运行用户修改：

```text
WorkingDirectory=/opt/resilience-training-programme/backend
EnvironmentFile=/opt/resilience-training-programme/backend/.env
ExecStart=/usr/bin/node dist/server.js
User=www-data
Group=www-data
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable resilience-backend
sudo systemctl start resilience-backend
```

如何确认：

```bash
sudo systemctl status resilience-backend
curl http://127.0.0.1:8787/health
```

`status` 应显示 `active (running)`，`curl` 应返回 `ok: true`。

### 6. 配置 Nginx 反向代理

复制模板：

```bash
sudo cp deploy/nginx/resilience-backend.conf.example /etc/nginx/sites-available/resilience-backend.conf
```

修改 `server_name`：

```text
server_name api.example.com;
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/resilience-backend.conf /etc/nginx/sites-enabled/resilience-backend.conf
sudo nginx -t
sudo systemctl reload nginx
```

如何确认：

```bash
curl http://api.example.com/health
```

如果暂时没有域名，可以先用服务器公网 IP 测试 Nginx 是否转发成功。

### 7. 配置 HTTPS

正式部署建议使用 HTTPS。可以使用 Let's Encrypt、腾讯云证书、阿里云证书或其它证书服务。

如何确认：

```bash
curl https://api.example.com/health
```

前端线上环境必须优先使用 `https://` 的后端地址，否则浏览器可能因为混合内容策略拦截请求。

### 8. 配置前端 API 地址

前端可以通过 `src/runtime-config.js` 注入：

```javascript
window.__RESILIENCE_RUNTIME__ = {
    apiBaseUrl: 'https://api.example.com'
};
```

也可以短期通过 URL 参数测试：

```text
https://your-frontend.example.com/?apiBaseUrl=https://api.example.com
```

如何确认：

- 打开浏览器开发者工具。
- 进入 Network 面板。
- 操作一个已接入 AI 的模块，例如 `1-1` 或 `2-2`。
- 应看到请求打到 `https://api.example.com/api/v1/ai/hooks/...`。

---

## 每次后端修改后怎么测试

本地最小测试顺序：

1. 在 `backend/` 运行：

```bash
npm run build
```

2. 检查生产构建的健康接口：

```bash
node dist/server.js
curl http://127.0.0.1:8787/health
```

3. 如果改了 AI hook、prompt、fallback 或上下文：

```text
打开前端 -> 进入对应模块 -> 触发该 AI 节点 -> 看是否能继续后续固定流程
```

4. 如果改了部署、CORS 或环境变量：

```bash
curl -i http://127.0.0.1:8787/health
```

并在浏览器 Network 面板确认线上前端没有 CORS 报错。

云端最小测试顺序：

1. `sudo systemctl status resilience-backend`
2. `curl http://127.0.0.1:8787/health`
3. `curl https://api.example.com/health`
4. 在线上前端触发一个 AI hook
5. 检查后端日志：

```bash
sudo journalctl -u resilience-backend -n 100 --no-pager
```

---

## 环境变量分层

- 本地开发：`backend/.env.local`
- 轻量云服务器生产：`backend/.env`
- 平台托管环境：使用平台环境变量或 Secret Manager

真实密钥不要写入：

- `.env.example`
- `deploy/*.example`
- 前端代码
- prompt 文件
- README 截图或公开文档

---

## CORS 示例

一个后端同时服务本地、Vercel 和国内正式前端时：

```text
CORS_ORIGIN=http://localhost:8000,https://your-vercel-site.vercel.app,https://your-cn-frontend.example.com
```

如果浏览器报 CORS 错误，优先检查：

- 当前前端实际域名是否完整写入 `CORS_ORIGIN`
- 是否使用了 `https://` 和正确域名
- 后端服务是否重启并读取了新的 `.env`

---

## 当前阶段边界

当前阶段目标是先跑通：

```text
公网前端 + 公网后端 + DeepSeek
```

暂时还不强制要求：

- 用户登录
- 真实数据库持久化
- 数据导出
- 多用户隔离

这些会在后续阶段 9 再推进。

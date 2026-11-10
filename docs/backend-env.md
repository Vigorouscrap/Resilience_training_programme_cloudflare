# Backend Environment Notes

## 敏感信息管理原则

以下信息只能放在后端环境变量中：

- DeepSeek API Key
- 数据库连接串
- Session Secret

这些内容不得：

- 写入前端代码
- 写入对话模块
- 写入 prompt 文件
- 提交到仓库

## 当前环境变量

建议复制：

```text
backend/.env.example
```

并在本地创建：

```text
backend/.env.local
```

## 当前变量说明

- `AI_PROVIDER`
  - 当前固定为 `deepseek`
- `DEEPSEEK_BASE_URL`
  - DeepSeek API 根地址
- `DEEPSEEK_API_KEY`
  - DeepSeek 密钥
- `DEEPSEEK_MODEL`
  - 当前默认模型，使用 `deepseek-v4-flash`
- `DEEPSEEK_TIMEOUT_MS`
  - 模型请求超时
- `DATABASE_URL`
  - PostgreSQL 连接串
- `SESSION_SECRET`
  - 后续登录和会话签名使用
- `CORS_ORIGIN`
  - 当前前端访问来源
- `TESTER_PARTICIPANT_CODES` / `ADMIN_PARTICIPANT_CODES`
  - 逗号分隔的服务端角色编号；客户端不能自授角色，默认导出排除这些测试身份。
- `ADMIN_EXPORT_TOKEN`
  - 独立的研究导出 Bearer Token，留空禁用导出，不影响训练。两套环境分别配置。
- `EXPORT_CREDENTIAL_ID`
  - 非敏感的导出凭证标识，写入审计，不能填写 token 原文。
- `MIGRATION_DATABASE_URL`
  - 仅迁移命令使用的 schema owner 连接串；运行服务的 `DATABASE_URL` 使用最小权限账号。不必把 owner 密码保存在服务 `.env`。

服务器 `.env` 更新前保留已有值，不直接用模板覆盖。当前真实研究部署流程见 `M3_IMPLEMENTATION_AND_DEPLOYMENT.md`。

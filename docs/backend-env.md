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

# Backend Architecture

## 当前目标

后端当前的职责是先建立一个独立、可扩展、与部署平台弱绑定的基础骨架，为后续 AI hook、用户登录、数据保存、导出和正式上线打基础。

## 当前阶段已落地的结构

```text
backend/
├─ package.json
├─ tsconfig.json
├─ .env.example
├─ prisma/
│  └─ schema.prisma
└─ src/
   ├─ app.ts
   ├─ server.ts
   ├─ config/
   ├─ shared/
   └─ modules/
      ├─ ai/
      ├─ module-state/
      └─ sessions/
```

## 模块职责

### `config/`

- 统一读取环境变量
- 统一构建运行时配置

### `modules/ai/`

- 暴露 AI hook API
- 管理 provider 抽象与 DeepSeek 实现
- 管理 prompt registry
- 统一 fallback 策略
- 统一输出校验

### `modules/sessions/`

- 先提供匿名 session 基础能力
- 后续可扩展为登录后用户 session

### `modules/module-state/`

- 负责把当前模块状态整理为“最小必要上下文”
- 避免直接把完整聊天历史发给模型

### `prisma/schema.prisma`

- 先定义未来正式系统需要的核心数据模型
- 包括用户、登录身份、会话、模块运行、上下文快照、prompt 版本、AI 调用事件、导出任务

## 当前边界

当前后端已完成基础骨架，但尚未：

- 接入前端调用
- 接入真实数据库连接和迁移执行
- 接入正式登录
- 接入数据导出业务流程
- 接入 `1-1` / `2-2` 以外的业务节点

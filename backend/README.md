# Backend

本目录是当前项目新增的独立后端，用来承接以下能力：

- DeepSeek 大模型调用
- prompt registry 统一管理
- 匿名 session 与后续用户 session 基础能力
- 模块上下文整理
- 为后续登录、数据保存、导出、部署做基础架构准备

当前前端仍然掌控页面、固定文案和固定流程；后端只在指定 hook 节点生成受控的个性化短回复。

---

## 当前状态

当前后端已经完成：

- 基础 Node + TypeScript + Fastify 骨架
- 环境变量读取与敏感信息隔离
- DeepSeek provider 抽象与实现
- prompt registry
- `1-1`、`1-3`、`2-2`、`3-2`、`4-2`、`4-4`、`4-6` 与 `6-2` 的 AI hook 配置
- fallback 机制
- 匿名 session 基础能力
- 模块上下文整理基础能力
- Prisma schema 基础定义

当前后端还没有完成：

- 真实数据库迁移与持久化接入
- 用户登录
- 数据导出业务
- 全量模块 AI 化
- 正式部署接入

---

## 文件树与职责

说明：

- 以下文件树聚焦 `backend/src` 与关键配置文件。
- `node_modules/`、`dist/`、`.env.local` 等安装产物、构建产物和本地敏感文件不在此展开。

```text
backend/
├─ .env.example
│  # 后端本地环境变量模板，不包含真实密钥
│
├─ package.json
│  # 后端依赖、脚本命令
│
├─ tsconfig.json
│  # TypeScript 编译配置
│
├─ README.md
│  # 本说明文档
│
├─ prisma/
│  └─ schema.prisma
│     # Prisma 数据模型定义，覆盖用户、会话、模块运行、AI 调用事件、导出任务等
│
└─ src/
   ├─ server.ts
   │  # 后端启动入口
   │
   ├─ app.ts
   │  # Fastify 应用装配，注册 health route、CORS、AI routes 和核心服务
   │
   ├─ config/
   │  ├─ env.ts
   │  │  # 统一读取环境变量，校验必填项
   │  └─ runtime.ts
   │     # 运行时配置聚合
   │
   ├─ shared/
   │  ├─ types/
   │  │  └─ ai.ts
   │  │     # AI hook 请求/响应、provider 输入输出、hook 定义等共享类型
   │  └─ utils/
   │     └─ fs.ts
   │        # 读取 prompt 文件的文件工具
   │
   └─ modules/
      ├─ ai/
      │  ├─ ai.controller.ts
      │  │  # 暴露 /api/v1/ai/hooks/:hookId 路由
      │  ├─ ai.service.ts
      │  │  # 核心 AI 编排：查 hook、整理上下文、调 provider、校验输出、fallback
      │  │
      │  ├─ fallbacks/
      │  │  └─ fallback-messages.ts
      │  │     # API 失败或输出校验不通过时的固定兜底文案
      │  │
      │  ├─ providers/
      │  │  ├─ ai-provider.ts
      │  │  │  # 通用 provider 接口
      │  │  └─ deepseek.provider.ts
      │  │     # DeepSeek API 调用实现
      │  │
      │  ├─ schemas/
      │  │  └─ ai-reply.schema.ts
      │  │     # AI hook 请求体基础校验
      │  │
      │  ├─ validators/
      │  │  └─ reply-validator.ts
      │  │     # 模型输出长度与基础结构校验
      │  │
      │  └─ prompt-registry/
      │     ├─ index.ts
      │     │  # hook 总注册表
      │     │
      │     ├─ hooks/
      │     │  ├─ module-1-1.intro-reply.ts
      │     │  │  # 1-1 的 hook 配置：model、version、fallbackKey、prompt 文件映射
      │     │  ├─ module-1-3.body-sensation-reflection.ts
      │     │  │  # 1-3 身体感觉节点的 hook 配置：短回应、输出上限、fallbackKey
      │     │  ├─ module-1-3.thought-reflection.ts
      │     │  │  # 1-3 小念头节点的 hook 配置：短回应、输出上限、fallbackKey
      │     │  ├─ module-2-2.case-emotion-feedback.ts
      │     │  │  # 2-2 的 hook 配置：默认变体、三个案例 prompt 变体等
      │     │  ├─ module-3-2.positive-rumination-feedback.ts
      │     │  │  # 3-2 反思反馈节点的 hook 配置：分类式短反馈、输出上限、fallbackKey
      │     │  ├─ module-4-2.thought-train-reflection.ts
      │     │  │  # 4-2 “想法火车”观察反馈的 hook 配置
      │     │  ├─ module-4-2.boarding-impulse-reflection.ts
      │     │  │  # 4-2 “是否想跟着走”反馈的 hook 配置
      │     │  ├─ module-4-4.label-feedback.ts
      │     │  │  # 4-4 标签化练习反馈的 hook 配置：复用六个案例的统一标签反馈逻辑
      │     │  ├─ module-4-6.supporter-response-feedback.ts
      │     │  │  # 4-6 支持者回应分析的 hook 配置：先肯定已有优点，再补认知解离优化方向
      │     │  ├─ module-6-2.value-desire-insight.ts
      │     │  │  # 6-2 渴望/在乎洞察反馈的 hook 配置：肯定洞察、解释意义、引向一件小事
      │     │
      │     └─ prompts/
      │        ├─ module-1-1.intro-reply/
      │        │  ├─ v1.system.md
      │        │  │  # 1-1 的系统 prompt
      │        │  └─ v1.user.md
      │        │     # 1-1 的用户模板 prompt（结构化上下文插槽）
      │        │
      │        ├─ module-1-3.body-sensation-reflection/
      │        │  ├─ v1.system.md
      │        │  │  # 1-3 身体感觉回应的系统 prompt
      │        │  └─ v1.user.md
      │        │     # 1-3 身体感觉回应的用户模板 prompt
      │        │
      │        ├─ module-1-3.thought-reflection/
      │        │  ├─ v1.system.md
      │        │  │  # 1-3 小念头回应的系统 prompt
      │        │  └─ v1.user.md
      │        │     # 1-3 小念头回应的用户模板 prompt
      │        │
      │        ├─ module-2-2.case-emotion-feedback/
      │           ├─ zhangtian.v1.system.md
      │           │  # 张天案例系统 prompt
      │           ├─ xiaolin.v1.system.md
      │           │  # 晓琳案例系统 prompt
      │           ├─ jiayi.v1.system.md
      │           │  # 嘉怡案例系统 prompt
      │           └─ v1.user.md
      │              # 2-2 的用户模板 prompt（结构化上下文插槽）
      │        │
      │        └─ module-3-2.positive-rumination-feedback/
      │           ├─ v1.system.md
      │           │  # 3-2 反思反馈的系统 prompt
      │           └─ v1.user.md
      │              # 3-2 反思反馈的用户模板 prompt
      │
      │        ├─ module-4-2.thought-train-reflection/
      │        │  ├─ v1.system.md
      │        │  │  # 4-2 “想法火车”观察反馈的系统 prompt
      │        │  └─ v1.user.md
      │        │     # 4-2 “想法火车”观察反馈的用户模板 prompt
      │        │
      │        └─ module-4-2.boarding-impulse-reflection/
      │           ├─ v1.system.md
      │           │  # 4-2 “是否想跟着走”反馈的系统 prompt
      │           └─ v1.user.md
      │              # 4-2 “是否想跟着走”反馈的用户模板 prompt
      │
      │        └─ module-4-4.label-feedback/
      │           ├─ v1.system.md
      │           │  # 4-4 标签化反馈的系统 prompt
      │           └─ v1.user.md
      │              # 4-4 标签化反馈的用户模板 prompt
      │        ├─ module-4-6.supporter-response-feedback/
      │        │  ├─ v1.system.md
      │        │  │  # 4-6 支持者回应分析的系统 prompt
      │        │  └─ v1.user.md
      │        │     # 4-6 支持者回应分析的用户模板 prompt
      │        ├─ module-6-2.value-desire-insight/
      │        │  ├─ v1.system.md
      │        │  │  # 6-2 渴望/在乎洞察反馈的系统 prompt
      │        │  └─ v1.user.md
      │        │     # 6-2 渴望/在乎洞察反馈的用户模板 prompt
      │
      ├─ sessions/
      │  ├─ session.repository.ts
      │  │  # 当前用内存仓库存匿名 session
      │  └─ session.service.ts
      │     # 生成/确认 sessionId
      │
      └─ module-state/
         ├─ module-context.builder.ts
         │  # 把当前模块信息整理成“最小必要上下文”
         └─ module-state.service.ts
            # 当前用内存存模块上下文快照
```

---

## prompt 现在是否已经写好

是的，当前已接入节点对应的结构化 prompt 都已经写好，并已经挂进 prompt registry。

### 1-1 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-1-1.intro-reply.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-1-1.intro-reply/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-1-1.intro-reply/v1.user.md`

### 2-2 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-2-2.case-emotion-feedback.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-2-2.case-emotion-feedback/zhangtian.v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-2-2.case-emotion-feedback/xiaolin.v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-2-2.case-emotion-feedback/jiayi.v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-2-2.case-emotion-feedback/v1.user.md`

### 1-3 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-1-3.body-sensation-reflection.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-1-3.body-sensation-reflection/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-1-3.body-sensation-reflection/v1.user.md`
- `backend/src/modules/ai/prompt-registry/hooks/module-1-3.thought-reflection.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-1-3.thought-reflection/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-1-3.thought-reflection/v1.user.md`

### 3-2 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-3-2.positive-rumination-feedback.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-3-2.positive-rumination-feedback/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-3-2.positive-rumination-feedback/v1.user.md`

### 4-2 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-4-2.thought-train-reflection.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-2.thought-train-reflection/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-2.thought-train-reflection/v1.user.md`
- `backend/src/modules/ai/prompt-registry/hooks/module-4-2.boarding-impulse-reflection.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-2.boarding-impulse-reflection/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-2.boarding-impulse-reflection/v1.user.md`

### 4-4 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-4-4.label-feedback.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-4.label-feedback/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-4.label-feedback/v1.user.md`

### 4-6 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-4-6.supporter-response-feedback.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-6.supporter-response-feedback/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-4-6.supporter-response-feedback/v1.user.md`

### 6-2 prompt 位置

- `backend/src/modules/ai/prompt-registry/hooks/module-6-2.value-desire-insight.ts`
- `backend/src/modules/ai/prompt-registry/prompts/module-6-2.value-desire-insight/v1.system.md`
- `backend/src/modules/ai/prompt-registry/prompts/module-6-2.value-desire-insight/v1.user.md`

### 它们是如何工作的

1. 前端在指定节点调用 hook
2. 后端根据 `hookId` 找到对应 hook 配置
3. hook 配置再决定：
   - 用哪个模型
   - 用哪个版本
   - 用哪个 system prompt
   - 用哪个 user template
   - 输出最大长度
   - fallback key
4. 后端把结构化上下文填进 user template
5. 调用 DeepSeek
6. 输出校验不过就自动 fallback

---

## 为什么你现在“可能没感觉到大模型接入”

这通常有几种原因：

### 1. 后端其实没启动

即使前端能打开，如果后端没启动，当前前端会直接走 fallback，所以你表面上会感觉“还能用”，但实际上没真的调用模型。

### 2. `.env.local` 虽然有了，但后端没有成功读取

例如：

- 后端没从 `backend/` 目录启动
- `.env.local` 文件名不对
- `DEEPSEEK_API_KEY` 为空

### 3. 前端没有打到正确的 API 地址

当前本地默认会请求：

```text
http://127.0.0.1:8787
```

如果后端不在这里，前端同样会走 fallback。

### 4. 你看到的回复和 fallback 太像了

现在为了保证体验平稳，fallback 文案和模型目标语气都比较接近，所以光看“有没有一段话出现”不一定能立刻判断是不是模型生成。

---

## 怎么确认当前到底有没有走到模型

最简单的排查方式：

1. 启动后端后，看后端终端有没有收到请求日志。
2. 暂时把后端关掉，再试一次 `1-1` 或 `2-2`：
   - 如果页面还能走，只是回复变得固定，那说明之前确实可能走过后端。
3. 打开浏览器开发者工具的 `Network`：
   - 看是否出现 `POST /api/v1/ai/hooks/module-1-1.intro-reply`
   - 或 `POST /api/v1/ai/hooks/module-2-2.case-emotion-feedback`

只要这些请求出现，就说明前端已经开始调用后端了。

---

## 本地启动方式

### 1. 准备环境变量

复制：

```bash
cp .env.example .env.local
```

Windows 下也可以手动复制文件。

### 2. 安装依赖

```bash
npm install
```

### 3. 启动后端

```bash
npm run dev
```

默认端口：

```text
http://127.0.0.1:8787
```

### 4. 启动前端

前端仍然在项目根目录用：

```bash
python -m http.server 8000 --directory src
```

---

## 环境变量说明

### 必填

- `DEEPSEEK_API_KEY`
- `SESSION_SECRET`
- `DATABASE_URL`

### 当前阶段说明

虽然当前阶段还没有真正执行数据库迁移，但环境变量校验会要求 `DATABASE_URL` 非空，所以当前先保留示例值即可，后面接数据库时再替换。

---

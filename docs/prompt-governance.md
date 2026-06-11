# Prompt Governance

## 目标

prompt 必须集中管理、可版本化、可追踪、可回退，不能散落在各个前端模块和业务代码中。

## 当前规则

- 每个 AI 节点对应一个 `hookId`
- 每个 hook 对应一个独立配置文件
- prompt 文本存放在后端 `prompt-registry/prompts/`
- prompt 行为配置存放在后端 `prompt-registry/hooks/`
- 每个 hook 都有 `version`
- 每次 AI 调用都应记录 `hookId + version + model`

## 当前首批 hook

- `module-1-1.intro-reply`
- `module-2-2.case-emotion-feedback`

## 设计要求

- prompt 只描述该节点任务
- prompt 不负责整个模块流程
- prompt 不应引导模型推进未授权步骤
- prompt 必须限制输出长度和语气
- prompt 必须允许 fallback

## 后续扩展建议

后续新增 AI 节点时，统一遵循：

1. 先定义 hookId
2. 再新增 prompt 文本
3. 再新增 hook 配置
4. 再新增输出校验与 fallback
5. 最后才接入前端模块

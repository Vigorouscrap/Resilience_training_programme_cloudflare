# 项目架构设计文档

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│                    (页面容器)                            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     main.js                             │
│              (应用初始化和事件绑定)                      │
└─────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
    ┌────────────┬────────────┬────────────┬────────────┐
    │            │            │            │            │
  pages.js   dialogue.js   timer.js    ui.js      data.js
  (页面管理)  (对话逻辑)   (计时管理)  (UI组件)    (数据)
```

## 模块职责

### 1. **main.js** - 应用入口
**职责**：
- 初始化所有模块
- DOM元素获取和缓存
- 全局事件绑定
- 模块间通信协调

**核心函数**：
```javascript
initApp()  // 应用初始化
```

### 2. **pages.js** - 页面管理器
**职责**：
- 管理页面切换
- 控制计时器启停
- 导航状态管理

**主要方法**：
- `showHome()` - 显示主页
- `showDaily(weekIdx)` - 显示每日练习页
- `showPractice()` - 显示练习页
- `goBackToDaily()` - 返回每日练习页

### 3. **dialogue.js** - 对话管理器
**职责**：
- 管理各模块的对话流程
- 处理用户输入
- 维护对话状态
- 生成动态响应内容

**主要方法**：
- `resetForModule(module)` - 重置模块
- `onContinue()` - 继续按钮处理
- `handleUserMessage(text)` - 用户消息处理
- 各模块对话流程方法

### 4. **ui.js** - UI组件库
**职责**：
- 创建和操作UI元素
- 提供统一的UI函数接口
- 处理聊天界面操作

**主要函数**：
- `appendAiMessage()` - 添加AI消息
- `appendUserMessage()` - 添加用户消息
- `appendContinueButton()` - 添加继续按钮
- `appendButtonGroup()` - 添加按钮组
- `enableInput()` / `disableInput()` - 输入框控制

### 5. **timer.js** - 计时器
**职责**：
- 管理练习计时
- 提供时间显示

**主要方法**：
- `start()` - 启动计时
- `stop()` - 停止计时
- `reset()` - 重置计时

### 6. **data.js** - 数据配置
**职责**：
- 存储所有常量数据
- 提供数据接口

**导出数据**：
- `weekTitles[]` - 周标题
- `subModuleNames[][]` - 子模块名称
- `stateDescriptions{}` - 状态描述
- `dialogueTexts{}` - 对话文本

## 数据流

### 用户交互流程

```
用户点击周方块
    ↓
main.js 处理点击事件
    ↓
pageManager.showDaily(weekIdx)
    ↓
渲染子模块卡片
    ↓
用户选择模块
    ↓
dialogueManager.resetForModule(module)
    ↓
pageManager.showPractice()
    ↓
开始对话交互
    ↓
用户输入或点击按钮
    ↓
dialogueManager.handleUserMessage() 或 dialogueManager.onContinue()
    ↓
ui 函数生成响应内容
    ↓
更新聊天界面
```

## 状态管理

### DialogueManager 状态

```javascript
{
    step: number,              // 当前对话步骤
    currentModule: string,     // 当前模块ID (如 "1-1")
    participant: {             // 参与者信息
        name: string,
        habit: string,
        quality: string
    },
    module12State: {           // 模块1-2特定状态
        visitedButtons: Set,   // 已访问的按钮
        phase: string          // 当前阶段
    }
}
```

## 事件系统

### DOM事件绑定

| 事件源 | 事件类型 | 处理器 | 功能 |
|--------|---------|--------|------|
| 周方块 | click | showDaily | 切换到每日练习页 |
| 返回按钮 | click | showHome/goBackToDaily | 返回前一页 |
| 子模块卡片 | click | resetForModule + showPractice | 开始练习 |
| 继续按钮 | click | onContinue | 进行下一步 |
| 发送按钮 | click | handleUserMessage | 发送用户消息 |
| 输入框 | keypress | handleUserMessage | 回车发送 |

## CSS样式架构

### 样式分类

1. **全局样式** - 重置和基础样式
2. **页面容器** - home-page, daily-page, practice-page
3. **组件样式** - 卡片、按钮、输入框等
4. **状态样式** - hover, active, disabled 等
5. **响应式样式** - 移动端优化

### 主要样式块

- `.home-page` - 主页面布局
- `.grid` / `.week-tile` - 周方块网格
- `.card-list` / `.card` - 卡片列表
- `.chat-messages` - 聊天区域
- `.bubble-left` / `.bubble-right` - 消息气泡
- `.button-group` / `.state-button` - 按钮组
- `.input-area` - 输入区域

## 扩展点

### 添加新模块

1. **更新 data.js**
```javascript
// 在 subModuleNames 中添加新模块
subModuleNames[weekIdx].push('x-x 新模块名称');

// 添加对话文本
dialogueTexts.moduleXX = { ... };
```

2. **在 dialogue.js 中实现对话逻辑**
```javascript
onContinue_ModuleXX() {
    // 实现对话流程
}

// 在 onContinue() 中添加路由
if (this.currentModule === 'X-X') {
    this.onContinue_ModuleXX();
}
```

3. **处理用户输入**（如需要）
```javascript
handleUserMessage(text) {
    // 添加对应模块的输入处理
}
```

### 自定义样式主题

在 `styles.css` 中修改：
- 颜色变量
- 尺寸单位
- 字体设置
- 动画时长

## 性能考虑

1. **DOM操作**
   - 使用事件委托减少监听器数量
   - 批量更新DOM
   - 及时清理旧元素

2. **内存管理**
   - 避免循环引用
   - 及时清理计时器
   - 释放不需要的DOM引用

3. **加载性能**
   - 模块化设计便于懒加载
   - CSS样式优化
   - 图片优化和压缩

## 安全考虑

1. **输入验证**
   - 处理用户输入前进行验证
   - 防止XSS攻击

2. **数据隐私**
   - 所有用户数据本地存储
   - 不向服务器传输敏感信息

3. **代码质量**
   - 使用ES6 模块化
   - 严格模式
   - 错误处理

## 测试策略

### 单元测试
- 测试各模块的核心函数
- 测试对话逻辑
- 测试状态管理

### 集成测试
- 测试页面切换流程
- 测试用户交互流程
- 测试数据流

### 用户界面测试
- 测试布局响应性
- 测试浏览器兼容性
- 测试无障碍特性

---

**文档版本**: 1.0
**最后更新**: 2024年

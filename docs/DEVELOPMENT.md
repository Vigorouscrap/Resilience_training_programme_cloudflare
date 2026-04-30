# 开发指南

## 项目设置

### 本地开发环境

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/resilience-programme.git
cd resilience-programme-app
```

#### 2. 启动本地服务器
```bash
# 方法1：使用 Python（推荐）
python -m http.server 8000 --directory src

# 方法2：使用 Node.js (http-server)
npx http-server src -p 8000

# 方法3：使用 VS Code Live Server 扩展
# 右键点击 src/index.html，选择 "Open with Live Server"
```

#### 3. 打开浏览器
访问 http://localhost:8000

## 代码结构详解

### HTML 结构
```html
<!-- 三个主要页面容器 -->
<div class="home-page">          <!-- 主页面 -->
<div class="daily-page">         <!-- 每日练习列表 -->
<div class="practice-page">      <!-- 练习交互页面 -->
```

### JavaScript 模块化结构

每个模块都是一个独立的 ES6 模块，通过 `import/export` 相互通信。

#### 导入示例
```javascript
import { PageManager } from './pages.js';
import { PracticeTimer } from './timer.js';
import { appendAiMessage } from './ui.js';
import { weekTitles, subModuleNames } from './data.js';
```

## 添加新功能

### 场景 1：添加新的对话模块

**步骤 1**：更新 data.js
```javascript
// 在 subModuleNames 中添加
subModuleNames[0].push('1-8 新模块名称');

// 添加对话文本（可选）
export const dialogueTexts = {
    module18: {
        intro: '欢迎来到新模块...'
    }
};
```

**步骤 2**：在 dialogue.js 中实现对话流程
```javascript
onContinue_Module18() {
    if (this.step === -1) {
        appendAiMessage(this.chatMessages, '你好，欢迎来到第八个模块！', true);
        this.step = 0;
    } else if (this.step === 0) {
        // 继续实现对话逻辑
    }
}

// 在 onContinue() 方法中添加路由
if (this.currentModule === '1-8') {
    this.onContinue_Module18();
}
```

**步骤 3**：在 main.js 中配置模块处理（如需特殊处理）
```javascript
subModulesDiv.addEventListener('click', e => {
    const card = e.target.closest('.daily-sub');
    if (!card) return;
    const moduleId = `${week}-${day}`;
    
    // 如果需要特殊处理
    if (moduleId === '1-8') {
        // 特殊处理逻辑
    }
});
```

### 场景 2：修改页面样式

**编辑 src/css/styles.css**：

```css
/* 例如：修改按钮颜色 */
.state-button {
    background: #your-new-color;
    border: 2px solid #your-border-color;
    /* ... 其他属性 ... */
}

/* 添加新的样式类 */
.new-component {
    background: linear-gradient(135deg, #color1, #color2);
    padding: 1rem;
    border-radius: 1rem;
    /* ... */
}
```

### 场景 3：添加新的 UI 组件

**在 ui.js 中添加新函数**：

```javascript
/**
 * 添加自定义卡片
 */
export function appendCustomCard(chatMessages, title, content, actions = []) {
    const card = document.createElement('div');
    card.className = 'custom-card';
    card.innerHTML = `
        <h3>${title}</h3>
        <p>${content}</p>
    `;
    
    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.innerText = action.text;
        btn.addEventListener('click', action.callback);
        card.appendChild(btn);
    });
    
    chatMessages.appendChild(card);
    scrollChat(chatMessages);
}
```

**在对话逻辑中使用**：
```javascript
import { appendCustomCard } from './ui.js';

// 在对话方法中使用
appendCustomCard(this.chatMessages, '标题', '内容', [
    { text: '确定', callback: () => { /* ... */ } },
    { text: '取消', callback: () => { /* ... */ } }
]);
```

### 场景 4：添加特殊交互功能

**例如：实现用户评分功能**

**1. 在 ui.js 中添加**：
```javascript
export function appendRatingComponent(chatMessages, question, onRate) {
    const container = document.createElement('div');
    container.className = 'rating-container';
    
    const text = document.createElement('p');
    text.innerText = question;
    container.appendChild(text);
    
    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.className = 'rating-btn';
        btn.innerText = '★' + i;
        btn.dataset.rating = i;
        btn.addEventListener('click', () => onRate(i));
        container.appendChild(btn);
    }
    
    chatMessages.appendChild(container);
    scrollChat(chatMessages);
}
```

**2. 在 dialogue.js 中使用**：
```javascript
import { appendRatingComponent } from './ui.js';

onContinue_ModuleXX() {
    if (this.step === someStep) {
        appendRatingComponent(
            this.chatMessages,
            '这个练习对你有帮助吗？',
            (rating) => {
                appendUserMessage(this.chatMessages, `我给这个练习打了 ${rating} 颗星`);
                // 继续下一步
                this.step++;
                this.onContinue();
            }
        );
    }
}
```

**3. 在 styles.css 中添加样式**：
```css
.rating-container {
    background: #ecf3fd;
    padding: 1.5rem;
    border-radius: 1rem;
    text-align: center;
}

.rating-btn {
    background: white;
    border: 2px solid #7ba5cf;
    padding: 0.5rem 1rem;
    margin: 0.5rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s;
}

.rating-btn:hover {
    background: #dbeafe;
    transform: scale(1.1);
}
```

## 调试技巧

### 1. 浏览器开发者工具
```javascript
// 在对话逻辑中添加调试日志
console.log('当前模块:', this.currentModule);
console.log('当前步骤:', this.step);
console.log('参与者信息:', this.participant);
```

### 2. 断点调试
在 Chrome 开发者工具中：
1. 打开 Sources 标签
2. 在代码中点击行号设置断点
3. 刷新页面触发代码
4. 使用调试工具单步执行

### 3. 查看元素
```javascript
// 检查消息容器
console.log('消息数量:', document.querySelectorAll('.message-row-left, .message-row-right').length);

// 检查输入框状态
console.log('输入框启用:', !document.getElementById('userInput').disabled);
```

## 性能优化

### 1. 减少 DOM 操作
```javascript
// 不好的做法：频繁操作 DOM
for (let i = 0; i < 100; i++) {
    chatMessages.appendChild(createMessage(i));
}

// 好的做法：使用 DocumentFragment
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
    fragment.appendChild(createMessage(i));
}
chatMessages.appendChild(fragment);
```

### 2. 事件委托
```javascript
// 不好的做法：为每个按钮添加监听器
buttons.forEach(btn => {
    btn.addEventListener('click', handleClick);
});

// 好的做法：使用事件委托
container.addEventListener('click', e => {
    if (e.target.matches('.button-class')) {
        handleClick(e);
    }
});
```

### 3. 防抖和节流
```javascript
// 防抖：等待用户停止输入后再处理
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// 在输入框中使用
userInput.addEventListener('input', debounce((e) => {
    // 处理输入
}, 300));
```

## 常见问题

### Q1：如何修改对话内容？
**A**：编辑 `src/js/dialogue.js` 中对应模块的方法，修改 `appendAiMessage()` 的文本参数。

### Q2：如何改变颜色主题？
**A**：编辑 `src/css/styles.css`，修改渐变颜色、背景颜色等属性。主要颜色集中在 `#2b5f87`、`#1e4a72`、`#4f8bb9` 等处。

### Q3：如何添加背景音乐或音效？
**A**：在 `ui.js` 中添加音频播放函数，在对话逻辑中调用。

```javascript
export function playSound(url) {
    const audio = new Audio(url);
    audio.play();
}
```

### Q4：如何保存用户进度？
**A**：使用 LocalStorage：

```javascript
// 保存进度
localStorage.setItem('currentModule', this.currentModule);
localStorage.setItem('currentStep', this.step);

// 读取进度
const savedModule = localStorage.getItem('currentModule');
```

### Q5：页面响应缓慢怎么办？
**A**：
1. 检查是否有无限循环或阻塞操作
2. 减少频繁的 DOM 更新
3. 使用浏览器性能分析工具

## 提交代码

### 提交前检查
```bash
# 查看修改
git status
git diff

# 添加修改
git add .

# 提交
git commit -m "简洁明了的提交信息"

# 推送
git push origin main
```

### 提交信息规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
perf: 性能优化
test: 添加测试
```

---

**提示**：定期保存代码，使用有意义的提交信息便于后续维护。

/**
 * ui.js - UI 组件和元素操作
 * 负责创建和操作各种UI元素
 */

const revealStateKey = Symbol('dialogueRevealState');

function getRevealState(chatMessages) {
    if (!chatMessages[revealStateKey]) {
        chatMessages[revealStateKey] = {
            batchDepth: 0,
            immediateContentCount: 0,
            immediateLastContentType: null,
            pendingSegments: [],
            currentPendingSegment: null
        };
    }

    return chatMessages[revealStateKey];
}

function appendContinueButtonNow(chatMessages, delaySeconds = 0) {
    if (document.querySelector('.continue-wrapper')) return;
    const wrap = document.createElement('div');
    wrap.className = 'continue-wrapper';
    const btn = document.createElement('div');
    btn.className = 'continue-btn';
    btn.id = 'continueBtn';
    if (delaySeconds > 0) {
        btn.classList.add('disabled');
        btn.innerText = `⏳ ${delaySeconds} 秒后继续`;
        let remaining = delaySeconds;
        const timer = setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
                btn.innerText = `⏳ ${remaining} 秒后继续`;
            } else {
                clearInterval(timer);
                btn.classList.remove('disabled');
                btn.innerText = '⏵ 点击继续';
            }
        }, 1000);
    } else {
        btn.innerText = '⏵ 点击继续';
    }
    wrap.appendChild(btn);
    chatMessages.appendChild(wrap);
    scrollChat(chatMessages);
}

function appendContentOrQueue(chatMessages, contentType, action) {
    const state = getRevealState(chatMessages);

    if (state.batchDepth <= 0) {
        action();
        return;
    }

    if (state.immediateContentCount === 0 && state.pendingSegments.length === 0) {
        state.immediateContentCount = 1;
        state.immediateLastContentType = contentType;
        action();
        return;
    }

    let segment = state.currentPendingSegment;
    if (!segment || segment.hasContent) {
        segment = {
            actions: [],
            hasContent: false,
            lastContentType: null
        };
        state.pendingSegments.push(segment);
        state.currentPendingSegment = segment;
    }

    segment.actions.push(action);
    segment.hasContent = true;
    segment.lastContentType = contentType;
}

function appendControlOrQueue(chatMessages, action, splitAfterCard = false) {
    const state = getRevealState(chatMessages);

    if (state.batchDepth <= 0) {
        action();
        return;
    }

    let segment = state.currentPendingSegment;

    if (
        splitAfterCard &&
        !segment &&
        state.immediateContentCount > 0 &&
        state.immediateLastContentType === 'card'
    ) {
        segment = {
            actions: [],
            hasContent: false,
            lastContentType: null
        };
        state.pendingSegments.push(segment);
        state.currentPendingSegment = segment;
    }

    if (segment && splitAfterCard && segment.lastContentType === 'card') {
        segment = {
            actions: [],
            hasContent: false,
            lastContentType: null
        };
        state.pendingSegments.push(segment);
        state.currentPendingSegment = segment;
    }

    if (segment) {
        segment.actions.push(action);
        return;
    }

    action();
}

export function beginSequentialRender(chatMessages) {
    const state = getRevealState(chatMessages);
    if (state.batchDepth === 0) {
        state.immediateContentCount = 0;
        state.immediateLastContentType = null;
        state.pendingSegments = [];
        state.currentPendingSegment = null;
    }

    state.batchDepth += 1;
}

export function endSequentialRender(chatMessages) {
    const state = getRevealState(chatMessages);
    if (state.batchDepth <= 0) return;

    state.batchDepth -= 1;
    if (state.batchDepth > 0) return;

    state.currentPendingSegment = null;
    if (state.pendingSegments.length > 0 && !document.querySelector('.continue-wrapper')) {
        appendContinueButtonNow(chatMessages);
    }
}

export function consumePendingSequentialRender(chatMessages) {
    const state = getRevealState(chatMessages);
    if (state.pendingSegments.length === 0) return false;

    removeContinueButton();
    const segment = state.pendingSegments.shift();
    state.currentPendingSegment = state.pendingSegments[state.pendingSegments.length - 1] || null;
    segment.actions.forEach(action => action());

    if (state.pendingSegments.length > 0 && !document.querySelector('.continue-wrapper')) {
        appendContinueButtonNow(chatMessages);
    }

    return true;
}

export function queueUiMutation(chatMessages, action, splitAfterCard = false) {
    appendControlOrQueue(chatMessages, action, splitAfterCard);
}

export function resetSequentialRender(chatMessages) {
    const state = getRevealState(chatMessages);
    state.batchDepth = 0;
    state.immediateContentCount = 0;
    state.immediateLastContentType = null;
    state.pendingSegments = [];
    state.currentPendingSegment = null;
}

/**
 * 添加AI消息气泡
 * @param {HTMLElement} chatMessages - 聊天消息容器
 * @param {string} text - 消息文本
 * @param {boolean} withContinue - 是否显示继续按钮
 */
function prepareMessageHtml(text) {
    const container = document.createElement('div');
    container.innerHTML = String(text);

    container.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

    return container.innerHTML;
}

export function appendAiMessage(chatMessages, text, withContinue = false) {
    appendContentOrQueue(chatMessages, 'message', () => {
        const row = document.createElement('div');
        row.className = 'message-row-left';
        row.innerHTML = `<div class="avatar">🧑‍🏫</div><div class="bubble-left">${prepareMessageHtml(text)}</div>`;
        chatMessages.appendChild(row);
        scrollChat(chatMessages);

        if (withContinue) {     /*是否自动添加继续按钮*/
            if (!document.querySelector('.continue-wrapper')) {
                appendContinueButtonNow(chatMessages);
            }
        }
    });
}

/**
 * 添加用户消息气泡
 */
export function appendUserMessage(chatMessages, text) {
    const row = document.createElement('div');
    row.className = 'message-row-right';
    row.innerHTML = `<div class="bubble-right">${text}</div>`;
    chatMessages.appendChild(row);
    scrollChat(chatMessages);
}

/**
 * 添加特殊卡片
 */
export function appendSpecialCard(chatMessages, html) {
    appendContentOrQueue(chatMessages, 'card', () => {
        const card = document.createElement('div');
        card.className = 'special-card';
        card.innerHTML = html;
        chatMessages.appendChild(card);
        scrollChat(chatMessages);
    });
}

/**
 * 添加继续按钮
 */
export function appendContinueButton(chatMessages, delaySeconds = 0) {
    appendControlOrQueue(chatMessages, () => appendContinueButtonNow(chatMessages, delaySeconds));
}

/**
 * 移除继续按钮
 */
export function removeContinueButton() {
    const btn = document.querySelector('.continue-wrapper');
    if (btn) btn.remove();
}

/**
 * 添加提示文本
 */
export function appendHint(chatMessages, text) {
    appendControlOrQueue(chatMessages, () => {
        const hint = document.createElement('div');
        hint.className = 'hint-text';
        hint.innerText = text;
        chatMessages.appendChild(hint);
        scrollChat(chatMessages);
    }, true);
}

/**
 * 滚动到聊天底部
 */
export function scrollChat(chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function getChatSessionId(chatMessages) {
    return chatMessages?.dataset?.dialogueSessionId || '';
}

export function isChatSessionActive(chatMessages, sessionId) {
    return getChatSessionId(chatMessages) === sessionId;
}

/**
 * 启用输入区
 */
export function enableInput(inputArea, userInput) {
    inputArea.classList.remove('disabled');
    userInput.disabled = false;
    userInput.parentElement.querySelector('button').disabled = false;
    userInput.focus();
}

/**
 * 禁用输入区
 */
export function disableInput(inputArea, userInput) {
    inputArea.classList.add('disabled');
    userInput.disabled = true;
    userInput.parentElement.querySelector('button').disabled = true;
}

/**
 * 添加按钮组
 */
export function appendButtonGroup(chatMessages, buttons, onClickCallback) {
    appendControlOrQueue(chatMessages, () => {
        const wrap = document.createElement('div');
        wrap.className = 'button-group';
        buttons.forEach(btnText => {
            const btn = document.createElement('button');
            btn.className = 'state-button';
            btn.innerText = btnText;
            btn.dataset.state = btnText;
            btn.addEventListener('click', () => {
                if (wrap.dataset.locked === 'true') return;
                wrap.dataset.locked = 'true';
                wrap.querySelectorAll('button').forEach(button => {
                    button.disabled = true;
                });
                beginSequentialRender(chatMessages);
                try {
                    onClickCallback(btnText, btn);
                } finally {
                    endSequentialRender(chatMessages);
                }
            });
            wrap.appendChild(btn);
        });
        chatMessages.appendChild(wrap);
        scrollChat(chatMessages);
    }, true);
}

/**
 * 添加操作按钮（卡片下方）
 */
export function appendCardActionButtons(chatMessages, showCompleteBtn = false, onBackClick, onCompleteClick) {
    appendControlOrQueue(chatMessages, () => {
        const wrap = document.createElement('div');
        wrap.className = 'card-action-buttons';
        
        const backBtn = document.createElement('button');
        backBtn.className = 'card-btn';
        backBtn.innerText = '返回上一步';
        backBtn.addEventListener('click', () => {
            beginSequentialRender(chatMessages);
            try {
                onBackClick();
            } finally {
                endSequentialRender(chatMessages);
            }
        });
        wrap.appendChild(backBtn);
        
        if (showCompleteBtn) {
            const completeBtn = document.createElement('button');
            completeBtn.className = 'card-btn primary';
            completeBtn.innerText = '已全部了解';
            completeBtn.addEventListener('click', () => {
                beginSequentialRender(chatMessages);
                try {
                    onCompleteClick();
                } finally {
                    endSequentialRender(chatMessages);
                }
            });
            wrap.appendChild(completeBtn);
        }
        
        chatMessages.appendChild(wrap);
        scrollChat(chatMessages);
    });
}

/**
 * 添加"已了解"按钮
 */
export function appendUnderstandButton(chatMessages, callback) {
    appendControlOrQueue(chatMessages, () => {
        const wrap = document.createElement('div');
        wrap.className = 'button-group';
        const btn = document.createElement('button');
        btn.className = 'understand-btn';
        btn.innerText = '已了解';
        btn.addEventListener('click', () => {
            if (wrap.dataset.locked === 'true') return;
            wrap.dataset.locked = 'true';
            btn.disabled = true;
            wrap.remove();
            beginSequentialRender(chatMessages);
            try {
                callback();
            } finally {
                endSequentialRender(chatMessages);
            }
        });
        wrap.appendChild(btn);
        chatMessages.appendChild(wrap);
        scrollChat(chatMessages);
    });
}

/**
 * 添加带计时器的卡片
 */
export function appendTimedCard(chatMessages, content, delaySeconds = 30, onTimerComplete = null) {
    appendContentOrQueue(chatMessages, 'card', () => {
        const card = document.createElement('div');
        card.className = 'special-card';
        card.innerHTML = content;
        chatMessages.appendChild(card);
        const sessionId = getChatSessionId(chatMessages);
        const deadline = Date.now() + (delaySeconds * 1000);
        
        // 添加计时器
        const timerDiv = document.createElement('div');
        timerDiv.className = 'card-timer';
        let remaining = delaySeconds;
        timerDiv.innerText = `⏳ ${remaining}秒后可继续`;
        card.appendChild(timerDiv);
        
        const timer = setInterval(() => {
            if (!isChatSessionActive(chatMessages, sessionId)) {
                clearInterval(timer);
                return;
            }
            remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            if (remaining > 0) {
                timerDiv.innerText = `⏳ ${remaining}秒后可继续`;
            } else {
                clearInterval(timer);
                if (!isChatSessionActive(chatMessages, sessionId)) return;
                timerDiv.innerText = '✓ 可以继续';
                // 显示继续按钮
                appendContinueButton(chatMessages);
                if (onTimerComplete) {
                    beginSequentialRender(chatMessages);
                    try {
                        onTimerComplete();
                    } finally {
                        endSequentialRender(chatMessages);
                    }
                }
            }
        }, 1000);
        
        scrollChat(chatMessages);
    });
}

/**
 * 添加计时消息
 */
export function appendAiMessageWithTimer(chatMessages, text, delayMs, callback) {
    appendContentOrQueue(chatMessages, 'message', () => {
        const row = document.createElement('div');
        row.className = 'message-row-left';
        
        // 创建一个容器来放消息和计时器
        const messageContainer = document.createElement('div');
        messageContainer.style.display = 'flex';
        messageContainer.style.alignItems = 'flex-end';
        messageContainer.style.gap = '0.7rem';
        messageContainer.style.maxWidth = '90%';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerText = '🧑‍🏫';

        const bubble = document.createElement('div');
        bubble.className = 'bubble-left';
        bubble.innerHTML = prepareMessageHtml(text);

        const timer = document.createElement('div');
        timer.className = 'card-timer';
        timer.innerText = '⏳ ' + Math.ceil(delayMs / 1000) + 's';
        timer.style.marginLeft = 'auto';
        timer.style.whiteSpace = 'nowrap';

        messageContainer.appendChild(avatar);
        messageContainer.appendChild(bubble);
        messageContainer.appendChild(timer);
        row.appendChild(messageContainer);

        chatMessages.appendChild(row);
        scrollChat(chatMessages);
        const sessionId = getChatSessionId(chatMessages);
        const deadline = Date.now() + delayMs;

        // 计时递减
        let remainingMs = delayMs;
        const timerInterval = setInterval(() => {
            if (!isChatSessionActive(chatMessages, sessionId)) {
                clearInterval(timerInterval);
                return;
            }
            remainingMs = Math.max(0, deadline - Date.now());
            if (remainingMs > 0) {
                timer.innerText = '⏳ ' + Math.ceil(remainingMs / 1000) + 's';
            } else {
                clearInterval(timerInterval);
                timer.innerText = '✓';
                setTimeout(() => {
                    if (!isChatSessionActive(chatMessages, sessionId)) return;
                    beginSequentialRender(chatMessages);
                    try {
                        callback();
                    } finally {
                        endSequentialRender(chatMessages);
                    }
                }, 100);
            }
        }, 100);
    });
}

/**
 * ui.js - UI 组件和元素操作
 * 负责创建和操作各种UI元素
 */

const revealStateKey = Symbol('dialogueRevealState');
const waitStateKey = Symbol('dialogueWaitState');

function getTestingConfig() {
    const config = globalThis.__RESILIENCE_TESTING__;
    return config && typeof config === 'object' ? config : {};
}

export function shouldSkipWaits() {
    const config = getTestingConfig();
    return Boolean(config.skipWaits);
}

function shouldShowSkipControl() {
    const config = getTestingConfig();
    return Boolean(config.skipMode || config.skipWaits);
}

function createSkipButton(label = '跳过等待') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wait-skip-btn';
    btn.innerText = label;
    return btn;
}

function attachSkipControl(host, controller, label = '跳过等待') {
    if (!host || !controller || typeof controller.skip !== 'function' || !shouldShowSkipControl()) {
        return null;
    }

    const btn = createSkipButton(label);
    btn.addEventListener('click', () => {
        controller.skip();
    });
    host.appendChild(btn);
    return btn;
}

function getWaitState(chatMessages) {
    if (!chatMessages[waitStateKey]) {
        chatMessages[waitStateKey] = {
            activeWait: null
        };
    }

    return chatMessages[waitStateKey];
}

export function registerManagedWait(chatMessages, controller) {
    if (!chatMessages || !controller || typeof controller.skip !== 'function') return null;
    const state = getWaitState(chatMessages);
    state.activeWait = controller;
    return controller;
}

export function clearManagedWait(chatMessages, controller = null) {
    if (!chatMessages) return;
    const state = getWaitState(chatMessages);
    if (!controller || state.activeWait === controller) {
        state.activeWait = null;
    }
}

export function skipCurrentWait(chatMessages) {
    if (!chatMessages) return false;
    const state = getWaitState(chatMessages);
    const activeWait = state.activeWait;
    if (!activeWait || typeof activeWait.skip !== 'function') return false;
    activeWait.skip();
    return true;
}

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
    const shouldDelay = delaySeconds > 0 && !shouldSkipWaits();

    if (shouldDelay) {
        btn.classList.add('disabled');
        btn.innerText = `⏳ ${delaySeconds} 秒后继续`;
        let remaining = delaySeconds;
        let finished = false;
        let timer = null;

        const controller = registerManagedWait(chatMessages, {
            type: 'continue-delay',
            skip: () => {
                if (finished) return;
                finished = true;
                if (timer) clearInterval(timer);
                clearManagedWait(chatMessages, controller);
                btn.classList.remove('disabled');
                btn.innerText = '⏵ 点击继续';
            }
        });
        attachSkipControl(wrap, controller, '跳过倒计时');

        timer = setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
                btn.innerText = `⏳ ${remaining} 秒后继续`;
            } else {
                clearInterval(timer);
                finished = true;
                clearManagedWait(chatMessages, controller);
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

function appendCountdownTimerRow(chatMessages, align = 'auto') {
    const wrap = document.createElement('div');
    wrap.className = 'countdown-wrapper';

    const lastElement = chatMessages.lastElementChild;
    const resolvedAlign = align === 'auto'
        ? (lastElement?.classList?.contains('message-row-left') ? 'message' : 'card')
        : align;

    wrap.classList.add(resolvedAlign === 'message' ? 'after-message' : 'after-card');

    const timer = document.createElement('div');
    timer.className = 'card-timer';
    wrap.appendChild(timer);
    chatMessages.appendChild(wrap);
    scrollChat(chatMessages);
    return timer;
}

function startBottomCountdownNow(chatMessages, seconds, readyText, onComplete, options = {}) {
    const sessionId = getChatSessionId(chatMessages);
    const tickMs = options.tickMs ?? 250;
    const formatCountdownText = options.formatCountdownText || (remaining => `⏳ ${remaining}秒后${readyText}`);
    const formatReadyText = options.formatReadyText || (() => readyText);
    const skipWait = shouldSkipWaits();

    if (seconds <= 0 || skipWait) {
        if (onComplete) onComplete();
        return;
    }

    const deadline = Date.now() + (seconds * 1000);
    const timerDiv = appendCountdownTimerRow(chatMessages, options.align);
    let remaining = seconds;
    let finished = false;
    timerDiv.innerText = formatCountdownText(remaining);

    let timer = null;
    const controller = registerManagedWait(chatMessages, {
        type: 'countdown',
        skip: () => {
            if (finished) return;
            finished = true;
            if (timer) clearInterval(timer);
            clearManagedWait(chatMessages, controller);
            if (!isChatSessionActive(chatMessages, sessionId)) return;
            timerDiv.innerText = formatReadyText();
            if (onComplete) onComplete();
        }
    });
    attachSkipControl(timerDiv.parentElement, controller, '跳过倒计时');

    timer = setInterval(() => {
        if (!isChatSessionActive(chatMessages, sessionId)) {
            clearInterval(timer);
            clearManagedWait(chatMessages, controller);
            return;
        }

        remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (remaining > 0) {
            timerDiv.innerText = formatCountdownText(remaining);
            return;
        }

        clearInterval(timer);
        finished = true;
        clearManagedWait(chatMessages, controller);
        if (!isChatSessionActive(chatMessages, sessionId)) return;
        timerDiv.innerText = formatReadyText();
        if (onComplete) onComplete();
    }, tickMs);
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

export function startBottomCountdown(chatMessages, seconds, readyText, onComplete, options = {}) {
    queueUiMutation(chatMessages, () => {
        startBottomCountdownNow(chatMessages, seconds, readyText, onComplete, options);
    });
}

export function resetSequentialRender(chatMessages) {
    const state = getRevealState(chatMessages);
    state.batchDepth = 0;
    state.immediateContentCount = 0;
    state.immediateLastContentType = null;
    state.pendingSegments = [];
    state.currentPendingSegment = null;
    clearManagedWait(chatMessages);
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

function createAiAvatar() {
    const avatar = document.createElement('div');
    avatar.className = 'avatar ai-avatar';
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'AI 疗愈助手');
    return avatar;
}

export function appendAiMessage(chatMessages, text, withContinue = false) {
    appendContentOrQueue(chatMessages, 'message', () => {
        const row = document.createElement('div');
        row.className = 'message-row-left';
        row.appendChild(createAiAvatar());

        const bubble = document.createElement('div');
        bubble.className = 'bubble-left';
        bubble.innerHTML = prepareMessageHtml(text);
        row.appendChild(bubble);

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

export function appendDialogueCard(chatMessages, options = {}) {
    appendContentOrQueue(chatMessages, 'card', () => {
        const cardKey = options.cardKey ? String(options.cardKey) : '';
        let card = null;

        if (cardKey) {
            card = chatMessages.querySelector(`.dialogue-card[data-dialogue-card-key="${cardKey}"]`);
        }

        if (!card) {
            card = document.createElement('section');
            card.className = 'special-card dialogue-card';
            card.setAttribute('role', 'group');
            if (cardKey) {
                card.dataset.dialogueCardKey = cardKey;
            }

            if (options.title) {
                const title = document.createElement('p');
                title.className = 'dialogue-card-title';
                title.innerText = options.title;
                card.appendChild(title);
            }

            chatMessages.appendChild(card);
        }

        const items = Array.isArray(options.items) ? options.items : [];
        items.forEach((item) => {
            const row = document.createElement('div');
            const side = item?.side === 'right' ? 'right' : 'left';
            row.className = `dialogue-card-row ${side === 'right' ? 'is-supporter' : 'is-client'}`;

            const meta = document.createElement('div');
            meta.className = 'dialogue-card-meta';
            meta.innerText = item?.label || '';

            const bubble = document.createElement('div');
            bubble.className = `dialogue-card-bubble ${side === 'right' ? 'dialogue-card-bubble-right' : 'dialogue-card-bubble-left'}`;
            bubble.innerHTML = prepareMessageHtml(item?.text || '');

            row.appendChild(meta);
            row.appendChild(bubble);
            card.appendChild(row);
        });

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

export function stopManagedMedia(root = document, options = {}) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    const shouldReset = options.reset !== false;

    root.querySelectorAll('audio, video').forEach((mediaElement) => {
        try {
            mediaElement.pause();
        } catch (error) {
            // Ignore pause failures from partially initialized media elements.
        }

        if (!shouldReset) return;

        try {
            mediaElement.currentTime = 0;
        } catch (error) {
            // Some media elements cannot seek until metadata is available.
        }
    });
}

export function playManagedAudio(root = document, audioSrc, options = {}) {
    if (!root || !audioSrc || typeof root.appendChild !== 'function') return null;

    let audioElement = null;
    queueUiMutation(root, () => {
        stopManagedMedia(root, { reset: options.reset !== false });

        audioElement = document.createElement('audio');
        audioElement.className = 'managed-audio';
        audioElement.preload = options.preload || 'auto';
        audioElement.playsInline = true;
        audioElement.hidden = true;
        audioElement.setAttribute('aria-hidden', 'true');

        if (options.mimeType) {
            const sourceElement = document.createElement('source');
            sourceElement.src = audioSrc;
            sourceElement.type = options.mimeType;
            audioElement.appendChild(sourceElement);
        } else {
            audioElement.src = audioSrc;
        }

        let finished = false;
        const sessionId = options.sessionId ?? getChatSessionId(root);
        const onEnded = typeof options.onEnded === 'function' ? options.onEnded : null;
        const synth = globalThis.speechSynthesis;

        const cleanup = () => {
            if (audioElement?.parentNode) {
                audioElement.parentNode.removeChild(audioElement);
            }
        };

        const controller = registerManagedWait(root, {
            type: 'audio',
            skip: () => {
                if (finished) return;
                try {
                    audioElement?.pause();
                } catch (error) {
                    // Ignore pause failures from partially initialized media elements.
                }
                if (synth && typeof synth.cancel === 'function') {
                    synth.cancel();
                }
                finalize();
            }
        });
        const skipControlHost = document.createElement('div');
        skipControlHost.className = 'countdown-wrapper after-card';
        attachSkipControl(skipControlHost, controller, '跳过音频');

        const finalize = () => {
            if (finished) return;
            finished = true;
            clearManagedWait(root, controller);
            if (skipControlHost.parentNode) {
                skipControlHost.parentNode.removeChild(skipControlHost);
            }
            cleanup();
            if (!onEnded) return;
            if (sessionId && !isChatSessionActive(root, sessionId)) return;
            onEnded();
        };

        audioElement.addEventListener('ended', finalize, { once: true });
        audioElement.addEventListener('error', finalize, { once: true });

        root.appendChild(audioElement);
        if (skipControlHost.childElementCount > 0) {
            root.appendChild(skipControlHost);
            scrollChat(root);
        }

        const startPlayback = () => {
            if (shouldSkipWaits()) {
                setTimeout(() => {
                    controller?.skip();
                }, 0);
                return;
            }

            const playResult = audioElement.play();
            if (playResult && typeof playResult.catch === 'function') {
                playResult.catch(() => {
                    finalize();
                });
            }
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(startPlayback);
        });
    }, options.splitAfterCard === true);

    return audioElement;
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
        {
            const timedCard = document.createElement('div');
            timedCard.className = 'special-card';
            timedCard.innerHTML = content;
            chatMessages.appendChild(timedCard);
            scrollChat(chatMessages);

            startBottomCountdownNow(
                chatMessages,
                delaySeconds,
                '可继续',
                () => {
                    appendContinueButton(chatMessages);
                    if (onTimerComplete) {
                        beginSequentialRender(chatMessages);
                        try {
                            onTimerComplete();
                        } finally {
                            endSequentialRender(chatMessages);
                        }
                    }
                },
                {
                    align: 'card',
                    tickMs: 1000,
                    formatCountdownText: remaining => `⏳ ${remaining}秒后可继续`,
                    formatReadyText: () => '✓ 可以继续'
                }
            );
            return;
        }
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
export function appendAiMessageWithTimer(chatMessages, text, delayMs, callback, options = {}) {
    const hideCountdown = Boolean(options.hideCountdown);
    appendContentOrQueue(chatMessages, 'message', () => {
        {
            const timedRow = document.createElement('div');
            timedRow.className = 'message-row-left';

            const timedBubble = document.createElement('div');
            timedBubble.className = 'bubble-left';
            timedBubble.innerHTML = prepareMessageHtml(text);

            timedRow.appendChild(createAiAvatar());
            timedRow.appendChild(timedBubble);
            chatMessages.appendChild(timedRow);
            scrollChat(chatMessages);

            const timedSessionId = getChatSessionId(chatMessages);
            const timedDeadline = Date.now() + delayMs;
            const timedIndicator = hideCountdown ? null : appendCountdownTimerRow(chatMessages, 'message');
            const timedSkipHost = hideCountdown
                ? (shouldShowSkipControl()
                    ? (() => {
                        const wrap = document.createElement('div');
                        wrap.className = 'countdown-wrapper after-message';
                        chatMessages.appendChild(wrap);
                        scrollChat(chatMessages);
                        return wrap;
                    })()
                    : null)
                : timedIndicator?.parentElement || null;

            if (timedIndicator) {
                timedIndicator.innerText = '⏳ ' + Math.ceil(delayMs / 1000) + 's';
            }

            if (shouldSkipWaits()) {
                if (timedIndicator) {
                    timedIndicator.innerText = '✓';
                }
                setTimeout(() => {
                    if (!isChatSessionActive(chatMessages, timedSessionId)) return;
                    beginSequentialRender(chatMessages);
                    try {
                        callback();
                    } finally {
                        endSequentialRender(chatMessages);
                    }
                }, 0);
                return;
            }

            let remainingMs = delayMs;
            let finished = false;
            let timerInterval = null;

            const controller = registerManagedWait(chatMessages, {
                type: 'message-timer',
                skip: () => {
                    if (finished) return;
                    finished = true;
                    if (timerInterval) clearInterval(timerInterval);
                    clearManagedWait(chatMessages, controller);
                    if (timedIndicator) {
                        timedIndicator.innerText = '✓';
                    }
                    setTimeout(() => {
                        if (!isChatSessionActive(chatMessages, timedSessionId)) return;
                        beginSequentialRender(chatMessages);
                        try {
                            callback();
                        } finally {
                            endSequentialRender(chatMessages);
                        }
                    }, 0);
                }
            });
            if (timedSkipHost) {
                attachSkipControl(timedSkipHost, controller, '跳过等待');
            }

            timerInterval = setInterval(() => {
                if (!isChatSessionActive(chatMessages, timedSessionId)) {
                    clearInterval(timerInterval);
                    clearManagedWait(chatMessages, controller);
                    return;
                }
                remainingMs = Math.max(0, timedDeadline - Date.now());
                if (remainingMs > 0) {
                    if (timedIndicator) {
                        timedIndicator.innerText = '⏳ ' + Math.ceil(remainingMs / 1000) + 's';
                    }
                } else {
                    clearInterval(timerInterval);
                    finished = true;
                    clearManagedWait(chatMessages, controller);
                    if (timedIndicator) {
                        timedIndicator.innerText = '✓';
                    }
                    setTimeout(() => {
                        if (!isChatSessionActive(chatMessages, timedSessionId)) return;
                        beginSequentialRender(chatMessages);
                        try {
                            callback();
                        } finally {
                            endSequentialRender(chatMessages);
                        }
                    }, 100);
                }
            }, 100);
            return;
        }
        const row = document.createElement('div');
        row.className = 'message-row-left';
        
        // 创建一个容器来放消息和计时器
        const messageContainer = document.createElement('div');
        messageContainer.style.display = 'flex';
        messageContainer.style.alignItems = 'flex-end';
        messageContainer.style.gap = '0.7rem';
        messageContainer.style.maxWidth = '90%';

        const bubble = document.createElement('div');
        bubble.className = 'bubble-left';
        bubble.innerHTML = prepareMessageHtml(text);

        const timer = document.createElement('div');
        timer.className = 'card-timer';
        timer.innerText = '⏳ ' + Math.ceil(delayMs / 1000) + 's';
        timer.style.marginLeft = 'auto';
        timer.style.whiteSpace = 'nowrap';

        messageContainer.appendChild(createAiAvatar());
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

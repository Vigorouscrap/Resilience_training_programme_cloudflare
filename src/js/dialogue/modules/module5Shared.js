import {
    appendAiMessage,
    appendSpecialCard,
    startBottomCountdown,
    queueUiMutation,
    getChatSessionId,
    isChatSessionActive,
    clearManagedWait,
    registerManagedWait,
    shouldSkipWaits,
    playManagedAudio
} from '../../ui.js';

const module5CardStyles = `
    <style>
        .module5-media-block {
            display: grid;
            gap: 0.9rem;
        }
        .module5-media-title {
            font-weight: 700;
            color: #1c3853;
        }
        .module5-media-body {
            display: grid;
            gap: 0.7rem;
            line-height: 1.7;
        }
        .module5-media-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
        }
        .module5-replay-btn {
            background: #dbeafe;
            border: 2px solid #7ba5cf;
            color: #1e4a72;
            border-radius: 30px;
            padding: 0.65rem 1.3rem;
            font-size: 0.96rem;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 2px 6px #acc2db;
            transition: all 0.2s;
        }
        .module5-replay-btn:hover {
            background: #c3dafc;
            transform: scale(1.02);
        }
        .module5-image {
            width: min(100%, 420px);
            border-radius: 1rem;
            display: block;
            box-shadow: 0 10px 20px rgba(27, 74, 107, 0.14);
        }
        .module5-video {
            width: min(100%, 420px);
            border-radius: 1rem;
            display: block;
            background: #000;
            box-shadow: 0 10px 20px rgba(27, 74, 107, 0.14);
        }
        .module5-inline-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.2rem;
        }
        .module5-inline-table th,
        .module5-inline-table td {
            border: 1px solid #aac3df;
            padding: 0.55rem 0.65rem;
            text-align: left;
            vertical-align: top;
            line-height: 1.65;
        }
        .module5-inline-table th {
            background: #dfeafb;
        }
        .module5-options-list {
            display: grid;
            gap: 0.7rem;
            line-height: 1.7;
        }
        .module5-note {
            color: #355677;
        }
    </style>
`;

function stripHtmlTags(text) {
    return String(text)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getPreferredChineseVoice() {
    const synth = globalThis.speechSynthesis;
    const voices = synth?.getVoices?.() || [];

    return voices.find(voice => /^zh(-|_)/i.test(voice.lang))
        || voices.find(voice => /Chinese|中文/i.test(voice.name))
        || null;
}

export function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

export function removeCurrentCardActionButtons(chatMessages) {
    const currentActions = chatMessages.querySelectorAll('.card-action-buttons');
    const lastActions = currentActions[currentActions.length - 1];
    if (lastActions) lastActions.remove();
}

export function removeLastAiMessage(chatMessages) {
    const messages = chatMessages.querySelectorAll('.message-row-left');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) lastMessage.remove();
}

export function startCardCountdown(chatMessages, seconds, readyText, onComplete) {
    startBottomCountdown(chatMessages, seconds, readyText, onComplete, { align: 'card' });
    return;
    queueUiMutation(chatMessages, () => {
        const cards = chatMessages.querySelectorAll('.special-card');
        const currentCard = cards[cards.length - 1];
        const sessionId = getChatSessionId(chatMessages);
        const deadline = Date.now() + (seconds * 1000);

        if (!currentCard) {
            setTimeout(() => {
                if (!isChatSessionActive(chatMessages, sessionId)) return;
                onComplete();
            }, seconds * 1000);
            return;
        }

        const timerDiv = document.createElement('div');
        timerDiv.className = 'card-timer';
        let remaining = seconds;
        timerDiv.innerText = `${remaining}秒后${readyText}`;
        currentCard.appendChild(timerDiv);

        const timer = setInterval(() => {
            if (!isChatSessionActive(chatMessages, sessionId)) {
                clearInterval(timer);
                return;
            }

            remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            if (remaining > 0) {
                timerDiv.innerText = `${remaining}秒后${readyText}`;
                return;
            }

            clearInterval(timer);
            if (!isChatSessionActive(chatMessages, sessionId)) return;
            timerDiv.innerText = readyText;
            onComplete();
        }, 250);
    });
}

export function estimateSpeechDurationMs(text, perCharMs = 260, minMs = 4000, maxMs = 90000) {
    const plainText = stripHtmlTags(text);
    return Math.max(minMs, Math.min(maxMs, plainText.length * perCharMs));
}

export function speakText(chatMessages, text, options = {}) {
    const plainText = stripHtmlTags(text);
    const onEnd = typeof options.onEnd === 'function' ? options.onEnd : null;
    const fallbackMs = options.fallbackMs ?? estimateSpeechDurationMs(plainText);
    const sessionId = getChatSessionId(chatMessages);
    const synth = globalThis.speechSynthesis;
    let finished = false;
    let fallbackTimer = null;
    let utterance = null;

    const finish = () => {
        if (finished) return;
        finished = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        clearManagedWait(chatMessages, controller);
        if (!onEnd) return;
        if (!isChatSessionActive(chatMessages, sessionId)) return;
        onEnd();
    };

    const controller = registerManagedWait(chatMessages, {
        type: 'speech',
        skip: () => {
            if (finished) return;
            try {
                if (synth && typeof synth.cancel === 'function') {
                    synth.cancel();
                }
            } catch (error) {
                // Ignore cancellation failures during testing skips.
            }
            if (utterance) {
                utterance.onend = null;
                utterance.onerror = null;
            }
            finish();
        }
    });

    if (!plainText) {
        clearManagedWait(chatMessages, controller);
        if (onEnd) onEnd();
        return;
    }

    if (shouldSkipWaits()) {
        setTimeout(() => {
            controller?.skip();
        }, 0);
        return;
    }

    if (!synth || typeof globalThis.SpeechSynthesisUtterance === 'undefined') {
        if (onEnd) {
            fallbackTimer = setTimeout(finish, fallbackMs);
        } else {
            clearManagedWait(chatMessages, controller);
        }
        return;
    }

    utterance = new globalThis.SpeechSynthesisUtterance(plainText);
    utterance.lang = options.lang || 'zh-CN';
    utterance.rate = options.rate ?? 0.92;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    const preferredVoice = getPreferredChineseVoice();
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.onend = finish;
    utterance.onerror = finish;
    if (onEnd) {
        fallbackTimer = setTimeout(finish, fallbackMs);
    }

    try {
        synth.cancel();
        synth.speak(utterance);
    } catch (error) {
        finish();
    }
}

export function appendSpeechReplayCard(chatMessages, html, speechText, options = {}) {
    appendSpecialCard(
        chatMessages,
        `${module5CardStyles}
        <div class="module5-media-block">
            ${html}
            <div class="module5-media-actions">
                <button type="button" class="module5-replay-btn">${options.replayLabel || '再次播放'}</button>
            </div>
        </div>`
    );

    const cards = chatMessages.querySelectorAll('.special-card');
    const currentCard = cards[cards.length - 1];
    const replayBtn = currentCard?.querySelector('.module5-replay-btn');

    const playReplayAudio = () => {
        if (options.audioPath) {
            playManagedAudio(chatMessages, options.audioPath, {
                mimeType: options.audioMimeType || 'audio/mpeg',
                onEnded: options.onEnded
            });
            return;
        }

        speakText(chatMessages, speechText, options.speechOptions);
    };

    replayBtn?.addEventListener('click', () => {
        playReplayAudio();
    });

    if (typeof options.onInit === 'function' && currentCard) {
        options.onInit(currentCard);
    }

    if (options.autoPlay !== false) {
        playReplayAudio();
    }

    return currentCard;
}

export function startSpokenSequence(context, sequence, onComplete = null) {
    const runItem = (index) => {
        if (index >= sequence.length) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        const item = sequence[index];
        const repeat = item.repeat || 1;

        const runRepeat = (remainingCount) => {
            appendAiMessage(context.chatMessages, item.text, false);

            const advance = () => {
                if (remainingCount > 1) {
                    runRepeat(remainingCount - 1);
                    return;
                }

                runItem(index + 1);
            };

            if (item.delayMs != null) {
                const sessionId = getChatSessionId(context.chatMessages);
                speakText(
                    context.chatMessages,
                    item.speechText ?? item.text,
                    {
                        rate: item.rate,
                        fallbackMs: item.delayMs
                    }
                );
                setTimeout(() => {
                    if (!isChatSessionActive(context.chatMessages, sessionId)) return;
                    advance();
                }, item.delayMs);
                return;
            }

            speakText(
                context.chatMessages,
                item.speechText ?? item.text,
                {
                    rate: item.rate,
                    fallbackMs: item.fallbackMs,
                    onEnd: advance
                }
            );
        };

        runRepeat(repeat);
    };

    runItem(0);
}

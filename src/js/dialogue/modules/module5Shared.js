import {
    appendSpecialCard,
    startBottomCountdown,
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

    const playReplayAudio = (withFlowAdvance = false) => {
        if (!options.audioPath) return;

        playManagedAudio(chatMessages, options.audioPath, {
            mimeType: options.audioMimeType || 'audio/mpeg',
            onEnded: withFlowAdvance ? options.onEnded : null
        });
    };

    replayBtn?.addEventListener('click', () => {
        playReplayAudio(false);
    });

    if (typeof options.onInit === 'function' && currentCard) {
        options.onInit(currentCard);
    }

    if (options.autoPlay !== false) {
        playReplayAudio(true);
    }

    return currentCard;
}

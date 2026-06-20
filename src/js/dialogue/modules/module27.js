import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    startBottomCountdown,
    queueUiMutation,
    disableInput,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';
import { appendSpeechReplayCard } from './module5Shared.js';
import { getWeekReviewBreathSummary } from './weekReviewBreathSummary.js';

const module27MeditationAudioPath = encodeURI('audio/冥想呼吸.mp3');
const module27MeditationCardHtml = `
    <p class="module5-media-title">【冥想呼吸】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, onComplete) {
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
            } else {
                clearInterval(timer);
                if (!isChatSessionActive(chatMessages, sessionId)) return;
                timerDiv.innerText = readyText;
                onComplete();
            }
        }, 250);
    });
}

function isConcreteEventShare(text) {
    const normalized = text.replace(/\s+/g, '');
    if (!normalized || normalized.length < 4) return false;

    const emptyReplies = ['没有', '没', '无', '想不到', '不记得', '不知道', '暂时没有', '没什么', '没有特别的'];
    if (emptyReplies.includes(normalized)) return false;

    return true;
}

export const module27Handlers = {
    onContinue_Module27() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '过去几天，除了冥想练习，我们还一起完成了三种不同的内在探索：', false);
            appendSpecialCard(
                this.chatMessages,
                '<p>经验性回避 ——一种面对焦虑压力等出现的常见心理模式</p><p>接纳技术—— 给情绪“搭台阶”，和情绪温和相处</p><p>情绪日记 —— 更清楚地看见每日情绪并尝试接纳</p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们不做新的练习，而是一起看看这周的旅程带给了我们什么。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：冥想呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短冥想呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.startModule27MeditationSequence();
            });
            this.step = 2;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的冥想呼吸相比，这一次的冥想呼吸是否感觉更自然一些、更容易进入状态？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module27State.breathAnswers.push(answer);
                this.step = 4;
                this.onContinue_Module27();
            });
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '这一次的冥想呼吸过程中，注意力是否依然容易飘走？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module27State.breathAnswers.push(answer);
                this.step = 5;
                this.onContinue_Module27();
            });
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '这一次的冥想呼吸过程中，呼吸的节奏是否有所不同？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module27State.breathAnswers.push(answer);
                this.step = 6;
                this.onContinue_Module27();
            });
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, this.getModule27BreathSummary(), false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步:经验型回避回顾</strong></p>');
            appendAiMessage(this.chatMessages, '现在我们再来回顾一下，这一周以来，你遇到了什么有压力或不自在的事？请你简单把它写到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 7;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '感谢你的分享。这周我们认识了“经验性回避”，也就是当我们感到焦虑、受伤或压力时，有时会选择推开感受、转移注意或假装没事。此刻，回想一下当时自己遇见这件事的时候，是否也习惯性地进行了经验性回避了呢？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                appendAiMessage(this.chatMessages, '感谢你的回答。那么后来你是否有意识地对自己说“我注意到我进行经验性回避了呢”或者“哦我注意到我在推开某种感受”？日常生活中我们可以多尝试这样的做法，从而有意识地迈出“应对焦虑或压力”的第一步。', true);
                this.step = 10;
            });
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '暂时没有想到也没关系。这周我们认识了“经验性回避”，也就是当我们感到焦虑、受伤或压力时，有时会选择推开感受、转移注意或假装没事。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '日常生活中我们可以尝试留心觉察，比如在感到一点点烦躁或紧张的时候，就停下来问问自己：“我现在是不是在试着推开某种感受？”这样的小练习，就能慢慢帮你更好地认识自己的应对模式。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendSpecialCard(this.chatMessages, '<p><strong>第三步:接纳技术回顾</strong></p>');
            appendAiMessage(this.chatMessages, '这一周我们还学习了接纳技术。对于刚刚你提到的那件有压力或者不自在的事，让我们一起尝试进行一次接纳练习吧！（如果刚刚没有分享事情，就想想在情绪日记中记录的其中一件事情或者这几日练习中看到过的案例吧！）', true);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '现在，请你在心中默默回想那件事，去感受你的情绪和身体反应…', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '接下来接纳技术的每一步都将以卡片形式呈现，请按照上面的要求来说和做，当你完成后就可以点击下一步。', true);
            this.step = 14;
        } else if (this.step === 14) {
            this.showModule27AcceptanceCard(
                '<p><strong>【第一步：观察】</strong></p><p><i><u>说什么做什么</u></i>：观察自己，用“我现在感到____（情绪词），身体____（具体部位+感受）”句式表达，不添加“我不该这样”等评判的句子。</p>',
                15,
                '下一步',
                15
            );
        } else if (this.step === 15) {
            this.showModule27AcceptanceCard(
                '<p><strong>【第二步：允许】</strong></p><p><i><u>说什么做什么</u></i>：用“遇到这种事，有这样的情绪是正常的，我允许它在这儿，不怪自己”类似的话，不否定、不压抑，像允许一位客人暂时坐在自己的客厅。</p>',
                15,
                '下一步',
                16
            );
        } else if (this.step === 16) {
            this.showModule27AcceptanceCard(
                '<p><strong>【第三步：扩展】</strong></p><p><i><u>说什么做什么</u></i>：先关注情绪15秒，再慢慢将注意力转移到“呼吸/身体其他部位/周围声音”，用“除了____（情绪），我还能感受到____”来表达。</p>',
                15,
                '下一步',
                17
            );
        } else if (this.step === 17) {
            this.showModule27AcceptanceCard(
                '<p><strong>【第四步：行动】</strong></p><p><i><u>说什么做什么</u></i>：选择做一个不需要费力气的小事（30秒内能完成），做完后说“我刚为自己做了____”。</p>',
                30,
                '已完成',
                18
            );
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '你做得很好。接纳不是要“消灭” 消极情绪，也不是强迫自己“必须开心”，而是当焦虑、烦躁来的时候，我们能不逃避、不批判，试着和它们好好相处，甚至用一个小行动帮自己调整状态。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '接纳技术不是纸上谈兵，只要多尝试，就能在情绪里找到更从容的应对方式。”', true);
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '一个小提醒，我们这几天还需要继续进行情绪日记的记录（问卷星链接：<a href="https://v.wjx.cn/vm/tUtCiF5.aspx#">https://v.wjx.cn/vm/tUtCiF5.aspx#</a>）。每一天你可以选择在当晚（一天结束前）填写这个情绪日记，也可以选择在你遇到有情绪波动的事情时即刻开始记录。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '相信通过一次一次的记录，我们能够提高对情绪的觉察，从而让我们更好地结合学到的技术去应对情绪、应对压力。', true);
            this.step = 22;
        } else if (this.step === 22) {
            appendAiMessage(this.chatMessages, '本次回顾到此结束。这段时间你完成了几种新的探索，无论体验深浅，你为自己付出的时间和关注，本身就是一种深刻的自我关怀。我们明天将开启第三阶段的练习，期待与你再次相见。', false);
            this.step = 23;
        }
    },

    handleModule27UserMessage(text) {
        if (this.step === 7) {
            this.module27State.sharedStressText = text;
            this.module27State.hasConcreteStress = isConcreteEventShare(text);
            disableInput(this.inputArea, this.userInput);
            this.step = this.module27State.hasConcreteStress ? 8 : 9;
            this.onContinue();
        }
    },

    getModule27BreathSummary() {
        return getWeekReviewBreathSummary(this.module27State.breathAnswers);
    },

    startModule27MeditationSequence() {
        appendSpeechReplayCard(
            this.chatMessages,
            module27MeditationCardHtml,
            '',
            {
                replayLabel: '再次播放',
                audioPath: module27MeditationAudioPath,
                audioMimeType: 'audio/mpeg',
                disableSpeechFallback: true,
                onEnded: () => {
                    this.step = 3;
                    this.onContinue_Module27();
                }
            }
        );
    },

    showModule27AcceptanceCard(html, delaySeconds, buttonLabel, nextStep) {
        appendSpecialCard(this.chatMessages, html);
        startCardCountdown(this.chatMessages, delaySeconds, '可继续', () => {
            appendButtonGroup(this.chatMessages, [buttonLabel], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = nextStep;
                this.onContinue_Module27();
            });
        });
    }
};

import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    queueUiMutation,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';

const module37RecognitionCardHtml = `
    <p>1. 深夜反复推敲白天某句玩笑是否会被误解。</p>
    <p>2. 不断揣摩导师/老板随口一句话是否暗藏不满。</p>
    <p>3. 计划失败后不停思考自己本该做的每个细节。</p>
    <p>4. 体检后对指标进行灾难化联想和反复搜索。</p>
    <p>5. 反复比较自己与他人成就并寻找“落后原因”。</p>
    <p>6. 把偶然失误归因为永久性人格缺陷并反复咀嚼。</p>
    <p>7. 持续想象未来可能发生的尴尬场景并提前焦虑。</p>
`;

const module37ObservationCardHtml = `
    <p><strong>【第一步：观察】</strong></p>
    <p>说什么做什么：观察自己，用“我现在感到____（情绪词），身体____（具体部位+感受）”句式表达，不添加“我不该这样”等评判的句子。</p>
`;

const module37AllowanceCardHtml = `
    <p><strong>【第二步：允许】</strong></p>
    <p>说什么做什么：用“遇到这种事，有这样的情绪是正常的，我允许它在这儿，不怪自己”类似的话，不否定、不压抑，像允许一位客人暂时坐在自己的客厅。</p>
`;

const module37ExpansionCardHtml = `
    <p><strong>【第三步：扩展】</strong></p>
    <p>说什么做什么：先关注情绪15秒，再慢慢将注意力转移到“呼吸/身体其他部位/周围声音”，用“除了____（情绪），我还能感受到____”来表达。</p>
`;

const module37ActionCardHtml = `
    <p><strong>【第四步：行动】</strong></p>
    <p>说什么做什么：选择做一个不需要费力气的小事（30秒内能完成），做完后说“我刚为自己做了____”。</p>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, buttonLabel, onComplete) {
    queueUiMutation(chatMessages, () => {
        const cards = chatMessages.querySelectorAll('.special-card');
        const currentCard = cards[cards.length - 1];
        const sessionId = getChatSessionId(chatMessages);
        const deadline = Date.now() + (seconds * 1000);

        if (!currentCard) {
            setTimeout(() => {
                if (!isChatSessionActive(chatMessages, sessionId)) return;
                appendButtonGroup(chatMessages, [buttonLabel], () => {
                    removeCurrentButtonGroup(chatMessages);
                    onComplete();
                });
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
            appendButtonGroup(chatMessages, [buttonLabel], () => {
                removeCurrentButtonGroup(chatMessages);
                onComplete();
            });
        }, 250);
    });
}

export const module37Handlers = {
    onContinue_Module37() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '过去几天，除了冥想练习，我们还认识了过度积极反刍、深化练习了接纳技术、采取自我承诺的行动，将学到的技术尽可能应用到我们的日常生活中。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们不做新的练习，而是一起看看这段旅程带给了我们什么。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：冥想呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短的正念呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.startModule37MeditationSequence();
            });
            this.step = 3;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的冥想呼吸相比，这一次的冥想呼吸是否感觉更自然一些、更容易进入状态？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module37State.breathAnswers.push(answer);
                this.step = 5;
                this.onContinue_Module37();
            });
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，注意力是否依然容易飘走？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module37State.breathAnswers.push(answer);
                this.step = 6;
                this.onContinue_Module37();
            });
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，呼吸的节奏是否有所不同？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module37State.breathAnswers.push(answer);
                this.step = 7;
                this.onContinue_Module37();
            });
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, this.getModule37BreathSummary(), false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步：过度积极反刍回顾</strong></p>');
            appendAiMessage(this.chatMessages, '现在我们再次回顾一下这周提到的过度积极反刍。它和经验性回避一样，都是我们遭遇压力、挫折、不自在的事时普遍会出现的心理模式。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '如果我们能够更快更好地识别它，就能够有准备地采用接纳的方式回应它，最终不受它的影响。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '接下来，我将为你再展示一些相关的例子，来帮助你更好地识别它们。', false);
            appendSpecialCard(this.chatMessages, module37RecognitionCardHtml);
            startCardCountdown(this.chatMessages, 60, '可继续', '继续', () => {
                this.step = 10;
                this.onContinue_Module37();
            });
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '生活中的场景更多样、复杂，我们可以多感受、多观察、多发现。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>第三步：接纳技术回顾</strong></p>');
            appendAiMessage(this.chatMessages, '这一周我们更深入地应用了接纳技术，还通过“接纳者”的视角转换体验了如何温和地应对。现在，我们将再次回顾一下接纳的四步法。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '请你想想最近令自己有压力或者不自在的事，体会一下当时的感受，然后就可以点击继续按钮，随着引导卡片说和做，一起进行一次接纳练习（如果暂时想不起来什么事，可以参考上面卡片呈现的场景）。', false);
            startCardCountdown(this.chatMessages, 30, '可继续', '继续', () => {
                this.step = 12;
                this.onContinue_Module37();
            });
        } else if (this.step === 12) {
            appendSpecialCard(this.chatMessages, module37ObservationCardHtml);
            startCardCountdown(this.chatMessages, 15, '可继续', '下一步', () => {
                this.step = 13;
                this.onContinue_Module37();
            });
        } else if (this.step === 13) {
            appendSpecialCard(this.chatMessages, module37AllowanceCardHtml);
            startCardCountdown(this.chatMessages, 15, '可继续', '下一步', () => {
                this.step = 14;
                this.onContinue_Module37();
            });
        } else if (this.step === 14) {
            appendSpecialCard(this.chatMessages, module37ExpansionCardHtml);
            startCardCountdown(this.chatMessages, 15, '可继续', '下一步', () => {
                this.step = 15;
                this.onContinue_Module37();
            });
        } else if (this.step === 15) {
            appendSpecialCard(this.chatMessages, module37ActionCardHtml);
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 16;
                this.onContinue_Module37();
            });
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '你做得很好，接纳不是要“消灭”消极情绪，也不是强迫自己“必须开心”，而是当焦虑、烦躁来的时候，我们能不逃避、不批判，试着和它们好好相处，甚至用一个小行动帮自己调整状态。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '接纳技术不是纸上谈兵，只要多尝试，就能在情绪里找到更从容的应对方式。”', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '我们前两天还进行了自我承诺行动，每当你执行了你的接纳行动后，可以随时打开链接记录（链接待补充）。这种记录方式还会再持续几天，相信通过一次一次的记录，我们能够更自如地应对情绪与压力。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '本次回顾到此结束。这段时间你完成了几种新的探索，无论体验深浅，你为自己付出的时间和关注，本身就是一种自我关怀。我们明天将开启第四阶段的练习，期待与你再次相见。', false);
            this.step = 20;
        }
    },

    getModule37BreathSummary() {
        const yesCount = this.module37State.breathAnswers.filter(answer => answer === '是').length;
        if (yesCount >= 2) {
            return '你与呼吸的联结更自然了，这意味着呼吸本身已成为一个稳定的觉察对象，你可以更容易通过呼吸回到当下。';
        }

        return '注意力跑走是正常的，能一次次把它带回来，本身就是很重要的练习。';
    },

    startModule37MeditationSequence() {
        this.startWeek2TimedSequence(
            [
                this.createTimedSequenceItem('首先，请采取一个舒适的固定姿势：无论盘腿、坐在椅子上、站立甚至躺卧，务求姿势能够舒服、持久，腰身能够轻松、自然。双手可以自然放在膝盖上，或者放在身体两侧。'),
                this.createTimedSequenceItem('如果你身边有其他电子设备或可能打扰自己的物品，可以暂时将它们放在一边。接下来几分钟，是全然属于你自己的时间。'),
                this.createTimedSequenceItem('现在，如果你愿意，可以慢慢闭上眼睛。如果不习惯闭眼，也可以轻轻看着前方的地面。让身体自然地呼吸，心只是跟随自己的呼吸、觉察自己的呼吸，感受‘呼吸正在发生’这件事。当呼气的时候知道自己是在呼气，当吸气的时候知道自己是在吸气；当气息长的时候知道是气息长，当气息短的时候知道是气息短；当呼吸的感觉明显的时候知道呼吸的感觉是明显的，当呼吸的感觉不明显的时候知道呼吸的感觉是不明显的。'),
                this.createTimedSequenceItem('也可以留意空气进入鼻子时的感觉：鼻尖有没有一丝清凉？呼出空气时，嘴唇周围有没有暖暖的气流？如果暂时感受不到这些细节，也没关系。就只是知道‘我在吸气，我在呼气’，这就是很好的开始。'),
                this.createTimedSequenceItem('随着我们继续观察呼吸，可能会有各种体验出现。有时你会感到平静、放松，甚至有一些愉快的念头或美好的画面浮现。这些都很珍贵，但不用紧紧抓住这些感觉。就像看着窗外飞过的小鸟，看到时会开心，飞走了也不用失落。呼吸一直在，我们的注意力只是跟着它来来去去。'),
                this.createTimedSequenceItem('有时注意力会跑到积极的念头上，轻轻把它拉回呼吸就好，不用觉得‘没抓住美好的感觉真可惜’。若注意力再次、再三跑到别处时，就再次、再三地觉察并柔和地把它带回呼吸之上即可。有时呼吸变得明显，有时又不那么明显；有时呼吸快，有时呼吸慢。这些都是正常的。我们只是一个观察者，观察这一切的自然变化。'),
                { text: '呼吸来来去去，感觉来来去去，我们只是观察……注意力飘走了，就温柔地把它带回来……不用评判，只是觉察……', delayMs: 40000, repeat: 5 },
                this.createTimedSequenceItem('现在我们慢慢做3次深呼吸。第一次吸气，感受空气充满胸腔，呼气，让身体再放松一点；第二次吸气，感受腹部的起伏，呼气，让肩膀再下沉一点；第三次吸气，感受全身的轻松，再慢慢呼气。'),
                this.createTimedSequenceItem('先慢慢活动一下手指和脚趾，感受血液在指尖、脚尖流动的感觉；再轻轻转动一下脖子，避免突然用力；最后慢慢睁开眼睛，先看看自己的双手，再看看身边的环境，让注意力一点点回到现实中。')
            ],
            () => {
                this.step = 4;
                this.onContinue_Module37();
            }
        );
    }
};

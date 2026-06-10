import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton
} from '../../ui.js';
import {
    removeCurrentButtonGroup,
    appendSpeechReplayCard
} from './module5Shared.js';

const module57MeditationAudioPath = encodeURI('audio/冥想呼吸.mp3');
const module57MeditationCardHtml = `
    <p class="module5-media-title">【冥想呼吸】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

function getModule57BreathSummary(answers) {
    const yesCount = answers.filter(answer => answer === '是').length;
    if (yesCount >= 2) {
        return '你与呼吸的联结更自然了，这意味着呼吸本身已成为一个稳定的觉察对象，你可以更容易通过呼吸回到当下。';
    }

    return '注意力跑走是正常的，能一次次把它带回来，本身就是很重要的练习。';
}

function getModule57MeditationSequence() {
    return [
        {
            text: '首先，请采取一个舒适的固定姿势：无论盘腿、坐在椅子上、站立甚至躺卧，务求姿势能够舒服、持久，腰身能够轻松、自然。双手可以自然放在膝盖上，或者放在身体两侧。',
            rate: 0.88
        },
        {
            text: '如果你身边有其他电子设备或可能打扰自己的物品，可以暂时将它们放在一边。接下来几分钟，是全然属于你自己的时间。',
            rate: 0.88
        },
        {
            text: '现在，如果你愿意，可以慢慢闭上眼睛。如果不习惯闭眼，也可以轻轻看着前方的地面。让身体自然地呼吸，心只是跟随自己的呼吸、觉察自己的呼吸，感受“呼吸正在发生”这件事。当呼气的时候知道自己是在呼气，当吸气的时候知道自己是在吸气；当气息长的时候知道是气息长，当气息短的时候知道是气息短；当呼吸的感觉明显的时候知道呼吸的感觉是明显的，当呼吸的感觉不明显的时候知道呼吸的感觉是不明显的。',
            rate: 0.86
        },
        {
            text: '也可以留意空气进入鼻子时的感觉：鼻尖有没有一丝清凉？呼出空气时，嘴唇周围有没有暖暖的气流？如果暂时感受不到这些细节，也没关系。就只是知道“我在吸气，我在呼气”，这就是很好的开始。',
            rate: 0.88
        },
        {
            text: '随着我们继续观察呼吸，可能会有各种体验出现。有时你会感到平静、放松，甚至有一些愉快的念头或美好的画面浮现。这些都很珍贵，但不用紧紧抓住这些感觉。就像看着窗外飞过的小鸟，看到时会开心，飞走了也不用失落。呼吸一直在，我们的注意力只是跟着它来来去去。',
            rate: 0.88
        },
        {
            text: '有时注意力会跑到积极的念头上，轻轻把它拉回呼吸就好，不用觉得‘没抓住美好的感觉真可惜’。若注意力再次、再三跑到别处时，就再次、再三地觉察并柔和地把它带回呼吸之上即可。有时呼吸变得明显，有时又不那么明显；有时呼吸快，有时呼吸慢。这些都是正常的。我们只是一个观察者，观察这一切的自然变化。',
            rate: 0.86
        },
        {
            text: '呼吸来来去去，感觉来来去去，我们只是观察……注意力飘走了，就温柔地把它带回来……不用评判，只是觉察……',
            delayMs: 40000,
            repeat: 5,
            rate: 0.84
        },
        {
            text: '现在我们慢慢做3次深呼吸。第一次吸气，感受空气充满胸腔，呼气，让身体再放松一点；第二次吸气，感受腹部的起伏，呼气，让肩膀再下沉一点；第三次吸气，感受全身的轻松，再慢慢呼气。',
            rate: 0.88
        },
        {
            text: '先慢慢活动一下手指和脚趾，感受血液在指尖、脚尖流动的感觉；再轻轻转动一下脖子，避免突然用力；最后慢慢睁开眼睛，先看看自己的双手，再看看身边的环境，让注意力一点点回到现实中。',
            rate: 0.88
        }
    ];
}

export const module57Handlers = {
    onContinue_Module57() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '过去几天，除了冥想练习，我们还重点学习了多维度解离技术并进行了双向解离练习，最后还通过三个隐喻帮助我们找到观察性自我，体验思维与自我的分离。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们不做新的练习，而是一起看看这段旅程带给了我们什么。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：冥想呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短的正念呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.startModule57MeditationSequence();
            });
            this.step = 2;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的冥想呼吸相比，这一次的冥想呼吸是否感觉更自然一些、更容易进入状态？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module57State.breathAnswers.push(answer);
                this.step = 4;
                this.onContinue_Module57();
            });
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，注意力是否依然容易飘走？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module57State.breathAnswers.push(answer);
                this.step = 5;
                this.onContinue_Module57();
            });
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，呼吸的节奏是否有所不同？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module57State.breathAnswers.push(answer);
                this.step = 6;
                this.onContinue_Module57();
            });
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, getModule57BreathSummary(this.module57State.breathAnswers), false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步：解离与以己为景回顾</strong></p>');
            appendAiMessage(this.chatMessages, '这一周我们深度了解了多维解离技术（气球放飞法、角色转换法、时间线法）和以己为景（三个隐喻：舞台与观众、天空与天气、棋盘与棋手）。', true);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '现在，让我们进入两个常见的情景，看看如何将这些工具组合运用，形成一套有效的应对策略。', false);
            appendSpecialCard(
                this.chatMessages,
                '<p class="scene-title"><strong>【情景一】</strong></p><p>深夜独自一人，反复回想白天与同事的争执，思绪停不下来，越想越生气、委屈。</p>'
            );
            appendAiMessage(this.chatMessages, '想象自己是这个场景的主人公，如何运用这周所学内容来处理这件事带来的心理影响和情绪呢？', false);
            appendContinueButton(this.chatMessages, 60);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '接下来，请跟着引导一起进行练习。', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>第一步（暂停与观察）</strong></p><p>首先，意识到自己陷入了“反刍循环”。对自己说：“我注意到我的思绪卡在了白天的争执里。”</p>'
            );
            appendContinueButton(this.chatMessages, 15);
            this.step = 9;
        } else if (this.step === 9) {
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>第二步（启动解离）</strong></p><p>尝试 【气球放飞法】。想象把“他怎么能这样说！”这份怒气，写在一个红色气球上，看着它从手中缓缓升空、飘远。目的不是忘记，而是给情绪一个离开的出口。</p>'
            );
            appendContinueButton(this.chatMessages, 30);
            this.step = 10;
        } else if (this.step === 10) {
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>第三步（锚定观察者）</strong></p><p>最后，调用 【舞台隐喻】。告诉自己：“我是这场‘争执回忆剧’的观众。我可以看到舞台上的愤怒和委屈在上演，但我不必上台加入它们。我坐在这里，是安全的”。回归观察者的稳定位置。</p>'
            );
            appendContinueButton(this.chatMessages, 30);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '做得很好。接下来进入下一个情景，依旧想象自己是这个场景的主人公，你可以尝试自由地选择本周学习过的方法和隐喻来处理这个情景。', false);
            appendSpecialCard(
                this.chatMessages,
                '<p class="scene-title"><strong>【情景二】</strong></p><p>睡前在社交媒体软件上看到了关于疾病的帖子，开始过度联想自己，怀疑自己身体是否也有问题，担忧到失眠。</p>'
            );
            appendContinueButton(this.chatMessages, 90);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '刚刚你可能用了气球放飞法将这种焦虑的想法放飞，也可能使用了天空与天气隐喻来观察来来去去的情绪。无论是之前学到的哪些方法，这样做后，原来的想法也许不会立刻消失，但会有所不同。你可以感受到的潜在变化可能有：呼吸空间出现了，失控感减弱了，生理反应可能缓和。', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '但是，那个让你生气或委屈的事件或念头，可能还会回来敲门。这非常正常。 心理弹性的目标，从来不是让不愉快的想法永不出现，而是当它们出现时，改变你与它们的关系。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '本次回顾到此结束。我们明天将开启第六阶段的练习，期待与你再次相见。', false);
            this.step = 15;
        }
    },

    startModule57MeditationSequence() {
        appendSpeechReplayCard(
            this.chatMessages,
            module57MeditationCardHtml,
            '',
            {
                replayLabel: '再次播放',
                audioPath: module57MeditationAudioPath,
                audioMimeType: 'audio/mpeg',
                disableSpeechFallback: true,
                onEnded: () => {
                    this.step = 3;
                    this.onContinue_Module57();
                }
            }
        );
    }
};

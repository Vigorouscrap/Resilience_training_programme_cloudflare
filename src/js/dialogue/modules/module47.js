import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton
} from '../../ui.js';
import { appendSpeechReplayCard } from './module5Shared.js';
import { getWeekReviewBreathSummary } from './weekReviewBreathSummary.js';

const module47AllianceCardHtml = `
    <p><strong>想象一下，当遇到压力或遭遇挫折后，强烈的情绪和想法袭来：</strong></p>
    <p><strong>认知解离，</strong>就像是拉开距离，看清想法是什么。回答的是：“这个在我脑海里大声嚷嚷的东西，究竟是什么？是一个事实，还是一个被情绪放大了的想法故事？”</p>
    <p><strong>接纳技术，</strong>则是在看清之后允许它的存在，不与它对抗。回答的是：“好吧，我看到了这个令人不舒服的想法/情绪，我允许你在这里，但我不需要被你控制，我可以带着你继续生活。”</p>
`;

const module47MeditationAudioPath = encodeURI('audio/冥想呼吸.mp3');
const module47MeditationCardHtml = `
    <p class="module5-media-title">【冥想呼吸】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

const module47TrainMeditationAudioPath = encodeURI('audio/module42&47/火车站台冥想.mp3');
const module47TrainMeditationCardHtml = `
    <p class="module5-media-title">【火车站台冥想】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

export const module47Handlers = {
    onContinue_Module47() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '过去几天，除了冥想练习，我们还重点学习了认知解离及其实现工具（想法标签化），将学到的技术尽可能应用到我们的日常生活中。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们不做新的练习，而是一起看看这段旅程带给了我们什么。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：冥想呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短的正念呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.startModule47MeditationSequence();
            });
            this.step = 3;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的冥想呼吸相比，这一次的冥想呼吸是否感觉更自然一些、更容易进入状态？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module47State.breathAnswers.push(answer);
                this.step = 5;
                this.onContinue_Module47();
            });
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，注意力是否依然容易飘走？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module47State.breathAnswers.push(answer);
                this.step = 6;
                this.onContinue_Module47();
            });
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，呼吸的节奏是否有所不同？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module47State.breathAnswers.push(answer);
                this.step = 7;
                this.onContinue_Module47();
            });
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, getWeekReviewBreathSummary(this.module47State.breathAnswers), false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步：认知解离回顾</strong></p>');
            appendAiMessage(this.chatMessages, '现在我们再次回顾一下认知解离。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '通过认知解离，我们学习了如何与头脑中那些常常让我们痛苦的想法建立一种更健康的关系。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '我们首先体验了 “站台观察法” ，像旁观者一样看着想法如列车般驶过，而不必上车。接着，我们掌握了实用的“标签化” 工具 ，学会了给想法贴上描述性的标签，比如“这是一个灾难化的预测”或“这是一个自我批判的故事”。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '现在，让我们带着更深刻的理解，再一次跟随音频体验一次站台冥想。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '请保持舒适坐姿，双手自然放置，全程闭眼专注聆听，跟着音频引导进行想象，过程中不用刻意控制想法，顺其自然即可。当你准备好时，请点击继续按钮，然后闭上眼睛等待音频开始。', false);
            appendContinueButton(this.chatMessages);
            this.step = 12;
        } else if (this.step === 12) {
            appendSpeechReplayCard(
                this.chatMessages,
                module47TrainMeditationCardHtml,
                '',
                {
                    replayLabel: '再次播放',
                    audioPath: module47TrainMeditationAudioPath,
                    audioMimeType: 'audio/mpeg',
                    disableSpeechFallback: true,
                    onEnded: () => {
                        this.step = 13;
                        this.onContinue_Module47();
                    }
                }
            );
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '相信这一次练习你有了更深刻的体会，也更能与想法保持距离。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '这些练习的核心目的只有一个：帮助我们看清“想法只是想法，而非事实”。当“我完了”或“我不够好”的念头升起时，我们不再被它们瞬间卷走，而是能后退一步，认出它们：“哦，你又来了，一个熟悉的老故事。”', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '你可能会问，这和上周学习的接纳技术有什么关系呢？', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '它们不是孤立的，而是一对默契的盟友，共同为我们构建心理弹性。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendSpecialCard(this.chatMessages, module47AllianceCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '正是在这种“看清”与“允许”创造出的心理空间里，我们才能更冷静、更自主地决定：那么，基于我真正的价值和目标，现在我可以做什么？', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '在过去几天的练习，你是否曾有意识地运用过这种“看清-允许”（“解离和接纳”）的方法？也许是在一次小小的自我批判升起时，你给它贴了个标签；也许是在焦虑中，你选择了先观察呼吸，而非与之纠缠。', false);
            appendButtonGroup(this.chatMessages, ['A 有运用过', 'B 还没有'], (choice) => {
                removeCurrentButtonGroup(this.chatMessages);
                if (choice === 'A 有运用过') {
                    appendAiMessage(this.chatMessages, '太好了，你已经迈出了关键的一步，把方法用在了真实的生活里。希望你后续也可以坚持将它运用在不同的情景中，每一次主动运用，都不是偶然，而是一次对大脑的训练。', true);
                } else {
                    appendAiMessage(this.chatMessages, '没关系。很多时候，我们只有在情绪过去之后才回过头来意识到“刚才应该用一下这个方法”。这不叫失败，这叫觉察的萌芽。下一次，当一个小烦恼或压力事件出现时，你可以再次尝试，慢慢地会熟练应用。', true);
                }

                this.step = 20;
            });
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '无论体验深浅，每一次认知解离和接纳，都是在重塑自己与思维的关系，都是在为心理弹性添砖加瓦。心理弹性的存在不是让我们在压力面前从不“跌倒”，而是跌倒后，知道如何更快、更稳地站起来。而认知解离与接纳，正是关键的助力。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '本次回顾到此结束。我们明天将开启第五阶段的练习，期待与你再次相见。', false);
            this.step = 22;
        }
    },

    startModule47MeditationSequence() {
        appendSpeechReplayCard(
            this.chatMessages,
            module47MeditationCardHtml,
            '',
            {
                replayLabel: '再次播放',
                audioPath: module47MeditationAudioPath,
                audioMimeType: 'audio/mpeg',
                disableSpeechFallback: true,
                onEnded: () => {
                    this.step = 4;
                    this.onContinue_Module47();
                }
            }
        );
    }
};

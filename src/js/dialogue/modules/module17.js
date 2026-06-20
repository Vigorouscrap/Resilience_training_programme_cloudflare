import {
    appendAiMessage,
    appendSpecialCard,
    appendContinueButton,
    appendButtonGroup,
    appendAiMessageWithTimer,
    disableInput
} from '../../ui.js';
import { appendSpeechReplayCard } from './module5Shared.js';
import { getWeekReviewBreathSummary } from './weekReviewBreathSummary.js';

const module17MeditationAudioPath = encodeURI('audio/冥想呼吸.mp3');
const module17MeditationCardHtml = `
    <p class="module5-media-title">【冥想呼吸】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

export const module17Handlers = {
    onContinue_Module17Docx() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '过去几天，我们一起完成了三种不同的内在探索：', false);
            appendSpecialCard(this.chatMessages, '<p>冥想呼吸 —— 练习“回到当下”</p><p>情绪接收站 —— 学习“看见”感受</p><p>牛奶实验 —— 体验“思维 ≠ 事实”</p>');
            appendContinueButton(this.chatMessages);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们不做新的练习，而是一起看看这周的旅程带给了我们什么。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：冥想呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短的冥想呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.step = 3;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 3) {
            appendSpeechReplayCard(
                this.chatMessages,
                module17MeditationCardHtml,
                '',
                {
                    replayLabel: '再次播放',
                    audioPath: module17MeditationAudioPath,
                    audioMimeType: 'audio/mpeg',
                    disableSpeechFallback: true,
                    onEnded: () => {
                        this.step = 12;
                        this.onContinue();
                    }
                }
            );
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的冥想呼吸相比，这一次的冥想呼吸是否感觉更自然一些、更容易进入状态？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.module17State.breathAnswers.push(answer);
                this.step = 13;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '这一次的冥想呼吸过程中，注意力是否依然容易飘走？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.module17State.breathAnswers.push(answer);
                this.step = 14;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '这一次的冥想呼吸过程中，呼吸的节奏是否有所不同？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.module17State.breathAnswers.push(answer);
                this.step = 15;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 15) {
            const summary = getWeekReviewBreathSummary(this.module17State.breathAnswers);
            appendAiMessage(this.chatMessages, summary, false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步：情绪接收站回顾</strong></p>');
            appendAiMessage(this.chatMessages, '现在让我们回顾一下，这一周以来你遇到了什么压力或不自在的事？请你简单把它写到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '感谢你的分享。此刻，问问自己：我对此的主要感受是怎样的？身体有没有什么特别的感觉？脑海里有没有浮现出一些小念头？请输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前做的练习相比，你现在是否能更清晰、快速地看到自己的感受？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                const response = answer === '是'
                    ? '你能更清晰地识别当下的情绪，这意味着你对自己当下的状态有了更准确的认识。'
                    : '这一周的练习对你来说，更像是一次初步的“接触”和“熟悉”，这完全正常。';
                appendAiMessage(this.chatMessages, response, false);
                appendSpecialCard(this.chatMessages, '<p><strong>第三步：体验练习回顾</strong></p>');
                appendAiMessage(this.chatMessages, '在过去的几天里，当你遇到一些出现压力或不自在的事情时，你的脑海中是否自动冒出过一些想法？', false);
                appendSpecialCard(this.chatMessages, '<p>例如：</p><p>“别人会不会对我有看法”</p><p>“这件事让我很不安”</p>');
                appendButtonGroup(this.chatMessages, ['是的，我注意到有这样的想法出现', '好像有，但没特别注意', '不太确定', '没有'], (choice) => {
                    // this.clearInteractiveControls();
                    const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                    if (currentBtnGroup) currentBtnGroup.remove();
                    this.module17State.thoughtOccurrence = choice;
                    this.step = 18;
                    this.handleModule17ThoughtOccurrence(choice);
                });
                this.step = 18;
            });
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '当这些想法出现时，你是否曾尝试使用我们“牛奶体验练习”中的方法——“我注意到我有一个……的想法”？', false);
            appendButtonGroup(this.chatMessages, ['1 我多次尝试并感到有帮助', '2 尝试了一两次', '3 完全没有尝试', '4 不太确定'], (choice) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                const response = choice.startsWith('1')
                    ? '你开始在生活中实践“观察想法”，这非常珍贵。'
                    : choice.startsWith('2')
                        ? '你已经开始把练习带回现实生活了。'
                        : choice.startsWith('3')
                            ? '完全理解，从练习场到真实生活，需要一些时间。'
                            : '感谢你的选择。觉察想法的出现本身，就已经很重要了。';
                appendAiMessage(this.chatMessages, response, false);
                appendAiMessage(this.chatMessages, '本次回顾到此结束。这段时间你完成了三种内在探索，无论体验深浅，你为自己付出的时间和关注，本身就是一种自我关怀。我们明天将开启第二阶段的练习，期待与你再次相见。', false);
                this.step = 20;
            });
        }
    },

    handleModule17DocxUserMessage(text) {
        if (this.step === 16) {
            this.module17State.eventText = text;
            disableInput(this.inputArea, this.userInput);
            this.onContinue();
        } else if (this.step === 17) {
            this.module17State.bodyText = text;
            disableInput(this.inputArea, this.userInput);
            this.onContinue();
        }
    },

    handleModule17ThoughtOccurrence(choice) {
        const yesLike = choice === '是的，我注意到有这样的想法出现' || choice === '好像有，但没特别注意' || choice === '不太确定';
        if (yesLike) {
            this.step = 19;
            this.onContinue();
        } else {
            appendAiMessage(this.chatMessages, '如果暂时没有这样的想法，也完全没关系。能回看这一周的体验，本身就是一种收获。', false);
            appendAiMessage(this.chatMessages, '本次回顾到此结束。这段时间你完成了三种内在探索，无论体验深浅，你为自己付出的时间和关注，本身就是一种自我关怀。我们明天将开启第二阶段的练习，期待与你再次相见。', false);
            this.step = 20;
        }
    }

};

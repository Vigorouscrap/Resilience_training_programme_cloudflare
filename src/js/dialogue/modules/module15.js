import {
    appendAiMessage,
    appendSpecialCard,
    appendContinueButton,
    appendHint,
    appendAiMessageWithTimer,
    playManagedAudio
} from '../../ui.js';

const module15MilkExperienceAudioPath = encodeURI('audio/module15/1-5牛奶牛奶体验.mp3');

export const module15Handlers = {
    onContinue_Module15() {
        if (this.step === -1) {
            appendAiMessage(this.chatMessages, '在日常生活中，我们的脑海里经常会自动冒出一些小想法，比如：', false);
            appendSpecialCard(this.chatMessages, '刚才我是不是说错话了？');
            appendSpecialCard(this.chatMessages, '这个任务我可能做不好…');
            appendContinueButton(this.chatMessages);
            this.step = 0;
        } else if (this.step === 0) {
            appendAiMessage(this.chatMessages, '这些想法一旦出现，常常会让我们心里有点慌，甚至影响接下来的行动。但这些想法，就一定等于事实吗？', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们一起来做一个小实验。不是要分析想法，而是像科学家进行观察实验一样，亲自体验一次【想法如何影响我们的感受】。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '整个过程只需要10分钟左右，你可以完全按照自己的节奏来。如果你已经准备好，请在对话框中输入开始。', false);
            appendHint(this.chatMessages, '请在对话框中输入你的回答');
            this.enableInputForModule(this.chatMessages);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '首先，请为自己找一个舒适的坐姿，放松肩膀。然后轻轻闭上眼睛或者看着前方，让自己的身体先放松下来，不用紧张，跟着我的指令做就好。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessageWithTimer(this.chatMessages, '现在，请你在心里，或者轻声跟着我说【我现在特别想喝牛奶】，让我们一起重复5次，每说一次，都试着感受自己心里或身体的变化。', 17000, () => {
                this.onContinue_Module15();
            }, { hideCountdown: true });
            playManagedAudio(this.chatMessages, module15MilkExperienceAudioPath, { mimeType: 'audio/mpeg' });
            this.step = 5;
        } else if (this.step === 5) {
            this.startSentenceRepetition();
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '体验结束。现在，请回顾一下刚才的过程。随着每一次的重复，你是否有注意到任何微小的变化？', true);
            this.step = 7;
        }
    },

    // 模块1-4和1-6对话流程

    startSentenceRepetition() {
        const sentence = '我现在特别想喝牛奶。';
        const reflectionText = '这是第一次重复。感受一下，当这个句子出现在脑海里时，发生了什么？';
        let sequence = 0;

        const showNext = () => {
            if (sequence === 0) {
                appendAiMessageWithTimer(this.chatMessages, sentence, 7000, () => {
                    sequence++;
                    showNext();
                }, { hideCountdown: true });
            } else if (sequence === 1) {
                appendAiMessageWithTimer(this.chatMessages, reflectionText, 20000, () => {
                    sequence++;
                    showNext();
                }, { hideCountdown: true });
            } else if (sequence >= 2 && sequence <= 4) {
                appendAiMessageWithTimer(this.chatMessages, sentence, 7000, () => {
                    sequence++;
                    showNext();
                }, { hideCountdown: true });
            } else if (sequence === 5) {
                appendAiMessageWithTimer(this.chatMessages, sentence, 10000, () => {
                    sequence++;
                    showNext();
                }, { hideCountdown: true });
            } else if (sequence === 6) {
                appendContinueButton(this.chatMessages);
                this.step = 6;
            }
        };

        showNext();
    }

    // 状态按钮点击处理（模块1-2）
};

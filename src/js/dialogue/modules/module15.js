import {
    appendAiMessage,
    appendSpecialCard,
    appendContinueButton,
    appendHint,
    appendAiMessageWithTimer,
    playManagedAudio,
    disableInput,
    appendButtonGroup
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
            appendAiMessage(this.chatMessages, '整个过程只需要几分钟，你可以完全按照自己的节奏来。如果你已经准备好，请在对话框中输入开始。', false);
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
        }else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '例如身体上，喉咙或嘴巴的感觉？胃部的感觉？', true);
            this.step = 8;
        }else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '例如心理上，是否短暂地觉得“好像真的有点想喝了”？或者产生了“牛奶好像挺香”的画面？或者冒出了“我该去喝一杯吗？”的想法？', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '请根据你的感受选择选项。请记住，没有标准答案。', false);
            appendButtonGroup(this.chatMessages, ['身体有感觉', '心理有感觉', '没有任何感觉'], (choice) => {
                const removeCurrentButtonGroup = (chatMessages) => {
                    const currentBtnGroup = chatMessages.querySelector('.button-group');
                    if (currentBtnGroup) currentBtnGroup.remove();
                };

                removeCurrentButtonGroup(this.chatMessages);

                if (/^(身体有感觉|心理有感觉)/.test(choice)) {
                    appendAiMessage(this.chatMessages, '感谢你的观察。你亲身验证了一个心理现象：仅仅在脑海中重复一个想法（我想喝牛奶），我们的身体或心理就可能产生相应的反应（如嘴里的感觉、想喝的冲动）。但这和“我身体此刻真的需要牛奶或者营养”这个事实，是两回事。想法可以引发真实的感受，但想法本身不是事实。', true);
                    appendAiMessage(this.chatMessages, '生活中也是如此。当例如“我可能会失败”这个想法出现时，它引发的焦虑感非常真实。但这个想法不等于失败的事实。关键的一步，就是学会在想法产生时，对自己说：我注意到我有一个“可能会失败”的想法。', true);
                    appendAiMessage(this.chatMessages, '这样，我们就从“被想法控制”，变成了“观察想法”。', true);
                } else if (/^没有任何感觉/.test(choice)) {
                    appendAiMessage(this.chatMessages, '感谢你的分享。你的体验同样重要，它说明了：即使同一个想法反复出现，我们每个人与它的距离也可以是不一样的。你能平静地观察它，而不被它带动，这本身就是一种心理能力，即觉察而不卷入。', true);
                    appendAiMessage(this.chatMessages, '在生活中，当例如“我可能做不好”的想法出现时，如果你能像现在这样，注意到它，但不自动相信它就是事实，从而将想法从事实中分离出来看待，便已经迈出了第一步。', true);
                }

                // 分支合并内容
                appendAiMessage(this.chatMessages, '今天的练习就像一个显微镜，让我们放慢速度，亲眼看到想法如何运作。', false);
                appendAiMessage(this.chatMessages, '这个过程，不是要消灭任何担忧、消极的想法，而是培养一种新的关系：从“我是我的想法”，转变为“我有一个想法”。', false);
                appendAiMessage(this.chatMessages, '当你在被某个反复出现的想法困扰时，可以回想今天这个牛奶体验练习。提醒自己：这只是一个正在我脑海里播放的想法频道，我可以选择换台，或者只是听着，但不一定要相信它的所有广告。', false);
                appendAiMessage(this.chatMessages, '今天你完成了一次练习：想法可以产生感觉，但想法不等于事实。因此要观察想法，而非成为想法。', false);
                appendAiMessage(this.chatMessages, '为了帮助你将来更好地将这项技能应用于生活，这里有一个日常练习锦囊：生活中，每当你感觉被某个想法困住时，尝试在它前面加上一句：“我注意到我正在想…” 这个简单的句式，能帮你与想法拉开距离，重获主动权。', false);
                appendContinueButton(this.chatMessages);
                try {
                    disableInput(this.inputArea, this.userInput);
                } catch (e) {
                    // ignore
                }

                this.step = 10;
            });
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

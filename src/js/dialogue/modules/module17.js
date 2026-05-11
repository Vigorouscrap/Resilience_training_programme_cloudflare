import {
    appendAiMessage,
    appendSpecialCard,
    appendContinueButton,
    appendButtonGroup,
    appendAiMessageWithTimer,
    disableInput
} from '../../ui.js';

export const module17Handlers = {
    onContinue_Module17Docx() {
        if (this.step === 0) {
            appendSpecialCard(this.chatMessages, '<p>正念呼吸 —— 练习“回到当下”</p><p>情绪接收站 —— 学习“看见”感受</p><p>牛奶实验 —— 体验“思维 ≠ 事实”</p>');
            appendContinueButton(this.chatMessages);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们不做新的练习，而是一起看看这周的旅程带给了我们什么。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：正念呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短的正念呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.step = 3;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 3) {
            appendAiMessageWithTimer(this.chatMessages, '首先，请采取一个舒适的固定姿势：无论盘腿、坐在椅子上、站立甚至躺卧，务求姿势能够舒服、持久，腰身能够轻松、自然。双手可以自然放在膝盖上，或者放在身体两侧。', 5000, () => {
                this.step = 4;
                this.onContinue();
            });
        } else if (this.step === 4) {
            appendAiMessageWithTimer(this.chatMessages, '如果你身边有其他电子设备或可能打扰自己的物品，可以暂时将它们放在一边。接下来几分钟，是全然属于你自己的时间。', 5000, () => {
                this.step = 5;
                this.onContinue();
            });
        } else if (this.step === 5) {
            appendAiMessageWithTimer(this.chatMessages, '现在，如果你愿意，可以慢慢闭上眼睛。如果不习惯闭眼，也可以轻轻看着前方的地面。让身体自然地呼吸，心只是跟随自己的呼吸、觉察自己的呼吸，感受‘呼吸正在发生’这件事。当呼气的时候知道自己是在呼气，当吸气的时候知道自己是在吸气；当气息长的时候知道是气息长，当气息短的时候知道是气息短；当呼吸的感觉明显的时候知道呼吸的感觉是明显的，当呼吸的感觉不明显的时候知道呼吸的感觉是不明显的。', 5000, () => {
                this.step = 6;
                this.onContinue();
            });
        } else if (this.step === 6) {
            appendAiMessageWithTimer(this.chatMessages, '也可以留意空气进入鼻子时的感觉：鼻尖有没有一丝清凉？呼出空气时，嘴唇周围有没有暖暖的气流？如果暂时感受不到这些细节，也没关系。就只是知道‘我在吸气，我在呼气’，这就是很好的开始。', 5000, () => {
                this.step = 7;
                this.onContinue();
            });
        } else if (this.step === 7) {
            appendAiMessageWithTimer(this.chatMessages, '随着我们继续观察呼吸，可能会有各种体验出现。有时你会感到平静、放松，甚至有一些愉快的念头或美好的画面浮现。这些都很珍贵，但不用紧紧抓住这些感觉。就像看着窗外飞过的小鸟，看到时会开心，飞走了也不用失落。呼吸一直在，我们的注意力只是跟着它来来去去。', 5000, () => {
                this.step = 8;
                this.onContinue();
            });
        } else if (this.step === 8) {
            appendAiMessageWithTimer(this.chatMessages, '有时注意力会跑到积极的念头上，轻轻把它拉回呼吸就好，不用觉得“没抓住美好的感觉真可惜”。若注意力再次、再三跑到别处时，就再次、再三地觉察并柔和地把它带回呼吸之上即可。有时呼吸变得明显，有时又不那么明显；有时呼吸快，有时呼吸慢。这些都是正常的。我们只是一个观察者，观察这一切的自然变化。', 5000, () => {
                this.step = 9;
                this.onContinue();
            });
        } else if (this.step === 9) {
            const repetitionText = '呼吸来来去去，感觉来来去去，我们只是观察……注意力飘走了，就温柔地把它带回来……不用评判，只是觉察……';
            const runRepeat = (count) => {
                if (count <= 0) {
                    this.step = 10;
                    this.onContinue();
                    return;
                }
                appendAiMessageWithTimer(this.chatMessages, repetitionText, 40000, () => runRepeat(count - 1));
            };
            runRepeat(5);
        } else if (this.step === 10) {
            appendAiMessageWithTimer(this.chatMessages, '现在我们慢慢做3次深呼吸。第一次吸气，感受空气充满胸腔，呼气，让身体再放松一点；第二次吸气，感受腹部的起伏，呼气，让肩膀再下沉一点；第三次吸气，感受全身的轻松，再慢慢呼气。', 5000, () => {
                this.step = 11;
                this.onContinue();
            });
        } else if (this.step === 11) {
            appendAiMessageWithTimer(this.chatMessages, '先慢慢活动一下手指和脚趾，感受血液在指尖、脚尖流动的感觉；再轻轻转动一下脖子，避免突然用力；最后慢慢睁开眼睛，先看看自己的双手，再看看身边的环境，让注意力一点点回到现实中。', 5000, () => {
                this.step = 12;
                this.onContinue();
            });
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的正念呼吸相比，这一次的正念呼吸是否感觉更自然一些、更容易进入状态？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.module17State.breathAnswers.push(answer);
                this.step = 13;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，注意力是否依然容易飘走？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.module17State.breathAnswers.push(answer);
                this.step = 14;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，呼吸的节奏是否有所不同？', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                // this.clearInteractiveControls();
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.module17State.breathAnswers.push(answer);
                this.step = 15;
                this.onContinue_Module17Docx();
            });
        } else if (this.step === 15) {
            const yesCount = this.module17State.breathAnswers.filter(a => a === '是').length;
            const summary = yesCount >= 2
                ? '你与呼吸的联结更自然了，这意味着呼吸本身已成为一个稳定的觉察对象，你可以更容易通过呼吸回到当下。'
                : '注意力跑走是正常的，能一次次把它带回来，本身就是很重要的练习。';
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
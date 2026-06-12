import {
    appendAiMessage,
    appendButtonGroup,
    appendHint,
    appendSpecialCard,
    appendContinueButton,
    appendAiMessageWithTimer,
    disableInput
} from '../../ui.js';
import { runAiHook } from '../aiHookRunner.js';

export const module13Handlers = {
    onContinue_Module13() {
        if (this.step === -1) {
            appendAiMessage(this.chatMessages, '我们在日常生活中，都会遇到一些让我们心里感到\'有负担\'或\'不舒服\'的事情，可能是工作、学习上的，也可能是家庭或人际关系等等。这些事情带来的感受都是我们生活的一部分，非常正常。接下来的几分钟里，我们不是要\'解决\'问题，而是一起\'看见\'和\'承认\'这些问题带来的感受。', true);
            this.step = 0;
        } else if (this.step === 0) {
            appendAiMessage(this.chatMessages, '现在，我邀请你在下方的输入框中，<strong>简单写下一件近期让你觉得有压力的事</strong>。不需要写细节，简单描述即可（例如：\'最近晚上总睡不好\'、\'与同事有些摩擦相处不大愉快\'）。请放心，所有的对话记录都将完全匿名化处理，不会保存任何身份信息。请放心真实地表达。', false);
            appendHint(this.chatMessages, '请在对话框中输入你的回答');
            this.enableInputForModule(this.chatMessages);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '你有4分钟的时间思考和输入。不用着急，慢慢来。写的时候不必强迫自己回忆不愉快或不好的事，跟着自己的感觉来就好。', true);
            this.step = 2;
        }
    },

    // 模块1-5对话流程

    onContinue_Module13Docx() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '我们在日常生活中，有时会遇到一些让我们心里感到“有负担”或“不舒服”的事情——可能是工作、学习上的，也可能是家庭或人际关系等等。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '这些事情带来的感受都是我们生活的一部分，非常正常。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '接下来的几分钟，我们不是要“解决”问题，而是一起尝试“看见”和“承认”这些问题带来的感受。', false);
            appendButtonGroup(this.chatMessages, ['已了解'], () => {
                // this.clearInteractiveControls();
                // console.log('按钮被点击');
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.step = 3;
                this.onContinue_Module13Docx();
            });
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '现在，请你在下方的输入框中，简单写下一件近期让你觉得有压力的事。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '不需要写太多细节，简单描述即可。（例如：“最近晚上总睡不好”、“与同事有些摩擦相处不大愉快”）', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '请放心，所有的对话记录都将完全匿名化处理，不会保存任何身份信息，请放心真实地表达。', true);
            this.step = 6;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '你有4分钟的时间思考和输入。不用着急，慢慢来。写的时候不必强迫自己回忆不愉快或不好的事，跟着自己的感觉来就好。', false);
            appendHint(this.chatMessages, '如果暂时没有想法，也可以先停一停，想到什么再写。');
            this.enableInputForModule(this.chatMessages);
            this.step = 7;
        } else if (this.step === 7) {
            const eventText = this.module13State.eventText || '（未填写具体事件）';
            appendAiMessage(this.chatMessages, '感谢你的分享。接下来，我将你刚才描述的内容转化为一个匿名的“情绪卡片”。', false);
            appendSpecialCard(this.chatMessages, `<p><strong>匿名情绪卡片</strong></p><p>${this.escapeHtml(eventText)}</p>`);
            appendContinueButton(this.chatMessages);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '现在，请看着这张情绪卡片。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '此刻你想到上面这件事时，你的身体出现了什么特别的感觉？', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '是否出现胸口有些发闷、肩膀不自觉绷紧，或是喉咙有些发干的感觉？你可以仔细体会一下，然后将自己身体的感觉简单输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '当身体有这些感觉时，脑海里有没有浮现出一些小念头？', true);
            this.step = 13;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '当身体有这些感觉时，脑海里有没有浮现出一些小念头？', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '比如“这种情况什么时候能改善”，或者“我是不是反应过度了”。现在你可以将脑海中出现的小念头输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '无论是什么念头，这都是我们此刻情绪感受的见证。', true);
            this.step = 16;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '无论是什么念头，这都是我们此刻情绪感受的见证。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessageWithTimer(this.chatMessages, '我们花一分钟的时间再来感受一下。请记得不用评判对错，只是像观察云朵一样，轻轻地看着它们飘过。', 60000, () => {
                appendContinueButton(this.chatMessages);
                this.step = 17;
            });
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '今天我们一起试着“看见”了情绪带来的身体反应和念头。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '无论是有点不自在的感觉，还是担忧的念头，都是很正常的。心理弹性不是让我们面对任何压力和事件都“没有情绪”，而是能够在情绪中依然保持觉察和选择。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '记得，我们不用强迫自己“必须开心”，也不用害怕这些感受，先允许它们存在，就是一个开始。', true);
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '今天的练习就到这里了。在日常生活中遇到一些事件和压力的时候，我们可以首先尝试使用今天的方式来看见情绪、感受情绪。', false);
        }
    },

    async handleModule13DocxUserMessage(text) {
        if (this.step === 7) {
            this.module13State.eventText = text;
            disableInput(this.inputArea, this.userInput);
            this.onContinue();
        } else if (this.step === 11) {
            this.module13State.bodyText = text;
            disableInput(this.inputArea, this.userInput);

            const activeSessionId = this.dialogueSessionId;
            const response = await runAiHook({
                hookId: 'module-1-3.body-sensation-reflection',
                moduleId: '1-3',
                step: 11,
                userInput: text,
                context: {
                    eventText: this.module13State.eventText || '',
                    questionType: 'body_sensation'
                },
                fallbackText: '你已经注意到身体里的感觉，或暂时没有特别明显的变化，这都是身体在传递给你的信息。'
            });

            if (this.dialogueSessionId !== activeSessionId || this.currentModule !== '1-3') {
                return;
            }

            appendAiMessage(this.chatMessages, response.replyText, true);
            this.step = 12;
        } else if (this.step === 14) {
            this.module13State.thoughtText = text;
            disableInput(this.inputArea, this.userInput);

            const activeSessionId = this.dialogueSessionId;
            const response = await runAiHook({
                hookId: 'module-1-3.thought-reflection',
                moduleId: '1-3',
                step: 14,
                userInput: text,
                context: {
                    eventText: this.module13State.eventText || '',
                    bodyText: this.module13State.bodyText || '',
                    questionType: 'thought_reflection'
                },
                fallbackText: '能看见这些小念头本身就很重要。很多人在这样的时刻都会有类似的想法，我们可以先不评判它。'
            });

            if (this.dialogueSessionId !== activeSessionId || this.currentModule !== '1-3') {
                return;
            }

            appendAiMessage(this.chatMessages, response.replyText, true);
            this.step = 15;
        }
    }

};

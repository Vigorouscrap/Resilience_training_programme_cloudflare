/**
 * dialogue.js - 对话逻辑和流程管理
 * 负责各个模块的对话流程和交互逻辑
 */

import {
    appendAiMessage, appendUserMessage, appendSpecialCard, removeContinueButton,
    appendContinueButton, appendHint, appendUnderstandButton, appendTimedCard,
    appendButtonGroup, appendCardActionButtons, appendAiMessageWithTimer, disableInput
} from './ui.js';
import { stateDescriptions } from './data.js';

export class DialogueManager {
    constructor(chatMessages, inputArea, userInput) {
        this.chatMessages = chatMessages;
        this.inputArea = inputArea;
        this.userInput = userInput;
        this.step = -1;
        this.currentModule = null;
        this.participant = { name: '朋友', habit: '那个习惯', quality: '内在品质' };
        this.module12State = {
            visitedButtons: new Set(),
            phase: 'dialogue'
        };
    }

    resetForModule(module) {
        this.currentModule = module;
        this.chatMessages.innerHTML = '';
        this.step = -1;
        this.participant = { name: '', habit: '', quality: '' };
        disableInput(this.inputArea, this.userInput);

        if (module === '1-1') {
            appendAiMessage(this.chatMessages, '你好，欢迎你加入香港大学研究团队开发的心理弹性个人成长计划！我是你的心理弹性训练引导伙伴，在接下来的时间里，我将全程陪伴你，一起完成这个心理弹性培养旅程。', true);
        } else if (module === '1-2') {
            this.module12State.visitedButtons = new Set();
            this.module12State.phase = 'dialogue';
            appendAiMessage(this.chatMessages, '欢迎来到今天的练习。在开始之前，我想和你分享一个概念：心的住处。', true);
        } else if (module === '1-5') {
            appendAiMessage(this.chatMessages, '你好，欢迎来到今天的练习。', true);
        } else if (module === '1-4' || module === '1-6') {
            appendAiMessage(this.chatMessages, '欢迎来到今日的练习！', true);
            this.step = 5;
        }
    }

    onContinue() {
        removeContinueButton();

        if (this.currentModule === '1-2') {
            this.onContinue_Module12();
        } else if (this.currentModule === '1-3') {
            this.onContinue_Module13();
        } else if (this.currentModule === '1-5') {
            this.onContinue_Module15();
        } else if (this.currentModule === '1-4' || this.currentModule === '1-6') {
            this.onContinue_Module14Or16();
        } else {
            this.onContinue_Module11();
        }
    }

    // 模块1-1对话流程
    onContinue_Module11() {
        if (this.step === -1) {
            appendAiMessage(this.chatMessages, '在开始任何练习之前，建立真诚的连接和清晰的意图至关重要。 所以今天的第一课，我们不学习复杂的技术，而是完成两件重要的事：', true);
            this.step = 0;
        } else if (this.step === 0) {
            appendSpecialCard(this.chatMessages, `<p><strong>a. 让我认识你，了解你的基本情况。</strong></p><p><strong>b. 让你了解这段旅程，知道我们将去向何方，以及如何安全同行。</strong></p>`);
            appendContinueButton(this.chatMessages);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '现在，让我们从一个特别的"自我探索"小活动开始。', true);
            appendContinueButton(this.chatMessages);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '我想邀请你用3句话来介绍一下自己。这就像一个简单的心灵罗盘，帮助我们定位起点。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendSpecialCard(this.chatMessages, `<p>1：你的名字，或者你希望我如何称呼你。</p><p>2：你的家乡。可以写出它的名字并简单描述一下这个地方。</p><p>3：一个让你感到平静或快乐的小爱好。比如：听音乐、睡前读几页书、给植物浇水，甚至只是安静地发呆。</p>`);
            appendContinueButton(this.chatMessages);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '举个例子："我叫李娜，你可以叫我小娜。我来自广州，是一个四季温暖的地方。我喜欢傍晚散步，看天空颜色的变化。"', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '请不用追求完美或深刻，真实的感受就是最好的答案。你可以稍微思考一下，随时开始在对话框中输入你的内容。', false);
            appendHint(this.chatMessages, '请在对话框中输入你的回答');
            this.enableInputForModule(this.chatMessages);
            this.step = 6;
        }
        // 更多步骤可以继续添加...
    }

    // 模块1-2对话流程
    onContinue_Module12() {
        if (this.step === -1) {
            appendAiMessage(this.chatMessages, '你可能会想：\'心\'还有住处吗？', true);
            this.step = 0;
        } else if (this.step === 0) {
            appendAiMessage(this.chatMessages, '是的。我们的生命不仅仅是靠食物、水和空气这些物质而活，还依靠感官感受、意志和自我感而维持和延续。后三者，心都参与其中。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '心一直都左右着我们的动机与行为，只是我们习惯留意外部而没有察觉。心会住在哪里?', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendHint(this.chatMessages, '下面举例了心的几个住处，尝试点击来看看分别代表什么意思吧！');
            const allStates = ['觉知', '贪欲', '愤怒', '昏沉'];
            appendButtonGroup(this.chatMessages, allStates, (stateName, btn) => this.onStateButtonClick(stateName, btn));
            this.module12State.phase = 'cards';
            this.step = 3;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '因此接下来的练习，就是帮助我们学习如何让心更常住在\'觉知\'和\'祥和\'中。', true);
            this.step = 5;
        }
        // 继续添加更多步骤...
    }

    // 模块1-3对话流程
    onContinue_Module13() {
        if (this.step === -1) {
            appendAiMessage(this.chatMessages, '我们在日常生活中，都会遇到一些让我们心里感到\'有负担\'或\'不舒服\'的事情，可能是工作、学习上的，也可能是家庭或人际关系等等。这些事情带来的感受都是我们生活的一部分，非常正常。接下来的几分钟里，我们不是要\'解决\'问题，而是一起\'看见\'和\'承认\'这些问题带来的感受。', true);
            this.step = 0;
        } else if (this.step === 0) {
            appendAiMessage(this.chatMessages, '现在，我邀请你在下方的输入框中，<strong>简单写下一件近期让你觉得有压力的事</strong>。不需要写细节，简单描述即可（例如：\'最近晚上总睡不好\'、\'与同事有些摩擦相处不大愉快\'）。请放心，所有的对话记录都将完全匿名化处理，不会保存任何身份信息。请放心真实地表达。', false);
            appendHint(this.chatMessages, '请在对话框中输入你的回答');
            this.enableInputForModule(this.chatMessages);
            this.step = 1;
        }
    }

    // 模块1-5对话流程
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
        }
        // 继续添加更多步骤...
    }

    // 模块1-4和1-6对话流程
    onContinue_Module14Or16() {
        if (this.step === 5) {
            appendAiMessage(this.chatMessages, '请注意这不是一次性的改变，而是像锻炼肌肉一样，每次练习，都在强化这种能力。', false);
            appendUnderstandButton(this.chatMessages, () => {
                const card1Content = '这个练习名为冥想呼吸。我们一生之中都在不断进行呼吸，而冥想呼吸的最终目的不是放松，而是像一个锚一样，当思绪被带走时，它能帮助我们一次次回到当下，意识到：我在这里，我在呼吸，我是那个注意到这一切的人。';
                appendTimedCard(this.chatMessages, card1Content, 30);
                this.step = 6;
            });
        } else if (this.step === 6) {
            const card2Content = '在练习时，觉察自己每一次呼气与吸气，通过这样的练习：<br><br>我们会感到自己持续的觉察力会变强，对当下的事情更加清楚；心也会更容易安静下来，就像给胡思乱想装了"刹车片"，能让纷扰的念头快速停止。从呼吸的变化中我们还会直接体会到，一切都在变化，没有什么是固定不变的。有了这种看透变化的智慧，就自然懂得放下，活得更轻松。';
            appendTimedCard(this.chatMessages, card2Content, 30);
            this.step = 7;
        }
        // 继续添加更多步骤...
    }

    // 状态按钮点击处理（模块1-2）
    onStateButtonClick(stateName, btn) {
        this.module12State.visitedButtons.add(stateName);
        removeContinueButton();

        const buttonGroups = this.chatMessages.querySelectorAll('.button-group');
        buttonGroups.forEach(g => g.remove());

        const cardContent = stateDescriptions[stateName] || '';
        appendSpecialCard(this.chatMessages, cardContent);

        const allStates = ['觉知', '贪欲', '愤怒', '昏沉'];
        const allVisited = allStates.every(s => this.module12State.visitedButtons.has(s));

        if (allVisited) {
            appendCardActionButtons(
                this.chatMessages,
                true,
                () => this.onCardBackClick(),
                () => this.onModule12Complete()
            );
        } else {
            appendCardActionButtons(
                this.chatMessages,
                false,
                () => this.onCardBackClick()
            );
        }
    }

    // 卡片返回按钮
    onCardBackClick() {
        const cards = this.chatMessages.querySelectorAll('.special-card');
        if (cards.length > 0) cards[cards.length - 1].remove();
        const actionBtns = this.chatMessages.querySelectorAll('.card-action-buttons');
        if (actionBtns.length > 0) actionBtns[actionBtns.length - 1].remove();

        const allStates = ['觉知', '贪欲', '愤怒', '昏沉'];
        appendButtonGroup(this.chatMessages, allStates, (stateName, btn) => this.onStateButtonClick(stateName, btn));
    }

    // 模块1-2完成处理
    onModule12Complete() {
        const cards = this.chatMessages.querySelectorAll('.special-card');
        if (cards.length > 0) cards[cards.length - 1].remove();
        const actionBtns = this.chatMessages.querySelectorAll('.card-action-buttons');
        if (actionBtns.length > 0) actionBtns[actionBtns.length - 1].remove();

        appendAiMessage(this.chatMessages, '心的不同住处决定了我们感受世界的方式，面对眼前的状况、情景而有不同的反应，可能聚焦在家庭，又可能是工作岗位；有时态度悲观，有时乐观；有时很认真，有时却很随和。', true);
        this.step = 4;
    }

    enableInputForModule(chatMessages) {
        this.inputArea.classList.remove('disabled');
        this.userInput.disabled = false;
        this.userInput.parentElement.querySelector('button').disabled = false;
        this.userInput.focus();
    }

    handleUserMessage(text) {
        if (!text.trim()) return;

        appendUserMessage(this.chatMessages, text);

        if (this.currentModule === '1-1' && this.step === 6) {
            // 提取用户信息
            let name = '朋友', habit = '那个习惯', quality = '内在品质';
            if (text.includes('我叫') || text.includes('我是')) {
                let match = text.match(/(?:我叫|我是|称呼我)[\s,，]*([^\s,，]{1,8})/);
                if (match) name = match[1];
            }
            if (text.includes('喜欢')) {
                let m = text.match(/喜欢[\s,，]*([^。，]{2,12})/);
                if (m) habit = m[1];
            }
            if (text.includes('品质') || text.includes('培养')) {
                let m = text.match(/培养[\s,，]*([^。，]{2,12})/);
                if (m) quality = m[1];
            }
            this.participant.name = name;
            this.participant.habit = habit;
            this.participant.quality = quality;

            disableInput(this.inputArea, this.userInput);
            this.step = 7;
            this.onContinue();
        }
    }
}

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
        this.module13State = {
            eventText: '',
            bodyText: '',
            thoughtText: ''
        };
        this.module17State = {
            breathAnswers: [],
            clarityAnswer: '',
            thoughtOccurrence: '',
            techniqueAnswer: ''
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
        } else if (module === '1-3') {
            this.module13State = {
                eventText: '',
                bodyText: '',
                thoughtText: ''
            };
            appendAiMessage(this.chatMessages, '欢迎来到今日的练习！', true);
            this.step = 0;
        } else if (module === '1-7') {
            this.module17State = {
                breathAnswers: [],
                clarityAnswer: '',
                thoughtOccurrence: '',
                techniqueAnswer: ''
            };
            appendAiMessage(this.chatMessages, '欢迎来到这一周的回顾总结。', true);
            this.step = 0;
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
            this.onContinue_Module13Docx();
        } else if (this.currentModule === '1-7') {
            this.onContinue_Module17Docx();
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
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, `针对习惯：“${this.participant.habit}”是一个非常棒的自我关怀方式，它能帮助我们与当下的生活建立一种舒缓的连接。针对品质：你提到了希望培养“${this.participant.quality}”，这真是一个深刻而重要的起点。这正是心理弹性的核心组成部分之一，我们的很多练习都会围绕它展开。`, true);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '感谢你的分享！通过这个简单的介绍，我已经初步了解到你的家乡和你的爱好。那么我也分享一下，作为你的引导员，我喜欢阅读，这能让我更专注，也能让我更好地陪伴和倾听每一位参与者。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '现在，我们可以进入到下一步：我想向你介绍我们将要共同经历的心理旅程。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '首先是心理弹性训练方法的概况。我们的训练结合了正念和接纳承诺疗法的理论基础，核心理念可以用三句话来概括：', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendSpecialCard(this.chatMessages, `
                <p>• 它不是教我们如何永远快乐、消除所有负面情绪——因为那既不现实，也会让我们与真实的生命体验产生对抗。</p>
                <p>• 它的目标是，帮助我们培养一种能力：能够与各种内在体验（包括痛苦的情绪、挑战性的想法）和平共处，同时，依然可以清晰地朝着自己认为重要的方向和价值观去生活。</p>
                <p>• 这种‘与体验共处，朝价值前行’的能力，能够让我们在压力面前，不仅能‘扛得住’，更能‘灵活适应’，并持续朝着自己的方向前进。</p>
            `);
            appendContinueButton(this.chatMessages);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '我们的旅程将这样展开：进行为期6周的系统训练。这6周内的每一天我们都会进行一个模块的练习，这些模块通过案例故事、沉浸式体验、日常小练习等不同方式来展开。', true);
            this.step = 12;
        } else if (this.step === 12) {
            appendSpecialCard(this.chatMessages, `
                <p>- 第1周，我们重点学习‘觉察’。初步认识并尝试看见情绪与思维。</p>
                <p>- 第2、3周，我们学习“接纳”，像熟悉天气一样熟悉自己的情绪，像允许四季流转一样允许所有感受的存在。</p>
                <p>- 第4、5周，我们进一步聚焦‘解离’并体验‘观察性自我’：学习将想法看作脑海中的字符，将情绪看作身体的天气，并看清这些体验背后你真正在乎的生活方向。</p>
                <p>- 第6周，我们整合‘价值’并练习‘承诺行动’：带着全部的体验，朝着价值方向，迈出微小而坚定的步伐。</p>
            `);
            appendContinueButton(this.chatMessages);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '卡片展示的内容中，可能有些词你会暂时不理解，不用担心，在接下来的训练中，我们会通过具体的练习和案例，慢慢地展开每一个概念。', true);
            appendContinueButton(this.chatMessages);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '后续的每一次练习都像给内心的肌肉做一次锻炼，简单但需要你的投入。', true);
            appendContinueButton(this.chatMessages);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '任何深入的探索，都需要一个安全、信任的空间。为了守护这个属于你的成长空间，我想和你确认几条重要的心灵安全准则：', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendSpecialCard(this.chatMessages, '<p>a. 保密原则：过程中我们分享的个人信息都是保密的，不对外传播。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 17;
        } else if (this.step === 17) {
            appendSpecialCard(this.chatMessages, '<p>b. 不评判原则：我们不对自己的感受和想法做好坏、对错的评判。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 18;
        } else if (this.step === 18) {
            appendSpecialCard(this.chatMessages, '<p>c. 自愿参与：你有权决定自己分享的深度和内容，你可以选择 ‘过’而不回答。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 19;
        } else if (this.step === 19) {
            appendSpecialCard(this.chatMessages, '<p>d. 聚焦当下：我们尽量关注 ‘此时此地’的感受和体验。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 20;
        } else if (this.step === 20) {
            appendSpecialCard(this.chatMessages, '<p>e. 营造环境：每次练习时请选择一个安静独立的、不被打扰的空间。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '介绍模块就到这里了。今天，我们共同完成了三件至关重要的事：\na我们建立了初步连接：认识了独特的你，以及你提到你喜欢的[' + this.participant.habit + ']与你的愿望[' + this.participant.quality + ']。\nb我们看清了旅程的目标：你了解了这是一段关于培养‘与体验共处、朝价值前行’能力的旅程，它科学、系统且充满关怀。\nc我们筑好了护栏：我们确认了共同维护一个安全、不评判的探索空间。', true);
            appendContinueButton(this.chatMessages);
            this.step = 22;
        } else if (this.step === 22) {
            appendAiMessage(this.chatMessages, '你已经为这段旅程打下了最坚实的地基——那就是你愿意探索的初心，和你已经拥有的自我关怀的微小火花（比如你的那个小习惯）。', true);
            this.step = 23;
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '最后，送给你今天的小小练习：\n在今晚睡前，花一分钟回想一下你的那个小习惯，并简单地体验它一会儿。同时，在心里对自己温柔地说：‘我在培养[' + this.participant.quality + ']的路上，开始了第一步。’\n祝你今天拥有属于自己的平静或快乐时刻。我们明天再见。', false);
            this.step = 24;
        }
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
        } else if (this.step === 5) {
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
        } else if (this.step >= 7) {
            this.continueBreathingPractice();
        }
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
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '你有4分钟的时间思考和输入。不用着急，慢慢来。写的时候不必强迫自己回忆不愉快或不好的事，跟着自己的感觉来就好。', true);
            this.step = 2;
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
            appendAiMessage(this.chatMessages, '现在，请你在心里，或者轻声跟着我说【我现在特别想喝牛奶】，让我们一起重复5次，每说一次，都试着感受自己心里或身体的变化。', true);
            this.step = 5;
        } else if (this.step === 5) {
            this.startSentenceRepetition();
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '体验结束。现在，请回顾一下刚才的过程。随着每一次的重复，你是否有注意到任何微小的变化？', true);
            this.step = 7;
        }
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
        } else if (this.step >= 7) {
            this.continueBreathingPractice();
        }
    }

    continueBreathingPractice() {
        if (this.step === 7) {
            appendAiMessage(this.chatMessages, '现在，我们就来做这个练习。请跟随指令一步步进行。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '首先，请采取一个舒适的固定姿势：无论盘腿、坐在椅子上、站立甚至躺卧，务求姿势能够舒服、持久，腰身能够轻松、自然。双手可以自然放在膝盖上，或者放在身体两侧。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '如果你身边有其他电子设备或可能打扰自己的物品，可以暂时将它们放在一边。接下来几分钟，是全然属于你自己的时间。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '现在，如果你愿意，可以慢慢闭上眼睛。如果不习惯闭眼，也可以轻轻看着前方的地面。让身体自然地呼吸，心只是跟随自己的呼吸、觉察自己的呼吸，感受‘呼吸正在发生’这件事。当呼气的时候知道自己是在呼气，当吸气的时候知道自己是在吸气；当气息长的时候知道是气息长，当气息短的时候知道是气息短；当呼吸的感觉明显的时候知道呼吸的感觉是明显的，当呼吸的感觉不明显的时候知道呼吸的感觉是不明显的。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '也可以留意空气进入鼻子时的感觉：鼻尖有没有一丝清凉？呼出空气时，嘴唇周围有没有暖暖的气流？如果暂时感受不到这些细节，也没关系。就只是知道‘我在吸气，我在呼气’，这就是很好的开始。', true);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '随着我们继续观察呼吸，可能会有各种体验出现。有时你会感到平静、放松，甚至有一些愉快的念头或美好的画面浮现。这些都很珍贵，但不用紧紧抓住这些感觉。就像看着窗外飞过的小鸟，看到时会开心，飞走了也不用失落。呼吸一直在，我们的注意力只是跟着它来来去去。', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '有时注意力会跑到积极的念头上，轻轻把它拉回呼吸就好，不用觉得‘没抓住美好的感觉真可惜’。若注意力再次、再三跑到别处时，就再次、再三地觉察并柔和地把它带回呼吸之上即可。有时呼吸变得明显，有时又不那么明显；有时呼吸快，有时呼吸慢。这些都是正常的。我们只是一个观察者，观察这一切的自然变化。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '呼吸来来去去，感觉来来去去，我们只是观察......注意力飘走了，就温柔地把它带回来......不用评判，只是觉察......', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '现在我们慢慢做3次深呼吸。第一次吸气，感受空气充满胸腔，呼气，让身体再放松一点；第二次吸气，感受腹部的起伏，呼气，让肩膀再下沉一点；第三次吸气，感受全身的轻松，再慢慢呼气。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '先慢慢活动一下手指和脚趾，感受血液在指尖、脚尖流动的感觉；再轻轻转动一下脖子，避免突然用力；最后慢慢睁开眼睛，先看看自己的双手，再看看身边的环境，让注意力一点点回到现实中。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '刚才练习的这几分钟，你的心住在哪里？也许它大部分时间都住在了‘观察呼吸’这件事上。也许它偶尔溜到了其他念头里，然后被你带了回来。这就是选择心的住处的练习。不是强迫心永远停留在某个地方，而是当它离开时，我们有能力邀请它回来。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '你刚才可能体验到：积极的感觉和呼吸一样，会自然出现，也会自然离开。我们不用刻意追求或留住它们。无论是开心还是平静，都是当下的美好。当我们能够觉察到这些来来去去，我们就有了更多的自由，即不被好的感觉‘绑住’，也不被不好的感觉‘困住’。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '今天的练习就到这里，你做得很好。每一次你把注意力带回呼吸，你都在为自己的心选择了一个更清醒、更自由的住处。', true);
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '冥想呼吸不是一种呼吸的训练，而是一种持续觉察的训练，一种让内心停下来的训练。内心若多一分停歇，可为自己的心灵带来多一分空间，多一分清净。这种练习能为内心带来耐性、专心、宁静、柔和、知足、减少情绪冲动等多种健康的心理素质，进一步更能为人带来超越忧、悲、苦、恼的智慧。而这种能力会随着练习越来越自然。未来几周里，我们会多次进行这种冥想练习。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '感谢你今天的时间。祝你拥有平静而觉察的一天。', false);
            this.step = 22;
        }
    }

    startSentenceRepetition() {
        const sentence = '我现在特别想喝牛奶。';
        const reflectionText = '这是第一次重复。感受一下，当这个句子出现在脑海里时，发生了什么？';
        let sequence = 0;

        const showNext = () => {
            if (sequence === 0) {
                appendAiMessageWithTimer(this.chatMessages, sentence, 5000, () => {
                    sequence++;
                    showNext();
                });
            } else if (sequence === 1) {
                appendAiMessageWithTimer(this.chatMessages, reflectionText, 5000, () => {
                    sequence++;
                    showNext();
                });
            } else if (sequence >= 2 && sequence <= 4) {
                appendAiMessageWithTimer(this.chatMessages, sentence, 5000, () => {
                    sequence++;
                    showNext();
                });
            } else if (sequence === 5) {
                appendAiMessageWithTimer(this.chatMessages, sentence, 10000, () => {
                    sequence++;
                    showNext();
                });
            } else if (sequence === 6) {
                appendContinueButton(this.chatMessages);
                this.step = 6;
            }
        };

        showNext();
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
            const bodyText = this.module13State.bodyText || '（没有特别明显的身体感觉）';
            appendAiMessage(this.chatMessages, `你觉察到${bodyText}，这是身体对这件事的自然反应。`, true);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '当身体有这些感觉时，脑海里有没有浮现出一些小念头？', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '比如“这种情况什么时候能改善”，或者“我是不是反应过度了”。现在你可以将脑海中出现的小念头输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 14;
        } else if (this.step === 14) {
            const thoughtText = this.module13State.thoughtText || '这些想法';
            appendAiMessage(this.chatMessages, `有这些念头很正常。你已经开始看见${thoughtText}了。`, true);
            this.step = 15;
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
    }

    handleModule13DocxUserMessage(text) {
        if (this.step === 7) {
            this.module13State.eventText = text;
            disableInput(this.inputArea, this.userInput);
            this.onContinue();
        } else if (this.step === 11) {
            this.module13State.bodyText = text;
            disableInput(this.inputArea, this.userInput);
            this.onContinue();
        } else if (this.step === 14) {
            this.module13State.thoughtText = text;
            disableInput(this.inputArea, this.userInput);
            this.onContinue();
        }
    }

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
    }

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
    }

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

    enableInputForModule(chatMessages) {
        this.inputArea.classList.remove('disabled');
        this.userInput.disabled = false;
        this.userInput.parentElement.querySelector('button').disabled = false;
        this.userInput.focus();
    }

    handleUserMessage(text) {
        if (!text.trim()) return;

        appendUserMessage(this.chatMessages, text);

        if (this.currentModule === '1-3') {
            this.handleModule13DocxUserMessage(text);
            return;
        }
        if (this.currentModule === '1-7') {
            this.handleModule17DocxUserMessage(text);
            return;
        }

        if (this.currentModule === '1-3' && this.step === 1) {
            disableInput(this.inputArea, this.userInput);
            this.step = 1;
            this.onContinue();
        } else if (this.currentModule === '1-5' && this.step === 3) {
            disableInput(this.inputArea, this.userInput);
            this.step = 3;
            this.onContinue();
        } else if (this.currentModule === '1-1' && this.step === 6) {
            // 提取用户信息
            let name = '朋友', habit = '那个习惯', quality = '内在品质';
            if (text.includes('我叫') || text.includes('我是')) {
                let match = text.match(/(?:我叫|我是|称呼我)[\s,，]*([^\s,，]{1,8})/);
                if (match) name = match[1];
            } else {
                name = text.split(/[ ,，]/)[0] || '参与者';
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
            this.step = 6;
            this.onContinue();
        }
    }
}

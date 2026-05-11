import {
    appendAiMessage,
    appendButtonGroup,
    appendSpecialCard,
    appendContinueButton,
    disableInput
} from '../../ui.js';

const module22Cases = {
    a: {
        option: 'a 张天（应对压力与焦虑）',
        storyHtml: '<p>案例一：张天是一名大四学生，面对“毕业即失业”的说法和身边同学陆续拿到签约工作的状况，他感到很有压力。家人也时时催促张天找工作的进度，并总说必须要找到一份高薪体面的工作，否则就代表这大学四年根本就没有好好学习。张天越来越焦虑，慢慢地为了逃避这种焦虑和可能的失败，<strong>他开始没日没夜地打游戏，拒绝参加任何招聘会，甚至不敢点开学校的就业指导邮件。</strong>他表面上对朋友说“不急，慢慢找”，但内心的自我怀疑和恐慌却与日俱增，整个人都处在一种“瘫痪”的状态。</p>',
        repeatStory: '张天是一名大四学生，面对“毕业即失业”的说法和身边同学陆续拿到签约工作的状况，他感到很有压力。家人也时时催促张天找工作的进度，并总说必须要找到一份高薪体面的工作，否则就代表这大学四年根本就没有好好学习。张天越来越焦虑，慢慢地为了逃避这种焦虑和可能的失败，他开始没日没夜地打游戏，拒绝参加任何招聘会，甚至不敢点开学校的就业指导邮件。他表面上对朋友说“不急，慢慢找”，但内心的自我怀疑和恐慌却与日俱增，整个人都处在一种“瘫痪”的状态。',
        emotionPrompt: '在张天的故事里，他“表面上说不急，但内心恐慌”。你认为他真正需要被看见的情绪是什么？请将你的想法输入在对话框中。',
        emotionResponse: '谢谢你的回答。是的，这些真正的情绪可能是他对未来的恐惧、对家人失望的担忧、对自我价值的怀疑、被比较的压力感等等。',
        impactPrompt: '这种“推开焦虑，用游戏麻痹自己”的方式，短期内好像让他好受些，但长远来看，你认为这对他造成了哪些影响？请将你的想法输入到对话框中发送。',
        impactCard: '<p>a 身心健康：焦虑不减反增，作息紊乱</p><p>b 自我认知：自我怀疑加深，行动力“瘫痪”</p><p>c 人际关系：与家人沟通更困难，回避朋友</p><p>d 现实发展：错过招聘机会，毕业压力更大</p><p>e 情绪模式：更习惯用逃避应对压力</p>',
        connectionPrompt: '在张天的故事里，你是否看到了一丝丝自己或身边人的影子？不需要分享具体经历，只需确认：'
    },
    b: {
        option: 'b 晓琳（处理关系与孤独）',
        storyHtml: '<p>案例二：晓琳和男友近几个月来争吵不断，关系变得很紧张。她感到非常受伤和孤独，内心渴望沟通和亲近。<strong>但每当她想开口谈谈时，心里就会冒出一个声音：“说了也没用，只会又吵起来，算了吧”。于是，她选择了沉默，把所有的委屈都压在心里，用加班和追剧填满所有时间，避免与伴侣独处。</strong>她以为自己“不计较”就能让事情过去，却发现两人之间的隔阂像一堵墙，越来越厚。</p>',
        repeatStory: '晓琳和男友近几个月来争吵不断，关系变得很紧张。她感到非常受伤和孤独，内心渴望沟通和亲近。但每当她想开口谈谈时，心里就会冒出一个声音：“说了也没用，只会又吵起来，算了吧”。于是，她选择了沉默，把所有的委屈都压在心里，用加班和追剧填满所有时间，避免与伴侣独处。她以为自己“不计较”就能让事情过去，却发现两人之间的隔阂像一堵墙，越来越厚。',
        emotionPrompt: '在晓琳的故事里，她表面上选择了不计较和沉默，你认为她真正需要被看见的情绪是什么？请将你的想法输入在对话框中。',
        emotionResponse: '谢谢你的回答。是的，这些真正的情绪可能是她对沟通失败的恐惧（害怕再吵起来）、对关系恶化的无助感、内心深处的孤独与渴望亲近未被正视等等。',
        impactPrompt: '这种“用加班和追剧填满所有时间，避免与伴侣独处”的方式，短期内好像让她好受些，但长远来看，你认为这对她造成了哪些影响？请将你的想法输入到对话框中发送。',
        impactCard: '<p>a 身心健康：疲劳累积，难以真正放松</p><p>b 自我认知：更不相信“沟通有用”</p><p>c 亲密关系：与伴侣的互动频率与质量持续下降</p><p>d 行为模式：更习惯用忙碌替代情绪表达</p><p>e 情绪变化：孤独感未减轻，对关系的无力感增强</p>',
        connectionPrompt: '在晓琳的故事里，你是否看到了一丝丝自己或身边人的影子？不需要分享具体经历，只需确认：'
    },
    c: {
        option: 'c 嘉怡（面对期待与自我要求）',
        storyHtml: '<p>案例三：32岁的嘉怡是团队负责人，最近工作压力很大，因为她很担心无法按时完成她手上负责的所有项目。但身边人都说“你能力这么强，肯定没问题”。<strong>敏敏强撑着，不再表达自己的压力，但工作效率明显下降，对原本热爱的工作也失去了热情，睡眠也变差了。</strong></p>',
        repeatStory: '32岁的嘉怡是团队负责人，最近工作压力很大，因为她很担心无法按时完成她手上负责的所有项目。但身边人都说"你能力这么强，肯定没问题"。敏敏强撑着，不再表达自己的压力，但工作效率明显下降，对原本热爱的工作也失去了热情，睡眠也变差了。',
        emotionPrompt: '在嘉怡的故事里，她被身边人评价为“能力很强”，她表面上并未否认或进一步解释，你认为她真正需要被看见的情绪是什么？请将你的想法输入在对话框中。',
        emotionResponse: '谢谢你的回答。是的，这些真正的情绪可能是她对项目延期的真实担忧、害怕让人失望的羞耻感、不敢求助的孤独感等等。',
        impactPrompt: '这种“强撑着，不再表达压力”的方式，短期内好像让她好受些，但长远来看，你认为这对她造成了哪些影响？请将你的想法输入到对话框中发送。',
        impactCard: '<p>a 身心健康：睡眠持续变差，身体进入慢性疲劳状态</p><p>b 工作表现：效率进一步下降，错误率可能增加</p><p>c 自我认知：越来越不相信“可以示弱”，把疲惫等同于失败</p><p>d 情绪模式：对原本热爱的工作产生疏离感，热情难以恢复</p><p>e 人际关系：身边人继续认为“她没问题”，真实支持越来越少</p><p>f 现实风险：项目若真的延期，她会更强烈地自责，而不是归因于资源或压力</p>',
        connectionPrompt: '在嘉怡的故事里，你是否看到了一丝丝自己或身边人的影子？不需要分享具体经历，只需确认：'
    }
};

const connectionOptions = ['a是的，我理解这种模式', 'b我见过类似的情况', 'c 没有，但我想更了解这种现象'];

export const module22Handlers = {
    onContinue_Module22() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '在我们的日常生活中，都会经历各种复杂的情绪体验，接下来，我将分享三个故事，请你来看看故事里是否有你熟悉的影子。', false);
            appendSpecialCard(this.chatMessages, module22Cases.a.storyHtml);
            appendContinueButton(this.chatMessages);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '如果你也曾用逃避来应对压力，请轻点屏幕，静静感受这份共鸣。', false);
            appendContinueButton(this.chatMessages, 10);
            this.step = 2;
        } else if (this.step === 2) {
            appendSpecialCard(this.chatMessages, module22Cases.b.storyHtml);
            appendAiMessage(this.chatMessages, '如果你也曾用沉默来避免冲突，请轻点屏幕，静静感受。', false);
            appendContinueButton(this.chatMessages, 10);
            this.step = 3;
        } else if (this.step === 3) {
            appendSpecialCard(this.chatMessages, module22Cases.c.storyHtml);
            appendAiMessage(this.chatMessages, '如果你也曾用‘强撑’来掩饰脆弱，请轻点屏幕，感受此刻。', false);
            appendContinueButton(this.chatMessages, 10);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '现在，让我们像侦探一样，聚焦在其中一个故事上。请选择你最想探索的主人公：', false);
            appendButtonGroup(
                this.chatMessages,
                [module22Cases.a.option, module22Cases.b.option, module22Cases.c.option],
                (choice) => this.handleModule22CaseChoice(choice)
            );
            this.step = 5;
        } else if (this.step === 7) {
            const caseData = this.getModule22SelectedCase();
            appendAiMessage(this.chatMessages, caseData.emotionResponse, false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步：影响觉察</strong></p>');
            appendAiMessage(this.chatMessages, caseData.impactPrompt, false);
            this.enableInputForModule(this.chatMessages);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '感谢你的回答。我总结了一些可能造成的影响，一起来看看吧。', false);
            appendSpecialCard(this.chatMessages, this.getModule22SelectedCase().impactCard);
            appendSpecialCard(this.chatMessages, '<p><strong>第三步：个人联结</strong></p>');
            appendAiMessage(this.chatMessages, this.getModule22SelectedCase().connectionPrompt, false);
            appendButtonGroup(this.chatMessages, connectionOptions, () => {
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                appendAiMessage(this.chatMessages, '感谢你的回答。无论哪种确认，都是觉察的开始。', true);
                this.step = 9;
            });
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '通过刚才的探索，我们发现了不同的主人公为了回避压力而麻痹、勉强自己，最终会带来一连串问题。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '其实这三个故事，都在讲述同一种心理模式：当我们感到焦虑、受伤或压力时，有时会选择‘推开感受’、‘转移注意’或‘假装没事’，这在心理学上有一个名字，叫做 <strong>‘经验性回避’</strong>。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '这不是“错误”，而是我们很多人习惯的自我保护方式。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>原理剖析</strong></p>');
            appendContinueButton(this.chatMessages);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '为什么我们会这样？', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '这其实是我们大脑最本能的自我保护：“如果感受太痛苦，那就不要感受。”这就像手碰到火会缩回一样自然。大脑习惯趋利避害，碰到不舒服的情绪、想法，本能想躲开。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '但很多时候，越回避，这些感受越强烈。就像弹簧，你使劲压，它反弹更厉害。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>案例回顾</strong></p>');
            appendContinueButton(this.chatMessages);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '回顾三个故事，现在你能否识别出‘经验性回避’的表现？', false);
            appendSpecialCard(
                this.chatMessages,
                '<p>张天：用游戏回避______</p><p>晓琳：用沉默回避______</p><p>嘉怡：用强撑回避______</p>'
            );
            appendButtonGroup(this.chatMessages, ['查看答案'], () => {
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                const cards = this.chatMessages.querySelectorAll('.special-card');
                if (cards.length > 0) {
                    cards[cards.length - 1].innerHTML = '<p>张天：用游戏回避焦虑</p><p>晓琳：用沉默回避冲突</p><p>嘉怡：用强撑回避压力</p>';
                }
                appendContinueButton(this.chatMessages);
                this.step = 16;
            });
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '今天，我们一起完成了一次觉察：我们看见了“经验性回避”——这种很普遍的心理模式。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '经验性回避看似能躲开一时难受，实则会让情绪问题问题被拖延和放大，消耗大量心理能量在‘掩饰’和‘逃避’上，错过真正解决问题的时机。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '看见自己的回避模式，就是改变的第一步。训练的目的，不是从不回避，而是让我们能更快地觉察到：“哦，我又在回避了。”然后给自己一个选择的机会。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '所以请尝试带着这份觉察，应用到日常生活中。当下次你想推开某种感受时，或许可以试着在心里说：“我感觉到我在想推开它，没关系，我看到你了。”', false);
            this.step = 20;
        }
    },

    handleModule22CaseChoice(choice) {
        const currentBtnGroup = this.chatMessages.querySelector('.button-group');
        if (currentBtnGroup) currentBtnGroup.remove();

        const caseKey = choice.trim().startsWith('a') ? 'a' : choice.trim().startsWith('b') ? 'b' : 'c';
        this.module22State.selectedCase = caseKey;

        const caseData = module22Cases[caseKey];
        appendAiMessage(this.chatMessages, caseData.repeatStory, false);
        appendSpecialCard(this.chatMessages, '<p><strong>第一步：情绪掩盖分析</strong></p>');
        appendAiMessage(this.chatMessages, caseData.emotionPrompt, false);
        this.enableInputForModule(this.chatMessages);
        this.step = 6;
    },

    handleModule22UserMessage(text) {
        if (this.step === 6) {
            this.module22State.emotionAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 7;
            this.onContinue();
        } else if (this.step === 8) {
            this.module22State.impactAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.onContinue();
        }
    },

    getModule22SelectedCase() {
        return module22Cases[this.module22State.selectedCase || 'a'];
    }
};

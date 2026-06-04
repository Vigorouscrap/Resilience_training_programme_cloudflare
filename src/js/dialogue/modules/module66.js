import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    appendCardActionButtons,
    disableInput
} from '../../ui.js';
import {
    removeCurrentCardActionButtons
} from './module5Shared.js';

const module66ReviewItems = {
    常见现象: `
        <p><strong>经验性回避：</strong>一种普遍的心理模式。当我们感到焦虑、受伤或面对压力时，本能地选择“推开感受”、“转移注意”或“假装没事”。这虽能带来短暂缓解，但长期看会放大问题，消耗心理能量。</p>
        <p><strong>过度积极反刍：</strong>一种看似积极，实则压抑真实情绪的模式。表现为强迫自己“必须乐观”、“不能有负面情绪”，用“积极口号”覆盖真实感受，阻碍了情绪的诚实表达和有效处理。</p>
    `,
    关键技术: `
        <p><strong>接纳技术：</strong>给情绪“搭台阶”，温和相处，而非对抗。包含四步：</p>
        <p>观察：精准说出情绪和身体感受（例如：“我现在感到焦虑，手心有点出汗”）。</p>
        <p>允许：承认情绪的合理性（例如：“有这种情绪是正常的，我允许它在这儿”）。</p>
        <p>扩展：将注意力从单一情绪扩展开（例如：“除了焦虑，我还能感受到呼吸的节奏”）。</p>
        <p>行动：做一个微小的自我关怀动作（例如：喝一口温水，轻拍自己）。</p>
        <p><strong>认知解离技术：</strong>与想法拉开距离，看清它的本质。</p>
        <p>标签化：是实现认知解离的具体工具。指的是给想法贴一个描述性标签，而非评判性标签。例如，不说“这是一个不好的想法”，而是说“这是一个关于未来会变糟的灾难化预测”。</p>
        <p>具体实现技术：</p>
        <p>气球放飞法：想象将困扰自己的想法写在气球上，然后松开手，看着它飘远。</p>
        <p>角色转换法：想象这个想法是来自你最好的朋友，你会如何安慰他/她？</p>
        <p>时间线法：站在一年后的时间点，回头看现在这个困扰你的想法，感受它影响力的变化。</p>
        <p><strong>以己为景/观察性自我：</strong>把自己作为观察的背景，而不是被观察的内容。我们的内心活动（想法、情绪、记忆、感觉）是不断变化的“风景”，而能够观察这一切的那个“你”是不变的“天空”。站在这个背景的位置，只是纯然地观察，不评判、不卷入、不试图改变。</p>
        <p>三个隐喻：舞台与观众；天空与天气；棋盘与棋手</p>
        <p><strong>价值澄清与行动：</strong>在情绪和想法的背后，找到我们真正在乎的东西，然后制定朝着这个价值前行的行动。</p>
        <p>双视角日记：用“体验者”和“观察者”两种视角记录同一件压力事件，从而发现情绪背后真正的渴望与价值（例如：被认可、安全感、成长）。</p>
        <p>自我承诺：基于澄清的价值，制定一个具体、可行的“接纳行动”，并在生活中实践。</p>
    `,
    关键练习: `
        <p><strong>冥想练习：</strong>所有练习的基石。像一个稳固的“锚”，帮助我们在思绪飘走时，一次次温和地回到当下，训练我们的觉察力和专注力。其中，冥想呼吸通过有意识地关注呼吸的节奏和感觉，将注意力从纷杂的思绪中拉回到当下，从而放松身心、平静大脑。</p>
        <p><strong>情绪接收站：</strong>学习“看见”和“承认”情绪带来的身体反应和念头，而不是立刻解决或逃避。</p>
        <p><strong>牛奶牛奶体验练习：</strong>通过反复陈述“我现在想喝牛奶”，亲身体验到“一个想法反复出现，就能引发真实的生理感受”，从而深刻理解“想法不等于事实”。</p>
        <p><strong>火车站台冥想：</strong>一个经典的认知解离练习。将自己想象成站台上的观察者，看着写有各种想法的“火车”驶过，学习不被任何一列“想法火车”带走。</p>
        <p><strong>双向解离练习：</strong>同时对“过度积极反刍”和“过度消极反刍”（我永远无法变好）的想法进行解离，体验不评判思维的平和状态。</p>
    `
};

function showModule66ReviewOptions() {
    const options = ['常见现象', '关键技术', '关键练习'];
    appendButtonGroup(this.chatMessages, options, (choice) => {
        this.chatMessages.querySelectorAll('.button-group').forEach(group => group.remove());
        this.showModule66ReviewAnswer(choice);
    });

    if (this.module66State.visitedReviewSections.size === options.length) {
        appendButtonGroup(this.chatMessages, ['已全部了解'], () => {
            this.chatMessages.querySelectorAll('.button-group').forEach(group => group.remove());
            this.step = 2;
            this.onContinue_Module66();
        });
    }
}

export const module66Handlers = {
    onContinue_Module66() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '这六周以来的心理弹性训练，从“正念练习”、“接纳”，到“认知解离”再到“双视角日记技术”，我们学习了很多重要的概念和方法。下面列出了一些要点，你可以依次点击对应的按钮进行回顾。', false);
            appendSpecialCard(this.chatMessages, '<p>点击对应的选项可以展开内容解释。</p>');
            showModule66ReviewOptions.call(this);
            this.step = 1;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '这些共同服务于一个目标，即提升我们的心理弹性，也就是说即使面对逆境、压力、挫折，甚至是巨大的威胁或重大生活变故时，能够成功应对、适应并从中“弹回” 的能力，依然自由、灵活地选择对自己而言最有意义的生活方向。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '接下来，将展示一个情景题，你可以尝试去回答并提出怎么做的想法，不用担心出错，我们只是对过往内容的自测回顾。', false);
            appendSpecialCard(this.chatMessages, '<p>小王是一位对自己要求很高的人，他一直为自己高效、尽责的工作态度感到自豪。最近他接手了一个重要项目，经常加班到深夜，并告诉自己“我必须坚持，不能有任何松懈”。这几天他持续感到疲惫、头痛，但总是告诉自己“这是努力的正常反应，撑过去就好了”。直到在一次会议中他因精力不济险些出错，才开始后怕：我是不是太执着于“优秀”的标签，反而在损害自己的健康和工作的质量？</p>');
            appendContinueButton(this.chatMessages, 60);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '运用“解离”技术，小王可以如何与“我必须坚持，不能有任何松懈”的想法拉开距离？请举例说明。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 5;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '感谢你的回答。小王属于“过度积极反刍”，忽略身体信号，可以说“我注意到我有一个‘必须坚持不能松懈’的想法”，进而可以用“角色转换法”，想象朋友遇到这种情况，自己会怎么劝他。', true);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '对于“险些出错”带来的后怕和自责，运用“接纳”技术的重点是什么？他该如何与这些感受相处，而不是陷入自我批判？', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 8;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '感谢你的回答。重点是不去评判“后怕和自责”的好坏，而是允许它们存在，理解它们是身体和心灵在发出重要信号。他可以对自己说：“在这么重要的项目上险些出错，感到后怕和自责是完全正常的、甚至是健康的反应。这说明我非常在乎工作的质量，这是一个负责任的信号。” 然后可以问自己：“这份‘后怕’想提醒我什么？它是不是在保护我，避免未来发生真正的错误？”', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '当身体发出“疲惫、头痛”的信号时，如何运用“以己为景”帮助他从“追求完美的执行者”切换到“关怀自己的观察者”？请描述他可以观察的维度。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 11;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '感谢你的回答。可以观察身体：“我观察到我的身体正在发出一些信号如：头痛”；观察角色：“我注意到，‘追求完美的执行者’这个角色现在正在主导舞台，他正在说所有的台词，占用所有的灯光。”；观察价值冲突：“我观察到内心有两种重要的价值正在拉扯：一边是‘专业卓越’的价值，一边是‘身心健康’的价值。它们都很重要，现在出现了紧张关系。作为一个既关心工作又关心自己的完整的人，我应当稍微调整我的行动。”', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '你做得很不错。从第一次学习“看见情绪”，到练习与想法拉开距离的“解离”，再到构建内心稳定观察台的“以己为景”，直至今日，我们开始能综合运用这些工具，像解答一道复杂的题一样，去梳理生活中真实的压力困境。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '你看，当小王的故事摆在面前时，我们已经能初步指出：哪里可以运用解离，哪里需要启动接纳，以及如何切换到以己为景的广阔视角。这证明，这些不再是一个个概念，而是可以被我们主动调用的‘心理程序’。', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '今天的练习就到这里了，我们下次见。', false);
            this.step = 16;
        }
    },

    showModule66ReviewAnswer(choice) {
        this.module66State.visitedReviewSections.add(choice);
        appendSpecialCard(this.chatMessages, module66ReviewItems[choice]);
        appendCardActionButtons(
            this.chatMessages,
            this.module66State.visitedReviewSections.size === 3,
            () => this.onModule66ReviewBack(),
            () => {
                removeCurrentCardActionButtons(this.chatMessages);
                const cards = this.chatMessages.querySelectorAll('.special-card');
                const lastCard = cards[cards.length - 1];
                if (lastCard) lastCard.remove();
                this.step = 2;
                this.onContinue_Module66();
            }
        );
    },

    onModule66ReviewBack() {
        removeCurrentCardActionButtons(this.chatMessages);
        const cards = this.chatMessages.querySelectorAll('.special-card');
        const lastCard = cards[cards.length - 1];
        if (lastCard) lastCard.remove();
        showModule66ReviewOptions.call(this);
    },

    handleModule66UserMessage(text) {
        if (this.step === 5) {
            this.module66State.disidentificationAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 6;
            this.onContinue_Module66();
            return;
        }

        if (this.step === 8) {
            this.module66State.acceptanceAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 9;
            this.onContinue_Module66();
            return;
        }

        if (this.step === 11) {
            this.module66State.observerAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 12;
            this.onContinue_Module66();
        }
    }
};

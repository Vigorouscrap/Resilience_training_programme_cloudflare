import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    appendCardActionButtons
} from '../../ui.js';
import {
    appendSpeechReplayCard,
    removeCurrentButtonGroup,
    removeCurrentCardActionButtons,
    removeLastAiMessage,
    speakText
} from './module5Shared.js';

const module56Metaphors = [
    {
        image: 'images/week5-metaphor-1.jpg',
        title: '隐喻一：舞台与观众',
        speechText: '请想象，你的整个内心世界，是一个永恒的舞台。此刻，舞台上正在上演什么？也许有一个叫“担忧”的演员在独白，也许有一个叫“开心”的演员在跳舞，还有一个叫“我做得不够好”的演员在背景里徘徊。这些思绪和情绪，都是舞台上的“演员”。它们会上场、表演、退场，剧目也会不断变换，但舞台始终在那里，不会因为演员的表演而改变。而你，有一个部分，始终是坐在台下观众席的“观察者”。 这个“观察性自我”不会跳上舞台和演员一起表演，它只是看着、知晓着舞台上发生的一切，不评判谁演得好、谁演得差。',
        html: `
            <p class="module5-media-title">隐喻一：舞台与观众</p>
            <div class="module5-media-body">
                <img src="images/week5-metaphor-1.jpg" alt="隐喻一：舞台与观众" class="module5-image">
                <p><strong>【隐喻内容】</strong>请想象，你的整个内心世界，是一个永恒的舞台。此刻，舞台上正在上演什么？也许有一个叫“担忧”的演员在独白，也许有一个叫“开心”的演员在跳舞，还有一个叫“我做得不够好”的演员在背景里徘徊。这些思绪和情绪，都是舞台上的“演员”。它们会上场、表演、退场，剧目也会不断变换，但舞台始终在那里，不会因为演员的表演而改变。</p>
                <p>而你，有一个部分，始终是坐在台下观众席的“观察者”。 这个“观察性自我”不会跳上舞台和演员一起表演，它只是看着、知晓着舞台上发生的一切，不评判谁演得好、谁演得差。</p>
            </div>
        `
    },
    {
        image: 'images/week5-metaphor-2.jpg',
        title: '隐喻二：天空与天气',
        speechText: '现在，让我们把视角拉得更广阔一些。想象你的意识是一片无边无际的天空。你的思绪和情绪，就是天空中的“天气”。有时是明媚的晴天（代表着愉悦），有时是滚滚的乌云（代表着焦虑），有时是绵绵细雨（代表着忧伤）。天气瞬息万变，交织出现。但无论天气如何，雷暴还是彩虹，天空本身从不被伤害，也从不消失。它始终包容着一切气象的变化。那个“观察性自我”，就是这片天空本身。它不执着于留住晴天，也不抗拒暴雨来临。它只是平静地容纳，不被这些天气所影响。',
        html: `
            <p class="module5-media-title">隐喻二：天空与天气</p>
            <div class="module5-media-body">
                <img src="images/week5-metaphor-2.jpg" alt="隐喻二：天空与天气" class="module5-image">
                <p><strong>【隐喻内容】</strong>现在，让我们把视角拉得更广阔一些。想象你的意识是一片无边无际的天空。你的思绪和情绪，就是天空中的“天气”。有时是明媚的晴天（代表着愉悦），有时是滚滚的乌云（代表着焦虑），有时是绵绵细雨（代表着忧伤）。天气瞬息万变，交织出现。但无论天气如何，雷暴还是彩虹，天空本身从不被伤害，也从不消失。它始终包容着一切气象的变化。</p>
                <p>那个“观察性自我”，就是这片天空本身。它不执着于留住晴天，也不抗拒暴雨来临。它只是平静地容纳，不被这些天气所影响。</p>
            </div>
        `
    },
    {
        image: 'images/week5-metaphor-3.jpg',
        title: '隐喻三：棋盘与棋手',
        speechText: '最后，让我们来看一个更富策略感的画面。想象你的内心是一个棋盘。每一个升起的念头和感受，就像落在棋盘上的棋子。有代表积极思维的白棋，也有代表消极思维的黑棋。它们不断落下，相互交织，构成复杂的局面。而“观察性自我”，就是那位正在对弈的“棋手”。一位明智的棋手，不会因为一颗黑棋落下就恐慌，也不会因为一颗白棋而沾沾自喜。他观察着整个棋局，冷静地思考，知道棋局永远在流动变化。你不是棋盘上任人摆布的棋子，你是下棋的人。',
        html: `
            <p class="module5-media-title">隐喻三：棋盘与棋手</p>
            <div class="module5-media-body">
                <img src="images/week5-metaphor-3.jpg" alt="隐喻三：棋盘与棋手" class="module5-image">
                <p><strong>【隐喻内容】</strong>最后，让我们来看一个更富策略感的画面。想象你的内心是一个棋盘。每一个升起的念头和感受，就像落在棋盘上的棋子。有代表积极思维的白棋，也有代表消极思维的黑棋。它们不断落下，相互交织，构成复杂的局面。</p>
                <p>而“观察性自我”，就是那位正在对弈的“棋手”。一位明智的棋手，不会因为一颗黑棋落下就恐慌，也不会因为一颗白棋而沾沾自喜。他观察着整个棋局，冷静地思考，知道棋局永远在流动变化。你不是棋盘上任人摆布的棋子，你是下棋的人。</p>
            </div>
        `
    }
];

const module56FaqOptionsHtml = `
    <div class="module5-options-list">
        <p>A 我找不到“观察性自我”，它到底在哪？</p>
        <p>B 当情绪特别强烈时，我根本没法像“观众”一样冷静，怎么办？</p>
        <p>C 练习这个，会不会让我变得没有感情、很冷漠？</p>
    </div>
`;

const module56FaqAnswers = {
    A: '这非常正常。就像初学观天，我们总先看到云（想法），而忽略天空（背景）。“观察性自我”不是一个需要找到的物体，而是你正在看、正在听、正在觉察的这个“意识空间”本身。下次当你注意到一个想法时，可以问自己：是谁注意到了这个想法？那个“谁”，就是观察的起点。',
    B: '完全理解。当风暴（情绪）特别猛烈时，天空似乎被遮蔽了。这时，不用要求自己立刻平静，而是先完成一个最小动作，承认“风暴正在发生”。哪怕只是心里说一句：我现在感到一股强烈的愤怒（或悲伤）。这个简单的承认，就已经是观察性自我在微弱地运作——你没有被完全吞噬，你还能报告“天气”。这就足够了。',
    C: '恰恰相反。“以己为景”不是消除情绪，而是让你与情绪的关系更健康。就像舞台不会因悲剧而崩塌，却能更完整地呈现悲剧的力量。观察性自我让你能看到情绪，而不被情绪拖着走。你会更清晰地感受喜悦，也能在痛苦中保有内在空间，这才是鲜活而非麻木。'
};

const module56GroundingStepsCardHtml = `
    <div class="module5-options-list">
        <p>第一步：暂停。</p>
        <p>第二步：在心中快速调取一个隐喻，问自己：此刻，我的“舞台”上的主角是谁？我的“天空”中的主要天气是什么？我的“棋盘”上最显眼的棋子是哪一颗？</p>
        <p>第三步：然后，轻轻地后退一步，认同自己作为“观众”、“天空”或“棋手”的那个部分。</p>
    </div>
`;

function clearModule56ButtonGroups(chatMessages) {
    chatMessages.querySelectorAll('.button-group').forEach(group => group.remove());
}

export const module56Handlers = {
    onContinue_Module56() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '在之前的旅程中，我们学习了认知解离技术，即后退一步，对我们脑海中的想法说：“我注意到我有一个…的想法。”。这让我们开始与自己的思绪建立一种新的、更具弹性的关系。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们将把这个“后退一步”进行深化和稳固。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '首先，引入一个核心概念“以己为景”。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>以己为景</strong> 指的是跳出沉浸式的“当局者迷”，把自己当做觉察的场景或背景来体验，从而我们内在那个稳定、宁静的“观察性自我”。</p>');
            appendContinueButton(this.chatMessages);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '如果说“认知解离”是学会了“后退”，那么“以己为景”就是去熟悉和信任我们所退向的那个广阔、稳固的观察空间。这能让我们的心理弹性地基更加坚实。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '至此，你可能对这个新的概念没有完全理解或者仍然感到疑惑。没有关系，我们接下来将通过三个层层递进的隐喻，来感受什么是“以己为景”和“观察性自我”，从而体验思维与自我的分离。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '现在，请选择一个最让你感到舒适的姿势，放松地观看和聆听。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 6;
                this.onContinue_Module56();
            });
        } else if (this.step === 6) {
            this.showModule56Metaphor(0, '现在慢慢地感受一下，此刻，你的“舞台”上正在上演什么？而那位“观众”，是否正安稳地坐在那里？', 7, 30);
        } else if (this.step === 7) {
            this.showModule56Metaphor(1, '现在，做一次深呼吸，想象将气息带入那片内在的“天空”，感受它无边无际的包容性。允许你的“情绪天气”自然变化，同时知晓，那片观察着的“天空”，始终宁静而完整。', 8, 30);
        } else if (this.step === 8) {
            this.showModule56Metaphor(2, '感受一下，从“我是棋子”的视角，转换到“我是棋手”的视角。这种空间的转换，带来了什么样的感觉？', 9, 30);
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '回想最近几天，你的“心理棋盘”上，落下了哪些“黑子”和“白子”？而你，作为棋手，看到了吗？', false);
            speakText(this.chatMessages, '回想最近几天，你的“心理棋盘”上，落下了哪些“黑子”和“白子”？而你，作为棋手，看到了吗？', { rate: 0.9, fallbackMs: 15000 });
            appendContinueButton(this.chatMessages, 15);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '让我们以棋盘隐喻为例，代入一个生活场景：夏天清晨，你准备出门发现下雨了。 你的“棋盘”上，同时落下了白子（“凉爽真好”的想法）和黑子（“可能会迟到失去全勤奖”的想法）。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '而你，作为那位棋手，只是意识到这一切正在发生。既不选择站队，也不评判哪个想法对，它只是保持觉察：“啊，我此刻既有开心的感受，也有担心的念头。”', true);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '这种“意识到而不卷入“的能力，就是心理弹性的核心基石。', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '了解了这些隐喻后，你心中是否升起一些疑问？这是非常自然的。这里列举了一些常见疑问，你可以点击对应的选项来查看解答。', false);
            appendSpecialCard(this.chatMessages, module56FaqOptionsHtml);
            this.showModule56FaqOptions();
            this.step = 14;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '我们通过舞台、天空、棋盘的隐喻，接触了以己为景的观察性自我。关键收获在于，你不仅仅是你的思绪和情绪（演员/天气/棋子），你更是那个能觉察这些来去变化的、更广阔的背景（舞台/天空/棋手）。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '每当我们遇到压力事件、被强烈的想法或情绪席卷时，可以依次尝试以下几步：', false);
            appendSpecialCard(this.chatMessages, module56GroundingStepsCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '每一次这样的瞬间，都是在加固心理弹性的基石。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '今天的练习就到这里了，带着这份新的视角，回到生活中。我们下次再见。', false);
            this.step = 19;
        }
    },

    showModule56Metaphor(index, reflectionText, nextStep, delaySeconds) {
        const metaphor = module56Metaphors[index];
        appendSpeechReplayCard(
            this.chatMessages,
            metaphor.html,
            metaphor.speechText,
            {
                replayLabel: '再次播放',
                speechOptions: { rate: 0.88 }
            }
        );
        appendAiMessage(this.chatMessages, `（同时朗读）：${reflectionText}`, false);
        speakText(this.chatMessages, reflectionText, { rate: 0.88, fallbackMs: delaySeconds * 1000 });
        appendContinueButton(this.chatMessages, delaySeconds);
        this.step = nextStep;
    },

    showModule56FaqOptions() {
        clearModule56ButtonGroups(this.chatMessages);
        appendButtonGroup(this.chatMessages, ['A', 'B', 'C'], (choice) => {
            clearModule56ButtonGroups(this.chatMessages);
            this.showModule56FaqAnswer(choice);
        });

        if (this.module56State.visitedFaqs.size === 3) {
            appendButtonGroup(this.chatMessages, ['已全部了解'], () => {
                clearModule56ButtonGroups(this.chatMessages);
                this.step = 15;
                this.onContinue_Module56();
            });
        }
    },

    showModule56FaqAnswer(choice) {
        this.module56State.visitedFaqs.add(choice);
        appendAiMessage(this.chatMessages, module56FaqAnswers[choice], false);
        appendCardActionButtons(
            this.chatMessages,
            this.module56State.visitedFaqs.size === 3,
            () => this.onModule56FaqBack(),
            () => {
                removeCurrentCardActionButtons(this.chatMessages);
                removeLastAiMessage(this.chatMessages);
                this.step = 15;
                this.onContinue_Module56();
            }
        );
    },

    onModule56FaqBack() {
        removeCurrentCardActionButtons(this.chatMessages);
        removeLastAiMessage(this.chatMessages);
        this.showModule56FaqOptions();
    }
};

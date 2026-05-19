import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    disableInput,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';

const module46ScenarioCardHtml = `
    <p><strong>【情景呈现】</strong></p>
    <p>在季度汇报中，小张出现一个口误。结束后，他脑海中反复出现 “我搞砸了那么重要的时刻，领导和同事肯定会觉得我能力不行，我的职业形象完了” 的想法。</p>
`;

const module46DemoDialogueSequence = [
    {
        avatar: '当',
        text: '当事人AI（焦虑状态）：“唉，我完了。今天汇报的时候竟然说错了一个关键数据，虽然马上纠正了，但所有人都听到了。我搞砸了这么重要的场合，领导和同事肯定都在心里给我打叉，觉得我能力不行。我的职业形象全毁了。”',
        delayMs: 9000
    },
    {
        avatar: '支',
        text: '支持者AI：“我听到了，你现在被一个‘我搞砸了，职业形象全毁了’的想法紧紧抓住，这让你感到非常焦虑和挫败。”（识别与共情）',
        delayMs: 7000
    },
    {
        avatar: '当',
        text: '当事人AI：“不止是想法，这就是事实啊！那么多人看着呢。”',
        delayMs: 5000
    },
    {
        avatar: '支',
        text: '支持者AI：“我理解那感觉非常真实。我们可以试着先把这个想法‘放’到眼前看看吗？比如，给它贴个标签：这是一个关于‘职业形象彻底崩溃’的灾难化预测。”（贴标签）',
        delayMs: 8500
    },
    {
        avatar: '当',
        text: '当事人AI：“灾难化预测……是什么意思？”',
        delayMs: 4500
    },
    {
        avatar: '支',
        text: '支持者AI：“意思是，这个想法把一次口误的后果，想象成了无法挽回的终极灾难。它是一个‘预测’，而不是已经发生的‘事实’。事实是：一，你完成了一次季度汇报；二，过程中出现了一个口误，并已纠正。而‘形象全毁、能力被否定’的想法是你对未来的悲观推测。”（区分想法与事实）',
        delayMs: 10000
    },
    {
        avatar: '当',
        text: '当事人AI：“可是他们肯定会对我有看法啊。”',
        delayMs: 4500
    },
    {
        avatar: '支',
        text: '支持者AI：“有可能，但这仍然是一种‘他们可能会对我有看法’的想法或担心。当我们把它贴上‘这是猜测他人想法’的标签时，我们就可以意识到，这和我们‘知道’他们怎么想是两回事。把想法当作事实，会让我们陷入更深的焦虑。”（巩固解离，将想法客观化）',
        delayMs: 9500
    },
    {
        avatar: '当',
        text: '当事人AI：“……你这么一说，好像是的。我被那个‘我完了’的想法带着跑了，感觉天都塌了。”',
        delayMs: 6500
    },
    {
        avatar: '支',
        text: '支持者AI：“是的，想法有时候就像一部逼真的恐怖片，让我们身临其境。但我们其实只是正在看一部叫《我搞砸了》的电影’，而不是真的生活在那个灾难场景里。当我们能看清这只是脑海中的一部电影，压力感就会开始松动，我们才能腾出空间去想：那么，基于目前的事实，我现在可以做哪一件小事？”（引入行动视角）',
        delayMs: 12000
    }
];

const module46SummaryCardHtml = `
    <p>共情与识别：首先接纳对方的情绪，并准确复述出困扰他的核心想法。</p>
    <p>贴标签：引导对方给想法一个描述性、非评判的标签，将想法对象化。</p>
    <p>区分想法与事实：清晰地引导将脑海中的想法与现实中已发生的事件分开。</p>
    <p>巩固与正常化：指出这是常见的思维模式，让当事人感到不被评判。</p>
    <p>行动转向：自然引导至建设性的行动思考。</p>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function isLowEffortResponse(text) {
    const normalized = text.replace(/\s+/g, '');
    if (!normalized || normalized.length < 8) return true;

    return ['不知道', '随便', '没什么', '不会', '不清楚', '嗯', '啊'].includes(normalized);
}

function getModule46ResponseFeedback(text) {
    if (isLowEffortResponse(text)) {
        return '这次的回应看起来有些简略。请你再试一次，尽量像支持者一样，对当事人说上一两句完整的话。';
    }

    return '感谢你的回应。现在，我将基于认知解离的原则，为你分析你刚才的回应当中的亮点，并提供可能的优化思路。<br><br>例如如果参与者回应了： “我听到你现在非常绝望，觉得自己翻不了身了。我们可以把这个‘我完蛋了’的想法，看作是一个‘绝对化的灾难结论’。”<br><br>可以给出类似反馈以及原因：你准确完成了识别与共情，并给出了一个不错的描述性标签——“绝对化的灾难结论”。这个标签有效捕捉了想法中“完蛋了”和“没法活了”这种将现状判定为最终结局的特征。这里是一些优化建议与示范：我们可以尝试将事实与想法区分得更具体一些，并引入更温和的视角。比如可以这样说：事实是，你经历了一次重大的财务损失，这带来了巨大的痛苦和压力。而“我这辈子都翻不了身”这个想法，是一个在极度痛苦时很容易产生的、关于未来的“长期绝望预测”。我们的头脑在震惊中，常常会编制出关于整个未来的恐怖故事，但这不等于故事就是真的。很多人面对巨大损失时，头脑里都会先播放这部最糟糕的“电影”。<br><br>为什么这样优化？<br>具体化事实：把“事实”锚定在“财务损失”和“当前痛苦”上，而不是模糊的“情况”。<br>标签更具象：“长期绝望预测”比“结论”更动态，暗示这只是对未来的一种预测，而非定论。<br>正常化感受：指出这是“在震惊中很容易产生的”模式，减少当事人的羞耻感。<br>使用隐喻：再次使用“播放电影”的比喻，强化解离效果。';
}

function unlockModule46InputAfterDelay(context, seconds) {
    const sessionId = getChatSessionId(context.chatMessages);
    const deadline = Date.now() + (seconds * 1000);

    const timerCard = document.createElement('div');
    timerCard.className = 'special-card';
    const timerLabel = document.createElement('div');
    timerLabel.className = 'card-timer';
    timerCard.appendChild(timerLabel);
    context.chatMessages.appendChild(timerCard);

    const tick = () => {
        if (!isChatSessionActive(context.chatMessages, sessionId)) {
            return false;
        }

        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (remaining > 0) {
            timerLabel.innerText = `${remaining}秒后可输入`;
            return true;
        }

        timerLabel.innerText = '可输入';
        context.enableInputForModule(context.chatMessages);
        return false;
    };

    if (!tick()) return;

    const interval = setInterval(() => {
        if (!tick()) {
            clearInterval(interval);
        }
    }, 250);
}

function appendModule46SpeakerMessageWithTimer(chatMessages, avatarText, text, delayMs, callback) {
    const row = document.createElement('div');
    row.className = 'message-row-left';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerText = avatarText;

    const bubble = document.createElement('div');
    bubble.className = 'bubble-left';
    bubble.innerHTML = text;

    const timer = document.createElement('div');
    timer.className = 'card-timer';
    timer.style.marginLeft = '0.7rem';

    row.appendChild(avatar);
    row.appendChild(bubble);
    row.appendChild(timer);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const sessionId = getChatSessionId(chatMessages);
    const deadline = Date.now() + delayMs;

    const tick = () => {
        if (!isChatSessionActive(chatMessages, sessionId)) {
            return false;
        }

        const remainingMs = Math.max(0, deadline - Date.now());
        if (remainingMs > 0) {
            timer.innerText = `⏳${(remainingMs / 1000).toFixed(1)}s`;
            return true;
        }

        timer.innerText = '✓';
        setTimeout(() => {
            if (!isChatSessionActive(chatMessages, sessionId)) return;
            callback();
        }, 100);
        return false;
    };

    if (!tick()) return;

    const interval = setInterval(() => {
        if (!tick()) {
            clearInterval(interval);
        }
    }, 100);
}

function startModule46DialogueSequence(context, sequence, onComplete) {
    const runItem = (index) => {
        if (index >= sequence.length) {
            onComplete();
            return;
        }

        const item = sequence[index];
        appendModule46SpeakerMessageWithTimer(
            context.chatMessages,
            item.avatar,
            item.text,
            item.delayMs,
            () => runItem(index + 1)
        );
    };

    runItem(0);
}

export const module46Handlers = {
    onContinue_Module46() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '在之前的练习中，我们已经学习了认知解离，并尝试了使用“标签化”这个工具来与想法保持距离。今天，我们继续对这些技能进行强化练习。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '你应该还记得，在学习接纳技术时，我们曾通过“角色转换”来加深理解——把自己放在接纳支持者的位置，往往能看得更清楚。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '今天我们将采用类似的形式，但重点放在认知解离上。你将有机会扮演一位支持者，亲身体会他人在遭受压力后被情绪裹挟时，认知解离是如何起作用的。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '这种角色转化能力不仅能帮助他人，也能让你更深刻地掌握如何在自己陷入想法漩涡时，拉自己一把。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '现在，让我们一起开始这段强化练习之旅。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '以下是一个贴近日常生活、易触发过度思维的情景，让我们先一起来看看。', false);
            appendSpecialCard(this.chatMessages, module46ScenarioCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 6;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '当我们或他人因为日常发生的小事或者经历挫折后产生了这种想法时，我们很容易把它们当作即将发生的“事实”，从而被焦虑和绝望裹挟。', true);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '认知解离的核心，就是帮助我们看清“想法只是想法”，而不是事实本身。 这样，我们才能冷静下来，采取有效的行动。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '接下来，我将以刚刚呈现的情景为例，同时扮演“陷入想法的当事人”和“运用认知解离的支持者”，为你进行一场对话示范。请你重点关注支持者是如何回应、如何引导对方将想法与事实分开的。 ', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '对话即将开始。', false);
            appendContinueButton(this.chatMessages);
            this.step = 10;
        } else if (this.step === 10) {
            startModule46DialogueSequence(this, module46DemoDialogueSequence, () => {
                this.step = 11;
                this.onContinue_Module46();
            });
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '刚才的示范对话结束了。我们可以总结出支持者是如何一步步运用认知解离技术的：', false);
            appendSpecialCard(this.chatMessages, module46SummaryCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '在这一过程中，我们可以发现认知解离和接纳技术其实是相辅相成、融合在一起的。', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '请记住，支持者的目的不是反驳或安慰说“别多想” “你很好”，而是帮助对方建立起对想法的“观察距离”。 ', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '接下来，针对一个新的情景，我来扮演当事人，你来尝试扮演支持者。不用怕说错，只是一个尝试性的探索。你准备好开始了吗？', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 15;
                this.onContinue_Module46();
            });
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '（当事人）：前段时间看到网上说投资项目好，我就把自己攒了好几年的积蓄，加上借来的一些钱，全都投进去了……现在全亏光了，一分不剩。我睡不着，吃不下，我真是完蛋了，这辈子都翻不了身，没法活了。我真的觉得走到绝路了。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '作为支持者，你将如何回应呢？请将要对当事人说的话输入在对话框中，你有充足的时间先进行思考和然后再回应，没有固定答案和对错。', false);
            unlockModule46InputAfterDelay(this, 120);
            this.step = 17;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '今天的强化练习中，我们通过转换视角进一步理解了认知解离，核心是识别想法与区分事实，而不说“别瞎想，没事的”。 后续遇到类似情况，不管是自己还是帮身边的人，都可以用这种方式缓解焦虑。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '感谢你今天的时间，我们明天再见。', false);
            this.step = 20;
        }
    },

    handleModule46UserMessage(text) {
        if (this.step !== 17) return;

        this.module46State.supporterResponse = text;
        disableInput(this.inputArea, this.userInput);

        const feedback = getModule46ResponseFeedback(text);
        appendAiMessage(this.chatMessages, feedback, !isLowEffortResponse(text));

        if (isLowEffortResponse(text)) {
            this.enableInputForModule(this.chatMessages);
            return;
        }

        this.step = 18;
    }
};

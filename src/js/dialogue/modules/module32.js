import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    disableInput,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';

const module32CaseText = '小李是公司的一名员工，被要求负责一个重要项目。他一方面了解到项目的难度，非常担心自己经验不足会搞砸，夜里经常失眠，反复想“万一项目失败，我可能就要被开除了”；另一方面，他又不断地强迫自己“别想这些没用的，我肯定能完成这个项目”，甚至不敢向同事或领导透露任何一丝疑虑。同时，小李本来期待做好这个项目能升职，但得知晋升机会已给了别人，心里失落又觉得“追求晋升的念头很浮躁，真正强大的人不会在意这个，不该有这种想法”。';

const module32DefinitionCardHtml = `
    <p>“过度积极反刍”是一种表面上看似积极，实际上却是在回避、压抑真实情绪的心理过程。它表现为：</p>
    <p>强迫自己只关注“积极”想法，如：“我必须乐观”“不能有负面情绪”。</p>
    <p>压抑或否认真实的担忧、失落、焦虑等情绪，如：“我不该这么想”。</p>
    <p>用“积极口号”覆盖真实感受，而不是真正处理情绪</p>
`;

const module32QuestionCards = [
    '<p>问题一：“努力了解项目相关信息”属于哪种应对方式呢？</p>',
    '<p>问题二：“强迫自己只去想‘肯定能完成项目’”属于哪种应对方式呢？</p>',
    '<p>问题二：“压抑对不能升职的失落情绪”属于哪种应对方式呢？</p>'
];

const module32QuestionResponses = [
    {
        '积极应对': '是的，主动了解信息是直面问题的实际行动，是一种积极的应对方式。',
        '过度积极反刍': '我理解你会这么想，有时候反复思考和确认信息确实容易让人感觉有些“过度”。不过在这个情境下，“努力了解项目相关信息”更多是为了解决问题而主动收集资料、理清情况，这其实属于积极应对方式哦。'
    },
    {
        '积极应对': '我理解你的选择，“强迫自己只想好结果”听起来确实像是在努力保持积极。但实际上，这种反复强迫自己往好处想、不允许有丝毫怀疑或焦虑的“硬性积极”，其实容易让人忽视真实情绪，属于“过度积极反刍”哦。',
        '过度积极反刍': '正确，这是在用强制“积极”来回避真实的担心情绪。'
    },
    {
        '积极应对': '我明白你的想法，压抑情绪有时看起来像是“管理情绪”的一种方式。但实际上，刻意压制失落、悲伤等真实感受，并不是真正面对和解决问题，反而容易让情绪积压。这种做法属于“过度积极反刍”。',
        '过度积极反刍': '是的，压抑真实情绪，告诉自己“不该有这种想法”，是典型的过度积极反刍。'
    }
];

const module32ObservationCardHtml = `
    <p><strong>【观察】</strong></p>
    <p>我现在感到______（情绪1），因为______（原因）；</p>
    <p>同时我也感到______（情绪2），因为______（原因）；</p>
    <p>我的身体感觉是______（部位+感受）。</p>
    <p>参考陈述：“我现在感到担心，担心完不成项目，同时有些沮丧，因为就算完成了也不能升职，胸口闷闷的。”</p>
`;

const module32AllowanceCardHtml = `
    <p><strong>【允许】</strong></p>
    <p>这些情绪都是正常的，因为______（正常化原因）；</p>
    <p>我不需要______（停止的自我批判）；</p>
    <p>我可以______（允许的表达）。</p>
    <p>正常化原因：“面对重要任务感到担心是人之常情”</p>
    <p>停止的自我批判：不需要“强迫自己必须乐观”、不用批判自己“不该有这种情绪”</p>
    <p>允许的表达：“和这些情绪共处一会儿”、“承认我现在确实有这些感受”</p>
`;

const module32ExpansionCardHtml = `
    <p><strong>【扩展】</strong></p>
    <p>除了这些情绪，我还能注意到：</p>
    <p>环境中的______（感官观察1）；</p>
    <p>身体其他的______（中性身体感受2）；</p>
    <p>此刻还存在的______（其他存在状态）。</p>
    <p>参考陈述：“除了担心和失落，我还能注意到窗外的光线变化，能感觉到脚底接触地面的踏实感，能意识到呼吸的进出。”</p>
`;

const module32ActionCardHtml = `
    <p><strong>【行动】</strong></p>
    <p>基于观察和接纳，现在可以采取的小行动来缓解矛盾心理：</p>
    <p>我可以做______（具体行动1）来照顾当下的情绪；</p>
    <p>我也可以做______（具体行动2）来推进实际事务；</p>
    <p>我选择不做______（避免的强迫行为）。</p>
    <p>情绪照顾行动：给信任的人发条消息、深呼吸5次、短暂休息10分钟</p>
    <p>实际推进行动：列出项目风险清单、与领导沟通、制定阶段性计划</p>
    <p>避免的强迫行为：避免强迫自己立刻变积极、不压抑所有担忧、不假装一切完美</p>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, buttonLabel, onComplete) {
    const cards = chatMessages.querySelectorAll('.special-card');
    const currentCard = cards[cards.length - 1];
    const sessionId = getChatSessionId(chatMessages);
    const deadline = Date.now() + (seconds * 1000);

    if (!currentCard) {
        setTimeout(() => {
            if (!isChatSessionActive(chatMessages, sessionId)) return;
            appendButtonGroup(chatMessages, [buttonLabel], () => {
                removeCurrentButtonGroup(chatMessages);
                onComplete();
            });
        }, seconds * 1000);
        return;
    }

    const timerDiv = document.createElement('div');
    timerDiv.className = 'card-timer';
    let remaining = seconds;
    timerDiv.innerText = `${remaining}秒后${readyText}`;
    currentCard.appendChild(timerDiv);

    const timer = setInterval(() => {
        if (!isChatSessionActive(chatMessages, sessionId)) {
            clearInterval(timer);
            return;
        }

        remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (remaining > 0) {
            timerDiv.innerText = `${remaining}秒后${readyText}`;
            return;
        }

        clearInterval(timer);
        if (!isChatSessionActive(chatMessages, sessionId)) return;
        timerDiv.innerText = readyText;
        appendButtonGroup(chatMessages, [buttonLabel], () => {
            removeCurrentButtonGroup(chatMessages);
            onComplete();
        });
    }, 250);
}

function enableInputAfterDelay(manager, seconds, nextStep) {
    const sessionId = getChatSessionId(manager.chatMessages);
    setTimeout(() => {
        if (!isChatSessionActive(manager.chatMessages, sessionId)) return;
        manager.enableInputForModule(manager.chatMessages);
        manager.step = nextStep;
    }, seconds * 1000);
}

function getModule32ReflectionFeedback(text) {
    const normalized = text.replace(/\s+/g, '');

    if (!normalized || /不知道|不确定|想不起来|想不到|没想好|没有|没什么/.test(normalized)) {
        return '不确定也没关系，我们可以一起探索';
    }

    if (/强迫自己|必须积极|不该|压抑|回避|总是|老是|习惯|我发现|我注意到/.test(text)) {
        return '你能注意到这一点已经很了不起，这是改变的开始';
    }

    return '谢谢你分享这个例子，那现在我们可以尝试在心中或小声说出四步法的每句话，试试看！';
}

export const module32Handlers = {
    onContinue_Module32() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '上周我们初步学习了接纳技术的四步法，来初步应对经验性回避。你还记得是哪四步吗？可以尝试回忆并输入在对话框里发送，不用害怕出错。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 1;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '感谢你的回答。四步法指的是“观察、允许、扩展、行动”，现在你可以将你刚刚输入的答案和它对比一下，看看是否说对了。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '今天我们将继续扩展应用这个技术，来关注另一种常见的情绪应对模式——过度积极反刍。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '首先，我们来简单介绍一下什么是“反刍”。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '这个词可能并不十分陌生。我们都知道一些食草动物（例如牛）会反刍食物，就是将本来已经吃进去的食物返回口中再次咀嚼。', true);
            this.step = 6;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '而在心理学上，则引申为对某件事（尤其是负面经历）或情绪的反复思考、和回忆。因此：', false);
            appendSpecialCard(this.chatMessages, module32DefinitionCardHtml);
            startCardCountdown(this.chatMessages, 30, '可继续', '已了解', () => {
                this.step = 7;
                this.onContinue_Module32();
            });
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '现在，为了进一步了解这种模式，我们一起来看一个案例。', false);
            appendSpecialCard(this.chatMessages, `<p>${this.escapeHtml(module32CaseText)}</p>`);
            startCardCountdown(this.chatMessages, 0, '可继续', '继续', () => {
                this.step = 8;
                this.onContinue_Module32();
            });
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '现在，我们首先来分析案例中的应对方式。我们设置了三个小问题，请你结合上面呈现的案例来做出选择。请注意我们只是讨论，不用害怕选错。', false);
            this.showModule32Question(0);
            this.step = 81;
        } else if (this.step === 82) {
            this.showModule32Question(1);
            this.step = 83;
        } else if (this.step === 84) {
            this.showModule32Question(2);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '结合案例以及以上几个问题，我们不难总结出，积极应对是主动面对情绪、想办法缓解，而过度积极反刍则是：通过强迫自己“必须积极”来回避、压抑真实情绪。它表面看似“乐观”，实则阻碍了情绪的真实表达和处理。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '那么，在了解了案例中小李的心理后，我们该如何使用上周学习的“观察、允许、扩展、行动”四步接纳技术，回应小李这种“既担心完不成项目，又强迫自己乐观；既失落，又压抑情绪”的矛盾心理？', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '现在，请再次阅读案例，试着感受案例中的情境，想象自己就是案例中的小李。', false);
            appendSpecialCard(this.chatMessages, `<p>${this.escapeHtml(module32CaseText)}</p>`);
            startCardCountdown(this.chatMessages, 30, '可继续', '继续', () => {
                this.step = 12;
                this.onContinue_Module32();
            });
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '然后，根据你的感受来代替案例中的小李一步步做出下面的陈述。没有对错之分，请尝试大声说出来。', false);
            appendSpecialCard(this.chatMessages, module32ObservationCardHtml);
            startCardCountdown(this.chatMessages, 20, '可完成', '已完成', () => {
                this.step = 13;
                this.onContinue_Module32();
            });
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '很好，这样的观察陈述能够帮助我们清晰看见情绪的复杂性，而不是简单归类为“好”或“坏”。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendSpecialCard(this.chatMessages, module32AllowanceCardHtml);
            startCardCountdown(this.chatMessages, 20, '可完成', '已完成', () => {
                this.step = 15;
                this.onContinue_Module32();
            });
        } else if (this.step === 15) {
            appendSpecialCard(this.chatMessages, module32ExpansionCardHtml);
            startCardCountdown(this.chatMessages, 20, '可完成', '已完成', () => {
                this.step = 16;
                this.onContinue_Module32();
            });
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '很好，这样的方式能够帮助跳出单一情绪，拓宽感知范围，从而减少对负面情绪的过度关注。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendSpecialCard(this.chatMessages, module32ActionCardHtml);
            startCardCountdown(this.chatMessages, 20, '可完成', '已完成', () => {
                this.step = 18;
                this.onContinue_Module32();
            });
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '你做得很好。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(
                this.chatMessages,
                '其实小李的情况很多人都会遇到。现在，请试着回想你自己最近一次类似经历：<br>当时你是如何应对担忧/焦虑的？<br>有没有强迫自己“必须积极”的时刻？<br>是否压抑过某些“不被允许”的情绪？',
                true
            );
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '不着急，你可以慢慢回想，然后可以把自己想到的输入到对话框中。', false);
            disableInput(this.inputArea, this.userInput);
            enableInputAfterDelay(this, 120, 21);
        } else if (this.step === 22) {
            appendAiMessage(this.chatMessages, '今天我们重点学习了过度积极反刍，即那些强迫“必须积极”反而压抑真实情绪的心理模式，并进一步将接纳技术扩展应用到这些场景。', true);
            this.step = 23;
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '接纳技术作为心理弹性训练的核心之一，能够鼓励我们接纳真实的感受，进而能更从容地度过每一次压力和挑战。未来，在应对多样压力、情绪时相信你也可以灵活应用接纳技术来应对。', true);
            this.step = 24;
        } else if (this.step === 24) {
            appendAiMessage(this.chatMessages, '一个小提醒，我们这几天还需要继续进行情绪日记的记录（问卷星链接：待后续补充）。每一天你可以选择在当晚（一天结束前）填写这个情绪日记，也可以选择在你遇到有情绪波动的事情时即刻开始记录。', false);
            this.step = 25;
        }
    },

    showModule32Question(index) {
        appendSpecialCard(this.chatMessages, module32QuestionCards[index]);
        appendButtonGroup(this.chatMessages, ['积极应对', '过度积极反刍'], (choice) => {
            removeCurrentButtonGroup(this.chatMessages);
            this.handleModule32QuestionChoice(index, choice);
        });
    },

    handleModule32QuestionChoice(index, choice) {
        appendAiMessage(this.chatMessages, module32QuestionResponses[index][choice], true);

        if (index === 0) {
            this.step = 82;
            return;
        }

        if (index === 1) {
            this.step = 84;
            return;
        }

        this.step = 9;
    },

    handleModule32UserMessage(text) {
        if (this.step === 1) {
            this.module32State.recallAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 2;
            this.onContinue_Module32();
            return;
        }

        if (this.step === 21) {
            this.module32State.reflectionAnswer = text;
            disableInput(this.inputArea, this.userInput);
            appendAiMessage(this.chatMessages, getModule32ReflectionFeedback(text), true);
            this.step = 22;
        }
    }
};

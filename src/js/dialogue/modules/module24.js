import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    appendUnderstandButton,
    queueUiMutation,
    disableInput,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';

const module24IntroCards = [
    '<p><strong>【第一步：观察】</strong>精准描述“情绪+身体感受”</p><p>说什么做什么：观察自己，用“我现在感到____（情绪词），身体____（具体部位+感受）”句式表达，不添加“我不该这样”等评判的句子。</p><p>示例：可以说"我现在感到焦虑，手心有点出汗"，不说“我别焦虑”。</p>',
    '<p><strong>【第二步：允许】</strong>对自己说“接纳”的话</p><p>说什么做什么：用“有这样的情绪是正常的，我允许它在这儿，不怪自己”类似的话，不否定、不压抑，像允许一位客人暂时坐在自己的客厅。</p><p>示例：有压力感到焦虑时，不骂自己“没用”，可以说"最近有工作压力感到焦虑很正常，我允许自己焦虑一会儿"。</p>',
    '<p><strong>【第三步：扩展】</strong>把注意力从“情绪”扩到“其他感受”</p><p>说什么做什么：先关注情绪15秒，再慢慢将注意力转移到“呼吸/身体其他部位/周围声音”，用“除了____（情绪），我还能感受到____”来表达。</p><p>示例：焦虑时，先感受焦虑15秒，再说“除了焦虑，我还能感受到呼吸的节奏”，或感受“我的脚踩在地上，很稳”。</p>',
    '<p><strong>【第四步：行动】</strong>做一个“微小的照顾自己的动作”</p><p>说什么做什么：选不需要费力气的小事（30秒内能完成），做完后说“我刚为自己做了____”。</p><p>示例：可以喝一口温水，说“我刚为自己补充了水分”；或摸一下头发，说“我刚轻轻摸了摸自己”。</p>'
];

const module24Cases = {
    'a工作受挫': '连续加班两周后，项目被客户否决，你感到前所未有的挫败和疲惫，胸口像堵了一块石头，觉得自己所有的努力都白费了。',
    'b考前焦虑': '一场重大的考试前夜，你突然发现还有好几个重要的大知识点没复习，心慌意乱，手都开始发抖，觉得“这次肯定要考砸了”。',
    'c关系紧张': '和一位重要的多年的好朋友因为误会发生争执，之后对方不再回复你的消息，你感到伤心、委屈，喉咙发堵，又不知如何是好。',
    'd多重压力': '家里长辈突然生病住院，你需要在工作、家庭和医院之间来回奔波，感到精疲力竭，眼皮像灌了铅一样沉重，胃也有些隐隐作痛，内心充满了对病情的担忧、对无法面面俱到的自责，以及无人能理解的孤独。',
    'e变动不适': '因公司架构调整，你被调到一个不熟悉的岗位，需要重新学习，你感到焦虑和不适应，眉头一直不自觉紧锁着，担心自己无法胜任。'
};

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, onComplete) {
    queueUiMutation(chatMessages, () => {
        const cards = chatMessages.querySelectorAll('.special-card');
        const currentCard = cards[cards.length - 1];
        const sessionId = getChatSessionId(chatMessages);
        const deadline = Date.now() + (seconds * 1000);

        if (!currentCard) {
            setTimeout(() => {
                if (!isChatSessionActive(chatMessages, sessionId)) return;
                onComplete();
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
            } else {
                clearInterval(timer);
                if (!isChatSessionActive(chatMessages, sessionId)) return;
                timerDiv.innerText = readyText;
                onComplete();
            }
        }, 250);
    });
}

export const module24Handlers = {
    onContinue_Module24() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '今天，我们将学习“接纳技术”。它不是一个消除情绪的工具，而像是给情绪搭台阶，不强迫自己立刻不难受，一步步和情绪温和相处。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '接下来，我们将了解四个具体的步骤。每个步骤都会告知我们具体说什么和做什么，请一起跟随尝试。', true);
            this.step = 2;
        } else if (this.step === 2) {
            this.module24State.introCardIndex = 0;
            this.showModule24NextIntroCard();
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '这四步的核心是：不推开情绪，而是通过观察、允许、扩展和微小行动，一步步下台阶，与情绪建立一种更温和的关系。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '接下来，我们将通过一个案例来练习。', true);
            this.step = 6;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '请从以下常见的压力情境中，选择一个你感兴趣或感到有共鸣的情境：', false);
            appendButtonGroup(
                this.chatMessages,
                ['a工作受挫', 'b考前焦虑', 'c关系紧张', 'd多重压力', 'e变动不适'],
                (choice) => this.handleModule24CaseChoice(choice)
            );
            this.step = 7;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '接着，我们跟着下面即将展示的步骤，小声说出对应的话、做对应的动作，不用怕说错或做错。', true);
            this.step = 9;
        } else if (this.step === 9) {
            this.showModule24ObservationPractice();
        } else if (this.step === 11) {
            this.showModule24AllowancePractice();
        } else if (this.step === 12) {
            this.showModule24ExpansionPractice();
        } else if (this.step === 14) {
            this.showModule24ActionPractice();
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '你刚刚完成了一次完整的情绪接纳练习。回顾这四步——观察要“具体说”，允许要“不怪自己”，扩展要“找其他感受”，行动要“做小事”。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '这四步的目的不是让情绪立刻消失，而是让你在情绪中，依然能拥有一个稳定温和的支点。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '在实际生活中，不管是遇到今天类似的案例，还是其他事情，我们都可以有意识地按这四步做：先说出情绪和身体感受，再允许自己有这情绪，接着找其他感受，最后做个小动作。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '一个简单的口诀是：“说出它，允许它，扩展它，关怀自己”。 关键不在完美，而在去做。哪怕每天只应用一次情绪接纳练习，也会越来越熟练。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '今天的练习就到这里了。下面的卡片展示了今天练习的核心内容，以供保存和练习。', true);
            this.step = 20;
        } else if (this.step === 20) {
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>【第一步：观察】</strong>精准描述“情绪+身体感受”</p><p>说什么做什么：观察自己，用“我现在感到____（情绪词），身体____（具体部位+感受）”句式表达，不添加“我不该这样”等评判的句子。</p><p><strong>【第二步：允许】</strong>对自己说“接纳”的话</p><p>说什么做什么：用“有这样的情绪是正常的，我允许它在这儿，不怪自己”类似的话，不否定、不压抑，像允许一位客人暂时坐在自己的客厅。</p><p><strong>【第三步：扩展】</strong>把注意力从“情绪”扩到“其他感受”</p><p>说什么做什么：先关注情绪15秒，再慢慢将注意力转移到“呼吸/身体其他部位/周围声音”，用“除了____（情绪），我还能感受到____”来表达。</p><p><strong>【第四步：行动】</strong>做一个“微小的照顾自己的动作”</p><p>说什么做什么：选不需要费力气的小事（30秒内能完成），做完后说“我刚为自己做了____”。</p>'
            );
            this.step = 21;
        }
    },

    showModule24NextIntroCard() {
        const currentIndex = this.module24State.introCardIndex;
        appendSpecialCard(this.chatMessages, module24IntroCards[currentIndex]);

        if (currentIndex < module24IntroCards.length - 1) {
            appendButtonGroup(this.chatMessages, ['下一步'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module24State.introCardIndex += 1;
                this.showModule24NextIntroCard();
            });
            return;
        }

        appendUnderstandButton(this.chatMessages, () => {
            this.step = 4;
            this.onContinue_Module24();
        });
    },

    handleModule24CaseChoice(choice) {
        removeCurrentButtonGroup(this.chatMessages);
        this.module24State.selectedCase = choice;
        appendSpecialCard(this.chatMessages, `<p>${this.escapeHtml(module24Cases[choice])}</p>`);
        appendAiMessage(this.chatMessages, '现在请仔细体会卡片上呈现的案例，想象这是自己正在经历的事。', false);
        appendContinueButton(this.chatMessages, 30);
        this.step = 8;
    },

    showModule24ObservationPractice() {
        appendSpecialCard(
            this.chatMessages,
            '<p><strong>【第一步：观察】</strong>看着上面的案例，细心感受15秒，然后试着说出“我现在感到____（从案例里找情绪），身体____”，最后将它输入到对话框中。</p>'
        );
        startCardCountdown(this.chatMessages, 15, '可输入', () => {
            this.enableInputForModule(this.chatMessages);
            this.step = 10;
        });
    },

    showModule24AllowancePractice() {
        appendSpecialCard(
            this.chatMessages,
            '<p><strong>【第二步：允许】</strong>对自己说“遇到这种事，有这情绪很正常，我允许它在这儿”或者“我可以有这样的感受，很正常”。你可以重复这句话，感受‘允许’带来的细微变化。</p>'
        );
        startCardCountdown(this.chatMessages, 15, '可完成', () => {
            appendButtonGroup(this.chatMessages, ['已完成'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 12;
                this.onContinue_Module24();
            });
        });
    },

    showModule24ExpansionPractice() {
        appendSpecialCard(
            this.chatMessages,
            '<p><strong>【第三步：扩展】</strong>先关注情绪15秒，再慢慢将注意力转移到“呼吸/身体其他部位/周围声音/其他”，试着说“除了____（情绪），我还能感受到____”，最后将它输入到对话框中。</p>'
        );
        startCardCountdown(this.chatMessages, 15, '可输入', () => {
            this.enableInputForModule(this.chatMessages);
            this.step = 13;
        });
    },

    showModule24ActionPractice() {
        appendSpecialCard(
            this.chatMessages,
            '<p><strong>【第四步：行动】</strong>做一个小动作，并说“我刚刚做了_____”。</p>'
        );
        startCardCountdown(this.chatMessages, 15, '可完成', () => {
            appendButtonGroup(this.chatMessages, ['已完成'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 15;
                this.onContinue_Module24();
            });
        });
    },

    handleModule24UserMessage(text) {
        if (this.step === 10) {
            this.module24State.observationAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 11;
            this.onContinue();
        } else if (this.step === 13) {
            this.module24State.expansionAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 14;
            this.onContinue();
        }
    }
};

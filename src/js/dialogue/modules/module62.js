import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    appendUnderstandButton,
    startBottomCountdown,
    queueUiMutation,
    disableInput,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, buttonLabel, onComplete) {
    startBottomCountdown(chatMessages, seconds, readyText, () => {
        appendButtonGroup(chatMessages, [buttonLabel], () => {
            removeCurrentButtonGroup(chatMessages);
            onComplete();
        });
    }, { align: 'card' });
    return;
    queueUiMutation(chatMessages, () => {
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
    });
}

function buildPerspectiveTableHtml(rows) {
    return `
        <table style="border-collapse:collapse;width:100%;">
            <tr>
                <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;"></th>
                <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">第一人称体验者视角<br>（“我”的感受）</th>
                <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">第三人称观察者视角<br>（“他/她”的观察）</th>
            </tr>
            ${rows.map(([label, leftContent, rightContent]) => `
                <tr>
                    <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;font-weight:600;">${label}</td>
                    <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">${leftContent}</td>
                    <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">${rightContent}</td>
                </tr>
            `).join('')}
        </table>
    `;
}

function buildPerspectiveTable(leftEvent, leftBody, leftThought, leftIntensity, rightEvent, rightBody, rightThought, rightIntensity) {
    return buildPerspectiveTableHtml([
        ['事件极简描述', `今天让我焦虑的压力事件：${leftEvent}`, `今天发生的事：${rightEvent}`],
        ['当下的身体反应', `我现在的身体感觉：${leftBody}`, `他的身体反应：${rightBody}`],
        ['冒出来的想法', `我心里在想：${leftThought}`, `他心里可能在想：${rightThought}`],
        ['情绪打分<br>（1-10分）', `我现在的焦虑感：${leftIntensity}分`, `他现在的焦虑感看起来有：${rightIntensity}分`]
    ]);
}

function getDesireFeedback(text) {
    const normalized = text.replace(/\s+/g, '');

    if (/认可|肯定|被看见|成就|能力/.test(normalized)) {
        return '你发现“他/她”渴望被认可，这非常深刻。这意味着，那次事件可能触动了一个对你而言非常重要的价值领域——能力与成就感。焦虑和压力，往往是这些重要价值受到挑战时发出的警报。看清了这个警报的意义，你就从对抗模糊的难受，转向了守护清晰的价值。你可以问自己：“基于这份对认可的渴望，我现在可以为自己做的一件小事是什么？”';
    }

    if (/平静|安全|安稳|稳定|安心|安宁/.test(normalized)) {
        return '你发现“他/她”渴望平静与安全。这指向了人类最根本的价值需求之一——稳定与安宁。当外界事件威胁到我们内心的安全港时，强烈的情绪就会涌现。识别出这一点，本身就是一种强大的自我安抚。你知道自己在为什么而战——为了内心那片宁静的土壤。';
    }

    return '你已经开始透过情绪，看到更深层的渴望了。无论你写下的是被理解、连接、归属、成长、健康，还是别的关键词，它们都在提醒你：压力和焦虑并不只是难受，它们也在提示你，什么对你而言真的很重要。';
}

export const module62Handlers = {
    onContinue_Module62() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '在之前的练习中，我们通过隐喻接触了“观察性自我”。今天，我们将进一步拓展，将观察性自我的概念转化为日常可以使用的工具，也就是“双视角日记技术”。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '双视角日记技术指的是当遇到压力事件时，我们可以用“第一人称体验者”和“第三人称观察者”两种视角来记录。', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>第一人称体验者：</strong>就是你当下的真实感受，比如“我快被这个任务压垮了，我好担心自己做不完。”</p><p><strong>第三人称观察者：</strong>就是用观察性自我的视角，像看朋友一样描述自己，比如“她现在在担心做不完任务，手有点紧”。</p><p><strong>通过两种视角对比，我们能更清楚情绪背后的需求。</strong></p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '用两种视角，不是为了评判哪一种视角更好，而是为了看清事件和情绪的全貌，从而更有效地应对。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '下面，我们提供了一个简洁的双视角记录表格。它展示了我们作为体验者和观察者时应当记录的方面：简单的事件描述、当下身体反应、想法、情绪打分。', false);
            appendSpecialCard(
                this.chatMessages,
                buildPerspectiveTableHtml([
                    ['事件极简描述', '今天让我焦虑的压力事件：______（例：导师说我的论文需要重写）', '今天发生的事：______（例：他去找导师，导师提到他的论文需要重写）'],
                    ['当下的身体反应', '我现在的身体感觉：______（例：心跳快、手心出汗）', '他的身体反应：______（例：他说话时声音有点抖，手不自觉握起，呼吸比平时快）'],
                    ['冒出来的想法', '我心里在想：______（例：是不是我学习能力有问题？毕业会不会有问题？）', '他心里可能在想：______（例：他在怀疑自己的学习能力，也在害怕会影响到毕业）'],
                    ['情绪打分<br>（1-10分）', '我现在的焦虑感：______分', '他现在的焦虑感看起来有：______分']
                ])
            );
            appendContinueButton(this.chatMessages);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '现在，我将以“一次失败的会议发言”这一压力事件为例，向你展示如何以第一人称和第三人称的视角陈述并填写双视角记录表格。', false);
            appendContinueButton(this.chatMessages);
            this.step = 5;
        } else if (this.step === 5) {
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>【第一人称体验者】</strong>刚才的项目讨论会上，我的提议被领导当场否决了，还说我“考虑不周”。我感觉脸上火辣辣的，恨不得找个地缝钻进去。现在会议结束半小时了，我还是完全没法集中精神工作，脑子里全是那个尴尬的画面。我一直在想：同事肯定都在笑话我，领导会不会觉得我能力不行？胃里感觉堵得慌，心跳还是很快。</p><p><strong>（关键点：陈述时需要包含真实感受压力事件发生后的持续反应，不掩饰）</strong></p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 6;
        } else if (this.step === 6) {
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>【第三人称观察者】</strong>他在会议中被否决了提议，现在正独自坐在工位前，眼神有些放空，时不时会无意识地叹气。他脑子里可能还在回放会议的场景，担心同事的看法和领导的评价。他的身体看起来还有些紧绷，没有完全从刚才的紧张感中恢复过来。</p><p><strong>（关键点：客观地描述行为和想法，不代入情绪）</strong></p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '你看，体验者的视角被发生的压力事件牢牢抓住，充满了焦虑、自我怀疑和强烈的身体反应。而观察者的视角更冷静。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '下面表格记录了两个视角。这种从“我”到“他/她”的语言转换，本身就是一种强大的心理解离练习。它立刻在我们与强烈的情绪之间，创造了一个可以呼吸的观察空间。', false);
            appendSpecialCard(
                this.chatMessages,
                buildPerspectiveTableHtml([
                    ['事件极简描述', '我的提议被领导当场否决了，还说‘考虑不周’', '他在会议中的提议被否决了'],
                    ['当下的身体反应', '我现在的身体感觉：我感觉脸上火辣辣的，胃里发堵，心跳很快。', '他的身体反应：他的脸颊泛红，呼吸有些短促，身体姿态显得有些紧绷。'],
                    ['冒出来的想法', '我心里在想：我完了，同事肯定都在笑话我，领导会觉得我能力不行。', '他心里可能在想：他的脑海里可能在反复回放那个场景，担心同事的评价和领导对他能力的看法。'],
                    ['情绪打分<br>（1-10分）', '我现在的焦虑感：8分', '他现在的焦虑感看起来有：7分']
                ])
            );
            appendUnderstandButton(this.chatMessages, () => {
                this.step = 9;
                this.onContinue_Module62();
            });
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '现在，轮到你来体验这个转换的过程。请回想在过去两周内，一件让你感到有压力或困扰的事情。它不需要惊天动地，一次小的摩擦、一个未完成的担忧，都可以。你可以慢慢回想，想到后再点击继续。', false);
            appendSpecialCard(this.chatMessages, '<p>请慢慢回想在过去两周内，一件让你感到有压力或困扰的事情。</p>');
            startCardCountdown(this.chatMessages, 120, '可继续', '继续', () => {
                this.step = 10;
                this.onContinue_Module62();
            });
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '好的，现在让我们先从【第一人称体验者】的视角开始。请用一两句话，写下那件让你感到压力的事，然后通过对话框发送。注意，你发送的内容将会保密，不会被用于其他用途。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 11;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '当这件事发生时或发生后，你的身体有什么感觉？比如哪里发紧、发热，或是感到沉重？请输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 13;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '感谢你的真实记录。感受没有对错，它们都是你内在体验的宝贵信息。', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '当时，你脑海里最突出的、反复出现的想法是什么？把它写下来。哪怕是“我好差劲”这样的想法，也请如实写下。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 16;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '如果我们定义情绪强度（如焦虑、愤怒、难过）从0到10分，你认为当时的自己大概是几分？请输入数字。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 18;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '你做得很好。现在请深呼吸一次，活动一下。然后我们将视角切换到【第三人称观察者】。请结合你刚刚作为体验者的回答，并想象当时的你只是电影中的一个角色，而现在的你，是坐在导演监视器后，充满理解与关怀的导演。', false);
            appendSpecialCard(this.chatMessages, '<p>请深呼吸一次，活动一下，然后准备切换到【第三人称观察者】。</p>');
            startCardCountdown(this.chatMessages, 30, '可继续', '继续', () => {
                this.step = 20;
                this.onContinue_Module62();
            });
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '请你以这位导演的身份，按照下面的引导，为刚才写下的所有内容，进行一场客观、温和的现场解说。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '从旁观者的角度（导演）看，这件事是如何发生的？', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 22;
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '镜头里的“他/她”，身体上表现出哪些信号？', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 24;
        } else if (this.step === 25) {
            appendAiMessage(this.chatMessages, '根据“他/她”的表现，你推测“他/她”的脑海里可能会想什么？', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 26;
        } else if (this.step === 27) {
            appendAiMessage(this.chatMessages, '从外表和行为推测，“他/她”当时的负面情绪强度看起来有几分？', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 28;
        } else if (this.step === 29) {
            appendAiMessage(this.chatMessages, '感谢你的回答。接下来为你生成刚刚的双视角记录。', false);
            appendSpecialCard(
                this.chatMessages,
                buildPerspectiveTable(
                    this.escapeHtml(this.module62State.eventText),
                    this.escapeHtml(this.module62State.bodyText),
                    this.escapeHtml(this.module62State.thoughtText),
                    this.escapeHtml(this.module62State.emotionIntensity),
                    this.escapeHtml(this.module62State.observerEventText),
                    this.escapeHtml(this.module62State.observerBodyText),
                    this.escapeHtml(this.module62State.observerThoughtText),
                    this.escapeHtml(this.module62State.observerIntensity)
                )
            );
            appendContinueButton(this.chatMessages);
            this.step = 30;
        } else if (this.step === 30) {
            appendAiMessage(this.chatMessages, '请将你的目光聚焦在“第三人称观察者”这一栏，仔细阅读你对“他/她”的描述。然后，请回答这个关键问题：', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>作为一位充满关怀的观察者，你认为‘他/她’在那段经历中，内心最深处的渴望或在乎的是什么？</strong></p><p>例如：</p><p>那个“担心汇报搞砸的人”，可能渴望被认可、有能力、做出贡献。</p><p>那个“因误会而伤心的人”，可能渴望被理解、连接和归属感。</p><p>那个“为健康焦虑的人”，可能渴望安全、掌控感和生命活力。</p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 31;
        } else if (this.step === 31) {
            appendAiMessage(this.chatMessages, '请将你的回答（1-3个关键词或短句）输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 32;
        } else if (this.step === 33) {
            appendAiMessage(this.chatMessages, getDesireFeedback(this.module62State.desireText), true);
            this.step = 34;
        } else if (this.step === 34) {
            appendAiMessage(this.chatMessages, '通过双视角日记，我们完成了一次完整的解码，并最终找到我们在压力事件和情绪背后真正的需求：', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>1. 承认感受</strong>（体验者视角）→ <strong>2. 创造空间</strong>（观察者视角）→ <strong>3. 发现价值</strong>（渴望澄清）</p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 35;
        } else if (this.step === 35) {
            appendAiMessage(this.chatMessages, '这样情绪不再是需要消灭的敌人，而是指引我们走向内心重要价值的信使。', true);
            this.step = 36;
        } else if (this.step === 36) {
            appendAiMessage(this.chatMessages, '当你再次被情绪包围时，可以尝试这个简单的双视角切换：先如实承认“体验者“的感受，然后后退一步，用”观察者“的关怀目光去看待自己，并问：此刻，这个“我”在乎的是什么？', true);
            this.step = 37;
        } else if (this.step === 37) {
            appendAiMessage(this.chatMessages, '这个练习，会让你最终明确渴望实现的价值需求，比如被认可、被理解、成长、健康，而压力和焦虑常常是这些价值受到威胁的信号。看清它们，我们就不再是与模糊的感觉作战，而是为清晰的价值采取可能的行动。我们下次再见。', false);
            this.step = 38;
        }
    },

    handleModule62UserMessage(text) {
        if (this.step === 11) {
            this.module62State.eventText = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 12;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 13) {
            this.module62State.bodyText = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 14;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 16) {
            this.module62State.thoughtText = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 17;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 18) {
            this.module62State.emotionIntensity = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 19;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 22) {
            this.module62State.observerEventText = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 23;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 24) {
            this.module62State.observerBodyText = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 25;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 26) {
            this.module62State.observerThoughtText = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 27;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 28) {
            this.module62State.observerIntensity = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 29;
            this.onContinue_Module62();
            return;
        }

        if (this.step === 32) {
            this.module62State.desireText = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 33;
            this.onContinue_Module62();
        }
    }
};

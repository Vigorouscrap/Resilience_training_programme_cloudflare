import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    startBottomCountdown,
    queueUiMutation,
    disableInput,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';
import { runAiHook } from '../aiHookRunner.js';

const module44QuizItems = [
    { text: '这是一个好想法', correct: '评判性标签' },
    { text: '这是一个极端化推论', correct: '描述性标签' },
    { text: '这是一个情绪化断言', correct: '描述性标签' },
    { text: '这是一个假设性推测', correct: '描述性标签' },
    { text: '这是一个跳跃式联想', correct: '描述性标签' },
    { text: '这个想法太消极', correct: '评判性标签' },
    { text: '这是一个愚蠢的观点', correct: '评判性标签' }
];

const module44BenefitCards = [
    '<p><strong>第一，帮我们减少焦虑</strong></p><p>当想到“这个月的钱会不会不够花”，贴上“这是一个担忧未来的想法”后，就不会立刻陷入钱不够花的恐慌，而是知道这只是自己的一个念头，接下来可以采取一些行动，例如做预算。</p>',
    '<p><strong>第二，避免被“必须积极”的规则绑架</strong></p><p>比如出现“我必须每天开心”的想法，贴上“这是一个追求完美的想法”后，就能接纳自己偶尔的失落，不用强迫自己假装积极。</p>',
    '<p><strong>第三，清晰识别思维模式</strong></p><p>通过贴标签，能够慢慢发现自己经常出现的想法类型，比如总出现“担心类”想法，后续就能针对性调整。</p>'
];

const module44Cases = [
    '1.（人际关系）“我的朋友没有立刻回复我的消息，他们肯定都讨厌我了。',
    '2.（健康与外貌）“查出一个健康问题，我觉得我的身体彻底垮了。”',
    '3.（家庭关系） “我和家人因为琐事争吵，我不是一个好儿子/女儿/伴侣。”',
    '4.（社会比较）“看到朋友圈里别人的精彩生活，我觉得自己的存在毫无意义。”',
    '5.（工作学习）“这个项目报告有一个瑕疵，整个项目就是失败的。”',
    '6.（突发事件）“飞机遇到持续颠簸，感觉我们就要坠毁了。” '
];

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, onComplete) {
    startBottomCountdown(chatMessages, seconds, readyText, onComplete, { align: 'card' });
    return;
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
                return;
            }

            clearInterval(timer);
            if (!isChatSessionActive(chatMessages, sessionId)) return;
            timerDiv.innerText = readyText;
            onComplete();
        }, 250);
    });
}

function createModule44QuizHtml() {
    const itemsHtml = module44QuizItems.map((item, index) => `
        <div class="module44-quiz-row" data-index="${index}">
            <div class="module44-quiz-label">${index + 1}. ${item.text}</div>
            <div class="module44-quiz-options">
                <label class="module44-quiz-option">
                    <input type="radio" name="module44-quiz-${index}" value="描述性标签">
                    <span>描述性标签</span>
                </label>
                <label class="module44-quiz-option">
                    <input type="radio" name="module44-quiz-${index}" value="评判性标签">
                    <span>评判性标签</span>
                </label>
            </div>
            <div class="module44-quiz-feedback" data-feedback="${index}"></div>
        </div>
    `).join('');

    return `
        <div class="module44-quiz">
            <style>
                .module44-quiz {
                    display: grid;
                    gap: 1rem;
                }
                .module44-quiz-title {
                    font-weight: 700;
                    color: #1c3853;
                }
                .module44-quiz-hint {
                    color: #355677;
                    line-height: 1.6;
                }
                .module44-quiz-row {
                    background: rgba(255, 255, 255, 0.72);
                    border-radius: 1.2rem;
                    padding: 1rem 1.1rem;
                    border: 1px solid #c9d9ea;
                }
                .module44-quiz-label {
                    color: #17324b;
                    line-height: 1.55;
                    margin-bottom: 0.75rem;
                }
                .module44-quiz-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.8rem;
                }
                .module44-quiz-option {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                    padding: 0.5rem 0.8rem;
                    border-radius: 999px;
                    background: #eef4fb;
                    color: #1f4668;
                    cursor: pointer;
                }
                .module44-quiz-option input {
                    margin: 0;
                }
                .module44-quiz-actions {
                    display: flex;
                    justify-content: flex-start;
                    gap: 0.8rem;
                    flex-wrap: wrap;
                    margin-top: 0.2rem;
                }
                .module44-quiz-check {
                    background: #dbeafe;
                    border: 2px solid #7ba5cf;
                    color: #1e4a72;
                    border-radius: 30px;
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: 0 2px 6px #acc2db;
                    transition: all 0.2s;
                }
                .module44-quiz-check:disabled {
                    opacity: 0.6;
                    cursor: default;
                    box-shadow: none;
                }
                .module44-quiz-feedback {
                    margin-top: 0.6rem;
                    font-size: 0.95rem;
                    color: #2f587b;
                }
                .module44-quiz-feedback.correct {
                    color: #1f6a3f;
                }
                .module44-quiz-feedback.incorrect {
                    color: #8a3f29;
                }
            </style>
            <div class="module44-quiz-title">想法标签类型判断</div>
            <div class="module44-quiz-hint">（以下呈现了七个不同的标签，请分别判断他们的性质，并选择相应的选项，全部完成后，请点击“检查对错”按钮查看正确答案。）</div>
            ${itemsHtml}
            <div class="module44-quiz-actions">
                <button type="button" class="module44-quiz-check" disabled>检查对错</button>
            </div>
        </div>
    `;
}

function getModule44CaseFeedback(answer) {
    const normalized = answer.replace(/\s+/g, '');

    if (!normalized) {
        return '可以再试着描述一下这个想法的核心属性，而不是评价它好不好。';
    }

    if (/灾难|绝对化|预测|担忧|猜测|自我批判|标签|推测|联想|情绪化/.test(answer)) {
        return '感谢你的回答。这个标签是有方向的，抓住了想法的某些特征。继续记住：描述想法的核心属性，而不评价它。';
    }

    return '感谢你的回答。给想法贴标签的时候，关键是描述想法的核心属性，而不评价它。你可以继续试着往“担忧未来”“绝对化预测”“自我批判”这类描述性方向去想。';
}

function classifyModule44LabelAnswer(answer) {
    const normalized = String(answer || '').trim();
    const compact = normalized.replace(/\s+/g, '');

    if (!compact) {
        return 'off_topic_or_unclear';
    }

    if (/不知道|不清楚|想不到|不会|随便|不太会|不明白|不知道怎么说/.test(compact)) {
        return 'off_topic_or_unclear';
    }

    if (compact.length >= 20 || /因为|所以|就是|我觉得|它说明|这个意思|原因|应该|所以说/.test(normalized)) {
        return 'off_topic_or_unclear';
    }

    if (/好想法|坏想法|正确|错误|积极|消极|负面|正面|糟糕|可怕|愚蠢|荒谬|悲观|乐观/.test(normalized)) {
        return 'judgmental_label';
    }

    return 'descriptive_label';
}

export const module44Handlers = {
    onContinue_Module44() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '前两天我们通过火车站台冥想来学习把想法当成“路过的火车”，从而认识了认知解离。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天我们将进一步学习认知解离的具体工具——想法标签化。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '什么是想法标签化呢？', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '你可以先根据字面意思，在心里试着猜一猜！', false);
            appendContinueButton(this.chatMessages, 30);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '就像图书馆员给书贴分类号：这本书是“科幻小说”；那本书是“历史传记”，不评价书的好坏，而是进行客观分类。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '因此，想法标签化就是要给想法提供“描述性标签”，而非“评判性标签”。', true);
            this.step = 6;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '其中，描述性标签只陈述想法的结构、形式或特征，不带有价值判断；评判性标签则直接评价想法的好坏或性质。', true);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '请试着判断以下想法标签是描述性的还是评判性的吧！', false);
            appendSpecialCard(this.chatMessages, createModule44QuizHtml());
            queueUiMutation(this.chatMessages, () => {
                this.initializeModule44Quiz();
            });
            this.step = 8;
        } else if (this.step === 13) {
            this.showModule44BenefitCard(this.module44State.benefitIndex);
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '很好。我们现在已经了解了什么是描述性标签和评判性标签。', true);
            this.step = 10;
        } else if (this.step === 15 && this.module44State.caseAnswers.length > 0) {
            this.showModule44CasePrompt();
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '想法标签化举例：', false);
            appendSpecialCard(this.chatMessages, '<p><strong>想法：</strong>“我担心自己做不好”</p><p><strong>想法标签化：</strong>这是一种预期焦虑/这是一种前瞻性的恐惧</p>');
            appendContinueButton(this.chatMessages);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '想一想，“我一定完蛋了” 贴上什么标签最合适？', false);
            appendButtonGroup(this.chatMessages, ['A.悲观想法', 'B.绝对化预测', 'C.消极念头'], (choice) => {
                removeCurrentButtonGroup(this.chatMessages);

                if (choice === 'A.悲观想法') {
                    appendAiMessage(this.chatMessages, '你选择了A【悲观想法】。“悲观”已经带有一定的价值判断色彩，这个标签其实并没有完全客观描述想法的特征。应当选择B【绝对化预测】更合适。', true);
                } else if (choice === 'B.绝对化预测') {
                    appendAiMessage(this.chatMessages, '正确，绝对化预测这个标签确实是在客观描述思维特征，而不评价想法的好坏。', true);
                } else {
                    appendAiMessage(this.chatMessages, '你选择了C【消极念头】。“消极”这一标签相当于直接给出了价值判断，即认为这个想法是负面的、不好的，而几乎没有描述具体认知形式。应当选择B【绝对化预测】更合适。', true);
                }

                this.step = 12;
            });
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '想法标签化为什么会被认为对心理健康有用呢？', false);
            this.module44State.benefitIndex = 0;
            this.showModule44BenefitCard(0);
            this.step = 13;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '接下来，为了进一步识别更广泛场景的想法并学习贴合适的标签，我们准备了一些案例。请尝试给每个案例贴标签，并输入到对话框中发送。', false);
            this.module44State.caseIndex = 0;
            this.module44State.caseAnswers = [];
            this.showModule44CasePrompt();
            this.step = 15;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '感谢你的所有回答。总而言之，我们在给想法贴标签的时候只要记住描述想法的核心属性而不评价就好。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '最后，我们用1分钟的时间想想今天或近期你有没有什么被困扰的想法，有的话请尝试给它贴一个标签。', false);
            appendContinueButton(this.chatMessages, 60);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '在日常生活中，你可以有意识地去做“想法标签化”练习并记录下来，具体来讲就是一旦出现一些想法，就去注意到它并尝试给它贴标签，然后记录下这样做之后的感受变化。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '这能让我们更清楚：这些练习到底能不能帮我们摆脱想法的困扰，我们的情绪会不会因为贴标签而变得更平稳。', true);
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '这就是今天的所有内容啦，期待你将我们学到的内容应用到自己的生活中。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '一个小提醒，我们今天还需要继续进行自我承诺行动，当你执行了你的接纳行动后，可以随时打开链接记录（<a href="https://v.wjx.cn/vm/YDIVxE6.aspx">https://v.wjx.cn/vm/YDIVxE6.aspx</a>）。相信通过一次一次的记录，我们能够更自如地应对情绪与压力。', false);
            this.step = 22;
        }
    },

    initializeModule44Quiz() {
        const cards = this.chatMessages.querySelectorAll('.special-card');
        const currentCard = cards[cards.length - 1];
        if (!currentCard) return;

        const checkBtn = currentCard.querySelector('.module44-quiz-check');
        const inputs = Array.from(currentCard.querySelectorAll('input[type="radio"]'));

        const updateState = () => {
            const answeredCount = module44QuizItems.filter((_, index) => currentCard.querySelector(`input[name="module44-quiz-${index}"]:checked`)).length;
            checkBtn.disabled = answeredCount !== module44QuizItems.length;
        };

        inputs.forEach(input => {
            input.addEventListener('change', updateState);
        });

        checkBtn.addEventListener('click', () => {
            if (checkBtn.disabled || this.module44State.quizChecked) return;
            this.module44State.quizChecked = true;

            module44QuizItems.forEach((item, index) => {
                const checked = currentCard.querySelector(`input[name="module44-quiz-${index}"]:checked`);
                const feedback = currentCard.querySelector(`[data-feedback="${index}"]`);
                const isCorrect = checked?.value === item.correct;

                if (feedback) {
                    feedback.className = `module44-quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
                    feedback.textContent = isCorrect ? `正确：${item.correct}` : `正确答案：${item.correct}`;
                }
            });

            const allInputs = currentCard.querySelectorAll('input[type="radio"]');
            allInputs.forEach(input => {
                input.disabled = true;
            });
            checkBtn.disabled = true;
            appendContinueButton(this.chatMessages);
            this.step = 9;
        });
    },

    showModule44BenefitCard(index) {
        appendSpecialCard(this.chatMessages, module44BenefitCards[index]);

        if (index < module44BenefitCards.length - 1) {
            appendContinueButton(this.chatMessages);
            this.module44State.benefitIndex = index + 1;
            return;
        }

        appendContinueButton(this.chatMessages);
        this.step = 14;
    },

    showModule44CasePrompt() {
        const caseIndex = this.module44State.caseIndex;
        appendSpecialCard(this.chatMessages, `<p>${module44Cases[caseIndex]}</p>`);
        startCardCountdown(this.chatMessages, 30, '可输入', () => {
            this.enableInputForModule(this.chatMessages);
        });
    },

    async handleModule44UserMessage(text) {
        if (this.step !== 15) return;

        this.module44State.caseAnswers.push(text);
        disableInput(this.inputArea, this.userInput);

        const caseIndex = this.module44State.caseIndex;
        const activeSessionId = this.dialogueSessionId;
        const classification = classifyModule44LabelAnswer(text);
        const response = await runAiHook({
            hookId: 'module-4-4.label-feedback',
            moduleId: '4-4',
            step: 15,
            userInput: text,
            context: {
                caseIndex,
                caseText: module44Cases[caseIndex] || '',
                classification,
                questionType: 'label_feedback'
            },
            fallbackText: getModule44CaseFeedback(text)
        });

        if (this.dialogueSessionId !== activeSessionId || this.currentModule !== '4-4') {
            return;
        }

        appendAiMessage(this.chatMessages, response.replyText, false);

        if (this.module44State.caseIndex < module44Cases.length - 1) {
            appendContinueButton(this.chatMessages);
            this.module44State.caseIndex += 1;
            return;
        }

        appendContinueButton(this.chatMessages);
        this.step = 16;
    }
};

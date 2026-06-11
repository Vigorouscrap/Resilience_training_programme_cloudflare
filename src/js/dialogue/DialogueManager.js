import {
    appendAiMessage,
    appendUserMessage,
    appendButtonGroup,
    removeContinueButton,
    disableInput,
    beginSequentialRender,
    endSequentialRender,
    consumePendingSequentialRender,
    queueUiMutation,
    resetSequentialRender,
    stopManagedMedia
} from '../ui.js';
import { module11Handlers } from './modules/module11.js';
import { module12Handlers } from './modules/module12.js';
import { module13Handlers } from './modules/module13.js';
import { module14And16Handlers } from './modules/module14and16.js';
import { module15Handlers } from './modules/module15.js';
import { module17Handlers } from './modules/module17.js';
import { module21Handlers } from './modules/module21.js';
import { module22Handlers } from './modules/module22.js';
import { module23Handlers, repeatedMeditationModuleIds } from './modules/module23.js';
import { module24Handlers } from './modules/module24.js';
import { module26Handlers } from './modules/module26.js';
import { module27Handlers } from './modules/module27.js';
import { module32Handlers } from './modules/module32.js';
import { module33Handlers } from './modules/module33.js';
import { module35Handlers } from './modules/module35.js';
import { module37Handlers } from './modules/module37.js';
import { module42Handlers } from './modules/module42.js';
import { module44Handlers } from './modules/module44.js';
import { module46Handlers } from './modules/module46.js';
import { module47Handlers } from './modules/module47.js';
import { module52Handlers } from './modules/module52.js';
import { module54Handlers } from './modules/module54.js';
import { module56Handlers } from './modules/module56.js';
import { module57Handlers } from './modules/module57.js';
import { module62Handlers } from './modules/module62.js';
import { module64Handlers } from './modules/module64.js';
import { module66Handlers } from './modules/module66.js';
import { module67Handlers } from './modules/module67.js';

export class DialogueManager {
    constructor(chatMessages, inputArea, userInput) {
        this.chatMessages = chatMessages;
        this.inputArea = inputArea;
        this.userInput = userInput;
        this.step = -1;
        this.currentModule = null;
        this.dialogueSessionId = 0;
        this.isContinuing = false;
        this.pendingContinueAction = null;
        this.participant = {
            name: '朋友',
            hometown: '',
            habit: '那个习惯',
            quality: '内在品质',
            introRawText: '',
            introClassification: ''
        };
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
        this.module21State = {
            initialAnswer: '',
            drowsinessMethodIndex: 0,
            agitationMethodIndex: 0
        };
        this.module22State = {
            selectedCase: '',
            emotionAnswer: '',
            impactAnswer: ''
        };
        this.module24State = {
            selectedCase: '',
            introCardIndex: 0,
            observationAnswer: '',
            expansionAnswer: ''
        };
        this.module27State = {
            breathAnswers: [],
            sharedStressText: '',
            hasConcreteStress: false
        };
        this.module32State = {
            recallAnswer: '',
            reflectionAnswer: ''
        };
        this.module37State = {
            breathAnswers: []
        };
        this.module42State = {
            observedThoughts: '',
            impulseThoughts: ''
        };
        this.module44State = {
            quizChecked: false,
            benefitIndex: 0,
            caseIndex: 0,
            caseAnswers: []
        };
        this.module46State = {
            supporterResponse: ''
        };
        this.module47State = {
            breathAnswers: []
        };
        this.module52State = {
            selectedThought: ''
        };
        this.module54State = {
            positiveChoice: '',
            positiveBefore: null,
            positiveAfter: null,
            negativeChoice: '',
            negativeBefore: null,
            negativeAfter: null
        };
        this.module56State = {
            visitedFaqs: new Set()
        };
        this.module57State = {
            breathAnswers: []
        };
        this.module62State = {
            eventText: '',
            bodyText: '',
            thoughtText: '',
            emotionIntensity: '',
            observerEventText: '',
            observerBodyText: '',
            observerThoughtText: '',
            observerIntensity: '',
            desireText: ''
        };
        this.module64State = {
            scenarioOneAnswer: '',
            scenarioTwoAnswer: ''
        };
        this.module66State = {
            visitedReviewSections: new Set(),
            disidentificationAnswer: '',
            acceptanceAnswer: '',
            observerAnswer: ''
        };
        this.module67State = {
            breathAnswers: [],
            growthAnswer: ''
        };
        this.invalidateAsyncCallbacks();
    }

    resetForModule(module) {
        stopManagedMedia(this.chatMessages);
        this.invalidateAsyncCallbacks();
        this.currentModule = module;
        this.chatMessages.innerHTML = '';
        this.pendingContinueAction = null;
        resetSequentialRender(this.chatMessages);
        this.step = -1;
        this.participant = {
            name: '',
            hometown: '',
            habit: '',
            quality: '',
            introRawText: '',
            introClassification: ''
        };
        disableInput(this.inputArea, this.userInput);

        beginSequentialRender(this.chatMessages);
        try {
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
            } else if (module === '2-1') {
                this.module21State = {
                    initialAnswer: '',
                    drowsinessMethodIndex: 0,
                    agitationMethodIndex: 0
                };
                appendAiMessage(this.chatMessages, '过去的一周里，我们已经进行了多次冥想练习。在练习过程中你是否有感到过昏昏入睡或者内心浮躁静不下来？', false);
                appendButtonGroup(this.chatMessages, ['有', '没有'], (answer) => this.handleModule21InitialAnswer(answer));
                this.step = 0;
            } else if (module === '2-2') {
                this.module22State = {
                    selectedCase: '',
                    emotionAnswer: '',
                    impactAnswer: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '2-4') {
                this.module24State = {
                    selectedCase: '',
                    introCardIndex: 0,
                    observationAnswer: '',
                    expansionAnswer: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '2-6') {
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '2-7') {
                this.module27State = {
                    breathAnswers: [],
                    sharedStressText: '',
                    hasConcreteStress: false
                };
                appendAiMessage(this.chatMessages, '欢迎来到这一周的回顾总结。', true);
                this.step = 0;
            } else if (module === '3-2') {
                this.module32State = {
                    recallAnswer: '',
                    reflectionAnswer: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '3-3') {
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '3-5') {
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '3-7') {
                this.module37State = {
                    breathAnswers: []
                };
                appendAiMessage(this.chatMessages, '欢迎来到这一周的回顾总结。', true);
                this.step = 0;
            } else if (module === '4-2') {
                this.module42State = {
                    observedThoughts: '',
                    impulseThoughts: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '4-4') {
                this.module44State = {
                    quizChecked: false,
                    benefitIndex: 0,
                    caseIndex: 0,
                    caseAnswers: []
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '4-6') {
                this.module46State = {
                    supporterResponse: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '4-7') {
                this.module47State = {
                    breathAnswers: []
                };
                appendAiMessage(this.chatMessages, '欢迎来到这一周的回顾总结。', true);
                this.step = 0;
            } else if (module === '5-2') {
                this.module52State = {
                    selectedThought: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '5-4') {
                this.module54State = {
                    positiveChoice: '',
                    positiveBefore: null,
                    positiveAfter: null,
                    negativeChoice: '',
                    negativeBefore: null,
                    negativeAfter: null
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '5-6') {
                this.module56State = {
                    visitedFaqs: new Set()
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '5-7') {
                this.module57State = {
                    breathAnswers: []
                };
                appendAiMessage(this.chatMessages, '欢迎来到这一周的回顾总结。', true);
                this.step = 0;
            } else if (module === '6-2') {
                this.module62State = {
                    eventText: '',
                    bodyText: '',
                    thoughtText: '',
                    emotionIntensity: '',
                    observerEventText: '',
                    observerBodyText: '',
                    observerThoughtText: '',
                    observerIntensity: '',
                    desireText: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '6-4') {
                this.module64State = {
                    scenarioOneAnswer: '',
                    scenarioTwoAnswer: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '6-6') {
                this.module66State = {
                    visitedReviewSections: new Set(),
                    disidentificationAnswer: '',
                    acceptanceAnswer: '',
                    observerAnswer: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (module === '6-7') {
                this.module67State = {
                    breathAnswers: [],
                    growthAnswer: ''
                };
                appendAiMessage(this.chatMessages, '欢迎来到今天的练习。', true);
                this.step = 0;
            } else if (repeatedMeditationModuleIds.has(module)) {
                appendAiMessage(this.chatMessages, '欢迎来到今天的冥想练习。', true);
                this.step = 0;
            } else if (module === '1-5') {
                appendAiMessage(this.chatMessages, '你好，欢迎来到今天的练习。', true);
            } else if (module === '1-4' || module === '1-6') {
                appendAiMessage(this.chatMessages, '欢迎来到今日的练习！', true);
                this.step = 5;
            }
        } finally {
            endSequentialRender(this.chatMessages);
        }
    }

    invalidateAsyncCallbacks() {
        this.dialogueSessionId += 1;
        this.chatMessages.dataset.dialogueSessionId = String(this.dialogueSessionId);
        this.pendingContinueAction = null;
        stopManagedMedia(this.chatMessages);
        resetSequentialRender(this.chatMessages);
    }

    onContinue() {
        if (this.isContinuing) return;
        this.isContinuing = true;

        try {
            if (consumePendingSequentialRender(this.chatMessages)) {
                return;
            }

            removeContinueButton();

            if (this.pendingContinueAction) {
                const pendingAction = this.pendingContinueAction;
                this.pendingContinueAction = null;
                beginSequentialRender(this.chatMessages);
                try {
                    pendingAction();
                } finally {
                    endSequentialRender(this.chatMessages);
                }
                return;
            }

            beginSequentialRender(this.chatMessages);
            if (this.currentModule === '1-2') {
                this.onContinue_Module12();
            } else if (this.currentModule === '1-3') {
                this.onContinue_Module13Docx();
            } else if (this.currentModule === '1-7') {
                this.onContinue_Module17Docx();
            } else if (this.currentModule === '2-1') {
                this.onContinue_Module21();
            } else if (this.currentModule === '2-2') {
                this.onContinue_Module22();
            } else if (this.currentModule === '2-4') {
                this.onContinue_Module24();
            } else if (this.currentModule === '2-6') {
                this.onContinue_Module26();
            } else if (this.currentModule === '2-7') {
                this.onContinue_Module27();
            } else if (this.currentModule === '3-2') {
                this.onContinue_Module32();
            } else if (this.currentModule === '3-3') {
                this.onContinue_Module33();
            } else if (this.currentModule === '3-5') {
                this.onContinue_Module35();
            } else if (this.currentModule === '3-7') {
                this.onContinue_Module37();
            } else if (this.currentModule === '4-2') {
                this.onContinue_Module42();
            } else if (this.currentModule === '4-4') {
                this.onContinue_Module44();
            } else if (this.currentModule === '4-6') {
                this.onContinue_Module46();
            } else if (this.currentModule === '4-7') {
                this.onContinue_Module47();
            } else if (this.currentModule === '5-2') {
                this.onContinue_Module52();
            } else if (this.currentModule === '5-4') {
                this.onContinue_Module54();
            } else if (this.currentModule === '5-6') {
                this.onContinue_Module56();
            } else if (this.currentModule === '5-7') {
                this.onContinue_Module57();
            } else if (this.currentModule === '6-2') {
                this.onContinue_Module62();
            } else if (this.currentModule === '6-4') {
                this.onContinue_Module64();
            } else if (this.currentModule === '6-6') {
                this.onContinue_Module66();
            } else if (this.currentModule === '6-7') {
                this.onContinue_Module67();
            } else if (repeatedMeditationModuleIds.has(this.currentModule)) {
                this.onContinue_Module23();
            } else if (this.currentModule === '1-5') {
                this.onContinue_Module15();
            } else if (this.currentModule === '1-4' || this.currentModule === '1-6') {
                this.onContinue_Module14Or16();
            } else {
                this.onContinue_Module11();
            }
        } finally {
            endSequentialRender(this.chatMessages);
            this.isContinuing = false;
        }
    }

    enableInputForModule(chatMessages) {
        queueUiMutation(chatMessages, () => {
            this.inputArea.classList.remove('disabled');
            this.userInput.disabled = false;
            this.userInput.parentElement.querySelector('button').disabled = false;
            this.userInput.focus();
        }, true);
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    handleUserMessage(text) {
        if (!text.trim()) return;

        appendUserMessage(this.chatMessages, text);
        beginSequentialRender(this.chatMessages);
        try {
            if (this.currentModule === '1-1') {
                this.handleModule11UserMessage(text);
                return;
            }
            if (this.currentModule === '1-3') {
                this.handleModule13DocxUserMessage(text);
                return;
            }
            if (this.currentModule === '1-7') {
                this.handleModule17DocxUserMessage(text);
                return;
            }
            if (this.currentModule === '2-2') {
                this.handleModule22UserMessage(text);
                return;
            }
            if (this.currentModule === '2-4') {
                this.handleModule24UserMessage(text);
                return;
            }
            if (this.currentModule === '2-7') {
                this.handleModule27UserMessage(text);
                return;
            }
            if (this.currentModule === '3-2') {
                this.handleModule32UserMessage(text);
                return;
            }
            if (this.currentModule === '4-2') {
                this.handleModule42UserMessage(text);
                return;
            }
            if (this.currentModule === '4-4') {
                this.handleModule44UserMessage(text);
                return;
            }
            if (this.currentModule === '4-6') {
                this.handleModule46UserMessage(text);
                return;
            }
            if (this.currentModule === '5-4') {
                this.handleModule54UserMessage(text);
                return;
            }
            if (this.currentModule === '6-2') {
                this.handleModule62UserMessage(text);
                return;
            }
            if (this.currentModule === '6-4') {
                this.handleModule64UserMessage(text);
                return;
            }
            if (this.currentModule === '6-6') {
                this.handleModule66UserMessage(text);
                return;
            }
            if (this.currentModule === '6-7') {
                this.handleModule67UserMessage(text);
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
            }
        } finally {
            endSequentialRender(this.chatMessages);
        }
    }
}

Object.assign(
    DialogueManager.prototype,
    module11Handlers,
    module12Handlers,
    module13Handlers,
    module14And16Handlers,
    module15Handlers,
    module17Handlers,
    module21Handlers,
    module22Handlers,
    module23Handlers,
    module24Handlers,
    module26Handlers,
    module27Handlers,
    module32Handlers,
    module33Handlers,
    module35Handlers,
    module37Handlers,
    module42Handlers,
    module44Handlers,
    module46Handlers,
    module47Handlers,
    module52Handlers,
    module54Handlers,
    module56Handlers,
    module57Handlers,
    module62Handlers,
    module64Handlers,
    module66Handlers,
    module67Handlers
);

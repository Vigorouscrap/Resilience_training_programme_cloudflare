import {
    appendAiMessage,
    appendUserMessage,
    appendButtonGroup,
    removeContinueButton,
    disableInput
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

export class DialogueManager {
    constructor(chatMessages, inputArea, userInput) {
        this.chatMessages = chatMessages;
        this.inputArea = inputArea;
        this.userInput = userInput;
        this.step = -1;
        this.currentModule = null;
        this.dialogueSessionId = 0;
        this.isContinuing = false;
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
        this.invalidateAsyncCallbacks();
    }

    resetForModule(module) {
        this.invalidateAsyncCallbacks();
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
        } else if (repeatedMeditationModuleIds.has(module)) {
            appendAiMessage(this.chatMessages, '欢迎来到今天的冥想练习。', true);
            this.step = 0;
        } else if (module === '1-5') {
            appendAiMessage(this.chatMessages, '你好，欢迎来到今天的练习。', true);
        } else if (module === '1-4' || module === '1-6') {
            appendAiMessage(this.chatMessages, '欢迎来到今日的练习！', true);
            this.step = 5;
        }
    }

    invalidateAsyncCallbacks() {
        this.dialogueSessionId += 1;
        this.chatMessages.dataset.dialogueSessionId = String(this.dialogueSessionId);
    }

    onContinue() {
        if (this.isContinuing) return;
        this.isContinuing = true;
        removeContinueButton();

        try {
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
            this.isContinuing = false;
        }
    }

    enableInputForModule(chatMessages) {
        this.inputArea.classList.remove('disabled');
        this.userInput.disabled = false;
        this.userInput.parentElement.querySelector('button').disabled = false;
        this.userInput.focus();
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

        if (this.currentModule === '1-3' && this.step === 1) {
            disableInput(this.inputArea, this.userInput);
            this.step = 1;
            this.onContinue();
        } else if (this.currentModule === '1-5' && this.step === 3) {
            disableInput(this.inputArea, this.userInput);
            this.step = 3;
            this.onContinue();
        } else if (this.currentModule === '1-1' && this.step === 6) {
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
    module37Handlers
);

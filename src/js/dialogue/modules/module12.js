import {
    appendAiMessage,
    appendHint,
    appendButtonGroup,
    appendUnderstandButton,
    appendTimedCard,
    appendSpecialCard,
    appendContinueButton,
    appendCardActionButtons,
    removeContinueButton
} from '../../ui.js';
import { stateDescriptions } from '../../data.js';
import { appendSpeechReplayCard } from './module5Shared.js';

const module12MeditationAudioPath = encodeURI('audio/冥想呼吸.mp3');
const module12MeditationCardHtml = `
    <p class="module5-media-title">【冥想呼吸】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

export const module12Handlers = {
    onContinue_Module12() {
        if (this.step === -1) {
            appendAiMessage(this.chatMessages, '你可能会想：\'心\'还有住处吗？', true);
            this.step = 0;
        } else if (this.step === 0) {
            appendAiMessage(this.chatMessages, '是的。我们的生命不仅仅是靠食物、水和空气这些物质而活，还依靠感官感受、意志和自我感而维持和延续。后三者，心都参与其中。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '心一直都左右着我们的动机与行为，只是我们习惯留意外部而没有察觉。心会住在哪里?', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendHint(this.chatMessages, '下面举例了心的几个住处，尝试点击来看看分别代表什么意思吧！');
            const allStates = ['觉知', '贪欲', '愤怒', '昏沉'];
            appendButtonGroup(this.chatMessages, allStates, (stateName, btn) => this.onStateButtonClick(stateName, btn));
            this.module12State.phase = 'cards';
            this.step = 3;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '因此接下来的练习，就是帮助我们学习如何让心更常住在\'觉知\'和\'祥和\'中。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '请注意这不是一次性的改变，而是像锻炼肌肉一样，每次练习，都在强化这种能力。', false);
            appendUnderstandButton(this.chatMessages, () => {
                const card1Content = '这个练习名为冥想呼吸。我们一生之中都在不断进行呼吸，而冥想呼吸的最终目的不是放松，而是像一个锚一样，当思绪被带走时，它能帮助我们一次次回到当下，意识到：我在这里，我在呼吸，我是那个注意到这一切的人。';
                appendTimedCard(this.chatMessages, card1Content, 30);
                this.step = 6;
            });
        } else if (this.step === 6) {
            const card2Content = '在练习时，觉察自己每一次呼气与吸气，通过这样的练习：<br><br>我们会感到自己持续的觉察力会变强，对当下的事情更加清楚；心也会更容易安静下来，就像给胡思乱想装了"刹车片"，能让纷扰的念头快速停止。从呼吸的变化中我们还会直接体会到，一切都在变化，没有什么是固定不变的。有了这种看透变化的智慧，就自然懂得放下，活得更轻松。';
            appendTimedCard(this.chatMessages, card2Content, 30);
            this.step = 7;
        } else if (this.step >= 7) {
            this.continueBreathingPractice();
        }
    },

    // 模块1-3对话流程

    continueBreathingPractice() {
        if (this.step === 7) {
            appendAiMessage(this.chatMessages, '现在，我们就来做这个练习。请跟随指令一步步进行。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendSpeechReplayCard(
                this.chatMessages,
                module12MeditationCardHtml,
                '',
                {
                    replayLabel: '再次播放',
                    audioPath: module12MeditationAudioPath,
                    audioMimeType: 'audio/mpeg',
                    disableSpeechFallback: true,
                    onEnded: () => {
                        this.step = 17;
                        this.continueBreathingPractice();
                    }
                }
            );
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '刚才练习的这几分钟，你的心住在哪里？也许它大部分时间都住在了‘观察呼吸’这件事上。也许它偶尔溜到了其他念头里，然后被你带了回来。这就是选择心的住处的练习。不是强迫心永远停留在某个地方，而是当它离开时，我们有能力邀请它回来。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '你刚才可能体验到：积极的感觉和呼吸一样，会自然出现，也会自然离开。我们不用刻意追求或留住它们。无论是开心还是平静，都是当下的美好。当我们能够觉察到这些来来去去，我们就有了更多的自由，即不被好的感觉‘绑住’，也不被不好的感觉‘困住’。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '今天的练习就到这里，你做得很好。每一次你把注意力带回呼吸，你都在为自己的心选择了一个更清醒、更自由的住处。', true);
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '冥想呼吸不是一种呼吸的训练，而是一种持续觉察的训练，一种让内心停下来的训练。内心若多一分停歇，可为自己的心灵带来多一分空间，多一分清净。这种练习能为内心带来耐性、专心、宁静、柔和、知足、减少情绪冲动等多种健康的心理素质，进一步更能为人带来超越忧、悲、苦、恼的智慧。而这种能力会随着练习越来越自然。未来几周里，我们会多次进行这种冥想练习。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '感谢你今天的时间。祝你拥有平静而觉察的一天。', false);
            this.step = 22;
        }
    },


    onStateButtonClick(stateName, btn) {
        this.module12State.visitedButtons.add(stateName);
        removeContinueButton();

        const buttonGroups = this.chatMessages.querySelectorAll('.button-group');
        buttonGroups.forEach(g => g.remove());

        const cardContent = stateDescriptions[stateName] || '';
        appendSpecialCard(this.chatMessages, cardContent);

        const allStates = ['觉知', '贪欲', '愤怒', '昏沉'];
        const allVisited = allStates.every(s => this.module12State.visitedButtons.has(s));

        if (allVisited) {
            appendCardActionButtons(
                this.chatMessages,
                true,
                () => this.onCardBackClick(),
                () => this.onModule12Complete()
            );
        } else {
            appendCardActionButtons(
                this.chatMessages,
                false,
                () => this.onCardBackClick()
            );
        }
    },

    // 卡片返回按钮
    onCardBackClick() {
        const cards = this.chatMessages.querySelectorAll('.special-card');
        if (cards.length > 0) cards[cards.length - 1].remove();
        const actionBtns = this.chatMessages.querySelectorAll('.card-action-buttons');
        if (actionBtns.length > 0) actionBtns[actionBtns.length - 1].remove();

        const allStates = ['觉知', '贪欲', '愤怒', '昏沉'];
        appendButtonGroup(this.chatMessages, allStates, (stateName, btn) => this.onStateButtonClick(stateName, btn));
    },

    // 模块1-2完成处理
    onModule12Complete() {
        const cards = this.chatMessages.querySelectorAll('.special-card');
        if (cards.length > 0) cards[cards.length - 1].remove();
        const actionBtns = this.chatMessages.querySelectorAll('.card-action-buttons');
        if (actionBtns.length > 0) actionBtns[actionBtns.length - 1].remove();

        appendAiMessage(this.chatMessages, '心的不同住处决定了我们感受世界的方式，面对眼前的状况、情景而有不同的反应，可能聚焦在家庭，又可能是工作岗位；有时态度悲观，有时乐观；有时很认真，有时却很随和。', true);
        this.step = 4;
    }

};

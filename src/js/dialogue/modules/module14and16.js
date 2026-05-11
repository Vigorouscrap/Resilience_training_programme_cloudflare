import {
    appendAiMessage,
    appendUnderstandButton,
    appendTimedCard
} from '../../ui.js';

export const module14And16Handlers = {
    onContinue_Module14Or16() {
        if (this.step === 5) {
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
    }

};
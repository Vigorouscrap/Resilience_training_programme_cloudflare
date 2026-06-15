import {
    appendAiMessage,
    appendButtonGroup,
    appendSpecialCard,
    appendContinueButton
} from '../../ui.js';

const module21MeditationAudioPath = encodeURI('audio/冥想呼吸.mp3');
const module21MeditationCardHtml = `
    <p class="module5-media-title">【冥想呼吸】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

const drowsinessMethods = [
    '1 睁开眼：轻轻睁开眼睛，视线落在前方，保持冥想，等昏沉消散后再闭上。',
    '2 调整身体：慢慢挺直一下腰背，提起精神，连续做几个深长而缓慢的呼吸，然后继续冥想练习。',
    '3 观察它：干脆就把“昏沉感”当成你注意的对象。去好奇地感受：这种困意是什么样的？它是怎样到来的？它是来了又走，还是一直在？它是由于身体累了，还是内心松懈了？或者观察哪种方法能有效驱除自己的昏沉。',
    '4 换个姿势：站起来，或者慢慢走一走，等昏沉消散后再坐下。',
    '5 换个时间：如果总是在晚上睡前练习时犯困，不妨试试把练习改到清晨睡醒后。',
    '6 练习前微动：在冥想练习开始前，做几分钟非常轻柔的拉伸或瑜伽动作。'
];

const agitationMethods = [
    '1 换个关注点：暂时放下当前的练习方法，换一种更简单的来专注，比如从观察呼吸换成倾听声音。',
    '2 不设限地练习：不给自己设定“必须专注在某个点上”的要求，只是轻松地觉察此刻内心和身体的所有变化。',
    '3 放松姿势和心态：采用最舒服自然的坐姿，内心也不要去“努力”或“刻意”，就像休息一样轻松。',
    '4 放下所有期待：用“放下”的态度来练习。不期待自己达到什么状态，不和上次好的体验比较，只是单纯地坐下、觉察。',
    '5 允许走神的发生并回归：承认“我现在就是静不下来”，然后只是温和地看着这份浮躁的心绪，不去批评它。在准备好的时候，轻轻回到呼吸。',
    '6 睁开眼练习：和对付昏沉一样，睁开眼睛，视线低垂，可以帮助心神安定。',
    '7 数数呼吸：在呼吸时心里默数。呼气时数“1”，再呼气时数“2”，一直数到“10”，然后从头开始。如果中途数忘了，也没关系，从“1”重新开始就好。等心平静下来后，就可以不用数了，只是单纯感受呼吸。'
];

export const module21Handlers = {
    handleModule21InitialAnswer(answer) {
        const currentBtnGroup = this.chatMessages.querySelector('.button-group');
        if (currentBtnGroup) currentBtnGroup.remove();

        this.module21State.initialAnswer = answer;

        const responseText = answer === '有'
            ? '有这些感觉是非常正常的。对于刚接触冥想的人，甚至是已经练习很久的人，都可能会遇到这两种常见状态。别担心，有很多方法可以尽可能减少这种情况。接下来我们就一起来看看如何调整和应对。'
            : '很不错，这说明你目前的专注度和身心状态都比较适合冥想练习。不过，未来在练习中如果偶尔遇到昏昏欲睡或内心浮躁的情况，也是很自然的。接下来我们一起看看，万一遇到这些情况，有哪些方法可以帮助我们更好地调整和应对。';

        appendAiMessage(this.chatMessages, responseText, true);
        this.step = 1;
    },

    onContinue_Module21() {
        if (this.step === 1) {
            appendSpecialCard(this.chatMessages, '<p><strong>关于昏沉</strong></p>');
            appendAiMessage(this.chatMessages, '冥想练习中常遇到的一个现象为昏沉。它是指当身心沉淀平和下来的时候，内心会感到昏昏欲睡，少了那份冥想时应有的觉知与清明的心。昏沉若再重一些时，甚至会睡着。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '对抗昏沉有以下方法：', false);
            this.module21State.drowsinessMethodIndex = 0;
            this.showModule21NextDrowsinessMethod();
            this.step = 3;
        } else if (this.step === 3) {
            this.showModule21NextDrowsinessMethod();
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '对抗掉举有以下方法：', false);
            this.module21State.agitationMethodIndex = 0;
            this.showModule21NextAgitationMethod();
            this.step = 6;
        } else if (this.step === 6) {
            this.showModule21NextAgitationMethod();
        }
    },

    showModule21NextDrowsinessMethod() {
        if (this.module21State.drowsinessMethodIndex < drowsinessMethods.length) {
            appendSpecialCard(
                this.chatMessages,
                `<p>${this.escapeHtml(drowsinessMethods[this.module21State.drowsinessMethodIndex])}</p>`
            );
            this.module21State.drowsinessMethodIndex += 1;
            appendContinueButton(this.chatMessages, 10);
            return;
        }

        appendButtonGroup(this.chatMessages, ['已全部了解'], () => {
            const currentBtnGroup = this.chatMessages.querySelector('.button-group');
            if (currentBtnGroup) currentBtnGroup.remove();
            appendSpecialCard(this.chatMessages, '<p><strong>关于掉举</strong></p>');
            appendAiMessage(this.chatMessages, '冥想时内心躁动不安、静不下来的现象，称作掉举。它与昏沉相对。掉举使练习者的内心不断向外驰散，不易专注。掉举若再重一些时，内心甚至会生起烦躁，没有耐性再练习下去。', true);
            this.step = 5;
        });
        this.step = 4;
    },

    showModule21NextAgitationMethod() {
        if (this.module21State.agitationMethodIndex < agitationMethods.length) {
            appendSpecialCard(
                this.chatMessages,
                `<p>${this.escapeHtml(agitationMethods[this.module21State.agitationMethodIndex])}</p>`
            );
            this.module21State.agitationMethodIndex += 1;
            appendContinueButton(this.chatMessages, 10);
            return;
        }

        appendButtonGroup(this.chatMessages, ['已全部了解'], () => {
            const currentBtnGroup = this.chatMessages.querySelector('.button-group');
            if (currentBtnGroup) currentBtnGroup.remove();
            appendAiMessage(this.chatMessages, '接下来，我们就准备开始今天的冥想练习。如果练习中遇到昏沉和掉举，请尝试使用刚刚提到的方法。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                const readyGroup = this.chatMessages.querySelector('.button-group');
                if (readyGroup) readyGroup.remove();
                this.startWeek2TimedSequence(this.getModule21MeditationSequence());
                this.step = 8;
            });
            this.step = 7;
        });
    },

    getModule21MeditationSequence() {
        return [
            this.createAudioCardSequenceItem(module21MeditationCardHtml, module21MeditationAudioPath),
            this.createTimedSequenceItem('刚才练习的这几分钟，你是否有意识地使用了我们提到的方法来对抗昏沉和掉举呢？'),
            this.createTimedSequenceItem('如果感到不熟练和困难也没有关系，未来几周里我们还会多次进行冥想练习，你可以尝试每次使用不同的方法，直到找到最合适自己的有助冥想的方式。'),
            this.createTimedSequenceItem('今天的练习就到这里，你做得很好。每一次冥想练习中，我们都要尝试只观察、不评判、不联想。感谢你今天的时间。祝你拥有平静而觉察的一天。')
        ];
    }
};

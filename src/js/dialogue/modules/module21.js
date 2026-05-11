import {
    appendAiMessage,
    appendButtonGroup,
    appendSpecialCard,
    appendContinueButton
} from '../../ui.js';

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
            appendContinueButton(this.chatMessages, 5);
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
            appendContinueButton(this.chatMessages, 5);
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
            this.createTimedSequenceItem('首先，请采取一个舒适的固定姿势：无论盘腿、坐在椅子上、站立甚至躺卧，务求姿势能够舒服、持久，腰身能够轻松、自然。双手可以自然放在膝盖上，或者放在身体两侧。'),
            this.createTimedSequenceItem('如果你身边有其他电子设备或可能打扰自己的物品，可以暂时将它们放在一边。接下来几分钟，是全然属于你自己的时间。'),
            this.createTimedSequenceItem('现在，如果你愿意，可以慢慢闭上眼睛。如果不习惯闭眼，也可以轻轻看着前方的地面。让身体自然地呼吸，心只是跟随自己的呼吸、觉察自己的呼吸，感受‘呼吸正在发生’这件事。当呼气的时候知道自己是在呼气，当吸气的时候知道自己是在吸气；当气息长的时候知道是气息长，当气息短的时候知道是气息短；当呼吸的感觉明显的时候知道呼吸的感觉是明显的，当呼吸的感觉不明显的时候知道呼吸的感觉是不明显的。'),
            this.createTimedSequenceItem('也可以留意空气进入鼻子时的感觉：鼻尖有没有一丝清凉？呼出空气时，嘴唇周围有没有暖暖的气流？如果暂时感受不到这些细节，也没关系。就只是知道‘我在吸气，我在呼气’，这就是很好的开始。'),
            this.createTimedSequenceItem('随着我们继续观察呼吸，可能会有各种体验出现。有时你会感到平静、放松，甚至有一些愉快的念头或美好的画面浮现。这些都很珍贵，但不用紧紧抓住这些感觉。就像看着窗外飞过的小鸟，看到时会开心，飞走了也不用失落。呼吸一直在，我们的注意力只是跟着它来来去去。'),
            this.createTimedSequenceItem('有时注意力会跑到积极的念头上，轻轻把它拉回呼吸就好，不用觉得‘没抓住美好的感觉真可惜’。若注意力再次、再三跑到别处时，就再次、再三地觉察并柔和地把它带回呼吸之上即可。有时呼吸变得明显，有时又不那么明显；有时呼吸快，有时呼吸慢。这些都是正常的。我们只是一个观察者，观察这一切的自然变化。'),
            { text: '呼吸来来去去，感觉来来去去，我们只是观察……注意力飘走了，就温柔地把它带回来……不用评判，只是觉察……', delayMs: 40000, repeat: 5 },
            this.createTimedSequenceItem('现在我们慢慢做3次深呼吸。第一次吸气，感受空气充满胸腔，呼气，让身体再放松一点；第二次吸气，感受腹部的起伏，呼气，让肩膀再下沉一点；第三次吸气，感受全身的轻松，再慢慢呼气。'),
            this.createTimedSequenceItem('先慢慢活动一下手指和脚趾，感受血液在指尖、脚尖流动的感觉；再轻轻转动一下脖子，避免突然用力；最后慢慢睁开眼睛，先看看自己的双手，再看看身边的环境，让注意力一点点回到现实中。'),
            this.createTimedSequenceItem('刚才练习的这几分钟，你是否有意识地使用了我们提到的方法来对抗昏沉和掉举呢？'),
            this.createTimedSequenceItem('如果感到不熟练和困难也没有关系，未来几周里我们还会多次进行冥想练习，你可以尝试每次使用不同的方法，直到找到最合适自己的有助冥想的方式。'),
            this.createTimedSequenceItem('今天的练习就到这里，你做得很好。每一次冥想练习中，我们都要尝试只观察、不评判、不联想。感谢你今天的时间。祝你拥有平静而觉察的一天。')
        ];
    }
};

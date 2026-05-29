import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton
} from '../../ui.js';

const module47AllianceCardHtml = `
    <p><strong>想象一下，当遇到压力或遭遇挫折后，强烈的情绪和想法袭来：</strong></p>
    <p><strong>认知解离，</strong>就像是拉开距离，看清想法是什么。回答的是：“这个在我脑海里大声嚷嚷的东西，究竟是什么？是一个事实，还是一个被情绪放大了的想法故事？”</p>
    <p><strong>接纳技术，</strong>则是在看清之后允许它的存在，不与它对抗。回答的是：“好吧，我看到了这个令人不舒服的想法/情绪，我允许你在这里，但我不需要被你控制，我可以带着你继续生活。”</p>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

export const module47Handlers = {
    onContinue_Module47() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '过去几天，除了冥想练习，我们还重点学习了认知解离及其实现工具（想法标签化），将学到的技术尽可能应用到我们的日常生活中。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们不做新的练习，而是一起看看这段旅程带给了我们什么。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：冥想呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短的正念呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.startModule47MeditationSequence();
            });
            this.step = 3;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的冥想呼吸相比，这一次的冥想呼吸是否感觉更自然一些、更容易进入状态？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module47State.breathAnswers.push(answer);
                this.step = 5;
                this.onContinue_Module47();
            });
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，注意力是否依然容易飘走？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module47State.breathAnswers.push(answer);
                this.step = 6;
                this.onContinue_Module47();
            });
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，呼吸的节奏是否有所不同？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module47State.breathAnswers.push(answer);
                this.step = 7;
                this.onContinue_Module47();
            });
        } else if (this.step === 7) {
            const yesCount = this.module47State.breathAnswers.filter(answer => answer === '是').length;
            appendAiMessage(this.chatMessages, yesCount >= 2 ? '你与呼吸的联结更自然了，这意味着呼吸本身已成为一个稳定的觉察对象，你可以更容易通过呼吸回到当下。' : '注意力跑走是正常的，能一次次把它带回来，本身就是很重要的练习。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步：认知解离回顾</strong></p>');
            appendAiMessage(this.chatMessages, '现在我们再次回顾一下认知解离。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '通过认知解离，我们学习了如何与头脑中那些常常让我们痛苦的想法建立一种更健康的关系。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '我们首先体验了 “站台观察法” ，像旁观者一样看着想法如列车般驶过，而不必上车。接着，我们掌握了实用的“标签化” 工具 ，学会了给想法贴上描述性的标签，比如“这是一个灾难化的预测”或“这是一个自我批判的故事”。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '现在，让我们带着更深刻的理解，再一次跟随音频体验一次站台冥想。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '请保持舒适坐姿，双手自然放置，全程闭眼专注聆听，跟着音频引导进行想象，过程中不用刻意控制想法，顺其自然即可。当你准备好时，请点击继续按钮，然后闭上眼睛等待音频开始。', false);
            appendContinueButton(this.chatMessages);
            this.step = 12;
        } else if (this.step === 12) {
            const trainMeditationHtml = [
                '（播放插入的音频：音频待定）以温和舒缓的语调开场，“现在请你想象自己站在一个安静的火车站台，站台很干净，周围没有拥挤的人群，只有微风轻轻吹过。接下来，你慢慢想到了一些曾经出现过的想法——可能是“今天要不要出去逛逛”这样的日常想法，可能是“他可能讨厌我”这样的由一个小挫折引发的焦虑想法，也可能是“必须每天保持好心情”这样的规则想法，然后你看到一列列火车从远方向站台这里驶来，每列火车上都写着一个你刚刚脑海中想到的想法。”',
                '音频中段加入细节引导：当火车靠近时，你站在原地，做一个平静的观察者。你可以清晰看到车身上的文字，看着火车慢慢从站台一端驶入，再从另一端驶出，消失在视野里。如果某列火车停留时间较长，没关系，继续保持观察，它总会慢慢离开。',
                '音频尾声进行过渡：现在，最后一列火车也已经驶离站台，你依然站在安静的站台上，感受此刻内心的状态，慢慢将注意力拉回到自己的呼吸上。”',
                '冥想收尾：结束后，给予30秒缓冲时间，轻声引导：现在请慢慢睁开眼睛，花10秒钟看看周围的环境，活动一下手指，让自己逐渐回到现场。'
            ].map(text => `<p>${text}</p>`).join('');

            this.startWeek2TimedSequence(
                [this.createTimedSequenceItem(trainMeditationHtml, 330000)],
                () => {
                    this.step = 13;
                    this.onContinue_Module47();
                }
            );
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '相信这一次练习你有了更深刻的体会，也更能与想法保持距离。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '这些练习的核心目的只有一个：帮助我们看清“想法只是想法，而非事实”。当“我完了”或“我不够好”的念头升起时，我们不再被它们瞬间卷走，而是能后退一步，认出它们：“哦，你又来了，一个熟悉的老故事。”', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '你可能会问，这和上周学习的接纳技术有什么关系呢？', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '它们不是孤立的，而是一对默契的盟友，共同为我们构建心理弹性。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendSpecialCard(this.chatMessages, module47AllianceCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '正是在这种“看清”与“允许”创造出的心理空间里，我们才能更冷静、更自主地决定：那么，基于我真正的价值和目标，现在我可以做什么？', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '在过去几天的练习，你是否曾有意识地运用过这种“看清-允许”（“解离和接纳”）的方法？也许是在一次小小的自我批判升起时，你给它贴了个标签；也许是在焦虑中，你选择了先观察呼吸，而非与之纠缠。', false);
            appendButtonGroup(this.chatMessages, ['A 有运用过', 'B 还没有'], (choice) => {
                removeCurrentButtonGroup(this.chatMessages);
                if (choice === 'A 有运用过') {
                    appendAiMessage(this.chatMessages, '太好了，你已经迈出了关键的一步，把方法用在了真实的生活里。希望你后续也可以坚持将它运用在不同的情景中，每一次主动运用，都不是偶然，而是一次对大脑的训练。', true);
                } else {
                    appendAiMessage(this.chatMessages, '没关系。很多时候，我们只有在情绪过去之后才回过头来意识到“刚才应该用一下这个方法”。这不叫失败，这叫觉察的萌芽。下一次，当一个小烦恼或压力事件出现时，你可以再次尝试，慢慢地会熟练应用。', true);
                }

                this.step = 20;
            });
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '无论体验深浅，每一次认知解离和接纳，都是在重塑自己与思维的关系，都是在为心理弹性添砖加瓦。心理弹性的存在不是让我们在压力面前从不“跌倒”，而是跌倒后，知道如何更快、更稳地站起来。而认知解离与接纳，正是关键的助力。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '本次回顾到此结束。我们明天将开启第五阶段的练习，期待与你再次相见。', false);
            this.step = 22;
        }
    },

    startModule47MeditationSequence() {
        this.startWeek2TimedSequence(
            [
                this.createTimedSequenceItem('首先，请采取一个舒适的固定姿势：无论盘腿、坐在椅子上、站立甚至躺卧，务求姿势能够舒服、持久，腰身能够轻松、自然。双手可以自然放在膝盖上，或者放在身体两侧。'),
                this.createTimedSequenceItem('如果你身边有其他电子设备或可能打扰自己的物品，可以暂时将它们放在一边。接下来几分钟，是全然属于你自己的时间。'),
                this.createTimedSequenceItem('现在，如果你愿意，可以慢慢闭上眼睛。如果不习惯闭眼，也可以轻轻看着前方的地面。让身体自然地呼吸，心只是跟随自己的呼吸、觉察自己的呼吸，感受‘呼吸正在发生’这件事。当呼气的时候知道自己是在呼气，当吸气的时候知道自己是在吸气；当气息长的时候知道是气息长，当气息短的时候知道是气息短；当呼吸的感觉明显的时候知道呼吸的感觉是明显的，当呼吸的感觉不明显的时候知道呼吸的感觉是不明显的。'),
                this.createTimedSequenceItem('也可以留意空气进入鼻子时的感觉：鼻尖有没有一丝清凉？呼出空气时，嘴唇周围有没有暖暖的气流？如果暂时感受不到这些细节，也没关系。就只是知道‘我在吸气，我在呼气’，这就是很好的开始。'),
                this.createTimedSequenceItem('随着我们继续观察呼吸，可能会有各种体验出现。有时你会感到平静、放松，甚至有一些愉快的念头或美好的画面浮现。这些都很珍贵，但不用紧紧抓住这些感觉。就像看着窗外飞过的小鸟，看到时会开心，飞走了也不用失落。呼吸一直在，我们的注意力只是跟着它来来去去。'),
                this.createTimedSequenceItem('有时注意力会跑到积极的念头上，轻轻把它拉回呼吸就好，不用觉得‘没抓住美好的感觉真可惜’。若注意力再次、再三跑到别处时，就再次、再三地觉察并柔和地把它带回呼吸之上即可。有时呼吸变得明显，有时又不那么明显；有时呼吸快，有时呼吸慢。这些都是正常的。我们只是一个观察者，观察这一切的自然变化。'),
                { text: '呼吸来来去去，感觉来来去去，我们只是观察……注意力飘走了，就温柔地把它带回来……不用评判，只是觉察……', delayMs: 40000, repeat: 5 },
                this.createTimedSequenceItem('现在我们慢慢做3次深呼吸。第一次吸气，感受空气充满胸腔，呼气，让身体再放松一点；第二次吸气，感受腹部的起伏，呼气，让肩膀再下沉一点；第三次吸气，感受全身的轻松，再慢慢呼气。'),
                this.createTimedSequenceItem('先慢慢活动一下手指和脚趾，感受血液在指尖、脚尖流动的感觉；再轻轻转动一下脖子，避免突然用力；最后慢慢睁开眼睛，先看看自己的双手，再看看身边的环境，让注意力一点点回到现实中。')
            ],
            () => {
                this.step = 4;
                this.onContinue_Module47();
            }
        );
    }
};

import {
    appendAiMessage,
    appendButtonGroup,
    appendSpecialCard,
    appendAiMessageWithTimer,
    appendContinueButton
} from '../../ui.js';

export const repeatedMeditationModuleIds = new Set([
    '2-3',
    '2-5',
    '3-1',
    '3-4',
    '3-6',
    '4-1',
    '4-3',
    '4-5',
    '5-1',
    '5-3',
    '5-5',
    '6-1',
    '6-3',
    '6-5'
]);

export const module23Handlers = {
    onContinue_Module23() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '每次的冥想练习内容都是相同的。这个设计并非为了重复，而是为了帮助我们观察自己的身心状态如何自然地流动与变化。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '因此，请尝试放下“这次应该做得更好”或“上次练习感觉做得更好”的评判。每一次冥想练习都是全新的，我们的任务只是如实地觉察当下的体验。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '冥想过程中，可能会遇到昏沉（感觉困倦、模糊）或掉举（思绪纷飞、躁动、注意力四处跳跃）。这些都是正常的心境波动，并不代表练习失败。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '但当你觉察到昏沉或掉举出现时，请尽可能调用我们之前提到的一些方法来应对。', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>应对昏沉：</strong>睁开眼/调整身体/观察昏沉感/换个姿势/换个时间/练习前微动</p><p><strong>应对掉举：</strong>换个关注点/不设限地练习/放松姿势和心态/放下所有期待/允许走神的发生并回归/睁开眼练习/数数呼吸</p>'
            );
            appendAiMessage(this.chatMessages, '现在，我们就开始冥想练习。请跟随指令一步步进行。', false);
            appendButtonGroup(this.chatMessages, ['开始'], () => {
                const currentBtnGroup = this.chatMessages.querySelector('.button-group');
                if (currentBtnGroup) currentBtnGroup.remove();
                this.startWeek2TimedSequence(this.getModule23MeditationSequence());
                this.step = 4;
            });
        }
    },

    createTimedSequenceItem(text, delayMs = null) {
        return {
            text,
            delayMs: delayMs ?? this.getNarrationDuration(text)
        };
    },

    getNarrationDuration(text) {
        const plainText = String(text).replace(/<[^>]+>/g, '');
        return Math.max(5000, Math.min(18000, plainText.length * 220));
    },

    startWeek2TimedSequence(sequence, onComplete = null) {
        const runItem = (index) => {
            if (index >= sequence.length) {
                if (onComplete) onComplete();
                return;
            }

            const item = sequence[index];
            const repeat = item.repeat || 1;

            const runRepeat = (count) => {
                appendAiMessageWithTimer(this.chatMessages, item.text, item.delayMs, () => {
                    if (count > 1) {
                        runRepeat(count - 1);
                    } else if (item.waitForContinueAfter) {
                        this.pendingContinueAction = () => runItem(index + 1);
                        appendContinueButton(this.chatMessages);
                    } else {
                        runItem(index + 1);
                    }
                });
            };

            runRepeat(repeat);
        };

        runItem(0);
    },

    getModule23MeditationSequence() {
        const sequence = [
            this.createTimedSequenceItem('首先，请采取一个舒适的固定姿势：无论盘腿、坐在椅子上、站立甚至躺卧，务求姿势能够舒服、持久，腰身能够轻松、自然。双手可以自然放在膝盖上，或者放在身体两侧。'),
            this.createTimedSequenceItem('如果你身边有其他电子设备或可能打扰自己的物品，可以暂时将它们放在一边。接下来几分钟，是全然属于你自己的时间。'),
            this.createTimedSequenceItem('现在，如果你愿意，可以慢慢闭上眼睛。如果不习惯闭眼，也可以轻轻看着前方的地面。让身体自然地呼吸，心只是跟随自己的呼吸、觉察自己的呼吸，感受‘呼吸正在发生’这件事。当呼气的时候知道自己是在呼气，当吸气的时候知道自己是在吸气；当气息长的时候知道是气息长，当气息短的时候知道是气息短；当呼吸的感觉明显的时候知道呼吸的感觉是明显的，当呼吸的感觉不明显的时候知道呼吸的感觉是不明显的。'),
            this.createTimedSequenceItem('也可以留意空气进入鼻子时的感觉：鼻尖有没有一丝清凉？呼出空气时，嘴唇周围有没有暖暖的气流？如果暂时感受不到这些细节，也没关系。就只是知道‘我在吸气，我在呼气’，这就是很好的开始。'),
            this.createTimedSequenceItem('随着我们继续观察呼吸，可能会有各种体验出现。有时你会感到平静、放松，甚至有一些愉快的念头或美好的画面浮现。这些都很珍贵，但不用紧紧抓住这些感觉。就像看着窗外飞过的小鸟，看到时会开心，飞走了也不用失落。呼吸一直在，我们的注意力只是跟着它来来去去。'),
            this.createTimedSequenceItem('有时注意力会跑到积极的念头上，轻轻把它拉回呼吸就好，不用觉得‘没抓住美好的感觉真可惜’。若注意力再次、再三跑到别处时，就再次、再三地觉察并柔和地把它带回呼吸之上即可。有时呼吸变得明显，有时又不那么明显；有时呼吸快，有时呼吸慢。这些都是正常的。我们只是一个观察者，观察这一切的自然变化。'),
            { text: '呼吸来来去去，感觉来来去去，我们只是观察……注意力飘走了，就温柔地把它带回来……不用评判，只是觉察……', delayMs: 40000, repeat: 5 },
            this.createTimedSequenceItem('现在我们慢慢做3次深呼吸。第一次吸气，感受空气充满胸腔，呼气，让身体再放松一点；第二次吸气，感受腹部的起伏，呼气，让肩膀再下沉一点；第三次吸气，感受全身的轻松，再慢慢呼气。'),
            this.createTimedSequenceItem('先慢慢活动一下手指和脚趾，感受血液在指尖、脚尖流动的感觉；再轻轻转动一下脖子，避免突然用力；最后慢慢睁开眼睛，先看看自己的双手，再看看身边的环境，让注意力一点点回到现实中。'),
            {
                ...this.createTimedSequenceItem('今天的练习就到这里。你做得很好。冥想呼吸有它独到的特色，它有效地利用呼吸反复循环的特点来培育心灵。当我们在持续知道自己的呼气和吸气时，我们实际上是在训练内心：持续安住当下的能力、减少被情绪冲动带走的惯性、创造选择和回应的自由空间。'),
                waitForContinueAfter: true
            },
            {
                ...this.createTimedSequenceItem('未来几周里，我们会多次进行这种冥想练习。每一次练习中，我们都要尝试只观察、不评判、不联想。'),
                waitForContinueAfter: true
            },
            this.createTimedSequenceItem('感谢你今天的时间。祝你拥有平静而觉察的一天。')
        ];

        if (this.currentModule === '3-1' || this.currentModule === '3-4') {
            sequence.push(
                this.createTimedSequenceItem('一个小提醒，我们这几天还需要继续进行情绪日记的记录（问卷星链接：<a href="https://v.wjx.cn/vm/tUtCiF5.aspx#">https://v.wjx.cn/vm/tUtCiF5.aspx#</a>）。每一天你可以选择在当晚（一天结束前）填写这个情绪日记，也可以选择在你遇到有情绪波动的事情时即刻开始记录。')
            );
        }

        if (this.currentModule === '4-1' || this.currentModule === '4-3') {
            sequence.push(
                this.createTimedSequenceItem('一个小提醒，我们这几天还需要继续进行自我承诺行动，每当你执行了你的接纳行动后，可以随时打开链接记录（<a href="https://v.wjx.cn/vm/YDIVxE6.aspx">https://v.wjx.cn/vm/YDIVxE6.aspx</a>）。这种记录方式还会再持续几天，相信通过一次一次的记录，我们能够更自如地应对情绪与压力。')
            );
        }

        return sequence;
    }
};

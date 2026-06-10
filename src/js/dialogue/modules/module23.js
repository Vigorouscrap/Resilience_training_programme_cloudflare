import {
    appendAiMessage,
    appendButtonGroup,
    appendSpecialCard,
    appendAiMessageWithTimer,
    appendContinueButton
} from '../../ui.js';
import { appendSpeechReplayCard } from './module5Shared.js';

const module23MeditationAudioPath = encodeURI('audio/冥想呼吸.mp3');
const module23MeditationCardHtml = `
    <p class="module5-media-title">【冥想呼吸】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

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
            appendAiMessage(this.chatMessages, '现在，我们就开始冥想练习。<b>请打开当前用于练习的设备的声音，以便播放语音引导</b>，然后跟随指令一步步进行。', false);
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

    createAudioCardSequenceItem(html, audioPath) {
        return {
            type: 'audio-card',
            html,
            audioPath
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
            if (item.type === 'audio-card') {
                appendSpeechReplayCard(
                    this.chatMessages,
                    item.html,
                    '',
                    {
                        replayLabel: '再次播放',
                        audioPath: item.audioPath,
                        audioMimeType: 'audio/mpeg',
                        disableSpeechFallback: true,
                        onEnded: () => {
                            runItem(index + 1);
                        }
                    }
                );
                return;
            }
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
            this.createAudioCardSequenceItem(module23MeditationCardHtml, module23MeditationAudioPath),
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

import {
    appendAiMessage,
    appendButtonGroup,
    appendContinueButton,
    disableInput
} from '../../ui.js';
import { appendSpeechReplayCard } from './module5Shared.js';
import { runAiHook } from '../aiHookRunner.js';

const module42TrainMeditationAudioPath = encodeURI('audio/module42&47/火车站台冥想.mp3');
const module42TrainMeditationCardHtml = `
    <p class="module5-media-title">【火车站台冥想】</p>
    <div class="module5-media-body">
        <p>请闭上眼睛，跟随音频引导进行练习。</p>
    </div>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function isEmptyLike(text) {
    const normalized = text.replace(/\s+/g, '');
    if (!normalized) return true;

    return ['没有', '没看到', '没什么', '不知道', '想不到', '不清楚'].includes(normalized);
}

function classifyModule42ObservedThoughts(text) {
    if (isEmptyLike(text)) {
        return 'empty_like';
    }

    return 'described_trains';
}

function classifyModule42ImpulseThoughts(text) {
    const normalized = String(text || '').trim();
    const compact = normalized.replace(/\s+/g, '');

    if (!compact || /不知道|不清楚|说不清|想不到|没注意|没有感觉|没什么感觉/.test(compact)) {
        return 'uncertain';
    }

    if (/没有|没|不太会|不会|没有跟着|没有冲动|没想跟着/.test(compact)) {
        return 'no_impulse';
    }

    return 'has_impulse';
}

function getModule42ObservedFallback(classification) {
    if (classification === 'empty_like') {
        return '没关系，可能第一次进行火车站台冥想还不太适应，可以想想你在听音频时，有没有某句话让你印象深刻？或者当时心里在想什么？';
    }

    return '感谢你的分享。很多人都会遇到类似的“担忧列车”，你能观察到它已经很了不起；第一次练习就能注意到这些细节，说明你的觉察力很强。';
}

function getModule42ImpulseFallback(classification) {
    if (classification === 'uncertain') {
        return '感谢你的分享。“说不清”本身也是一种真实的体验。有时候冲动很微弱，不容易捕捉。';
    }

    if (classification === 'no_impulse') {
        return '感谢你的分享。即使没有感觉到明显的冲动，这也是完全正常的。关键是你能觉察到“火车”本身。';
    }

    return '感谢你的分享。有冲动想上车是完全正常的，关键是最终选择留在站台观察。';
}

export const module42Handlers = {
    onContinue_Module42() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '今天我们的练习将从一个小活动开始。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '请先确保处于一个独立安静的空间，关闭其他电子设备的声音，以防被打扰。', false);
            appendButtonGroup(this.chatMessages, ['已确认'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 2;
                this.onContinue_Module42();
            });
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '接下来我们会播放一段5分钟的音频，请保持舒适坐姿，双手自然放置，全程闭眼专注聆听，跟着音频引导进行想象，过程中不用刻意控制想法，顺其自然即可。当你准备好时，请点击继续按钮，然后闭上眼睛等待音频开始。', false);
            appendContinueButton(this.chatMessages);
            this.step = 3;
        } else if (this.step === 3) {
            appendSpeechReplayCard(
                this.chatMessages,
                module42TrainMeditationCardHtml,
                '',
                {
                    replayLabel: '再次播放',
                    audioPath: module42TrainMeditationAudioPath,
                    audioMimeType: 'audio/mpeg',
                    disableSpeechFallback: true,
                    onEnded: () => {
                        this.step = 4;
                        this.onContinue_Module42();
                    }
                }
            );
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '刚刚的冥想中，你看到了哪些“想法火车”？比如是关于自己的，还是关于生活的？请将你的想法输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 5;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '当看到某些“火车”时，你有没有想跟着走的冲动？（即想跟着那个想法走，而不是跟着音频走）请将你的想法输入到对话框中。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 7;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '在观察过程中，你有没有发现自己经常出现的思维模式，比如总担心不好的事情发生？', true);
            const continueWrapper = this.chatMessages.querySelector('.continue-wrapper');
            if (continueWrapper) continueWrapper.remove();
            this.enableInputForModule(this.chatMessages);
            this.step = 9;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '其实很多人会看到关于生活工作学习压力或一些挫折引发的“想法火车”，也会有跟着走的冲动，而当我们试着留在站台上，会发现这些想法只是“路过”，不会一直影响我们。同时，也有人发现自己总容易想“不好的情况”，这就是我们常见的消极思维模式。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '刚刚的冥想，其实就是认知解离的一种体验。', true);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '认知解离就是将我们自己与想法分离开。简单来说，就像我们在站台上对待“想法火车”一样：不把想法当成事实，不被想法控制，只是观察它的存在。', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '比如有的人会看到“工作能力差”的想法，不会立刻觉得“我的工作能力很差，不能胜任工作”，而是知道“这只是我目前产生的一个担心的想法，不是真的发生了”，这就是认知解离。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '再比如当你遇到了一些压力事件如“没赶上飞机”从而产生了类似“后面的事情全都会受影响，什么也做不好了”的想法时，认知解离不是让我们强迫自己不去想这个想法，而是站在想法之外，告诉自己“这是一个追求完美的想法，我可以不被它困扰，按自己的节奏做就好”。', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '对我们来说，认知解离能帮我们减少压力引发的焦虑想法、减少过度积极规则的控制，不用因为“必须开心”而压抑失落，不用因为“担心”而整夜失眠，而是以更平和的心态看待自己的想法，让自己的情绪更稳定，这对我们的健康也都很有帮助。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '今天的学习就到这里，未来我们会进一步结合练习深入理解认知解离。', true);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '一个小提醒，我们这几天还需要继续进行自我承诺行动，每当你执行了你的接纳行动后，可以随时打开链接记录（<a href="https://v.wjx.cn/vm/YDIVxE6.aspx#">https://v.wjx.cn/vm/YDIVxE6.aspx#</a>）。这种记录方式还会再持续几天，相信通过一次一次的记录，我们能够更自如地应对情绪与压力。', false);
            this.step = 18;
        }
    },

    async handleModule42UserMessage(text) {
        if (this.step === 5) {
            this.module42State.observedThoughts = text;
            disableInput(this.inputArea, this.userInput);

            const classification = classifyModule42ObservedThoughts(text);
            const activeSessionId = this.dialogueSessionId;
            const response = await runAiHook({
                hookId: 'module-4-2.thought-train-reflection',
                moduleId: '4-2',
                step: 5,
                userInput: text,
                context: {
                    classification,
                    questionType: 'observed_thought_trains'
                },
                fallbackText: getModule42ObservedFallback(classification)
            });

            if (this.dialogueSessionId !== activeSessionId || this.currentModule !== '4-2') {
                return;
            }

            appendAiMessage(this.chatMessages, response.replyText, true);
            this.step = 6;
            return;
        }

        if (this.step === 7) {
            this.module42State.impulseThoughts = text;
            disableInput(this.inputArea, this.userInput);

            const classification = classifyModule42ImpulseThoughts(text);
            const activeSessionId = this.dialogueSessionId;
            const response = await runAiHook({
                hookId: 'module-4-2.boarding-impulse-reflection',
                moduleId: '4-2',
                step: 7,
                userInput: text,
                context: {
                    observedThoughts: this.module42State.observedThoughts || '',
                    classification,
                    questionType: 'boarding_impulse'
                },
                fallbackText: getModule42ImpulseFallback(classification)
            });

            if (this.dialogueSessionId !== activeSessionId || this.currentModule !== '4-2') {
                return;
            }

            appendAiMessage(this.chatMessages, response.replyText, true);
            this.step = 8;
            return;
        }

        if (this.step === 9) {
            disableInput(this.inputArea, this.userInput);
            this.step = 10;
            this.onContinue_Module42();
        }
    }
};

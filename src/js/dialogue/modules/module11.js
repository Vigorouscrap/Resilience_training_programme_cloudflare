import {
    appendAiMessage,
    appendSpecialCard,
    appendContinueButton,
    appendHint,
    disableInput
} from '../../ui.js';
import { runAiHook } from '../aiHookRunner.js';

function parseModule11Intro(text) {
    const normalizedText = String(text || '').trim();

    const nameMatch = normalizedText.match(/(?:我叫|我是|称呼我)[\s,，]*([^\s,，。]{1,8})/);
    const hometownMatch = normalizedText.match(/(?:来自|家乡是|家乡在)[\s,，]*([^，。,。]{2,16})/);
    const habitMatch = normalizedText.match(/(?:喜欢|爱好是|平时喜欢)[\s,，]*([^。，]{2,16})/);
    const qualityMatch = normalizedText.match(/(?:培养|希望拥有|希望变得更)[\s,，]*([^。，]{2,12})/);

    const extracted = {
        name: nameMatch?.[1] || normalizedText.split(/[ ,，]/)[0] || '参与者',
        hometown: hometownMatch?.[1] || '',
        habit: habitMatch?.[1] || '那个习惯',
        quality: qualityMatch?.[1] || '内在品质'
    };

    const hasHometown = Boolean(extracted.hometown);
    const hasHabit = extracted.habit !== '那个习惯';
    let classification = 'normal';

    if (/^(跳过|略过|不想说|不想回答|不太想回答|暂时不想说)/.test(normalizedText)) {
        classification = 'skip';
    } else if (normalizedText.length < 3) {
        classification = 'low_info';
    } else if (!hasHometown && !hasHabit) {
        classification = 'off_topic';
    } else if (!hasHometown || !hasHabit) {
        classification = 'partial';
    }

    return {
        ...extracted,
        classification,
        rawText: normalizedText
    };
}

export const module11Handlers = {
    onContinue_Module11() {
        if (this.step === -1) {
            appendAiMessage(this.chatMessages, '在开始任何练习之前，建立真诚的连接和清晰的意图至关重要。 所以今天的第一课，我们不学习复杂的技术，而是完成两件重要的事：', true);
            this.step = 0;
        } else if (this.step === 0) {
            appendSpecialCard(this.chatMessages, `<p><strong>a. 让我认识你，了解你的基本情况。</strong></p><p><strong>b. 让你了解这段旅程，知道我们将去向何方，以及如何安全同行。</strong></p>`);
            appendContinueButton(this.chatMessages);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '现在，让我们从一个特别的"自我探索"小活动开始。', true);
            appendContinueButton(this.chatMessages);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '我想邀请你用3句话来介绍一下自己。这就像一个简单的心灵罗盘，帮助我们定位起点。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendSpecialCard(this.chatMessages, `<p>1. 你的名字，或者你希望我如何称呼你。</p><p>2. 你的家乡。可以写出它的名字并简单描述一下这个地方。</p><p>3. 一个让你感到平静或快乐的小爱好。比如：听音乐、睡前读几页书、给植物浇水，甚至只是安静地发呆。</p>`);
            appendContinueButton(this.chatMessages);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '举个例子："我叫李娜，你可以叫我小娜。我来自广州，是一个四季温暖的地方。我喜欢傍晚散步，看天空颜色的变化。"', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '请不用追求完美或深刻，真实的感受就是最好的答案。你可以稍微思考一下，随时开始在对话框中输入你的内容。', false);
            appendHint(this.chatMessages, '请在对话框中输入你的回答');
            this.enableInputForModule(this.chatMessages);
            this.step = 6;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '感谢你的分享！通过这个简单的介绍，我已经初步了解到你的家乡和你的爱好。那么我也分享一下，作为你的引导员，我喜欢阅读，这能让我更专注，也能让我更好地陪伴和倾听每一位参与者。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '现在，我们可以进入到下一步：我想向你介绍我们将要共同经历的心理旅程。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '首先是心理弹性训练方法的概况。我们的训练结合了冥想和接纳承诺疗法的理论基础，核心理念可以用三句话来概括：', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendSpecialCard(this.chatMessages, `
                <p>• 它不是教我们如何永远快乐、消除所有负面情绪，因为那既不现实，也会让我们与真实的生命体验产生对抗。</p>
                <p>• 它的目标是，帮助我们培养一种能力，即能够与各种内在体验（包括痛苦的情绪）和平共处，同时依然可以清晰地朝着自己认为重要的方向和价值观去生活。</p>
                <p>• 这种“与体验共处，朝价值前行”的能力，能够让我们在压力面前，不仅能扛得住，更能灵活适应，并持续朝着自己的方向前进。</p>
            `);
            appendContinueButton(this.chatMessages,60);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '我们的旅程将这样展开：进行为期6周的系统训练。这6周内的每一天我们都会进行一个模块的练习，这些模块通过案例故事、沉浸式体验、日常小练习等不同方式来展开。', true);
            this.step = 12;
        } else if (this.step === 12) {
            appendSpecialCard(this.chatMessages, `
                <p><strong>• 第1周，重点学习“觉察”。</strong>初步认识并尝试看见情绪与思维。</p>
                <p><strong>• 第2、3周，学习“接纳”，</strong>像熟悉天气一样熟悉自己的情绪，像允许四季流转一样允许所有感受的存在。</p>
                <p><strong>• 第4、5周，进一步聚焦“解离”并体验“观察性自我”：</strong>学习将想法看作脑海中的字符，将情绪看作身体的天气，并看清这些体验背后你真正在乎的生活方向。</p>
                <p><strong>• 第6周，整合“价值”并练习“承诺行动”：</strong>带着全部的体验，朝着价值方向，迈出微小而坚定的步伐。</p>
            `);
            appendContinueButton(this.chatMessages,60);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '卡片展示的内容中，可能有些词你会暂时不理解，不用担心，在接下来的训练中，我们会通过具体的练习和案例，慢慢地展开每一个概念。', true);
            appendContinueButton(this.chatMessages);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '后续的每一次练习都像给内心的肌肉做一次锻炼，简单但需要你的投入。', true);
            appendContinueButton(this.chatMessages);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '任何深入的探索，都需要一个安全、信任的空间。为了守护这个属于你的成长空间，我想和你确认几条重要的心灵安全准则：', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendSpecialCard(this.chatMessages, '<p>a. <strong>保密原则</strong>：过程中我们分享的个人信息都是保密的，不对外传播。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 17;
        } else if (this.step === 17) {
            appendSpecialCard(this.chatMessages, '<p>b. <strong>不评判原则</strong>：我们不对自己的感受和想法做好坏、对错的评判。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 18;
        } else if (this.step === 18) {
            appendSpecialCard(this.chatMessages, '<p>c. <strong>自愿参与</strong>：你有权决定自己分享的深度和内容，你可以选择 ‘过’而不回答。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 19;
        } else if (this.step === 19) {
            appendSpecialCard(this.chatMessages, '<p>d. <strong>聚焦当下</strong>：我们尽量关注 ‘此时此地’的感受和体验。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 20;
        } else if (this.step === 20) {
            appendSpecialCard(this.chatMessages, '<p>e. <strong>营造环境</strong>：每次练习时请选择一个安静独立的、不被打扰的空间。</p>');
            appendContinueButton(this.chatMessages, 20);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '介绍模块就到这里了。今天，我们共同完成了三件至关重要的事：1）我们建立了初步连接，认识了独特的你；2）我们看清了旅程的目标，了解了这是一段关于培养“与体验共处、朝价值前行”能力的旅程，它科学、系统且充满关怀；3）我们筑好了护栏：确认了共同维护一个安全、不评判的探索空间。', true);
            appendContinueButton(this.chatMessages);
            this.step = 22;
        } else if (this.step === 22) {
            appendAiMessage(this.chatMessages, '你已经为这段旅程打下了最坚实的地基，那就是你愿意探索的初心，和你已经拥有的自我关怀方式（比如你的小爱好）。', true);
            this.step = 23;
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '<p>最后，送给你今天的小小练习：在今晚睡前，花一分钟回想一下你的那个小爱好，并简单地体验它一会儿。同时，在心里对自己温柔地说：<strong>“这一刻，我愿意停下来为自己做这件小事，回到让我安心的小小世界里，积攒更多面对未来的力量。”</strong></p>', true);
            this.step = 24;
        }else if (this.step === 24) {
            appendAiMessage(this.chatMessages, '<p>祝你今天拥有属于自己的平静或快乐时刻。我们明天再见。</p>', false);
            this.step = 25;
        }
    },

    async handleModule11UserMessage(text) {
        if (this.step !== 6) return;

        const parsedIntro = parseModule11Intro(text);
        this.participant.name = parsedIntro.name;
        this.participant.hometown = parsedIntro.hometown;
        this.participant.habit = parsedIntro.habit;
        this.participant.quality = parsedIntro.quality;
        this.participant.introRawText = parsedIntro.rawText;
        this.participant.introClassification = parsedIntro.classification;

        const activeSessionId = this.dialogueSessionId;
        disableInput(this.inputArea, this.userInput);

        const response = await runAiHook({
            hookId: 'module-1-1.intro-reply',
            moduleId: '1-1',
            step: 6,
            userInput: text,
            context: {
                participant: {
                    name: parsedIntro.name,
                    hometown: parsedIntro.hometown,
                    habit: parsedIntro.habit,
                    quality: parsedIntro.quality
                },
                classification: parsedIntro.classification
            },
            fallbackText: `针对习惯：“${this.participant.habit}”是一个非常棒的自我关怀方式，它能帮助我们与当下的生活建立一种舒缓的连接。针对品质：你提到了希望培养“${this.participant.quality}”，这真是一个深刻而重要的起点。这正是心理弹性的核心组成部分之一，我们的很多练习都会围绕它展开。`
        });

        if (this.dialogueSessionId !== activeSessionId || this.currentModule !== '1-1') {
            return;
        }

        appendAiMessage(this.chatMessages, response.replyText, true);
        this.step = 7;
    }
};

import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    startBottomCountdown,
    queueUiMutation,
    disableInput,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, buttonLabel, onComplete) {
    startBottomCountdown(chatMessages, seconds, readyText, () => {
        appendButtonGroup(chatMessages, [buttonLabel], () => {
            removeCurrentButtonGroup(chatMessages);
            onComplete();
        });
    }, { align: 'card' });
    return;
    queueUiMutation(chatMessages, () => {
        const cards = chatMessages.querySelectorAll('.special-card');
        const currentCard = cards[cards.length - 1];
        const sessionId = getChatSessionId(chatMessages);
        const deadline = Date.now() + (seconds * 1000);

        if (!currentCard) {
            setTimeout(() => {
                if (!isChatSessionActive(chatMessages, sessionId)) return;
                appendButtonGroup(chatMessages, [buttonLabel], () => {
                    removeCurrentButtonGroup(chatMessages);
                    onComplete();
                });
            }, seconds * 1000);
            return;
        }

        const timerDiv = document.createElement('div');
        timerDiv.className = 'card-timer';
        let remaining = seconds;
        timerDiv.innerText = `${remaining}秒后${readyText}`;
        currentCard.appendChild(timerDiv);

        const timer = setInterval(() => {
            if (!isChatSessionActive(chatMessages, sessionId)) {
                clearInterval(timer);
                return;
            }

            remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            if (remaining > 0) {
                timerDiv.innerText = `${remaining}秒后${readyText}`;
                return;
            }

            clearInterval(timer);
            if (!isChatSessionActive(chatMessages, sessionId)) return;
            timerDiv.innerText = readyText;
            appendButtonGroup(chatMessages, [buttonLabel], () => {
                removeCurrentButtonGroup(chatMessages);
                onComplete();
            });
        }, 250);
    });
}

export const module64Handlers = {
    onContinue_Module64() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '在之前的练习中，我们已经掌握了“观察性自我”这个概念，也学会了通过“双重视角”来解码事件和情绪。现在，我们将面临一个更贴近现实的挑战：当多重压力同时袭来，如何能依然调用那个稳定、智慧的观察者视角？', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '今天，我们将模拟三种复杂程度依次递增的压力情景，进行综合应用练习。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '请不必感到压力，这就像一次模拟飞行训练，目的是让你在安全的环境中，熟练操作你已经掌握的心理方向盘。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '接下来将先呈现一个单压力场景，请先阅读场景卡片，然后跟随引导一步步尝试。', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>基础单压力场景：意外支出压力</strong></p><p><strong>【具体情境】</strong>你刚制定好本月的储蓄计划，结果手机突然被偷，找寻无果，需要一笔不小的意外开支用来买新手机和处理一系列因为手机和手机卡丢失带来的花销。你感到又气又急，心里计算着“这笔钱一花，这个月又存不下钱了，财务计划全乱了。”</p><p><strong>【核心触发点】</strong>单一压力（意外支出）+ 即时触发（突然发生、计划被打乱）。</p>'
            );
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 4;
                this.onContinue_Module64();
            });
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '现在，请你进入“体验者”角色，有一分钟的时间仔细想象这个场景。允许自己去感受那种计划瞬间被打乱的错愕、气愤和焦急。你的脑海里可能闪过这些念头：', false);
            appendSpecialCard(this.chatMessages, '<p>“太倒霉了！怎么偏偏是我？”</p><p>“这笔钱一花，这个月又白干了，计划全完了！”</p><p>“好烦，又要跑营业厅，一堆事……”</p>');
            startCardCountdown(this.chatMessages, 60, '可继续', '继续', () => {
                this.step = 5;
                this.onContinue_Module64();
            });
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '请将你此刻感受到最强烈的1-2个想法和身体感觉，通过对话框发送。（提示：可以写例如：“气死了，计划全乱”和“胃部发紧，很焦虑”。）', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 6;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '这种计划外的突发状况，带来烦躁和焦虑是非常正常真实的反应。感谢你的表达。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '现在，让我们进行视角切换。请想象：刚才写下这些感受的“你”，是你的一位好朋友，他/她正在向你诉说这件倒霉事。而你，是那位冷静、支持性的“观察者”朋友。接下来，请跟随我的引导，完成充满力量的回应。我们将分四步走，请尝试跟着引导轻声说出来。', false);
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 9;
                this.onContinue_Module64();
            });
        } else if (this.step === 9) {
            appendSpecialCard(this.chatMessages, '<p><strong>1. 观察与确认情绪</strong></p><p>首先，我需要准确地看到朋友的情绪。我可以这样说：</p><p>“我看到你因为手机突然丢失和计划被打乱，感到非常 ______（情绪，如焦虑）。”</p>');
            appendAiMessage(this.chatMessages, '请尝试站在“观察者”的角度，补全上面的话并认真说出来。', false);
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 10;
                this.onContinue_Module64();
            });
        } else if (this.step === 10) {
            appendSpecialCard(this.chatMessages, '<p><strong>2. 解离与正常化想法</strong></p><p>接着，我需要帮助朋友看到，那些令人恐慌的念头只是想法，而不是事实。我可以补充：</p><p>“当脑子里出现‘______’（如‘这个月计划全完了’）这样的想法时，我知道这只是一个面对意外损失时，非常自然冒出来的担心。”</p>');
            appendAiMessage(this.chatMessages, '请尝试站在“观察者”的角度，补全上面的话并认真说出来。', false);
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 11;
                this.onContinue_Module64();
            });
        } else if (this.step === 11) {
            appendSpecialCard(this.chatMessages, '<p><strong>3. 澄清深层渴望/价值</strong></p><p>然后，我要透过情绪，看到朋友内心真正在乎的是什么，这通常是一些积极的价值。例如，我可以说：</p><p>“在这些生气和着急的背后，我能感受到你其实非常在乎 ______（如：财务的稳定/生活的秩序感/对自己计划的掌控）。你是一个对自己有规划、负责任的人。”</p>');
            appendAiMessage(this.chatMessages, '请尝试站在“观察者”的角度，补全上面的话并认真说出来。', false);
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 12;
                this.onContinue_Module64();
            });
        } else if (this.step === 12) {
            appendSpecialCard(this.chatMessages, '<p><strong>4. 提供视角与安抚</strong></p><p>可以尝试对朋友说：“最后，我可以提供一个更广阔、更安抚的视角：‘意外总会发生，它打乱的是计划，但不是你规划未来的能力。这笔支出是解决一个问题（手机丢失），而不是对你整个财务管理的否定。我们可以一起看看，如何调整计划来应对这个意外。”</p>');
            appendAiMessage(this.chatMessages, '请尝试站在“观察者”的角度，认真说出上面的话。', false);
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 13;
                this.onContinue_Module64();
            });
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '你做得很好！接下来我们再一起看看多压力场景下应该如何做。', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>多压力场景：个人职业发展+家庭期望</strong></p><p><strong>【具体情境】</strong>你辞去了一份稳定但枯燥的工作，想尝试自己喜欢的自由职业。当你把决定告诉家人时，他们表示了强烈的不理解，认为你莽撞和冲动。你一方面因为他们的否定感到伤心和愤怒，另一方面也开始自我怀疑：我的选择真的是错的吗？我是不是太冲动了？</p><p><strong>【核心触发点】</strong>双重压力（追求自我实现的渴望与满足家人期望的需求之间的冲突）+ 叠加触发（家人的否定+自我价值和决策能力的怀疑）。</p>'
            );
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 14;
                this.onContinue_Module64();
            });
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '现在，请你进入“体验者”角色，有一分钟的时间仔细想象这个场景。允许自己去感受那种混合着委屈、愤怒、自我怀疑的复杂情绪。', false);
            appendSpecialCard(this.chatMessages, '<p>请仔细想象这个场景，允许自己去感受那种混合着委屈、愤怒、自我怀疑的复杂情绪。</p>');
            startCardCountdown(this.chatMessages, 60, '可继续', '继续', () => {
                this.step = 15;
                this.onContinue_Module64();
            });
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '请将你此刻感受到最强烈的1-2个想法和身体感觉，通过对话框发送。（提示：可以写例如：“好难过，最亲近的家人都不理解我”和“头痛”。）', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 16;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '感谢你的分享。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '现在，请将刚才写下的“体验者”的念头，看作是坐在你对面的一位好朋友正在倾诉的烦恼。而你，是那位充满智慧与关怀的“观察者”朋友。请跟随我的引导，完成填空，并尝试轻声说出来，请注意没有对错。', false);
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 19;
                this.onContinue_Module64();
            });
        } else if (this.step === 19) {
            appendSpecialCard(this.chatMessages, '<p><strong>1. 观察与确认情绪</strong></p><p>可以说：“我看到你因为 ______（家人的反应），感到既 ______（情绪1，如：委屈/愤怒），又 ______（情绪2，如：害怕/自我怀疑）。”</p>');
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 20;
                this.onContinue_Module64();
            });
        } else if (this.step === 20) {
            appendSpecialCard(this.chatMessages, '<p><strong>2. 解离与正常化想法</strong></p><p>可以说：“当脑海里冒出‘______’这样的念头时，我知道这只是一个在压力下非常自然产生的想法，并不等于事实。”</p>');
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 21;
                this.onContinue_Module64();
            });
        } else if (this.step === 21) {
            appendSpecialCard(this.chatMessages, '<p><strong>3. 澄清深层渴望/价值</strong></p><p>可以说：“在这些复杂的感受背后，我感受到你内心真正渴望的，一方面是 ______（如：家人的理解与支持），另一方面是 ______（如：个人的成长与自主）。这两者对你都无比重要。”</p>');
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 22;
                this.onContinue_Module64();
            });
        } else if (this.step === 22) {
            appendSpecialCard(this.chatMessages, '<p><strong>4. 提供视角与安抚</strong></p><p>可以说：“当重要的渴望暂时出现冲突时，感到混乱和艰难是完全可以理解的。这并不意味着你的选择是错的，只意味着我们需要一些时间和方法，来让重要的人们更好地理解这份对你而言重要的成长。”</p>');
            startCardCountdown(this.chatMessages, 30, '可完成', '已完成', () => {
                this.step = 23;
                this.onContinue_Module64();
            });
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '你做得很好！下面提供了一个参考回应，你可以对照自己刚刚的回应看看有何不同。', false);
            appendSpecialCard(this.chatMessages, '<p>“我看到你因为家人的不理解，感到既委屈愤怒，又害怕自我怀疑。当脑海里冒出‘我是不是真的太冲动了’这样的念头时，我知道这只是一个在压力下非常自然产生的想法，并不等于事实。在这些复杂的感受背后，我感受到你内心真正渴望的，一方面是家人的理解与支持，另一方面是个人的成长与自主。这两者对你都无比重要。当重要的渴望暂时出现冲突时，感到混乱和艰难是完全可以理解的。这并不意味着你的选择是错的，只意味着我们需要一些时间和方法，来让重要的人们更好地理解这份对你而言重要的成长。”</p>');
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 24;
                this.onContinue_Module64();
            });
        } else if (this.step === 24) {
            appendAiMessage(this.chatMessages, '感受一下，从刚才沉浸在“体验者”的混乱中，到此刻接收到这段“观察者”的回应，你内心的感受是否有了一丝变化，例如：', false);
            appendSpecialCard(this.chatMessages, '<p>是否感觉到情绪被清晰地理顺和命名了？</p><p>是否感觉到混乱的想法被安置在了一个更安全、更正常的心理位置？</p><p>是否感觉到那些激烈的情绪背后，自己内心在乎的“价值灯塔”变得更加清晰？</p>');
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 25;
                this.onContinue_Module64();
            });
        } else if (this.step === 25) {
            appendAiMessage(this.chatMessages, '这种从“陷入”到“观察并理解”的转变，就是心理弹性在复杂情境中运作的核心机制。', true);
            this.step = 26;
        } else if (this.step === 26) {
            appendAiMessage(this.chatMessages, '今天的练习结束了，希望在未来当你遇到不同的压力场景时，能够记得使用这种双视角的工具，接收情绪，明确内心真正渴望的价值，并采取行动。', false);
            this.step = 27;
        }
    },

    handleModule64UserMessage(text) {
        if (this.step === 6) {
            this.module64State.scenarioOneAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 7;
            this.onContinue_Module64();
            return;
        }

        if (this.step === 16) {
            this.module64State.scenarioTwoAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 17;
            this.onContinue_Module64();
        }
    }
};

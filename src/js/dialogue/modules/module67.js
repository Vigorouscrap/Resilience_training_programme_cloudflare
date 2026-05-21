import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    disableInput
} from '../../ui.js';

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function getModule67BreathSummary(answers) {
    const yesCount = answers.filter(answer => answer === '是').length;
    if (yesCount >= 2) {
        return '你与呼吸的联结更自然了，这意味着呼吸本身已成为一个稳定的觉察对象，你可以更容易通过呼吸回到当下。';
    }

    return '注意力跑走是正常的，能一次次把它带回来，本身就是很重要的练习。';
}

function getSurveyMessage(url) {
    return `最后，请点击以下问卷星链接，匿名填写反馈表，真实表达想法就好，这能帮助我们更好地总结干预经验，优化干预项目设计，完成预计需要三分钟。<br><a href="${url}">${url}</a>`;
}

export const module67Handlers = {
    onContinue_Module67() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '今天是本次心理弹性训练项目的最后一节，我们不学习新的概念和技术，而是做一个总结并看看我们在这段训练中发生了什么改变。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '我们将和以往的回顾总结一样，先进行一个冥想练习。', false);
            appendSpecialCard(this.chatMessages, '<p><strong>第一步：冥想呼吸回顾</strong></p>');
            appendAiMessage(this.chatMessages, '让我们先从回到当下开始。就像前几次一样，我们先进行一个简短的正念呼吸练习。如果你已经准备好了就请点击下方按钮开始。', false);
            appendButtonGroup(this.chatMessages, ['已准备好'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.startModule67MeditationSequence();
            });
            this.step = 2;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '那么现在，请与之前每一次你做的冥想呼吸相比，这一次的冥想呼吸是否感觉更自然一些、更容易进入状态？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module67State.breathAnswers.push(answer);
                this.step = 4;
                this.onContinue_Module67();
            });
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，注意力是否依然容易飘走？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module67State.breathAnswers.push(answer);
                this.step = 5;
                this.onContinue_Module67();
            });
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '这一次的正念呼吸过程中，呼吸的节奏是否有所不同？（答案没有正确错误之分，都是个人真实的感受）', false);
            appendButtonGroup(this.chatMessages, ['是', '否'], (answer) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module67State.breathAnswers.push(answer);
                this.step = 6;
                this.onContinue_Module67();
            });
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, getModule67BreathSummary(this.module67State.breathAnswers), false);
            appendSpecialCard(this.chatMessages, '<p><strong>第二步：回顾总结</strong></p>');
            appendAiMessage(this.chatMessages, '在这六周里，我们获得了许多成长。接下来请你用“一句话+一个动作”总结这六周干预带来的改变。请先仔细阅读以下两个模板的内容，然后你可以从下面两种模板中选择一种来表达自己。', false);
            appendSpecialCard(
                this.chatMessages,
                `
                    <p><strong>基础版：完整短句+具象动作</strong></p>
                    <p>核心逻辑：用一句完整话描述改变，搭配与改变直接相关的动作，让表达更清晰，又无需复杂组织。</p>
                    <p>句式模板：以前我会______，现在我会______，我想用这个动作告诉自己______（动作）</p>
                    <p>示例参考：</p>
                    <p>以前我会想太多白天发生的事，现在我会轻拍自己双肩，我想用这个动作告诉自己“当下就很好”（动作：双手在身前轻轻推开）</p>
                    <p>（对应改变：通过“以己为景”回到当下，缓解过度畅想的焦虑）</p>
                    <p>以前我总担心计划做不到，现在我会深呼吸，我想用这个动作告诉自己“慢慢来也可以”（动作：双手叉腰，缓慢深呼吸1次）</p>
                    <p>（对应改变：通过解离技术脱离自我怀疑，接纳不完美）</p>
                    <p><strong>进阶版：细节描述+情感动作</strong></p>
                    <p>核心逻辑：加入一个具体干预场景的细节，让改变更有画面感，动作可融入情感表达（如微笑、轻抱自己），强化分享的感染力。</p>
                    <p>句式模板：记得上次______（具体场景），我用了______（技术），现在我______（改变），这个动作就是我当下的心情______（动作）。</p>
                    <p>示例参考：</p>
                    <p>记得上次在项目评审会前焦虑到手心出汗，我用了解离对自己说“我注意到我有一个‘我会搞砸’的想法”，现在我在挑战面前会先稳住呼吸，这个动作就是我当下的安心。（动作：将一只手平静地放在胸口，进行一次深长而平稳的呼吸）</p>
                    <p>（对应改变：从过度担忧到享受挑战，从被灾难化想法控制，到能够观察并安驻当下，以己为景能力提升）</p>
                    <p>记得上次因为同龄人比较而觉得自己一事无成，我用了观察性自我看到那个“陷入评判的自己”，现在我能更客观地看待自己的轨迹，这个动作就是我坚定的方向感。（动作：双手在身前虚握一个“方向盘”，目光坚定地平视前方）</p>
                    <p>（对应改变：从盲目比较和自我否定，到跳出思维陷阱、明确个人价值方向，自我认同与价值清晰度提高）</p>
                `
            );
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 7;
                this.onContinue_Module67();
            });
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '现在，请你从以上模版选择一个，然后总结你这六周的改变吧！可以慢慢想然后输入到对话框中发送，请注意没有对错之分。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 8;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '感谢你的分享。每一句话、每一个动作，都是成长的印记，从“焦虑不安”到“从容接纳”，从“强迫自己”到“倾听内心”，这些改变会一直陪伴你。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '现在请闭上眼睛，回想自己的分享，感受这份成长带来的平静和力量，把这份感受记在心里。', false);
            appendSpecialCard(this.chatMessages, '<p>请闭上眼睛，回想自己的分享，感受这份成长带来的平静和力量。</p>');
            this.appendContinueButton(this.chatMessages, 30);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '为了能够将训练课程学到的内容和技术更持久灵活地应用和延续下去，我们提供了一个简单自我练习计划。', false);
            appendSpecialCard(
                this.chatMessages,
                `
                    <table style="border-collapse:collapse;width:100%;">
                        <tr>
                            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">练习类别</th>
                            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">练习项目</th>
                            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">练习目标</th>
                            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">所需时长</th>
                            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">适配场景</th>
                        </tr>
                        <tr>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">日常高频练习</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">每日10分钟冥想</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">强化“以己为景”，提升当下觉察力</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">10分钟/天</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">晨起后、睡前、午休间隙</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">日常高频练习</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">每日观察者视角</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">巩固解离技术，及时脱离过度反刍</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">3分钟/次</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">压力事件发生</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">日常高频练习</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">每日1句自我接纳</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">深化接纳技术，记录积极改变</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">3分钟/天</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">睡前（简单写1句“今天我接纳了______”）</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">周期性复盘</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">每周1次技术复盘</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">查漏补缺，优化技术应用方式</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">15分钟/周</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">周末下午（如周六3点）</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">周期性复盘</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">每周2次身体信号记录</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">强化对身体感受的接纳，避免忽视或过度担忧</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">5分钟/次</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">周三、周日晚（记录“今日身体舒适点/不适点”）</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">应急调节</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">即时解离短句练习</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">应对突发焦虑/过度畅想，快速切换视角</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">1-2分钟/次</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">身体不适时、反刍加重时</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">应急调节</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">短暂冥想呼吸练习</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">缓解当下压力，接纳情绪波动</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">3分钟/次</td>
                            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">情绪低落、计划焦虑时</td>
                        </tr>
                    </table>
                `
            );
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 12;
                this.onContinue_Module67();
            });
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '你也可以从计划表中确认哪些是自己能坚持的，后续如果需要调整，也可以随时修改，重点是让练习融入生活。相信你能坚持下去，也期待看到你后续的成长。', true);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, getSurveyMessage('https://v.wjx.cn/vm/rNUoFF6.aspx#'), false);
            appendButtonGroup(this.chatMessages, ['继续'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 14;
                this.onContinue_Module67();
            });
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '心理弹性不是不再跌倒，而是每次跌倒后，都能更具力量地站起来。六周的训练虽然结束，但成长还在继续，期待你收获一个更觉察、更灵活、与价值连接更深的自己，相信通过长期练习，你能更从容、更自信，也祝愿你未来顺利！', false);
            this.step = 15;
        }
    },

    handleModule67UserMessage(text) {
        if (this.step === 8) {
            this.module67State.growthAnswer = text;
            disableInput(this.inputArea, this.userInput);
            this.step = 9;
            this.onContinue_Module67();
        }
    },

    appendContinueButton(chatMessages, delaySeconds) {
        const wrap = document.createElement('div');
        wrap.className = 'continue-wrapper';
        const btn = document.createElement('div');
        btn.className = 'continue-btn';
        btn.id = 'continueBtn';
        btn.classList.add('disabled');
        btn.innerText = `⏳ ${delaySeconds} 秒后继续`;
        wrap.appendChild(btn);
        chatMessages.appendChild(wrap);

        let remaining = delaySeconds;
        const timer = setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
                btn.innerText = `⏳ ${remaining} 秒后继续`;
            } else {
                clearInterval(timer);
                btn.classList.remove('disabled');
                btn.innerText = '⏵ 点击继续';
            }
        }, 1000);
    },

    startModule67MeditationSequence() {
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
                this.step = 3;
                this.onContinue_Module67();
            }
        );
    }
};

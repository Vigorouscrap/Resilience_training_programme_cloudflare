import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    queueUiMutation,
    getChatSessionId,
    isChatSessionActive
} from '../../ui.js';

const module33GoalsCardHtml = `
    <p><strong>第一，体验视角的转换。</strong>我们将同时从“陷入反刍的自己”和“善于接纳的引导者”这两个角度来体验。这能帮助我们更深刻地理解：当焦虑升起时，内心在发生什么；以及一个充满接纳的回应，是如何一步步创造改变的。</p>
    <p><strong>第二，拓宽识别的雷达。</strong>我们将尝试把“过度积极反刍”的识别能力，应用到更广泛、更个人化的生活场景中。你会看到，它可能藏在“我必须完美”的工作计划里，也可能躲在“万一他不喜欢我”的人际担忧中。识别，就是改变的第一步。</p>
`;

const module33ScenesCardHtml = `
    <p class="scene-title"><strong>【场景1：饮食控制焦虑】</strong></p>
    <p><em><u>过度积极反刍者</u></em>：我今天多吃了一块蛋糕，网上说这样明天会重很多！我怎么这么缺乏意志力？连这点小事都做不好，减肥计划全都毁了！</p>
    <p>（<em><u>核心</u></em>：因饮食超过计划产生自我批判，“陷入做得不够好→影响减肥计划”的反刍。）</p>
    <p class="scene-title"><strong>【场景2：人际关系敏感】</strong></p>
    <p><em><u>过度积极反刍者</u></em>：今天开会时，我感觉有个同事看我的眼神不太对，他是不是对我有意见？我是不是之前哪件事没做好得罪他了？我必须想清楚是哪里出了问题，不然以后没法相处了。</p>
    <p>（<em><u>核心</u></em>：因不确定的社交信号产生焦虑，试图通过反复思虑来获得控制感，回避不安情绪。）</p>
`;

const module33ResponseGuideCardHtml = `
    <table style="border-collapse:collapse;width:100%;">
        <tr>
            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">回应类型</th>
            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">话术模板</th>
            <th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">目的</th>
        </tr>
        <tr>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">观察情绪</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">听起来你很在意XX（体重/人际关系/个人成长），同时也有点着急/担心，对吗？</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">帮对方看见自己的真实情绪，避免压抑</td>
        </tr>
        <tr>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">允许情绪存在</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">其实担心这些很正常，换做是我可能也会有这样的想法，不用怪自己</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">消除对方的自我批判，减少情绪对抗</td>
        </tr>
        <tr>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">扩展认知范围</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">除了担心没做好这件事，你最近有没有感受到身体很健康/也有其他同事对你表示友好，或者遇到让你稍微放松的小事呀？</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">引导对方跳出反刍，关注其他积极感受</td>
        </tr>
        <tr>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">引导行动思考</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">如果现在觉得有点慌，要不要先喝口水，或者和我说说你最担心的部分是什么？</td>
            <td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">帮对方从“反刍”转向“具体行动”，缓解焦虑</td>
        </tr>
    </table>
`;

const module33Scene1CardHtml = `
    <p class="scene-title"><strong>【场景1：饮食控制焦虑】</strong></p>
    <p><em><u>过度积极反刍者</u></em>：我今天多吃了一块蛋糕，网上说这样明天会重很多！我怎么这么缺乏意志力？连这点小事都做不好，减肥计划全都毁了！</p>
    <p>（<em><u>核心</u></em>：因饮食超过计划产生自我批判，“陷入做得不够好→影响减肥计划”的反刍。）</p>
`;

const module33DemoCardHtml = `
    <p>反刍者AI（焦虑语气）：“我今天多吃了一块蛋糕，网上说这样明天会重很多！我怎么这么缺乏意志力？”</p>
    <p>（停顿2秒）</p>
    <p>接纳者AI（温和语气）：“（观察）听起来你特别在意体重的变化，因为这一块蛋糕，现在既担心又有点自责，对吗？”）（——<span class="annotation">这里先点出反刍者的“在意”和“自责”，帮其看见自己没说出来的情绪，而不是直接否定她的担心。</span>）</p>
    <p>反刍者AI：“对，就是觉得自己太没用了，这点要求都达不到。”</p>
    <p>接纳者AI：“（允许）其实真的不用这么怪自己。饮食控制本来就不容易，偶尔超出计划，很多人都会这样。有这些情绪很正常，它不是你的错。”（——<span class="annotation">这里强调“正常”和“不是错”，是让反刍者不用对抗自己的负面感受，减少自我批判。</span>）</p>
    <p>反刍者AI：“可我还是担心体重减不下来。”</p>
    <p>接纳者AI：“（扩展）我理解这份担心。那除了这一块蛋糕，你这周有没有坚持完成了计划内的运动？或者有没有哪一餐是成功按照计划健康饮食的？”（——<span class="annotation">这里引导反刍者想其他积极的事，是帮反刍者从“没做好”的反刍里抽离出来，不让注意力只盯着负面点。</span>）</p>
    <p>反刍者AI：“嗯…昨天前天都去跑步了，午餐也吃得挺健康的。”</p>
    <p>接纳者AI：“（引导行动）你看，其实你做得挺好的。如果现在还是有点慌，要不要先喝口水，或者把今天的情况简单记一下？我们可以想一个小调整，而不是否定全部努力。”（——<span class="annotation">最后引导具体行动，是帮反刍者从“焦虑”转向“能做的事”，减少反刍带来的无力感。</span>）</p>
`;

const module33DemoSummaryCardHtml = `
    <p>先看见并说出情绪（观察）</p>
    <p>承认情绪的合理性（允许）</p>
    <p>引导注意力转向更全面的现实（扩展）</p>
    <p>提议一个微小具体的前进步骤（引导行动）</p>
`;

const module33Scene2CardHtml = `
    <p><strong>【场景2：人际关系敏感】</strong></p>
    <p>过度积极反刍者：今天开会时，我感觉有个同事看我的眼神不太对，他是不是对我有意见？我是不是之前哪件事没做好得罪他了？我必须想清楚是哪里出了问题，不然以后没法相处了。</p>
    <p>（核心：因不确定的社交信号产生焦虑，试图通过反复思虑来获得控制感，回避不安情绪。）</p>
`;

const module33Rounds = [
    {
        heading: '【第一轮：观察情绪 - 建立连接】',
        speech: '（反刍者）（语气不安、略带纠结）：今天开会时，我感觉有个同事看我的眼神不太对……他是不是对我有意见？我是不是之前哪件事没做好得罪他了？我必须想清楚是哪里出了问题，不然以后没法相处了……',
        prompt: '请先在内心思考并小声说出你作为接纳者会给出的回应，30s后将提供具体选项。',
        optionPrompt: '请选择你认为最合适的“接纳者”回应：',
        options: [
            'A. 你别想太多了，可能只是你自己太敏感了。',
            'B. 听起来你很在意和这位同事的关系，同时也有点担心和困惑，对吗？',
            'C. 那你打算怎么办？直接去问他吗？'
        ],
        responses: {
            'A. 你别想太多了，可能只是你自己太敏感了。': '这是一个常见的回应方式。不过，当一个人深陷反刍时，直接否定，可能会让ta觉得自己的感受不被接纳并增加压力。第一步的关键是先建立情感连接即选择B，确认对方的感受是合理的。让我们继续看看下一步。',
            'B. 听起来你很在意和这位同事的关系，同时也有点担心和困惑，对吗？': '很好。你选择了观察情绪的回应。你准确地指出了对方“在意关系”和“担心困惑”的感受，这让对方感到自己的情绪被“看见”了，而不是被评判或忽视。这是建立信任对话的第一步。',
            'C. 那你打算怎么办？直接去问他吗？': '这是一个常见的回应方式。不过，当一个人深陷反刍时，急于解决问题，可能会让ta觉得自己的感受不被接纳并增加压力。第一步的关键是先建立情感连接即选择B，确认对方的感受是合理的。让我们继续看看下一步。'
        }
    },
    {
        heading: '【第二轮：允许存在 - 解除自我批判】',
        speech: '（反刍者）（语气稍缓，但仍有自责）：可能真的是我太敏感了。但我就是控制不住会想，万一他真的对我有看法怎么办……',
        prompt: '请先在内心思考并小声说出你作为接纳者会给出的回应，30s后将提供具体选项。',
        optionPrompt: '请选择你认为最合适的“接纳者”回应：',
        options: [
            'A. 你真的不应该这样怀疑自己，要自信一点。',
            'B. 在不确定的情况下感到担心和反复思考，其实是很自然的事，很多人都这样。你不必为此责怪自己。',
            'C. 别担心了，我帮你分析一下。'
        ],
        responses: {
            'A. 你真的不应该这样怀疑自己，要自信一点。': '这一回应隐含批评，可能会加剧反刍者的自责。因此，这一步我们应当引导对方将情绪体验正常化，允许情绪的存在，即采用选项B提供的回应。',
            'B. 在不确定的情况下感到担心和反复思考，其实是很自然的事，很多人都这样。你不必为此责怪自己。': '这是允许存在的正确回应。它将对方的体验“正常化”（“很多人都这样”），并直接解除了自我批判（“不必责怪自己”）。这能减少与情绪的对抗，为焦虑的情绪创造一个安全的“降落场”，而不是让它在空中继续盘旋。',
            'C. 别担心了，我帮你分析一下。': '这其实是在急于接管问题，可能削弱对方的自主感。因此，这一步我们应当引导对方将情绪体验正常化，允许情绪的存在，即采用选项B提供的回应。'
        }
    },
    {
        heading: '【第三轮：扩展认知 - 跳出思维窄巷】',
        speech: '（反刍者）（情绪稍平复，但仍在问题里打转）：但我还是想知道，到底是我哪里做得不对。',
        prompt: '请先在内心思考并小声说出你作为接纳者会给出的回应，30s后将提供具体选项。',
        optionPrompt: '请选择你认为最合适的“接纳者”回应：',
        options: [
            'A. 除了担心这位同事的看法，最近和其他同事或朋友的相处中，有没有感觉比较愉快或顺利的时刻？”',
            'B. 你必须找出原因，不然这个问题会一直困扰你。',
            'C. 那就列个清单，想想你所有可能做得不对的地方。'
        ],
        responses: {
            'A. 除了担心这位同事的看法，最近和其他同事或朋友的相处中，有没有感觉比较愉快或顺利的时刻？”': '很好，这一回应完美地体现了扩展认知。它没有否认对方的担忧，而是温和地将ta的注意力，从“单一的黑点”（那位同事的眼神），引向“整张画布”（其他人际关系）。这能帮助大脑跳出反复扫描“问题”的窄巷，看到更广阔的图景。',
            'B. 你必须找出原因，不然这个问题会一直困扰你。': '这一回应强化了反刍的紧迫性，可能加剧焦虑。因此，这一步我们应当引导反刍者将关注点从单一负面线索，扩展到更全面的人际体验，即选择A。',
            'C. 那就列个清单，想想你所有可能做得不对的地方。': '这一回应看似要解决问题，实际上会引导至更深的细节反刍，是无效的“解决”尝试。因此，这一步我们应当引导反刍者将关注点从单一负面线索，扩展到更全面的人际体验，即选择A。'
        }
    },
    {
        heading: '【第四轮：引导行动 - 锚定于当下】',
        speech: '（反刍者）（有些缓和，但仍不知如何是好）：我和其他同事的相处还不错，前两天还和几个同事一起聚餐。但我现在还是觉得有点不踏实。',
        prompt: '请先在内心思考并小声说出你作为接纳者会给出的回应，30s后将提供具体选项。',
        optionPrompt: '请选择你认为最合适的“接纳者”回应：',
        options: [
            'A. 如果现在感觉不踏实，要不要先停下来，喝口水，感受一下双脚稳稳踩在地面的感觉？',
            'B. 那你现在立刻去找他问清楚吧。',
            'C. 别想了，明天再说。'
        ],
        responses: {
            'A. 如果现在感觉不踏实，要不要先停下来，喝口水，感受一下双脚稳稳踩在地面的感觉？': '这一回应是引导行动的优秀示范。它提议的行动（喝水、感受双脚）是：<br>1. 立即可行的：不受时间地点限制。<br>2. 身体导向的：将注意力从思维拉回身体，打破反刍循环。<br>3. 照顾性的：是一个自我关怀的微小动作。<br>这个行动本身不是目的，而是为不安的情绪提供一个稳定、温和的“锚点”。',
            'B. 那你现在立刻去找他问清楚吧。': '这提议了一个可能超出对方当下准备度的重大行动。实际上，这一步提供的应当是立即可行的、与当下身体感受连接的、照顾性的行动，这个行动本身不是目的，而是为不安的情绪提供一个稳定、温和的“锚点”，因此应选择A。',
            'C. 别想了，明天再说。': '这个回应回避了问题，未能提供建设性出口。实际上，这一步提供的应当是立即可行的、与当下身体感受连接的、照顾性的行动，这个行动本身不是目的，而是为不安的情绪提供一个稳定、温和的“锚点”，因此应选择A。'
        }
    }
];

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

function startCardCountdown(chatMessages, seconds, readyText, buttonLabel, onComplete) {
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

export const module33Handlers = {
    onContinue_Module33() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '昨天我们认识了过度积极反刍，也初步尝试了将接纳技术应用在这种心理模式中。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '我们可能会发现，日常生活中的压力场景多种多样，远不止我们练习过的例子。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '为了让学到的技术真正能“带得走、用得上”，我们需要更灵活地识别它，也更熟练地应用它。因此，今天我们将进行一个强化练习。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '强化练习将聚焦于两个目标：', false);
            appendSpecialCard(this.chatMessages, module33GoalsCardHtml);
            startCardCountdown(this.chatMessages, 30, '可继续', '继续', () => {
                this.step = 4;
                this.onContinue_Module33();
            });
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '现在，让我们一起开始这段强化之旅吧。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '以下是两个多样的“过度积极反刍”场景，每个场景已经明确“过度积极反刍者”的核心情绪与行为：', false);
            appendSpecialCard(this.chatMessages, module33ScenesCardHtml);
            startCardCountdown(this.chatMessages, 30, '可继续', '继续', () => {
                this.step = 6;
                this.onContinue_Module33();
            });
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '当我们或他人陷入这些“反刍循环”时，对抗或讲道理往往无效。真正有帮助的，是“接纳式对话”的回应方式。', true);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '下面展示了具体的回应方式以及目的，请慢慢阅读。', false);
            appendSpecialCard(this.chatMessages, module33ResponseGuideCardHtml);
            startCardCountdown(this.chatMessages, 60, '可继续', '继续', () => {
                this.step = 8;
                this.onContinue_Module33();
            });
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '你可能暂时还没有完全理解或者感到疑惑，没关系，现在，我将以第一个场景为例进行示范。', false);
            appendSpecialCard(this.chatMessages, module33Scene1CardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '我将扮演“反刍者”，你会看到屏幕上出现我的“内心独白”。然后，我将切换为“接纳者”，用上面表格中的四步进行回应。请仔细观察这个过程。', false);
            appendSpecialCard(this.chatMessages, module33DemoCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '请注意，接纳者没有否定对方的担心，也没有说“别想了”。而是：', false);
            appendSpecialCard(this.chatMessages, module33DemoSummaryCardHtml);
            startCardCountdown(this.chatMessages, 30, '可继续', '继续', () => {
                this.step = 11;
                this.onContinue_Module33();
            });
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '接下来，以场景2为例，你将有机会亲自扮演“接纳者”，练习这种回应方式。', false);
            appendSpecialCard(this.chatMessages, module33Scene2CardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '我将扮演场景中的过度反刍者，你来扮演接纳者，准备好了吗？', false);
            appendButtonGroup(this.chatMessages, ['已准备'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 13;
                this.onContinue_Module33();
            });
        } else if (this.step === 13) {
            this.showModule33RoundIntro(0);
            this.step = 14;
        } else if (this.step === 14) {
            this.showModule33RoundChoices(0, 15);
        } else if (this.step === 15) {
            this.showModule33RoundIntro(1);
            this.step = 16;
        } else if (this.step === 16) {
            this.showModule33RoundChoices(1, 17);
        } else if (this.step === 17) {
            this.showModule33RoundIntro(2);
            this.step = 18;
        } else if (this.step === 18) {
            this.showModule33RoundChoices(2, 19);
        } else if (this.step === 19) {
            this.showModule33RoundIntro(3);
            this.step = 20;
        } else if (this.step === 20) {
            this.showModule33RoundChoices(3, 21);
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '你做得很好。今天我们拓展了应用场景，完整地体验了作为接纳者的另一个角度，进一步练习了接纳技术。', true);
            this.step = 22;
        } else if (this.step === 22) {
            appendAiMessage(this.chatMessages, '相信你已经有了更深的理解。当你或他人再次陷入反刍时，可以回想这个框架：先看见，后允许，再扩展，最后轻推一把。我们明天见。', true);
            this.step = 23;
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '一个小提醒，我们这几天还需要继续进行情绪日记的记录（问卷星链接：<a href="https://v.wjx.cn/vm/tUtCiF5.aspx#">https://v.wjx.cn/vm/tUtCiF5.aspx#</a>）。每一天你可以选择在当晚（一天结束前）填写这个情绪日记，也可以选择在你遇到有情绪波动的事情时即刻开始记录。', false);
            this.step = 24;
        }
    },

    showModule33RoundIntro(index) {
        const round = module33Rounds[index];
        appendSpecialCard(this.chatMessages, `<p><strong>${round.heading}</strong></p>`);
        appendAiMessage(this.chatMessages, round.speech, false);
        appendAiMessage(this.chatMessages, round.prompt, false);
        startCardCountdown(this.chatMessages, 30, '可继续', '继续', () => {
            this.onContinue_Module33();
        });
    },

    showModule33RoundChoices(index, nextStep) {
        const round = module33Rounds[index];
        appendAiMessage(this.chatMessages, round.optionPrompt, false);
        appendButtonGroup(this.chatMessages, round.options, (choice) => {
            removeCurrentButtonGroup(this.chatMessages);
            appendAiMessage(this.chatMessages, round.responses[choice], true);
            this.step = nextStep;
        });
    }
};

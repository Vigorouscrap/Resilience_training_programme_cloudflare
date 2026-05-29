import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton
} from '../../ui.js';

const module35ExampleOneCardHtml = `
    <p class="scene-title"><strong>示例一：体重焦虑</strong></p>
    <p><b>触发场景</b>：忍不住过度关注体重，每天称3次，数字没下降就感到一切努力都白费了。</p>
    <p><b>接纳行动</b>：未来几天，当我又想频繁称体重时，我就先深呼吸10秒，告诉自己“人体体重有波动很正常”，然后活动下四肢，接纳当下的体重状态，继续自己的一天。</p>
`;

const module35ExampleTwoCardHtml = `
    <p class="scene-title"><strong>示例二：选择困难</strong></p>
    <p><b>触发场景</b>：要买一个物品，担心买到的不够好，反复对比十几个品牌，越选越慌。</p>
    <p><b>接纳行动</b>：未来几天选购物品时，若开始反复纠结，就停下来列出2个核心需求（如“耐用、美观”），选择出第一个符合的物品即可，接纳“没有完美的用品”，告诉自己这个选择足以满足我的核心需求。</p>
`;

const module35ExampleThreeCardHtml = `
    <p class="scene-title"><strong>示例三：拖延</strong></p>
    <p><b>触发场景</b>：面对一份又多又难的实验报告作业，感觉完全不知道从哪里下手，脑子里一片空白，越拖延越焦虑，觉得自己肯定做不完也做不好。</p>
    <p><b>接纳行动</b>：未来几天，当我又在面对复杂任务感到瘫痪时，我会先立即放下手机，离开让我分心的环境，坐回书桌前。然后告诉自己这个任务看起来确实很多很难，感到无从下手和焦虑是完全正常的。我不需要一次解决所有问题。先从最小的事做起，比如打开文档，写下作业的标题；或者，把作业要求读一遍，用荧光笔划出3个关键词。允许自己从这最小的、不完美的一步开始。</p>
`;

const module35InspirationCardHtml = `
    <p><b>健康/外貌</b>：对运动数据、饮食控制过度关注。</p>
    <p><b>人际关系</b>：过度揣测他人的看法或某次对话。</p>
    <p><b>工作学习</b>：因追求完美而拖延，或过度担忧结果。</p>
    <p><b>日常选择</b>：在小决定上反复纠结，消耗大量精力。</p>
    <p><b>逆境创伤</b>：对于发生过的事情无法释怀，反复想起</p>
    <p><b>其他</b>：……</p>
`;

const module35ObservationCardHtml = `
    <p><strong>【本次行动观察记录】</strong></p>
    <p>次数：___（请填写此次为第几次实施行动）</p>
    <p>行动前焦虑值：__ 分（范围0-10，0=完全不焦虑，心理很平静，10=极度焦虑，比如坐立难安、无法集中注意力；5分就是中等焦虑，能感受到担心，但还能正常做事。）</p>
    <p>行动后焦虑值：__ 分（范围及要求同上）</p>
    <p>一个意外的小发现（如有）：_________________________</p>
    <p>（例如：我发现，只要说出“我允许自己焦虑”，紧绷的肩膀就松了一点。或者，做完某个行动后，我居然更快地投入到下一件事了。）</p>
`;

function removeCurrentButtonGroup(chatMessages) {
    const currentBtnGroup = chatMessages.querySelector('.button-group');
    if (currentBtnGroup) currentBtnGroup.remove();
}

export const module35Handlers = {
    onContinue_Module35() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '此前，我们通过视角转换的练习，体验了在更多元的场景中如何用接纳的方式回应情绪。那么今天，我们的重点是将这些理解转化为我们自己的实际行动。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '我们将花几分钟时间，为自己制定一个“未来几天可尝试的接纳行动”。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '一开始，这个行动可以先应用于一些小事，比如之前提到的饮食控制焦虑、人际关系敏感，或者想想你自己最近遇到的“过度想做好某件事”的情况。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '在制定行动时，我们不用追求“宏大、完美”的行动，重点是“具体、能做到”，比如“每天花1分钟深呼吸来接纳自己的焦虑”，比“在跑步机上跑一整天来忘记焦虑”更实际，也更容易坚持。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '我将先为你展示几个行动格式示例。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendSpecialCard(this.chatMessages, module35ExampleOneCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 6;
        } else if (this.step === 6) {
            appendSpecialCard(this.chatMessages, module35ExampleTwoCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 7;
        } else if (this.step === 7) {
            appendSpecialCard(this.chatMessages, module35ExampleThreeCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '你看，每个示例里的“触发场景”都很具体，能明确知道“什么时候要行动”，“接纳行动”也有“具体动作”（如深呼吸、列需求），这样执行时才不会模糊。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '一会儿我们写的时候，也可以按照“如果遇到XX情况，我就做XX”的句式来写。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '现在，请思考一个你最近或未来几天可能遇到的，容易引发回避或过度积极反刍的场景。', true);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '场景没有限制。但如果你暂时想不起来需要一些启发，可以从下面选择：', false);
            appendSpecialCard(this.chatMessages, module35InspirationCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '现在，你有几分钟的时间来思考对你来说有可能触发的场景，然后像一个具体的接纳行动。', false);
            appendContinueButton(this.chatMessages, 120);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '想好了以后，请点击以下问卷星链接（<a href="https://v.wjx.cn/vm/eY3u9fv.aspx#">https://v.wjx.cn/vm/eY3u9fv.aspx#</a>）填入触发场景和接纳行动。请在提交前截图保存自己填写的内容。（请注意，我们将以匿名形式记录，不会用于其他途径。）', false);
            appendButtonGroup(this.chatMessages, ['已完成'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.step = 14;
                this.onContinue_Module35();
            });
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '很好，你已经进行了自我承诺。未来几天当你识别到那个“触发场景”时，就可以立刻引导自己每一次执行，无论效果大小，都将是一次胜利。因为它代表你从“自动驾驶”的心理模式中，夺回了一丝主动权。', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '为了让这份承诺更好地服务你，我们还设置了一个简单的“自我观察”任务。目的不是考核，而是探索：探索哪种接纳方式对你最有效，探索你在行动前后细微的变化。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '具体来讲，在未来几天，每当你执行了你的接纳行动后，可以随时打开链接记录（<a href="https://v.wjx.cn/vm/YDIVxE6.aspx#">https://v.wjx.cn/vm/YDIVxE6.aspx#</a>）（这一负责记录的问卷星链接将每日发送给你，只有在你当天有进行接纳行动后才填写）。将要记录的内容有：', false);
            appendSpecialCard(this.chatMessages, module35ObservationCardHtml);
            appendContinueButton(this.chatMessages);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '关于“意外发现”：请留意那些计划之外的、细微的积极变化。它可能关于你的身体（手不抖了）、你的自身需求（在进行“和家人聊自己的未来规划”的行动时，发现“原来我不是怕家人不理解，而是怕自己说不清楚”）、或你的人际关系（“朋友的一句回应让我好受很多”）。', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendAiMessage(this.chatMessages, '不用刻意找“大发现”，哪怕是很小的感受都可以。', true);
            this.step = 19;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '今天的内容就是这些啦，不用担心忘记，未来几天我们会每日发送提醒。请带着你的自我承诺和观察之心，回到生活中去吧。期待你的发现。', false);
            this.step = 20;
        }
    }
};

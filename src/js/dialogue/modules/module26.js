import {
    appendAiMessage,
    appendSpecialCard,
    appendContinueButton,
    appendUnderstandButton
} from '../../ui.js';

const journalTemplateRows = [
    ['1.基础信息', '当日日期', ''],
    ['2.今天的小事件', '具体、简短', ''],
    ['3.当时的情绪', '写1个关键词', ''],
    ['4.身体感受', '具体部位+感受', ''],
    ['5.接纳小行动', '为自己做的小事', '']
];

const journalExampleStep1Rows = [
    ['1.基础信息', '当日日期', '5月9日'],
    ['2.今天的小事件', '具体、简短', '早上出门时不小心踩到了泥坑弄脏了鞋'],
    ['3.当时的情绪', '写1个关键词', ''],
    ['4.身体感受', '具体部位+感受', ''],
    ['5.接纳小行动', '为自己做的小事', '']
];

const journalExampleStep2Rows = [
    ['1.基础信息', '当日日期', '5月9日'],
    ['2.今天的小事件', '具体、简短', '早上出门时不小心踩到了泥坑弄脏了鞋'],
    ['3.当时的情绪', '写1个关键词', '烦躁懊恼'],
    ['4.身体感受', '具体部位+感受', ''],
    ['5.接纳小行动', '为自己做的小事', '']
];

const journalExampleStep3Rows = [
    ['1.基础信息', '当日日期', '5月9日'],
    ['2.今天的小事件', '具体、简短', '早上出门时不小心踩到了泥坑弄脏了鞋'],
    ['3.当时的情绪', '写1个关键词', '烦躁懊恼'],
    ['4.身体感受', '具体部位+感受', '胸闷闷的'],
    ['5.接纳小行动', '为自己做的小事', '']
];

const journalExampleStep4Rows = [
    ['1.基础信息', '当日日期', '5月9日'],
    ['2.今天的小事件', '具体、简短', '早上出门时不小心踩到了泥坑弄脏了鞋'],
    ['3.当时的情绪', '写1个关键词', '烦躁懊恼'],
    ['4.身体感受', '具体部位+感受', '胸闷闷的'],
    ['5.接纳小行动', '为自己做的小事', '轻轻拍了拍自己']
];

function buildJournalTableHtml(rows) {
    const header = '<tr><th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;"> </th><th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">填写要求</th><th style="border:1px solid #aac3df;padding:0.45rem 0.6rem;text-align:left;">填写内容</th></tr>';
    const body = rows
        .map(
            ([col1, col2, col3]) =>
                `<tr><td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">${col1}</td><td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">${col2}</td><td style="border:1px solid #aac3df;padding:0.45rem 0.6rem;vertical-align:top;">${col3}</td></tr>`
        )
        .join('');

    return `<table style="border-collapse:collapse;width:100%;">${header}${body}</table>`;
}

export const module26Handlers = {
    onContinue_Module26() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '今天我们将介绍“情绪日记”。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '情绪日记就像“情绪的小镜子”，可以帮助我们看清自己的感受。要完成情绪日记，只需简单地遵循“三不三要”规则即可：', false);
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>三不原则</strong></p><p>1.不追求“积极”</p><p>2.不评判对错</p><p>3.不写复杂句子</p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '不追求积极，指的是在写情绪日记的时候不用强迫自己写开心的事，而是心里有什么或者遇到什么就写什么，让自己生气、难过、或者有压力的事都可以写出来，真实最重要。', true);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '不评判对错，指的是不用骂自己“不该焦虑”或“太小气”，感受没有对错，我们只是如实记录下来就好。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '不写复杂句子，指的是情绪日记不需使用复杂的长句或者写成作文，用一些关键词、几个短句来陈述就可以。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendSpecialCard(
                this.chatMessages,
                '<p><strong>三要原则</strong></p><p>1.要写具体事件（比如论文被拒了、长胖穿不上旧裤子）</p><p>2.要标情绪词（比如 紧张、失落）</p><p>3.要记身体感受（比如手心出汗、反胃）</p>'
            );
            appendContinueButton(this.chatMessages);
            this.step = 6;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '要写具体事件，指的是别只写“今天很糟”，而是写下具体发生了什么，比如“论文被拒了”，“长胖穿不上旧裤子”，“开会时说错话被同事笑”。越具体，越能看清情绪。', true);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '要标情绪词，指的是描述完事件后加上当时自己真正的情绪感受，比如“紧张”、“失落”、“委屈”、“烦躁”。别怕标签太简单，一个词也够。', true);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '要记身体感受，指的是写下身体哪里在告诉自己“有情绪了”，比如“手心出汗”、“胃发紧”、“胸闷”、“肩膀发酸”。身体从不说谎，它是情绪的闹钟。', true);
            this.step = 9;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '接下来，我们跟随着模板一起看看具体如何填写。', true);
            this.step = 10;
        } else if (this.step === 10) {
            appendSpecialCard(this.chatMessages, buildJournalTableHtml(journalTemplateRows));
            appendContinueButton(this.chatMessages);
            this.step = 11;
        } else if (this.step === 11) {
            appendAiMessage(this.chatMessages, '情绪日记一共需要记录5个方面。我们可以先填写今天的日期，然后写下今天发生的小事件，不一定要写大事，也可以写让你有情绪波动的小事，1 句话就可以。', true);
            this.step = 12;
        } else if (this.step === 12) {
            appendSpecialCard(this.chatMessages, buildJournalTableHtml(journalExampleStep1Rows));
            appendContinueButton(this.chatMessages);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '接下来想想这件事发生时，你是什么情绪？可以从“焦虑、担心、失落、开心、平静”中选择，也可以自己描述，比如“有点慌”。', true);
            this.step = 14;
        } else if (this.step === 14) {
            appendSpecialCard(this.chatMessages, buildJournalTableHtml(journalExampleStep2Rows));
            appendContinueButton(this.chatMessages);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '再想想身体哪里有感觉，比如“心跳快”、“肩膀硬”，填在对应位置，不用写很多，只要写出具体的身体部位和感受即可。', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendSpecialCard(this.chatMessages, buildJournalTableHtml(journalExampleStep3Rows));
            appendContinueButton(this.chatMessages);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '最后写采取的接纳小行动，也就是你为自己做的小事，比如“对自己说担心很正常”、“喝了一口温水”，哪怕是“深呼吸了一次”也可以，记录下来就是进步。最终的情绪日记完整实例展示如下：', true);
            this.step = 18;
        } else if (this.step === 18) {
            appendSpecialCard(this.chatMessages, buildJournalTableHtml(journalExampleStep4Rows));
            appendUnderstandButton(this.chatMessages, () => {
                this.step = 19;
                this.onContinue_Module26();
            });
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '今天的的情绪日记介绍就到这里。情绪日记能够帮助我们更敏锐的觉察日常生活中发生的事、引起的情绪并及时尝试接纳。', true);
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '以下是一个问卷星链接：（待后续补充），里面呈现的就是我们刚刚介绍的情绪日记。你可以选择在今晚（一天结束前）填写这个情绪日记，也可以选择在你遇到有情绪波动的事情时即刻开始记录。', true);
            this.step = 21;
        } else if (this.step === 21) {
            appendAiMessage(this.chatMessages, '如果填写时想不起来当天发生了什么事，就写当天参加练习时的感受（比如“刚刚练习时有点紧张，手心出汗，后来做了深呼吸”），不用纠结，真实就好。', true);
            this.step = 22;
        } else if (this.step === 22) {
            appendAiMessage(this.chatMessages, '这个小活动将会持续几天，坚持下来就能帮助我们更清楚的看见和接纳自己的情绪了。另外，不用担心会忘记做，我们会在后续的几次练习结尾进行提醒，也会通过联系方式发送问卷星链接。情绪日记也将以匿名的形式提交，不会用于任何其他用途。', true);
            this.step = 23;
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '祝你拥有美好的一天。', false);
            this.step = 24;
        }
    }
};

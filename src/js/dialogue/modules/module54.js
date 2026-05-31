import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton,
    disableInput
} from '../../ui.js';
import {
    appendSpeechReplayCard,
    removeCurrentButtonGroup
} from './module5Shared.js';

const module54PositiveChoiceCardHtml = `
    <div class="module5-options-list">
        <p><strong>积极反刍思维解离练习：</strong></p>
        <p>请从以下选项中选择一个积极反刍思维，想象这就是自己的想法，或者选择结合自己的经历回忆当时的积极反刍想法：</p>
        <p>A 我必须让所有人对我满意，只要有人不开心，就是我的问题。</p>
        <p>B 我不能让别人看出我的脆弱，这样会被瞧不起的。</p>
        <p>C（贴合自身经历，自定义）</p>
    </div>
`;

const module54NegativeChoiceCardHtml = `
    <div class="module5-options-list">
        <p><strong>消极反刍思维解离练习：</strong></p>
        <p>请从以下选项中选择一个现成的消极反刍思维，想象这就是自己的想法，或者选择结合自己的经历回忆当时的消极反刍想法：</p>
        <p>A 我的人际关系一塌糊涂，没有人喜欢我。</p>
        <p>B 他今天为什么用那个眼神看我，是不是觉得我太笨了。</p>
        <p>C（贴合自身经历，自定义）</p>
    </div>
`;

const module54ThoughtExamplesCardHtml = `
    <div class="module5-options-list">
        <p><strong>【积极反刍思维卡】</strong></p>
        <p>• 我一定不能在任何细节上出错，否则就证明我不够好。</p>
        <p>• 我必须让所有人对我满意，只要有人不开心，就是我的问题。</p>
        <p>• 我不能让别人看出我的脆弱，这样会被瞧不起的</p>
        <p><strong>【消极反刍思维卡】</strong></p>
        <p>• 老师这次的批评一定是觉得我能力不行，我感觉毕业困难了</p>
        <p>• 我的人际关系一塌糊涂，没有人喜欢我</p>
        <p>• 他今天为什么用那个眼神看我，是不是觉得我太笨了</p>
    </div>
`;

const module54PositiveDemoSpeech = '脑海中浮现“我一定不能在任何细节上出错，否则就证明我不够好”……现在，请将“我一定不能在任何细节上出错，否则就证明我不够好”这个想法写在红色气球上……握住它……然后，慢慢松开手……看着它飘远……消失……好，做一次深呼吸，慢慢地睁开眼。';
const module54NegativeDemoSpeech = '脑海中浮现“老师这次批评我一定是觉得我能力不行，我感觉毕业困难了”…… 现在，请将“老师这次批评我一定是觉得我能力不行，我感觉毕业困难了”这个想法写在蓝色气球上……同样地握住它……然后，慢慢松开手…看着它飘远……消失……好，做一次深呼吸，慢慢地睁开眼。';
const module54PositivePracticeSpeech = '闭上眼睛……把你选择的这个想法，清晰地写在想象的红色气球上……感受一下这个气球在你手中的“重量”……它代表了这个想法带给你的无形压力……现在，慢慢地、有意识地，一根一根松开你的手指……看着这个红色的气球，带着那个想法，缓缓升空……越飘越远……直到消失在视野里……好，做一次深呼吸，慢慢地睁开眼。';
const module54NegativePracticeSpeech = '闭上眼睛……把你选择的这个消极想法，清晰地写在想象的蓝色气球上……感受一下这个气球在你手中的“重量”……它代表了这个想法带给你的无形压力……然后，用和刚才一模一样的方式，慢慢地、有意识地，一根一根松开你的手指……看着这个蓝色的气球缓缓飘走……它和红色气球一样，都只是一个承载了想法的气球……看着它变小、消失，带着那个想法，越飘越远……好，做一次深呼吸，慢慢地睁开眼。';

function parseScore(text) {
    const normalized = String(text).trim();
    if (!/^(10|[0-9])$/.test(normalized)) return null;
    return Number(normalized);
}

function createModule54ReplayCardHtml(title, text) {
    return `
        <p class="module5-media-title">${title}</p>
        <div class="module5-media-body">
            <p>${text}</p>
        </div>
    `;
}

function createModule54ComparisonCardHtml(state) {
    const positiveBefore = Number(state.positiveBefore);
    const positiveAfter = Number(state.positiveAfter);
    const negativeBefore = Number(state.negativeBefore);
    const negativeAfter = Number(state.negativeAfter);
    const positiveDelta = positiveBefore - positiveAfter;
    const negativeDelta = negativeBefore - negativeAfter;

    return `
        <style>
            .module54-comparison {
                display: grid;
                gap: 0.9rem;
            }
            .module54-comparison-title {
                font-weight: 700;
                color: #1c3853;
            }
            .module54-comparison-table {
                width: 100%;
                border-collapse: collapse;
            }
            .module54-comparison-table th,
            .module54-comparison-table td {
                border: 1px solid #aac3df;
                padding: 0.6rem 0.7rem;
                text-align: center;
                vertical-align: middle;
                line-height: 1.6;
                color: #1c3853;
            }
            .module54-comparison-table th {
                background: #dfeafb;
                font-weight: 700;
            }
            .module54-comparison-table td:first-child {
                font-weight: 600;
                background: rgba(255, 255, 255, 0.45);
            }
            .module54-change-positive {
                color: #1f6a3f;
                font-weight: 700;
            }
            .module54-change-negative {
                color: #8a3f29;
                font-weight: 700;
            }
            .module54-change-neutral {
                color: #1e4a72;
                font-weight: 700;
            }
        </style>
        <div class="module54-comparison">
            <p class="module54-comparison-title">练习前后情绪值变化对比</p>
            <table class="module54-comparison-table">
                <thead>
                    <tr>
                        <th>思维类型</th>
                        <th>解离前情绪强度</th>
                        <th>解离后情绪强度</th>
                        <th>变化</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>积极反刍</td>
                        <td>${positiveBefore}</td>
                        <td>${positiveAfter}</td>
                        <td class="${positiveDelta > 0 ? 'module54-change-positive' : positiveDelta < 0 ? 'module54-change-negative' : 'module54-change-neutral'}">${positiveBefore}-${positiveAfter}=${positiveDelta}</td>
                    </tr>
                    <tr>
                        <td>消极反刍</td>
                        <td>${negativeBefore}</td>
                        <td>${negativeAfter}</td>
                        <td class="${negativeDelta > 0 ? 'module54-change-positive' : negativeDelta < 0 ? 'module54-change-negative' : 'module54-change-neutral'}">${negativeBefore}-${negativeAfter}=${negativeDelta}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

export const module54Handlers = {
    onContinue_Module54() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '我们的大脑时常被两种执念困扰：一种是积极反刍如“我必须做好、我不能出错”，另一种是消极反刍如“我完蛋了”。今天，我们将进一步深化认知解离，练习对这两种想法进行同等程度的解离，平静地放手，体验不评判思维的平和状态。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '首先，我们将展示两种思维的示例卡。', false);
            appendSpecialCard(this.chatMessages, module54ThoughtExamplesCardHtml);
            appendAiMessage(this.chatMessages, '请先认真浏览这些想法。你的任务是：先想象这是自己真实的想法，体会文字中表达的感觉，然后，不对它们进行好、坏、对、错的判断，变成只将它们看作“脑海中正在播放的文字”。', false);
            appendContinueButton(this.chatMessages, 120);
            this.step = 3;
        } else if (this.step === 3) {
            appendAiMessage(this.chatMessages, '接下来，我们将用一种方法，对这两种思维进行完全相同的解离处理。不偏向积极反刍思维也不否定消极反刍思维，体验“不评判思维”的感觉。', true);
            this.step = 4;
        } else if (this.step === 4) {
            appendAiMessage(this.chatMessages, '我们使用此前学习过的“气球放飞法”作为统一的解离技术，因为它直观且公平，无论想法内容如何，我们给予同样的“放手”过程。', true);
            this.step = 5;
        } else if (this.step === 5) {
            appendAiMessage(this.chatMessages, '现在，请尝试跟随着引导一起进行练习。注意，在放飞这每个气球时，我们的态度、速度和呼吸都是完全一样的。不对任何一个想法有偏爱或厌恶。', true);
            this.step = 6;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '请闭上眼睛，跟随音频引导对一个积极反刍思维进行放飞。', false);
            appendContinueButton(this.chatMessages);
            this.step = 61;
        } else if (this.step === 61) {
            appendSpeechReplayCard(
                this.chatMessages,
                createModule54ReplayCardHtml('积极反刍思维', module54PositiveDemoSpeech),
                module54PositiveDemoSpeech,
                {
                    replayLabel: '再次播放'
                }
            );
            appendContinueButton(this.chatMessages);
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '做得很好，请再次闭上眼睛，跟随音频引导进行消极反刍思维的放飞。', false);
            appendContinueButton(this.chatMessages);
            this.step = 71;
        } else if (this.step === 71) {
            appendSpeechReplayCard(
                this.chatMessages,
                createModule54ReplayCardHtml('消极反刍思维', module54NegativeDemoSpeech),
                module54NegativeDemoSpeech,
                {
                    replayLabel: '再次播放'
                }
            );
            appendContinueButton(this.chatMessages);
            this.step = 8;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '通过刚刚的举例练习，你应该已经明白了如何做。现在，我们再次深入体验，我会引导你再分别对一个积极反刍想法和一个消极反刍想法进行气球放飞练习。', false);
            appendSpecialCard(this.chatMessages, module54PositiveChoiceCardHtml);
            appendButtonGroup(this.chatMessages, ['A', 'B', 'C'], (choice) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module54State.positiveChoice = choice;
                this.step = 9;
                this.onContinue_Module54();
            });
            this.step = 81;
        } else if (this.step === 9) {
            appendAiMessage(this.chatMessages, '现在请深刻想象并体会你选择的这个想法。', false);
            appendContinueButton(this.chatMessages, 60);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '<strong>记录初始情绪值：</strong>想到这个时，你感到的压力或紧绷感有多强？请将得分输入到对话框中（0-10，10为程度最强，请直接输入数字）。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 11;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '现在请闭上眼睛，跟随音频引导进行气球放飞。', false);
            appendSpeechReplayCard(
                this.chatMessages,
                createModule54ReplayCardHtml('积极反刍思维解离练习', module54PositivePracticeSpeech),
                module54PositivePracticeSpeech,
                {
                    replayLabel: '再次播放'
                }
            );
            appendContinueButton(this.chatMessages);
            this.step = 13;
        } else if (this.step === 13) {
            appendAiMessage(this.chatMessages, '<strong>记录解离后情绪值：</strong>现在，那种紧绷感是多少分？请将得分输入到对话框中（0-10，10为程度最强，请直接输入数字）。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 14;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '好的，接下来是消极反刍思维解离练习。', false);
            appendSpecialCard(this.chatMessages, module54NegativeChoiceCardHtml);
            appendButtonGroup(this.chatMessages, ['A', 'B', 'C'], (choice) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module54State.negativeChoice = choice;
                this.step = 16;
                this.onContinue_Module54();
            });
            this.step = 151;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '现在请深刻想象并体会你选择的这个想法。', false);
            appendContinueButton(this.chatMessages, 30);
            this.step = 17;
        } else if (this.step === 17) {
            appendAiMessage(this.chatMessages, '<strong>记录初始情绪值：</strong>想到这个时，你感到的低落或沉重感有多强？请将得分输入到对话框中（0-10，10为程度最强，请直接输入数字）。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 18;
        } else if (this.step === 19) {
            appendAiMessage(this.chatMessages, '现在请闭上眼睛，跟随音频引导进行气球放飞。', false);
            appendSpeechReplayCard(
                this.chatMessages,
                createModule54ReplayCardHtml('消极反刍思维解离练习', module54NegativePracticeSpeech),
                module54NegativePracticeSpeech,
                {
                    replayLabel: '再次播放'
                }
            );
            appendContinueButton(this.chatMessages);
            this.step = 20;
        } else if (this.step === 20) {
            appendAiMessage(this.chatMessages, '<strong>记录解离后情绪值：</strong>现在，那种低落和沉重感是多少分？请将得分输入到对话框中（0-10，10为程度最强，请直接输入数字）。', false);
            this.enableInputForModule(this.chatMessages);
            this.step = 21;
        } else if (this.step === 22) {
            appendAiMessage(this.chatMessages, '以下为你生成了练习前后情绪值变化对比。', false);
            appendSpecialCard(this.chatMessages, createModule54ComparisonCardHtml(this.module54State));
            appendContinueButton(this.chatMessages);
            this.step = 23;
        } else if (this.step === 23) {
            appendAiMessage(this.chatMessages, '观察这个对比。是否发现，无论是积极反刍思维，还是消极反刍思维，在解离后，它们对你情绪的“控制力”都同样减弱了？如果暂时没有变化或者变化很小也没关系，实际生活中经常应用经常练习就会得到改善。', true);
            this.step = 24;
        } else if (this.step === 24) {
            appendAiMessage(this.chatMessages, '通过这次练习，希望你能洞察：我们的痛苦，往往不在于想法是过度积极还是过度消极，而在于我们认同了这些想法，把它们当成了必须遵守的真理或必须对抗的敌人。', true);
            this.step = 25;
        } else if (this.step === 25) {
            appendAiMessage(this.chatMessages, '今天的练习到此结束。你体验了“不评判思维”的初步状态：对大脑产生的各种念头，保持一种平等的、观察者的平静。这种能力，是不被情绪控制的重要条件。记得，你不是你的想法，你是观察想法来去的那片天空。', false);
            this.step = 26;
        }
    },

    handleModule54UserMessage(text) {
        if (this.step === 11) {
            const score = parseScore(text);
            if (score == null) {
                appendAiMessage(this.chatMessages, '请输入0-10之间的整数分值，例如 6。', false);
                this.enableInputForModule(this.chatMessages);
                return;
            }

            this.module54State.positiveBefore = score;
            disableInput(this.inputArea, this.userInput);
            this.step = 12;
            this.onContinue_Module54();
            return;
        }

        if (this.step === 14) {
            const score = parseScore(text);
            if (score == null) {
                appendAiMessage(this.chatMessages, '请输入0-10之间的整数分值，例如 4。', false);
                this.enableInputForModule(this.chatMessages);
                return;
            }

            this.module54State.positiveAfter = score;
            disableInput(this.inputArea, this.userInput);
            this.step = 15;
            this.onContinue_Module54();
            return;
        }

        if (this.step === 18) {
            const score = parseScore(text);
            if (score == null) {
                appendAiMessage(this.chatMessages, '请输入0-10之间的整数分值，例如 7。', false);
                this.enableInputForModule(this.chatMessages);
                return;
            }

            this.module54State.negativeBefore = score;
            disableInput(this.inputArea, this.userInput);
            this.step = 19;
            this.onContinue_Module54();
            return;
        }

        if (this.step === 21) {
            const score = parseScore(text);
            if (score == null) {
                appendAiMessage(this.chatMessages, '请输入0-10之间的整数分值，例如 3。', false);
                this.enableInputForModule(this.chatMessages);
                return;
            }

            this.module54State.negativeAfter = score;
            disableInput(this.inputArea, this.userInput);
            appendContinueButton(this.chatMessages);
            this.step = 22;
        }
    }
};

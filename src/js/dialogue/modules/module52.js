import {
    appendAiMessage,
    appendSpecialCard,
    appendButtonGroup,
    appendContinueButton
} from '../../ui.js';
import {
    appendSpeechReplayCard,
    removeCurrentButtonGroup,
    speakText,
    startCardCountdown
} from './module5Shared.js';

const module52BalloonVideoMp4Path = 'images/week5-balloon.mp4';
const module52BalloonVideoMovPath = 'images/week5-balloon.mov';

const module52PracticeThoughts = {
    想法1: '我绝不能在这个场合说错话，不然就完了。',
    想法2: '这么大的事，我得自己面对，不能麻烦家人。'
};

const module52TechniqueCards = [
    {
        html: `
            <p class="module5-media-title">【方法一：气球放飞法】</p>
            <div class="module5-media-body">
                <p><strong>操作方法：</strong>想象将想法写在气球上，双手握住气球，慢慢松开手，看着气球带着想法飘向远方，逐渐消失。</p>
                <p><strong>适用场景：</strong>消极思维（如“体检指标波动，认为身体有问题”）、过度积极思维（如“我必须做好这个汇报，否则职业发展会受到影响”）。</p>
                <p><strong>注意事项：</strong>在想象过程中保持平静，若情绪波动较大，可暂停后再尝试。</p>
            </div>
        `,
        mediaHtml: `
            <p class="module5-media-title">【方法一：气球放飞法】演示</p>
            <div class="module5-media-body">
                <p>针对“体检指标波动，我的身体是不是有问题了”的想法，把“体检指标波动，我的身体是不是有问题了”写在气球上，握住气球，感受想法的重量，慢慢松手，看着气球飘走，想法也跟着离开。</p>
                <p><strong>动画：</strong></p>
                <video class="module5-video" controls preload="metadata">
                    <source src="${module52BalloonVideoMp4Path}" type="video/mp4">
                    <source src="${module52BalloonVideoMovPath}" type="video/quicktime">
                </video>
            </div>
        `,
        speechText: '针对“体检指标波动，我的身体是不是有问题了”的想法，把“体检指标波动，我的身体是不是有问题了”写在气球上，握住气球，感受想法的重量，慢慢松手，看着气球飘走，想法也跟着离开。',
        onInit(card) {
            const video = card.querySelector('video');
            if (!video) return;
            video.currentTime = 0;
            video.play().catch(() => {});
        }
    },
    {
        html: `
            <p class="module5-media-title">【方法二：角色转换法】</p>
            <div class="module5-media-body">
                <p><strong>操作方法：</strong>把自己的想法想象成朋友的想法，以朋友的身份对“自己”说安慰的话。</p>
                <p><strong>适用场景：</strong>难以跳出自身思维时，尤其适合过度积极反刍（如“我要做到让所有人满意”）。</p>
                <p><strong>注意事项：</strong>回应时需真诚，避免敷衍，真正站在客观角度看待想法。</p>
            </div>
        `,
        mediaHtml: `
            <p class="module5-media-title">【方法二：角色转换法】演示</p>
            <div class="module5-media-body">
                <p>针对“我要做到让所有人满意”的想法，想象成这是朋友的一个想法，如果朋友这么说，我会告诉她“你不用满足所有人的期待，做真实的自己就够了”或者“偶尔没做到没关系，你已经很用心了”。</p>
            </div>
        `,
        speechText: '针对“我要做到让所有人满意”的想法，想象成这是朋友的一个想法，如果朋友这么说，我会告诉她“你不用满足所有人的期待，做真实的自己就够了”或者“偶尔没做到没关系，你已经很用心了”。'
    },
    {
        html: `
            <p class="module5-media-title">【方法三：时间线法】</p>
            <div class="module5-media-body">
                <p><strong>操作方法：</strong>先回想一个过去曾困扰过你的想法，如今再看，它对你的影响已经微乎其微了。现在，试着把自己放在长长的时间轴上，去观察眼前这个正在困扰你的想法，再望向一年后的自己，你会发现，这个想法对未来的影响同样很小。慢慢地，试着放下对它的执着。</p>
                <p><strong>适用场景：</strong>被想法困扰较久时，如长期担心“因为我上次那个失误，永远也翻不了身了”。</p>
                <p><strong>注意事项：</strong>时间线想象需清晰，若难以集中注意力，可先深呼吸再尝试。</p>
            </div>
        `,
        mediaHtml: `
            <p class="module5-media-title">【方法三：时间线法】演示</p>
            <div class="module5-media-body">
                <p>针对“因为那个失误，我永远翻不了身” 的想法：站在时间轴上，注意到现在的“永远翻不了身”是一个念头，看向一年后，生活还在继续，这个担心已经过去了，只是漫长人生线上的一个小点，现在不用被它困住。</p>
            </div>
        `,
        speechText: '针对“因为那个失误，我永远翻不了身” 的想法：站在时间轴上，注意到现在的“永远翻不了身”是一个念头，看向一年后，生活还在继续，这个担心已经过去了，只是漫长人生线上的一个小点，现在不用被它困住。'
    }
];

const module52SummaryTableHtml = `
    <table class="module5-inline-table">
        <tr>
            <th>方法</th>
            <th>操作方法</th>
            <th>适用场景</th>
            <th>注意事项</th>
        </tr>
        <tr>
            <td>气球放飞法</td>
            <td>想象将想法写在气球上，双手握住气球，慢慢松开手，看着气球带着想法飘向远方，逐渐消失。</td>
            <td>消极思维（如“体检指标波动，认为身体有问题”）、过度积极思维（如“我必须做好这个汇报，否则职业发展会受到影响”）。</td>
            <td>想象过程中保持平静，若情绪波动较大，可暂停后再尝试。</td>
        </tr>
        <tr>
            <td>角色转换法</td>
            <td>把自己的想法想象成朋友的想法，以朋友的身份对“自己”说安慰的话。</td>
            <td>难以跳出自身思维时，尤其适合过度积极反刍（如“我要做到让所有人满意”）。</td>
            <td>回应时需真诚，避免敷衍，真正站在客观角度看待想法。</td>
        </tr>
        <tr>
            <td>时间线法</td>
            <td>先回想一个过去曾困扰过你的想法，如今再看，它对你的影响已经微乎其微了。现在，试着把自己放在长长的时间轴上，去观察眼前这个正在困扰你的想法，再望向一年后的自己，你会发现，这个想法对未来的影响同样很小。慢慢地，试着放下对它的执着。</td>
            <td>被想法困扰较久时，如长期担心“因为我上次那个失误，永远也翻不了身了”。</td>
            <td>时间线想象需清晰，若难以集中注意力，可先深呼吸再尝试。</td>
        </tr>
    </table>
`;

const module52PracticeChoiceCardHtml = `
    <div class="module5-options-list">
        <p><strong>【想法1】</strong>我绝不能在这个场合说错话，不然就完了。</p>
        <p><strong>【想法2】</strong>这么大的事，我得自己面对，不能麻烦家人。</p>
    </div>
`;

function getModule52PracticeSpeechText(selectedThought) {
    return module52PracticeThoughts[selectedThought] || module52PracticeThoughts.想法1;
}

export const module52Handlers = {
    onContinue_Module52() {
        if (this.step === 0) {
            appendAiMessage(this.chatMessages, '上周我们学习了认知解离，认识到将想法与事实区分开的重要性。然而在将认知解离应用到实际情境的过程中，你有时可能会发现尽管自己努力了，但想法还总是萦绕在脑边不肯走。', true);
            this.step = 1;
        } else if (this.step === 1) {
            appendAiMessage(this.chatMessages, '这个时候我们需要借助一些具体的技术，帮助我们“放手”想法。', true);
            this.step = 2;
        } else if (this.step === 2) {
            appendAiMessage(this.chatMessages, '今天，我们将介绍三种不同的的技术，可以适用于不同的情境。', true);
            this.step = 3;
        } else if (this.step === 3) {
            this.showModule52TechniqueCard(0, 4);
            this.step = 31;
        } else if (this.step === 4) {
            this.showModule52TechniqueCard(1, 5);
            this.step = 41;
        } else if (this.step === 5) {
            this.showModule52TechniqueCard(2, 6);
            this.step = 51;
        } else if (this.step === 6) {
            appendAiMessage(this.chatMessages, '我们可以根据想法类型和自身状态来灵活地选择技术 ， 例如轻度想法用气球放飞，难跳出自身思维用角色转换，长期困扰用时间线法。后续熟悉了可以慢慢找到对待不同想法时最适合自己的技术。', false);
            appendSpecialCard(this.chatMessages, module52SummaryTableHtml);
            startCardCountdown(this.chatMessages, 60, '可继续', () => {
                appendContinueButton(this.chatMessages);
            });
            this.step = 7;
        } else if (this.step === 7) {
            appendAiMessage(this.chatMessages, '现在，我们来进行简短的实践。我会提供两个常见的想法，请你选择其中一个，并运用你觉得最合适的一种技术进行解离练习。', false);
            appendSpecialCard(this.chatMessages, module52PracticeChoiceCardHtml);
            appendAiMessage(this.chatMessages, '请选择你想进行针对练习的想法。', false);
            appendButtonGroup(this.chatMessages, ['想法1', '想法2'], (choice) => {
                removeCurrentButtonGroup(this.chatMessages);
                this.module52State.selectedThought = choice;
                this.step = 8;
                this.onContinue_Module52();
            });
            this.step = 71;
        } else if (this.step === 8) {
            appendAiMessage(this.chatMessages, '好的，针对这个想法，我们先把三种解离方法都尝试一下。然后感受一下哪个对自己最有效。如果你准备好了，请跟随下一步的引导一起做吧。', true);
            this.step = 9;
        } else if (this.step === 9) {
            const practiceThought = this.escapeHtml(getModule52PracticeSpeechText(this.module52State.selectedThought));
            const text = `首先是气球法。请闭上眼睛。想象“${practiceThought}”这句话写在一个气球上…感受一下握着它的感觉…现在，慢慢地、有意识地松开你的手指…看着它飘走…`;
            appendAiMessage(this.chatMessages, text, false);
            speakText(this.chatMessages, text, { rate: 0.9, fallbackMs: 30000 });
            appendContinueButton(this.chatMessages, 45);
            this.step = 10;
        } else if (this.step === 10) {
            appendAiMessage(this.chatMessages, '很好，接下来我们试试角色转化法。', true);
            this.step = 11;
        } else if (this.step === 11) {
            const practiceThought = this.escapeHtml(getModule52PracticeSpeechText(this.module52State.selectedThought));
            const text = `假设你最好的朋友对你说：“${practiceThought}”你会怎么安慰他？请在心里或轻声说出你的回答。`;
            appendAiMessage(this.chatMessages, text, false);
            speakText(this.chatMessages, text, { rate: 0.9, fallbackMs: 30000 });
            appendContinueButton(this.chatMessages, 45);
            this.step = 12;
        } else if (this.step === 12) {
            appendAiMessage(this.chatMessages, '很好，接下来我们试试时间线法。', true);
            this.step = 13;
        } else if (this.step === 13) {
            const selectedThought = getModule52PracticeSpeechText(this.module52State.selectedThought);
            const text = `现在，想象自己站在时间轴上，感受一下这个“${selectedThought}”的想法。然后，向前走到“一年后”的位置，回头看现在的这个想法——一年后的你，会觉得这个要求还像现在这么绝对和沉重吗？试着感受一下那种时间带来的距离感。`;
            appendAiMessage(this.chatMessages, text, false);
            speakText(this.chatMessages, text, { rate: 0.9, fallbackMs: 30000 });
            appendContinueButton(this.chatMessages, 45);
            this.step = 14;
        } else if (this.step === 14) {
            appendAiMessage(this.chatMessages, '可以想一想，经过比较，你觉得哪个方法更有效，更适合这个场景呢？', true);
            this.step = 15;
        } else if (this.step === 15) {
            appendAiMessage(this.chatMessages, '今天，我们为“认知解离”这个工具箱添置了三件新工具：用气球放飞、角色转换、时间线来完成解离。没有一种技术是万能的。熟练的关键，在于了解每种工具的特点，并在生活中练习和匹配。 当下次再有想法萦绕不去时，不妨问问自己：“现在，我用哪种方法能更好地与它保持距离？”', true);
            this.step = 16;
        } else if (this.step === 16) {
            appendAiMessage(this.chatMessages, '我们明天再见。', false);
            this.step = 17;
        }
    },

    showModule52TechniqueCard(index, nextStep) {
        const technique = module52TechniqueCards[index];
        appendSpecialCard(this.chatMessages, technique.html);
        startCardCountdown(this.chatMessages, 30, '可演示', () => {
            appendButtonGroup(this.chatMessages, ['演示'], () => {
                removeCurrentButtonGroup(this.chatMessages);
                this.showModule52TechniqueDemo(index);
                appendContinueButton(this.chatMessages);
                this.step = nextStep;
            });
        });
    },

    showModule52TechniqueDemo(index) {
        const technique = module52TechniqueCards[index];
        appendSpeechReplayCard(
            this.chatMessages,
            technique.mediaHtml,
            technique.speechText,
            {
                replayLabel: '再次播放AI音频',
                speechOptions: { rate: 0.9 },
                onInit: technique.onInit
            }
        );
    }
};

export interface Env {
    DEEPSEEK_API_KEY: string;
    DEEPSEEK_BASE_URL?: string;
    DEEPSEEK_MODEL?: string;
    DEEPSEEK_TIMEOUT_MS?: string;
    CORS_ORIGIN?: string;
}

interface AiHookRequestBody {
    sessionId?: string;
    moduleId?: string;
    step?: number | string | null;
    variant?: string | null;
    userInput?: string;
    context?: Record<string, unknown>;
}

interface HookVariant {
    key: string;
    systemPrompt: string;
}

interface HookDefinition {
    hookId: string;
    moduleId: string;
    version: string;
    provider: 'deepseek';
    model: string;
    temperature: number;
    maxOutputChars: number;
    fallbackKey: string;
    defaultVariant: string;
    userPromptTemplate: string;
    variants: HookVariant[];
}

const USER_PROMPT_TEMPLATE = [
    '请根据以下结构化上下文，为当前节点生成一段回复：',
    '',
    '- moduleId: {{moduleId}}',
    '- hookId: {{hookId}}',
    '- step: {{step}}',
    '- variant: {{variant}}',
    '- userInput: {{userInput}}',
    '- contextJson: {{contextJson}}',
    '',
    '输出要求：',
    '- 输出一段可直接展示给用户的中文回复',
    '- 不要附加说明',
    '- 不要输出标题'
].join('\n');

const fallbackMessages: Record<string, string> = {
    module11_intro_default: '谢谢你的分享。你带来的这些经历和特点都值得被看见，我们会在接下来的练习里慢慢展开，不需要急着把自己说得很完整。',
    module13_body_sensation_default: '你已经注意到身体里的感觉，或暂时没有特别明显的变化，这都是身体在传递给你的信息。',
    module13_thought_default: '能看见这些小念头本身就很重要。很多人在这样的时刻都会有类似的想法，我们可以先不评判它。',
    module22_case_emotion_default: '谢谢你的分享。你提到的这一点很重要，这些情绪本来就很容易被忽略。除此之外，很多时候这些反应背后还会藏着更多担心、无助或渴望被理解的部分。',
    module32_positive_rumination_default: '谢谢你愿意分享这些想法和经历。无论你现在看得清不清楚，这都已经是在靠近自己真实感受的一步。',
    module42_thought_train_default: '感谢你的分享。很多人都会遇到类似的“想法火车”，你能观察到它，本身就是很重要的觉察。',
    module42_boarding_impulse_default: '感谢你的分享。有冲动想上车是完全正常的，关键是最终选择留在站台观察。',
    module44_label_feedback_default: '谢谢你的回答。给想法贴标签时，关键是描述它的核心特征，而不是评价它好不好。你可以继续试着往“担心未来”“绝对化预测”“自我批判”这类描述性方向去想。',
    module46_supporter_response_default: '感谢你的回应。你已经在尝试站到支持者的位置上理解对方了，这本身就是很重要的一步；如果你的回应里提到了对方的痛苦、情绪，或开始尝试把想法贴上标签，这些都很贴近认知解离的方向。<br><br>这里是一些优化建议与示范：“事实是，你经历了一次重大的财务损失，这带来了巨大的痛苦和压力。而‘我这辈子都翻不了身’这个想法，是一个在极度痛苦时很容易产生的、关于未来的‘长期绝望预测’。我们的头脑在震惊中，常常会编制出关于整个未来的恐怖故事，但这不等于故事就是真的。”',
    module62_value_desire_default: '你看见了这份在乎，很珍贵。很多压力，正是在重要渴望受挑战时发出的信号。我们可以再问问自己：基于这份渴望，我现在可以为自己做的一件小事是什么？'
};

const hooks: Record<string, HookDefinition> = {
    'module-1-1.intro-reply': {
        hookId: 'module-1-1.intro-reply',
        moduleId: '1-1',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.3,
        maxOutputChars: 120,
        fallbackKey: 'module11_intro_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是心理弹性训练项目中的温和陪伴者。

你的任务只是在 1-1 模块的“自我介绍后第一段回应”这个节点中，生成一段简短、温和、非评判的回应。

必须遵守：
- 只回应当前用户刚刚提供的自我介绍内容。
- 核心目标是肯定独特性、建立联结感、传递安全氛围。
- 允许用户没有完整回答家乡、习惯、爱好。
- 如果用户答非所问或表达不想回答，应先承接内容，再明确允许跳过。
- 不要推进课程流程。
- 不要新增新的问题。
- 不要解释课程理论。
- 不要生成超过 120 字的内容。
- 不要诊断、说教或给出治疗建议。`
        }]
    },
    'module-1-3.body-sensation-reflection': {
        hookId: 'module-1-3.body-sensation-reflection',
        moduleId: '1-3',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 160,
        fallbackKey: 'module13_body_sensation_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是一位温和、不评判的情绪教练。
当前任务只是在 1-3 模块里，针对用户描述的身体感觉，生成一句简短回应。

必须遵守：
- 先直接复述、承接或肯定用户描述的身体感觉。
- 如果用户表示“没什么特别感觉”“没有感觉”“说不清”，要正常化这也是一种体验。
- 可以把这种感觉称为“身体对这件事的自然反应”或“身体传递给你的信息”。
- 不追问。
- 不建议用户下一步怎么做。
- 不分析事件本身。
- 不解释理论。
- 不输出超过 100 字。
- 语气平和、温暖、稳定，不过度夸张。`
        }]
    },
    'module-1-3.thought-reflection': {
        hookId: 'module-1-3.thought-reflection',
        moduleId: '1-3',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 110,
        fallbackKey: 'module13_thought_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是一位温和、接纳的情绪陪伴者。
当前任务只是在 1-3 模块里，针对用户描述的小念头，生成一句简短回应。

必须遵守：
- 先直接复述、承接或认可用户提到的念头、担忧、自责或怀疑。
- 将这种念头正常化，可以表达“很多人都会有类似感受”或“这是很自然的反应”。
- 传递“可以先不评判它”“先和它待一会儿”的态度。
- 不分析念头的对错。
- 不着急解决问题。
- 不给建议。
- 不追问。
- 不解释理论。
- 不输出超过 110 字。
- 语气温和、平静，像陪对方一起看着念头飘过。`
        }]
    },
    'module-2-2.case-emotion-feedback': {
        hookId: 'module-2-2.case-emotion-feedback',
        moduleId: '2-2',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.3,
        maxOutputChars: 150,
        fallbackKey: 'module22_case_emotion_default',
        defaultVariant: 'zhangtian',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [
            {
                key: 'zhangtian',
                systemPrompt: `你是一名温和、支持性的心理陪伴助手。

当前任务是：在 2-2 模块中，针对“张天”案例下用户回答的“真正需要被看见的情绪是什么”，生成一段简短回应。

必须遵守：
- 先感谢用户的分享。
- 结合用户提到的内容进行肯定。
- 可以温和补充一些可能的参考情绪，但不要否定用户。
- 参考方向包括：对未来失业的恐惧、让家人失望的担忧、对自我价值的怀疑、被同龄人比较的压力、渴望被理解并被允许脆弱。
- 回复不超过 150 字。
- 不要推进后续流程。
- 不要输出分析过程。`
            },
            {
                key: 'xiaolin',
                systemPrompt: `你是一名温和、支持性的心理陪伴助手。

当前任务是：在 2-2 模块中，针对“晓琳”案例下用户回答的“真正需要被看见的情绪是什么”，生成一段简短回应。

必须遵守：
- 先感谢用户的分享。
- 结合用户提到的内容进行肯定。
- 可以温和补充一些可能的参考情绪，但不要否定用户。
- 参考方向包括：对沟通失败的恐惧、对关系恶化的无助感、孤独、渴望亲近却不敢表达的受伤。
- 回复不超过 150 字。
- 不要推进后续流程。
- 不要输出分析过程。`
            },
            {
                key: 'jiayi',
                systemPrompt: `你是一名温和、支持性的心理陪伴助手。

当前任务是：在 2-2 模块中，针对“嘉怡”案例下用户回答的“真正需要被看见的情绪是什么”，生成一段简短回应。

必须遵守：
- 先感谢用户的分享。
- 结合用户提到的内容进行肯定。
- 可以温和补充一些可能的参考情绪，但不要否定用户。
- 参考方向包括：对项目延期的担忧、害怕让人失望的羞耻感、不敢求助的孤独感、被“能力很强”期待束缚住的压力。
- 回复不超过 150 字。
- 不要推进后续流程。
- 不要输出分析过程。`
            }
        ]
    },
    'module-3-2.positive-rumination-feedback': {
        hookId: 'module-3-2.positive-rumination-feedback',
        moduleId: '3-2',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 120,
        fallbackKey: 'module32_positive_rumination_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是心理学课程《过度积极反刍》中的陪伴型 AI 助教。
当前任务只是在 3-2 模块的最后一个反思节点里，针对用户分享的个人经历，生成一段简短反馈。

必须遵守：
- 只回应当前这一次用户输入。
- 优先结合结构化上下文中的 classification 来组织回应。
- 如果 classification 是 recognized_pattern，核心方向是肯定用户已经识别出“不允许负面情绪”“强行正向思考”或“压抑真实感受”的模式。
- 如果 classification 是 uncertain，核心方向是正常化“不确定”。
- 如果 classification 是 shared_example，核心方向是感谢用户愿意分享具体经历，并自然引向“可以试着说出四步法”。
- 不分析用户对错。
- 不说教。
- 不诊断。
- 不生成超过 120 字。
- 语气温和、支持、非评判。`
        }]
    },
    'module-4-2.thought-train-reflection': {
        hookId: 'module-4-2.thought-train-reflection',
        moduleId: '4-2',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 150,
        fallbackKey: 'module42_thought_train_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是一位正念冥想引导师。
当前任务只是在 4-2 模块里，针对用户描述“刚才冥想中看到了哪些想法火车”，生成一段简短回应。

必须遵守：
- 先认可用户愿意分享这些内在体验。
- 如果 classification 是 described_trains，简要复述或归纳用户提到的典型想法，让用户感到被听见。
- 如果 classification 是 empty_like，回应“没关系，第一次还不太适应也很正常”。
- 不主动给下一步行动建议。
- 不解释理论。
- 不输出超过 150 字。
- 语气温暖、接纳、不评判。`
        }]
    },
    'module-4-2.boarding-impulse-reflection': {
        hookId: 'module-4-2.boarding-impulse-reflection',
        moduleId: '4-2',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 100,
        fallbackKey: 'module42_boarding_impulse_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是一位正念冥想引导师。
当前任务只是在 4-2 模块里，针对用户描述“有没有想跟着某列想法火车走的冲动”，生成一段简短回应。

必须遵守：
- 开头第一句必须表达感谢，例如“感谢你的分享。”
- 如果 classification 是 has_impulse，明确表达“有冲动想上车是完全正常的，关键是最终选择留在站台观察。”
- 如果 classification 是 no_impulse，明确表达“即使没有感觉到明显的冲动，这也是完全正常的。关键是你能觉察到火车本身。”
- 如果 classification 是 uncertain，承接“说不清也是一种真实体验”。
- 不分析太多。
- 不追问。
- 不给建议。
- 不输出超过 100 字。
- 语气温和、接纳、不评判。`
        }]
    },
    'module-4-4.label-feedback': {
        hookId: 'module-4-4.label-feedback',
        moduleId: '4-4',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 140,
        fallbackKey: 'module44_label_feedback_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是一位正念训练引导师。
当前任务只是在 4-4 模块里，针对用户为某个案例输入的“想法标签”，生成一段简短回应。

必须遵守：
- 先肯定用户愿意尝试给想法贴标签。
- 核心目标是帮助用户区分“描述性标签”和“评判性标签”。
- 如果 classification 是 descriptive_label，肯定用户已经在朝“描述想法特征而不是评价想法好坏”的方向靠近。
- 如果 classification 是 judgmental_label，温和指出这个标签里带有评价，并提醒可以换成更客观的描述。
- 如果 classification 是 off_topic_or_unclear，温和说明这次更希望用户直接给这个想法贴一个“标签”。
- 不要批评用户。
- 不要推进到下一步流程。
- 不要解释太多理论。
- 不输出超过 140 字。
- 语气温暖、接纳、不评判。`
        }]
    },
    'module-4-6.supporter-response-feedback': {
        hookId: 'module-4-6.supporter-response-feedback',
        moduleId: '4-6',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 420,
        fallbackKey: 'module46_supporter_response_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是一位基于认知解离原则的沟通分析者。
当前任务只是在 4-6 模块里，针对用户扮演“支持者”后的回应，生成一段分析反馈。

必须严格遵守以下结构：
- 第一段先感谢用户的回答，并指出其回应中做得好的地方。
- 第二段必须另起一段，两段之间请使用 <br><br> 分隔。
- 第二段用“这里是一些优化建议与示范：”开头。
- 然后给出下面这段标准答案，允许只做极轻微措辞调整，但核心内容必须保留：
“事实是，你经历了一次重大的财务损失，这带来了巨大的痛苦和压力。而‘我这辈子都翻不了身’这个想法，是一个在极度痛苦时很容易产生的、关于未来的‘长期绝望预测’。我们的头脑在震惊中，常常会编制出关于整个未来的恐怖故事，但这不等于故事就是真的。”

其它要求：
- 优先结合 contextJson 里的结构化线索来决定第一段如何肯定用户。
- 不要把重点放在批评用户哪里不足。
- 不要输出项目符号或标题。
- 不要展开长篇理论解释。
- 不要改变成别的案例。
- 不输出超过 420 字。
- 语气温暖、具体、不评判。`
        }]
    },
    'module-6-2.value-desire-insight': {
        hookId: 'module-6-2.value-desire-insight',
        moduleId: '6-2',
        version: 'v1',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        temperature: 0.2,
        maxOutputChars: 100,
        fallbackKey: 'module62_value_desire_default',
        defaultVariant: 'default',
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        variants: [{
            key: 'default',
            systemPrompt: `你是一位充满关怀的正念观察者。
用户刚刚读了一段他人的痛苦经历，并尝试洞察那个当事人在那段经历中“内心最深处的渴望或在乎的是什么”。

请根据用户输入的内容，按以下规则回复：
- 先肯定用户的洞察。
- 要用具体的方式肯定用户捕捉到的渴望。
- 然后简要解释这种渴望与当事人痛苦之间的联系。
- 最后用一个温和的开放式问题，邀请用户基于这份渴望，思考下一步可以做的一件小事。
- 尽量控制在 60 到 90 个汉字，不要写长。
- 语气温暖、沉稳、不评判。
- 避免说教。
- 不要输出标题。
- 不要输出项目符号。
- 如果用户输入比较模糊，也仍然先温和肯定其已经在尝试看见更深层的在乎。`
        }]
    }
};

function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...headers
        }
    });
}

function parseAllowedOrigins(value: string | undefined): string[] {
    const rawValue = String(value || '').trim();
    if (!rawValue) return ['*'];
    return rawValue.split(',').map((item) => item.trim()).filter(Boolean);
}

function buildCorsHeaders(request: Request, env: Env): HeadersInit {
    const requestOrigin = request.headers.get('Origin') || '';
    const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);
    const allowsAllOrigins = allowedOrigins.includes('*');
    const responseOrigin = allowsAllOrigins
        ? '*'
        : allowedOrigins.includes(requestOrigin)
            ? requestOrigin
            : allowedOrigins[0] || '';

    return {
        Vary: 'Origin',
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}

function sanitizeWhitespace(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

function validateReplyText(text: string, maxOutputChars: number): { ok: boolean; sanitizedText: string } {
    const sanitizedText = sanitizeWhitespace(String(text || ''));
    return {
        ok: Boolean(sanitizedText) && sanitizedText.length <= maxOutputChars,
        sanitizedText
    };
}

function selectVariant(hook: HookDefinition, variant: string | null | undefined): HookVariant {
    return hook.variants.find((item) => item.key === variant)
        || hook.variants.find((item) => item.key === hook.defaultVariant)
        || hook.variants[0];
}

function fillTemplate(template: string, hook: HookDefinition, body: AiHookRequestBody, selectedVariant: string): string {
    const contextJson = JSON.stringify(body.context || {}, null, 2);
    return template
        .replaceAll('{{moduleId}}', String(body.moduleId || hook.moduleId))
        .replaceAll('{{hookId}}', hook.hookId)
        .replaceAll('{{step}}', String(body.step ?? ''))
        .replaceAll('{{variant}}', selectedVariant)
        .replaceAll('{{userInput}}', String(body.userInput || '').trim())
        .replaceAll('{{contextJson}}', contextJson);
}

function getTimeoutMs(env: Env): number {
    const parsed = Number.parseInt(String(env.DEEPSEEK_TIMEOUT_MS || ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

async function callDeepSeek(env: Env, hook: HookDefinition, variant: HookVariant, userPrompt: string): Promise<string> {
    if (!env.DEEPSEEK_API_KEY) {
        throw new Error('Missing DEEPSEEK_API_KEY secret.');
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), getTimeoutMs(env));

    try {
        const response = await fetch(`${env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: env.DEEPSEEK_MODEL || hook.model,
                temperature: hook.temperature,
                messages: [
                    { role: 'system', content: variant.systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            }),
            signal: abortController.signal
        });

        if (!response.ok) {
            throw new Error(`DeepSeek request failed with ${response.status}: ${await response.text()}`);
        }

        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) {
            throw new Error('DeepSeek returned empty text.');
        }
        return text;
    } finally {
        clearTimeout(timeout);
    }
}

async function handleHookRequest(request: Request, env: Env, hookId: string, corsHeaders: HeadersInit): Promise<Response> {
    const hook = hooks[hookId];
    if (!hook) {
        return jsonResponse({ error: `Unknown hookId: ${hookId}` }, 404, corsHeaders);
    }

    let body: AiHookRequestBody;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: 'Invalid JSON body.' }, 400, corsHeaders);
    }

    const userInput = String(body.userInput || '').trim();
    if (!userInput) {
        return jsonResponse({ error: 'Missing required field: userInput' }, 400, corsHeaders);
    }

    const variant = selectVariant(hook, body.variant);
    let replyText = fallbackMessages[hook.fallbackKey];
    let fallbackUsed = true;

    try {
        const userPrompt = fillTemplate(hook.userPromptTemplate, hook, body, variant.key);
        const completion = await callDeepSeek(env, hook, variant, userPrompt);
        const validation = validateReplyText(completion, hook.maxOutputChars);
        if (validation.ok) {
            replyText = validation.sanitizedText;
            fallbackUsed = false;
        }
    } catch (error) {
        console.warn('AI hook fallback used', hookId, error instanceof Error ? error.message : error);
    }

    return jsonResponse({
        moduleId: hook.moduleId,
        hookId: hook.hookId,
        replyText,
        fallbackUsed,
        promptVersion: hook.version,
        provider: hook.provider,
        model: env.DEEPSEEK_MODEL || hook.model,
        metadata: {
            variant: variant.key,
            runtime: 'cloudflare-worker'
        }
    }, 200, corsHeaders);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const corsHeaders = buildCorsHeaders(request, env);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const url = new URL(request.url);

        if (request.method === 'GET' && url.pathname === '/health') {
            return jsonResponse({
                ok: true,
                app: 'resilience-cloudflare-worker',
                version: 'v1',
                provider: 'deepseek',
                runtime: 'cloudflare-workers',
                hooks: Object.keys(hooks),
                timestamp: new Date().toISOString()
            }, 200, corsHeaders);
        }

        const hookMatch = url.pathname.match(/^\/api\/v1\/ai\/hooks\/([^/]+)$/);
        if (request.method === 'POST' && hookMatch) {
            return handleHookRequest(request, env, decodeURIComponent(hookMatch[1]), corsHeaders);
        }

        return jsonResponse({ error: 'Not found.' }, 404, corsHeaders);
    }
};

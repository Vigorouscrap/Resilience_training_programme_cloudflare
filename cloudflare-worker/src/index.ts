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
    systemPrompt: string;
    userPromptTemplate: string;
}

const fallbackMessages: Record<string, string> = {
    module11_intro_default: '谢谢你的分享。你带来的这些经历和特点都值得被看见，我们会在接下来的练习里慢慢展开，不需要急着把自己说得很完整。'
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
        systemPrompt: [
            '你是心理弹性训练项目中的温和引导员。',
            '你只在 1-1 自我介绍后的指定节点，生成一段简短、非评判、支持性的回应。',
            '不要诊断用户，不要提出长篇建议，不要推进课程后续流程。',
            '回复应使用中文，长度控制在 80 字以内，语气自然、稳定、接纳。'
        ].join('\n'),
        userPromptTemplate: [
            '当前模块：{{moduleId}}',
            '当前 hook：{{hookId}}',
            '用户输入：{{userInput}}',
            '上下文：{{contextJson}}',
            '',
            '请基于用户输入，生成一段短回应。'
        ].join('\n')
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

function fillTemplate(template: string, hook: HookDefinition, body: AiHookRequestBody): string {
    const contextJson = JSON.stringify(body.context || {}, null, 2);
    return template
        .replaceAll('{{moduleId}}', String(body.moduleId || hook.moduleId))
        .replaceAll('{{hookId}}', hook.hookId)
        .replaceAll('{{userInput}}', String(body.userInput || '').trim())
        .replaceAll('{{contextJson}}', contextJson);
}

function getTimeoutMs(env: Env): number {
    const parsed = Number.parseInt(String(env.DEEPSEEK_TIMEOUT_MS || ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

async function callDeepSeek(env: Env, hook: HookDefinition, userPrompt: string): Promise<string> {
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
                    { role: 'system', content: hook.systemPrompt },
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

    let replyText = fallbackMessages[hook.fallbackKey];
    let fallbackUsed = true;

    try {
        const userPrompt = fillTemplate(hook.userPromptTemplate, hook, body);
        const completion = await callDeepSeek(env, hook, userPrompt);
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
            variant: body.variant || hook.defaultVariant,
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

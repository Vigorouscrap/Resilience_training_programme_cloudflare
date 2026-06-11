import { requestAiReply } from '../services/aiReplyClient.js';

const SESSION_STORAGE_KEY = '__resilience_ai_session_id__';

function getOrCreateSessionId() {
    const storedValue = globalThis.sessionStorage?.getItem(SESSION_STORAGE_KEY);
    if (storedValue) return storedValue;

    const nextValue = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    globalThis.sessionStorage?.setItem(SESSION_STORAGE_KEY, nextValue);
    return nextValue;
}

export async function runAiHook({
    hookId,
    moduleId,
    step,
    variant,
    userInput,
    context = {},
    fallbackText
}) {
    const sessionId = getOrCreateSessionId();

    try {
        return await requestAiReply(hookId, {
            sessionId,
            moduleId,
            step,
            variant,
            userInput,
            context
        });
    } catch (error) {
        return {
            sessionId,
            moduleId,
            hookId,
            replyText: fallbackText,
            fallbackUsed: true,
            promptVersion: 'frontend-fallback',
            provider: 'frontend',
            model: 'fallback',
            metadata: {
                error: error instanceof Error ? error.message : 'unknown_error'
            }
        };
    }
}

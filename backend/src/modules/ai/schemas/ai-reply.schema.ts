import type { AiHookRequestBody } from '../../../shared/types/ai.js';

export function validateAiHookRequestBody(input: unknown): AiHookRequestBody {
    if (!input || typeof input !== 'object') {
        throw new Error('AI hook request body must be an object.');
    }

    const payload = input as Record<string, unknown>;
    const moduleId = String(payload.moduleId ?? '').trim();
    const userInput = String(payload.userInput ?? '').trim();
    const sessionId = String(payload.sessionId ?? '').trim();
    const variant = String(payload.variant ?? '').trim();
    const stepValue = payload.step;
    const context = (payload.context && typeof payload.context === 'object')
        ? payload.context as Record<string, unknown>
        : {};

    if (!moduleId) {
        throw new Error('moduleId is required.');
    }
    if (!userInput) {
        throw new Error('userInput is required.');
    }

    const step = typeof stepValue === 'number' && Number.isFinite(stepValue)
        ? stepValue
        : undefined;

    return {
        sessionId: sessionId || undefined,
        moduleId,
        step,
        variant: variant || undefined,
        userInput,
        context
    };
}

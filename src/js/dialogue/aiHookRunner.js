import { requestAiReply } from '../services/aiReplyClient.js';
import { getOrCreateClientSessionId, getParticipantSession } from '../services/participantSession.js';

export async function runAiHook({
    hookId,
    moduleId,
    step,
    variant,
    userInput,
    context = {},
    fallbackText
}) {
    const participantSession = getParticipantSession();
    const sessionId = participantSession?.sessionId || getOrCreateClientSessionId();
    const participantCode = participantSession?.participantCode;

    try {
        return await requestAiReply(hookId, {
            participantCode,
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

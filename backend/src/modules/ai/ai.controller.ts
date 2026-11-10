import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AiService } from './ai.service.js';
import { validateAiHookRequestBody } from './schemas/ai-reply.schema.js';
import type { ResearchService } from '../../../../shared-contract/research.mjs';

interface HookRouteParams {
    hookId: string;
}

export async function registerAiRoutes(app: FastifyInstance, aiService: AiService, researchService: ResearchService): Promise<void> {
    app.post('/api/v1/ai/hooks/:hookId', async (
        request: FastifyRequest<{ Params: HookRouteParams }>,
        reply: FastifyReply
    ) => {
        try {
            const hookId = String(request.params.hookId || '').trim();
            const body = validateAiHookRequestBody(request.body);

            const response = await aiService.generateHookReply(hookId, {
                sessionId: body.sessionId || '',
                moduleId: body.moduleId,
                step: body.step ?? null,
                variant: body.variant ?? null,
                userInput: body.userInput,
                context: body.context ?? {}
            });

            if (body.participantCode && body.sessionId) {
                try {
                    await researchService.recordAiCallEvent({
                        ...response, participantCode: body.participantCode, sessionId: body.sessionId,
                        variant: body.variant || '', userInput: body.userInput
                    });
                } catch {
                    app.log.warn('AI research log was not persisted');
                }
            }
            reply.code(200).send(response);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown request error.';
            const unknownHook = message.startsWith('Unknown AI hook:');
            const moduleMismatch = message.startsWith('Hook "') && message.includes('does not belong to module');
            reply.code(unknownHook ? 404 : 400).send({
                error: message,
                code: unknownHook
                    ? 'UNKNOWN_HOOK'
                    : moduleMismatch
                        ? 'HOOK_MODULE_MISMATCH'
                        : 'VALIDATION_ERROR'
            });
        }
    });
}

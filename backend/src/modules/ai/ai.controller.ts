import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AiService } from './ai.service.js';
import { validateAiHookRequestBody } from './schemas/ai-reply.schema.js';

interface HookRouteParams {
    hookId: string;
}

export async function registerAiRoutes(app: FastifyInstance, aiService: AiService): Promise<void> {
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

            reply.code(200).send(response);
        } catch (error) {
            reply.code(400).send({
                error: error instanceof Error ? error.message : 'Unknown request error.'
            });
        }
    });
}

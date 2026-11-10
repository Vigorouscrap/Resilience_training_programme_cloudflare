import type { FastifyInstance } from 'fastify';
import { API_PATHS } from '../../../shared-contract/index.mjs';
import { handleResearchRequest, type ResearchService } from '../../../shared-contract/research.mjs';

export async function registerResearchRoutes(app: FastifyInstance, service: ResearchService): Promise<void> {
    const paths = [API_PATHS.participantStart, API_PATHS.moduleRunStart, API_PATHS.moduleRunComplete, API_PATHS.moduleRunReset, API_PATHS.events, API_PATHS.conversationReplay];
    for (const path of [...paths, API_PATHS.export]) {
        app.route({
            method: path === API_PATHS.export ? 'GET' : 'POST', url: path,
            async handler(request, reply) {
                const headers = new Headers();
                for (const key of ['authorization', 'user-agent', 'content-type']) {
                    const value = request.headers[key];
                    if (typeof value === 'string') headers.set(key, value);
                }
                const response = await handleResearchRequest(new Request(`http://localhost${request.url}`, {
                    method: request.method, headers,
                    ...(request.method === 'POST' ? { body: JSON.stringify(request.body) } : {})
                }), service);
                if (!response) return reply.code(404).send({ error: 'Not found.', code: 'NOT_FOUND' });
                response.headers.forEach((value, key) => reply.header(key, value));
                return reply.code(response.status).send(Buffer.from(await response.arrayBuffer()));
            }
        });
    }
}

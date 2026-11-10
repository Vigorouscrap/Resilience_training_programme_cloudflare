import Fastify from 'fastify';
import { loadEnv } from './config/env.js';
import { buildRuntimeConfig } from './config/runtime.js';
import { registerAiRoutes } from './modules/ai/ai.controller.js';
import { AiService } from './modules/ai/ai.service.js';
import { DeepSeekProvider } from './modules/ai/providers/deepseek.provider.js';
import { ModuleContextBuilder } from './modules/module-state/module-context.builder.js';
import { ModuleStateService } from './modules/module-state/module-state.service.js';
import { SessionRepository } from './modules/sessions/session.repository.js';
import { SessionService } from './modules/sessions/session.service.js';
import { listHookDefinitions } from './modules/ai/prompt-registry/index.js';
import { ResearchService, type ResearchDatabase } from '../../shared-contract/research.mjs';
import { createPostgresDatabase, createResearchPool } from './research/postgres.js';
import { registerResearchRoutes } from './research/routes.js';

export async function createApp(options: { researchDatabase?: ResearchDatabase | null } = {}) {
    const env = loadEnv();
    const runtime = buildRuntimeConfig(env);
    const app = Fastify({
        logger: env.nodeEnv !== 'test',
        bodyLimit: 4 * 1024 * 1024
    });
    const pool = options.researchDatabase === undefined ? createResearchPool(env.databaseUrl) : null;
    const researchService = new ResearchService(pool ? createPostgresDatabase(pool) : options.researchDatabase || null, env);
    app.addHook('onClose', async () => { if (pool) await pool.end(); });
    app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Not found.', code: 'NOT_FOUND' }));
    app.setErrorHandler((error, _request, reply) => {
        const status = (error as { statusCode?: number }).statusCode || 500;
        reply.code(status).send({ error: status < 500 ? 'Invalid request.' : 'Request failed.', code: status < 500 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' });
    });

    const sessionRepository = new SessionRepository();
    const sessionService = new SessionService(sessionRepository);
    const moduleContextBuilder = new ModuleContextBuilder();
    const moduleStateService = new ModuleStateService();
    const provider = new DeepSeekProvider(env);
    const aiService = new AiService(
        env,
        provider,
        sessionService,
        moduleContextBuilder,
        moduleStateService
    );

    app.get('/health', async () => ({
        ok: true,
        app: runtime.appName,
        version: runtime.apiVersion,
        provider: env.aiProvider,
        runtime: 'fastify-node',
        hooks: listHookDefinitions().map((hook) => hook.hookId),
        nodeEnv: env.nodeEnv,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    }));

    app.addHook('onRequest', async (request, reply) => {
        const requestOrigin = String(request.headers.origin || '').trim();
        const allowsAllOrigins = env.corsOrigins.includes('*');
        const matchedOrigin = requestOrigin && env.corsOrigins.includes(requestOrigin)
            ? requestOrigin
            : '';
        const responseOrigin = allowsAllOrigins
            ? '*'
            : matchedOrigin || env.corsOrigins[0] || 'http://localhost:8000';

        reply.header('Vary', 'Origin');
        reply.header('Access-Control-Allow-Origin', responseOrigin);
        reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (request.method === 'OPTIONS') {
            return reply.code(204).send();
        }
    });

    await registerAiRoutes(app, aiService, researchService);
    await registerResearchRoutes(app, researchService);

    return {
        app,
        env,
        runtime
    };
}

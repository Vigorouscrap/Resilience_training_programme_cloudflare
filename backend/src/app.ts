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

export async function createApp() {
    const env = loadEnv();
    const runtime = buildRuntimeConfig(env);
    const app = Fastify({
        logger: env.nodeEnv !== 'test'
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

    await registerAiRoutes(app, aiService);

    return {
        app,
        env,
        runtime
    };
}

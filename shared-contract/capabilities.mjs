export const CONTRACT_CAPABILITIES = Object.freeze({
    health: Object.freeze({ method: 'GET', path: '/health', milestone: 'M2' }),
    aiHooks: Object.freeze({ method: 'POST', path: '/api/v1/ai/hooks/:hookId', milestone: 'M2' }),
    participantStart: Object.freeze({ method: 'POST', path: '/api/v1/participants/start', milestone: 'M3' }),
    moduleRunStart: Object.freeze({ method: 'POST', path: '/api/v1/module-runs/start', milestone: 'M3' }),
    moduleRunComplete: Object.freeze({ method: 'POST', path: '/api/v1/module-runs/complete', milestone: 'M3' }),
    moduleRunReset: Object.freeze({ method: 'POST', path: '/api/v1/module-runs/reset', milestone: 'M3' }),
    events: Object.freeze({ method: 'POST', path: '/api/v1/events', milestone: 'M3' }),
    conversationReplay: Object.freeze({ method: 'POST', path: '/api/v1/conversation/replay', milestone: 'M3' }),
    export: Object.freeze({ method: 'GET', path: '/api/v1/export', milestone: 'M3' })
});

export const DEPLOYMENT_CAPABILITIES = Object.freeze({
    cloudflare: Object.freeze({
        health: 'implemented',
        aiHooks: 'implemented',
        participantStart: 'implemented',
        moduleRunStart: 'implemented',
        moduleRunComplete: 'implemented',
        moduleRunReset: 'implemented',
        events: 'implemented',
        conversationReplay: 'implemented',
        export: 'implemented'
    }),
    fastify: Object.freeze({
        health: 'implemented',
        aiHooks: 'implemented',
        participantStart: 'implemented',
        moduleRunStart: 'implemented',
        moduleRunComplete: 'implemented',
        moduleRunReset: 'implemented',
        events: 'implemented',
        conversationReplay: 'implemented',
        export: 'implemented'
    })
});

import assert from 'node:assert/strict';
import { SUPPORTED_HOOK_IDS } from '../shared-contract/index.mjs';

Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '8787',
    CORS_ORIGIN: 'https://www.resilience-training.cloud',
    AI_PROVIDER: 'deepseek',
    DEEPSEEK_BASE_URL: 'http://127.0.0.1:1',
    DEEPSEEK_API_KEY: 'contract-test-placeholder',
    DEEPSEEK_MODEL: 'deepseek-v4-flash',
    DEEPSEEK_TIMEOUT_MS: '50',
    DATABASE_URL: 'postgresql://contract:contract@127.0.0.1:5432/contract',
    SESSION_SECRET: 'contract-test-session-secret'
});

const { createApp } = await import('../backend/dist/app.js');
const { app } = await createApp();

try {
    const health = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(health.statusCode, 200);
    const healthBody = health.json();
    assert.equal(healthBody.ok, true);
    assert.equal(healthBody.version, 'v1');
    assert.equal(healthBody.runtime, 'fastify-node');
    assert.deepEqual([...healthBody.hooks].sort(), [...SUPPORTED_HOOK_IDS].sort());

    const unknown = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/hooks/unknown-hook',
        payload: { moduleId: '1-1', userInput: 'test' }
    });
    assert.equal(unknown.statusCode, 404);
    assert.equal(unknown.json().code, 'UNKNOWN_HOOK');

    const mismatch = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/hooks/module-1-1.intro-reply',
        payload: { moduleId: '1-2', userInput: 'test' }
    });
    assert.equal(mismatch.statusCode, 400);
    assert.equal(mismatch.json().code, 'HOOK_MODULE_MISMATCH');

    const sessionId = 'fastify-local-contract-session';
    const known = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/hooks/module-1-1.intro-reply',
        payload: {
            sessionId,
            moduleId: '1-1',
            step: 'intro',
            variant: 'default',
            userInput: '我想学习如何更好地面对压力。',
            context: { testData: true, source: 'fastify-local-contract' }
        }
    });
    assert.equal(known.statusCode, 200);
    const knownBody = known.json();
    assert.equal(knownBody.sessionId, sessionId);
    assert.equal(knownBody.moduleId, '1-1');
    assert.equal(knownBody.hookId, 'module-1-1.intro-reply');
    assert.equal(typeof knownBody.replyText, 'string');
    assert.ok(knownBody.replyText.length > 0);
    assert.equal(knownBody.fallbackUsed, true);

    const m3Boundary = await app.inject({
        method: 'POST',
        url: '/api/v1/participants/start',
        payload: { participantCode: 'M2_BOUNDARY', participantName: 'M2 Boundary' }
    });
    assert.equal(m3Boundary.statusCode, 404);

    console.log('PASS Fastify local M2 contract and M3 boundary');
} finally {
    await app.close();
}

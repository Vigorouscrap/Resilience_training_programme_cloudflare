import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_CAPABILITIES, DEPLOYMENT_CAPABILITIES } from './capabilities.mjs';

test('M2 capabilities exist in both deployments', () => {
    for (const deployment of Object.values(DEPLOYMENT_CAPABILITIES)) {
        assert.equal(deployment.health, 'implemented');
        assert.equal(deployment.aiHooks, 'implemented');
    }
});

test('Fastify research-data endpoints remain explicitly assigned to M3', () => {
    const fastify = DEPLOYMENT_CAPABILITIES.fastify;
    for (const [name, state] of Object.entries(fastify)) {
        if (state !== 'missing') continue;
        assert.equal(CONTRACT_CAPABILITIES[name].milestone, 'M3');
    }
});

test('Cloudflare export is the only missing Worker contract capability', () => {
    const missing = Object.entries(DEPLOYMENT_CAPABILITIES.cloudflare)
        .filter(([, state]) => state === 'missing')
        .map(([name]) => name);
    assert.deepEqual(missing, ['export']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_CAPABILITIES, DEPLOYMENT_CAPABILITIES } from './capabilities.mjs';

test('M2 capabilities exist in both deployments', () => {
    for (const deployment of Object.values(DEPLOYMENT_CAPABILITIES)) {
        assert.equal(deployment.health, 'implemented');
        assert.equal(deployment.aiHooks, 'implemented');
    }
});

test('both code adapters implement all declared routes; production rollout is separate', () => {
    for (const deployment of Object.values(DEPLOYMENT_CAPABILITIES)) {
        assert.deepEqual(Object.keys(deployment).sort(), Object.keys(CONTRACT_CAPABILITIES).sort());
        assert.ok(Object.values(deployment).every((state) => state === 'implemented'));
    }
});

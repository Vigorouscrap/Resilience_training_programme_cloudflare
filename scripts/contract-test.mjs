import assert from 'node:assert/strict';
import {
    API_PATHS,
    API_VERSION,
    ERROR_CODES,
    SUPPORTED_HOOK_IDS
} from '../shared-contract/index.mjs';

const baseUrl = String(process.env.CONTRACT_BASE_URL || process.argv[2] || '').replace(/\/+$/, '');
const profile = String(process.env.CONTRACT_PROFILE || process.argv[3] || 'health').toLowerCase();
const allowedProfiles = new Set(['health', 'core', 'ai', 'research', 'full']);

if (!baseUrl || !allowedProfiles.has(profile)) {
    console.error('Usage: CONTRACT_BASE_URL=https://api.example.com npm run test:contract -- [baseUrl] [health|core|ai|research|full]');
    process.exit(1);
}

async function requestJson(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(30000), ...options });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {
        throw new Error(`${path} returned non-JSON: ${text.slice(0, 180)}`);
    }
    return { response, data };
}

function assertAccess(access) {
    assert.equal(typeof access, 'object');
    assert.equal(typeof access.canAccessAllModules, 'boolean');
    assert.equal(typeof access.unlockedDayIndex, 'number');
    assert.equal(typeof access.lastCompletedDayIndex, 'number');
    assert.ok(access.nextUnlockAt === null || typeof access.nextUnlockAt === 'string');
    assert.ok(Array.isArray(access.completedModuleIds));
}

async function testHealth() {
    const { response, data } = await requestJson(API_PATHS.health);
    assert.equal(response.status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.version, API_VERSION);
    assert.equal(typeof data.app, 'string');
    assert.equal(typeof data.runtime, 'string');
    assert.equal(typeof data.provider, 'string');
    assert.ok(Array.isArray(data.hooks));
    assert.deepEqual([...data.hooks].sort(), [...SUPPORTED_HOOK_IDS].sort());
    assert.ok(Number.isFinite(Date.parse(data.timestamp)));
    console.log('PASS health contract');
}

function uniqueTestIdentity() {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
    return { participantCode: `M2_${suffix}`, participantName: 'M2 Contract Test', clientSessionId: `contract_${suffix}` };
}

async function postJson(path, body) {
    return requestJson(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function testCore() {
    const invalid = await postJson(API_PATHS.participantStart, { participantCode: '!', participantName: 'M2' });
    assert.equal(invalid.response.status, 400);
    assert.equal(typeof invalid.data.error, 'string');

    const identity = uniqueTestIdentity();
    const first = await postJson(API_PATHS.participantStart, { ...identity, metadata: { testData: true, source: 'm2-contract' } });
    assert.equal(first.response.status, 200);
    assert.equal(first.data.participantCode, identity.participantCode);
    assert.equal(first.data.participantName, identity.participantName);
    assert.equal(typeof first.data.participantId, 'string');
    assert.equal(typeof first.data.sessionId, 'string');
    assert.equal(first.data.persisted, true);
    assertAccess(first.data.access);

    const restored = await postJson(API_PATHS.participantStart, { ...identity, metadata: { testData: true, source: 'm2-contract-restore' } });
    assert.equal(restored.response.status, 200);
    assert.equal(restored.data.participantId, first.data.participantId);
    assert.equal(restored.data.sessionId, first.data.sessionId);

    const moduleStart = await postJson(API_PATHS.moduleRunStart, {
        participantCode: identity.participantCode,
        sessionId: first.data.sessionId,
        moduleId: '1-1',
        metadata: { testData: true, source: 'm2-contract' }
    });
    assert.equal(moduleStart.response.status, 200);
    assert.equal(moduleStart.data.persisted, true);
    assert.equal(moduleStart.data.moduleRun.moduleId, '1-1');
    assert.ok(['started', 'completed'].includes(moduleStart.data.moduleRun.status));
    assertAccess(moduleStart.data.access);
    console.log('PASS core participant/module-start contract');
}

async function testAi() {
    const unknown = await postJson(API_PATHS.aiHook('unknown-hook'), { moduleId: '1-1', userInput: 'test' });
    assert.equal(unknown.response.status, 404);
    assert.equal(unknown.data.code, ERROR_CODES.unknownHook);

    const mismatch = await postJson(API_PATHS.aiHook('module-1-1.intro-reply'), { moduleId: '1-2', userInput: 'test' });
    assert.equal(mismatch.response.status, 400);
    assert.equal(mismatch.data.code, ERROR_CODES.hookModuleMismatch);

    const hookId = 'module-1-1.intro-reply';
    const payload = {
        participantCode: 'M2_AI_TEST',
        sessionId: `m2_ai_${Date.now()}`,
        moduleId: '1-1',
        step: 'intro',
        variant: 'default',
        userInput: '我想学习如何更好地面对压力。',
        context: { testData: true, source: 'm2-contract' }
    };
    const result = await postJson(API_PATHS.aiHook(hookId), payload);
    assert.equal(result.response.status, 200);
    assert.equal(result.data.sessionId, payload.sessionId);
    assert.equal(result.data.moduleId, payload.moduleId);
    assert.equal(result.data.hookId, hookId);
    assert.equal(typeof result.data.replyText, 'string');
    assert.ok(result.data.replyText.length > 0);
    assert.equal(typeof result.data.fallbackUsed, 'boolean');
    assert.equal(typeof result.data.metadata, 'object');
    for (const field of ['promptVersion', 'provider', 'model']) assert.equal(typeof result.data[field], 'string');
    console.log('PASS AI hook contract');
}

async function testResearch() {
    const identity = uniqueTestIdentity();
    const metadata = { testData: true, source: 'm2-contract-research' };
    async function login(fields) {
        const result = await postJson(API_PATHS.participantStart, { ...fields, metadata });
        assert.equal(result.response.status, 200);
        assert.equal(result.data.persisted, true);
        return result.data;
    }
    const first = await login(identity);
    assert.equal(first.role, 'participant', 'Regression identities must have ordinary participant permissions');
    const moduleRequest = { participantCode: identity.participantCode, sessionId: first.sessionId, moduleId: '1-1' };
    const started = await postJson(API_PATHS.moduleRunStart, { ...moduleRequest, metadata });
    assert.equal(started.response.status, 200);
    assert.equal(started.data.persisted, true);
    const repeatedStart = await postJson(API_PATHS.moduleRunStart, { ...moduleRequest, metadata });
    assert.equal(repeatedStart.data.moduleRun.id, started.data.moduleRun.id);

    const locked = await postJson(API_PATHS.moduleRunStart, { ...moduleRequest, moduleId: '1-2' });
    assert.equal(locked.response.status, 403);
    assert.equal(locked.data.code, ERROR_CODES.moduleLocked);

    const messageText = `M2 replay marker ${identity.participantCode}`;
    const snapshotHtml = `<div>${messageText}</div>`;
    const events = await postJson(API_PATHS.events, {
        ...moduleRequest,
        events: [
            { type: 'conversation_message', moduleId: '1-1', messageRole: 'user', messageText, source: 'user_input', sequenceIndex: 1, metadata },
            { type: 'module_event', moduleId: '1-1', eventType: 'contract_test', context: metadata },
            { type: 'unknown_event', moduleId: '1-1' }
        ]
    });
    assert.equal(events.response.status, 202);
    assert.equal(events.data.accepted, 2);
    assert.equal(events.data.rejected, 1);
    assert.equal(events.data.persisted, true);

    async function replay(body) {
        const result = await postJson(API_PATHS.conversationReplay, body);
        assert.equal(result.response.status, 200);
        assert.equal(result.data.persisted, true);
        return result.data;
    }
    function assertEmptyReplay(data) {
        assert.equal(data.snapshotHtml, null);
        assert.deepEqual(data.messages, []);
    }
    assertEmptyReplay(await replay(moduleRequest));
    const completed = await postJson(API_PATHS.moduleRunComplete, { ...moduleRequest, snapshotHtml, metadata });
    assert.equal(completed.response.status, 200);
    assert.equal(completed.data.persisted, true);
    assert.equal(completed.data.moduleRun.status, 'completed');
    assert.ok(completed.data.access.completedModuleIds.includes('1-1'));

    const second = await login({ ...identity, clientSessionId: `${identity.clientSessionId}_second` });
    assert.equal(second.participantId, first.participantId);
    assert.notEqual(second.sessionId, first.sessionId);
    const newSessionRequest = { ...moduleRequest, sessionId: second.sessionId };
    const history = await replay(newSessionRequest);
    assert.equal(history.snapshotHtml, snapshotHtml);
    assert.equal(history.messages.length, 1);
    assert.equal(history.messages[0].messageText, messageText);
    assert.deepEqual(await replay(newSessionRequest), history, 'Repeated replay must return the same saved history');

    const reset = await postJson(API_PATHS.moduleRunReset, moduleRequest);
    assert.equal(reset.response.status, 403);
    assert.equal(reset.data.code, ERROR_CODES.resetForbidden);

    const otherName = await login({ ...identity, participantName: 'M2 Different Name' });
    assert.notEqual(otherName.participantId, first.participantId);
    assertEmptyReplay(await replay({ ...moduleRequest, sessionId: otherName.sessionId }));

    const otherIdentity = uniqueTestIdentity();
    const other = await login(otherIdentity);
    assertEmptyReplay(await replay({ ...moduleRequest, participantCode: otherIdentity.participantCode, sessionId: other.sessionId }));
    const mismatched = await postJson(API_PATHS.conversationReplay, { ...moduleRequest, sessionId: other.sessionId });
    assert.ok([400, 401, 403].includes(mismatched.response.status), 'Mismatched code/session must be rejected');
    assert.equal(typeof mismatched.data.error, 'string');
    assert.equal(mismatched.data.snapshotHtml, undefined);
    assert.equal(mismatched.data.messages, undefined);
    console.log('PASS research events, cross-session replay, module access and participant isolation');
    console.log(`Test records retained: ${identity.participantCode}, ${otherIdentity.participantCode} (metadata.testData=true)`);
}

await testHealth();
if (profile === 'core' || profile === 'full') await testCore();
if (profile === 'ai' || profile === 'full') await testAi();
if (profile === 'research' || profile === 'full') await testResearch();
console.log(`Contract profile "${profile}" passed for ${baseUrl}`);

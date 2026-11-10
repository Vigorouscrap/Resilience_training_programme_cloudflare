import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { PGlite } from '@electric-sql/pglite';
import { ResearchService, createD1Adapter, handleResearchRequest, toCsv } from '../../shared-contract/research.mjs';
import { tsImport } from 'tsx/esm/api';
import { ResearchEventQueue } from '../../src/js/services/researchEventQueue.js';
import { createPostgresDatabase } from '../dist/research/postgres.js';
import { createApp } from '../dist/app.js';
import { SUPPORTED_HOOKS } from '../../shared-contract/index.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

Object.assign(process.env, {
    NODE_ENV: 'test', AI_PROVIDER: 'deepseek', DEEPSEEK_BASE_URL: 'http://127.0.0.1:1',
    DEEPSEEK_API_KEY: 'test', DEEPSEEK_MODEL: 'deepseek-v4-flash', DEEPSEEK_TIMEOUT_MS: '50',
    DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/unused', SESSION_SECRET: 'test',
    ADMIN_EXPORT_TOKEN: 'test-export-token', TESTER_PARTICIPANT_CODES: 'M3_TESTER', EXPORT_CREDENTIAL_ID: 'test-credential'
});

const pg = new PGlite();
await pg.exec(await readFile(new URL('../migrations/0001_research.sql', import.meta.url), 'utf8'));
// PGlite runs PostgreSQL SQL in-process. Queue connections to respect its single
// connection model while exercising the production adapter's transactions.
let pending = Promise.resolve();
const pool = {
    query: (...args) => pg.query(...args),
    async connect() {
        const previous = pending;
        let release;
        pending = new Promise((resolve) => { release = resolve; });
        await previous;
        return { query: (...args) => pg.query(...args), release };
    }
};
const sqlite = new DatabaseSync(':memory:');
const migrations = new URL('../../cloudflare-worker/migrations/', import.meta.url);
for (const file of (await readdir(migrations)).filter((file) => file.endsWith('.sql')).sort()) sqlite.exec(await readFile(new URL(file, migrations), 'utf8'));
function prepared(sql, params = []) {
    return { bind: (...values) => prepared(sql, values), all: () => ({ results: sqlite.prepare(sql).all(...params) }) };
}
const d1 = { prepare: prepared, async batch(statements) {
    sqlite.exec('BEGIN');
    // D1 serializes each batch atomically. Keep this synchronous mock atomic too.
    try { for (const statement of statements) statement.all(); sqlite.exec('COMMIT'); }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} };

const adapters = [['PostgreSQL/PGlite', createPostgresDatabase(pool)], ['D1/SQLite', createD1Adapter(d1)]];
try {
    for (const [label, db] of adapters) {
        const config = { testerParticipantCodes: ['M3_TESTER'], adminExportToken: 'test-export-token', exportCredentialId: 'test-credential' };
        const service = new ResearchService(db, config);
        async function request(path, body, token) {
            const response = await handleResearchRequest(new Request(`http://test${path}`, {
                method: body === undefined ? 'GET' : 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                ...(body === undefined ? {} : { body: JSON.stringify(body) })
            }), service);
            assert.ok(response);
            const text = await response.text();
            return { status: response.status, text, data: response.headers.get('content-type').includes('json') ? JSON.parse(text) : null };
        }
        const login = async (body) => {
            const response = await request('/api/v1/participants/start', body);
            assert.equal(response.status, 200, response.text);
            assert.equal(response.data.persisted, true);
            return response.data;
        };
        for (const body of [null, {}, { participantCode: 123, participantName: 'bad' }, { participantCode: 'GOOD', participantName: {} }, { participantCode: '!', participantName: 'bad' }, { participantCode: 'GOOD', participantName: ' ' }]) {
            assert.equal((await request('/api/v1/participants/start', body)).status, 400);
        }
        const identity = { participantCode: ' m3_person ', participantName: ' 测试  姓名 ', clientSessionId: 'first', metadata: { testData: true } };
        const [first, concurrent] = await Promise.all([login(identity), login(identity)]);
        assert.equal(first.participantId, concurrent.participantId);
        assert.equal(first.sessionId, concurrent.sessionId);
        const restored = await login({ ...identity, participantName: '测试 姓名', clientSessionId: 'second', metadata: {} });
        assert.equal(first.participantId, restored.participantId);
        assert.notEqual(first.sessionId, restored.sessionId);
        const auth = { participantCode: first.participantCode, sessionId: first.sessionId, moduleId: '1-1' };
        const run = await request('/api/v1/module-runs/start', auth);
        assert.equal(run.status, 200, run.text);
        const repeated = await request('/api/v1/module-runs/start', auth);
        assert.equal(run.data.moduleRun.id, repeated.data.moduleRun.id);
        assert.equal((await request('/api/v1/module-runs/start', { ...auth, moduleId: '1-2' })).data.code, 'MODULE_LOCKED');
        assert.equal((await request('/api/v1/module-runs/complete', { ...auth, snapshotHtml: 'x'.repeat(500001) })).status, 400);
        assert.equal((await request('/api/v1/module-runs/complete', { ...auth, practiceDurationSeconds: -1 })).status, 400);
        assert.equal((await request('/api/v1/module-runs/complete', { ...auth, practiceDurationSeconds: Number.MAX_SAFE_INTEGER })).status, 400);

        const events = [
            { type: 'conversation_message', moduleId: '1-1', messageRole: 'user', source: 'user_input', messageText: '中文,"引用"\n第二行', step: 'intro', sequenceIndex: 2, clientEventId: 'user-1' },
            { type: 'conversation_message', moduleId: '1-1', messageRole: 'system_script', source: 'fixed_script', messageText: 'first', sequenceIndex: 1, clientEventId: 'script-1' },
            { type: 'module_event', moduleId: '1-1', eventType: 'choice', choiceValue: 'A', clientEventId: 'choice-1' },
            { type: 'conversation_message', moduleId: '1-1', messageRole: 'invalid', source: 'user_input', messageText: 'no' },
            { type: 'module_event', moduleId: '99-1', eventType: 'bad' }, null
        ];
        const saved = await request('/api/v1/events', { ...auth, events });
        assert.deepEqual(saved.data, { accepted: 3, rejected: 3, persisted: true });
        assert.equal((await request('/api/v1/events', { ...auth, events })).data.accepted, 3);
        assert.equal((await request('/api/v1/events', { ...auth, events: Array(101).fill(events[0]) })).status, 400);
        assert.deepEqual((await request('/api/v1/conversation/replay', auth)).data.messages, []);

        const completed = await request('/api/v1/module-runs/complete', { ...auth, practiceDurationSeconds: 615, snapshotHtml: '<div>original</div>' });
        assert.equal(completed.status, 200, completed.text);
        assert.equal(completed.data.moduleRun.practiceDurationSeconds, 615);
        assert.equal(typeof completed.data.moduleRun.elapsedDurationSeconds, 'number');
        const duplicateComplete = await request('/api/v1/module-runs/complete', { ...auth, practiceDurationSeconds: 999, snapshotHtml: '<div>replaced</div>' });
        assert.deepEqual(duplicateComplete.data, completed.data);
        const crossSession = await request('/api/v1/conversation/replay', { ...auth, sessionId: restored.sessionId });
        assert.equal(crossSession.data.snapshotHtml, '<div>original</div>');
        assert.deepEqual(crossSession.data.messages.map((message) => message.messageText), ['first', '中文,"引用"\n第二行']);
        assert.equal(crossSession.data.messages[1].step, 'intro');
        const tables = ['module_runs', 'module_events', 'conversation_messages', 'conversation_snapshots', 'ai_call_events'];
        const counts = async () => Promise.all(tables.map(async (table) => (await db.all(`SELECT COUNT(*) AS count FROM ${table}`))[0].count));
        const beforeReplay = await counts();
        await request('/api/v1/conversation/replay', auth);
        assert.deepEqual(await counts(), beforeReplay, 'Replay cannot write research data');
        const other = await login({ ...identity, participantName: 'different', clientSessionId: 'different' });
        const hidden = await request('/api/v1/conversation/replay', { ...auth, sessionId: other.sessionId });
        assert.equal(hidden.data.snapshotHtml, null);
        assert.deepEqual(hidden.data.messages, []);
        assert.equal((await request('/api/v1/conversation/replay', { ...auth, participantCode: 'WRONG' })).data.code, 'AUTH_INVALID');
        assert.equal((await request('/api/v1/module-runs/reset', auth)).data.code, 'RESET_FORBIDDEN');
        const tester = await login({ participantCode: 'M3_TESTER', participantName: 'tester' });
        const testerAuth = { participantCode: 'M3_TESTER', sessionId: tester.sessionId, moduleId: '6-7' };
        assert.equal((await request('/api/v1/module-runs/reset', testerAuth)).status, 409);
        await request('/api/v1/module-runs/start', testerAuth);
        await request('/api/v1/events', { ...testerAuth, events: [{ ...events[0], moduleId: '6-7' }] });
        await service.recordAiCallEvent({ ...testerAuth, hookId: 'test-hook', userInput: 'test', replyText: 'fallback', fallbackUsed: true, promptVersion: 'v1', provider: 'deepseek', model: 'test' });
        await request('/api/v1/module-runs/complete', { ...testerAuth, snapshotHtml: 'tester snapshot' });
        assert.equal((await request('/api/v1/module-runs/reset', testerAuth)).data.moduleRun.status, 'started');
        for (const table of tables.filter((table) => table !== 'module_runs')) assert.equal(Number((await db.all(`SELECT COUNT(*) AS count FROM ${table} WHERE participant_id = ?`, [tester.participantId]))[0].count), 0);
        assert.equal((await request('/api/v1/conversation/replay', testerAuth)).data.snapshotHtml, null);

        // Fault halfway through a two-statement batch: the earlier insert must roll back.
        await assert.rejects(db.batch([
            { sql: "INSERT INTO module_events (id, participant_id, session_id, module_id, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?)", params: ['rollback-test', first.participantId, first.sessionId, '1-1', 'test', new Date().toISOString()] },
            { sql: 'INSERT INTO table_that_does_not_exist VALUES (?)', params: ['failure'] }
        ]));
        assert.equal((await db.all('SELECT id FROM module_events WHERE id = ?', ['rollback-test'])).length, 0);

        const ordinary = await login({ participantCode: 'M3_REAL', participantName: '=formula,"中文"\n第二行', clientSessionId: 'real' });
        assert.ok(ordinary.participantId);
        assert.equal((await request('/api/v1/export?format=json')).status, 401);
        assert.equal((await request('/api/v1/export?format=json', undefined, 'bad-token')).status, 403);
        const exported = await request('/api/v1/export?format=json', undefined, config.adminExportToken);
        assert.equal(exported.status, 200, exported.text);
        assert.ok(exported.data.rows.length > 0);
        assert.ok(exported.data.rows.every((row) => row.export_participant_code === 'M3_REAL'), 'Test identities remain excluded after login without metadata');
        const included = await request('/api/v1/export?format=json&includeTestData=true&participantCode=M3_PERSON&moduleId=1-1', undefined, config.adminExportToken);
        assert.ok(included.data.rows.some((row) => row.entity === 'module_runs' && row.practice_duration_seconds === 615));
        assert.ok(included.data.rows.every((row) => row.export_participant_code === 'M3_PERSON'));
        const csv = await request('/api/v1/export?format=csv', undefined, config.adminExportToken);
        // Response.text strips the UTF-8 BOM; validate generator bytes separately below.
        assert.ok(csv.text.includes("'=formula,"));
        assert.ok(csv.text.includes('""中文""'));
        // Names normalize whitespace. Exercise preserved newlines via actual transcript data.
        const transcriptCsv = await request('/api/v1/export?format=csv&includeTestData=true&participantCode=M3_PERSON&moduleId=1-1', undefined, config.adminExportToken);
        assert.ok(transcriptCsv.text.includes('中文,""引用""\n第二行'));
        assert.deepEqual([...new TextEncoder().encode(toCsv([])).slice(0, 3)], [239, 187, 191]);
        assert.equal((await request('/api/v1/export?dateFrom=bad', undefined, config.adminExportToken)).status, 400);
        const emptyExport = await request('/api/v1/export?format=json&includeTestData=true&dateFrom=2099-01-01', undefined, config.adminExportToken);
        assert.deepEqual(emptyExport.data.rows, []);
        const audit = await db.all('SELECT * FROM exports');
        assert.equal(audit.length, 5);
        assert.ok(audit.every((row) => row.requested_by === 'test-credential'));
        assert.ok(!JSON.stringify(audit).includes(config.adminExportToken));
        // Race two first completions: the winner's timer and snapshot must agree.
        const racer = await login({ participantCode: 'M3_RACE', participantName: 'race', metadata: { testData: true } });
        const raceAuth = { participantCode: racer.participantCode, sessionId: racer.sessionId, moduleId: '1-1' };
        const races = await Promise.all([10, 20].map((seconds) => request('/api/v1/module-runs/complete', { ...raceAuth, practiceDurationSeconds: seconds, snapshotHtml: `snapshot-${seconds}` })));
        assert.ok(races.every((result) => result.status === 200), JSON.stringify(races));
        assert.deepEqual(races[0].data.moduleRun, races[1].data.moduleRun);
        assert.equal((await request('/api/v1/conversation/replay', raceAuth)).data.snapshotHtml, `snapshot-${races[0].data.moduleRun.practiceDurationSeconds}`);
        assert.equal(Number((await db.all('SELECT COUNT(*) AS count FROM module_runs WHERE participant_id = ?', [racer.participantId]))[0].count), 1);

        // Inject a SQL error after each mutation batch; endpoint-level operations
        // must roll back both completion/snapshot and reset/deletion together.
        const faulty = (database) => ({
            dialect: database.dialect,
            all: (...args) => database.all(...args),
            batch: (commands) => database.batch([...commands, { sql: 'INSERT INTO missing_m3_table VALUES (?)', params: ['fault'] }]),
            transaction: (key, callback) => database.transaction(key, (tx) => callback(faulty(tx)))
        });
        const brokenService = new ResearchService(faulty(db), config);
        await assert.rejects(brokenService.moduleRun(raceAuth, 'reset'), (error) => error.code === 'RESET_FORBIDDEN');
        await request('/api/v1/module-runs/complete', { ...testerAuth, snapshotHtml: 'keep-on-failure' });
        const beforeReset = await counts();
        await assert.rejects(brokenService.moduleRun(testerAuth, 'reset'));
        assert.deepEqual(await counts(), beforeReset);
        assert.equal((await request('/api/v1/conversation/replay', testerAuth)).data.snapshotHtml, 'keep-on-failure');
        const fresh = await login({ participantCode: 'M3_FAILURE', participantName: 'failure', metadata: { testData: true } });
        const freshAuth = { participantCode: fresh.participantCode, sessionId: fresh.sessionId, moduleId: '1-1' };
        await request('/api/v1/module-runs/start', freshAuth);
        await assert.rejects(brokenService.moduleRun({ ...freshAuth, snapshotHtml: 'must-roll-back', practiceDurationSeconds: 12 }, 'complete'));
        assert.equal((await request('/api/v1/module-runs/start', freshAuth)).data.moduleRun.status, 'started');
        assert.equal((await db.all('SELECT id FROM conversation_snapshots WHERE participant_id = ?', [fresh.participantId])).length, 0);
        await assert.rejects(brokenService.events({ ...freshAuth, events: [events[0]] }));
        assert.equal((await db.all('SELECT id FROM conversation_messages WHERE participant_id = ?', [fresh.participantId])).length, 0);
        console.log(`PASS ${label}: identity, atomicity/faults, concurrent completion, access, durations, reset, replay, event deduplication, isolation, export/auth/CSV/audit`);
    }

    // The same storage service must survive real HTTP bridge serialization.
    const liveDb = adapters[0][1];
    const { app: connected } = await createApp({ researchDatabase: liveDb });
    try {
        const login = await connected.inject({ method: 'POST', url: '/api/v1/participants/start', payload: { participantCode: 'M3_BRIDGE', participantName: 'bridge', metadata: { testData: true } } });
        assert.equal(login.statusCode, 200, login.body);
        const auth = { participantCode: login.json().participantCode, sessionId: login.json().sessionId, moduleId: '1-1' };
        for (const path of ['start', 'complete']) {
            const response = await connected.inject({ method: 'POST', url: `/api/v1/module-runs/${path}`, payload: { ...auth, practiceDurationSeconds: 45, snapshotHtml: 'bridge-snapshot' } });
            assert.equal(response.statusCode, 200, response.body);
            assert.equal(response.json().persisted, true);
        }
        const csv = await connected.inject({ method: 'GET', url: '/api/v1/export?includeTestData=true&participantCode=M3_BRIDGE', headers: { Authorization: 'Bearer test-export-token' } });
        assert.equal(csv.statusCode, 200, csv.body);
        assert.deepEqual([...csv.rawPayload.slice(0, 3)], [239, 187, 191]);
        assert.equal(csv.headers['cache-control'], 'no-store');
        assert.ok(csv.body.includes('bridge-snapshot'));
        const address = await connected.listen({ host: '127.0.0.1', port: 0 });
        const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('../../scripts/contract-test.mjs', import.meta.url)), address, 'full'], { timeout: 60000 });
        console.log(stdout.trim());
    } finally { await connected.close(); }

    // Load the actual Worker entry point with only local SQLite/fake secrets.
    const { default: worker } = await tsImport('../../cloudflare-worker/src/index.ts', import.meta.url);
    const workerEnv = { DB: d1, TESTER_PARTICIPANT_CODES: 'M3_TESTER', ADMIN_EXPORT_TOKEN: 'test-export-token' };
    const workerLogin = await worker.fetch(new Request('http://test/api/v1/participants/start', { method: 'POST', body: JSON.stringify({ participantCode: 'M3_WORKER', participantName: 'worker', metadata: { testData: true } }) }), workerEnv);
    assert.equal(workerLogin.status, 200);
    const workerAuth = await workerLogin.json();
    assert.equal(workerAuth.persisted, true);
    const workerExport = await worker.fetch(new Request('http://test/api/v1/export?includeTestData=true&participantCode=M3_WORKER', { headers: { Authorization: 'Bearer test-export-token' } }), workerEnv);
    assert.equal(workerExport.status, 200);
    assert.deepEqual([...new Uint8Array(await workerExport.arrayBuffer()).slice(0, 3)], [239, 187, 191]);
    for (const flag of ['true', 'false']) {
        const unavailable = await worker.fetch(new Request('http://test/api/v1/participants/start', { method: 'POST', body: JSON.stringify({ participantCode: 'M3_MISSING', participantName: 'missing' }) }), { REQUIRE_PERSISTENCE: flag });
        assert.equal(unavailable.status, 503);
        assert.equal((await unavailable.json()).code, 'STORAGE_UNAVAILABLE');
    }
    for (const hook of SUPPORTED_HOOKS) {
        const fallback = await worker.fetch(new Request(`http://test/api/v1/ai/hooks/${hook.hookId}`, { method: 'POST', body: JSON.stringify({ ...workerAuth, moduleId: hook.moduleId, userInput: 'test' }) }), { ...workerEnv, DB: { prepare() { throw new Error('injected log failure'); } } });
        assert.equal(fallback.status, 200);
        assert.equal((await fallback.json()).fallbackUsed, true);
    }
    console.log('PASS actual Fastify and Worker bridges, CSV bytes, unbound DB policy and all Worker AI fallbacks/log failures');

    // Retry acknowledgement loss with stable event IDs and the original session.
    let deliveries = [];
    const queue = new ResearchEventQueue(async (events, session) => {
        deliveries.push({ events, session });
        return { persisted: deliveries.length > 1 };
    }, { schedule: () => 1, maxEvents: 3 });
    queue.push({ type: 'module_event', eventType: 'test' }, { participantCode: 'FIRST', sessionId: 'old-session' });
    await queue.flush();
    queue.push({ type: 'module_event', eventType: 'next' }, { participantCode: 'SECOND', sessionId: 'new-session' });
    await queue.flush();
    assert.deepEqual(deliveries[0], deliveries[1]);
    await queue.flush();
    assert.equal(deliveries[2].session.sessionId, 'new-session');
    assert.equal(queue.items.length, 0);
    console.log('PASS bounded event queue: retry preserves identity and deduplication IDs');

    // Exercise actual Fastify serialization and all AI fallbacks with DB unavailable.
    const { app } = await createApp({ researchDatabase: null });
    try {
        for (const hook of SUPPORTED_HOOKS) {
            const response = await app.inject({ method: 'POST', url: `/api/v1/ai/hooks/${hook.hookId}`, payload: { participantCode: 'FAIL_LOG', sessionId: 'no-database', moduleId: hook.moduleId, userInput: 'test', step: 'intro' } });
            assert.equal(response.statusCode, 200, response.body);
            assert.equal(response.json().fallbackUsed, true);
            assert.equal(response.json().sessionId, 'no-database');
        }
        assert.equal((await app.inject({ method: 'POST', url: '/api/v1/participants/start', payload: { participantCode: 'TEST', participantName: 'test' } })).statusCode, 503);
        const eventsFailure = await app.inject({ method: 'POST', url: '/api/v1/events', payload: { participantCode: 'TEST', sessionId: 'missing', events: [{ type: 'module_event', moduleId: '1-1', eventType: 'test' }] } });
        assert.equal(eventsFailure.statusCode, 202);
        assert.equal(eventsFailure.json().persisted, false);
        for (const path of ['module-runs/start', 'module-runs/complete', 'module-runs/reset', 'conversation/replay']) {
            const response = await app.inject({ method: 'POST', url: `/api/v1/${path}`, payload: { participantCode: 'TEST', sessionId: 'missing', moduleId: '1-1' } });
            assert.equal(response.statusCode, 503, response.body);
            assert.equal(response.json().code, 'STORAGE_UNAVAILABLE');
        }
        const nativeFetch = globalThis.fetch;
        try {
            for (const text of ['合适的短回复。', '', '超'.repeat(10000)]) {
                globalThis.fetch = async () => Response.json({ choices: [{ message: { content: text } }] });
                for (const hook of SUPPORTED_HOOKS) {
                    const payload = { participantCode: 'FAIL_LOG', sessionId: 'missing', moduleId: hook.moduleId, userInput: 'test' };
                    const fastify = await app.inject({ method: 'POST', url: `/api/v1/ai/hooks/${hook.hookId}`, payload });
                    const cloudflare = await worker.fetch(new Request(`http://test/api/v1/ai/hooks/${hook.hookId}`, { method: 'POST', body: JSON.stringify(payload) }), { DEEPSEEK_API_KEY: 'fake-key' });
                    assert.equal(fastify.statusCode, 200);
                    assert.equal(cloudflare.status, 200);
                    assert.equal(fastify.json().fallbackUsed, text !== '合适的短回复。');
                    assert.equal((await cloudflare.json()).fallbackUsed, text !== '合适的短回复。');
                }
            }
        } finally { globalThis.fetch = nativeFetch; }
    } finally { await app.close(); }
    console.log('PASS both runtimes: all 10 AI valid/empty/overlong outputs; Fastify core 503 and ordinary event 202');
} finally {
    await pg.close();
    sqlite.close();
}

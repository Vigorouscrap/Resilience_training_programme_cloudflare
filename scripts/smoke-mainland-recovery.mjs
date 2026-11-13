import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const siteUrl = String(process.env.MAINLAND_SITE_URL || process.argv[2] || 'https://www.resilience-training.cloud').replace(/\/+$/, '');
const apiUrl = String(process.env.MAINLAND_API_URL || 'https://api.resilience-training.cloud').replace(/\/+$/, '');
const edgePath = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const moduleId = '2-4';
const eventsUrl = `${apiUrl}/api/v1/events`;

async function findAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            const port = typeof address === 'object' && address ? address.port : 0;
            server.close((error) => error ? reject(error) : resolve(port));
        });
    });
}

const debugPort = Number(process.env.EDGE_DEBUG_PORT || await findAvailablePort());
const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'resilience-recovery-smoke-'));
const browser = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profilePath}`,
    'about:blank'
], { stdio: 'ignore', windowsHide: true });
console.log(`STEP recovery-smoke browser started on debug port ${debugPort}`);

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function poll(fn, timeoutMs = 30000, intervalMs = 100) {
    const deadline = Date.now() + timeoutMs;
    let lastError;
    while (Date.now() < deadline) {
        try {
            const value = await fn();
            if (value) return value;
        } catch (error) {
            lastError = error;
        }
        await delay(intervalMs);
    }
    throw lastError || new Error(`Timed out after ${timeoutMs}ms`);
}

async function readTargets() {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`DevTools target list returned HTTP ${response.status}`);
    return response.json();
}

class CdpClient {
    constructor(url) {
        this.socket = new WebSocket(url);
        this.nextId = 1;
        this.pending = new Map();
        this.listeners = new Map();
        this.socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.id) {
                const pending = this.pending.get(message.id);
                this.pending.delete(message.id);
                if (message.error) pending?.reject(new Error(message.error.message));
                else pending?.resolve(message.result);
                return;
            }
            for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
        });
    }

    async ready() {
        if (this.socket.readyState === WebSocket.OPEN) return;
        await Promise.race([
            new Promise((resolve, reject) => {
                this.socket.addEventListener('open', resolve, { once: true });
                this.socket.addEventListener('error', reject, { once: true });
            }),
            delay(10000).then(() => { throw new Error('DevTools WebSocket connection timed out'); })
        ]);
    }

    send(method, params = {}) {
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }

    on(method, listener) {
        const listeners = this.listeners.get(method) || [];
        listeners.push(listener);
        this.listeners.set(method, listeners);
    }

    close() {
        this.socket.close();
    }
}

async function evaluate(client, expression, awaitPromise = true) {
    const result = await client.send('Runtime.evaluate', {
        expression,
        awaitPromise,
        returnByValue: true,
        userGesture: true
    });
    if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Browser evaluation failed');
    }
    return result.result?.value;
}

async function waitForExpression(client, expression, timeoutMs = 30000) {
    return poll(() => evaluate(client, `Boolean(${expression})`), timeoutMs, 100);
}

async function navigate(client, url) {
    const loaded = new Promise((resolve) => client.on('Page.loadEventFired', resolve));
    await client.send('Page.navigate', { url });
    await Promise.race([loaded, delay(20000).then(() => { throw new Error(`Navigation timed out: ${url}`); })]);
}

async function enablePage(client) {
    await Promise.all([
        client.send('Page.enable'),
        client.send('Runtime.enable'),
        client.send('Network.enable')
    ]);
}

async function login(client) {
    await waitForExpression(client, `document.querySelector('#participantForm')`);
    await evaluate(client, `(() => {
        document.querySelector('#participantCodeInput').value = 'C_TEST';
        document.querySelector('#participantNameInput').value = 'sxq';
        document.querySelector('#participantConsentInput').checked = true;
        document.querySelector('#participantForm').requestSubmit();
        return true;
    })()`);
    await waitForExpression(client, `globalThis.__resilienceTest?.getState()?.role === 'tester'`, 30000);
    console.log('PASS recovery-smoke login and PostgreSQL connection');
}

async function resetIfCompleted(client) {
    const result = await evaluate(client, `(async () => {
        const session = JSON.parse(localStorage.getItem('__resilience_participant_session_v1__'));
        const response = await fetch(${JSON.stringify(apiUrl + '/api/v1/module-runs/reset')}, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantCode: session.participantCode,
                sessionId: session.sessionId,
                moduleId: ${JSON.stringify(moduleId)},
                metadata: { source: 'edgeone-recovery-smoke', testData: true }
            })
        });
        const data = await response.json();
        if (response.ok && data.access) {
            session.access = { ...session.access, ...data.access };
            session.updatedAt = new Date().toISOString();
            localStorage.setItem('__resilience_participant_session_v1__', JSON.stringify(session));
        }
        return { status: response.status, data };
    })()`);
    if (result.status === 200) return;
    assert.equal(result.status, 409, JSON.stringify(result));
    assert.equal(result.data.code, 'MODULE_NOT_COMPLETED');
}

async function startModule(client, count = 1) {
    return evaluate(client, `(async () => {
        const session = JSON.parse(localStorage.getItem('__resilience_participant_session_v1__'));
        const body = {
            participantCode: session.participantCode,
            sessionId: session.sessionId,
            moduleId: ${JSON.stringify(moduleId)},
            metadata: { source: 'edgeone-recovery-smoke', testData: true }
        };
        const call = async () => {
            const response = await fetch(${JSON.stringify(apiUrl + '/api/v1/module-runs/start')}, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return { status: response.status, data: await response.json() };
        };
        return Promise.all(Array.from({ length: ${count} }, call));
    })()`);
}

let firstClient;
let secondClient;
let secondTargetId;
const consoleErrors = [];
const unexpectedFailures = [];
const eventResponses = [];
const blockedEventFailures = [];

try {
    const firstTarget = await poll(async () => (await readTargets()).find((target) => target.type === 'page' && target.webSocketDebuggerUrl), 20000, 200);
    firstClient = new CdpClient(firstTarget.webSocketDebuggerUrl);
    await firstClient.ready();
    firstClient.on('Runtime.consoleAPICalled', ({ type, args }) => {
        if (type === 'error') consoleErrors.push(args.map((arg) => arg.value || arg.description || '').join(' '));
    });
    firstClient.on('Network.loadingFailed', ({ requestId, errorText, blockedReason, canceled }) => {
        if (canceled) return;
        if (blockedReason === 'inspector' || /BLOCKED_BY_CLIENT/i.test(errorText || '')) {
            blockedEventFailures.push({ requestId, errorText, blockedReason });
        } else {
            unexpectedFailures.push({ requestId, errorText, blockedReason });
        }
    });
    firstClient.on('Network.responseReceived', ({ response }) => {
        if (response.url === eventsUrl) eventResponses.push(response.status);
    });
    await enablePage(firstClient);
    await navigate(firstClient, `${siteUrl}/?recovery_smoke=${Date.now()}`);
    await login(firstClient);
    await resetIfCompleted(firstClient);

    await firstClient.send('Network.setBlockedURLs', { urls: [eventsUrl, `${eventsUrl}*`] });
    await evaluate(firstClient, `globalThis.__resilienceTest.setFastMode(true); globalThis.__resilienceTest.setSkipMode(false); globalThis.__resilienceTest.openModule(${JSON.stringify(moduleId)}, { fastMode: true })`);
    await waitForExpression(firstClient, `globalThis.__resilienceTest?.getState()?.currentModule === ${JSON.stringify(moduleId)}`, 15000);
    await poll(() => blockedEventFailures.length > 0, 10000, 100);
    await firstClient.send('Network.setBlockedURLs', { urls: [] });
    await poll(() => eventResponses.includes(202), 15000, 200);
    console.log('PASS ordinary event request retried after a simulated browser-network failure');

    const initial = await startModule(firstClient);
    assert.equal(initial[0].status, 200, JSON.stringify(initial[0]));
    const initialRunId = initial[0].data.moduleRun.id;
    assert.ok(initialRunId);
    assert.equal(initial[0].data.moduleRun.status, 'started');

    await navigate(firstClient, `${siteUrl}/?recovery_refresh=${Date.now()}`);
    await waitForExpression(firstClient, `globalThis.__resilienceTest?.getState()?.role === 'tester'`, 30000);
    const afterRefresh = await startModule(firstClient);
    assert.equal(afterRefresh[0].status, 200, JSON.stringify(afterRefresh[0]));
    assert.equal(afterRefresh[0].data.moduleRun.id, initialRunId);
    console.log('PASS refresh restored the participant session and reused the unfinished module run');

    const created = await firstClient.send('Target.createTarget', { url: `${siteUrl}/?recovery_second_tab=${Date.now()}` });
    secondTargetId = created.targetId;
    const secondTarget = await poll(async () => (await readTargets()).find((target) => target.id === secondTargetId && target.webSocketDebuggerUrl), 20000, 200);
    secondClient = new CdpClient(secondTarget.webSocketDebuggerUrl);
    await secondClient.ready();
    await enablePage(secondClient);
    await waitForExpression(secondClient, `globalThis.__resilienceTest?.getState()?.role === 'tester'`, 30000);
    const concurrent = await startModule(secondClient, 4);
    assert.ok(concurrent.every((result) => result.status === 200), JSON.stringify(concurrent));
    assert.ok(concurrent.every((result) => result.data.moduleRun.id === initialRunId), JSON.stringify(concurrent));
    console.log('PASS second tab and four concurrent starts reused the same unfinished module run');

    assert.ok(blockedEventFailures.length >= 1);
    assert.ok(eventResponses.includes(202));
    assert.deepEqual(unexpectedFailures, []);
    assert.deepEqual(consoleErrors, []);
    console.log(`PASS recovery smoke; stable moduleRunId=${initialRunId}`);
} finally {
    if (secondTargetId && firstClient) {
        try {
            await firstClient.send('Target.closeTarget', { targetId: secondTargetId });
        } catch {
            // Browser shutdown below is sufficient.
        }
    }
    secondClient?.close();
    firstClient?.close();
    browser.kill();
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), delay(2000)]);
    try {
        fs.rmSync(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (error) {
        console.warn(`Browser profile cleanup deferred: ${error.code || error.message}`);
    }
}

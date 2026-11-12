import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';

const siteUrl = String(process.env.MAINLAND_SITE_URL || process.argv[2] || 'https://www.resilience-training.cloud').replace(/\/+$/, '');
const edgePath = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
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
const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'resilience-edge-smoke-'));
const browser = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profilePath}`,
    'about:blank'
], { stdio: 'ignore', windowsHide: true });
console.log(`STEP browser started on debug port ${debugPort}`);

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

async function readJson(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
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

let client;
const consoleErrors = [];
const failedRequests = [];
const apiRequests = [];

async function evaluate(expression, awaitPromise = true) {
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

async function waitForExpression(expression, timeoutMs = 30000) {
    return poll(() => evaluate(`Boolean(${expression})`), timeoutMs, 100);
}

async function navigate(url) {
    const loaded = new Promise((resolve) => {
        const listener = () => resolve();
        client.on('Page.loadEventFired', listener);
    });
    await client.send('Page.navigate', { url });
    await Promise.race([loaded, delay(20000).then(() => { throw new Error(`Navigation timed out: ${url}`); })]);
}

async function login() {
    await waitForExpression(`document.querySelector('#participantForm')`);
    await evaluate(`(() => {
        document.querySelector('#participantCodeInput').value = 'C_TEST';
        document.querySelector('#participantNameInput').value = 'sxq';
        document.querySelector('#participantConsentInput').checked = true;
        document.querySelector('#participantForm').requestSubmit();
        return true;
    })()`);
    await waitForExpression(`globalThis.__resilienceTest?.getState()?.role === 'tester'`, 30000);
    const status = await evaluate(`document.querySelector('#participantSessionStatus')?.textContent || ''`);
    assert.match(status, /C_TEST/);
    assert.match(status, /数据记录已连接/);
    console.log('PASS browser participant login and PostgreSQL connection');
}

async function resetModule() {
    const result = await evaluate(`(async () => {
        const session = JSON.parse(localStorage.getItem('__resilience_participant_session_v1__'));
        const response = await fetch('https://api.resilience-training.cloud/api/v1/module-runs/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantCode: session.participantCode, sessionId: session.sessionId, moduleId: '1-1', metadata: { source: 'edgeone-browser-smoke', testData: true } })
        });
        return { status: response.status, data: await response.json() };
    })()`);
    if (result.status === 200) {
        assert.equal(result.data.persisted, true);
        console.log('PASS browser test-account module reset');
        return;
    }
    assert.equal(result.status, 409, JSON.stringify(result));
    assert.equal(result.data.code, 'MODULE_NOT_COMPLETED');
    console.log('PASS browser test-account module already reset/not completed');
}

async function completeModule() {
    await evaluate(`globalThis.__resilienceTest.setFastMode(true); globalThis.__resilienceTest.setSkipMode(true); globalThis.__resilienceTest.openModule('1-1', { fastMode: true })`);
    await waitForExpression(`globalThis.__resilienceTest?.getState()?.currentModule === '1-1'`);

    let submittedIntro = false;
    for (let iteration = 0; iteration < 240; iteration += 1) {
        const state = await evaluate(`(() => ({
            step: globalThis.__resilienceTest?.getState()?.step,
            inputEnabled: !document.querySelector('#userInput')?.disabled,
            continueReady: Boolean(document.querySelector('.continue-btn:not(.disabled)')),
            completionVisible: document.querySelector('#moduleCompletionNotice')?.hidden === false,
            completionStatus: document.querySelector('[data-completion-status]')?.textContent || ''
        }))()`);

        if (state.completionVisible) {
            assert.match(state.completionStatus, /完成状态已保存/);
            console.log('PASS browser module 1-1 completion persisted');
            return;
        }
        if (state.inputEnabled && state.step === 6 && !submittedIntro) {
            await evaluate(`(() => {
                const input = document.querySelector('#userInput');
                input.value = '我叫测试者，来自上海，喜欢听音乐，希望培养平静。';
                document.querySelector('#sendBtn').click();
                return true;
            })()`);
            submittedIntro = true;
        } else if (state.continueReady) {
            await evaluate(`document.querySelector('.continue-btn:not(.disabled)')?.click()`);
        } else {
            await evaluate(`globalThis.__resilienceTest?.skipCurrentWait()`);
        }
        await delay(100);
    }
    throw new Error('Module 1-1 did not complete within the smoke-test loop');
}

async function verifyReplay() {
    await navigate(`${siteUrl}/?browser_smoke_replay=${Date.now()}`);
    await waitForExpression(`globalThis.__resilienceTest?.getState()?.role === 'tester'`, 30000);
    await evaluate(`globalThis.__resilienceTest.openModule('1-1', { fastMode: true })`);
    await waitForExpression(`globalThis.__resilienceTest?.getState()?.currentModule === '1-1'`);
    await delay(1000);
    const replay = await evaluate(`(() => ({
        inputDisabled: Boolean(document.querySelector('#userInput')?.disabled),
        text: document.querySelector('#chatMessages')?.textContent || '',
        continueVisible: Boolean(document.querySelector('.continue-btn'))
    }))()`);
    assert.equal(replay.inputDisabled, true);
    assert.equal(replay.continueVisible, false);
    assert.ok(replay.text.length > 80, 'Replay did not restore enough content');
    assert.match(replay.text, /测试者|上海|听音乐|心理弹性/);
    console.log('PASS browser completed-module replay');
}

try {
    const page = await poll(async () => {
        const targets = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
        return targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    }, 20000, 200);
    console.log('STEP DevTools page target found');

    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready();
    console.log('STEP DevTools connected');
    client.on('Runtime.consoleAPICalled', ({ type, args }) => {
        if (type === 'error') consoleErrors.push(args.map((arg) => arg.value || arg.description || '').join(' '));
    });
    client.on('Network.loadingFailed', ({ requestId, errorText, canceled }) => {
        if (!canceled) failedRequests.push({ requestId, errorText });
    });
    client.on('Network.requestWillBeSent', ({ request }) => {
        if (request.url.includes('api.resilience-training.cloud')) apiRequests.push(`${request.method} ${new URL(request.url).pathname}`);
    });
    await Promise.all([
        client.send('Page.enable'),
        client.send('Runtime.enable'),
        client.send('Network.enable')
    ]);

    console.log('STEP navigating to EdgeOne');
    await navigate(`${siteUrl}/?browser_smoke=${Date.now()}`);
    console.log('STEP page loaded');
    await login();
    console.log('STEP resetting test module');
    await resetModule();
    console.log('STEP completing module 1-1');
    await completeModule();
    console.log('STEP verifying replay');
    await verifyReplay();

    assert.ok(apiRequests.some((request) => request === 'POST /api/v1/participants/start'));
    assert.ok(apiRequests.some((request) => request === 'POST /api/v1/ai/hooks/module-1-1.intro-reply'));
    assert.ok(apiRequests.some((request) => request === 'POST /api/v1/module-runs/complete'));
    assert.ok(apiRequests.some((request) => request === 'POST /api/v1/conversation/replay'));
    assert.deepEqual(failedRequests, []);
    assert.deepEqual(consoleErrors, []);
    console.log(`PASS EdgeOne browser smoke; API requests observed: ${[...new Set(apiRequests)].join(', ')}`);
} finally {
    client?.close();
    browser.kill();
    await Promise.race([
        new Promise((resolve) => browser.once('exit', resolve)),
        delay(2000)
    ]);
    try {
        fs.rmSync(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (error) {
        console.warn(`Browser profile cleanup deferred: ${error.code || error.message}`);
    }
}

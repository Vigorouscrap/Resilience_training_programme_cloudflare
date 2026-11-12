import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { moduleDayIndex } from '../shared-contract/index.mjs';

const MODULE_IDS = Object.freeze(Array.from(
    { length: 6 },
    (_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => `${weekIndex + 1}-${dayIndex + 1}`)
).flat());

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
const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'resilience-modules-smoke-'));
const browser = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profilePath}`,
    'about:blank'
], { stdio: 'ignore', windowsHide: true });
console.log(`STEP module-smoke browser started on debug port ${debugPort}`);

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
const badResponses = [];

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
    const loaded = new Promise((resolve) => client.on('Page.loadEventFired', resolve));
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
    await evaluate(`globalThis.__resilienceTest.setFastMode(true); globalThis.__resilienceTest.setSkipMode(true)`);
    const status = await evaluate(`document.querySelector('#participantSessionStatus')?.textContent || ''`);
    assert.match(status, /C_TEST/);
    assert.match(status, /数据记录已连接/);
    console.log('PASS all-modules browser login and PostgreSQL connection');
}

async function installFetchRecorder() {
    await evaluate(`(() => {
        if (globalThis.__moduleSmokeNativeFetch) return true;
        globalThis.__moduleSmokeRequests = [];
        globalThis.__moduleSmokeNativeFetch = globalThis.fetch.bind(globalThis);
        globalThis.fetch = async (input, init = {}) => {
            const url = typeof input === 'string' ? input : input.url;
            const method = String(init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
            let body = null;
            if (typeof init.body === 'string') {
                try { body = JSON.parse(init.body); } catch { body = init.body; }
            }
            const record = { url, method, body, status: null, error: null, completed: false };
            globalThis.__moduleSmokeRequests.push(record);
            try {
                const response = await globalThis.__moduleSmokeNativeFetch(input, init);
                record.status = response.status;
                record.completed = true;
                return response;
            } catch (error) {
                record.error = String(error?.message || error);
                record.completed = true;
                throw error;
            }
        };
        return true;
    })()`);
}

async function verifyModuleEntry(moduleId) {
    const requestStartIndex = await evaluate(`globalThis.__moduleSmokeRequests.length`);
    const opened = await evaluate(`globalThis.__resilienceTest.openModule(${JSON.stringify(moduleId)}, { fastMode: true })`);
    assert.equal(opened, true, `${moduleId} could not be opened`);
    await waitForExpression(`globalThis.__resilienceTest?.getState()?.currentModule === ${JSON.stringify(moduleId)}`, 10000);

    const request = await poll(async () => {
        const requests = await evaluate(`globalThis.__moduleSmokeRequests.slice(${requestStartIndex})`);
        return requests.find((item) => (
            item.url.includes('/api/v1/module-runs/start')
            && item.body?.moduleId === moduleId
            && item.completed
        ));
    }, 15000, 100);
    assert.equal(request.status, 200, `${moduleId} module-runs/start returned ${request.status}: ${request.error || ''}`);

    await waitForExpression(`(() => {
        const practice = document.querySelector('#practicePage');
        const title = document.querySelector('#practiceTitle')?.textContent || '';
        const chat = document.querySelector('#chatMessages');
        return practice?.classList.contains('active')
            && title.includes(${JSON.stringify(moduleId)})
            && chat?.children.length > 0;
    })()`, 15000);

    const state = await evaluate(`(() => ({
        title: document.querySelector('#practiceTitle')?.textContent || '',
        textLength: (document.querySelector('#chatMessages')?.textContent || '').trim().length,
        childCount: document.querySelector('#chatMessages')?.children.length || 0,
        completed: JSON.parse(localStorage.getItem('__resilience_participant_session_v1__') || '{}')
            .access?.completedModuleIds?.includes(${JSON.stringify(moduleId)}) || false
    }))()`);
    assert.ok(state.textLength > 0, `${moduleId} rendered no visible text`);
    assert.ok(state.childCount > 0, `${moduleId} rendered no content nodes`);
    console.log(`PASS module ${moduleId} entry status=200 rendered=${state.childCount} completed=${state.completed}`);
    return state;
}

try {
    assert.equal(MODULE_IDS.length, 42);
    MODULE_IDS.forEach((moduleId, index) => assert.equal(moduleDayIndex(moduleId), index + 1));
    const page = await poll(async () => {
        const targets = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
        return targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    }, 20000, 200);
    console.log('STEP module-smoke DevTools page target found');

    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready();
    console.log('STEP module-smoke DevTools connected');
    client.on('Runtime.consoleAPICalled', ({ type, args }) => {
        if (type === 'error') consoleErrors.push(args.map((arg) => arg.value || arg.description || '').join(' '));
    });
    client.on('Network.loadingFailed', ({ requestId, errorText, canceled }) => {
        if (!canceled) failedRequests.push({ requestId, errorText });
    });
    client.on('Network.responseReceived', ({ response }) => {
        if (response.status >= 400 && (
            response.url.startsWith(siteUrl)
            || response.url.startsWith('https://api.resilience-training.cloud')
        )) {
            badResponses.push({ status: response.status, url: response.url });
        }
    });
    await Promise.all([
        client.send('Page.enable'),
        client.send('Runtime.enable'),
        client.send('Network.enable')
    ]);

    console.log('STEP module-smoke navigating to EdgeOne');
    await navigate(`${siteUrl}/?all_modules_smoke=${Date.now()}`);
    console.log('STEP module-smoke page loaded');
    await login();
    console.log('STEP module-smoke installing fetch recorder');
    await installFetchRecorder();

    const results = [];
    for (const moduleId of MODULE_IDS) {
        results.push({ moduleId, ...(await verifyModuleEntry(moduleId)) });
    }

    assert.equal(results.length, 42);
    assert.deepEqual(failedRequests, []);
    assert.deepEqual(badResponses, []);
    assert.deepEqual(consoleErrors, []);
    console.log(`PASS all ${results.length} module entry points; completed/replay entries=${results.filter((item) => item.completed).length}`);
} finally {
    client?.close();
    browser.kill();
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), delay(2000)]);
    try {
        fs.rmSync(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (error) {
        console.warn(`Browser profile cleanup deferred: ${error.code || error.message}`);
    }
}

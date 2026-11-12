import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const siteUrl = String(process.env.MAINLAND_SITE_URL || process.argv[2] || 'https://www.resilience-training.cloud').replace(/\/+$/, '');
const apiUrl = String(process.env.MAINLAND_API_URL || 'https://api.resilience-training.cloud').replace(/\/+$/, '');
const edgePath = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const scenarios = [
    { moduleId: '1-5', expected: ['audio', 'button'] },
    { moduleId: '2-4', expected: ['timer', 'button'] },
    { moduleId: '4-4', expected: ['quiz', 'input', 'ai'] },
    { moduleId: '6-6', expected: ['review', 'input'] }
];

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
const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'resilience-deep-smoke-'));
const browser = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profilePath}`,
    'about:blank'
], { stdio: 'ignore', windowsHide: true });
console.log(`STEP deep-smoke browser started on debug port ${debugPort}`);

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
const apiRequests = [];
const mediaResponses = [];

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
    await evaluate(`globalThis.__resilienceTest.setFastMode(true); globalThis.__resilienceTest.setSkipMode(false)`);
    console.log('PASS deep-smoke login and PostgreSQL connection');
}

async function installFeatureRecorder() {
    await evaluate(`(() => {
        if (globalThis.__deepSmokeFeatureObserver) return true;
        globalThis.__deepSmokeFeatures = { audio: 0, timer: 0, quiz: 0, review: 0, input: 0, button: 0 };
        const record = (root) => {
            if (!(root instanceof Element)) return;
            const matches = (selector) => root.matches(selector) || Boolean(root.querySelector(selector));
            if (matches('audio, .module5-replay-btn')) globalThis.__deepSmokeFeatures.audio += 1;
            if (matches('.card-timer, .countdown-wrapper, [class*="timer"]')) globalThis.__deepSmokeFeatures.timer += 1;
            if (matches('.module44-quiz-check, input[type=radio]')) globalThis.__deepSmokeFeatures.quiz += 1;
            if (matches('.module66-review-btn')) globalThis.__deepSmokeFeatures.review += 1;
            if (matches('#userInput:not(:disabled)')) globalThis.__deepSmokeFeatures.input += 1;
            if (matches('button, .continue-btn')) globalThis.__deepSmokeFeatures.button += 1;
        };
        globalThis.__deepSmokeFeatureObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(record);
                if (mutation.type === 'attributes') record(mutation.target);
            }
        });
        globalThis.__deepSmokeFeatureObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'disabled']
        });
        return true;
    })()`);
}

async function resetModule(moduleId, allowNotCompleted = true) {
    const result = await evaluate(`(async () => {
        const session = JSON.parse(localStorage.getItem('__resilience_participant_session_v1__'));
        const response = await fetch(${JSON.stringify(apiUrl + '/api/v1/module-runs/reset')}, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantCode: session.participantCode,
                sessionId: session.sessionId,
                moduleId: ${JSON.stringify(moduleId)},
                metadata: { source: 'edgeone-deep-smoke', testData: true }
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
    if (allowNotCompleted && result.status === 409 && result.data?.code === 'MODULE_NOT_COMPLETED') return;
    throw new Error(`Reset ${moduleId} failed: ${JSON.stringify(result)}`);
}

async function readState() {
    return evaluate(`(() => {
        const chat = document.querySelector('#chatMessages');
        const completion = document.querySelector('#moduleCompletionNotice');
        const input = document.querySelector('#userInput');
        const controls = Array.from(chat?.querySelectorAll('button:not(:disabled), .continue-btn:not(.disabled)') || []).map((element, index) => ({
            index,
            text: (element.textContent || '').trim(),
            className: element.className || '',
            state: element.dataset?.state || ''
        }));
        return {
            step: globalThis.__resilienceTest?.getState()?.step ?? -1,
            completionVisible: completion?.hidden === false,
            completionStatus: document.querySelector('[data-completion-status]')?.textContent || '',
            inputEnabled: Boolean(input && !input.disabled),
            controls,
            audioCount: chat?.querySelectorAll('audio, .module5-replay-btn').length || 0,
            timerCount: chat?.querySelectorAll('.card-timer, .countdown-wrapper').length || 0,
            quizCount: chat?.querySelectorAll('.module44-quiz-check, input[type=radio]').length || 0,
            reviewCount: chat?.querySelectorAll('.module66-review-btn').length || 0,
            textLength: (chat?.textContent || '').trim().length,
            textTail: (chat?.textContent || '').trim().slice(-240),
            observed: { ...(globalThis.__deepSmokeFeatures || {}) }
        };
    })()`);
}

async function handleQuiz() {
    return evaluate(`(() => {
        const chat = document.querySelector('#chatMessages');
        const inputs = Array.from(chat?.querySelectorAll('input[type=radio]:not(:disabled)') || []);
        if (!inputs.length) return false;
        const names = [...new Set(inputs.map((input) => input.name).filter(Boolean))];
        for (const name of names) {
            const input = inputs.find((item) => item.name === name);
            if (!input) continue;
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        chat.querySelector('.module44-quiz-check:not(:disabled)')?.click();
        return true;
    })()`);
}

async function handleReview() {
    return evaluate(`(() => {
        const panel = document.querySelector('.module66-review-panel');
        if (!panel) return false;
        const buttons = Array.from(panel.querySelectorAll('.module66-review-btn'));
        const complete = buttons.find((button) => button.textContent.trim() === '已全部了解');
        if (complete) { complete.click(); return true; }
        const nested = panel.querySelector('.module66-review-branch .module66-review-btn:not(.is-complete)');
        if (nested) { nested.click(); return true; }
        const section = panel.querySelector('.module66-review-group .module66-review-btn:not(.is-complete)');
        if (section) { section.click(); return true; }
        return false;
    })()`);
}

async function clickBySelector(selector, index = 0) {
    const point = await evaluate(`(() => {
        const elements = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
        const element = elements[${index}];
        if (!element) return null;
        element.scrollIntoView({ block: 'center', inline: 'center' });
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    if (!point) return false;
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    return true;
}

async function driveScenario(scenario) {
    const { moduleId } = scenario;
    await evaluate(`(() => {
        document.querySelector('[data-completion-dismiss]')?.click();
        globalThis.__deepSmokeFeatures = { audio: 0, timer: 0, quiz: 0, review: 0, input: 0, button: 0 };
        return true;
    })()`);
    await resetModule(moduleId);
    const requestStart = apiRequests.length;
    const mediaStart = mediaResponses.length;
    const features = new Set();
    let lastState = null;
    const opened = await evaluate(`globalThis.__resilienceTest.openModule(${JSON.stringify(moduleId)}, { fastMode: true })`);
    assert.equal(opened, true, `${moduleId} could not be opened`);
    await waitForExpression(`globalThis.__resilienceTest?.getState()?.currentModule === ${JSON.stringify(moduleId)}`, 15000);

    for (let iteration = 0; iteration < 650; iteration += 1) {
        const state = await readState();
        lastState = state;
        if (state.audioCount > 0 || mediaResponses.length > mediaStart) features.add('audio');
        if (state.timerCount > 0 || state.observed.timer > 0) features.add('timer');
        if (state.quizCount > 0 || state.observed.quiz > 0) features.add('quiz');
        if (state.reviewCount > 0 || state.observed.review > 0) features.add('review');
        if (state.inputEnabled || state.observed.input > 0) features.add('input');
        if (state.controls.length > 0 || state.observed.button > 0) features.add('button');
        if (state.observed.audio > 0) features.add('audio');
        if (apiRequests.slice(requestStart).some((item) => item.includes('/api/v1/ai/hooks/'))) features.add('ai');

        if (state.completionVisible) {
            try {
                assert.match(state.completionStatus, /完成状态已保存/);
                scenario.expected.forEach((feature) => assert.ok(features.has(feature), `${moduleId} did not exercise ${feature}; observed=${JSON.stringify(state.observed)}`));
                assert.ok(state.textLength > 100, `${moduleId} rendered too little content`);
                assert.ok(apiRequests.slice(requestStart).includes('POST /api/v1/module-runs/complete'));
                console.log(`PASS deep module ${moduleId} completed features=${[...features].sort().join(',')}`);
            } finally {
                await evaluate(`document.querySelector('[data-completion-dismiss]')?.click()`);
                await resetModule(moduleId, false);
            }
            return;
        }

        if (state.quizCount > 0 && await handleQuiz()) {
            await delay(100);
            continue;
        }
        if (state.reviewCount > 0 && await handleReview()) {
            await delay(100);
            continue;
        }
        if (state.inputEnabled) {
            await evaluate(`(() => {
                const input = document.querySelector('#userInput');
                input.value = '这是 M5 自动化测试回答：我会观察当下感受，允许想法存在，并选择有价值的行动。';
                document.querySelector('#sendBtn').click();
                return true;
            })()`);
            await delay(250);
            continue;
        }

        const candidate = state.controls.find((control) => {
            if (/返回主页|返回目录|更换信息|再次播放|跳过/.test(control.text)) return false;
            return true;
        });
        if (candidate) {
            if (candidate.className.includes('continue-btn')) {
                assert.equal(await clickBySelector('#chatMessages #continueBtn:not(.disabled)'), true);
            } else {
                assert.equal(await clickBySelector('#chatMessages button:not(:disabled), #chatMessages .continue-btn:not(.disabled)', candidate.index), true);
            }
        } else {
            await evaluate(`globalThis.__resilienceTest?.skipCurrentWait()`);
        }
        await delay(100);
    }
    throw new Error(`Module ${moduleId} did not complete; features=${[...features].join(',')}; lastState=${JSON.stringify(lastState)}`);
}

try {
    const page = await poll(async () => {
        const targets = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
        return targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    }, 20000, 200);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready();
    client.on('Runtime.consoleAPICalled', ({ type, args }) => {
        if (type === 'error') consoleErrors.push(args.map((arg) => arg.value || arg.description || '').join(' '));
    });
    client.on('Network.loadingFailed', ({ requestId, errorText, canceled }) => {
        if (!canceled) failedRequests.push({ requestId, errorText });
    });
    client.on('Network.requestWillBeSent', ({ request }) => {
        if (request.url.startsWith(apiUrl)) apiRequests.push(`${request.method} ${new URL(request.url).pathname}`);
    });
    client.on('Network.responseReceived', ({ response }) => {
        if (/\.(mp3|mp4|mov)(?:\?|$)/i.test(response.url)) mediaResponses.push({ status: response.status, url: response.url });
        const expectedResetConflict = response.status === 409 && response.url === `${apiUrl}/api/v1/module-runs/reset`;
        if (response.status >= 400 && (response.url.startsWith(siteUrl) || response.url.startsWith(apiUrl))) {
            if (!expectedResetConflict) badResponses.push({ status: response.status, url: response.url });
        }
    });
    await Promise.all([client.send('Page.enable'), client.send('Runtime.enable'), client.send('Network.enable')]);
    await navigate(`${siteUrl}/?deep_smoke=${Date.now()}`);
    await login();
    await installFeatureRecorder();
    for (const scenario of scenarios) await driveScenario(scenario);
    assert.deepEqual(failedRequests, []);
    assert.deepEqual(badResponses, []);
    assert.deepEqual(consoleErrors, []);
    console.log(`PASS representative deep interaction smoke: ${scenarios.map(({ moduleId }) => moduleId).join(', ')}`);
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

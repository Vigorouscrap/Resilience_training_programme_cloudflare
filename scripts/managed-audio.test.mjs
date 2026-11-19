import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(projectRoot, 'src');
const browserPath = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function removeTempDirectory(directory) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
            fs.rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
            return;
        } catch (error) {
            const retryable = process.platform === 'win32'
                && ['EPERM', 'EBUSY', 'ENOTEMPTY'].includes(error.code);
            if (!retryable) throw error;
            if (attempt === 11) {
                process.stderr.write(`Warning: browser profile cleanup deferred: ${directory} (${error.code})\n`);
                return;
            }
            await delay(300);
        }
    }
}

async function poll(fn) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        const result = await fn();
        if (result) return result;
        await delay(50);
    }
    throw new Error('Timed out waiting for audio/browser state');
}

class CdpClient {
    constructor(url) {
        this.socket = new WebSocket(url);
        this.nextId = 0;
        this.pending = new Map();
        this.socket.addEventListener('message', ({ data }) => {
            const message = JSON.parse(data);
            const callback = this.pending.get(message.id);
            if (!callback) return;
            this.pending.delete(message.id);
            clearTimeout(callback.timer);
            if (message.error) callback.reject(new Error(message.error.message));
            else callback.resolve(message.result);
        });
    }

    async ready() {
        if (this.socket.readyState === WebSocket.OPEN) return;
        await poll(() => {
            if (this.socket.readyState === WebSocket.CLOSED) throw new Error('Browser connection closed');
            return this.socket.readyState === WebSocket.OPEN;
        });
    }

    send(method, params = {}) {
        const id = ++this.nextId;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`DevTools timeout: ${method}`));
            }, 15000);
            this.pending.set(id, { resolve, reject, timer });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }

    async evaluate(expression) {
        const result = await this.send('Runtime.evaluate', {
            expression, awaitPromise: true, returnByValue: true, userGesture: true
        });
        if (result.exceptionDetails) {
            throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        }
        return result.result.value;
    }
}

test('managed audio lifecycle in a real browser (no production API calls)', { timeout: 120000 }, async (t) => {
    assert.ok(fs.existsSync(browserPath), 'Set EDGE_PATH to a Chromium/Edge executable');
    const server = http.createServer(async (request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        if (pathname === '/') {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.end('<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1">'
                + '<link rel="stylesheet" href="/css/styles.css"><body><main id="root" class="chat-messages"></main></body></html>');
            return;
        }
        if (pathname === '/favicon.ico') {
            response.writeHead(204).end();
            return;
        }
        const filename = path.resolve(sourceRoot, '.' + pathname);
        if (!filename.startsWith(sourceRoot + path.sep)) {
            response.writeHead(403).end();
            return;
        }
        try {
            const data = await fs.promises.readFile(filename);
            response.setHeader('Content-Type', ({
                '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
                '.css': 'text/css', '.mp3': 'audio/mpeg'
            })[path.extname(filename)] || 'application/octet-stream');
            response.end(data);
        } catch {
            response.writeHead(404).end();
        }
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const portProbe = net.createServer();
    portProbe.listen(0, '127.0.0.1');
    await once(portProbe, 'listening');
    const debugPort = portProbe.address().port;
    await new Promise((resolve) => portProbe.close(resolve));
    const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'resilience-media-test-'));
    const browser = spawn(browserPath, [
        '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profilePath}`, 'about:blank'
    ], { stdio: 'ignore', windowsHide: true });
    let client;
    const browserErrors = [];
    try {
        const target = await poll(async () => {
            try {
                const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
                return targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
            } catch {
                return null;
            }
        });
        client = new CdpClient(target.webSocketDebuggerUrl);
        await client.ready();
        client.socket.addEventListener('message', ({ data }) => {
            const message = JSON.parse(data);
            if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params);
        });
        await client.send('Runtime.enable');
        await client.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
        await poll(() => client.evaluate("!!document.querySelector('#root')"));
        await client.evaluate(`(async () => {
            globalThis.ui = await import('/js/ui.js');
            globalThis.root = document.querySelector('#root');
            root.dataset.dialogueSessionId = '1';
            globalThis.completions = 0;
            globalThis.hiddenForTest = false;
            Object.defineProperty(document, 'visibilityState', {
                configurable: true, get: () => hiddenForTest ? 'hidden' : 'visible'
            });
            globalThis.setVisibility = (hidden) => {
                hiddenForTest = hidden;
                document.dispatchEvent(new Event('visibilitychange'));
            };
            globalThis.nativePlay = HTMLMediaElement.prototype.play;
            globalThis.startAudio = () => {
                globalThis.audio = ui.playManagedAudio(root, 'audio/module15/1-5牛奶牛奶体验.mp3', {
                    recordEvent: false, onEnded: () => { completions += 1; }
                });
            };
        })()`);

        await t.test('real MP3 pauses in background, preserves position, and resumes by click', async () => {
            await client.evaluate('startAudio()');
            await poll(() => client.evaluate('audio.currentTime > 0.15 && !audio.paused'));
            const before = await client.evaluate('audio.currentTime');
            await client.evaluate('setVisibility(true)');
            await delay(250);
            const paused = await client.evaluate('({ paused: audio.paused, time: audio.currentTime, completions })');
            assert.equal(paused.paused, true);
            assert.ok(Math.abs(paused.time - before) < 0.2);
            assert.equal(paused.completions, 0);
            await client.evaluate('setVisibility(false)');
            assert.equal(await client.evaluate('audio.paused'), true, 'Return must not restart hidden audio automatically');
            assert.equal(await client.evaluate("!!root.querySelector('.audio-resume-btn')"), true);
            await client.evaluate("root.querySelector('.audio-resume-btn').click()");
            await poll(() => client.evaluate(`!audio.paused && audio.currentTime > ${paused.time + 0.1}`));
            assert.equal(await client.evaluate("!!root.querySelector('.audio-resume-btn')"), false);
        });

        await t.test('repeated switches and responsive resume control do not advance the lesson', async () => {
            await client.send('Emulation.setDeviceMetricsOverride', {
                width: 390, height: 844, deviceScaleFactor: 1, mobile: true
            });
            await client.evaluate('setVisibility(true); setVisibility(false); setVisibility(true); setVisibility(false)');
            assert.deepEqual(await client.evaluate(`({
                paused: audio.paused, count: root.querySelectorAll('.audio-resume-btn').length, completions
            })`), { paused: true, count: 1, completions: 0 });
            assert.equal(await client.evaluate(`(() => {
                const rect = root.querySelector('.audio-resume-btn').getBoundingClientRect();
                return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth;
            })()`), true);
            await client.evaluate("root.querySelector('.audio-resume-btn').click()");
            await poll(() => client.evaluate('!audio.paused'));
            await client.send('Emulation.clearDeviceMetricsOverride');
        });

        await t.test('stopping a paused audio cancels resume and does not call onEnded', async () => {
            await client.evaluate('setVisibility(true); ui.stopManagedMedia(root); setVisibility(false)');
            assert.deepEqual(await client.evaluate(`({
                paused: audio.paused, audios: root.querySelectorAll('audio').length,
                controls: root.querySelectorAll('.audio-resume-btn').length, completions
            })`), { paused: true, audios: 0, controls: 0, completions: 0 });
        });

        await t.test('background creation waits for an explicit foreground click', async () => {
            await client.evaluate('setVisibility(true); startAudio()');
            await poll(() => client.evaluate("!!root.querySelector('.audio-resume-btn')"));
            assert.equal(await client.evaluate('audio.paused && audio.currentTime === 0'), true);
            await client.evaluate('setVisibility(false)');
            assert.equal(await client.evaluate('audio.paused'), true);
            await client.evaluate("root.querySelector('.audio-resume-btn').click()");
            await poll(() => client.evaluate('audio.currentTime > 0.1'));
        });

        await t.test('background creation stays paused when animation frames wait until foreground', async () => {
            await client.evaluate(`ui.stopManagedMedia(root); setVisibility(true);
                globalThis.nativeRaf = requestAnimationFrame;
                globalThis.heldFrames = [];
                globalThis.requestAnimationFrame = (callback) => heldFrames.push(callback);
                startAudio();`);
            try {
                assert.equal(await client.evaluate("audio.paused && !!root.querySelector('.audio-resume-btn')"), true);
                await client.evaluate(`setVisibility(false);
                    while (heldFrames.length) heldFrames.shift()(performance.now());`);
                await delay(100);
                assert.equal(await client.evaluate('audio.paused && audio.currentTime === 0 && completions === 0'), true);
            } finally {
                await client.evaluate('globalThis.requestAnimationFrame = nativeRaf; ui.stopManagedMedia(root)');
            }
        });

        await t.test('pending play AbortError after hiding does not complete or remove audio', async () => {
            await client.evaluate(`ui.stopManagedMedia(root);
                HTMLMediaElement.prototype.play = function () {
                    globalThis.pendingAudio = this;
                    return new Promise((resolve, reject) => { globalThis.rejectPlay = reject; });
                };
                startAudio();`);
            await poll(() => client.evaluate('globalThis.pendingAudio === audio'));
            await client.evaluate(`setVisibility(true);
                rejectPlay(new DOMException('Interrupted', 'AbortError'));
                setVisibility(false);`);
            await delay(50);
            assert.equal(await client.evaluate("audio.isConnected && !!root.querySelector('.audio-resume-btn') && completions === 0"), true);
            await client.evaluate('HTMLMediaElement.prototype.play = nativePlay; ui.stopManagedMedia(root)');
        });

        await t.test('autoplay denial offers retry instead of skipping the lesson', async () => {
            await client.evaluate(`HTMLMediaElement.prototype.play = () =>
                Promise.reject(new DOMException('Gesture required', 'NotAllowedError'));
                startAudio();`);
            await poll(() => client.evaluate("!!root.querySelector('.audio-resume-btn')"));
            assert.equal(await client.evaluate('audio.isConnected && completions === 0'), true);
            await client.evaluate("HTMLMediaElement.prototype.play = nativePlay; root.querySelector('.audio-resume-btn').click()");
            await poll(() => client.evaluate('!audio.paused'));
        });

        await t.test('replaced audio and canceled animation frames never resume stale media', async () => {
            await client.evaluate(`globalThis.oldAudio = audio; startAudio();
                globalThis.canceledAudio = audio; ui.stopManagedMedia(root);`);
            await delay(100);
            assert.equal(await client.evaluate('oldAudio.paused && canceledAudio.paused && !canceledAudio.isConnected && completions === 0'), true);
            await client.evaluate('startAudio()');
            await poll(() => client.evaluate('!audio.paused'));
            await client.evaluate("setVisibility(true); root.dataset.dialogueSessionId = '2'; setVisibility(false)");
            assert.equal(await client.evaluate('audio.paused && !audio.isConnected && completions === 0'), true);
        });

        await t.test('OS/browser pause exposes the same resume action', async () => {
            await client.evaluate('startAudio()');
            await poll(() => client.evaluate('!audio.paused'));
            await client.evaluate('audio.pause()');
            await poll(() => client.evaluate("!!root.querySelector('.audio-resume-btn')"));
            assert.equal(await client.evaluate('completions'), 0);
            await client.evaluate('ui.stopManagedMedia(root)');
        });

        await t.test('late wake lock requests are released; foreground resume can request again', async () => {
            await client.evaluate(`globalThis.lockRequests = []; globalThis.lockReleases = 0;
                Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: {
                    request: () => new Promise((resolve) => lockRequests.push(resolve))
                } });
                startAudio();
                Object.defineProperty(audio, 'duration', { value: 60 });`);
            await poll(() => client.evaluate('lockRequests.length === 1'));
            await client.evaluate(`setVisibility(true);
                lockRequests[0]({ release: async () => { lockReleases += 1; } });`);
            await poll(() => client.evaluate('lockReleases === 1'));
            await client.evaluate("setVisibility(false); root.querySelector('.audio-resume-btn').click()");
            await poll(() => client.evaluate('lockRequests.length === 2'));
            await client.evaluate(`lockRequests[1]({
                release: async () => { lockReleases += 1; }, addEventListener: () => {}
            });`);
            await delay(50);
            await client.evaluate('ui.stopManagedMedia(root)');
            await poll(() => client.evaluate('lockReleases === 2'));
            await client.evaluate("delete navigator.wakeLock");
        });

        await t.test('module 1-5 waits for audio, not an independent 17-second deadline', async () => {
            await client.evaluate(`(async () => {
                const { module15Handlers } = await import('/js/dialogue/modules/module15.js');
                globalThis.repetitions = 0;
                globalThis.module15 = {
                    ...module15Handlers, step: 4, chatMessages: root,
                    startSentenceRepetition: () => { repetitions += 1; }
                };
                module15.onContinue_Module15();
                globalThis.audio = root.querySelector('audio');
            })()`);
            await poll(() => client.evaluate('!audio.paused'));
            await client.evaluate(`setVisibility(true); globalThis.nativeNow = Date.now;
                Date.now = () => nativeNow() + 18000;`);
            try {
                await delay(1200);
                assert.equal(await client.evaluate('repetitions === 0 && audio.paused'), true);
            } finally {
                await client.evaluate('Date.now = nativeNow');
            }
            await client.evaluate("setVisibility(false); root.querySelector('.audio-resume-btn').click()");
            await poll(() => client.evaluate('!audio.paused'));
            await client.evaluate("audio.dispatchEvent(new Event('ended'))");
            assert.equal(await client.evaluate('repetitions'), 1);
        });

        await t.test('normal end and skip still advance exactly once', async () => {
            await client.evaluate("startAudio()");
            await poll(() => client.evaluate('!audio.paused'));
            await client.evaluate("audio.dispatchEvent(new Event('ended')); audio.dispatchEvent(new Event('ended'))");
            assert.equal(await client.evaluate('completions'), 1);
            await client.evaluate('startAudio(); ui.skipCurrentWait(root); ui.skipCurrentWait(root)');
            await delay(100);
            assert.equal(await client.evaluate('completions === 2 && audio.paused && !audio.isConnected'), true);
        });
        await t.test('ICP footers render on desktop/mobile and login validation still works', async () => {
            await client.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/index.html` });
            await poll(() => client.evaluate("document.querySelector('#participantFormNote .icp-record') && document.activeElement.id === 'participantCodeInput'"));
            const screenshotDir = path.join(projectRoot, '.cache', 'media-test');
            fs.mkdirSync(screenshotDir, { recursive: true });
            for (const width of [1280, 390]) {
                await client.send('Emulation.setDeviceMetricsOverride', {
                    width, height: 900, deviceScaleFactor: 1, mobile: width < 500
                });
                await client.evaluate("document.querySelector('#participantResetBtn').click()");
                assert.deepEqual(await client.evaluate(`Array.from(document.querySelectorAll('.icp-record'), (link) => ({
                    text: link.textContent, href: link.href, target: link.target
                }))`), Array(2).fill({ text: '\u7ca4ICP\u59072026085109\u53f7', href: 'https://beian.miit.gov.cn/', target: '_blank' }));
                assert.equal(await client.evaluate(`(() => {
                    const link = document.querySelector('#participantFormNote .icp-record');
                    const rect = link.getBoundingClientRect();
                    const style = getComputedStyle(link);
                    const parentRect = link.parentElement.getBoundingClientRect();
                    const centerDelta = Math.abs((rect.left + rect.right) / 2 - (parentRect.left + parentRect.right) / 2);
                    return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth
                        && centerDelta < 1 && parseFloat(style.fontSize) < 14
                        && style.fontWeight === '400';
                })()`), true);
                const loginShot = await client.send('Page.captureScreenshot', { format: 'png' });
                fs.writeFileSync(path.join(screenshotDir, `login-${width}.png`), Buffer.from(loginShot.data, 'base64'));
                await client.evaluate("document.querySelector('#participantForm').requestSubmit()");
                assert.equal(await client.evaluate("document.querySelector('#participantFormNote').classList.contains('warning') && !document.querySelector('#participantFormNote .icp-record')"), true);
                await client.evaluate("document.querySelector('#participantResetBtn').click()");
                assert.equal(await client.evaluate("!!document.querySelector('#participantFormNote .icp-record')"), true);
                // Inspect the home layout without logging in or contacting a production API.
                await client.evaluate("document.querySelector('#participantGate').hidden = true; document.querySelector('#participantGate').classList.remove('active'); document.querySelector('#homePage').inert = false");
                assert.equal(await client.evaluate(`(() => {
                    const rect = document.querySelector('.footer-note .icp-record').getBoundingClientRect();
                    return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth;
                })()`), true);
                const homeShot = await client.send('Page.captureScreenshot', { format: 'png' });
                fs.writeFileSync(path.join(screenshotDir, `home-${width}.png`), Buffer.from(homeShot.data, 'base64'));
            }
        });
        assert.deepEqual(browserErrors, []);
    } finally {
        await client?.send('Browser.close').catch(() => {});
        client?.socket.close();
        if (browser.exitCode === null) browser.kill();
        if (browser.exitCode === null) {
            await Promise.race([once(browser, 'exit'), delay(3000)]);
        }
        await new Promise((resolve) => server.close(resolve));
        await removeTempDirectory(profilePath);
    }
});

/**
 * main.js - 主应用程序入口
 * 初始化应用，绑定事件，协调各个模块
 */

import { PageManager } from './pages.js';
import { PracticeTimer } from './timer.js';
import { DialogueManager } from './dialogue.js';
import { weekTitles, subModuleNames } from './data.js';
import { skipCurrentWait } from './ui.js';
import {
    clearParticipantSession,
    getParticipantSession,
    startParticipantSession,
    startModuleRun,
    updateParticipantSessionAccess,
    recordResearchEvents,
    getConversationReplay,
    validateParticipantIdentity
} from './services/participantSession.js';

const TESTING_GLOBAL_KEY = '__RESILIENCE_TESTING__';
const TESTING_API_KEY = '__resilienceTest';

function parseBooleanFlag(value) {
    if (value == null) return false;
    return /^(1|true|yes|on)$/i.test(String(value).trim());
}

function normalizeModuleId(value) {
    const rawValue = String(value || '').trim();
    if (!rawValue) return '';

    const directMatch = rawValue.match(/^(\d)-(\d)$/);
    if (directMatch) {
        return `${directMatch[1]}-${directMatch[2]}`;
    }

    const compactMatch = rawValue.match(/^module(\d)(\d)$/i) || rawValue.match(/^(\d)(\d)$/);
    if (compactMatch) {
        return `${compactMatch[1]}-${compactMatch[2]}`;
    }

    return rawValue;
}

function getModuleMeta(moduleId) {
    const match = String(moduleId || '').match(/^(\d)-(\d)$/);
    if (!match) return null;

    const weekIdx = Number(match[1]) - 1;
    const dayIdx = Number(match[2]) - 1;
    const moduleTitle = subModuleNames[weekIdx]?.[dayIdx];

    if (!moduleTitle) return null;

    return {
        moduleId: `${weekIdx + 1}-${dayIdx + 1}`,
        weekIdx,
        dayIdx,
        weekTitle: weekTitles[weekIdx],
        moduleTitle
    };
}

function ensureTestingConfig() {
    const currentConfig = globalThis[TESTING_GLOBAL_KEY];
    if (currentConfig && typeof currentConfig === 'object') {
        return currentConfig;
    }

    const nextConfig = {};
    globalThis[TESTING_GLOBAL_KEY] = nextConfig;
    return nextConfig;
}

function updateTestingConfig(nextValues = {}) {
    const config = ensureTestingConfig();
    Object.assign(config, nextValues);
    return config;
}

function getTestingConfigFromUrl() {
    const searchParams = new URLSearchParams(globalThis.location?.search || '');
    return {
        moduleId: normalizeModuleId(searchParams.get('module')),
        fastMode: parseBooleanFlag(searchParams.get('fast')),
        skipMode: parseBooleanFlag(searchParams.get('skip'))
    };
}

function enableFastRuntime() {
    const config = ensureTestingConfig();
    if (config.runtimePatched) return;

    const nativeSetTimeout = config.nativeSetTimeout || globalThis.setTimeout.bind(globalThis);
    const nativeSetInterval = config.nativeSetInterval || globalThis.setInterval.bind(globalThis);
    const nativeDateNow = config.nativeDateNow || Date.now.bind(Date);
    const realStart = nativeDateNow();
    const acceleratedSpeed = 1000;

    config.nativeSetTimeout = nativeSetTimeout;
    config.nativeSetInterval = nativeSetInterval;
    config.nativeDateNow = nativeDateNow;

    globalThis.setTimeout = (handler, timeout = 0, ...args) => {
        const nextTimeout = Math.max(0, Math.min(Number(timeout) || 0, 1));
        return nativeSetTimeout(handler, nextTimeout, ...args);
    };

    globalThis.setInterval = (handler, timeout = 0, ...args) => {
        const nextInterval = Math.max(0, Math.min(Number(timeout) || 0, 1));
        return nativeSetInterval(handler, nextInterval, ...args);
    };

    Date.now = () => realStart + ((nativeDateNow() - realStart) * acceleratedSpeed);

    config.runtimePatched = true;
}

function disableFastRuntime() {
    const config = ensureTestingConfig();
    if (!config.runtimePatched) return;

    if (config.nativeSetTimeout) {
        globalThis.setTimeout = config.nativeSetTimeout;
    }
    if (config.nativeSetInterval) {
        globalThis.setInterval = config.nativeSetInterval;
    }
    if (config.nativeDateNow) {
        Date.now = config.nativeDateNow;
    }

    config.runtimePatched = false;
}

function stopSpeech() {
    const synth = globalThis.speechSynthesis;
    if (synth && typeof synth.cancel === 'function') {
        synth.cancel();
    }
}

function formatParticipantStatus(session) {
    if (!session) {
        return '尚未验证参与信息。';
    }

    const storageText = session.persisted ? '数据记录已连接' : '已连接练习流程，暂未启用真实入库';
    if (session.access?.canAccessAllModules) {
        return `当前编号：${session.participantCode}，姓名：${session.participantName || '未记录'}，测试权限已开启，可访问全部模块。${storageText}。`;
    }

    const unlockedDayIndex = Number(session.access?.unlockedDayIndex) || 1;
    return `当前编号：${session.participantCode}，姓名：${session.participantName || '未记录'}，已解锁至第 ${unlockedDayIndex} 天。${storageText}。`;
}

// 初始化应用
function initApp() {
    // 获取DOM元素
    const homePage = document.getElementById('homePage');
    const dailyPage = document.getElementById('dailyPage');
    const practicePage = document.getElementById('practicePage');
    const weekTiles = document.querySelectorAll('.week-tile');
    const backFromDaily = document.getElementById('backFromDaily');
    const backFromPractice = document.getElementById('backFromPractice');
    const weekTitleDisplay = document.getElementById('weekTitleDisplay');
    const subModulesDiv = document.getElementById('subModulesList');
    const practiceTitle = document.getElementById('practiceTitle');
    const timerDisplay = document.getElementById('timerDisplay');
    const chatMessages = document.getElementById('chatMessages');
    const inputArea = document.getElementById('inputArea');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const participantGate = document.getElementById('participantGate');
    const participantSessionChip = document.getElementById('participantSessionChip');
    const participantForm = document.getElementById('participantForm');
    const participantCodeInput = document.getElementById('participantCodeInput');
    const participantNameInput = document.getElementById('participantNameInput');
    const participantConsentInput = document.getElementById('participantConsentInput');
    const participantStartBtn = document.getElementById('participantStartBtn');
    const participantResetBtn = document.getElementById('participantResetBtn');
    const participantSessionStatus = document.getElementById('participantSessionStatus');
    const participantFormNote = document.getElementById('participantFormNote');

    // 初始化各个模块
    const practiceTimer = new PracticeTimer(timerDisplay);

    const pageManager = new PageManager(
        homePage,
        dailyPage,
        practicePage,
        weekTitleDisplay,
        subModulesDiv,
        practiceTitle,
        () => practiceTimer.start(),
        () => practiceTimer.stop()
    );

    const dialogueManager = new DialogueManager(chatMessages, inputArea, userInput);
    let pendingResearchEvents = [];
    let researchEventTimer = null;
    const flushResearchEvents = () => {
        if (!pendingResearchEvents.length) return;
        const batch = pendingResearchEvents.splice(0, 100);
        void recordResearchEvents(batch).catch(() => {});
    };
    globalThis.__RESILIENCE_RECORD_EVENT__ = (event) => {
        if (!participantSession || !dialogueManager.currentModule || !event || globalThis.__RESILIENCE_REPLAYING__) return;
        pendingResearchEvents.push({ ...event, moduleId: dialogueManager.currentModule, step: dialogueManager.step });
        if (!researchEventTimer) researchEventTimer = setTimeout(() => { researchEventTimer = null; flushResearchEvents(); }, 200);
    };
    let moduleRunStartPromise = null;
    let completionNotice = document.getElementById('moduleCompletionNotice');
    let testingTools = document.getElementById('testingTools');
    let participantSession = getParticipantSession();
    pageManager.setParticipantSession(participantSession);

    function renderParticipantSession(session, options = {}) {
        participantSession = session || null;
        pageManager.setParticipantSession(participantSession);
        pageManager.renderWeekLocks();
        const gateActive = !participantSession;
        participantGate.classList.toggle('active', gateActive);
        participantGate.hidden = !gateActive;
        participantGate.setAttribute('aria-hidden', String(!gateActive));
        homePage.inert = gateActive;
        participantSessionChip.hidden = gateActive;
        participantSessionStatus.textContent = options.message || formatParticipantStatus(participantSession);
        if (!options.preserveInputs) {
            participantCodeInput.value = participantSession?.participantCode || '';
            participantNameInput.value = participantSession?.participantName || '';
            participantConsentInput.checked = false;
        }
        participantFormNote.textContent = options.formMessage || '未完成确认前，练习模块不会开放，也不会保存研究数据。';
        participantFormNote.classList.toggle('warning', Boolean(options.warning));
        participantCodeInput.disabled = false;
        participantNameInput.disabled = false;
        participantConsentInput.disabled = false;
        if (testingTools) {
            const tester = Boolean(participantSession && ['tester', 'admin'].includes(participantSession.role));
            testingTools.hidden = !tester;
            testingTools.setAttribute('aria-hidden', String(!tester));
            if (tester) {
                // 测试账号显示模块内的跳过按钮；等待仍默认保留，点击按钮才会跳过。
                updateTestingConfig({ skipMode: true, skipWaits: false });
            } else {
                updateTestingConfig({ skipMode: false, skipWaits: false, fastMode: false });
                disableFastRuntime();
            }
        }
        if (gateActive && !options.preserveInputs) requestAnimationFrame(() => participantCodeInput.focus());
    }

    function showCompletionNotice(moduleMeta, response) {
        if (!completionNotice) return;
        completionNotice.querySelector('[data-completion-module]').textContent = moduleMeta.moduleId;
        completionNotice.querySelector('[data-completion-status]').textContent = response?.persisted === false ? '本次完成状态暂未成功保存，请稍后重试。' : '完成状态已保存。';
        completionNotice.hidden = false;
        completionNotice.setAttribute('aria-hidden', 'false');
        completionNotice.querySelector('[data-completion-close]')?.focus();
    }

    function hideCompletionNotice() {
        if (!completionNotice) return;
        completionNotice.hidden = true;
        completionNotice.setAttribute('aria-hidden', 'true');
    }

    renderParticipantSession(participantSession);
    const testingConfigFromUrl = getTestingConfigFromUrl();
    const testingConfig = updateTestingConfig({
        fastMode: false,
        skipMode: Boolean(participantSession && ['tester', 'admin'].includes(participantSession.role)),
        skipWaits: false
    });
    if (testingConfigFromUrl.fastMode && participantSession && ['tester', 'admin'].includes(participantSession.role)) {
        testingConfig.fastMode = true;
        enableFastRuntime();
    }
    function openModule(requestedModuleId) {
        const moduleMeta = getModuleMeta(normalizeModuleId(requestedModuleId));
        if (!moduleMeta) return false;
        if (!participantSession) {
            renderParticipantSession(null, { warning: true, formMessage: '请先完成参与者验证，再进入练习模块。' });
            pageManager.showHome();
            return false;
        }
        if (!pageManager.canAccessModule(moduleMeta.weekIdx, moduleMeta.dayIdx)) {
            renderParticipantSession(participantSession, { message: '当前编号尚未解锁 ' + moduleMeta.moduleId + '。请按逐日顺序完成。' });
            pageManager.showHome();
            return false;
        }
        stopSpeech();
        moduleRunStartPromise = startModuleRun(moduleMeta.moduleId, { source: 'module-open' }).catch((error) => {
            console.warn('Module run could not be started', error);
            throw error;
        });
        dialogueManager.setModuleRunStartPromise(moduleRunStartPromise);
        practiceTitle.innerText = moduleMeta.moduleTitle;
        pageManager.showDaily(moduleMeta.weekIdx);
        const isReplay = participantSession.access?.completedModuleIds?.includes(moduleMeta.moduleId);
        globalThis.__RESILIENCE_REPLAYING__ = isReplay;
        if (isReplay) dialogueManager.resetForReplay(moduleMeta.moduleId);
        else dialogueManager.resetForModule(moduleMeta.moduleId);
        globalThis.__RESILIENCE_REPLAYING__ = false;
        if (isReplay) {
            void getConversationReplay(moduleMeta.moduleId).then((replay) => {
                if (dialogueManager.currentModule === moduleMeta.moduleId) {
                    dialogueManager.renderReplay(Array.isArray(replay?.messages) ? replay.messages : [], replay?.snapshotHtml || '');
                }
            }).catch(() => {
                if (dialogueManager.currentModule === moduleMeta.moduleId) dialogueManager.renderReplay([]);
            });
        }
        dialogueManager.onModuleCompleted = (response) => {
            participantSession = updateParticipantSessionAccess(response.access, { lastModuleCompleted: moduleMeta.moduleId }) || participantSession;
            pageManager.setParticipantSession(participantSession);
            pageManager.renderWeekLocks();
            showCompletionNotice(moduleMeta, response);
        };
        dialogueManager.onModuleCompletionFailed = () => {
            if (!completionNotice) return;
            completionNotice.querySelector('[data-completion-module]').textContent = moduleMeta.moduleId;
            completionNotice.querySelector('[data-completion-status]').textContent = '完成状态保存失败，请检查网络后重试。';
            completionNotice.hidden = false;
            completionNotice.setAttribute('aria-hidden', 'false');
        };
        pageManager.showPractice();
        return true;
    }
    document.querySelector('[data-completion-close]')?.addEventListener('click', () => {
        hideCompletionNotice();
        stopSpeech();
        dialogueManager.invalidateAsyncCallbacks();
        pageManager.showHome();
    });

    testingTools?.querySelector('[data-test-fast-mode]')?.addEventListener('change', (event) => {
        if (!['tester', 'admin'].includes(participantSession?.role)) return;
        updateTestingConfig({ fastMode: event.target.checked });
        if (event.target.checked) enableFastRuntime();
        else disableFastRuntime();
    });

    globalThis[TESTING_API_KEY] = {
        openModule(requestedModuleId, options = {}) {
            if (Object.prototype.hasOwnProperty.call(options, 'fastMode')) {
                if (!['tester', 'admin'].includes(participantSession?.role)) return false;
                updateTestingConfig({ fastMode: Boolean(options.fastMode) });
                if (options.fastMode) enableFastRuntime();
                else disableFastRuntime();
            }
            return openModule(requestedModuleId);
        },
        restartModule(requestedModuleId = dialogueManager.currentModule) {
            return openModule(requestedModuleId);
        },
        setFastMode(enabled = true) {
            if (!['tester', 'admin'].includes(participantSession?.role)) return false;
            updateTestingConfig({ fastMode: Boolean(enabled) });
            if (enabled) enableFastRuntime();
            else disableFastRuntime();
            return true;
        },
        setSkipMode(enabled = true) {
            if (!['tester', 'admin'].includes(participantSession?.role)) return false;
            updateTestingConfig({ skipMode: Boolean(enabled), skipWaits: Boolean(enabled) });
            return true;
        },
        skipCurrentWait() {
            if (!['tester', 'admin'].includes(participantSession?.role)) return false;
            return skipCurrentWait(chatMessages);
        },
        getState() {
            return {
                currentModule: dialogueManager.currentModule,
                step: dialogueManager.step,
                role: participantSession?.role || null,
                fastMode: Boolean(ensureTestingConfig().fastMode),
                skipMode: Boolean(ensureTestingConfig().skipMode),
                skipWaits: Boolean(ensureTestingConfig().skipWaits)
            };
        }
    };
    participantForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const validation = validateParticipantIdentity({
            participantCode: participantCodeInput.value,
            participantName: participantNameInput.value
        });
        if (!validation.ok) {
            renderParticipantSession(null, { warning: true, formMessage: validation.error, preserveInputs: true });
            if (!participantCodeInput.value.trim()) {
                participantCodeInput.focus();
            } else {
                participantNameInput.focus();
            }
            return;
        }
        if (!participantConsentInput.checked) {
            renderParticipantSession(null, {
                warning: true,
                formMessage: '请阅读开始前说明，并勾选确认后继续。',
                preserveInputs: true
            });
            participantConsentInput.focus();
            return;
        }

        participantStartBtn.disabled = true;
        participantCodeInput.disabled = true;
        participantNameInput.disabled = true;
        participantConsentInput.disabled = true;
        participantFormNote.textContent = '正在建立练习记录...';
        participantFormNote.classList.remove('warning');

        try {
            const nextSession = await startParticipantSession({
                participantCode: validation.normalizedValue,
                participantName: validation.participantName
            });
            renderParticipantSession(nextSession);
        } catch (error) {
            renderParticipantSession(null, {
                warning: true,
                formMessage: `验证失败：${error instanceof Error ? error.message : '请稍后重试。'}`,
                preserveInputs: true
            });
            participantCodeInput.focus();
        } finally {
            participantStartBtn.disabled = false;
            if (!participantSession) {
                participantCodeInput.disabled = false;
                participantNameInput.disabled = false;
                participantConsentInput.disabled = false;
            }
        }
    });

    participantResetBtn.addEventListener('click', () => {
        clearParticipantSession();
        pageManager.showHome();
        renderParticipantSession(null);
        participantCodeInput.focus();
    });

    // 事件绑定：返回按钮
    backFromDaily.addEventListener('click', () => {
        stopSpeech();
        dialogueManager.invalidateAsyncCallbacks();
        pageManager.showHome();
    });

    backFromPractice.addEventListener('click', () => {
        stopSpeech();
        dialogueManager.invalidateAsyncCallbacks();
        pageManager.goBackToDaily();
    });

    // 事件绑定：周方块
    weekTiles.forEach(tile => {
        tile.addEventListener('click', () => {
            const weekIdx = parseInt(tile.dataset.week) - 1;
            if (!participantSession) {
                renderParticipantSession(null, {
                    warning: true,
                    formMessage: '请先输入研究编号和姓名，再开始练习。'
                });
                return;
            }
            if (tile.classList.contains('is-locked')) {
                renderParticipantSession(participantSession, {
                    message: '这一周还未开放，请先完成前面的练习。'
                });
                return;
            }
            pageManager.showDaily(weekIdx);
        });
    });

    // 事件绑定：子模块卡片
    subModulesDiv.addEventListener('click', e => {
        const card = e.target.closest('.daily-sub');
        if (!card) return;
        if (!participantSession) {
            renderParticipantSession(null, {
                warning: true,
                formMessage: '请先输入研究编号和姓名，再开始练习。'
            });
            return;
        }
        if (card.classList.contains('is-locked')) {
            renderParticipantSession(participantSession, {
                message: '这个模块还未开放，请先完成前面的练习。'
            });
            return;
        }
        const week = card.dataset.week;
        const day = card.dataset.day;
        const moduleId = `${week}-${day}`;

        openModule(moduleId);
    });

    // 事件绑定：继续按钮
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'continueBtn') {
            if (e.target.classList.contains('disabled')) return;
            e.preventDefault();
            dialogueManager.onContinue();
        }
    });

    // 事件绑定：发送按钮
    sendBtn.addEventListener('click', () => {
        const text = userInput.value.trim();
        if (text) {
            dialogueManager.handleUserMessage(text);
            userInput.value = '';
        }
    });

    // 事件绑定：回车键
    userInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const text = userInput.value.trim();
            if (text) {
                dialogueManager.handleUserMessage(text);
                userInput.value = '';
            }
        }
    });

    window.addEventListener('pagehide', () => {
        flushResearchEvents();
        stopSpeech();
        dialogueManager.invalidateAsyncCallbacks();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            stopSpeech();
        }
    });

    window.addEventListener('beforeunload', () => {
        stopSpeech();
    });

    // 初始化显示主页
    if (testingConfigFromUrl.moduleId && openModule(testingConfigFromUrl.moduleId)) {
        return;
    }

    pageManager.showHome();
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

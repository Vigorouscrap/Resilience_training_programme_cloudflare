/**
 * main.js - 主应用程序入口
 * 初始化应用，绑定事件，协调各个模块
 */

import { PageManager } from './pages.js';
import { PracticeTimer } from './timer.js';
import { DialogueManager } from './dialogue.js';
import { weekTitles, subModuleNames } from './data.js';

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
        fastMode: parseBooleanFlag(searchParams.get('fast')) || parseBooleanFlag(searchParams.get('skipTimers'))
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
    const testingConfig = updateTestingConfig(getTestingConfigFromUrl());
    if (testingConfig.fastMode) {
        enableFastRuntime();
    }

    function openModule(requestedModuleId) {
        const moduleMeta = getModuleMeta(normalizeModuleId(requestedModuleId));
        if (!moduleMeta) {
            console.warn('[resilience-test] Unknown module:', requestedModuleId);
            return false;
        }

        stopSpeech();
        practiceTitle.innerText = moduleMeta.moduleTitle;
        pageManager.showDaily(moduleMeta.weekIdx);
        dialogueManager.resetForModule(moduleMeta.moduleId);
        pageManager.showPractice();
        return true;
    }

    globalThis[TESTING_API_KEY] = {
        openModule(requestedModuleId, options = {}) {
            if (Object.prototype.hasOwnProperty.call(options, 'fastMode')) {
                updateTestingConfig({ fastMode: Boolean(options.fastMode) });
                if (options.fastMode) {
                    enableFastRuntime();
                } else {
                    disableFastRuntime();
                }
            }

            return openModule(requestedModuleId);
        },
        restartModule(requestedModuleId = dialogueManager.currentModule) {
            return openModule(requestedModuleId);
        },
        setFastMode(enabled = true) {
            updateTestingConfig({ fastMode: Boolean(enabled) });
            if (enabled) {
                enableFastRuntime();
            } else {
                disableFastRuntime();
            }
        },
        getState() {
            return {
                currentModule: dialogueManager.currentModule,
                step: dialogueManager.step,
                fastMode: Boolean(ensureTestingConfig().fastMode)
            };
        }
    };

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
            pageManager.showDaily(weekIdx);
        });
    });

    // 事件绑定：子模块卡片
    subModulesDiv.addEventListener('click', e => {
        const card = e.target.closest('.daily-sub');
        if (!card) return;
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
        stopSpeech();
        dialogueManager.invalidateAsyncCallbacks();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            stopSpeech();
            dialogueManager.invalidateAsyncCallbacks();
        }
    });

    window.addEventListener('beforeunload', () => {
        stopSpeech();
    });

    // 初始化显示主页
    if (testingConfig.moduleId && openModule(testingConfig.moduleId)) {
        return;
    }

    pageManager.showHome();
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

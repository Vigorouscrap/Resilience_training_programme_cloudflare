/**
 * main.js - 主应用程序入口
 * 初始化应用，绑定事件，协调各个模块
 */

import { PageManager } from './pages.js';
import { PracticeTimer } from './timer.js';
import { DialogueManager } from './dialogue.js';
import { weekTitles, subModuleNames } from './data.js';

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

    // 事件绑定：返回按钮
    backFromDaily.addEventListener('click', () => {
        pageManager.showHome();
    });

    backFromPractice.addEventListener('click', () => {
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

        dialogueManager.resetForModule(moduleId);
        pageManager.showPractice();
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

    // 初始化显示主页
    pageManager.showHome();
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

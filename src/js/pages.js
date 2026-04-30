/**
 * pages.js - 页面管理和切换
 * 负责各个页面的显示和隐藏逻辑
 */

import { weekTitles, subModuleNames } from './data.js';

export class PageManager {
    constructor(homePage, dailyPage, practicePage, weekTitleDisplay, subModulesDiv, practiceTitle, timerStart, timerStop) {
        this.homePage = homePage;
        this.dailyPage = dailyPage;
        this.practicePage = practicePage;
        this.weekTitleDisplay = weekTitleDisplay;
        this.subModulesDiv = subModulesDiv;
        this.practiceTitle = practiceTitle;
        this.timerStart = timerStart;
        this.timerStop = timerStop;
    }

    showHome() {
        this.homePage.style.display = 'flex';
        this.dailyPage.classList.remove('active');
        this.practicePage.classList.remove('active');
    }

    showDaily(weekIdx) {
        this.weekTitleDisplay.innerText = weekTitles[weekIdx] + ' · 每日练习';
        let html = '';
        for (let i = 0; i < 7; i++) {
            html += `<div class="card daily-sub" data-week="${weekIdx + 1}" data-day="${i + 1}">📌 ${subModuleNames[weekIdx][i]}</div>`;
        }
        this.subModulesDiv.innerHTML = html;

        this.homePage.style.display = 'none';
        this.dailyPage.classList.add('active');
        this.practicePage.classList.remove('active');
    }

    showPractice() {
        this.homePage.style.display = 'none';
        this.dailyPage.classList.remove('active');
        this.practicePage.classList.add('active');
        this.timerStart();
    }

    goBackToDaily() {
        this.practicePage.classList.remove('active');
        this.dailyPage.classList.add('active');
        this.timerStop();
    }
}

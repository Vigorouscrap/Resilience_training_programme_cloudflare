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
        this.participantSession = null;
    }

    setParticipantSession(participantSession) {
        this.participantSession = participantSession;
    }

    canAccessModule(weekIdx, dayIdx) {
        if (!this.participantSession?.access) return true;
        if (this.participantSession.access.canAccessAllModules) return true;

        const moduleDayIndex = (weekIdx * 7) + dayIdx + 1;
        const unlockedDayIndex = Number(this.participantSession.access.unlockedDayIndex) || 1;
        return moduleDayIndex <= unlockedDayIndex;
    }

    renderWeekLocks() {
        const weekTiles = document.querySelectorAll('.week-tile');
        weekTiles.forEach((tile) => {
            const weekIdx = Number(tile.dataset.week) - 1;
            const hasAccessibleModule = Array.from({ length: 7 }, (_, dayIdx) => this.canAccessModule(weekIdx, dayIdx))
                .some(Boolean);

            tile.classList.toggle('is-locked', Boolean(this.participantSession?.access) && !hasAccessibleModule);
            tile.setAttribute('aria-disabled', hasAccessibleModule ? 'false' : 'true');
        });
    }

    showHome() {
        this.homePage.style.display = 'flex';
        this.dailyPage.classList.remove('active');
        this.practicePage.classList.remove('active');
        this.renderWeekLocks();
    }

    showDaily(weekIdx) {
        this.weekTitleDisplay.innerText = weekTitles[weekIdx] + ' · 每日练习';
        let html = '';
        for (let i = 0; i < 7; i++) {
            const moduleId = (weekIdx + 1) + '-' + (i + 1);
            const accessible = this.canAccessModule(weekIdx, i);
            const completed = this.participantSession?.access?.completedModuleIds?.includes(moduleId);
            const lockNote = accessible ? '' : '<span class="module-lock-note">第 ' + ((weekIdx * 7) + i + 1) + ' 天解锁</span>';
            const statusNote = completed ? '<span class="module-complete-note" aria-label="已完成" title="已完成">✓</span>' : '';
            const className = ['card', 'daily-sub', accessible ? '' : 'is-locked', completed ? 'is-complete' : ''].filter(Boolean).join(' ');
            html += '<div class="' + className + '" data-week="' + (weekIdx + 1) + '" data-day="' + (i + 1) + '" aria-disabled="' + (accessible ? 'false' : 'true') + '">' + statusNote + '<span class="module-name">' + subModuleNames[weekIdx][i] + '</span>' + lockNote + '</div>';
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

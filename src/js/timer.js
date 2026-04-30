/**
 * timer.js - 计时器管理
 * 处理所有计时相关的功能
 */

export class PracticeTimer {
    constructor(timerDisplay) {
        this.timerDisplay = timerDisplay;
        this.timerInterval = null;
        this.seconds = 0;
    }

    start() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.seconds = 0;
        this.timerDisplay.innerText = '00:00';
        this.timerInterval = setInterval(() => {
            this.seconds++;
            const m = Math.floor(this.seconds / 60);
            const s = this.seconds % 60;
            this.timerDisplay.innerText = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        }, 1000);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    reset() {
        this.stop();
        this.seconds = 0;
        this.timerDisplay.innerText = '00:00';
    }
}

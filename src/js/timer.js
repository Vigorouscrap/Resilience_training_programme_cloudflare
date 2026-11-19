/**
 * timer.js - 计时器管理
 * 处理所有计时相关的功能
 */

export class PracticeTimer {
    constructor(timerDisplay, options = {}) {
        this.timerDisplay = timerDisplay;
        this.clock = options.clock || (() => Date.now());
        this.schedule = options.schedule || ((callback) => setInterval(callback, 250));
        this.cancel = options.cancel || ((interval) => clearInterval(interval));
        this.timerInterval = null;
        this.active = false;
        this.activeSince = null;
        this.elapsedMilliseconds = 0;
        this.seconds = 0;
    }

    start() {
        this.stop();
        this.active = true;
        this.activeSince = this.clock();
        this.elapsedMilliseconds = 0;
        this.seconds = 0;
        this.render();
        this.timerInterval = this.schedule(() => this.render());
    }

    pause() {
        if (!this.active || this.activeSince === null) return;
        this.elapsedMilliseconds += Math.max(0, this.clock() - this.activeSince);
        this.activeSince = null;
        this.clearScheduledUpdate();
        this.render();
    }

    resume() {
        if (!this.active || this.activeSince !== null) return;
        this.activeSince = this.clock();
        this.timerInterval = this.schedule(() => this.render());
    }

    clearScheduledUpdate() {
        if (this.timerInterval !== null) {
            this.cancel(this.timerInterval);
            this.timerInterval = null;
        }
    }

    render() {
        const runningMilliseconds = this.activeSince === null ? 0 : Math.max(0, this.clock() - this.activeSince);
        this.seconds = Math.floor((this.elapsedMilliseconds + runningMilliseconds) / 1000);
        const m = Math.floor(this.seconds / 60);
        const s = this.seconds % 60;
        this.timerDisplay.innerText = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    }

    stop() {
        this.pause();
        this.active = false;
        this.clearScheduledUpdate();
    }

    reset() {
        this.stop();
        this.elapsedMilliseconds = 0;
        this.seconds = 0;
        this.render();
    }
}

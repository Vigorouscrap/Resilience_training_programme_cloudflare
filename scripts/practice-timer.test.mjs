import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PracticeTimer } from '../src/js/timer.js';

test('practice timer counts foreground time and excludes hidden intervals', () => {
    let now = 1_000;
    let scheduled = null;
    const display = { innerText: '' };
    const timer = new PracticeTimer(display, {
        clock: () => now,
        schedule: (callback) => { scheduled = callback; return callback; },
        cancel: () => { scheduled = null; }
    });

    timer.start();
    now += 10_900;
    scheduled();
    assert.equal(timer.seconds, 10);
    assert.equal(display.innerText, '00:10');

    timer.pause();
    now += 60_000;
    timer.resume();
    now += 5_200;
    timer.stop();
    assert.equal(timer.seconds, 16);
    assert.equal(display.innerText, '00:16');

    now += 10_000;
    timer.resume();
    assert.equal(timer.seconds, 16, 'a completed/stopped timer must not resume');
});

test('opening another practice resets the recorded duration', () => {
    let now = 0;
    const display = { innerText: '' };
    const timer = new PracticeTimer(display, {
        clock: () => now,
        schedule: (callback) => callback,
        cancel: () => {}
    });

    timer.start();
    now = 7_000;
    timer.stop();
    assert.equal(timer.seconds, 7);
    timer.start();
    assert.equal(timer.seconds, 0);
    assert.equal(display.innerText, '00:00');
});

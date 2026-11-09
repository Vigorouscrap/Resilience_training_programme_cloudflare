import test from 'node:test';
import assert from 'node:assert/strict';
import {
    SUPPORTED_HOOKS,
    calculateAccess,
    moduleDayIndex,
    nextAsiaShanghaiMidnight,
    normalizeParticipantCode,
    normalizeParticipantName,
    normalizeStep,
    validateParticipantCode,
    validateParticipantName
} from './index.mjs';

test('participant identity normalization and validation', () => {
    assert.equal(normalizeParticipantCode(' c_001 '), 'C_001');
    assert.deepEqual(validateParticipantCode('c-001'), { ok: true, normalizedValue: 'C-001' });
    assert.equal(validateParticipantCode('a').ok, false);
    assert.equal(validateParticipantCode('C 001').ok, false);
    assert.equal(normalizeParticipantName('  Zhang   San  '), 'zhang san');
    assert.equal(validateParticipantName(' 张 三 ').displayValue, '张 三');
});

test('module ids map to the 42-day sequence', () => {
    assert.equal(moduleDayIndex('1-1'), 1);
    assert.equal(moduleDayIndex('6-7'), 42);
    assert.equal(moduleDayIndex('0-1'), null);
    assert.equal(moduleDayIndex('7-1'), null);
});

test('Shanghai midnight is the unlock boundary', () => {
    assert.equal(nextAsiaShanghaiMidnight('2026-11-09T12:00:00.000Z'), '2026-11-09T16:00:00.000Z');
    const records = [{
        moduleId: '1-1',
        dayIndex: 1,
        status: 'completed',
        completedAt: '2026-11-09T12:00:00.000Z'
    }];
    assert.equal(calculateAccess('participant', records, Date.parse('2026-11-09T15:59:59.000Z')).unlockedDayIndex, 1);
    assert.equal(calculateAccess('participant', records, Date.parse('2026-11-09T16:00:00.000Z')).unlockedDayIndex, 2);
});

test('only consecutive completed days advance access', () => {
    const access = calculateAccess('participant', [
        { moduleId: '1-1', dayIndex: 1, status: 'completed', completedAt: '2026-11-08T12:00:00.000Z' },
        { moduleId: '1-3', dayIndex: 3, status: 'completed', completedAt: '2026-11-08T12:00:00.000Z' }
    ], Date.parse('2026-11-10T00:00:00.000Z'));
    assert.equal(access.lastCompletedDayIndex, 1);
    assert.equal(access.unlockedDayIndex, 2);
    assert.deepEqual(access.completedModuleIds, ['1-1', '1-3']);
});

test('tester and admin can access all modules', () => {
    assert.equal(calculateAccess('tester', []).canAccessAllModules, true);
    assert.equal(calculateAccess('admin', []).unlockedDayIndex, 999);
});

test('hook manifest and step normalization are stable', () => {
    assert.equal(SUPPORTED_HOOKS.length, 10);
    assert.equal(new Set(SUPPORTED_HOOKS.map((item) => item.hookId)).size, 10);
    assert.equal(normalizeStep(3), 3);
    assert.equal(normalizeStep(' stage-3 '), 'stage-3');
    assert.equal(normalizeStep({}), null);
});

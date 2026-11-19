import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attendance, shanghaiDate } from '../dist/admin/attendance.js';
import { createPasswordHash, issueStaffCookie, staffSession, validateStaffLogin } from '../dist/admin/auth.js';

const now = new Date('2026-11-19T12:00:00+08:00');
const base = {
    status: 'active', enrolledAt: '2026-11-01T12:00:00+08:00',
    lastCompletedAt: '2026-11-16T12:00:00+08:00', graduatedAt: null, statusHistory: []
};
const check = (changes = {}, time = now) => attendance({ ...base, ...changes }, time);
const change = (from, to, day) => ({ from_status: from, to_status: to, changed_at: `2026-11-${day}T12:00:00+08:00` });

test('Shanghai midnight, not UTC midnight, closes a missed day', () => {
    assert.equal(shanghaiDate('2026-11-18T16:00:00Z'), '2026-11-19');
    assert.equal(check({}, new Date('2026-11-18T15:59:59Z')).missedExpectedDays, 1);
    assert.equal(check({}, new Date('2026-11-18T16:00:00Z')).missedExpectedDays, 2);
    assert.equal(check().alert, true);
});

test('completion yesterday or today clears reminders even for late low-index training', () => {
    for (const day of ['18', '19']) {
        const result = check({ lastCompletedAt: `2026-11-${day}T01:00:00+08:00` });
        assert.equal(result.missedExpectedDays, 0);
        assert.equal(result.alert, false);
        assert.equal(result.completedToday, day === '19');
    }
});

test('new enrollment and no enrollment are excluded from daily rate and alerts', () => {
    assert.equal(check({ enrolledAt: now, lastCompletedAt: now }).eligibleToday, false);
    const result = check({ enrolledAt: null, lastCompletedAt: null });
    assert.equal(result.eligibleToday, false);
    assert.equal(result.alert, false);
});

test('paused days freeze missed days including intervals spanning last completion', () => {
    assert.equal(check({ statusHistory: [change('active', 'paused', '17'), change('paused', 'active', '18')] }).missedExpectedDays, 1);
    assert.equal(check({ statusHistory: [change('active', 'paused', '15'), change('paused', 'active', '18')] }).missedExpectedDays, 1);
    assert.equal(check({ statusHistory: [change('active', 'paused', '17'), change('paused', 'active', '17')] }).missedExpectedDays, 2);
    assert.equal(check({ statusHistory: [change('active', 'paused', '17'), change('paused', 'active', '19')] }).missedExpectedDays, 0);
    assert.equal(check({ statusHistory: [change('active', 'paused', '17')] }).missedExpectedDays, 0);
});

test('paused and archived participants never alert or enter daily denominator', () => {
    for (const status of ['paused', 'archived']) {
        assert.deepEqual(check({ status }), { eligibleToday: false, completedToday: false, missedExpectedDays: 0, alert: false });
    }
});

test('graduation today still counts in daily rate; previous graduates do not', () => {
    const today = check({ graduatedAt: now, lastCompletedAt: now });
    assert.equal(today.eligibleToday, true);
    assert.equal(today.completedToday, true);
    assert.equal(today.alert, false);
    assert.equal(check({ graduatedAt: '2026-11-18T01:00:00+08:00' }).eligibleToday, false);
});

test('missed days do not freeze after 42 calendar days', () => {
    assert.equal(check({ lastCompletedAt: '2026-09-01T12:00:00+08:00', enrolledAt: '2026-09-01T12:00:00+08:00' }).missedExpectedDays, 78);
});

test('staff cookies expire, resist tampering and are invalidated by credential rotation', () => {
    const password = 'test-only-staff-password';
    const config = { staffAdminUsername: 'staff', staffAdminPasswordHash: createPasswordHash(password), sessionSecret: 'test-only-session-secret', nodeEnv: 'production' };
    const cookie = issueStaffCookie(config, now.getTime());
    assert.match(cookie, /HttpOnly; SameSite=Strict; Max-Age=28800; Secure/);
    assert.equal(staffSession(cookie, config, now.getTime())?.username, 'staff');
    assert.equal(staffSession(cookie, config, now.getTime() + 28800000), null);
    assert.equal(staffSession(cookie.replace('resilience_staff=', 'resilience_staff=x'), config, now.getTime()), null);
    assert.equal(staffSession(cookie, { ...config, staffAdminPasswordHash: createPasswordHash('new-test-only-password') }, now.getTime()), null);
    assert.equal(staffSession(cookie, { ...config, staffAdminUsername: '' }, now.getTime()), null);
    assert.equal(validateStaffLogin('staff', password, config, 'test-client', now.getTime()), true);
    assert.equal(validateStaffLogin('staff', 'wrong', config, 'test-client', now.getTime()), false);
    assert.throws(() => createPasswordHash('short'));
    assert.throws(() => createPasswordHash('x'.repeat(201)));
});

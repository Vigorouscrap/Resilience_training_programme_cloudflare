export const API_VERSION = 'v1';

export const API_PATHS = Object.freeze({
    health: '/health',
    participantStart: '/api/v1/participants/start',
    moduleRunStart: '/api/v1/module-runs/start',
    moduleRunComplete: '/api/v1/module-runs/complete',
    moduleRunReset: '/api/v1/module-runs/reset',
    events: '/api/v1/events',
    conversationReplay: '/api/v1/conversation/replay',
    export: '/api/v1/export',
    aiHook: (hookId) => `/api/v1/ai/hooks/${encodeURIComponent(hookId)}`
});

export const PARTICIPANT_ROLES = Object.freeze(['participant', 'tester', 'admin']);
export const MESSAGE_ROLES = Object.freeze(['system_script', 'user', 'ai', 'ui_event']);
export const MESSAGE_SOURCES = Object.freeze(['fixed_script', 'user_input', 'ai_hook', 'button_choice', 'module_event']);

export const ERROR_CODES = Object.freeze({
    validation: 'VALIDATION_ERROR',
    invalidModuleId: 'INVALID_MODULE_ID',
    authRequired: 'AUTH_REQUIRED',
    authInvalid: 'AUTH_INVALID',
    moduleLocked: 'MODULE_LOCKED',
    resetForbidden: 'RESET_FORBIDDEN',
    moduleNotCompleted: 'MODULE_NOT_COMPLETED',
    unknownHook: 'UNKNOWN_HOOK',
    hookModuleMismatch: 'HOOK_MODULE_MISMATCH',
    notFound: 'NOT_FOUND',
    rateLimited: 'RATE_LIMITED',
    storageUnavailable: 'STORAGE_UNAVAILABLE'
});

export const SUPPORTED_HOOKS = Object.freeze([
    { hookId: 'module-1-1.intro-reply', moduleId: '1-1' },
    { hookId: 'module-1-3.body-sensation-reflection', moduleId: '1-3' },
    { hookId: 'module-1-3.thought-reflection', moduleId: '1-3' },
    { hookId: 'module-2-2.case-emotion-feedback', moduleId: '2-2' },
    { hookId: 'module-3-2.positive-rumination-feedback', moduleId: '3-2' },
    { hookId: 'module-4-2.thought-train-reflection', moduleId: '4-2' },
    { hookId: 'module-4-2.boarding-impulse-reflection', moduleId: '4-2' },
    { hookId: 'module-4-4.label-feedback', moduleId: '4-4' },
    { hookId: 'module-4-6.supporter-response-feedback', moduleId: '4-6' },
    { hookId: 'module-6-2.value-desire-insight', moduleId: '6-2' }
]);

export const SUPPORTED_HOOK_IDS = Object.freeze(SUPPORTED_HOOKS.map((item) => item.hookId));

export function normalizeParticipantCode(value) {
    return String(value || '').trim().toUpperCase();
}

export function validateParticipantCode(value) {
    const normalizedValue = normalizeParticipantCode(value);
    if (typeof value !== 'string') return { ok: false, normalizedValue, error: 'participantCode must be a string.' };
    if (!normalizedValue) {
        return { ok: false, normalizedValue, error: 'Missing required field: participantCode' };
    }
    if (normalizedValue.length < 2 || normalizedValue.length > 64) {
        return { ok: false, normalizedValue, error: 'participantCode must be 2-64 characters long.' };
    }
    if (!/^[A-Z0-9_-]+$/.test(normalizedValue)) {
        return { ok: false, normalizedValue, error: 'participantCode can only contain letters, numbers, underscores, and hyphens.' };
    }
    return { ok: true, normalizedValue };
}

export function normalizeParticipantName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function validateParticipantName(value) {
    const displayValue = String(value || '').trim().replace(/\s+/g, ' ');
    const normalizedValue = normalizeParticipantName(displayValue);
    if (typeof value !== 'string') return { ok: false, normalizedValue, displayValue, error: 'participantName must be a string.' };
    if (!normalizedValue) {
        return { ok: false, normalizedValue, displayValue, error: 'Missing required field: participantName' };
    }
    if (displayValue.length > 80) {
        return { ok: false, normalizedValue, displayValue, error: 'participantName must be 80 characters or fewer.' };
    }
    return { ok: true, normalizedValue, displayValue };
}

export function parseModuleId(moduleId) {
    const match = String(moduleId || '').trim().match(/^(\d+)-(\d+)$/);
    if (!match) return null;
    const week = Number(match[1]);
    const day = Number(match[2]);
    if (!Number.isInteger(week) || !Number.isInteger(day) || week < 1 || week > 6 || day < 1 || day > 7) {
        return null;
    }
    return { moduleId: `${week}-${day}`, week, day, dayIndex: ((week - 1) * 7) + day };
}

export function moduleDayIndex(moduleId) {
    return parseModuleId(moduleId)?.dayIndex ?? null;
}

export function nextAsiaShanghaiMidnight(isoValue) {
    const date = new Date(isoValue);
    if (!Number.isFinite(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const values = {};
    for (const part of parts) {
        if (part.type !== 'literal') values[part.type] = part.value;
    }
    const localMidnight = new Date(`${values.year}-${values.month}-${values.day}T00:00:00+08:00`);
    localMidnight.setUTCDate(localMidnight.getUTCDate() + 1);
    return localMidnight.toISOString();
}

export function calculateAccess(role, records, nowMs = Date.now()) {
    const completedRecords = new Map();
    for (const record of records || []) {
        if (record?.status === 'completed') {
            completedRecords.set(Number(record.dayIndex), record);
        }
    }

    let lastCompletedDayIndex = 0;
    while (completedRecords.has(lastCompletedDayIndex + 1)) lastCompletedDayIndex += 1;

    const completedModuleIds = [...completedRecords.values()]
        .sort((left, right) => Number(left.dayIndex) - Number(right.dayIndex))
        .map((record) => String(record.moduleId));

    if (role === 'tester' || role === 'admin') {
        return {
            canAccessAllModules: true,
            unlockedDayIndex: 999,
            lastCompletedDayIndex,
            nextUnlockAt: null,
            completedModuleIds
        };
    }

    if (lastCompletedDayIndex === 0) {
        return {
            canAccessAllModules: false,
            unlockedDayIndex: 1,
            lastCompletedDayIndex,
            nextUnlockAt: null,
            completedModuleIds
        };
    }

    const lastRecord = completedRecords.get(lastCompletedDayIndex);
    const nextUnlockAt = nextAsiaShanghaiMidnight(lastRecord?.completedAt);
    const unlocked = nextUnlockAt && nowMs >= Date.parse(nextUnlockAt);
    return {
        canAccessAllModules: false,
        unlockedDayIndex: unlocked ? Math.min(42, lastCompletedDayIndex + 1) : lastCompletedDayIndex,
        lastCompletedDayIndex,
        nextUnlockAt: unlocked ? null : nextUnlockAt,
        completedModuleIds
    };
}

export function normalizeStep(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) return value.trim();
    return null;
}

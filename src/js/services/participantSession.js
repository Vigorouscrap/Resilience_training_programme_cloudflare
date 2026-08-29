import { postJson } from './apiClient.js';

const PARTICIPANT_SESSION_STORAGE_KEY = '__resilience_participant_session_v1__';
const CLIENT_SESSION_STORAGE_KEY = '__resilience_client_session_id__';

function readJsonStorage(key) {
    try {
        const value = globalThis.localStorage?.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function writeJsonStorage(key, value) {
    try {
        globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
        // Storage can be unavailable in private browsing; the app can still continue.
    }
}

function removeStorage(key) {
    try {
        globalThis.localStorage?.removeItem(key);
    } catch {
        // Ignore storage failures so research-code entry never breaks the lesson flow.
    }
}

function createClientSessionId() {
    return `web_\${Date.now()}_\${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeParticipantCode(value) {
    return String(value || '').trim().toUpperCase();
}

export function validateParticipantCode(value) {
    const normalizedValue = normalizeParticipantCode(value);
    if (!normalizedValue) {
        return { ok: false, normalizedValue, error: '请输入研究编号。' };
    }
    if (normalizedValue.length < 2 || normalizedValue.length > 64) {
        return { ok: false, normalizedValue, error: '研究编号长度需为 2-64 个字符。' };
    }
    if (!/^[A-Z0-9_-]+$/.test(normalizedValue)) {
        return { ok: false, normalizedValue, error: '研究编号仅支持字母、数字、下划线和短横线。' };
    }
    return { ok: true, normalizedValue };
}

export function validateParticipantIdentity({ participantCode, participantName }) {
    const codeValidation = validateParticipantCode(participantCode);
    if (!codeValidation.ok) {
        return codeValidation;
    }

    const normalizedName = String(participantName || '').trim();
    if (!normalizedName) {
        return { ok: false, normalizedValue: codeValidation.normalizedValue, error: '请输入姓名。' };
    }
    if (normalizedName.length > 80) {
        return { ok: false, normalizedValue: codeValidation.normalizedValue, error: '姓名长度不能超过 80 个字符。' };
    }

    return {
        ok: true,
        normalizedValue: codeValidation.normalizedValue,
        participantName: normalizedName
    };
}

export function getOrCreateClientSessionId() {
    try {
        const storedValue = globalThis.localStorage?.getItem(CLIENT_SESSION_STORAGE_KEY);
        if (storedValue) return storedValue;

        const nextValue = createClientSessionId();
        globalThis.localStorage?.setItem(CLIENT_SESSION_STORAGE_KEY, nextValue);
        return nextValue;
    } catch {
        return createClientSessionId();
    }
}

export function getParticipantSession() {
    const session = readJsonStorage(PARTICIPANT_SESSION_STORAGE_KEY);
    if (!session || typeof session !== 'object') return null;
    if (!session.participantCode || !session.sessionId) return null;
    if (!session.participantName) return null;
    return session;
}

export function clearParticipantSession() {
    removeStorage(PARTICIPANT_SESSION_STORAGE_KEY);
}

export async function startParticipantSession({ participantCode, participantName }) {
    const validation = validateParticipantIdentity({ participantCode, participantName });
    if (!validation.ok) {
        throw new Error(validation.error);
    }

    const clientSessionId = getOrCreateClientSessionId();
    const response = await postJson('/api/v1/participants/start', {
        participantCode: validation.normalizedValue,
        clientSessionId,
        participantName: validation.participantName
    });

    const role = response.role || 'participant';
    const access = response.access || {};
    const session = {
        participantId: response.participantId || '',
        participantCode: response.participantCode || validation.normalizedValue,
        participantName: response.participantName || validation.participantName,
        clientSessionId,
        sessionId: response.sessionId || clientSessionId,
        persisted: Boolean(response.persisted),
        role,
        unlockStartAt: response.unlockStartAt || new Date().toISOString(),
        access: {
            canAccessAllModules: Boolean(access.canAccessAllModules),
            unlockedDayIndex: Number(access.unlockedDayIndex) || 1,
            lastCompletedDayIndex: Number(access.lastCompletedDayIndex) || 0,
            nextUnlockAt: access.nextUnlockAt || null,
            completedModuleIds: Array.isArray(access.completedModuleIds) ? access.completedModuleIds : []
        },
        metadata: response.metadata || {},
        updatedAt: new Date().toISOString()
    };

    writeJsonStorage(PARTICIPANT_SESSION_STORAGE_KEY, session);
    return session;
}
export function updateParticipantSessionAccess(access, metadata = {}) {
    const session = getParticipantSession();
    if (!session) return null;

    const nextSession = {
        ...session,
        access: {
            ...session.access,
            ...(access || {}),
            unlockedDayIndex: Number(access?.unlockedDayIndex ?? session.access?.unlockedDayIndex) || 1,
            lastCompletedDayIndex: Number(access?.lastCompletedDayIndex ?? session.access?.lastCompletedDayIndex) || 0,
            nextUnlockAt: access?.nextUnlockAt ?? session.access?.nextUnlockAt ?? null,
            completedModuleIds: Array.isArray(access?.completedModuleIds)
                ? access.completedModuleIds
                : (session.access?.completedModuleIds || [])
        },
        metadata: {
            ...session.metadata,
            ...metadata
        },
        updatedAt: new Date().toISOString()
    };
    writeJsonStorage(PARTICIPANT_SESSION_STORAGE_KEY, nextSession);
    return nextSession;
}
export async function startModuleRun(moduleId, metadata = {}) {
    const session = getParticipantSession();
    if (!session) throw new Error('尚未建立参与者会话。');

    return postJson('/api/v1/module-runs/start', {
        participantCode: session.participantCode,
        sessionId: session.sessionId,
        moduleId,
        metadata
    });
}

export async function completeModuleRun(moduleId, metadata = {}) {
    const session = getParticipantSession();
    if (!session) throw new Error('尚未建立参与者会话。');

    return postJson('/api/v1/module-runs/complete', {
        participantCode: session.participantCode,
        sessionId: session.sessionId,
        moduleId,
        metadata
    });
}

export async function recordResearchEvents(events) {
    const session = getParticipantSession();
    if (!session || !Array.isArray(events) || !events.length) return null;
    return postJson('/api/v1/events', {
        participantCode: session.participantCode,
        sessionId: session.sessionId,
        events
    }, { timeoutMs: 5000 });
}

export async function getConversationReplay(moduleId) {
    const session = getParticipantSession();
    if (!session) return { messages: [] };
    return postJson('/api/v1/conversation/replay', {
        participantCode: session.participantCode,
        sessionId: session.sessionId,
        moduleId
    });
}

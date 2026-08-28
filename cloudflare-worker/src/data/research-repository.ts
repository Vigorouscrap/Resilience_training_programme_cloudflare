export interface ParticipantSessionResult {
    participantId: string;
    participantCode: string;
    participantName: string;
    sessionId: string;
    persisted: boolean;
    role: ParticipantRole;
    unlockStartAt: string;
    access: ParticipantAccessSummary;
}

export type ParticipantRole = 'participant' | 'tester' | 'admin';

export interface ParticipantAccessSummary {
    canAccessAllModules: boolean;
    unlockedDayIndex: number;
    lastCompletedDayIndex: number;
    nextUnlockAt: string | null;
    completedModuleIds: string[];
}

export interface StartParticipantSessionInput {
    participantCode: string;
    participantName: string;
    clientSessionId?: string;
    userAgent?: string;
    testerParticipantCodes?: string[];
    adminParticipantCodes?: string[];
    metadata?: Record<string, unknown>;
}

export interface RecordModuleEventInput {
    participantId: string;
    sessionId: string;
    moduleId: string;
    eventType: string;
    step?: number | string | null;
    userInput?: string;
    choiceValue?: string;
    context?: Record<string, unknown>;
}

export interface RecordAiCallEventInput {
    participantId: string;
    sessionId: string;
    moduleId: string;
    hookId: string;
    variant?: string;
    userInput: string;
    replyText: string;
    fallbackUsed: boolean;
    promptVersion: string;
    provider: string;
    model: string;
    metadata?: Record<string, unknown>;
}

export interface RecordConversationMessageInput {
    participantId: string;
    sessionId: string;
    moduleId: string;
    hookId?: string;
    messageRole: 'system_script' | 'user' | 'ai' | 'ui_event';
    messageText: string;
    source: 'fixed_script' | 'user_input' | 'ai_hook' | 'button_choice' | 'module_event';
    step?: number | string | null;
    sequenceIndex?: number | null;
    durationMs?: number | null;
    metadata?: Record<string, unknown>;
}

export interface ModuleRunSummary {
    id: string;
    moduleId: string;
    dayIndex: number;
    status: 'started' | 'completed';
    startedAt: string;
    completedAt: string | null;
    durationSeconds: number | null;
}

export interface StartModuleRunInput {
    participantCode: string;
    sessionId: string;
    moduleId: string;
    metadata?: Record<string, unknown>;
}

export interface CompleteModuleRunInput extends StartModuleRunInput {}

export interface ModuleRunResult {
    persisted: boolean;
    moduleRun: ModuleRunSummary;
    access: ParticipantAccessSummary;
}

export class ModuleRunValidationError extends Error {}
export class ModuleRunAccessError extends Error {}

export interface ResearchDataRepository {
    startParticipantSession(input: StartParticipantSessionInput): Promise<ParticipantSessionResult>;
    startModuleRun(input: StartModuleRunInput): Promise<ModuleRunResult>;
    completeModuleRun(input: CompleteModuleRunInput): Promise<ModuleRunResult>;
    recordModuleEvent(input: RecordModuleEventInput): Promise<void>;
    recordAiCallEvent(input: RecordAiCallEventInput): Promise<void>;
    recordConversationMessage(input: RecordConversationMessageInput): Promise<void>;
}

interface ModuleRunRow {
    id: string;
    module_id: string;
    day_index: number;
    status: 'started' | 'completed';
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
}

interface ParticipantContext {
    participantId: string;
    role: ParticipantRole;
    unlockStartAt: string;
}

function nowIso(): string {
    return new Date().toISOString();
}

function createId(prefix: string): string {
    return prefix + '_' + crypto.randomUUID();
}

function normalizeParticipantCode(value: string): string {
    return value.trim().toUpperCase();
}

function normalizeParticipantName(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function inferParticipantRole(input: StartParticipantSessionInput, participantCode: string): ParticipantRole {
    if ((input.adminParticipantCodes || []).includes(participantCode)) return 'admin';
    return (input.testerParticipantCodes || []).includes(participantCode) ? 'tester' : 'participant';
}

function serializeJson(value: Record<string, unknown> | undefined): string {
    return JSON.stringify(value || {});
}

function moduleDayIndex(moduleId: string): number {
    const match = String(moduleId || '').trim().match(/^(\d+)-(\d+)$/);
    if (!match) throw new ModuleRunValidationError('Invalid moduleId.');
    const week = Number(match[1]);
    const day = Number(match[2]);
    if (!Number.isInteger(week) || !Number.isInteger(day) || week < 1 || week > 6 || day < 1 || day > 7) {
        throw new ModuleRunValidationError('Invalid moduleId.');
    }
    return ((week - 1) * 7) + day;
}

function nextAsiaShanghaiMidnight(isoValue: string): string {
    const date = new Date(isoValue);
    if (!Number.isFinite(date.getTime())) return nowIso();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const values: Record<string, string> = {};
    parts.forEach((part) => {
        if (part.type !== 'literal') values[part.type] = part.value;
    });
    const localMidnight = new Date(values.year + '-' + values.month + '-' + values.day + 'T00:00:00+08:00');
    localMidnight.setUTCDate(localMidnight.getUTCDate() + 1);
    return localMidnight.toISOString();
}

function calculateAccess(role: ParticipantRole, records: ModuleRunRow[], nowMs = Date.now()): ParticipantAccessSummary {
    const completedRecords = new Map<number, ModuleRunRow>();
    records.filter((record) => record.status === 'completed').forEach((record) => {
        completedRecords.set(Number(record.day_index), record);
    });

    let lastCompletedDayIndex = 0;
    while (completedRecords.has(lastCompletedDayIndex + 1)) {
        lastCompletedDayIndex += 1;
    }

    const completedModuleIds = records
        .filter((record) => record.status === 'completed')
        .sort((left, right) => Number(left.day_index) - Number(right.day_index))
        .map((record) => record.module_id);

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
    const nextUnlockAt = nextAsiaShanghaiMidnight(lastRecord?.completed_at || nowIso());
    const unlockedDayIndex = nowMs >= Date.parse(nextUnlockAt)
        ? Math.min(42, lastCompletedDayIndex + 1)
        : lastCompletedDayIndex;

    return {
        canAccessAllModules: false,
        unlockedDayIndex,
        lastCompletedDayIndex,
        nextUnlockAt: unlockedDayIndex > lastCompletedDayIndex ? null : nextUnlockAt,
        completedModuleIds
    };
}

function toModuleRunSummary(row: ModuleRunRow): ModuleRunSummary {
    return {
        id: row.id,
        moduleId: row.module_id,
        dayIndex: Number(row.day_index),
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at || null,
        durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds)
    };
}

class NoopResearchDataRepository implements ResearchDataRepository {
    async startParticipantSession(input: StartParticipantSessionInput): Promise<ParticipantSessionResult> {
        const participantCode = normalizeParticipantCode(input.participantCode);
        const participantName = normalizeParticipantName(input.participantName);
        const role = inferParticipantRole(input, participantCode);
        const unlockStartAt = nowIso();
        return {
            participantId: 'noop_' + participantCode + '_' + participantName,
            participantCode,
            participantName,
            sessionId: input.clientSessionId?.trim() || createId('session'),
            persisted: false,
            role,
            unlockStartAt,
            access: calculateAccess(role, [])
        };
    }

    async startModuleRun(input: StartModuleRunInput): Promise<ModuleRunResult> {
        const dayIndex = moduleDayIndex(input.moduleId);
        const now = nowIso();
        return {
            persisted: false,
            moduleRun: {
                id: createId('module_run'),
                moduleId: input.moduleId,
                dayIndex,
                status: 'started',
                startedAt: now,
                completedAt: null,
                durationSeconds: null
            },
            access: calculateAccess('participant', [])
        };
    }

    async completeModuleRun(input: CompleteModuleRunInput): Promise<ModuleRunResult> {
        const dayIndex = moduleDayIndex(input.moduleId);
        const now = nowIso();
        return {
            persisted: false,
            moduleRun: {
                id: createId('module_run'),
                moduleId: input.moduleId,
                dayIndex,
                status: 'completed',
                startedAt: now,
                completedAt: now,
                durationSeconds: 0
            },
            access: calculateAccess('participant', [])
        };
    }

    async recordModuleEvent(): Promise<void> {}
    async recordAiCallEvent(): Promise<void> {}
    async recordConversationMessage(): Promise<void> {}
}

class D1ResearchDataRepository implements ResearchDataRepository {
    constructor(private readonly db: D1Database) {}

    private async getModuleRunRows(participantId: string): Promise<ModuleRunRow[]> {
        const result = await this.db.prepare(
            'SELECT id, module_id, day_index, status, started_at, completed_at, duration_seconds FROM module_runs WHERE participant_id = ?'
        ).bind(participantId).all<ModuleRunRow>();
        return result.results || [];
    }

    private async getParticipantContext(participantCode: string, sessionId: string): Promise<ParticipantContext> {
        const context = await this.db.prepare(
            'SELECT p.id, p.role, p.unlock_start_at FROM participants p INNER JOIN sessions s ON s.participant_id = p.id WHERE p.participant_code = ? AND s.id = ?'
        ).bind(normalizeParticipantCode(participantCode), sessionId).first<{
            id: string;
            role: ParticipantRole;
            unlock_start_at: string;
        }>();
        if (!context) throw new ModuleRunValidationError('Participant session was not found.');
        return {
            participantId: context.id,
            role: context.role,
            unlockStartAt: context.unlock_start_at
        };
    }

    private async getAccess(participantId: string, role: ParticipantRole): Promise<ParticipantAccessSummary> {
        return calculateAccess(role, await this.getModuleRunRows(participantId));
    }

    async startParticipantSession(input: StartParticipantSessionInput): Promise<ParticipantSessionResult> {
        const participantCode = normalizeParticipantCode(input.participantCode);
        const participantName = input.participantName.trim().replace(/\s+/g, ' ');
        const participantNameNormalized = normalizeParticipantName(participantName);
        const timestamp = nowIso();
        const fallbackRole = inferParticipantRole(input, participantCode);
        const existingParticipant = await this.db
            .prepare('SELECT id, role, unlock_start_at FROM participants WHERE participant_code = ? AND participant_name_normalized = ?')
            .bind(participantCode, participantNameNormalized)
            .first<{ id: string; role: ParticipantRole; unlock_start_at: string | null }>();
        const participantId = existingParticipant?.id || createId('participant');
        const role = fallbackRole === 'participant' ? existingParticipant?.role || fallbackRole : fallbackRole;
        const unlockStartAt = existingParticipant?.unlock_start_at || timestamp;

        if (existingParticipant) {
            await this.db.prepare(
                'UPDATE participants SET participant_name = ?, participant_name_normalized = ?, role = ?, last_seen_at = ?, metadata_json = ? WHERE id = ?'
            ).bind(participantName, participantNameNormalized, role, timestamp, serializeJson(input.metadata), participantId).run();
        } else {
            await this.db.prepare(
                'INSERT INTO participants (id, participant_code, display_label, participant_name, participant_name_normalized, account_email, account_phone, role, unlock_start_at, status, created_at, last_seen_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
                participantId,
                participantCode,
                participantCode,
                participantName,
                participantNameNormalized,
                '',
                '',
                role,
                unlockStartAt,
                'active',
                timestamp,
                timestamp,
                serializeJson(input.metadata)
            ).run();
        }

        const clientSessionId = input.clientSessionId?.trim() || createId('client_session');
        const existingSession = await this.db.prepare(
            'SELECT id FROM sessions WHERE participant_id = ? AND client_session_id = ?'
        ).bind(participantId, clientSessionId).first<{ id: string }>();
        const sessionId = existingSession?.id || createId('session');

        if (existingSession) {
            await this.db.prepare('UPDATE sessions SET last_seen_at = ?, user_agent = ? WHERE id = ?')
                .bind(timestamp, input.userAgent || '', sessionId).run();
        } else {
            await this.db.prepare(
                'INSERT INTO sessions (id, participant_id, client_session_id, started_at, last_seen_at, ended_at, duration_seconds, user_agent, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(sessionId, participantId, clientSessionId, timestamp, timestamp, null, null, input.userAgent || '', serializeJson(input.metadata)).run();
        }

        return {
            participantId,
            participantCode,
            participantName,
            sessionId,
            persisted: true,
            role,
            unlockStartAt,
            access: await this.getAccess(participantId, role)
        };
    }

    private async resolveModuleRun(input: StartModuleRunInput, complete: boolean): Promise<ModuleRunResult> {
        const dayIndex = moduleDayIndex(input.moduleId);
        const context = await this.getParticipantContext(input.participantCode, input.sessionId);
        const access = await this.getAccess(context.participantId, context.role);
        if (!access.canAccessAllModules && dayIndex > access.unlockedDayIndex) {
            throw new ModuleRunAccessError('Module is not unlocked.');
        }

        const existing = await this.db.prepare(
            'SELECT id, module_id, day_index, status, started_at, completed_at, duration_seconds FROM module_runs WHERE participant_id = ? AND module_id = ?'
        ).bind(context.participantId, input.moduleId).first<ModuleRunRow>();

        if (existing?.status === 'completed' && !complete) {
            return { persisted: true, moduleRun: toModuleRunSummary(existing), access };
        }

        const timestamp = nowIso();
        let moduleRun = existing;
        if (!moduleRun) {
            const id = createId('module_run');
            await this.db.prepare(
                'INSERT OR IGNORE INTO module_runs (id, participant_id, session_id, module_id, day_index, status, started_at, completed_at, duration_seconds, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(id, context.participantId, input.sessionId, input.moduleId, dayIndex, 'started', timestamp, null, null, serializeJson(input.metadata)).run();
            moduleRun = await this.db.prepare(
                'SELECT id, module_id, day_index, status, started_at, completed_at, duration_seconds FROM module_runs WHERE participant_id = ? AND module_id = ?'
            ).bind(context.participantId, input.moduleId).first<ModuleRunRow>();
        }

        if (!moduleRun) throw new Error('Module run could not be created.');

        if (complete && moduleRun.status !== 'completed') {
            const completedAt = nowIso();
            const startedAtMs = Date.parse(moduleRun.started_at);
            const durationSeconds = Number.isFinite(startedAtMs)
                ? Math.max(0, Math.floor((Date.parse(completedAt) - startedAtMs) / 1000))
                : 0;
            await this.db.prepare(
                'UPDATE module_runs SET status = ?, completed_at = ?, duration_seconds = ?, metadata_json = ? WHERE id = ? AND status <> ?'
            ).bind('completed', completedAt, durationSeconds, serializeJson(input.metadata), moduleRun.id, 'completed').run();
            moduleRun = await this.db.prepare(
                'SELECT id, module_id, day_index, status, started_at, completed_at, duration_seconds FROM module_runs WHERE id = ?'
            ).bind(moduleRun.id).first<ModuleRunRow>();
        }

        if (!moduleRun) throw new Error('Module run could not be read.');
        return {
            persisted: true,
            moduleRun: toModuleRunSummary(moduleRun),
            access: await this.getAccess(context.participantId, context.role)
        };
    }

    async startModuleRun(input: StartModuleRunInput): Promise<ModuleRunResult> {
        return this.resolveModuleRun(input, false);
    }

    async completeModuleRun(input: CompleteModuleRunInput): Promise<ModuleRunResult> {
        return this.resolveModuleRun(input, true);
    }

    async recordModuleEvent(input: RecordModuleEventInput): Promise<void> {
        await this.db.prepare(
            'INSERT INTO module_events (id, participant_id, session_id, module_id, event_type, step, user_input, choice_value, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            createId('module_event'),
            input.participantId,
            input.sessionId,
            input.moduleId,
            input.eventType,
            input.step == null ? null : String(input.step),
            input.userInput || '',
            input.choiceValue || '',
            serializeJson(input.context),
            nowIso()
        ).run();
    }

    async recordAiCallEvent(input: RecordAiCallEventInput): Promise<void> {
        await this.db.prepare(
            'INSERT INTO ai_call_events (id, participant_id, session_id, module_id, hook_id, variant, user_input, reply_text, fallback_used, prompt_version, provider, model, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            createId('ai_call'),
            input.participantId,
            input.sessionId,
            input.moduleId,
            input.hookId,
            input.variant || '',
            input.userInput,
            input.replyText,
            input.fallbackUsed ? 1 : 0,
            input.promptVersion,
            input.provider,
            input.model,
            serializeJson(input.metadata),
            nowIso()
        ).run();
    }

    async recordConversationMessage(input: RecordConversationMessageInput): Promise<void> {
        await this.db.prepare(
            'INSERT INTO conversation_messages (id, participant_id, session_id, module_id, hook_id, message_role, message_text, source, step, sequence_index, duration_ms, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            createId('conversation_message'),
            input.participantId,
            input.sessionId,
            input.moduleId,
            input.hookId || '',
            input.messageRole,
            input.messageText,
            input.source,
            input.step == null ? null : String(input.step),
            input.sequenceIndex == null ? null : input.sequenceIndex,
            input.durationMs == null ? null : input.durationMs,
            serializeJson(input.metadata),
            nowIso()
        ).run();
    }
}

export function createResearchDataRepository(db: D1Database | undefined): ResearchDataRepository {
    return db ? new D1ResearchDataRepository(db) : new NoopResearchDataRepository();
}

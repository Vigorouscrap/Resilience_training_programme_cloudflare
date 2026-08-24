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

export interface ResearchDataRepository {
    startParticipantSession(input: StartParticipantSessionInput): Promise<ParticipantSessionResult>;
    recordModuleEvent(input: RecordModuleEventInput): Promise<void>;
    recordAiCallEvent(input: RecordAiCallEventInput): Promise<void>;
    recordConversationMessage(input: RecordConversationMessageInput): Promise<void>;
}

function nowIso(): string {
    return new Date().toISOString();
}

function createId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeParticipantCode(value: string): string {
    return value.trim().toUpperCase();
}

function normalizeParticipantName(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
function inferParticipantRole(input: StartParticipantSessionInput, participantCode: string): ParticipantRole {
    const adminCodes = input.adminParticipantCodes || [];
    if (adminCodes.includes(participantCode)) {
        return 'admin';
    }

    const testerCodes = input.testerParticipantCodes || [];
    return testerCodes.includes(participantCode) ? 'tester' : 'participant';
}

function calculateAccess(role: ParticipantRole, unlockStartAt: string): ParticipantAccessSummary {
    if (role === 'tester' || role === 'admin') {
        return {
            canAccessAllModules: true,
            unlockedDayIndex: 999
        };
    }

    const startedAtMs = Date.parse(unlockStartAt);
    if (!Number.isFinite(startedAtMs)) {
        return {
            canAccessAllModules: false,
            unlockedDayIndex: 1
        };
    }

    const elapsedDays = Math.floor((Date.now() - startedAtMs) / 86_400_000);
    return {
        canAccessAllModules: false,
        unlockedDayIndex: Math.max(1, elapsedDays + 1)
    };
}

function serializeJson(value: Record<string, unknown> | undefined): string {
    return JSON.stringify(value || {});
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
            access: calculateAccess(role, unlockStartAt)
        };
    }
    async recordModuleEvent(): Promise<void> {
        return undefined;
    }

    async recordAiCallEvent(): Promise<void> {
        return undefined;
    }

    async recordConversationMessage(): Promise<void> {
        return undefined;
    }
}

class D1ResearchDataRepository implements ResearchDataRepository {
    constructor(private readonly db: D1Database) {}

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
            await this.db
                .prepare('UPDATE participants SET participant_name = ?, participant_name_normalized = ?, role = ?, last_seen_at = ?, metadata_json = ? WHERE id = ?')
                .bind(
                    participantName,
                    participantNameNormalized,
                    role,
                    timestamp,
                    serializeJson(input.metadata),
                    participantId
                )
                .run();
        } else {
            await this.db
                .prepare(
                    'INSERT INTO participants (' +
                    'id, participant_code, display_label, participant_name, participant_name_normalized, ' +
                    'account_email, account_phone, role, unlock_start_at, status, created_at, last_seen_at, metadata_json' +
                    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                )
                .bind(
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
                )
                .run();
        }

        const clientSessionId = input.clientSessionId?.trim() || createId('client_session');
        const existingSession = await this.db
            .prepare('SELECT id FROM sessions WHERE participant_id = ? AND client_session_id = ?')
            .bind(participantId, clientSessionId)
            .first<{ id: string }>();

        const sessionId = existingSession?.id || createId('session');

        if (existingSession) {
            await this.db
                .prepare('UPDATE sessions SET last_seen_at = ?, user_agent = ? WHERE id = ?')
                .bind(timestamp, input.userAgent || '', sessionId)
                .run();
        } else {
            await this.db
                .prepare(
                    'INSERT INTO sessions (' +
                    'id, participant_id, client_session_id, started_at, last_seen_at, ' +
                    'ended_at, duration_seconds, user_agent, metadata_json' +
                    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                )
                .bind(
                    sessionId,
                    participantId,
                    clientSessionId,
                    timestamp,
                    timestamp,
                    null,
                    null,
                    input.userAgent || '',
                    serializeJson(input.metadata)
                )
                .run();
        }

        return {
            participantId,
            participantCode,
            participantName,
            sessionId,
            persisted: true,
            role,
            unlockStartAt,
            access: calculateAccess(role, unlockStartAt)
        };
    }
    async recordModuleEvent(input: RecordModuleEventInput): Promise<void> {
        await this.db
            .prepare(`
                INSERT INTO module_events (
                    id, participant_id, session_id, module_id, event_type, step,
                    user_input, choice_value, context_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
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
            )
            .run();
    }

    async recordAiCallEvent(input: RecordAiCallEventInput): Promise<void> {
        await this.db
            .prepare(`
                INSERT INTO ai_call_events (
                    id, participant_id, session_id, module_id, hook_id, variant,
                    user_input, reply_text, fallback_used, prompt_version,
                    provider, model, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
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
            )
            .run();
    }

    async recordConversationMessage(input: RecordConversationMessageInput): Promise<void> {
        await this.db
            .prepare(`
                INSERT INTO conversation_messages (
                    id, participant_id, session_id, module_id, hook_id, message_role,
                    message_text, source, step, sequence_index, duration_ms,
                    metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
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
            )
            .run();
    }
}

export function createResearchDataRepository(db: D1Database | undefined): ResearchDataRepository {
    return db ? new D1ResearchDataRepository(db) : new NoopResearchDataRepository();
}

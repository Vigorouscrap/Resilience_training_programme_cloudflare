export interface ParticipantSessionResult {
    participantId: string;
    participantCode: string;
    sessionId: string;
    persisted: boolean;
}

export interface StartParticipantSessionInput {
    participantCode: string;
    clientSessionId?: string;
    userAgent?: string;
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

export interface ResearchDataRepository {
    startParticipantSession(input: StartParticipantSessionInput): Promise<ParticipantSessionResult>;
    recordModuleEvent(input: RecordModuleEventInput): Promise<void>;
    recordAiCallEvent(input: RecordAiCallEventInput): Promise<void>;
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

function serializeJson(value: Record<string, unknown> | undefined): string {
    return JSON.stringify(value || {});
}

class NoopResearchDataRepository implements ResearchDataRepository {
    async startParticipantSession(input: StartParticipantSessionInput): Promise<ParticipantSessionResult> {
        const participantCode = normalizeParticipantCode(input.participantCode);
        return {
            participantId: `noop_${participantCode}`,
            participantCode,
            sessionId: input.clientSessionId?.trim() || createId('session'),
            persisted: false
        };
    }

    async recordModuleEvent(): Promise<void> {
        return undefined;
    }

    async recordAiCallEvent(): Promise<void> {
        return undefined;
    }
}

class D1ResearchDataRepository implements ResearchDataRepository {
    constructor(private readonly db: D1Database) {}

    async startParticipantSession(input: StartParticipantSessionInput): Promise<ParticipantSessionResult> {
        const participantCode = normalizeParticipantCode(input.participantCode);
        const timestamp = nowIso();
        const existingParticipant = await this.db
            .prepare('SELECT id FROM participants WHERE participant_code = ?')
            .bind(participantCode)
            .first<{ id: string }>();

        const participantId = existingParticipant?.id || createId('participant');

        if (existingParticipant) {
            await this.db
                .prepare('UPDATE participants SET last_seen_at = ? WHERE id = ?')
                .bind(timestamp, participantId)
                .run();
        } else {
            await this.db
                .prepare(`
                    INSERT INTO participants (
                        id, participant_code, display_label, status, created_at, last_seen_at, metadata_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `)
                .bind(
                    participantId,
                    participantCode,
                    participantCode,
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
                .prepare(`
                    INSERT INTO sessions (
                        id, participant_id, client_session_id, started_at, last_seen_at, user_agent, metadata_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `)
                .bind(
                    sessionId,
                    participantId,
                    clientSessionId,
                    timestamp,
                    timestamp,
                    input.userAgent || '',
                    serializeJson(input.metadata)
                )
                .run();
        }

        return {
            participantId,
            participantCode,
            sessionId,
            persisted: true
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
}

export function createResearchDataRepository(db: D1Database | undefined): ResearchDataRepository {
    return db ? new D1ResearchDataRepository(db) : new NoopResearchDataRepository();
}

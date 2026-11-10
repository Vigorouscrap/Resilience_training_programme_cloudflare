import {
    API_PATHS, MESSAGE_ROLES, MESSAGE_SOURCES, calculateAccess,
    normalizeParticipantCode, parseModuleId, validateParticipantCode, validateParticipantName
} from './index.mjs';

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const json = (value) => JSON.stringify(value ?? {});
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const metadata = (value) => object(value) ? value : {};
const parseJson = (value) => { try { return JSON.parse(value || '{}'); } catch { return {}; } };
const command = (sql, ...params) => ({ sql, params });
const MODULE_COLUMNS = 'id, module_id, day_index, status, started_at, completed_at, duration_seconds, practice_duration_seconds, elapsed_duration_seconds';
const DETAIL_TABLES = ['module_events', 'conversation_messages', 'ai_call_events', 'conversation_snapshots'];

export class ContractError extends Error {
    constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
function invalid(message, code = 'VALIDATION_ERROR') { throw new ContractError(400, code, message); }
function moduleId(value) {
    const parsed = parseModuleId(value);
    if (!parsed || parsed.moduleId !== value) invalid('Invalid moduleId.', 'INVALID_MODULE_ID');
    return parsed;
}
function identity(body) {
    const result = validateParticipantCode(body.participantCode);
    if (!result.ok) invalid(result.error);
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId) invalid('sessionId is required.');
    return { participantCode: result.normalizedValue, sessionId };
}
function summary(row) {
    return {
        id: row.id, moduleId: row.module_id, dayIndex: Number(row.day_index), status: row.status,
        startedAt: row.started_at, completedAt: row.completed_at,
        // Retain the legacy diagnostic field for older clients.
        durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
        practiceDurationSeconds: row.practice_duration_seconds == null ? null : Number(row.practice_duration_seconds),
        elapsedDurationSeconds: row.elapsed_duration_seconds == null ? null : Number(row.elapsed_duration_seconds)
    };
}
function eventValid(event) {
    if (!object(event) || !parseModuleId(event.moduleId) || parseModuleId(event.moduleId).moduleId !== event.moduleId) return false;
    if (event.step != null && !(typeof event.step === 'string' || (typeof event.step === 'number' && Number.isFinite(event.step)))) return false;
    if (event.clientEventId != null && (typeof event.clientEventId !== 'string' || !event.clientEventId || event.clientEventId.length > 128)) return false;
    if (event.type === 'module_event') return typeof event.eventType === 'string' && Boolean(event.eventType.trim())
        && (event.userInput == null || typeof event.userInput === 'string')
        && (event.choiceValue == null || typeof event.choiceValue === 'string')
        && (event.context == null || object(event.context));
    return event.type === 'conversation_message' && MESSAGE_ROLES.includes(event.messageRole)
        && MESSAGE_SOURCES.includes(event.source) && typeof event.messageText === 'string' && Boolean(event.messageText)
        && (event.sequenceIndex == null || (Number.isInteger(event.sequenceIndex) && event.sequenceIndex >= 0 && event.sequenceIndex <= 2147483647))
        && (event.durationMs == null || (Number.isInteger(event.durationMs) && event.durationMs >= 0 && event.durationMs <= 2147483647))
        && (event.metadata == null || object(event.metadata));
}

// db: all(sql, params), batch(commands), transaction(key, callback), dialect.
// PostgreSQL uses a real transaction + row/advisory lock; D1 mutations use one
// atomic batch and conditional statements, since D1 has no interactive transaction.
export class ResearchService {
    constructor(db, config = {}) { this.db = db; this.config = config; }
    storage() { if (!this.db) throw new ContractError(503, 'STORAGE_UNAVAILABLE', 'Research data storage is unavailable.'); return this.db; }
    async first(sql, params) { return (await this.storage().all(sql, params))[0] ?? null; }
    async access(participant) {
        const rows = await this.storage().all(`SELECT ${MODULE_COLUMNS} FROM module_runs WHERE participant_id = ?`, [participant.id]);
        return calculateAccess(participant.role, rows.map((row) => ({ ...summary(row) })));
    }
    async resolveParticipant(participantCode, sessionId) {
        const row = await this.first('SELECT p.* FROM participants p JOIN sessions s ON s.participant_id = p.id WHERE p.participant_code = ? AND s.id = ?', [normalizeParticipantCode(participantCode), sessionId]);
        if (!row) throw new ContractError(403, 'AUTH_INVALID', 'Participant session was not found.');
        return { ...row, participantId: row.id };
    }
    async startParticipantSession(body) {
        const code = validateParticipantCode(body.participantCode);
        const name = validateParticipantName(body.participantName);
        if (!code.ok || !name.ok) invalid(code.error || name.error);
        const client = typeof body.clientSessionId === 'string' && body.clientSessionId.trim() || id('client');
        if (client.length > 200) invalid('clientSessionId is too long.');
        const role = (this.config.adminParticipantCodes || []).includes(code.normalizedValue) ? 'admin'
            : (this.config.testerParticipantCodes || []).includes(code.normalizedValue) ? 'tester' : 'participant';
        const db = this.storage();
        return db.transaction(`identity:${code.normalizedValue}:${name.normalizedValue}`, async (tx) => {
            const service = new ResearchService(tx, this.config);
            const stamp = now();
            // Preserve the original test marker when a test identity is restored.
            const previous = await service.first('SELECT metadata_json FROM participants WHERE participant_code = ? AND participant_name_normalized = ?', [code.normalizedValue, name.normalizedValue]);
            const meta = { ...parseJson(previous?.metadata_json), ...metadata(body.metadata) };
            if (role !== 'participant' || parseJson(previous?.metadata_json).testData === true) meta.testData = true;
            await tx.batch([command(`INSERT INTO participants (id, participant_code, display_label, participant_name, participant_name_normalized, role, unlock_start_at, status, created_at, last_seen_at, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?) ON CONFLICT(participant_code, participant_name_normalized) DO UPDATE SET participant_name = excluded.participant_name, role = excluded.role, last_seen_at = excluded.last_seen_at, metadata_json = excluded.metadata_json`,
                id('participant'), code.normalizedValue, code.normalizedValue, name.displayValue, name.normalizedValue, role, stamp, stamp, stamp, json(meta))]);
            const p = await service.first('SELECT * FROM participants WHERE participant_code = ? AND participant_name_normalized = ?', [code.normalizedValue, name.normalizedValue]);
            await tx.batch([command(`INSERT INTO sessions (id, participant_id, client_session_id, started_at, last_seen_at, user_agent, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(participant_id, client_session_id) DO UPDATE SET last_seen_at = excluded.last_seen_at, user_agent = excluded.user_agent`, id('session'), p.id, client, stamp, stamp, body.userAgent || '', json(meta))]);
            const session = await service.first('SELECT id FROM sessions WHERE participant_id = ? AND client_session_id = ?', [p.id, client]);
            return { participantId: p.id, participantCode: code.normalizedValue, participantName: name.displayValue, sessionId: session.id, persisted: true, role: p.role, unlockStartAt: p.unlock_start_at, access: await service.access(p) };
        });
    }
    async moduleRun(body, action) {
        const auth = identity(body);
        const parsed = moduleId(body.moduleId);
        const snapshot = body.snapshotHtml ?? body.metadata?.snapshotHtml ?? '';
        const practice = body.practiceDurationSeconds ?? body.metadata?.practiceDurationSeconds ?? null;
        if (action === 'complete') {
            if (typeof snapshot !== 'string' || snapshot.length > 500000) invalid('snapshotHtml must be a string of at most 500000 characters.');
            if (practice !== null && (!Number.isInteger(practice) || practice < 0 || practice > 2147483647)) invalid('practiceDurationSeconds must be an integer between 0 and 2147483647.');
        }
        const p = await this.resolveParticipant(auth.participantCode, auth.sessionId);
        return this.storage().transaction(`participant:${p.id}`, async (tx) => {
            const service = new ResearchService(tx, this.config);
            const access = await service.access(p);
            if (action === 'reset' && !['tester', 'admin'].includes(p.role)) throw new ContractError(403, 'RESET_FORBIDDEN', 'Only tester/admin accounts can reset modules.');
            if (!access.canAccessAllModules && parsed.dayIndex > access.unlockedDayIndex) throw new ContractError(403, 'MODULE_LOCKED', 'Module is not unlocked.');
            let existing = await service.first(`SELECT ${MODULE_COLUMNS} FROM module_runs WHERE participant_id = ? AND module_id = ?`, [p.id, parsed.moduleId]);
            const stamp = now();
            if (action === 'reset') {
                if (existing?.status !== 'completed') throw new ContractError(409, 'MODULE_NOT_COMPLETED', 'Only completed modules can be reset.');
                await tx.batch([
                    command("UPDATE module_runs SET session_id = ?, status = 'started', started_at = ?, completed_at = NULL, duration_seconds = NULL, practice_duration_seconds = NULL, elapsed_duration_seconds = NULL, metadata_json = ? WHERE id = ?", auth.sessionId, stamp, json(metadata(body.metadata)), existing.id),
                    ...DETAIL_TABLES.map((table) => command(`DELETE FROM ${table} WHERE participant_id = ? AND module_id = ?`, p.id, parsed.moduleId))
                ]);
            } else if (existing?.status !== 'completed') {
                const commands = [];
                if (!existing) {
                    commands.push(command(`INSERT INTO module_runs (id, participant_id, session_id, module_id, day_index, status, started_at, metadata_json) VALUES (?, ?, ?, ?, ?, 'started', ?, ?) ON CONFLICT(participant_id, module_id) DO NOTHING`, id('run'), p.id, auth.sessionId, parsed.moduleId, parsed.dayIndex, stamp, json(metadata(body.metadata))));
                }
                if (action === 'complete') {
                    // Snapshot is written before the conditional completion in the same atomic batch.
                    // A competing/retried completion sees completed and cannot replace it.
                    if (snapshot) commands.push(command(`INSERT INTO conversation_snapshots (id, participant_id, session_id, module_id, html_snapshot, snapshot_version, created_at)
                        SELECT ?, ?, ?, ?, ?, 'v1', ? WHERE EXISTS (SELECT 1 FROM module_runs WHERE participant_id = ? AND module_id = ? AND status = 'started')
                        ON CONFLICT(participant_id, module_id) DO NOTHING`, id('snapshot'), p.id, auth.sessionId, parsed.moduleId, snapshot, stamp, p.id, parsed.moduleId));
                    // Derive elapsed time inside the UPDATE so concurrent first starts use the saved start time.
                    const elapsedSql = tx.dialect === 'postgres'
                        ? 'GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (?::timestamptz - started_at::timestamptz))))::integer'
                        : 'MAX(0, CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER))';
                    commands.push(command(`UPDATE module_runs SET status = 'completed', completed_at = ?, practice_duration_seconds = ?, elapsed_duration_seconds = ${elapsedSql}, duration_seconds = ${elapsedSql}, metadata_json = ? WHERE participant_id = ? AND module_id = ? AND status = 'started'`, stamp, practice, stamp, stamp, json(metadata(body.metadata)), p.id, parsed.moduleId));
                }
                if (commands.length) await tx.batch(commands);
            }
            existing = await service.first(`SELECT ${MODULE_COLUMNS} FROM module_runs WHERE participant_id = ? AND module_id = ?`, [p.id, parsed.moduleId]);
            return { persisted: true, moduleRun: summary(existing), access: await service.access(p) };
        });
    }
    async events(body) {
        const auth = identity(body);
        if (!Array.isArray(body.events) || !body.events.length || body.events.length > 100) invalid('events must contain between 1 and 100 entries.');
        const valid = body.events.filter(eventValid);
        const rejected = body.events.length - valid.length;
        const p = await this.resolveParticipant(auth.participantCode, auth.sessionId);
        const commands = valid.map((event) => {
            const eventId = event.clientEventId ? `client:${p.id}:${auth.sessionId}:${event.clientEventId}` : id('event');
            const step = event.step == null ? null : String(event.step);
            if (event.type === 'conversation_message') return command(`INSERT INTO conversation_messages (id, participant_id, session_id, module_id, hook_id, message_role, message_text, source, step, sequence_index, duration_ms, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`, eventId, p.id, auth.sessionId, event.moduleId, String(event.hookId || ''), event.messageRole, event.messageText, event.source, step, event.sequenceIndex ?? null, event.durationMs ?? null, json(metadata(event.metadata)), now());
            return command(`INSERT INTO module_events (id, participant_id, session_id, module_id, event_type, step, user_input, choice_value, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`, eventId, p.id, auth.sessionId, event.moduleId, event.eventType, step, event.userInput || '', event.choiceValue || '', json(metadata(event.context)), now());
        });
        // Atomic batch: a failure cannot persist only a prefix and misreport counts.
        if (commands.length) await this.storage().batch(commands);
        return { accepted: valid.length, rejected, persisted: true };
    }
    async replay(body) {
        const auth = identity(body);
        const parsed = moduleId(body.moduleId);
        const p = await this.resolveParticipant(auth.participantCode, auth.sessionId);
        const completed = await this.first("SELECT id FROM module_runs WHERE participant_id = ? AND module_id = ? AND status = 'completed'", [p.id, parsed.moduleId]);
        if (!completed) return { moduleId: parsed.moduleId, snapshotHtml: null, messages: [], persisted: true };
        const snapshot = await this.first('SELECT html_snapshot FROM conversation_snapshots WHERE participant_id = ? AND module_id = ?', [p.id, parsed.moduleId]);
        const rows = await this.storage().all('SELECT * FROM conversation_messages WHERE participant_id = ? AND module_id = ? ORDER BY COALESCE(sequence_index, 2147483647), created_at, id', [p.id, parsed.moduleId]);
        return { moduleId: parsed.moduleId, snapshotHtml: snapshot?.html_snapshot || null, persisted: true,
            messages: rows.map((row) => ({ id: row.id, moduleId: row.module_id, hookId: row.hook_id, messageRole: row.message_role, messageText: row.message_text, source: row.source, step: row.step, sequenceIndex: row.sequence_index, durationMs: row.duration_ms, metadata: parseJson(row.metadata_json), createdAt: row.created_at })) };
    }
    async recordAiCallEvent(input) {
        const p = await this.resolveParticipant(input.participantCode, input.sessionId);
        await this.storage().batch([command(`INSERT INTO ai_call_events (id, participant_id, session_id, module_id, hook_id, variant, user_input, reply_text, fallback_used, prompt_version, provider, model, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, id('ai'), p.id, input.sessionId, input.moduleId, input.hookId, input.variant || '', input.userInput, input.replyText, input.fallbackUsed ? 1 : 0, input.promptVersion, input.provider, input.model, json(metadata(input.metadata)), now())]);
    }
    async exportRows(filters, requestedBy) {
        const db = this.storage();
        return db.transaction('export', async (tx) => {
            const rows = [];
            for (const table of ['participants', 'sessions', 'module_runs', ...DETAIL_TABLES]) {
                const isParticipant = table === 'participants';
                const clauses = [];
                const params = [];
                if (filters.participantCode) { clauses.push('p.participant_code = ?'); params.push(filters.participantCode); }
                if (!filters.includeTestData) clauses.push(tx.dialect === 'postgres' ? "COALESCE((p.metadata_json::jsonb->>'testData'), 'false') <> 'true'" : "COALESCE(json_extract(p.metadata_json, '$.testData'), 0) <> 1");
                if (filters.moduleId && !['participants', 'sessions'].includes(table)) { clauses.push('t.module_id = ?'); params.push(filters.moduleId); }
                const timeColumn = ['sessions', 'module_runs'].includes(table) ? 'started_at' : 'created_at';
                // Filter training records by completion time when available, so a
                // run started yesterday but completed today is in today's export.
                const filterTime = table === 'module_runs' ? 'COALESCE(t.completed_at, t.started_at)' : `t.${timeColumn}`;
                if (filters.dateFrom) { clauses.push(`${filterTime} >= ?`); params.push(filters.dateFrom); }
                if (filters.dateTo) { clauses.push(`${filterTime} <= ?`); params.push(filters.dateTo); }
                const result = await tx.all(`SELECT t.*, p.participant_code AS export_participant_code, p.participant_name AS export_participant_name FROM ${table} t JOIN participants p ON p.id = ${isParticipant ? 't.id' : 't.participant_id'}${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY t.${timeColumn}, t.id`, params);
                for (const row of result) rows.push({ entity: table, ...row });
            }
            await tx.batch([command('INSERT INTO exports (id, requested_by, format, filters_json, created_at) VALUES (?, ?, ?, ?, ?)', id('export'), requestedBy, filters.format, json(filters), now())]);
            return rows;
        });
    }
}

export function createD1Adapter(db) {
    if (!db) return null;
    const adapter = {
        dialect: 'sqlite',
        async all(sql, params = []) { return (await db.prepare(sql).bind(...params).all()).results || []; },
        async batch(commands) { if (commands.length) await db.batch(commands.map(({ sql, params }) => db.prepare(sql).bind(...params))); },
        async transaction(_key, callback) { return callback(adapter); }
    };
    return adapter;
}

async function secureTokenMatch(actual, expected) {
    if (!expected) return false;
    const digest = async (value) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
    const [left, right] = await Promise.all([digest(actual), digest(expected)]);
    let difference = 0;
    for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
    return difference === 0;
}
function exportFilters(url) {
    const search = url.searchParams;
    const format = search.get('format') || 'csv';
    if (!['csv', 'json'].includes(format)) invalid('format must be csv or json.');
    const filters = { format, includeTestData: false };
    if (search.has('includeTestData')) {
        if (!['true', 'false'].includes(search.get('includeTestData'))) invalid('includeTestData must be true or false.');
        filters.includeTestData = search.get('includeTestData') === 'true';
    }
    if (search.has('participantCode')) {
        const result = validateParticipantCode(search.get('participantCode'));
        if (!result.ok) invalid(result.error);
        filters.participantCode = result.normalizedValue;
    }
    if (search.has('moduleId')) filters.moduleId = moduleId(search.get('moduleId')).moduleId;
    for (const key of ['dateFrom', 'dateTo']) {
        if (!search.has(key)) continue;
        const value = search.get(key);
        const calendar = value.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(calendar) || !Number.isFinite(Date.parse(`${calendar}T00:00:00Z`))
            || new Date(`${calendar}T00:00:00Z`).toISOString().slice(0, 10) !== calendar) invalid(`${key} contains an invalid calendar date.`);
        // Date-only upper bounds include the whole UTC date. Timestamps require an explicit timezone.
        const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T${key === 'dateTo' ? '23:59:59.999' : '00:00:00.000'}Z` : value;
        if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) || !Number.isFinite(Date.parse(timestamp))) invalid(`${key} must be an ISO date or timestamp with timezone.`);
        filters[key] = new Date(timestamp).toISOString();
    }
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) invalid('dateFrom must not be after dateTo.');
    return filters;
}
export function toCsv(rows) {
    const columns = [...new Set(['entity', 'export_participant_code', 'export_participant_name', ...rows.flatMap((row) => Object.keys(row))])];
    const cell = (value) => {
        let text = value == null ? '' : typeof value === 'object' ? json(value) : String(value);
        // Prevent spreadsheet formula interpretation of participant-entered values.
        if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
    };
    return '\uFEFF' + [columns.map(cell).join(','), ...rows.map((row) => columns.map((key) => cell(row[key])).join(','))].join('\r\n');
}

export async function handleResearchRequest(request, service, headers = {}) {
    const url = new URL(request.url);
    const actions = new Map([
        [API_PATHS.participantStart, (body) => service.startParticipantSession({ ...body, userAgent: request.headers.get('user-agent') || '' })],
        [API_PATHS.moduleRunStart, (body) => service.moduleRun(body, 'start')],
        [API_PATHS.moduleRunComplete, (body) => service.moduleRun(body, 'complete')],
        [API_PATHS.moduleRunReset, (body) => service.moduleRun(body, 'reset')],
        [API_PATHS.events, (body) => service.events(body)],
        [API_PATHS.conversationReplay, (body) => service.replay(body)]
    ]);
    const isEvents = url.pathname === API_PATHS.events;
    const responseJson = (data, status) => Response.json(data, { status, headers });
    if (!(request.method === 'POST' && actions.has(url.pathname)) && !(request.method === 'GET' && url.pathname === API_PATHS.export)) return null;
    let body;
    try {
        if (request.method === 'GET') {
            const authorization = request.headers.get('authorization') || '';
            if (!authorization) throw new ContractError(401, 'AUTH_REQUIRED', 'Export authorization is required.');
            if (!await secureTokenMatch(authorization, `Bearer ${service.config.adminExportToken || ''}`) || !service.config.adminExportToken) throw new ContractError(403, 'AUTH_INVALID', 'Invalid export authorization.');
            const filters = exportFilters(url);
            const rows = await service.exportRows(filters, service.config.exportCredentialId || 'primary');
            return new Response(filters.format === 'csv' ? toCsv(rows) : json({ version: 'v1', exportedAt: now(), filters, rows }), {
                status: 200, headers: { ...headers, 'Content-Type': filters.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="resilience-${now().slice(0, 10)}.${filters.format}"`, 'Cache-Control': 'no-store' }
            });
        }
        try { body = await request.json(); } catch { invalid('Invalid JSON body.'); }
        if (!object(body)) invalid('Request body must be an object.');
        const result = await actions.get(url.pathname)(body);
        return responseJson(result, isEvents ? 202 : 200);
    } catch (error) {
        if (error instanceof ContractError && !(isEvents && error.status === 503)) return responseJson({ error: error.message, code: error.code }, error.status);
        // Never include SQL, connection strings, provider payloads or token values in responses/logs.
        console.warn('Research storage operation failed', url.pathname);
        return responseJson({ error: 'Research data storage is unavailable.', code: 'STORAGE_UNAVAILABLE', ...(isEvents ? { accepted: 0, rejected: body?.events?.length || 0, persisted: false } : {}) }, isEvents ? 202 : 503);
    }
}

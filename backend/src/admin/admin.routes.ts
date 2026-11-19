import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppEnv } from '../config/env.js';
import type { ResearchService, ResearchDatabase } from '../../../shared-contract/research.mjs';
import {
    clearStaffCookie, issueStaffCookie, staffSession, validateStaffLogin
} from './auth.js';
import { attendance, shanghaiDate } from './attendance.js';

const ADMIN_PREFIX = '/api/v1/admin';
const TEST_FILTER = "COALESCE((p.metadata_json::jsonb->>'testData'), 'false') <> 'true'";
const hasBody = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));

function sendError(reply: FastifyReply, status: number, error: string, code: string) {
    return reply.code(status).send({ error, code });
}

function originAllowed(request: FastifyRequest, env: AppEnv): boolean {
    const origin = request.headers.origin;
    return typeof origin === 'string' && env.corsOrigins.includes(origin);
}

async function requireStaff(request: FastifyRequest, reply: FastifyReply, env: AppEnv, db: ResearchDatabase | null): Promise<string | null> {
    reply.header('Cache-Control', 'no-store');
    const session = staffSession(request.headers.cookie, env);
    if (!session || !db) {
        sendError(reply, 401, 'Staff authentication required.', 'STAFF_AUTH_REQUIRED');
        return null;
    }
    const active = (await db.all('SELECT id FROM admin_sessions WHERE id = ? AND staff_username = ? AND revoked_at IS NULL AND expires_at > now()', [session.sessionId, session.username]))[0];
    if (!active) {
        sendError(reply, 401, 'Staff authentication required.', 'STAFF_AUTH_REQUIRED');
        return null;
    }
    return session.username;
}

async function listParticipants(db: ResearchDatabase, query: Record<string, unknown>) {
    const search = String(query.q || '').trim().slice(0, 80);
    const status = String(query.status || 'all');
    const page = Math.max(1, Math.min(10000, Number.parseInt(String(query.page || '1'), 10) || 1));
    const pageSize = Math.max(10, Math.min(10000, Number.parseInt(String(query.pageSize || '25'), 10) || 25));
    const clauses = [TEST_FILTER];
    const params: unknown[] = [];
    if (search) {
        clauses.push('(p.participant_code ILIKE ? OR p.participant_name ILIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }
    if (['active', 'paused', 'archived'].includes(status)) {
        clauses.push('p.status = ?');
        params.push(status);
    }
    const where = clauses.join(' AND ');
    const rows = await db.all(`
        SELECT p.id, p.participant_code, p.participant_name, p.status, p.created_at, p.last_seen_at,
            first_run.completed_at AS enrolled_at,
            COALESCE(progress.completed_count, 0)::integer AS completed_count,
            progress.last_completed_at,
            progress.last_module_id,
            progress.last_elapsed_seconds,
            progress.last_practice_seconds,
            COALESCE(progress.graduated, false) AS graduated,
            progress.graduated_at,
            COALESCE(status_events.events, '[]'::json) AS participant_status_history
        FROM participants p
        LEFT JOIN LATERAL (
            SELECT completed_at FROM module_runs
            WHERE participant_id = p.id AND module_id = '1-1' AND status = 'completed'
            ORDER BY completed_at LIMIT 1
        ) first_run ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
                MAX(completed_at) FILTER (WHERE status = 'completed') AS last_completed_at,
                (ARRAY_AGG(module_id ORDER BY completed_at DESC) FILTER (WHERE status = 'completed'))[1] AS last_module_id,
                (ARRAY_AGG(elapsed_duration_seconds ORDER BY completed_at DESC) FILTER (WHERE status = 'completed'))[1] AS last_elapsed_seconds,
                (ARRAY_AGG(practice_duration_seconds ORDER BY completed_at DESC) FILTER (WHERE status = 'completed'))[1] AS last_practice_seconds,
                BOOL_OR(module_id = '6-7' AND status = 'completed') AS graduated,
                MIN(completed_at::timestamptz) FILTER (WHERE module_id = '6-7' AND status = 'completed') AS graduated_at
            FROM module_runs WHERE participant_id = p.id
        ) progress ON true
        LEFT JOIN LATERAL (
            SELECT json_agg(json_build_object('from_status', from_status, 'to_status', to_status, 'changed_at', changed_at) ORDER BY changed_at) AS events
            FROM participant_status_history WHERE participant_id = p.id
        ) status_events ON true
        WHERE ${where}
        ORDER BY CASE p.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
            progress.last_completed_at NULLS FIRST, p.participant_code
        LIMIT 10000`, params);
    const now = new Date();
    const allItems = rows.map((row) => {
            return {
                participantId: row.id,
                participantCode: row.participant_code,
                participantName: row.participant_name,
                status: row.status,
                enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : null,
                completedDays: Number(row.completed_count || 0),
                lastCompletedAt: row.last_completed_at ? new Date(row.last_completed_at).toISOString() : null,
                lastModuleId: row.last_module_id,
                lastElapsedDurationSeconds: row.last_elapsed_seconds == null ? null : Number(row.last_elapsed_seconds),
                lastPracticeDurationSeconds: row.last_practice_seconds == null ? null : Number(row.last_practice_seconds),
                graduated: Boolean(row.graduated),
                ...attendance({
                    status: row.status, enrolledAt: row.enrolled_at, lastCompletedAt: row.last_completed_at,
                    graduatedAt: row.graduated_at, statusHistory: row.participant_status_history || []
                }, now)
            };
        });
    const completion = String(query.completion || 'all');
    const filteredItems = allItems.filter((item) => {
        if (String(query.alert || '') === 'true' && !item.alert) return false;
        if (completion === 'today' && !item.completedToday) return false;
        if (completion === 'graduated' && !item.graduated) return false;
        if (completion === 'incomplete' && item.graduated) return false;
        if (completion === 'enrolled' && !item.enrolledAt) return false;
        return true;
    });
    const sort = String(query.sort || 'alert');
    if (sort === 'progress') filteredItems.sort((left, right) => right.completedDays - left.completedDays || left.participantCode.localeCompare(right.participantCode));
    else if (sort === 'recent') filteredItems.sort((left, right) => (right.lastCompletedAt || '').localeCompare(left.lastCompletedAt || ''));
    else if (sort === 'code') filteredItems.sort((left, right) => left.participantCode.localeCompare(right.participantCode));
    else filteredItems.sort((left, right) => Number(right.alert) - Number(left.alert)
        || right.missedExpectedDays - left.missedExpectedDays
        || (left.lastCompletedAt || '').localeCompare(right.lastCompletedAt || ''));
    const total = String(query.alert || '') === 'true' || completion !== 'all' ? filteredItems.length
        : Number((await db.all(`SELECT COUNT(*)::integer AS count FROM participants p WHERE ${where}`, params))[0]?.count || 0);
    return { items: filteredItems.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total };
}

export async function registerAdminRoutes(app: FastifyInstance, service: ResearchService, env: AppEnv): Promise<void> {
    const db = service.getResearchDatabase();
    app.post(`${ADMIN_PREFIX}/login`, async (request, reply) => {
        reply.header('Cache-Control', 'no-store');
        if (!originAllowed(request, env)) return sendError(reply, 403, 'Request origin is not allowed.', 'ORIGIN_FORBIDDEN');
        if (!db) return sendError(reply, 503, 'Research storage is unavailable.', 'STORAGE_UNAVAILABLE');
        if (!env.staffAdminUsername || !env.staffAdminPasswordHash) return sendError(reply, 503, 'Staff sign-in is not configured.', 'STAFF_AUTH_UNAVAILABLE');
        if (!hasBody(request.body) || typeof request.body.username !== 'string' || typeof request.body.password !== 'string'
            || request.body.username.length > 100 || request.body.password.length > 200) {
            return sendError(reply, 400, 'Invalid sign-in request.', 'VALIDATION_ERROR');
        }
        const clientKey = request.ip;
        const valid = validateStaffLogin(request.body.username, request.body.password, env, clientKey);
        if (!valid) {
            await db.batch([{
                sql: 'INSERT INTO admin_audit_logs (id, staff_username, action, metadata_json) VALUES (?, ?, ?, ?::jsonb)',
                params: [`audit_${randomUUID()}`, 'unknown', 'login_failed', JSON.stringify({ clientAddress: request.ip })]
            }]);
            return sendError(reply, 401, 'Invalid username or password.', 'STAFF_AUTH_INVALID');
        }
        const cookie = issueStaffCookie(env);
        const session = staffSession(cookie, env);
        if (!session) return sendError(reply, 500, 'Staff session could not be created.', 'STAFF_SESSION_ERROR');
        reply.header('Set-Cookie', cookie);
        reply.header('Cache-Control', 'no-store');
        await db.batch([{
            sql: 'INSERT INTO admin_sessions (id, staff_username, expires_at) VALUES (?, ?, ?)',
            params: [session.sessionId, session.username, session.expiresAt.toISOString()]
        }, {
            sql: 'INSERT INTO admin_audit_logs (id, staff_username, action) VALUES (?, ?, ?)',
            params: [`audit_${randomUUID()}`, env.staffAdminUsername, 'login']
        }]);
        return { authenticated: true, username: env.staffAdminUsername };
    });

    app.get(`${ADMIN_PREFIX}/session`, async (request, reply) => {
        const username = await requireStaff(request, reply, env, db);
        if (!username) return;
        reply.header('Cache-Control', 'no-store');
        return { authenticated: true, username };
    });

    app.post(`${ADMIN_PREFIX}/logout`, async (request, reply) => {
        reply.header('Cache-Control', 'no-store');
        if (!originAllowed(request, env)) return sendError(reply, 403, 'Request origin is not allowed.', 'ORIGIN_FORBIDDEN');
        const session = staffSession(request.headers.cookie, env);
        reply.header('Set-Cookie', clearStaffCookie(env.nodeEnv === 'production'));
        reply.header('Cache-Control', 'no-store');
        if (session && db) await db.batch([
            { sql: 'UPDATE admin_sessions SET revoked_at = now() WHERE id = ? AND revoked_at IS NULL', params: [session.sessionId] },
            { sql: 'INSERT INTO admin_audit_logs (id, staff_username, action) VALUES (?, ?, ?)', params: [`audit_${randomUUID()}`, session.username, 'logout'] }
        ]);
        return { authenticated: false };
    });

    app.get(`${ADMIN_PREFIX}/overview`, async (request, reply) => {
        const username = await requireStaff(request, reply, env, db);
        if (!username) return;
        if (!db) return sendError(reply, 503, 'Research storage is unavailable.', 'STORAGE_UNAVAILABLE');
        const today = shanghaiDate(new Date());
        const counts = await db.all(`SELECT
            COUNT(*) FILTER (WHERE p.status = 'active')::integer AS active,
            COUNT(*) FILTER (WHERE p.status = 'paused')::integer AS paused,
            COUNT(*) FILTER (WHERE p.status = 'archived')::integer AS withdrawn,
            COUNT(*) FILTER (WHERE first_run.completed_at IS NOT NULL)::integer AS enrolled,
            COUNT(*) FILTER (WHERE graduation.completed_at IS NOT NULL)::integer AS graduated
            FROM participants p
            LEFT JOIN LATERAL (SELECT completed_at FROM module_runs WHERE participant_id = p.id AND module_id = '1-1' AND status = 'completed' ORDER BY completed_at LIMIT 1) first_run ON true
            LEFT JOIN LATERAL (SELECT completed_at FROM module_runs WHERE participant_id = p.id AND module_id = '6-7' AND status = 'completed' LIMIT 1) graduation ON true
            WHERE ${TEST_FILTER}`);
        const activeList = await listParticipants(db, { status: 'active', page: 1, pageSize: 10000 });
        const alerts = activeList.items.filter((item) => item.alert).length;
        const eligible = activeList.items.filter((item) => item.eligibleToday).length;
        const todayRuns = activeList.items.filter((item) => item.completedToday).length;
        const row = counts[0] || {};
        return {
            date: today,
            updatedAt: new Date().toISOString(),
            participants: {
                enrolled: Number(row.enrolled || 0), active: Number(row.active || 0), paused: Number(row.paused || 0),
                withdrawn: Number(row.withdrawn || 0), graduated: Number(row.graduated || 0),
                graduationRate: Number(row.enrolled || 0) ? Number(row.graduated || 0) / Number(row.enrolled) : 0
            },
            today: { eligible, completed: todayRuns, completionRate: eligible ? todayRuns / eligible : 0 },
            alerts: { consecutiveMissedDays: 2, participantCount: alerts }
        };
    });

    app.get(`${ADMIN_PREFIX}/participants`, async (request, reply) => {
        const username = await requireStaff(request, reply, env, db);
        if (!username) return;
        if (!db) return sendError(reply, 503, 'Research storage is unavailable.', 'STORAGE_UNAVAILABLE');
        const query = request.query && typeof request.query === 'object' ? request.query as Record<string, unknown> : {};
        try {
            const data = await listParticipants(db, query);
            const alertFilter = String(query.alert || '');
            if (alertFilter === 'true') data.items = data.items.filter((item) => item.alert);
            return data;
        } catch {
            return sendError(reply, 400, 'Invalid participant filters.', 'VALIDATION_ERROR');
        }
    });

    app.get(`${ADMIN_PREFIX}/participants/:participantId`, async (request, reply) => {
        const username = await requireStaff(request, reply, env, db);
        if (!username) return;
        if (!db) return sendError(reply, 503, 'Research storage is unavailable.', 'STORAGE_UNAVAILABLE');
        const { participantId } = request.params as { participantId: string };
        const rows = await db.all(`SELECT p.id, p.participant_code, p.participant_name, p.status, p.created_at, p.last_seen_at,
            r.module_id, r.day_index, r.status AS run_status, r.started_at, r.completed_at,
            r.elapsed_duration_seconds, r.practice_duration_seconds
            FROM participants p LEFT JOIN module_runs r ON r.participant_id = p.id
            WHERE p.id = ? AND ${TEST_FILTER} ORDER BY r.day_index`, [participantId]);
        if (!rows.length) return sendError(reply, 404, 'Participant not found.', 'PARTICIPANT_NOT_FOUND');
        const participant = rows[0];
        await db.batch([{
            sql: 'INSERT INTO admin_audit_logs (id, staff_username, action, participant_id) VALUES (?, ?, ?, ?)',
            params: [`audit_${randomUUID()}`, username, 'view_participant_progress', participantId]
        }]);
        return {
            participant: {
                participantId: participant.id, participantCode: participant.participant_code,
                participantName: participant.participant_name, status: participant.status,
                createdAt: participant.created_at, lastSeenAt: participant.last_seen_at
            },
            moduleRuns: rows.filter((row) => row.module_id).map((row) => ({
                moduleId: row.module_id, dayIndex: Number(row.day_index), status: row.run_status,
                startedAt: row.started_at, completedAt: row.completed_at,
                elapsedDurationSeconds: row.elapsed_duration_seconds == null ? null : Number(row.elapsed_duration_seconds),
                practiceDurationSeconds: row.practice_duration_seconds == null ? null : Number(row.practice_duration_seconds)
            }))
        };
    });

    app.post(`${ADMIN_PREFIX}/participants/:participantId/status`, async (request, reply) => {
        if (!originAllowed(request, env)) return sendError(reply, 403, 'Request origin is not allowed.', 'ORIGIN_FORBIDDEN');
        const username = await requireStaff(request, reply, env, db);
        if (!username) return;
        if (!db) return sendError(reply, 503, 'Research storage is unavailable.', 'STORAGE_UNAVAILABLE');
        if (!hasBody(request.body) || !['active', 'paused', 'archived'].includes(String(request.body.status))) {
            return sendError(reply, 400, 'Status must be active, paused, or archived.', 'VALIDATION_ERROR');
        }
        const { participantId } = request.params as { participantId: string };
        const nextStatus = String(request.body.status);
        try {
            const updated = await db.transaction(`participant-status:${participantId}`, async (tx) => {
                const current = (await tx.all('SELECT id, status FROM participants WHERE id = ? AND COALESCE((metadata_json::jsonb->>\'testData\'), \'false\') <> \'true\'', [participantId]))[0];
                if (!current) return null;
                if (current.status === nextStatus) return { status: nextStatus, changed: false };
                await tx.batch([
                    { sql: 'UPDATE participants SET status = ? WHERE id = ?', params: [nextStatus, participantId] },
                    { sql: 'INSERT INTO participant_status_history (id, participant_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?, ?)', params: [`status_${randomUUID()}`, participantId, current.status, nextStatus, username] },
                    { sql: 'INSERT INTO admin_audit_logs (id, staff_username, action, participant_id, metadata_json) VALUES (?, ?, ?, ?, ?::jsonb)', params: [`audit_${randomUUID()}`, username, 'change_participant_status', participantId, JSON.stringify({ from: current.status, to: nextStatus })] }
                ]);
                return { status: nextStatus, changed: true };
            });
            if (!updated) return sendError(reply, 404, 'Participant not found.', 'PARTICIPANT_NOT_FOUND');
            return updated;
        } catch {
            return sendError(reply, 503, 'Participant status could not be updated.', 'STORAGE_UNAVAILABLE');
        }
    });
}

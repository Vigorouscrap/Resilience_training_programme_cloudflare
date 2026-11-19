import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'resilience_staff';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

export interface StaffAuthConfig {
    staffAdminUsername: string;
    staffAdminPasswordHash: string;
    sessionSecret: string;
    nodeEnv: string;
}

export function parseCookies(header = ''): Record<string, string> {
    return Object.fromEntries(header.split(';').map((part) => {
        const separator = part.indexOf('=');
        if (separator < 0) return ['', ''];
        const key = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        try {
            return [key, decodeURIComponent(value)];
        } catch {
            return [key, ''];
        }
    }).filter(([key]) => key));
}

function sign(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
}

function passwordMatches(password: string, encoded: string): boolean {
    const [algorithm, salt, hash] = encoded.split('$');
    if (algorithm !== 'scrypt' || !salt || !hash) return false;
    try {
        const expected = Buffer.from(hash, 'base64url');
        const actual = scryptSync(password, salt, expected.length);
        return expected.length > 0 && timingSafeEqual(actual, expected);
    } catch {
        return false;
    }
}

export function createPasswordHash(password: string, salt = randomBytes(16).toString('base64url')): string {
    if (password.length < 16 || password.length > 200) throw new Error('Staff password must be 16 to 200 characters.');
    return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('base64url')}`;
}

export function issueStaffCookie(config: StaffAuthConfig, now = Date.now()): string {
    const payload = Buffer.from(JSON.stringify({ sub: config.staffAdminUsername, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
        credentials: sign(config.staffAdminPasswordHash, config.sessionSecret), nonce: randomBytes(16).toString('base64url') })).toString('base64url');
    const value = `${payload}.${sign(payload, config.sessionSecret)}`;
    return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/api/v1/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${config.nodeEnv === 'production' ? '; Secure' : ''}`;
}

export function clearStaffCookie(secure: boolean): string {
    return `${COOKIE_NAME}=; Path=/api/v1/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function authenticatedStaff(cookieHeader: string | undefined, config: StaffAuthConfig, now = Date.now()): string | null {
    return staffSession(cookieHeader, config, now)?.username || null;
}

export function staffSession(cookieHeader: string | undefined, config: StaffAuthConfig, now = Date.now()): { username: string; sessionId: string; expiresAt: Date } | null {
    const token = parseCookies(cookieHeader)[COOKIE_NAME];
    if (!token || !config.staffAdminUsername || !config.staffAdminPasswordHash) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload, config.sessionSecret));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    try {
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; exp?: number; nonce?: string; credentials?: string };
        if (session.sub !== config.staffAdminUsername || !Number.isInteger(session.exp) || Number(session.exp) <= Math.floor(now / 1000)
            || session.credentials !== sign(config.staffAdminPasswordHash, config.sessionSecret)
            || typeof session.nonce !== 'string' || !session.nonce) return null;
        return { username: session.sub, sessionId: session.nonce, expiresAt: new Date(Number(session.exp) * 1000) };
    } catch {
        return null;
    }
}

export function validateStaffLogin(username: string, password: string, config: StaffAuthConfig, clientKey: string, now = Date.now()): boolean {
    const attempt = attempts.get(clientKey);
    if (attempt && attempt.resetAt <= now) attempts.delete(clientKey);
    const current = attempts.get(clientKey);
    if (current && current.count >= MAX_LOGIN_ATTEMPTS) return false;
    const valid = username === config.staffAdminUsername
        && passwordMatches(password, config.staffAdminPasswordHash)
        && Boolean(config.staffAdminUsername && config.staffAdminPasswordHash);
    if (!valid) {
        const next = current || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
        next.count += 1;
        attempts.set(clientKey, next);
        return false;
    }
    attempts.delete(clientKey);
    return true;
}

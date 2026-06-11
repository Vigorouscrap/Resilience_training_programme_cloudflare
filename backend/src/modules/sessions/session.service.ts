import { randomUUID } from 'node:crypto';
import { SessionRepository } from './session.repository.js';

export class SessionService {
    constructor(private readonly repository: SessionRepository) {}

    ensureSession(sessionId?: string, metadata: Record<string, unknown> = {}): string {
        const resolvedSessionId = sessionId?.trim() || `anon_${randomUUID()}`;
        this.repository.upsert(resolvedSessionId, metadata);
        return resolvedSessionId;
    }
}

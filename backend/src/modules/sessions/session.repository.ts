interface SessionRecord {
    sessionId: string;
    createdAt: string;
    lastSeenAt: string;
    metadata: Record<string, unknown>;
}

export class SessionRepository {
    private readonly records = new Map<string, SessionRecord>();

    upsert(sessionId: string, metadata: Record<string, unknown> = {}): SessionRecord {
        const nowIso = new Date().toISOString();
        const existing = this.records.get(sessionId);

        const record: SessionRecord = existing
            ? {
                ...existing,
                lastSeenAt: nowIso,
                metadata: {
                    ...existing.metadata,
                    ...metadata
                }
            }
            : {
                sessionId,
                createdAt: nowIso,
                lastSeenAt: nowIso,
                metadata: { ...metadata }
            };

        this.records.set(sessionId, record);
        return record;
    }

    get(sessionId: string): SessionRecord | null {
        return this.records.get(sessionId) ?? null;
    }
}

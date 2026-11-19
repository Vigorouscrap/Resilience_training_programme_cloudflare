CREATE TABLE admin_audit_logs (
    id TEXT PRIMARY KEY,
    staff_username TEXT NOT NULL,
    action TEXT NOT NULL,
    participant_id TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_participant ON admin_audit_logs(participant_id, created_at DESC);

CREATE TABLE admin_sessions (
    id TEXT PRIMARY KEY,
    staff_username TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE participant_status_history (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL CHECK (from_status IN ('active', 'paused', 'archived')),
    to_status TEXT NOT NULL CHECK (to_status IN ('active', 'paused', 'archived')),
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_participant_status_history_participant ON participant_status_history(participant_id, changed_at);

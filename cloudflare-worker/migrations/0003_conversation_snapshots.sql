PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS conversation_snapshots (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    html_snapshot TEXT NOT NULL,
    snapshot_version TEXT NOT NULL DEFAULT 'v1',
    created_at TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    UNIQUE (participant_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_snapshots_session_module
    ON conversation_snapshots (session_id, module_id);

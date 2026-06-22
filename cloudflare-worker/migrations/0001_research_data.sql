PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    participant_code TEXT NOT NULL UNIQUE,
    display_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    CHECK (status IN ('active', 'paused', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_participants_code
    ON participants (participant_code);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    client_session_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    UNIQUE (participant_id, client_session_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_participant
    ON sessions (participant_id, last_seen_at);

CREATE TABLE IF NOT EXISTS module_events (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    step TEXT,
    user_input TEXT NOT NULL DEFAULT '',
    choice_value TEXT NOT NULL DEFAULT '',
    context_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_module_events_participant_time
    ON module_events (participant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_module_events_session_module
    ON module_events (session_id, module_id, created_at);

CREATE TABLE IF NOT EXISTS ai_call_events (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    hook_id TEXT NOT NULL,
    variant TEXT NOT NULL DEFAULT '',
    user_input TEXT NOT NULL,
    reply_text TEXT NOT NULL,
    fallback_used INTEGER NOT NULL DEFAULT 0,
    prompt_version TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    CHECK (fallback_used IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_ai_call_events_participant_time
    ON ai_call_events (participant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_call_events_session_hook
    ON ai_call_events (session_id, hook_id, created_at);

CREATE TABLE IF NOT EXISTS exports (
    id TEXT PRIMARY KEY,
    requested_by TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'json',
    filters_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    CHECK (format IN ('json', 'csv'))
);

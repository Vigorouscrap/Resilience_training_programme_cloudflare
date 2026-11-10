-- Research API schema. Legacy Prisma models are unused and are not modified.
CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    participant_code TEXT NOT NULL,
    display_label TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    participant_name_normalized TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('participant', 'tester', 'admin')),
    unlock_start_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata_json::jsonb) = 'object'),
    UNIQUE (participant_code, participant_name_normalized)
);
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    client_session_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER,
    user_agent TEXT NOT NULL DEFAULT '',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    UNIQUE (participant_id, client_session_id)
);
CREATE TABLE module_runs (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    module_id TEXT NOT NULL,
    day_index INTEGER NOT NULL CHECK (day_index BETWEEN 1 AND 42),
    status TEXT NOT NULL CHECK (status IN ('started', 'completed')),
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_seconds INTEGER CHECK (duration_seconds >= 0),
    practice_duration_seconds INTEGER CHECK (practice_duration_seconds >= 0),
    elapsed_duration_seconds INTEGER CHECK (elapsed_duration_seconds >= 0),
    metadata_json TEXT NOT NULL DEFAULT '{}',
    UNIQUE (participant_id, module_id)
);
CREATE TABLE module_events (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    module_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    step TEXT,
    user_input TEXT NOT NULL DEFAULT '',
    choice_value TEXT NOT NULL DEFAULT '',
    context_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE TABLE conversation_messages (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    module_id TEXT NOT NULL,
    hook_id TEXT NOT NULL DEFAULT '',
    message_role TEXT NOT NULL CHECK (message_role IN ('system_script', 'user', 'ai', 'ui_event')),
    message_text TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('fixed_script', 'user_input', 'ai_hook', 'button_choice', 'module_event')),
    step TEXT,
    sequence_index INTEGER,
    duration_ms INTEGER,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE TABLE ai_call_events (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    module_id TEXT NOT NULL,
    hook_id TEXT NOT NULL,
    variant TEXT NOT NULL DEFAULT '',
    user_input TEXT NOT NULL,
    reply_text TEXT NOT NULL,
    fallback_used INTEGER NOT NULL CHECK (fallback_used IN (0, 1)),
    prompt_version TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE TABLE conversation_snapshots (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    module_id TEXT NOT NULL,
    html_snapshot TEXT NOT NULL,
    snapshot_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (participant_id, module_id)
);
CREATE TABLE exports (
    id TEXT PRIMARY KEY,
    requested_by TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('csv', 'json')),
    filters_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE INDEX idx_participants_code ON participants(participant_code);
CREATE INDEX idx_sessions_participant ON sessions(participant_id, last_seen_at);
CREATE INDEX idx_module_runs_participant_day ON module_runs(participant_id, day_index);
CREATE INDEX idx_module_events_participant_module ON module_events(participant_id, module_id, created_at);
CREATE INDEX idx_messages_replay ON conversation_messages(participant_id, module_id, sequence_index, created_at, id);
CREATE INDEX idx_ai_participant_module ON ai_call_events(participant_id, module_id, created_at);

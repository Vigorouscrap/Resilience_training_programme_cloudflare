PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS module_runs (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    day_index INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'started',
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_seconds INTEGER,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    UNIQUE (participant_id, module_id),
    CHECK (day_index BETWEEN 1 AND 42),
    CHECK (status IN ('started', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_module_runs_participant_day
    ON module_runs (participant_id, day_index);

CREATE INDEX IF NOT EXISTS idx_module_runs_session
    ON module_runs (session_id, started_at);

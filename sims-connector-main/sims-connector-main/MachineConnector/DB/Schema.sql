CREATE TABLE IF NOT EXISTS file_queue
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    file_path      TEXT NOT NULL UNIQUE,

    status         TEXT NOT NULL,

    retry_count    INTEGER NOT NULL DEFAULT 0,

    created_at     TEXT NOT NULL,

    uploaded_at    TEXT,

    last_retry_at  TEXT,

    last_error     TEXT
);
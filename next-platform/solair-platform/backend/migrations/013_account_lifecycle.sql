-- Additive lifecycle state: existing accounts remain active; no legacy rows change.
CREATE TABLE IF NOT EXISTS account_states(
 user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 deletion_pending INTEGER NOT NULL DEFAULT 0 CHECK(deletion_pending IN (0,1)),
 reason TEXT NOT NULL, updated_at TEXT NOT NULL
);
-- A shared row serializes account/admin changes across PostgreSQL processes.
CREATE TABLE IF NOT EXISTS account_admin_guard(id INTEGER PRIMARY KEY,revision INTEGER NOT NULL);
INSERT INTO account_admin_guard(id,revision) VALUES(1,0) ON CONFLICT(id) DO NOTHING;

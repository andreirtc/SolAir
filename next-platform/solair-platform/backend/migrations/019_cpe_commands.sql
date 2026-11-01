CREATE TABLE IF NOT EXISTS cpe_commands (
 id TEXT PRIMARY KEY,device_id TEXT NOT NULL REFERENCES devices(id),boot_id TEXT NOT NULL,
 command TEXT NOT NULL CHECK(command IN ('arm','disarm','siren_test')),
 requested_by TEXT NOT NULL REFERENCES profiles(id),created_at TEXT NOT NULL,expires_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','accepted','rejected','expired','superseded')),
 completed_at TEXT
);
CREATE INDEX IF NOT EXISTS cpe_commands_device ON cpe_commands(device_id,created_at);

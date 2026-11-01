-- Append-only study evidence and explicit SOC references; no changes to existing records.
CREATE TABLE IF NOT EXISTS battery_references(
 id TEXT PRIMARY KEY, device_id TEXT NOT NULL REFERENCES devices(id),
 mode TEXT NOT NULL CHECK(mode IN ('hardware','demo')),
 actor_id TEXT NOT NULL REFERENCES profiles(id), reference_at TEXT NOT NULL,
 profile_json TEXT NOT NULL, evidence TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS battery_reference_device ON battery_references(device_id,mode,created_at);
CREATE TABLE IF NOT EXISTS research_records(
 id TEXT PRIMARY KEY, device_id TEXT NOT NULL REFERENCES devices(id),
 mode TEXT NOT NULL CHECK(mode IN ('hardware','demo')),
 actor_id TEXT NOT NULL REFERENCES profiles(id), kind TEXT NOT NULL,
 payload TEXT NOT NULL, evidence TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS research_device_kind ON research_records(device_id,mode,kind,created_at);
CREATE TABLE IF NOT EXISTS research_forecast_outcomes(
 prediction_id TEXT PRIMARY KEY REFERENCES research_records(id),
 outcome_id TEXT NOT NULL UNIQUE REFERENCES research_records(id)
);

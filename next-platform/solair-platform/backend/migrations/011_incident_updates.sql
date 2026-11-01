-- Append-only handling records; existing telemetry, incidents and assignments stay intact.
CREATE TABLE IF NOT EXISTS incident_updates (
 id TEXT PRIMARY KEY,
 incident_id TEXT NOT NULL REFERENCES alarm_incidents(id),
 actor_id TEXT NOT NULL REFERENCES profiles(id),
 action TEXT NOT NULL CHECK(action IN ('acknowledged','note','resolved')),
 note TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS incident_updates_history ON incident_updates(incident_id,created_at,id);

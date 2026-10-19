CREATE TABLE IF NOT EXISTS cpe_samples(
 telemetry_id TEXT PRIMARY KEY REFERENCES telemetry(id) ON DELETE CASCADE,
 device_id TEXT NOT NULL REFERENCES devices(id), mode TEXT NOT NULL,
 load_mode TEXT NOT NULL CHECK(load_mode IN ('bench_resistor','vehicle_charging','none','unknown')),
 received_at TEXT NOT NULL, device_timestamp TEXT,
 pzem_voltage_v REAL, pzem_current_a REAL, pzem_power_w REAL, pzem_energy_wh REAL,
 acs_current_a REAL, lte_registered INTEGER NOT NULL, alarm_commanded INTEGER NOT NULL,
 quality_json TEXT NOT NULL, historical INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cpe_device_time ON cpe_samples(device_id,mode,received_at);
-- Browser access stays behind the existing authenticated organization/assignment API.
-- PostgreSQL-only RLS is applied by the adapter after this portable migration.

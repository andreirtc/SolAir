# CPE v2 contract and persistence

The existing strict v1 contract remains accepted. v2 uses the same authenticated `/api/ingest`, vehicle registry, roles and database; it requires the strict nested `cpe` object in `packages/telemetry-contract/index.ts`. v1 cannot carry v2 extensions. Unknown keys, nonfinite/out-of-range values, invalid coordinates, uncalibrated ACS amperes and invalid PZEM-quality/value combinations reject before persistence. Fixtures use only isolated temporary databases and are never research evidence.

Common identity: device_id, firmware_version, boot_id, nonnegative sequence/uptime, source_type, transport, nullable device_timestamp. Device UTC remains null until valid clock sync; server received_at is separate. Sensor heartbeat/snapshots every~2seconds (actual timing must be measured). Diagnostic00–09 logs are not ingestible JSON. Tests10/11/final generate identical v2 acquisition frames for USB and Wi-Fi; only transport changes. A duplicate can differ only in transport; payload conflicts return409 without mutation or firmware acknowledgement. Device token is separate from browser session. USB ingest additionally requires signed-in engineer/admin organization access.

| CPE field | Meaning |
|---|---|
| historical | True for immutable important event frames. They persist in history/events, but do not refresh fleet live receipt, GPS, fault transitions or energy integration. Live snapshots are false |
| meter_source | bench_supply, mppt_output or unknown; adapter tests must not masquerade as MPPT production |
| load_mode | bench_resistor, vehicle_charging, none or unknown. Firmware setting is a reported operating label, not charging authorization |
| mpu_raw | Seven signed raw registers ax/ay/az/temp/gx/gy/gz; null if unavailable; existing accel/gyro are scaled |
| pzem | quality, V, A, W, cumulative meterWh, voltage alarm flags. Non-ok quality forces measurements null; ok requires all measurements |
| acs | quality, calibrated currentA or null, actual ADC1 mV, sensor-side zero and sensitivity |
| lte | quality, AT detected, actual registration/attachment, CSQ or null, uplink commissioning flag. AT is not registration/data |
| gps | quality, HDOP or null, checksum failures and softwareUART overflow. Existing valid fresh coordinates/sats/age remain common fields |
| alarm | Actual firmware command, output level or null if polarity unknown, physical feedback null without sensor, reason, bounded durationms |
| queue_dropped | Bounded queue/write failure indicator, not guaranteed loss-free storage |

`003_cpe.sql` adds cpe_samples keyed by telemetry ID in the same SQLite/PostgreSQL transaction as the raw payload and events. It stores source/load/time, PZEM channels, ACS current, LTE registration and alarm state plus the full quality object. Existing telemetry/GPS/security/energy/audit/bench/calibration tables are retained. PostgreSQL RLS is enabled; Supabase migration revokes direct anon/authenticated access. Browser users go through existing server role/organization/assignment checks and SSE. No new remote actuation endpoint exists.

CPE CSV endpoint `/api/cpe-export/<vehicle-id>?mode=hardware` requires the same vehicle permissions as history. It is capped at5,000 records, explicitly advertised in the UI/header; values are escaped and potential spreadsheet formulas are neutralized. Existing JSON export includes full payloads and the existing history endpoint paginates100 records via offset. Returned source_type hardware means authenticated device-shaped data, not independent sensor authenticity.

Engineers/admins can inspect `/api/cpe-diagnostics/<vehicle-id>` for the last10 schema rejections authenticated by that device's bearer token, with server timestamps. Rejections are recorded in existing audit logs without raw payloads or credentials. Invalid tokens cannot spoof that device's error history; USB validation/connection errors remain in the bench serial log. Neither rejected reports nor audit entries refresh accepted sensor data.

PZEM MPPT-output readings live only in cpe.pzem. They do not populate PV-input, battery-current, battery-SOC or harvested-energy totals by assumption. Cumulative meterWh is not silently converted to charging yield. Wind remains unavailable. CPE and Energy screens show exact load mode and measurement history; driver/operator share the same accepted vehicle data. GPS map uses fix age plus receipt age for fresh marker status, retaining explicitly last-known history.

Transport: Wi-Fi HTTPS with configured rootCA; optional isolated RFC1918 HTTP bench opt-in. Device-only LAN listener3002 accepts only non-browser POST/api/ingest and uses the same backend. Existing app remains loopback3000. A7670E AT diagnostics and privateHTTP fallback code are present; carrier-specific productionHTTPS/CA and actual cellular reachability are still commissioning gates. No TLS verification bypass.

Firmware tasks: USB/switch/security loop separate from sensor and transport tasks; esp_timer cutoff plus local backup cutoff. No network/modem wait in security loop. GPS softwareUART on32, RS485 hardwareUART1 on16/17/23, LTE hardwareUART2 on13/14, USBUART0 preserved. Six important events persist as separate NVS strings, one latest sensor snapshot stays volatile, event trigger queue16; writes occur on event/ack changes, not every heartbeat. Torn write, capacity, corruption and real power-loss behavior need physical evidence; no loss-free guarantee. Runtime `SENSORS OFF` / `SENSORS ON` pause/resume commissioned acquisition without disabling physical contact security. ADC floating-input disconnects are not intrinsically detectable; the actual conditioned frontend needs reviewed biasing and unplug tests.

PZEM firmware now checks holding-register0x0003=0x0001 (matched50 A range) before accepting measurements and every30 seconds. Range mismatch/invalid readback/timeout sets existing quality=fault and null measurements; the backend/dashboard schema is unchanged. Physical shunt/wiring verification remains separate.

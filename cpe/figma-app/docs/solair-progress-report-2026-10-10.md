# SOLAIR Software Ecosystem Progress Report

## ET-01 first CPE preparation milestone

Team clarification follow-up: [October 10–11 staged procedure](staged-bench-integration.md) records unverified seller HW-548 specifications, provisional pressed=secure switch convention, LED-only output build and protected siren gates. A navy/teal ET-01 overview now surfaces source, freshness, active-boot security/switches and event identity; no new backend/schema or hardware commands. Existing checks, new overview/provisioning checks, production build and all three compile configurations pass; browser and integrated physical checks remain pending.

See the [October 10 ET-01 handoff](et01-cpe-handoff.md) for current Windows provisioning/upload steps, corrected HW-548 review gate, fresh validation, source preservation, physical evidence template and prioritized DP1/fleet plan. ET-01 monitoring now appears first; the contradictory global hardware banner is removed, and unknown-source cards remain unavailable. The user reports ESP32 operation, changing MPU6050 readings and microswitch COM/NO continuity; this is user-reported physical verification, with captures still pending. End-to-end siren/receiver/dashboard success remains unverified. Future modules and fleet/PWA functionality are subsequent milestones.

## October 10 software-only hardening update

The report below is the **pre-hardening review baseline**, retained as historical evidence. Its missing-export, RAM-only queue, unsynchronized-only clock and next-hardware-test recommendations are superseded by [the software-only hardening report](software-hardening.md). Current transport is ESP32 → bearer-authenticated HTTP POST → receiver → validation → SQLite → authenticated SSE → dashboard. MQTT remains future/optional. No physical test was performed.

Updated **software-only** estimates: architecture 90%, backend/data 95%, existing bench firmware software 80%, anti-tamper software 75%, dashboard diagnostics/monitoring 85%, software evidence/testing 90%. These estimates describe the bounded implemented software scope, not overall project or physical readiness. GPS 5%, LTE 0%, energy 10%, prediction 5% remain unchanged baseline placeholders; physical verification remains 0% evidenced. Denominators, limitations and current validation results are in the linked report.

## Historical baseline review

Baseline date: **October 10, 2026**  
Workspace: `C:\Users\Anyang\SolAir\figma-app`

This report records the repository inspection and validation performed in the preceding review. Creating this document did not rerun those checks or change implementation files.

## 1. Executive Summary

**SOLAIR has a software-tested local backend and an implemented ESP32 bench firmware path. It does not yet have a repository-substantiated physical end-to-end demonstration. GPS, LTE, real energy monitoring and predictive battery analytics are not implemented.**

No source files were modified during the review. No production build or firmware compilation was run. Seven isolated software checks were run using temporary databases: **7 passed, 0 failed**. Existing build artifacts and the saved validation report were inspected.

The directory had **no Git repository metadata**, so Git history, tracked changes and commit provenance could not be verified.

| Question | Evidence-based answer |
|---|---|
| What fully works in software? | Operator authentication, assigned-device authorization, CSRF, v1 simulation, SQLite persistence/history, simulated-only CSV, SSE, v2 validation and the token-protected HTTP receiver. These passed automated checks. |
| What awaits physical verification? | ESP32 Wi-Fi publishing, MPU6050 reads, microswitch inputs, serial ARM/DISARM, trigger latch, siren output/cutoff and offline event delivery. Source exists and previous compilation is documented; physical operation is unverified. |
| What is partial? | The dashboard as a real hardware monitor; provenance labels; telemetry agreement; real history access/export; provisioning verification; research/evidence workflow. |
| What is missing? | GPS/LTE drivers, energy/current/battery sensing, predictive models/datasets, remote commands, OTA, flash event persistence, cloud sync and the requested project-management modules. |
| What is simulated? | Main battery voltage/SOC, speed, coordinates, solar/wind power, energy chart, alert history, security controls and SMS screen. Default v2 diagnostics are also synthetic when explicitly started. |
| Shortest real DP1 demonstration? | Provision/upload the bench sketch; prove one physical heartbeat and sensor report; test both switches and local triggering with siren disconnected; prove durable dashboard events; then test rated siren hardware and offline/reconnect behavior. |

### Top five software/CPE blockers

1. **No physical integration evidence:** no upload, serial capture, physical heartbeat, switch, IMU or siren evidence.
2. **Bench configuration remains unprovisioned:** no `secrets.h`, device-token file or device telemetry database was found; wiring/siren/motion flags are disabled.
3. **Hardware assumptions remain unconfirmed:** module identity, switch contact polarity, MPU mounting/calibration and siren/MOSFET/supply ratings.
4. **Presentation can mislead:** the global banner says “No hardware connected” even in receiver mode; main cards remain simulated; some docs describe superseded architecture.
5. **Broader research functionality is absent:** real energy/battery measurements, experiment records and predictive analytics cannot support manuscript results yet.

### Status vocabulary

- ✅ **IMPLEMENTED AND SOFTWARE-TESTED**
- 🟡 **IMPLEMENTED BUT AWAITING PHYSICAL/HARDWARE VERIFICATION**
- 🟠 **PARTIALLY IMPLEMENTED**
- ⬜ **NOT IMPLEMENTED**
- ⏸ **DEFERRED / DP2**
- ❌ **REMOVED / NO LONGER PART OF CURRENT ARCHITECTURE**

A ✅ applies only to the stated software scope—not physical operation.

## 2. System Architecture

There are **two operating modes**, with separate telemetry paths.

### Default local mode

```text
Backend v1 simulator
  → v1 validator
  → data/telemetry.sqlite
  → authenticated /api/telemetry/stream
  → simulated dashboard cards/history

Opt-in backend v2 diagnostic simulator
  → v2 validator/state
  → memory only
  → authenticated /api/diagnostics/stream
  → Device diagnostics
```

`npm.cmd run dev:local` starts the backend and Vite. Default v2 diagnostics start stopped; their panel provides simulation controls.

### Opt-in hardware bench mode

```text
ESP32 bench firmware
  → Wi-Fi
  → HTTP POST with bearer token
  → private-LAN receiver /ingest
  → token check + v2 validation/order checks
  → atomic SQLite message/state commit
  → authenticated diagnostics SSE
  → Device diagnostics within /dashboard
```

Confirmed in [anti-tamper.ino](../firmware/anti-tamper/anti-tamper.ino), [device-receiver.mjs](../backend/device-receiver.mjs), [hardware-server.mjs](../backend/hardware-server.mjs), [diagnostics.mjs](../backend/diagnostics.mjs) and [DeviceDiagnostics.tsx](../src/app/components/DeviceDiagnostics.tsx).

**MQTT is not implemented.** Neither path uses a broker.

| Boundary | Current configuration |
|---|---|
| Frontend | `http://127.0.0.1:5173` |
| Operator API | `127.0.0.1:3001` |
| Hardware receiver | Selected private IPv4 address, port **3002** |
| Device ingestion | `POST http://<PC-private-IP>:3002/ingest` |
| Simulated SSE | `GET /api/telemetry/stream` |
| Diagnostics SSE | `GET /api/diagnostics/stream` |
| Simulated DB | `data/telemetry.sqlite` |
| Operator/session DB | `data/auth.sqlite` |
| Real v2 DB | `data/device-telemetry.sqlite` |
| Hardware launcher | `node backend/hardware-server.mjs`, with `SOLAIR_DEVICE_HOST` and provisioned token |
| Default launcher | Does **not** expose real ingress |

Hardware mode starts v1 simulation **paused**, preserving stored simulated readings. Its v2 simulation actions are rejected. The separate v1 simulator can still be resumed through its existing controls.

**Actual stored-data observation:** read-only inspection of the existing v1 database found **8,870 records, all `source=simulated`**, schema version 1. No real v2 database was present. This is a snapshot at inspection time, not a continuously updated count.

## 3. Current Status Table

| Capability | Status | Actual baseline |
|---|---|---|
| Local operator authentication/CSRF/device access | ✅ | Real login and server-side enforcement; automated coverage |
| Persistent v1 simulation/history/CSV | ✅ | Durable simulated records; CSV excludes device data |
| v2 validation/ordering/diagnostic simulation | ✅ | Automated software coverage; default simulation is memory-only |
| HTTP device receiver and durable v2 events | ✅ | Tested with software fixtures, not an ESP32 |
| ESP32 publishing and local anti-tamper | 🟡 | Implemented; previous compiles documented; no physical evidence |
| Real dashboard diagnostics | 🟠 | Transport/state tested; React/browser behavior and physical feed unverified |
| Main dashboard energy/map/security | 🟠 | Implemented demonstration UI, not real measurements/control |
| GPS/LTE/energy/battery hardware interfaces | ⬜ | No drivers or measurement implementations |
| Predictive battery analytics | ⬜ | Nullable field and collection proposal only |
| Remote hardware commands/OTA | ⬜ | No command or update implementation |
| Cloud/Supabase/shared sync | ⬜ | Local-only architecture |
| Project-management/research portal modules | ⬜ | No corresponding routes, components or backend tables |
| Public mock registration/pairing workflow | ❌ | Signup disabled; pairing route redirects |

## 4. Frontend Status

Primary evidence: [App.tsx](../src/app/App.tsx), [DashboardScreen.tsx](../src/app/components/DashboardScreen.tsx), [auth.tsx](../src/app/auth.tsx), [TelemetryHistory.tsx](../src/app/components/TelemetryHistory.tsx).

Actual routes: `/login`, `/dashboard`, `/map`, `/sms-alert`, with redirects for `/` and `/pairing`. Dashboard tabs: **Map, Energy, Security, Alerts**.

| Requested feature | Status | What exists; limitation; verification required |
|---|---|---|
| Overview/dashboard | 🟠 | Four-tab dashboard, simulated cards, history and diagnostics. No separate ecosystem overview. Browser layout/navigation checks pending. |
| IoT monitor | 🟠 | Diagnostics provides report ages, IMU, switches and reported security. No separate IoT-monitor page; physical feed pending. |
| Device diagnostics | 🟠 | SSE snapshots, faults, retained IMU, independent freshness, simulator controls and recent events. Backend/state tested; React interactions and ESP32 feed unverified. |
| Tasks & Gantt | ⬜ | No application implementation found. |
| Procurement | ⬜ | No implementation found. |
| Design freeze | ⬜ | No implementation found. |
| Controller gates | ⬜ | No implementation found. |
| Bench tests | ⬜ | Markdown procedures exist; no test-management screen/data model. |
| Mechanical | ⬜ | No implementation found. |
| Validation/interviews | ⬜ | No implementation found. |
| Evidence vault | ⬜ | Local evidence files exist; no vault, upload, indexing or evidence-linking feature. |
| Risks | ⬜ | No implementation found. |
| Vehicle access | 🟠 | Server-side ET-01 assignment authorization exists. No physical access control or vehicle-management workflow. |
| DP1 readiness | ⬜ | No readiness screen/calculation/checklist engine. |
| DP2 backlog | ⬜ | No backlog feature. |
| Manuscript tracking | ⬜ | No implementation found. |
| Change log | ⬜ | No application change-log feature. |
| Settings/backup | ⬜ | No settings/backup/import UI. Manual DB backup instructions only. |
| Authentication/login | ✅ | Real backend login/session integration; API flow tested. Visual/login browser testing pending. |
| Role handling | 🟠 | One assigned-device operator model. No roles, administrator hierarchy or role-based permissions. |
| Real-vs-simulated labels | 🟠 | Most cards/history labeled; diagnostics distinguishes receiver mode. Global banner contradicts hardware mode. |
| Mobile responsiveness | 🟠 | Mobile-oriented grids, scrolling, touch targets and responsive chart. No recorded viewport/browser validation. |
| Offline/PWA | ⬜ | No app manifest, service worker or offline cache found. SSE reconnection is not PWA support. |
| Data persistence | ✅ | Backend persistence/restoration tested. Local demo security and selected UI tab transient. |
| Error states | 🟠 | Auth/network, v1 storage/validation, history/export and SSE errors exist. Real ingress rejection/storage errors returned to publisher, not persisted as diagnostics errors. |
| Loading states | 🟠 | Session checking, login pending, history loading, SSE connecting and disabled actions exist; browser checks pending. |
| Empty states | 🟠 | No stored telemetry/events, WAITING and unavailable IMU exist; browser checks pending. |
| Device online/offline indicators | 🟠 | Heartbeat age separate from sensor age/browser SSE. Physical dropout/reconnect untested. |
| Real hardware status indicators | 🟠 | Firmware, IMU/switch faults, security and receipts shown. No proof of calibration, siren output feedback or actual device network state. |

For absent project-management modules, software implementation is missing; there is no physical verification step to perform.

Additional findings:

- Main cards use `useSimulatedTelemetry`; they do **not** consume real v2 energy/GPS.
- Starting fixtures appear before the first v1 sample, with a waiting/example explanation.
- Alert filter buttons have no filtering handlers.
- Real tamper events do not activate the demo intrusion modal or generate SMS.
- `SecurityScreen.tsx`, `EnergyMetricsScreen.tsx`, `AlertsScreen.tsx`, pairing and onboarding files are not routed by current `App.tsx`.
- `/sms-alert` is an example screen, not messaging functionality.

## 5. Backend/Data Status

Evidence: [server.mjs](../backend/server.mjs), [auth.mjs](../backend/auth.mjs), [telemetry-storage.mjs](../backend/telemetry-storage.mjs), [telemetry-csv.mjs](../backend/telemetry-csv.mjs), and receiver/diagnostics files cited above.

| Feature | Status | Actual behavior and limits |
|---|---|---|
| HTTP device ingestion | ✅ | Separate Express receiver; `POST /ingest`; strict JSON; 4 KB body limit |
| Device authentication/token | ✅ | Exact bearer token, timing-safe comparison, ET-01 validator binding. Browser Origin requests rejected. HTTP bench credential, not TLS/attestation. |
| Operator authentication | ✅ | Scrypt hashes, SQLite accounts/sessions, rotation, expiry, logout/reset revocation and throttling |
| CSRF | ✅ | Exact frontend Origin plus session token on state-changing operator APIs |
| Telemetry validation | ✅ | Separate v1/v2 validators; v2 rejects missing/unknown fields |
| Sequence/order validation | ✅ | v1 durable source/device/session maximum; v2 per-type sequence and nondecreasing uptime |
| Duplicate handling | ✅ | v1 rejects duplicates; v2 exact stored retry receives 202 without new receipt/count |
| Restart/session handling | ✅ | v1 new UUID/zero startup count; v2 active/retired boots and accepted state restored |
| Backend receipt timestamps | ✅ | Server UTC; restoration/retry/SSE does not refresh them |
| Sender timestamps | 🟠 | Validation/storage exists; current ESP32 sends null/unsynchronized |
| SQLite persistence | ✅ | WAL, FULL synchronous, transactions before state/SSE |
| Database schema | 🟠 | v1/auth schema guards; device DB lacks comparable explicit version/migration guard |
| Restart persistence | ✅ | Tested for v1 and real-mode v2 fixtures |
| SSE/live updates | ✅ | Snapshots, updates, keepalives, authorization rechecks and slow-client disconnect |
| Device diagnostics endpoints | ✅ | Latest, stream, events and simulation actions |
| Real event history | ✅ | Durable events; latest 20 snapshot/UI, latest 100 API; fixtures tested |
| Real telemetry history | 🟠 | All v2 messages stored; no general paginated real sensor-history endpoint/UI |
| Real CSV/export | ⬜ | No real v2 CSV/complete research export |
| Simulated export | ✅ | Snapshot batches, escaping/formula protection, row count and source filtering |
| Backup/import | 🟠 | Manual stopped-writer copying documented; no automated backup/import or verified restore workflow |
| Concurrency/conflicts | 🟠 | Transactions/uniqueness, 2-second timeout, export exclusion, stream caps; no safe multi-receiver coordination |
| Cloud/shared sync | ⬜ | No synchronization |
| Supabase | ⬜ | No integration |
| Migration | 🟠 | Initial schemas; no v1-to-v2 conversion; separate databases preserve v1 |
| Database tests | ✅ | Temporary DB rollback/order/restart/history/export/auth checks passed |

### Database structures

| Database | Tables/structure |
|---|---|
| `telemetry.sqlite` | STRICT `telemetry_samples`: ID, schema/source/device/session/sequence, sender/receipt times, validated JSON; unique identity tuple; source/ID index; `user_version=1` |
| `auth.sqlite` | STRICT `operators`, `sessions`, `settings`, `attempts`; device assignment/account revision; `user_version=1` |
| `device-telemetry.sqlite` | `device_messages`: receipt, JSON, boot/type/sequence and unique tuple; singleton `device_state` JSON |

Receiver scope is one device/one process. Cached state is not reloaded before each transaction; SQLite locking alone does not establish correct multi-process receiver behavior.

### Endpoint inventory

Operator routes use **3001**, normally proxied through frontend **5173**.

| Method | Endpoint |
|---|---|
| GET | `/api/health` — public minimal health |
| GET | `/api/auth/session` |
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| GET | `/api/telemetry/latest` |
| GET | `/api/telemetry/history?limit=10&snapshot=…&before=…` |
| GET | `/api/telemetry/export.csv` |
| GET | `/api/telemetry/stream` |
| POST | `/api/simulator/pause` |
| POST | `/api/simulator/resume` |
| GET | `/api/diagnostics/latest` |
| GET | `/api/diagnostics/events` |
| GET | `/api/diagnostics/stream` |
| POST | `/api/diagnostics/simulator/:action` |

Diagnostic actions: `start`, `stop`, `pause-heartbeat`, `resume-heartbeat`, `pause-sensor`, `resume-sensor`, `imu-valid`, `imu-unavailable`, `imu-fault`, `lid-open`, `lid-closed`, `mount-attached`, `mount-released`, `inject-event`.

Hardware ingress is separately **POST `/ingest`, port 3002**.

## 6. ESP32 Firmware Status

### A. Build environment

Evidence: [sketch.yaml](../firmware/anti-tamper/sketch.yaml), [build.ps1](../firmware/build.ps1), existing `build.options.json` and [hardware-software-validation.md](hardware-software-validation.md).

| Item | Baseline |
|---|---|
| Core | `esp32:esp32` **2.0.17**, pinned |
| CLI | Saved validation reports Arduino CLI **1.4.1** |
| Board | **ESP32 Dev Module**, classic ESP32 |
| FQBN | `esp32:esp32:esp32:FlashSize=4M,PartitionScheme=default,UploadSpeed=115200` |
| Flash | Configured **4 MB**; actual flash physically unconfirmed |
| Serial/upload | **115200** |
| Libraries | Arduino, Wire, WiFi, HTTPClient, esp_timer, esp_system |
| Normal build | `firmware/build/upload` |
| All-features build | `-VerifyAllFeatures`; `firmware/build/software-check-only`; wiring/siren/motion enabled by flags |
| Existing artifacts | BIN/ELF/MAP/generated source for both configurations |
| Current rebuild | **Not run**, as requested |

Previously recorded compilation results:

| Configuration | Program usage | Global RAM |
|---|---:|---:|
| Safe defaults | 780,821 / 1,310,720 bytes — **59.6%** | 46,228 / 327,680 — **14.1%** |
| All features | 794,757 / 1,310,720 bytes — **60.6%** | 46,280 / 327,680 — **14.1%** |

Saved compile results are not fresh reproduction or runtime heap/stack measurements. OTA partition slots do **not** implement OTA.

### B. GPIO map

Source: [config.h](../firmware/anti-tamper/config.h).

| GPIO | Assignment | Configuration |
|---:|---|---|
| 21 | MPU6050 SDA | I²C 100 kHz when wiring enabled |
| 22 | MPU6050 SCL | I²C 100 kHz |
| 25 | Lid switch | INPUT_PULLUP; LOW=CLOSED, HIGH=OPEN; 50 ms debounce |
| 26 | Mount switch | INPUT_PULLUP; LOW=ATTACHED, HIGH=DETACHED; 50 ms debounce |
| 27 | Siren MOSFET | Active-high output; initialized LOW; timed cutoff |

USB serial uses the core default interface. No GPS/LTE UART pins assigned. MPU address **0x68**; configuration permits 0x69.

Current flags: **`SOLAIR_WIRING=0`, `SOLAIR_SIREN=0`, `SOLAIR_MOTION=0`**.

### C. Feature matrix

**Every implemented firmware row below has previous compilation evidence, but no firmware runtime software test or physical test evidence.** Receiver fixtures do not execute the C++ detector.

`F` means exact source [firmware/anti-tamper/anti-tamper.ino](../firmware/anti-tamper/anti-tamper.ino); configuration is in `config.h`. Missing features have no implementation source; null serialization is identified where present.

| Feature | Status | Configuration/source | Limitation |
|---|---|---|---|
| Wi-Fi connection | 🟡 | F; credentials required | No provisioning header; untested connection |
| HTTP publishing | 🟡 | F, post/network task | Plain HTTP; 1 s connection/read timeouts; no physical delivery |
| Bearer token | 🟡 | F | 64-character token required; no TLS/attestation |
| Heartbeat | 🟡 | F | Boot sequence 0, approximately every 5 s afterward |
| Reconnect | 🟡 | F | Auto-reconnect plus 10 s explicit attempts; unmeasured |
| Sequence counters | 🟡 | F | Independent per type; RAM only |
| Boot/session ID | 🟡 | F | Random UUID per boot; no proof of boot chronology |
| Sensor telemetry | 🟡 | F | Approximately every 3 s; wiring disabled |
| Tamper publishing | 🟡 | F | First trigger queued; boot initialization required for delivery |
| MPU6050 | 🟡 | F; disabled | Identity/config/burst reads; ±2 g, ±250°/s, 21 Hz filter; uncalibrated |
| Lid microswitch | 🟡 | F; disabled | Polarity assumed; open wire indistinguishable from open switch |
| Mount microswitch | 🟡 | F; disabled | Same limitation |
| Local ARM | 🟡 | F; serial | Wiring, ≥10 s uptime, secure known switches and cleared latch required |
| Local DISARM | 🟡 | F; serial | Clears latch/motion and forces LOW |
| Trigger latch | 🟡 | F | First cause wins until DISARM; lost on reboot |
| Siren MOSFET | 🟡 | F; disabled | GPIO command only; no load feedback |
| Siren timeout | 🟡 | F | esp_timer plus loop cutoff, 5 s; physical deadline unmeasured |
| Motion heuristic | 🟡 | F; disabled | Acceleration deviation >4 m/s² OR gyro >1.5 rad/s for ≥200 ms; unvalidated |
| Offline queue | 🟡 | F | 16 RAM events plus pending event; overflow loses event |
| Offline retry | 🟡 | F | Events retained until 202; permanently rejected pending event can block later events |
| Flash persistence | ⬜ | No implementation | Unsent events/counters/latch lost on reset |
| Reset/reboot | 🟡 | F | DISARMED/LOW/new UUID/reset counters; actual boot output untested |
| Sender UTC synchronization | ⬜ | F emits null/false | No NTP/time sync |
| GPS | ⬜ | No driver | Coordinates/fix null |
| LTE/A7670E | ⬜ | No driver | No cellular transport |
| ADS1115 | ⬜ | No driver | No ADC sampling |
| ACS758 | ⬜ | No implementation | Neither channel exists |
| Battery voltage | ⬜ | F emits null | No sensing/conversion |
| Battery SOC | ⬜ | F emits null | No estimator/BMS input |
| Solar power | ⬜ | F emits null | No V/I/power calculation |
| Wind power | ⬜ | F emits null | No V/I/power calculation |
| Speed | ⬜ | F emits null | No source/parser |
| Brake status | ⬜ | F emits null | No feedback interface |
| Time-to-empty | ⬜ | F emits null | No inference |
| OTA | ⬜ | No implementation | Partition slots insufficient |
| Remote commands | ⬜ | No implementation | USB serial ARM/DISARM only |

MPU read/config failure sets `imuReady=false`; recovery requires reboot/reinitialization. No automatic recovery sequence exists.

## 7. Telemetry Contract

**Two contracts coexist. Neither is a signed hardware agreement.** Runtime code is authoritative; parts of Markdown proposals are outdated.

Evidence: [telemetryContract.ts](../src/app/data/telemetryContract.ts), [diagnosticsV2.ts](../src/app/data/diagnosticsV2.ts).

### v1: preserved simulated telemetry

Seventeen required fields:

`schemaVersion`, `source`, `deviceId`, `sessionId`, `sequence`, `sampledAtUtc`, `batteryVoltageV`, `batterySocPercent`, `timeToEmptySeconds`, `solarPowerW`, `windPowerW`, `latitudeDeg`, `longitudeDeg`, `gpsFixValid`, `securityState`, `speedKmh`, `electromagneticBrakeActive`.

- Version **1**, no message-type discriminator.
- Type permits simulated/device metadata; normal generator emits simulated.
- Nonblank device/session IDs; exact expected device ID.
- Nonnegative safe sequence; durable source/device/session ordering.
- Numeric measurements nullable; zero preserved.
- Nonnullable GPS boolean consistent with paired coordinates.
- Security DISARMED/ARMED/TRIGGERED.
- Unknown extra properties removed.
- Sender UTC nullable; receipt outside payload.

### v2: diagnostics and bench firmware

| Category | Implemented fields/rules |
|---|---|
| Version/types | Version 2; device_heartbeat, sensor_telemetry, tamper_event |
| Envelope | schemaVersion, messageType, source, deviceId, firmwareVersion, sessionId, sequence, sampledAtUtc, clockSynchronized, uptimeMs |
| Device | Exact ET-01 binding; ASCII ID validation |
| Firmware | Nonblank, max 128 characters; current SOLAIR-BENCH-1 |
| Boot | UUID; new boot heartbeat sequence 0; retired boot cannot update current state |
| Order | Independent per-type sequence increase/nondecreasing uptime |
| Time | UTC ISO iff synchronized, otherwise null; current ESP32 uses uptime/null UTC |
| Read timing | readStartUptimeMs, readEndUptimeMs; end equals envelope uptime |
| IMU | Nullable accelerationMps2/angularVelocityRadPerSec XYZ vectors |
| IMU metadata | imuStatus, imuFaultCode, axisFrame=MPU6050_CHIP, nullable calibrationRef |
| Switches | lidState UNKNOWN/CLOSED/OPEN; mountState UNKNOWN/ATTACHED/DETACHED; switchStatus/switchFaultCode |
| Security | DISARMED/ARMED/TRIGGERED or null |
| Other sensors | Nullable battery voltage/SOC, solar/wind power, lat/lon, fix, speed, brake |
| Prediction | timeToEmptySeconds must be null |
| Events | eventType, detectorVersion, nullable securityState/evidenceTelemetrySequence |
| Provenance | Source checked against ingress; token separate from metadata; tests use device-shaped fixtures |
| Strictness | Missing/unknown fields rejected; validated objects cloned |

Units: **V, %, seconds, W, decimal degrees, km/h, m/s², rad/s, uptime milliseconds**.

All event types:

1. `LID_OPEN_DETECTED`
2. `MOUNT_DETACH_DETECTED`
3. `MOTION_TAMPER_DETECTED`

IMU statuses: UNKNOWN, VALID, BLOCKED, INIT_ERROR, READ_ERROR.

Fault vocabulary includes UNCONFIRMED_WIRING; INVALID_CONFIGURATION; I2C_INIT_FAILED; SENSOR_ID_READ_FAILED; SENSOR_ID_MISMATCH; SENSOR_INIT_OR_CONFIG_FAILED; INIT_TASK_CREATE_FAILED; SENSOR_INIT_TIMEOUT_RESTART_REQUIRED; IDENTITY_OR_CONFIG_READ_FAILED; SENSOR_BURST_READ_FAILED. Switch faults include LID_INPUT_UNAVAILABLE, MOUNT_INPUT_UNAVAILABLE, BOTH_INPUTS_UNAVAILABLE. Several allowed codes are not emitted by this sketch.

### Always-null fields

| Producer | Fields |
|---|---|
| v1 simulator | timeToEmptySeconds, electromagneticBrakeActive |
| ESP32 | sampledAtUtc, calibrationRef, batteryVoltageV, batterySocPercent, timeToEmptySeconds, solarPowerW, windPowerW, latitudeDeg, longitudeDeg, gpsFixValid, speedKmh, electromagneticBrakeActive |
| ESP32 event | evidenceTelemetrySequence |
| v2 simulator | Unsupported energy/GPS/speed/brake/prediction, calibrationRef, sender UTC, securityState |

IMU vectors/faults are conditionally null. Offline messages receive a new receipt when accepted; **receipt freshness does not establish recent sampling/event occurrence** without sender UTC.

## 8. Physical Verification Status

Search covered repository source/docs, verification files, logs and artifacts. [Saved validation](hardware-software-validation.md) explicitly states no board upload or physical ESP32 tests occurred.

**NO PHYSICAL EVIDENCE FOUND.**

| Evidence | YES/NO |
|---|---|
| ESP32 firmware physically uploaded | NO |
| Serial Monitor captured | NO |
| Physical ESP32 heartbeat received | NO |
| Dashboard received physical ESP32 data | NO |
| MPU6050 readings observed | NO |
| Lid switch tested | NO |
| Mount switch tested | NO |
| Siren activated | NO |
| MOSFET tested | NO |
| Motion tamper tested | NO |
| Offline alarm tested | NO |
| Reconnect tested | NO |
| Reboot tested | NO |
| GPS tested | NO |
| LTE tested | NO |
| ADS1115 tested | NO |
| ACS758 tested | NO |
| Solar telemetry tested | NO |
| Wind telemetry tested | NO |
| Battery voltage measured through CPE | NO |
| Real BEMAC data received | NO |
| Real predictive battery output | NO |

Serial output in hardware-demo.md is explicitly expected example output, not captured evidence. `data/verification/report.json` covers 1,842 historical simulated fixture records, persistence/history/CSV, not physical or research results.

Scope is this workspace; undocumented tests elsewhere cannot be assessed.

## 9. Security/Anti-Tamper

| Capability | Status | Behavior |
|---|---|---|
| DISARMED | 🟡 | Startup; no local trigger |
| ARMED | 🟡 | Serial ARM after delay/secure switches |
| TRIGGERED | 🟡 | First trigger latches |
| Lid event | 🟡 | Debounced open while armed |
| Mount event | 🟡 | Debounced detach while armed |
| Motion event | 🟡 | Optional unvalidated heuristic, disabled |
| Latching/repeat suppression | 🟡 | Until DISARM/rearm |
| Reset/disarm | 🟡 | Clears output/latch; reboot disarmed |
| Siren behavior | 🟡 | Optional GPIO, disabled |
| Siren cutoff | 🟡 | Timer/loop after 5 s |
| Network-free operation | 🟡 | Separate detector/network tasks; physical timing untested |
| Dashboard | 🟠 | Real diagnostics; main security demo |
| Persistent events | ✅ | Atomic logging/restart fixture tests |
| Remote ARM/DISARM | ⬜ | No command channel |
| Remote acknowledgment | ⬜ | Demo buttons only |
| SMS fallback | ⬜ | Example screen |
| LTE alerting | ⬜ | No modem code |

Limits: TRIGGERED does not mean siren sounding; no output/current/acoustic feedback; state transitions are not separate events; no calibrated classifier/road-vibration rejection; overflow/reset can lose RAM events; HTTP bearer authorization is not production transport security or comprehensive replay protection.

## 10. GPS/LTE

### GPS

| Item | Status | Result |
|---|---|---|
| NEO-6M driver | ⬜ | Absent |
| UART assignment | ⬜ | Absent |
| NMEA parser | ⬜ | Absent |
| Fix validity | 🟠 | Contract only; firmware null |
| Latitude/longitude | 🟠 | Nullable fields; simulated coordinates |
| GPS speed | ⬜ | Absent |
| Map integration | 🟠 | Static image/sample location |
| Last-fix time | ⬜ | Absent |

### LTE/A7670E

All **⬜ NOT IMPLEMENTED**: driver, UART assignment, AT handling, SIM detection, registration, APN/data, cellular HTTP, LTE reconnect, SMS and fallback.

Wi-Fi reconnect is not LTE functionality. No physical GPS/LTE evidence.

## 11. Energy Monitoring

| Feature | Status | Baseline |
|---|---|---|
| ADS1115 | ⬜ | No driver/channels |
| ACS758 #1 | ⬜ | No sampling/calibration |
| ACS758 #2 | ⬜ | No sampling/calibration |
| Solar voltage/current sensing | ⬜ | No implementation |
| Solar power/Wh calculation | ⬜ | No real calculation/integration |
| Wind voltage/current sensing | ⬜ | No implementation |
| Wind power/Wh calculation | ⬜ | No real calculation/integration |
| Battery voltage sensing | ⬜ | No ADC/divider/BMS path |
| Battery SOC | ⬜ | No estimator/input |
| Charging current | ⬜ | No implementation/current field |
| Storage | 🟠 | Selected nullable power/battery fields; no real measurements |
| Dashboard cards | 🟠 | Fixture display |
| Provenance | 🟠 | Main values simulated; v2 unsupported fields unavailable |

Simulated dashboard values: starting battery **52.8 V** (varied), SOC **78%**, solar **340 W** (varied), wind **125 W** (varied), fixed sample harvested energy **2.33 kWh**, fixed chart Wh intervals, speed **24 km/h**. Time-to-empty/brake feedback unavailable, not measured zero.

Evidence: [demoTelemetry.ts](../src/app/data/demoTelemetry.ts), [telemetrySimulation.ts](../src/app/data/telemetrySimulation.ts), dashboard.

## 12. Predictive Analytics

| Item | Status | Evidence |
|---|---|---|
| Data schema | 🟠 | Nullable prediction; no experiment/label/feature schema |
| Session logging | 🟠 | Boot/backend sessions, not operating experiments/endpoints |
| Feature engineering | ⬜ | Absent |
| Training script/notebook | ⬜ | Absent |
| Baseline model | ⬜ | Absent |
| Regression model | ⬜ | Absent |
| Model metadata | ⬜ | Absent |
| Inference interface | ⬜ | Field is not inference API |
| Edge inference | ⬜ | Absent |
| Predicted remaining time | ⬜ | Always null |
| Dashboard widget | 🟠 | Unavailable text only |
| Insufficient-data state | 🟠 | Null presentation; no sufficiency algorithm |
| MAE/RMSE | ⬜ | Not calculated |
| Real training dataset | ⬜ | Absent |
| Real validation dataset | ⬜ | Absent |

Architecture only: [firmware handoff](telemetry-firmware-handoff.md) proposes experiment IDs/endpoints, interruption/censoring, targets and split rules. Scaffold: nullable field/unavailable text. Simulation: energy fixtures, no predictive model. Real implementation/validation: absent. Fixture logs are not a real training dataset.

## 13. Outdated/Conflicting Items

No corrections were made during the review.

| Location | Conflict | Reclassification |
|---|---|---|
| App.tsx | Unconditional “No hardware connected” | Mode-aware provenance; connection claim evidence-based |
| telemetry-contract.md v2 opening | No real ingress/durable v2 | HTTP/token/SQLite implemented; physical pending |
| Contract examples | Says no v2 validator | Validator software implemented/tested |
| MQTT proposal | Can be mistaken for architecture | Separate/defer from current HTTP path |
| No-backlog proposal | RAM offline events implemented | Document retry/latest-only samples/unknown transit age |
| Old-boot retention proposal | Code clears sensor/last-valid IMU | Align with implemented handling |
| firmware handoff opening | Device auth/ingress absent | Token receiver implemented; production security partial |
| field mapping | Switch code/pins not supplied | GPIO25/26 code exists; polarity/installation pending |
| README old milestones | No auth/ingress/event persistence | Clearly historical; current bench baseline prominent |
| diagnostics handoff | Memory-only description | Valid for default simulation, not hardware mode |
| launcher investigation | PWA called completed | Downgrade: no offline/PWA implementation |
| Alert fixtures | Filtering/battery-disconnect stories | Explicit examples; no algorithms demonstrated |
| Security/SMS copy | 120dB, active alarm, live GPS/public-like URL | Examples/unverified specs |
| Unrouted screens | Older “Active” claims | Unused legacy/demo; not current functionality |
| Forecasting checklist | Collection proposal | Partial architecture, not ML implementation |

Mark software complete: auth/CSRF, persistent v1 simulation, simulated CSV, v2 validator, token receiver, durable v2 events, SSE. Keep partial: real presentation, hardware agreement/calibration, real export/history, research schema.

Recommended DP2 deferral—not an existing approved decision: MQTT/cloud, remote commands, OTA, advanced ML. GPS/LTE/energy must be checked against the DP1 rubric before deferral.

## 14. Tests/Build Health

### Run during inspection

| Check | Result | Boundary |
|---|---|---|
| check-telemetry-simulation.mjs | ✅ PASS | Fixture/freshness/timers |
| check-telemetry-contract.mjs | ✅ PASS | v1 validator/order/recovery |
| check-telemetry-backend.mjs | ✅ PASS | HTTP/SSE/controls/restart |
| check-telemetry-storage.mjs | ✅ PASS | DB rollback/history/CSV |
| check-auth.mjs | ✅ PASS | Real fixture login/ACL/CSRF/revocation |
| check-diagnostics.mjs | ✅ PASS | v2 state/simulation/authenticated diagnostics |
| check-hardware-integration.mjs | ✅ PASS | Device-shaped HTTP fixtures/DB/SSE/restart |

**7 script suites passed, 0 failed.** No standardized individual-test count is produced. Storage failure text was expected fault injection, followed by PASS. Temporary databases only.

### Inspected, not rerun

| Check | Status | Evidence/limit |
|---|---|---|
| Formatter | ⬜ | No configured script/config found |
| Lint | ⬜ | No script/config found |
| Typecheck | ⬜ | No dedicated script/tsconfig; Vite is not typechecking |
| UI/unit runner | ⬜ | No React/browser suite; pure-function checks above exist |
| check-dev-local.mjs | ✅ Previous PASS | October 10 report; not rerun to avoid Vite artifacts |
| Production build | ✅ Previous PASS | Dist/report; no fresh build |
| Safe-default compile | ✅ Previous PASS | Artifacts/options/usage |
| All-features compile | ✅ Previous PASS | Flags/artifacts; not approved for upload |
| Provisioning | 🟠 | Parser previous PASS, actual execution absent |
| Browser interactions | 🟠 | Pending |
| Physical hardware | 🟡 | Pending |

Frontend JS artifact approximately **634 KB uncompressed**; saved build reports large-chunk advisory. Existing artifacts are not a fresh reproducible/content-addressed verification. Compilation proves neither detector correctness nor physical timing.

## 15. DP1 Readiness Percentages

Judgment estimates for a defensible local DP1 demonstration, not measured completion statistics; not averaged.

| Area | Estimate | Included / missing |
|---|---:|---|
| A. Architecture | 75% | Local API/receiver/storage separation; conflicting docs/UI and agreement pending |
| B. Backend/data | 85% | Tested auth/SQLite/SSE; real history/export/version guard/multi-writer limits |
| C. Firmware | 60% | Compiled bench code; runtime/physical/provisioning/recovery/spool missing |
| D. Physical integration | 0% | No evidence |
| E. Anti-tamper | 45% | FSM/switch/motion/siren code; detector/polarity/cutoff/load unverified |
| F. IoT monitoring | 60% | Receiver/diagnostics; physical/browser feed, labels/history incomplete |
| G. GPS | 5% | Fields/example UI only |
| H. LTE | 0% | No modem software |
| I. Energy | 10% | Storage/display fields; no ADC/V/I/W/Wh |
| J. Prediction | 5% | Proposal/null widget; no data/model/metrics |
| K. Evidence/testing | 45% | Passing software checks/prior artifacts; no physical/browser/research results |

Heartbeat → switch event → durable authenticated dashboard is closer than the complete GPS/LTE/energy/prediction ecosystem.

## 16. Updated Master Checklist

| Area | Checklist |
|---|---|
| 1. Foundation | ✅ Auth/CSRF/assignment/SQLite/validators/SSE. 🟠 Browser/provenance docs. |
| 2. ESP32 provisioning | 🟠 Script/parser; actual config absent. 🟡 Board/upload/boot capture. |
| 3. Heartbeat | ✅ Receiver/order/receipt. 🟡 Physical Wi-Fi/dashboard. |
| 4. MPU6050 | 🟡 Driver/config/conversion. ⬜ Calibration/transform/recovery. |
| 5. Microswitches | 🟡 GPIO/pullups/debounce. Physical polarity pending. |
| 6. Local anti-tamper | 🟡 ARM/DISARM/gates/latch/motion; physically unverified. |
| 7. Dashboard events | ✅ Transactions/API/SSE fixtures. 🟠 Browser/physical display. |
| 8. Siren | 🟡 Disabled output/cutoff. ⬜ Verified driver/load/acoustic evidence. |
| 9. Offline | 🟡 RAM queue/local detector. ⬜ Reset-surviving spool. |
| 10. GPS | ⬜ Driver/UART/NMEA/live map. 🟠 Fields. |
| 11. LTE | ⬜ Driver/network/APN/HTTP/SMS/fallback. |
| 12. Energy | ⬜ ADS1115/ACS758/real V/I/W/Wh. 🟠 Fixtures/fields. |
| 13. Battery | ⬜ Voltage/current/SOC/BEMAC. 🟠 Fields/display. |
| 14. Prediction | 🟠 Collection proposal. ⬜ Data/model/inference/evaluation. |
| 15. Remote commands | ⬜ Channel. ⏸ Recommended DP2 pending authorization/safety design. |
| 16. Evidence/export | ✅ Simulated CSV/checks. 🟠 Manual backup/files. ⬜ Real export/evidence workflow. |
| 17. Perfboard/final integration | ⬜ Substantiated assembly/strain relief/driver/power verification. |

Recommended DP2: cloud/MQTT, OTA, advanced ML until real collection exists; not a claim of formal deferral.

## 17. Immediate Next Actions

### A. Next five tests

1. **Provision/upload/boot:** verify board/port, provision privately, siren disconnected, correct sketch upload and observed serial capture.
2. **Physical heartbeat path:** HTTP202, firmware/boot ID, receipt, authenticated SSE and DB persistence, evidence identifying board.
3. **IMU/disarmed switches:** observe tilt/rotation and switch states/fault/null behavior; not calibration.
4. **Local detector with LED/meter:** ARM gates, lid/mount events, latch, suppression, DISARM and 5-second cutoff.
5. **Rated siren/offline/reboot:** after hardware approval, measure cutoff, trigger offline, reconnect, restart backend/reset ESP32, document losses/state.

### B. Next five implementations after tests

1. Correct provenance labels/consolidate current HTTP documentation.
2. Real v2 history/export preserving boot/uptime/receipt/provenance.
3. Publisher errors/storage health and tested IMU recovery.
4. One approved calibrated battery/energy path with faults.
5. Experiment/evidence records before predictive modeling.

### C. Do not work on yet

- Remote ARM/DISARM, brake commands/public access.
- MQTT/cloud migration distracting from HTTP proof.
- OTA.
- LTE/SMS fallback before core alarm/Wi-Fi proof.
- Motion siren before mounting/threshold evaluation.
- ML accuracy claims from fixture records.
- Unrelated portal screens before bench baseline.

If GPS/LTE/energy are mandatory DP1 requirements, schedule them explicitly after core proof rather than silently deferring.

### D. October 17 manuscript blockers

- No physical integration/experimental results.
- No calibrated energy/battery/forecasting dataset.
- No detector error-rate/cutoff measurements.
- Conflicting architecture documentation.
- No experiment/endpoints/evidence linkage.

The manuscript can report software implementation and fixture validation. It cannot currently claim physical detection success, real energy measurements, GPS/LTE operation or predictive accuracy.

### E. October 28 DP1 defense blockers

- Upload-to-dashboard demonstration unproven.
- Switch/MOSFET/siren wiring and safe reset/cutoff unverified.
- Offline/reconnect/reboot physically unverified.
- Browser mixes real receiver mode/simulated cards/contradictory labels.
- GPS/LTE/energy/prediction missing if required by rubric.

**Priority: record a physical heartbeat and one durable switch event, then prove safe local/offline alarm behavior.**

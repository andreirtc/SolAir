# SolAir telemetry contract

**Current implemented architecture (October 10 software hardening): ESP32 → bearer-authenticated HTTP POST → device receiver → validation → atomic SQLite commit → operator-authenticated SSE → dashboard. MQTT is future/optional only. Physical testing is unavailable and has not been performed. See [software hardening](software-hardening.md) for current clock, queue, export and freshness rules.**


**PROPOSED — awaiting firmware-team agreement.** No firmware approval, device connection, sensor capability, or experimental result is implied.

A contract is an agreed shape for each message: field names, units, and allowed values. TypeScript describes that shape for developers; the runtime validator checks actual unknown input before displaying it. The backend simulator uses this same proposed shape; the browser displays committed backend state. See the canonical [field mapping](telemetry-field-mapping.md), [firmware handoff and forecasting decisions](telemetry-firmware-handoff.md), and [SIMULATED review JSON](telemetry-review-simulated-v1.json).

## Version 1 fields

Version 1 below remains the implemented telemetry/storage contract. The [v2 review proposal](#version-2-message-agreement--review-only-2026-10-09) now has a separate validator and in-memory simulated diagnostics receiver/panel. This does not approve the agreement or enable physical publishers. Local operator authentication is implemented; device publisher authentication remains pending.

Every field below must be present on the message itself; inherited object properties do not count as supplied fields. Unavailable measurements use JSON `null`, never an omitted field, empty string, or invented zero. Zero is a valid measurement. Unknown extra fields are ignored and removed from accepted messages.

| Field | Type and meaning |
| --- | --- |
| schemaVersion | Exactly the number `1`; other versions rejected |
| source | `simulated` or `device`; metadata only, **not proof of authenticity** |
| deviceId | Nonblank string; must match the receiver's expected device, currently `ET-01` |
| sessionId | Nonblank identifier; current simulator uses a backend-startup UUID. Unique boot/reset identity for firmware is proposed, awaiting agreement; this is not an operating experiment ID |
| sequence | Nonnegative safe integer, strictly increasing per session ID; gaps allowed |
| sampledAtUtc | UTC ISO timestamp `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DDTHH:mm:ss.sssZ`; null if sender clock unavailable |
| batteryVoltageV | Finite number >= 0 in volts, or null |
| batterySocPercent | Finite number from 0 through 100, or null |
| timeToEmptySeconds | Device-reported finite number >= 0 in seconds, or null; no frontend forecast algorithm |
| solarPowerW, windPowerW | Finite numbers >= 0 in watts, or null |
| latitudeDeg | Finite decimal degrees from -90 through 90, or null |
| longitudeDeg | Finite decimal degrees from -180 through 180, or null |
| gpsFixValid | Boolean; true requires both coordinates, false requires both null. No cached invalid-fix coordinates in v1 |
| securityState | `DISARMED`, `ARMED`, or `TRIGGERED`; reported state, not a command |
| speedKmh | Finite number >= 0 in km/h, or null; proposed to preserve existing UI, hardware availability unconfirmed |
| electromagneticBrakeActive | Boolean or null; proposed to preserve existing UI, hardware availability unconfirmed |

Null is not valid for required identifiers, version, sequence, source, fix validity, or security state. Invalid types, NaN/Infinity, impossible dates, non-UTC timestamps, partial coordinate pairs, and inconsistent fix status are rejected. Timestamp validation checks format/calendar validity, not synchronization accuracy or whether a sender is trusted.

## Ordering and server receipt

The backend assigns receipt time locally for acceptance and exposes it only after the SQLite transaction commits; receipt is not a sender field. Freshness uses the last accepted server receipt, not sampledAtUtc or SSE arrival. Sender UTC and server receipt are displayed separately. A null sender clock still allows valid measurements.

Storage remembers the highest committed sequence per (source, deviceId, sessionId) across restarts. Equal/lower numbers are rejected; gaps are allowed. An unseen session starts a new sequence stream (zero allowed). Revisiting an old session uses its durable maximum; no cross-session chronology or timestamp ordering is inferred. Firmware uniqueness and delayed-old-boot policy remain pending.

Rejected messages preserve accepted readings, count, ordering and receipt; the next valid acceptance clears the validation error. Failed writes preserve accepted state and report a separate storage error, with no memory fallback. The browser validates the backend snapshot but does not own generation, durable ordering or receipt time. Only simulated samples are currently displayed; accepting a device-shaped message in the reusable validator does not enable hardware transport or authenticate it.

## Complete simulated JSON review sample

Use the single [SIMULATED review JSON](telemetry-review-simulated-v1.json). Its [mapping provenance and validation result](telemetry-field-mapping.md#missing-fields-and-evidence) identify the existing captured software record. It is not a hardware measurement or forecasting label. Example coordinates give a simulated valid fix; GPS remains simulated and MQTT offline.

## Dashboard/session behavior

The existing cards receive an explicit adapter from the accepted contract. Speed and brake status remain supported; human-readable location text and offline connection labels remain browser fixtures, not sender measurements. Reported security appears separately from the existing local demo controls, so samples do not undo button interactions. Time-to-Empty displays Unavailable because the simulator always sends null. No energy totals or savings are added to the contract; existing chart totals and alert/map histories remain fixed labeled examples.

The provisional software timings remain 3 seconds per generated sample, STALE at accepted receipt age 10 seconds, and DISCONNECTED at 30 seconds. These are UI demonstrations, not firmware requirements or MQTT status. Backend Pause cancels generation; the browser display clock continues aging the receipt. Resume retains accepted data and samples after about 3 seconds. Controls are shared between local viewers. Unmount closes that browser's SSE/display timer; backend generation and storage continue. Tabs, navigation, map expansion, refresh and reconnect retain backend state. There is no browser generation fallback.

## Persistent local backend lifecycle

SQLite restores the latest accepted message, original receipt and lifetime stored count across backend restarts. Restart gives the simulator a new UUID and resets the current-startup accepted count, transient controls and errors; paused startup is available. Heartbeats, restoration and SSE deliveries never renew receipt freshness. Durable ordering and history remain available; historical records lost before SQLite was implemented cannot be recreated. See [README](../README.md) for startup, safe backup, history/export and manual verification.

## Firmware handoff and verification

The [handoff checklist](telemetry-firmware-handoff.md) separates software decisions, hardware/firmware inputs and unresolved forecasting collection rules. The [canonical mapping](telemetry-field-mapping.md) documents every existing field, unavailable sensor/interface/calibration details and pending approval. Firmware version, device network state, faults and experiment labels remain absent. Schema task remains PARTIAL.

Existing implementation checks are simulation, contract, backend, storage and launcher scripts plus the production build; see README. Documentation-only handoff validation checks the saved JSON using the existing validator and reviews mapping against code; it does not require a production build or new browser checks. Historical browser-reset examples in focused helper tests do not describe the persistent backend lifecycle.

## Version 2 message agreement — REVIEW ONLY, 2026-10-09

**PROPOSED; awaiting firmware/backend/research review.** diagnosticsV2.ts implements validation; the default simulator remains in-memory. The opt-in device-receiver.mjs path binds a bearer token to ET-01 and commits real v2 messages/state to separate SQLite before authenticated SSE. Device storage survives backend restart. v1 behavior remains unchanged. The future MQTT proposal below is not the implemented transport; current HTTP event-delivery rules are in software-hardening.md. Component meanings live in the [canonical mapping](telemetry-field-mapping.md); owners and open answers live in the [handoff decision table](telemetry-firmware-handoff.md#message-agreement-review--2026-10-09).

### Common envelope and receipt

Every message is a JSON object with all envelope fields as own properties. Required per-type fields are listed below; omitted fields are invalid even when nullable. Recommend rejecting unknown keys in v2 to expose serialization mistakes (v1 strips them). Reject malformed JSON, unsupported version/type, wrong identity/topic, invalid enums, nonfinite numbers, inconsistent validity, impossible/non-UTC dates and unsafe integers. No partial acceptance. Rejection changes only an error diagnostic, never readings, accepted count, durable ordering, boot selection or receipt. A subsequent valid message clears that type's validation error. Storage failure is separate and must roll back all acceptance changes.

| Field | Proposed rule for all three types |
| --- | --- |
| `schemaVersion` | Number `2`; unrelated to SQLite schema version |
| `messageType` | `device_heartbeat`, `sensor_telemetry`, or `tamper_event` |
| `source` | `device` for future authenticated physical publishers; `simulated` for isolated simulation/review. It is an assertion, never authentication |
| `deviceId` | Provisioned exact ID, ASCII letters/digits/hyphen/underscore, 1–64 characters, matching the configured HTTP credential/device binding; future MQTT topic IDs would use the same restricted characters |
| `firmwareVersion` | Nonblank build/revision identifier, at most 128 characters; no claim that the diagnostic sketches currently emit it |
| `sessionId` | Fresh UUID per boot or counter-reset lifecycle, retained on network reconnect. Firmware generation/entropy method must be agreed; never use uptime or firmware version as boot ID |
| `sequence` | Nonnegative safe integer (0 through 9007199254740991), independently increasing per message type within boot; first 0, gaps allowed; retry keeps original payload/identity/sequence |
| `sampledAtUtc` | Preserve v1 name and UTC calendar/format rules. Heartbeat creation time, telemetry read-window end, or event detection time respectively. Null before clock synchronization or after sync is lost; never fake epoch or substitute receipt |
| `clockSynchronized` | Required boolean; false requires null UTC, true requires valid UTC. Accuracy/time-source policy pending; format does not prove accuracy |
| `uptimeMs` | Required nonnegative safe integer, monotonic boot-relative creation/detection time. Telemetry equals `readEndUptimeMs`; heartbeat/event is their creation/detection time. No counter wrap within a session |

`receivedAtUtc` is **not a payload field**. Backend independently assigns UTC receipt at arrival, after trust/schema/order checks, and exposes it only after atomic commit. Store payload UTC and original receipt separately; restoration/SSE/reconnect cannot renew either. Also record server-owned transport provenance (bound device identity, trusted topic, retained flag, live/replay eligibility), never inferred from `source`. No device secrets belong in messages or telemetry logs. Local operator login/assigned-device access authenticates viewers, not publishers.

### Required type-specific fields

**device_heartbeat:** common envelope only. It reports communication/liveness, with no measurements, fault vectors or security commands. A valid eligible heartbeat updates only `lastHeartbeatReceivedAt`; never sensor receipt, sensor count, last valid readings or sensor freshness. Sensor failure may coexist with live heartbeats. MQTT PING/keepalive is a transport mechanism, not this application heartbeat.

**sensor_telemetry:** envelope plus every field below. This is a snapshot of the current read attempt, not a replay of last good values. Valid receipt of an unavailable/fault snapshot records current availability; it must not make the last valid measurement fresh.

| Fields | Proposed constraints |
| --- | --- |
| `readStartUptimeMs`, `readEndUptimeMs` | Safe nonnegative integers; start <= end = uptimeMs. Checked read attempt window, not exact internal acquisition timestamp; switch observations belong to same reporting window |
| `accelerationMps2`, `angularVelocityRadPerSec` | Each either whole-vector null or object containing exactly finite signed x/y/z numbers. Units m/s² and rad/s; acceleration includes gravity in chip axes; no vehicle-frame or attitude claim |
| `imuStatus`, `imuFaultCode` | Status `UNKNOWN`, `VALID`, `BLOCKED`, `INIT_ERROR`, `READ_ERROR`; code null for UNKNOWN/VALID, otherwise one of the codes in mapping. VALID requires both vectors; all other statuses require both null |
| `axisFrame`, `calibrationRef` | axisFrame exactly `MPU6050_CHIP`; calibrationRef null until evidence exists, else nonblank reference. VALID means checked read/configuration, not calibrated accuracy |
| `lidState`, `mountState` | Lid `UNKNOWN`, `CLOSED`, `OPEN`; mount `UNKNOWN`, `ATTACHED`, `DETACHED`. Logical meanings require agreed wiring/polarity; not raw GPIO levels |
| `switchStatus`, `switchFaultCode` | Status `UNKNOWN`, `VALID`, `FAULT`; UNKNOWN requires both states UNKNOWN and null code; VALID requires both known and null code; FAULT requires nonblank code from mapping and permits independently known/unknown states |
| `securityState` | `DISARMED`, `ARMED`, `TRIGGERED`, or null if firmware state not initialized/implemented; reported only, distinct from switches/events and browser demo controls |
| Existing energy/location/speed/brake fields | Require `batteryVoltageV`, `batterySocPercent`, `timeToEmptySeconds`, `solarPowerW`, `windPowerW`, `latitudeDeg`, `longitudeDeg`, `gpsFixValid`, `speedKmh`, `electromagneticBrakeActive`. Preserve v1 units/ranges; unavailable fields null. Extend gpsFixValid to null only with both coordinates null; false also requires both null; true requires both valid coordinates. Time-to-Empty stays null in this proposed hardware milestone |

No physical battery/power/GPS/SOC/speed/brake source is established here. Send null rather than copy simulator fixtures. A future source/calibration agreement is required before populating these fields.

**tamper_event:** envelope plus `eventType` (`LID_OPEN_DETECTED`, `MOUNT_DETACH_DETECTED`, `MOTION_TAMPER_DETECTED`), nonblank `detectorVersion` (rule/config revision), `securityState` (same nullable enum), and nullable `evidenceTelemetrySequence` (safe nonnegative integer identifying sensor_telemetry in the same boot). Referenced evidence may arrive later; do not invent evidence or reject solely because cross-topic evidence has not arrived. Event identity is device/session/type/sequence; no additional event ID is needed. UTC/uptime refer to detection even on retry. A firmware classifier emits events only after its initialization, debounce/threshold and state policy is agreed. Event type is a firmware report, not proof of actual tampering or detection accuracy. Raw switch changes/motion are measurements; browser must not create events or set TRIGGERED from them. An event does not automatically change securityState or refresh sensor age. Commands/acknowledgements are outside this proposal.

### Current HTTP ordering, reboot and delayed delivery

Live heartbeat/sensor ordering is per device/session/messageType. A sequence-zero heartbeat activates a new boot; previous live boots remain retired. Nonincreasing sequences or decreasing uptime are rejected. Original accepted receipts/count/order are restored after backend restart. New boot activation clears prior sensor/IMU availability rather than substituting examples. Clock-synchronized live reports use the provisional ±5-second sender-clock budget.

Exact validated retries are looked up in durable storage before live ordering/time checks, so lost acknowledgements remain retryable even after restart or boot retirement. Equivalent JSON key ordering is accepted; same identity with changed fields is rejected. Duplicate delivery never changes count or live receipts.

Important tamper events use a separate historical-delivery policy: original boot/sequence/payload identity is deduplicated in SQLite, old or unseen boots and out-of-delivery-order event sequences may be accepted, old sender UTC is permitted, and future UTC more than 5 seconds ahead is rejected. Events never activate a live boot or refresh device/sensor receipts. See [software-hardening.md](software-hardening.md) for the firmware NVS spool, provenance/export and remaining replay/clock limits. No automatic backfill occurs; only token-bound submitted events are recorded.

### Future/optional MQTT transport proposal — not implemented

**Future/optional MQTT proposal; not current HTTP behavior.** Recommend live-only publishers, no offline application backlog, no broker queued replay (MQTT 5 Clean Start and Session Expiry 0 for the proposed receiver session), RETAIN=false and rejection of deliveries flagged retained. Configure receiver Retain As Published to preserve the flag; permissions alone do not prevent retained publishing. QoS retransmissions still require deduplication. With synchronized UTC, reject as live if sender age exceeds proposed 5 seconds or is more than proposed 5 seconds in the future; tolerance awaits clock/network evidence. Without UTC, uptime orders but cannot prove transit delay: accept only in an authenticated active live connection under the no-backlog policy, label transit age unknown. Retain/replay flags and DUP alone cannot prove that a message is fresh or unreplayed; captured higher-sequence payloads require trust/session controls. Do not claim end-to-end replay protection from this proposal. Any later historical ingestion must use a separate reviewed path and must not refresh live ages.

### Network and separate statuses

**Future/optional, not implemented:** propose MQTT **5.0**, subject to firmware client capability review, QoS 1 for all three topics, no retained publishes. QoS 1 can duplicate; application deduplication remains necessary. Use `solair/v2/devices/{deviceId}/heartbeat`, `/telemetry`, `/events` with exact matching messageType. Protocol behavior follows [OASIS MQTT 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html), sections 3.1.2 (session/keepalive), 3.3 (retain/expiry), 3.8.3.1 (subscription retain options), 4.3 (QoS) and 4.6 (ordering). Application ordering/delay policy above is our proposal, not an MQTT guarantee.

Recommend unique device credentials over TLS, anonymous access disabled, server certificate verification, and write permission only to that device's three exact topics; no wildcard publish, subscriptions, command or other-device access. Backend service gets read-only access to the explicitly provisioned device topics, no device publish permission; browsers use existing operator-authenticated HTTP/SSE, never broker credentials. Provisioning binds credential principal to device ID; backend verifies topic ID = configured bound identity = payload ID and source=device. MQTT subscribers do not automatically receive a publisher's authenticated principal: provenance depends on broker ACL enforcement and a trusted topic namespace, or a trusted broker ingress adapter supplying principal metadata. Client ID/source labels alone are not authentication. Provisioning, rotation/revocation and duplicate-client behavior need agreement before implementation. [Official Mosquitto authorization documentation](https://mosquitto.org/man/mosquitto-conf-5.html) describes username-based topic ACLs and certificate identity options; it is a reference, not a selected/deployed broker configuration.

All intervals are proposals requiring team agreement: heartbeat every 5 s; sensor reporting every 3 s (independent of the diagnostic's 500 ms print interval); events after agreed detection/debounce, retries retain identity. Device liveness WAITING before eligible heartbeat, live under 15 s receipt age, stale at 15 s, absent at 30 s. Sensor measurements WAITING before valid read, fresh under 10 s, STALE at 10 s and outdated at 30 s. Preserve current v1 UI timings unchanged; future labels must not imply MQTT disconnection from sensor age. No classifier/research threshold is set here.

Future MQTT proposal only: keep four independent indicators: (1) device heartbeat age, (2) backend-to-broker connection, (3) browser SSE connection, (4) last valid sensor measurement age/availability. Maintain per-component last-valid receipt where needed: a switch-only observation or invalid IMU report cannot renew IMU freshness; heartbeat/events never renew any measurement. Keep fault status visible with the last valid values explicitly outdated. In this optional future broker design, SSE could be connected while the broker is offline or a device is absent. A broker connection can be healthy with no device messages. No broker or broker credentials are implemented; current device ingestion uses the separate token-bound HTTP receiver.

### Synthetic JSON review fixtures — not hardware evidence

Each block is standalone proposed sender JSON. These invented values illustrate serialization only, not observed physical motion, wiring, calibration or classifier success. source=simulated is deliberate. They must remain outside working databases and the device MQTT namespace; current firmware uses source=device on its token-bound HTTP path. A v2 validator is implemented; these documentation examples are invented fixtures, not physical measurements. Server receipt/provenance would be assigned outside these payloads.

Heartbeat before synchronization:

```json
{
  "schemaVersion": 2,
  "messageType": "device_heartbeat",
  "source": "simulated",
  "deviceId": "ET-01",
  "firmwareVersion": "REVIEW-FIXTURE-NOT-FLASHED",
  "sessionId": "11111111-1111-4111-8111-111111111111",
  "sequence": 0,
  "sampledAtUtc": null,
  "clockSynchronized": false,
  "uptimeMs": 1000
}
```

Telemetry illustrating a checked but uncalibrated SI read and uninitialized switches:

```json
{
  "schemaVersion": 2,
  "messageType": "sensor_telemetry",
  "source": "simulated",
  "deviceId": "ET-01",
  "firmwareVersion": "REVIEW-FIXTURE-NOT-FLASHED",
  "sessionId": "11111111-1111-4111-8111-111111111111",
  "sequence": 0,
  "sampledAtUtc": null,
  "clockSynchronized": false,
  "uptimeMs": 3002,
  "readStartUptimeMs": 3000,
  "readEndUptimeMs": 3002,
  "accelerationMps2": {"x": 0.12, "y": -0.08, "z": 9.79},
  "angularVelocityRadPerSec": {"x": 0.01, "y": -0.02, "z": 0.0},
  "imuStatus": "VALID",
  "imuFaultCode": null,
  "axisFrame": "MPU6050_CHIP",
  "calibrationRef": null,
  "lidState": "UNKNOWN",
  "mountState": "UNKNOWN",
  "switchStatus": "UNKNOWN",
  "switchFaultCode": null,
  "securityState": null,
  "batteryVoltageV": null,
  "batterySocPercent": null,
  "timeToEmptySeconds": null,
  "solarPowerW": null,
  "windPowerW": null,
  "latitudeDeg": null,
  "longitudeDeg": null,
  "gpsFixValid": null,
  "speedKmh": null,
  "electromagneticBrakeActive": null
}
```

Independent hypothetical event after clock synchronization; no event detector currently exists and no supporting telemetry is claimed:

```json
{
  "schemaVersion": 2,
  "messageType": "tamper_event",
  "source": "simulated",
  "deviceId": "ET-01",
  "firmwareVersion": "REVIEW-FIXTURE-NOT-FLASHED",
  "sessionId": "11111111-1111-4111-8111-111111111111",
  "sequence": 0,
  "sampledAtUtc": "2026-10-09T00:00:05.000Z",
  "clockSynchronized": true,
  "uptimeMs": 5000,
  "eventType": "LID_OPEN_DETECTED",
  "detectorVersion": "REVIEW-ONLY-NO-IMPLEMENTED-DETECTOR",
  "securityState": "ARMED",
  "evidenceTelemetrySequence": null
}
```

ARMED alongside an event deliberately demonstrates that detection type is not a TRIGGERED state transition. It does not approve such a state policy.

### Exact v1 compatibility and future implementation work

- Envelope: version 2 and messageType discrimination, firmwareVersion, clockSynchronized and uptimeMs are new. Existing identifiers/source/UTC names are reused, but sequence becomes per-type rather than one stream per source/device/session. New active/retired boot and delay policies replace v1's acceptance of any unseen session. v1 validator rejects these fixtures; adding motion keys to v1 would strip them.
- Heartbeat/event: new shapes omit v1 measurement requirements by design. Event-specific fields are new. Heartbeat cannot be passed to the current telemetry save/restore path.
- Sensor: read-window, vector, validity/fault, axis/calibration and switch fields are new. gpsFixValid/securityState now permit null; other v1 names/units/ranges and zero/false semantics remain. Time-to-Empty still null. Proposed unknown-key rejection differs from v1 stripping.
- Validator/reducer: implemented separately for v2, preserving v1. Physical agreement/replay threat review remain pending; current HTTP device acceptance is software-tested.
- Storage: separately version/migrate database without rewriting v1 history; add message type and uniqueness/order key including type, durable boot retirement, provenance and independent heartbeat/event/sensor counts and receipts. Restore latest sensor per component, not latest arbitrary message. Commit ordering/boot/record atomically before state/SSE; never reuse this proposal's examples as backfill.
- Backend/frontend: HTTP ingestion, authenticated diagnostics/SSE, real history and separate v2 export are implemented. Future/optional MQTT lifecycle, operator-device-scoped snapshots/history, separate liveness/broker/SSE/freshness UI, null security/fix display, IMU/switch/fault views and distinct firmware event history. Existing demo controls and fixed example histories stay clearly labeled. Review export columns/version handling while preserving simulated-only CSV and excluding real device records. Authentication database/session behavior needs no change for this proposal.

The initial documentation-only review checked JSON syntax/completeness, links and consistency without rerunning application tests. The subsequent default diagnostics simulation milestone implements a separate v2 validator/receiver, authenticated backend fixtures and visible panel; see [diagnostics checks and browser handoff](device-diagnostics.md). Its application checks/build were run; firmware compilation/physical tests are outside that simulation milestone. Schema remains PARTIAL and hardware agreement remains open.

## October 9 real bench implementation scope

The authorized [hardware-demo.md](hardware-demo.md) path now implements device-source v2 messages, token-bound Wi-Fi HTTP ingestion, atomic separate SQLite logging and authenticated SSE display. Existing v2 field/discriminator rules are retained; agreement and physical validation remain pending. The October 10 firmware keeps sender UTC null until valid SNTP synchronization and preserves original event UTC/boot uptime across durable retries; backend receipt UTC remains separate. Historical events do not refresh live liveness. MQTT and remote commands remain outside this bench milestone.

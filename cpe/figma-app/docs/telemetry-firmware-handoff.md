# Firmware handoff and collection decisions — 2026-10-08

**Current implemented architecture (October 10 software hardening): ESP32 → bearer-authenticated HTTP POST → device receiver → validation → atomic SQLite commit → operator-authenticated SSE → dashboard. MQTT is future/optional only. Physical testing is unavailable and has not been performed. See [software hardening](software-hardening.md) for current clock, queue, export and freshness rules.**


**Fill-in checklist; agreement pending. Schema task remains PARTIAL.** Use the canonical [field mapping](telemetry-field-mapping.md), [contract and v2 review proposal](telemetry-contract.md) and [SIMULATED v1 review JSON](telemetry-review-simulated-v1.json). Blank answers mean Not supplied, not approval. Current scope includes local operator login, assigned-device authorization, server-side sessions/CSRF, simulation, SQLite and SSE. Token-bound HTTP device ingestion is implemented; MQTT is future/optional and dashboard hardware commands remain unimplemented. Operator authorization to view ET-01 does not authenticate an ET-01 publisher.

For each answer provide responder, date, decision, specification/test/calibration reference and approval reference. Do not record credentials. No approval evidence has been supplied.

## Message agreement review — 2026-10-09

This revision prepares an agreement; it is not team approval or physical integration. The canonical contract below proposes v2 heartbeat, sensor telemetry and firmware-reported tamper events; the mapping owns component details. Existing v1 implementation and its captured simulated fixture are preserved. Earlier fill-in questions remain open, with v2 recommendations now available for review.

Inspected both firmware projects in `C:/Users/Anyang/SolAir/firmware`: `serial-test/serial-test.ino`, `mpu6050-diagnostic/mpu6050-diagnostic.ino`, `diagnostic-config.h`, README and MPU6050-HANDOFF.md. Serial-test prints diagnostic counter/uptime only. MPU6050 diagnostic prints successful-read ordinals, read windows and uncalibrated SI vectors or errors. Wiring confirmation is false, pins/address unset; no microswitch code, JSON publisher, boot identity, synchronized clock or networking exists in either sketch. Compile success is previously recorded; upload, physical readings and networking remain unverified. No firmware file is changed by this review.

| Decision | Recommended proposal and reason | Owner | Confirmed versus awaiting agreement |
| --- | --- | --- | --- |
| Existing baseline | Preserve v1 null/zero semantics, separate sender/receipt times, rejection retention and atomic commit-before-SSE | Software | Confirmed implementation; hardware agreement pending |
| Authentication boundary | Preserve operator sessions/CSRF; separately provision device credentials and exact publish ACLs | Software + firmware | Operator implementation confirmed; device authentication pending |
| Message family | Payload v2 with three discriminated types; heartbeat cannot update sensor age | Software + firmware | Awaiting agreement |
| Identity/order | Provision device ID, firmware revision, unique boot UUID; independent increasing counters per type to tolerate inter-topic arrival order | Firmware + software | Awaiting agreement; UUID entropy/provisioning method pending |
| Boot activation/replay | Live heartbeat sequence 0 activates new boot; retired boots cannot become current; reconnect uses current boot and fresh messages | Firmware + software | Awaiting agreement; deployment replay protection needs review |
| Clock/delivery | UTC null before sync; monotonic uptime; no offline backlog for live state; delay budget 5 s | Firmware + software | Awaiting agreement; clock accuracy and latency evidence pending |
| Reporting/liveness | Heartbeat 5 s; telemetry 3 s; heartbeat stale 15 s/absent 30 s; sensor stale 10 s/outdated 30 s | Firmware + software | Proposals only, not research thresholds |
| MPU6050 | SI chip-axis vectors with explicit validity/faults and transfer windows; no inferred vehicle orientation | Firmware; shared research for calibration | Diagnostic conversion exists; physical validity, mounting/calibration pending |
| Lid/mount | Separate logical states, UNKNOWN until initialized; agree polarity and debounce before classification | Firmware; shared research for detection policy | Wiring, polarity, debounce and evidence pending |
| Detection vs state | Firmware event type and detector revision separate from reported securityState; browser never classifies raw motion/switch changes | Firmware + software; shared research validates detection | Classifier/state machine/thresholds pending |
| MQTT | Review MQTT 5/QoS 1/non-retained/live-only delivery and per-device publish ACLs | Software + firmware | Future/optional broker proposal only; current device transport is token-bound HTTP |
| Forecast/evidence | Keep unsupported energy/GPS/speed/prediction null; preserve separate research experiment/endpoint decisions below | Shared research + firmware; software records | Awaiting sources and collection agreement |

Historical recommendation (superseded by implemented v2 HTTP/storage/diagnostics): implement a separate pure v2 validator and in-memory receiver reducer with synthetic fixtures and focused tests for per-type ordering, boot transitions, invalid/duplicate retention, fault/null consistency and heartbeat-versus-sensor age. Keep v1, working databases, UI and firmware unchanged; no MQTT connection. Durable v2 storage/migration, transport and frontend adaptation follow as separate authorized milestones. Do not treat this document as authorization to implement them.

## CPE/firmware lead inputs

- [ ] For each measurement in the mapping, supply available/unavailable status, physical source or calculation, sensor model, pin/interface, measurement point, units/range/precision, invalid conditions and calibration/verification reference: ____ . Explicitly confirm voltage, SOC, solar/wind power, location/fix, speed and brake feedback; do not infer any from UI fixtures. Time-to-Empty stays null unless separately agreed: ____ .
- [ ] Device identity provisioning/uniqueness and firmware version format/reporting: ____ . Firmware version is absent from v1.
- [ ] Boot/session ID generation, reboot and sequence-reset rules, counter width/wrap, retry duplicates, allowed gaps and delayed old-boot messages: ____ . Existing backend uses a fresh UUID per startup and durable increasing sequences per source/device/session; no cross-session chronology is imposed.
- [ ] Sender clock source/synchronization, accuracy, sampling timestamp definition, time jumps and recovery: ____ . v1 allows `sampledAtUtc=null` when unavailable; do not substitute receipt time as sender time.
- [ ] Sustainable update frequency, batching/delay behavior and justified freshness policy: ____ . Current **3-second generation, 10-second STALE and 30-second DISCONNECTED are provisional software timings**, not firmware/MQTT requirements.
- [ ] Device-reported network state and device fault codes: proposed meanings/types, unknown/unavailable states, severity, latch/clear behavior and timestamps: ____ . Both are absent from v1; SSE status, validation/storage errors and offline demo labels are not substitutes.
- [ ] Security-state authority, transitions/triggers, startup/unknown conditions and brake feedback ownership: ____ . Reported state remains separate from local demo controls; v1 has no unknown security enum.
- [ ] Calibration references, revision/date, test conditions, verification results and CPE/firmware approval evidence for each agreed field: ____ . Approver/date/scope: ____ .

## Software lead decisions (you)

- [ ] Review field names/types/nullability against confirmed inputs; decide future contract/database versioning and migration scope: ____ . Keep current payload/database v1 unchanged in this documentation milestone.
- [ ] Define receiver identity configuration, invalid-message behavior, old-session handling and sender/receipt display semantics with firmware: ____ . Current commit-before-state/SSE and rejection retention are the software baseline.
- [ ] Specify future transport, trust/authentication and device status presentation in a separately authorized milestone: ____ . Current loopback/origin restrictions are local development boundaries, not device authentication.
- [ ] If commands are later authorized, draft operations (for review only: security arm/disarm and brake control, subject to hardware support), command identity, authorization, expiry, idempotency, retries/timeouts and acknowledgement format: ____ . **Not yet implemented.** Firmware must define accepted/rejected/executed/failed outcomes, correlated command IDs, reasons and reported resulting state: ____ . Acknowledgement of receipt must not imply actuation. Current controls send no hardware commands.

## Shared research decisions before forecasting collection

Research lead + software lead + CPE/firmware lead must approve a collection protocol and evidence references. All items below are unresolved; these are proposed record requirements, not implemented fields or an ML model.

| Decision to fill in | Proposed collection requirement | Owner/input |
| --- | --- | --- |
| What starts an operating experiment? ____ | Define operator action or observable criterion, start timestamp/time basis, initial battery condition, load/environment and protocol revision. Assign a separate experiment ID. | Research lead; CPE validates observability; software records approved definition |
| How do reboot, pause, recharge or reconnection affect it? ____ | `sessionId` tracks boot/reset ordering, not an operating experiment. An experiment could link multiple device boots only under an approved continuity rule; a reboot must not automatically create an endpoint or new trial. | Shared |
| Low threshold configuration, value and units? ____ | Choose a measured variable only after availability is confirmed. Record configurable value/unit, battery chemistry/capacity/BMS or operational justification, approval and any persistence/hysteresis rule. Do not choose an arbitrary voltage or SOC cutoff. Version configuration per trial. | Research + CPE; software implements approved configuration later |
| What is a qualifying observed endpoint? ____ | Record observed UTC timestamp/time basis and uncertainty, reason, observer or detection method and evidence reference. Agree threshold crossing vs operational stop and precedence. Receipt freshness or device prediction cannot establish it. | Research + CPE |
| Interrupted trial handling? ____ | Record interruption time/reason and status (e.g. interrupted/censored under agreed policy). Network loss, logging stop, operator abort or missing endpoint must not be labeled a completed endpoint. Decide exclusion/censoring and resumption rules. | Research lead, shared review |
| Target definition and eligible samples? ____ | Remaining operating time in seconds = approved observed endpoint time minus sample time for eligible samples within a completed trial. Define valid clocks, gaps, uncertainty and exclusions. Do not assign a zero target or guessed endpoint to interrupted trials. | Research lead + software lead |
| Device prediction vs observation? ____ | `timeToEmptySeconds` is an optional prediction, currently null. Store prediction provenance/version/availability separately from observed labels; never use it as the observed endpoint or proof of forecast accuracy. | Firmware prediction inputs; research defines evaluation |
| How will evidence link to telemetry? ____ | Proposed separate experiment/evidence records hold protocol/configuration, start/end/status/reason and references; associate stable telemetry record IDs/ranges and source/device/session identities, with explicit boundary rules. Multiple boots can be linked explicitly. Do not repeat protocol/evidence in every sample or change current schema now. | Software proposes future representation; research + firmware approve semantics |

No forecasting evidence collection is approved by completing software simulation. Required battery specifications, threshold justification, experiment rules and endpoint evidence are **Not supplied**. External Forecasting/Evidence vault/IoT monitor references and deployment documents are unavailable in this project review.

## Authorized local diagnostics implementation � 2026-10-09

The separately authorized simulator/panel milestone implements the pure v2 validator and in-memory receiver plus operator-authenticated diagnostics routes/SSE and synthetic test controls. This supersedes the earlier next-milestone recommendation for software simulation only. This historical simulation milestone did not validate a physical device. The separately implemented HTTP publisher and durable v2 logging are described below; firmware agreement and physical sensor validation remain pending. See [diagnostics handoff](device-diagnostics.md).


## Authorized real bench implementation - 2026-10-09

The user's CPE-day request authorizes the [hardware-demo.md](hardware-demo.md) implementation, superseding earlier no-device-ingress/documentation-only scope. New firmware and a token-bound Wi-Fi HTTP receiver reuse v2 names with separate durable logging and real diagnostics. Contract approval, wiring, calibration, upload and all physical tests remain pending. Event boot uptime and server UTC receipt remain separate; no fabricated sender UTC. Existing sibling diagnostics, v1 storage/CSV, operator login and UI examples are preserved. MQTT/GPS/LTE/forecasting and remote commands remain outside scope.

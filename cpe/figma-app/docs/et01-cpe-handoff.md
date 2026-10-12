# ET-01 CPE milestone handoff — October 10, 2026

First milestone: repeatable existing Wi-Fi anti-tamper demonstration preparation and clear ET-01 monitoring. No hardware upload or physical experiment was performed in this session. The full demonstration is **PENDING**, not complete. October 17 manuscript evidence and October 28 DP1 defense are team deadlines.

**Current team clarification:** use the [October 10 input/LED and October 11 protected HW-548 stages](staged-bench-integration.md). The new `-BenchIndicator` build enables input/GPIO27 indication with motion disabled and separate output; only upload after the team confirms reconstructed wiring and disconnects the HW-548/siren. Bench switch pressed=secure is provisional; final mounting is pending. Seller specifications and proposed terminals are recorded as unverified claims, not proof of compatibility.

## Evidence and implemented scope

| Capability | Current evidence |
| --- | --- |
| ESP32 operates, MPU6050 communicates with changing readings, COM/NO continuity | Physically verified **as reported by the user**; serial captures/date/tester/files have not yet been supplied |
| Auth, assigned ET-01 authorization, CSRF, SQLite, v1 simulation, v2 receiver/SSE/history/export | Existing automated software coverage; new validation results recorded below |
| GPIO27 startup LOW, USB ARM/DISARM, five-second cutoff, local switch/motion detector, NVS retry spool | Implemented firmware; compilation and portable clock/spool tests do not prove physical output or timing |
| Physical heartbeat, switch-to-dashboard event, offline local siren, reconnect and power loss | Pending team observation and evidence |
| HW-548 and 12 V active siren | Blocked on exact module interface/polarity, power/current and safe reset review |
| GPS, ADS1115, ACS758, LTE | Pending drivers and electrical verification; not operational |

## Windows team procedure

1. Preserve the current ESP32 sketch. Stop existing SOLAIR services using Ctrl+C in their own terminals. While **all writers are stopped**, copy `data/telemetry.sqlite`, `data/auth.sqlite`, `data/device-telemetry.sqlite` if present, plus any corresponding WAL/SHM files, to a private dated backup directory. Never overwrite originals; do not share authentication backups. The source snapshot is not a database backup.
2. Open PowerShell at `C:\Users\Anyang\SolAir\figma-app`. Use existing Node 24+, dependencies and pinned Arduino toolchain. Run `npm.cmd run operator:create` only if an ET-01 account is needed; enter passwords privately, never in chat or command arguments.
3. On the same private 2.4 GHz Wi-Fi, run `ipconfig`. Find the laptop Wi-Fi private IPv4; do not use an ESP32 loopback address. Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\provision-hardware.ps1`. Hidden SSID/password prompts write ignored `firmware/anti-tamper/secrets.h`; the generated/reused token is in ignored `data/device-token.txt`. The firmware URL becomes `http://<laptop-IP>:3002/ingest`. Token and operator credentials are separate. Firmware and receiver both expect **ET-01**, as does the operator assignment.
4. With power disconnected, review printed GPIO labels: MPU SDA=21, SCL=22, lid=25, mount=26, siren reserved=27. These are GPIO numbers, not header positions. Use the [detailed wiring review](hardware-demo.md#1-wire-with-all-power-disconnected). Switch secure position must close the GPIO-to-GND contact; LOW=CLOSED/ATTACHED. MPU logic and pull-ups must be 3.3 V compatible. Leave HW-548/siren disconnected.
5. After the team confirms input wiring, change only the default `#define SOLAIR_WIRING 0` to `1` in `config.h`. Keep `SOLAIR_SIREN=0`, `SOLAIR_MOTION=0`. Review all pins before enabling; no physical flags were enabled by this software session.
6. Terminal A: set `$env:SOLAIR_DEVICE_HOST = '<actual-private-IPv4>'`, then `node backend/hardware-server.mjs`. This uses the existing working databases. API remains loopback port 3001; ingress binds only the selected LAN address on port 3002. Allow firewall TCP3002 only for the private bench scope if needed. Do not run `dev:local` concurrently.
7. Terminal B: `npm.cmd run dev:frontend -- --host 127.0.0.1 --port 5173 --strictPort`. Open `http://127.0.0.1:5173/dashboard`, sign in as the assigned operator. ET-01 monitoring appears first. Receiver enabled with NEVER CONNECTED means no accepted live receipt yet; it is not proof of hardware connection.
8. Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\firmware\build.ps1` **after** provisioning/config changes. Do not upload `software-check-only`: it deliberately enables unverified features. Close serial monitors, identify CP2102 COM port in Device Manager, and use the exact [upload/monitor commands](hardware-demo.md#4-compile-and-upload-the-correct-firmware). Baud is 115200, board profile classic ESP32 Dev Module, pinned core 2.0.17. Build/upload are separate actions; software compile validation does not upload anything.
9. Capture startup DISARMED, BOOT_HEARTBEAT HTTP202 and sensor HTTP202. Verify fresh receipt, new boot UUID, firmware version, IMU VALID with changing vectors, and both secure switch states. Record real observations. A 202 is durable acceptance or exact-retry acknowledgement; it alone is not calibration evidence.
10. After 10 seconds with both contacts secure, send `ARM` via USB serial (newline). Open one contact for more than 50 ms. Record local event and dashboard event identity/receipt. DISARM clears the latch; repeat for the other contact. With siren disabled, this proves only the sensor/network path.
11. Obtain the exact HW-548 interface review before enabling siren. Existing active-high GPIO27 code is not proof of module compatibility. First test meter/test load, then approved rated 12 V circuit. Record OFF during reset, trigger ON, cutoff at five seconds, DISARM during output and offline operation. No remote dashboard command exists.
12. Disconnect Wi-Fi, trigger locally, restore Wi-Fi and record original event boot/sequence/uptime with later server receipt. Restart backend and compare event identity/count/original receipt. Refresh browser and confirm records persist. Reset ESP32: DISARMED/new boot; recovered old events must not mark the device live. Follow the full [physical checklist](hardware-demo.md#5-expected-output-and-physical-success-checklist).

## Contract review

The shared runtime validator is `src/app/data/diagnosticsV2.ts`; receiver persistence is `backend/device-receiver.mjs`. No payload/schema/storage migration is introduced by this milestone.

Every message requires exact v2 fields with no unknown keys, `source=device`, bound ET-01, firmware version, UUID boot, nonnegative safe-integer sequence/uptime. Message types remain `device_heartbeat`, `sensor_telemetry`, `tamper_event`. Initial live boot uses heartbeat sequence 0. Heartbeat/sensor ordering is independent per type; uptime cannot decrease. Exact stored retries preserve count and live freshness; changed payload with the same identity is rejected. Historical events are deduplicated separately and never refresh live receipts or activate boots.

Unsynchronized clock requires null sender UTC; synchronized clock requires valid UTC. Sender UTC is separate from server receipt. Valid IMU requires finite XYZ vectors and null fault; failed/blocked IMU requires null vectors and a permitted fault. Switch status must agree with states/fault. Read start ≤ read end = uptime. Unsupported energy/GPS/speed/brake fields stay null; time-to-empty must remain null. GPS coordinates require a valid fix. See [contract](telemetry-contract.md) for all constraints and provisional timings. Token possession is not sensor authenticity.

## Screens and provenance

ET-01 monitoring shows accepted v2 IMU, switch, reported security, receipts, boot/sequence, independent device/sensor freshness, browser SSE, and durable events when receiver mode is enabled. TEST FIXTURE remains distinct from REAL DEVICE. Real receiver mode is an ingress setting, not physical evidence.

Real-mode main energy/location cards are unavailable. While mode is unknown, cards also remain unavailable. Default simulation mode uses v1 examples. Simulation controls/history sit in a separate expandable section. Fixed map image, harvested-energy chart, example alerts, demo security controls and SMS view remain examples; no SOS, driver communication, live fleet map or remote actuation is operational. Separate exports retain v1 SIMULATED versus real-v2 provenance. The real UI export is the first 1,000 records; use documented API pagination for complete evidence sets.

## Prioritized DP1 checklist

1. Before manuscript evidence on October 17: prove physical heartbeat + changing IMU + both switches; capture real event → SQLite → dashboard identity. Preserve original files and report failures as well as passes.
2. Verify exact HW-548 electrical interface; measure local siren OFF/reset, cutoff, DISARM and offline behavior. The immediate success condition remains incomplete until the physical siren and dashboard event are observed together.
3. Verify reconnect/server restart, NVS recovery and record limits; evaluate mounted motion thresholds with siren disabled before enabling motion.
4. Complete browser checks at mobile/tablet/desktop sizes: login/logout, diagnostics, disconnected/stale retained values, exports, all existing navigation. No screenshot/layout claim is made without a browser run.
5. Next separate milestone: GPS NMEA checksum/parser, valid-fix/age rules and bench mode; ADS1115 bounded acquisition and faults; **one installed ACS758 channel**, explicit zero-offset calibration and optional future second wind channel. Current alone does not provide power/energy without a valid voltage measurement. No fabricated SOC or forecasting.
6. LTE milestone: exact A7670E carrier-board power/UART voltage/level shifting first, then bounded modem ID/SIM/network diagnostics. Future secure transport requires certificate verification and credential rotation; do not route commands through it.
7. Extend new module status fields only through an agreed versioned contract and validator/storage/export/frontend migration together; strict v2 rejects ad-hoc new fields today. Keep old records and source provenance intact.
8. Rehearse the full recorded demonstration before October 28; reserve recovery time. Driver/fleet feature work follows the repeatable CPE path.

## Future fleet/PWA architecture (planned, not implemented)

Use one secure shared HTTPS backend with tenant/TODA, users/roles, vehicles, device credentials and explicit driver/operator assignments. Enforce tenant/device authorization on every API, stream and export in the server. Move the single-device in-process receiver/state model to reviewed per-device durable ordering and scalable storage; local SQLite files do not synchronize across laptops or phones.

Store location fixes with sender/receipt times, fix validity and explicit stale last-known presentation. Apply consent, retention and restricted access to location. SOS/help and operator-driver communication require durable requests/messages, acknowledgement/escalation, authorization and delivery status; show pending/failed offline submission honestly. No public tracking endpoint or remote siren/ARM commands.

A future installable PWA needs manifest, HTTPS and service-worker policy. Cache the application shell; treat authenticated telemetry/location as sensitive. Offline screens show timestamped last-known values and disconnected status. Do not cache credentials or replay hardware commands; avoid assuming service workers keep SSE live in the background. These are architecture requirements, not delivered fleet functionality.

## Preservation and validation

Baseline local Git commits: `50d7b2b` plus `b65d7f2` (original telemetry source from the snapshot; the inherited `data/` ignore also hid `src/app/data`). The ignore now targets only root `/data/`. Ignored source snapshot: `data/source-backups/pre-et01-20261010-181128`. Neither includes working databases/private credentials/compiled firmware. `.gitignore` protects data, secrets headers, environment files, private keys and logs; Vite additionally denies secrets headers and firmware build files. Never publish firmware binaries containing provisioned credentials. Use `git diff` to review each milestone; do not blindly stage ignored artifacts or overwrite database backups.

Fresh validation: all nine existing Node checks PASS (simulation, contract, backend, storage, authentication, diagnostics, hardware integration, software hardening, local launcher); portable firmware C++ check PASS; production build PASS. Safe-default firmware compile: 793,909 bytes program / 46,712 bytes global RAM. All-feature compile: 807,817 bytes program / 46,780 bytes global RAM. Neither was uploaded. Launcher/build required approved execution outside the sandbox because Vite's loader could not read a parent directory. The build retains a large frontend bundle warning.

The hardening check now verifies unavailable main cards before source confirmation and preserves examples only after simulation mode is known. Provisioning additionally rejects invalid IPv4 octets before writing credentials. Its isolated focused check PASS covers private/invalid addresses, matching token/header, credential escaping and stable token reuse: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-provisioning.ps1`.

Browser testing was attempted, but the computer-use inventory contains no browser and opening the in-app browser returns “Browser is not available.” Responsive layout, React interactions and real browser downloads therefore remain **PENDING user testing**. No browser pass is claimed. Software fixture ingestion uses temporary databases and explicit TEST FIXTURE provenance. User-reported physical checks above remain separate from these results.

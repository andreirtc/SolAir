# SolAir project workflow

- Work on one runnable milestone at a time; stop after validation so the user can test.
- Preserve the existing Figma design, navigation and working functionality.
- Inspect actual files and existing changes before editing. Preserve prior instructions and user changes.
- Clearly distinguish browser simulations and example histories from real hardware data or experimental evidence.
- Current milestone is browser-only telemetry simulation. MQTT stays offline, GPS stays simulated, and security controls send no real commands.
- Protect credentials: never commit, display or hardcode tokens, passwords or private keys.
- Avoid new dependencies/upgrades and unrelated services unless necessary and authorized.
- Use npm.cmd in Windows PowerShell. Run the existing build and relevant focused checks.
- Explain changes briefly for a beginner; distinguish checks run from browser checks still needed.

## Browser telemetry session

- Samples start after 3 seconds and repeat every 3 seconds while on /dashboard and running.
- WAITING means no sample yet; UPDATING means age under 10 seconds; STALE begins at 10 seconds; DISCONNECTED begins at 30 seconds. These are provisional UI timings, not firmware requirements or MQTT status.
- Pause cancels the sample-generation timer. A separate display clock continues to show age and freshness while paused. Leaving the dashboard cancels both timers.
- Retain the last readings when stale/disconnected and label them outdated. Null remains unavailable; zero remains zero.
- Resume keeps the count/readings and starts a new 3-second sample timer.
- Switching the four dashboard tabs preserves the session. Navigating away (including expanding the map), returning, or refreshing starts a new session: count zero, WAITING, unpaused, starting fixture readings.
- Chart history, map imagery and alert history remain fixed examples; simulator samples do not create research records or persist to storage.

## Proposed telemetry contract

- Contract version 1 is PROPOSED, awaiting firmware-team agreement; see docs/telemetry-contract.md.
- Simulator messages pass runtime validation before display. Rejection preserves accepted readings, count, sequence tracking, and browser receipt time; a valid message clears the error.
- Keep sender UTC timestamp separate from local browser receipt time. Freshness uses accepted receipt time.
- Source metadata does not authenticate a device. All current dashboard samples remain simulated; Time-to-Empty remains null.
- Preserve nullable speed/brake fields and local demo security controls; reported security is displayed separately.
- Run both scripts/check-telemetry-simulation.mjs and scripts/check-telemetry-contract.mjs plus the existing build for this milestone.

## Current local backend milestone override

The authorized local Node/Express + SSE milestone supersedes browser-only generation/session-reset rules above. Backend owns sample generation, ordering, accepted count and receipt time. Browser refresh/navigation retains backend state; backend restart loses it. No browser fallback, persistent database, MQTT, hardware commands or authentication. Run the two existing focused checks, scripts/check-telemetry-backend.mjs, and the existing build. See README for loopback startup and manual tests.

## Persistent local telemetry milestone override

The authorized SQLite logging milestone supersedes the in-memory/no-database/restart-loss statements above. Validate and atomically commit samples and durable ordering before updating accepted state or SSE. Restore latest sample, lifetime count and original receipt time; each backend startup uses a new simulator session and zero current-startup count. Preserve local simulation labels, loopback/origin restrictions and no hardware/authentication scope. Run the existing checks plus scripts/check-telemetry-storage.mjs and build. All automated checks must use temporary databases, never data/telemetry.sqlite. No automatic purge or historical backfill. See README for paused startup, history/CSV, storage location and safe backup.

## Local operator authentication milestone override

The authorized local authentication milestone supersedes previous no-authentication statements. Use separate Git-ignored authentication SQLite storage with real operator login, assigned-device authorization, server-side sessions and CSRF. Setup/reset passwords are entered privately in an interactive terminal, never in arguments/logs/chat. Preserve the simulator, stored telemetry, history, simulated-only CSV and freshness timing; real-hardware schema remains PARTIAL. Tests must use isolated temporary authentication AND telemetry databases and real login, with no bypass. Run scripts/check-auth.mjs, all existing telemetry checks, scripts/check-dev-local.mjs and the production build. Local HTTP cookies require explicit loopback development mode; future HTTPS requires Secure cookies. Stop after validation for user testing.

## Authorized real ESP32 bench milestone override - October 9, 2026

The user's CPE-day request authorizes opt-in ESP32 Wi-Fi HTTP ingestion, local anti-tamper/siren firmware and durable real v2 diagnostics. See docs/hardware-demo.md. Earlier no-real-ingress statements are superseded for this milestone. Preserve loopback operator auth, v1 data/simulated-only CSV and UI example labels. Use separate token-bound LAN ingress and real v2 SQLite storage. Commands remain USB serial only; dashboard controls remain demos. Safe defaults: wiring/siren/motion disabled and DISARMED startup. Physical upload/wiring/calibration/siren/offline checks await team confirmation. Automated tests use temporary device, telemetry and auth databases. Run existing checks, check-diagnostics.mjs, check-hardware-integration.mjs, build and both firmware compile configurations, then stop for user hardware testing.

## Software-only hardening override — October 10, 2026

Physical testing is unavailable. Preserve the implemented ESP32 → token-bound HTTP POST → receiver → validation → SQLite → authenticated SSE → dashboard architecture. MQTT is future/optional only. REAL v2 export stays separate from SIMULATED v1 export. Synthetic ingestion tests use explicit TEST FIXTURE provenance and temporary databases. Sender UTC remains null until valid SNTP synchronization; never invent UTC from uptime. Persist important events with immutable boot/sequence/payload identity in a bounded NVS spool; recovered historical events do not refresh live device receipts or change live boot ordering. Defaults remain wiring/siren/motion disabled and DISARMED. Run all existing checks plus check-software-hardening.mjs, check-firmware-software.ps1, production build and both firmware compile configurations; stop for software/browser testing. Do not upload, wire, calibrate, test siren/power loss physically, or start GPS/LTE/ADC/battery/energy/ML/OTA/remote actuation during this phase. See docs/software-hardening.md for limitations and current validation.

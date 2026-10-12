# SOLAIR implementation and verification — 11 October 2026

This fresh project implements runnable software, device firmware and deployment configuration. It does not claim completed physical commissioning or a deployed fleet. The master document's requested outputs are mapped below. The latest evidence logs supersede the earlier paused checkpoint.

## 1. Repository and structure

`C:\Users\Anyang\Videos\SolAir\solair-platform` is a fresh Git repository. No previous SOLAIR project was reused or modified. `app/` contains the Next.js shell; `src/` the integrated user application; `server/` the API/auth/database; `backend/migrations/` relational SQL and Supabase access restrictions; `packages/` telemetry/forecast interfaces; `firmware/esp32-solair/` actual ESP32 source; `public/` approved vehicle/icons/PWA; `assets/vehicles/` licensed reference; `tests/` automated checks; `docs/` evidence and operating guides. Private configuration/database/build tooling is ignored.

## 2. Stack and architecture

Next.js 16.4 App Router, React 19, TypeScript, Node 24, Express 5, Zod, PostgreSQL/pg, Supabase JS, Leaflet/OpenStreetMap, self-hosted fonts, custom responsive CSS. Railway Docker hosting with Supabase PostgreSQL/Auth/realtime is the selected target. SQLite/local identity enables development without cloud accounts. All roles use the same backend and, when configured, the same central PostgreSQL database. Supabase proves identity; opaque shared-database cookie sessions authorize APIs. Direct browser database access is denied by Supabase RLS/privileges. Server-only realtime subscriptions relay scoped invalidations via SSE. Start with one replica because rate limits remain per process.

## 3. Driver

Assigned-vehicle dashboard, mandatory white BEMAC hero, separate electrical measurements, energy/source status, timestamped GPS/last-known map, security history, help/SOS request with real server receipt/acknowledgment/resolution, persistent messages/read acknowledgment, profile/preferences, mobile navigation and production PWA. Offline help remains visibly unsent and retries idempotently. Uninstrumented channels and predictions remain unavailable; demonstration readings are explicitly partitioned/labeled.

## 4. TODA operator

Organization-scoped fleet overview, real basemap/GPS markers, vehicle thumbnails/details, energy/history JSON exports including source energy records, security acknowledgment, assistance handling, messages, driver invitations/accounts/assignment and vehicle registration. Refresh preserves map zoom. Unknown/fault/offline states are explicit. Admin adds organizations, switches workspaces, manages broader roles and uploaded vehicle images, and reads audit logs.

## 5. CPE Lab

Protected engineer/admin workspace with 115200-baud Web Serial, fragmented NDJSON validation, device/source matching, USB forwarding into the actual backend, diagnostic/raw electrical/GPS/LTE fields, arm/disarm/baseline/LED/alarm-clear USB commands, device credential provision/rotation, guided physical tests, measured evidence/results/calibration references and exports. Physical results require engineer entry; software never automatically assigns a physical PASS.

## 6. Backend/database

Actual migrations and relational foreign keys for organizations, profiles, sessions, invitations, vehicles, assignments, devices, telemetry, energy, GPS, security events, help requests, messages, bench sessions/results, calibrations, images and audit records. Server authorization enforces role/TODA/assignment, including engineer-only paths. Hashed device/session credentials, local scrypt passwords, Supabase identity adapter, trusted invitation role binding, account session revocation, recovery adapter, private image validation, cross-origin mutation rejection, limits, duplicate/replay rejection and atomic ingest. Persistent sensor-health fault transitions avoid repeated identical alerts. Power/energy preserve unavailable inputs; no energy accumulation through missing samples or long gaps. Retention is supplied as a scheduled command.

## 7. ESP32 firmware/protocol

Fresh Arduino PlatformIO firmware for ESP32-WROOM-32D. MPU6050 calibration/rule detector; debounced KW11 switches; local offline bench alarm/LED; optional ADS1115 raw diagnostics, GPS UART and LTE AT probe. Wi-Fi sends CA-verified HTTPS on a separate FreeRTOS task. Bounded persistent retry queue prioritizes events, drains faster than sampling, reports overflow, and safely acknowledges only the frame still at its head. Serial and network use the same versioned v1 contract with device/boot/sequence identity, timestamps, source/transport, independent sensor fields, calibration and faults. Missing electrical sensors emit null. LTE AT diagnostics are not packet transport.

The default final firmware compiled: RAM **46,516 bytes (14.2%)**, flash **790,137 bytes (60.3%)**. Evidence: [build log](firmware-build.log); binary: [solair-1.0.0.bin](../firmware/releases/solair-1.0.0.bin). Compilation is not flashing or physical sensor validation.

## 8. Connect ESP32

Follow [HARDWARE.md](HARDWARE.md) in order: review low-voltage wiring; copy ignored `solair_config.h` from the example; build; identify the real CP2102 COM port; upload after wiring review; close other serial monitors; sign in as engineer, choose hardware mode and the registered vehicle; connect Web Serial at 115200; observe genuine frames; calibrate and test switches/motion/LED; record evidence. Wi-Fi requires the real HTTPS URL, CA and one-time device token. Powered siren remains disabled until the documented electrical review and physical verification. Never connect unverified traction sensing to ESP32/ADS inputs.

## 9. Authentication/roles

Local-only accounts: `driver@solair.local`, `operator@solair.local`, `engineer@solair.local`, `admin@solair.local`; development demonstration password `SolairDemo!2026`. They are seeded only in empty local development, never production. Hosted bootstrap creates the first Supabase administrator/profile; trusted manual invitations create subsequent identities with server-assigned roles/organization. Drivers see only assigned vehicles; operators invite drivers, engineers perform bench operations, administrators control roles/organizations. Password recovery uses Supabase and revokes SOLAIR sessions; SMTP delivery still requires configuration/testing. No secret is committed or exposed in a public environment variable.

## 10. Local startup

From the repository, run `npm ci`, then `npm run dev`. Open `http://localhost:3000`. No cloud credential is required. For build/PWA QA: `npm run build`, then start with `PORT=4173`, `SOLAIR_BIND_HOST=127.0.0.1`, `SOLAIR_ALLOW_LOCAL_PREVIEW=1` and `npm start`. This preview exception is local only. Browser checks use `TEST_URL=http://127.0.0.1:4173`; PWA tests use that port directly.

## 11. Centralized deployment

[RAILWAY_SUPABASE.md](RAILWAY_SUPABASE.md) contains exact account/setup steps, variables, verified TLS, migrations, identity/realtime settings, bootstrap and cross-network acceptance. Required names: `DATABASE_URL`, `SOLAIR_DATABASE_CA`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SOLAIR_PUBLIC_URL`, `SOLAIR_AUTH_PROVIDER`, `SOLAIR_REALTIME_PROVIDER`, `NODE_ENV`, Railway `PORT`. Accounts are not configured; no actual hosted URL or subscription is claimed.

## 12. Screenshots/vehicle

[Driver](screenshots/driver.png), [operator](screenshots/operator.png), [CPE Lab](screenshots/cpe-lab.png), [real-mode driver](screenshots/driver-real-mode.png), [offline shell](screenshots/offline-shell.png). Final screenshots are captured from the Next.js production preview and visually inspected. The user-approved transparent white BEMAC render is retained with responsive Next image delivery and CSS depth. It is a reference-based generated visualization, not documentary evidence of installed hardware. Provenance and rear-entry corrections: [asset notes](../assets/vehicles/README.md).

## 13. Automated evidence

| Check | Result/evidence |
| --- | --- |
| Unit/API/provider suite, SQLite local store | **37 passed, 0 failed**, [log](sqlite-test-results.log) |
| Core suite with embedded PostgreSQL (PGlite), plus provider boundaries | **37 passed, 0 failed**, [log](postgres-test-results.log) |
| Multi-context Next production browser workflows | **14 passed**, no runtime errors, [results](browser-results.json) |
| Production PWA/Chromium installability/offline/privacy | **10 passed**, no runtime errors, [results](pwa-results.json) |
| Next.js production build | Passed, [log](production-build.log) |
| Typecheck/lint | Passed, [typecheck](typecheck.log), [lint](lint.log) |
| ESP32 default firmware | Compiled successfully, [log](firmware-build.log) |

Embedded PostgreSQL tests run genuine PostgreSQL query/constraint/RLS/publication semantics; they are not a live Supabase connection. Provider tests use a controlled identity double; they do not establish provider connectivity. Production browser contexts share one local backend/database; they do not prove separate-network hosting. Tests cover permission boundaries, replay/device credentials, null readings, source partitioning, energy gaps/export, invitation role binding, persistent assistance/messages, offline retry, fault transitions and session invalidation.

## 14. Physical tests requiring the team

USB ESP32 identity/connect/disconnect; MPU calibration/known-motion sensitivity/false positives; switch polarity/debounce/enclosure mounts; low-voltage LED; electrically reviewed HW-548/siren operation; ADC input limits; ACS758 zero/gain/reference comparison; separately engineered battery/PV/wind voltage scaling; valid/invalid/stale GPS; Wi-Fi TLS failure/reconnect/queue pressure/power-loss retention; LTE board logic levels/SIM/PDP/TLS transport. Record actual instruments, timestamps and evidence in CPE Lab. Current enumeration found COM3–COM6 **Bluetooth** links, no USB ESP32. These tests remain NOT TESTED/BLOCKED.

## 15. Simulated/unimplemented/unverified

Demonstration telemetry/GPS is explicitly simulated and becomes stale. No verified traction battery/PV/wind sensing, calibrated ACS current conversion, SOC or validated runtime model is supplied. Wind commissioning and LTE packet/TLS transport remain future work. Siren actuation is disabled by default and physically unverified. Browser push is unavailable. Invitation sharing is manual. Supabase recovery software is implemented but actual SMTP delivery and cloud adapters remain unverified. Railway/Docker deployment, Android install and actual separate-device synchronization await configured infrastructure/hardware.

## 16. DP1 priorities

Before **17 October 2026, 1:30 PM manuscript submission**, record reproducible bench evidence for USB, MPU6050, switches and safe LED/alarm behavior; describe the measured hardware separately from screenshots/simulated data; complete electrical review and honest limitations; include schema, telemetry contract, firmware/software logs and deployment architecture. Before the **28 October 2026 DP1 defense**, configure Railway/Supabase, verify phone/operator access across networks, rehearse the help/message flow and demonstrate genuine USB data with fallback evidence if connectivity fails. Do not present predictions, wind harvesting or LTE as validated.

## 17. DP2 extensions

Commission independent isolated electrical sensing/calibration, solar/wind power stages and safe field installation; implement verified LTE transport; validate SOC/runtime forecasts on held-out measurements with reported error; improve false-alarm evaluation; add approved push, backups/restore drills, distributed rate limits and pagination; complete real vehicle field trials and documented retention/privacy controls. Existing source-partitioned storage, sensor contract, replaceable visualization and forecast interface support these additions without replacing the role/workflow foundation.

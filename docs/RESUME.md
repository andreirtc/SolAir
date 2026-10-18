# SOLAIR resume checkpoint — 18 October 2026

Current project: `C:\Users\Anyang\Videos\SolAir\solair-platform`. Preserve the existing demo on its current branch. The user has requested a GitHub backup of the current system before any future feature implementation.

## Current additions

- Malabon-centered fleet map, explicit Show vehicles/recenter controls, and an empty-fleet reference map. OpenStreetMap uses the canonical tile URL and an origin-preserving referrer policy to address blocked tiles.
- Sidebar Log out directly below Settings, without a permanent border. Mobile navigation overlays the bottom bar correctly.
- Clickable account avatar: Profile, Help and support, Report a problem and Log out. Reports persist as scoped administrator audit entries.
- Light/Dark/System appearance, browser persistence and same-origin tab synchronization.
- Idempotent server logout, session event-stream closure, cross-tab UI sign-out and honest logout-failure handling.
- Bell dropdown showing recorded security/alerts, daily positive harvested energy, system activity, assistance and received messages. Role/TODA/assignment and demo/hardware separation are enforced. Read markers are browser-local and do not acknowledge incidents.

Latest checks: 47 isolated automated tests passed; production build, type checking and lint passed. Focused account and notification browser checks passed on desktop/phone, including live updates, mode isolation and logout. Browser map images were mocked during automated UI checks. Physical sensors, actual SMS and hosted connectivity remain unverified. See [system review](SYSTEM_REVIEW_2026-10-18.md), [account/appearance guide](ACCOUNT_AND_APPEARANCE.md) and [notifications guide](NOTIFICATIONS.md).

## Proposed future work — not approved for implementation

The user composed a prompt for signup, driver/operator/admin workflows, verified phone numbers and alarm-triggered SMS. No SMS provider, modem SMS transport, paid service or public signup has been implemented. Review the current CPE/data-integrity findings before extending these workflows.

After future implementation approval, create a dedicated feature branch; do not implement the signup/SMS changes on the preserved demo branch. Never commit secrets, `.env` files, private databases or ignored firmware provisioning. Do not merge a future feature branch without user approval.

## Earlier implementation checkpoint — 11 October 2026

Fresh project: C:\Users\Anyang\Videos\SolAir\solair-platform. The previous pause has been resumed. No older SOLAIR project was touched. Preserve the user-approved public/bemac-white.png; the entrance correction is at the vehicle rear.

## Current implementation

Next.js 16 App Router + React 19, custom Next/Express server, SQLite local development, PostgreSQL hosted adapter, Supabase Auth identity + private shared-database sessions, Supabase server-side Postgres Changes + authorized SSE. Railway Dockerfile/railway.json and credential-free examples are ready. Cloud accounts have not been configured; development must not wait for them. The driver PWA, TODA workflows, CPE Lab, actual ESP32 firmware, telemetry contract and backend are implemented.

## Verified

37 unit/API/provider tests passed with local SQLite and 37 with core tests on embedded PostgreSQL/PGlite. Provider boundaries are mocked; no hosted Supabase connection is claimed. 14 Next production browser workflows and 10 production PWA checks passed. Next production build, lint/typecheck and default firmware compile passed. Final firmware: 46,516 bytes RAM; 790,137 bytes flash. Source, binary and logs are preserved. Energy missing sensors remain unavailable, exports include source measurements, charts use recorded samples, map refresh retains zoom, fault transitions persist once.

See docs/VERIFICATION.md for all 17 requested outputs, screenshots, detailed evidence and remaining work. See docs/RAILWAY_SUPABASE.md for exact account/environment setup. No secrets or .env files are committed. Do not enable local-preview bypass on Railway.

## Remaining external verification

Create Railway and Supabase accounts and configure environment variables securely. Exercise hosted Auth/SMTP/realtime and separate-network phone/operator synchronization. Connect the actual CP2102 ESP32 and follow docs/HARDWARE.md. Latest COM3–COM6 are Bluetooth links, not USB ESP32 ports. Never invent measurements or physical PASS. HV sensing, wind commissioning, SOC/runtime validation, LTE packet transport and browser push remain unavailable/unimplemented as documented.

## Start

cd C:\Users\Anyang\Videos\SolAir\solair-platform
npm run dev

Local app: http://localhost:3000. Development accounts/password are in README. Development preview is left available after this work; local production QA used loopback4173 and is stopped when checks finish. Do not touch port3001 (another service).

PlatformIO tooling lives under ignored .tools/. Set PLATFORMIO_CORE_DIR to .tools/platformio, then run .tools/pio/Scripts/python.exe -m platformio run --project-dir firmware/esp32-solair -j2. Do not flash without actual wiring review.

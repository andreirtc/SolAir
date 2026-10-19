# Daily workflow implementation — 19 October 2026

## Result

The software additions are available at **http://localhost:3000/**. The running combined launcher reports `environment=demo`, `sms_mode=disabled`, `paid_enabled=false`. Physical hardware, actual phone verification/provider delivery and hosted deployment were not performed.

Use [DAILY_WORKFLOWS.md](DAILY_WORKFLOWS.md) for the short user instructions. Existing [hardware acceptance](OPERATIONAL_ACCEPTANCE.md), [CPE wiring](CPE_DIRECT_BREADBOARD_QUICK_GUIDE.md) and [provider setup](OPERATIONAL_SETUP.md) remain authoritative.

## Added or completed

- Driver account setup checklist: saved TODA, actual vehicle assignment, responsible operator and optional verified alert contact. Account setup is separate from physical readiness.
- People directory: a **Drivers needing a vehicle / operator** filter, assigned vehicle/model/operator summaries and a contact-readiness indicator, without listing private phone numbers.
- Driver home: compact connection, battery, GPS and security cards; expandable individual sensor ages; help/history links. Removed the duplicate home battery card. Existing BEMAC visualization, Malabon map, dashboards, Settings and theme controls remain.
- Incident handling: acknowledge once, append shared notes, resolve with a required note, filter by status and inspect saved handling history. Existing engineering incident access is preserved. Driver and foreign-TODA mutations are rejected.
- SMS readiness: read-only service/device/contact/commissioning checks, unavailable verification controls, honest provider-accepted/delivered/unknown labels and delivery-attempt history. This does not activate a provider, transmit a message or confirm a siren.
- Research evidence: selected-source telemetry CSV includes stable identities, capture/event/receipt times, reporting delays, historical flags, quality/source/load labels and the raw payload. Incident CSV includes handling history, server handling delays and delivery attempts. Existing protected bench and CPE exports remain available.
- Older saved telemetry without sensor-age fields remains readable; it shows unknown ages rather than fabricated freshness. Sensor faults, calibration status, contact age and GPS age are separate.

## Checks performed now

| Check | Result and evidence |
|---|---|
| Full isolated SQLite suite | **85/85 passed**. Local ignored log: `test-results/daily-workflows/sqlite.log`. |
| Embedded PostgreSQL/PGlite | Full existing-plus-initial-workflow suite **83/83 passed**; final expanded workflow suite **10/10 passed**, covering the two added concurrency/persistence cases and legacy-field compatibility. This is embedded PostgreSQL, not hosted Supabase. Final focused log: `test-results/daily-workflows/workflows-postgres.log`. |
| Final SQLite workflow suite | **10/10 passed**, including legacy sensor fields, verified-code mocks, competing acknowledgments and SQLite close/reopen persistence. Log: `test-results/daily-workflows/workflows-sqlite.log`. |
| Supabase direct-access boundaries | Automated test rejects anonymous/authenticated direct reads of operational tables, including `incident_updates`. No hosted database was contacted. |
| Production build/type checking | Passed after the final application fixes. No dependency change or firmware build was needed. |
| Lint | Passed. |
| Workflow browser | **16/16 groups passed** against a disposable production preview on port 15373. Includes 390px layout, assigned/unassigned users, old demo telemetry, mode switching, protected CPE access, incident notes/resolution, draft retention, a deliberately paused save and saved closure after reload. Local evidence: `test-results/operational-ui/results.json` and screenshots. No runtime errors. |
| Existing account/theme/logout browser | All four reported groups passed in a separate disposable preview: avatar/focus, persistent Light/Dark/System, profile/support/report receipt, failure-safe logout, multi-tab session revocation and phone controls. |
| Malabon map browser | Both 1440px and 390px cases passed: center, vehicle framing, recenter, zoom preservation and empty locations. Map layout tests are not evidence that a physical GPS works. |
| Existing fleet browser | **14/14 checks passed**, including BEMAC artwork, navigation, demo isolation, help/messages/evidence persistence, permissions, offline help retry and logout. Local evidence: `test-results/regression-preview/browser-results.json`. |
| PWA browser | **10/10 checks passed**: manifest/installability, local assets, no private API caching, cold offline shell, mobile layout and no runtime errors. Local evidence: `test-results/regression-preview/pwa-results.json`. This does not establish physical phone acceptance or multi-network cloud operation. |
| Existing working data | All **714 pre-existing rows** compared unchanged before and after the additive migration. No missing/modified prior rows; SQLite integrity OK; zero foreign-key errors. Private summary: `.tools/daily-workflow-preservation.json`. No synthetic telemetry, registrations, notes or incidents were inserted into the working database. |
| Live local startup | Final build restarted successfully; root HTTP 200; SMS disabled and paid flag false. |
| Git whitespace | `git diff --check` passed. Git emitted existing Windows LF/CRLF conversion notices, not validation failures. |

Early checks caught a test-fixture SQL placeholder error and an unused import; both were corrected. Browser review led to a more compact driver overview and fixes for the incident label, refresh draft preservation and save-in-progress draft clearing. The paused-request test's cleanup was corrected before its final passing run. Failed attempts are not treated as passes.

## Exact source scope for this change

Added:

- `src/Workflows.tsx`, `src/IncidentHistory.tsx`
- `server/workflows.ts`, `server/incidents.ts`
- `packages/device-health/index.ts`
- `backend/migrations/011_incident_updates.sql`, `012_incident_updates_supabase.sql`
- `tests/workflows.test.ts`
- `docs/DAILY_WORKFLOWS.md`, this report

Modified:

- `src/main.tsx`, `src/Operational.tsx`, `src/People.tsx`, `src/Registration.tsx`, `src/style.css`
- `server/administration.ts`, `server/db.ts`, `server/operational-routes.ts`, `server/operations.ts`, `server/registration.ts`
- `tests/operational-browser.ts`, `tests/operations-rls.test.ts`, `tests/postgres-store.ts`
- `README.md`, `AGENTS.md`

This list is relative to the private pre-change source snapshot. The checkout already contained the earlier uncommitted combined application; those changes were preserved. No firmware, wiring, private environment file, account credential, device token, dependency lockfile or cloud configuration was changed. New incident notes follow existing retention redaction.

## Git and remaining gates

- Active local branch: `feature/daily-workflows-readiness`. No commit, push, merge, reset or deletion was performed. The group-history checkout and GitHub branches were not modified.
- Existing local source/database rollback snapshot: `.tools/backups/daily-workflows-20261019-135725/`. It contains private material and must remain ignored.
- Before a later GitHub push, transfer only this reviewed source delta into a fresh feature branch in the group-history checkout; do not push the unrelated flat-root history over the group's repository.
- Actual ESP32 detection, output cutoff, Wi-Fi/power-loss recovery, buffer overflow, calibration and siren behavior still need physical evidence under the canonical bench guide. None was marked passed here.
- Paid phone verification, carrier delivery, handset receipt, provider budget commissioning, Railway/Supabase connectivity and cross-device hosted acceptance remain external gates. No paid service, modem command, firmware upload or electrical output was activated.

## Browser console follow-up — response cloning

The user reported `Response.clone: Response body is already used` from the service worker. The cache write previously cloned the network response only after asynchronously opening the cache, allowing the browser to consume it first. Both normal assets and the approved optimized BEMAC image now clone synchronously before returning the response. Fetch-event lifetime tracks the background write, and a cache-write failure cannot break a good network response or become an unhandled rejection. The build cache digest now includes the worker source, so worker-only changes get a fresh cache version. API/RSC/remote/non-GET and unapproved optimized-image bypasses remain intact.

Changed `public/sw.js`, `scripts/finalize-build.mjs`, `tests/pwa.ts`; added `tests/service-worker.test.ts`. All 4 focused race/privacy/cache-failure checks passed. Production build/typecheck and lint passed. The disposable PWA browser suite passed all 11 checks, including immediate image consumption and zero service-worker errors. No live data or credentials were modified. Existing browser tabs may need to be closed and reopened to release the old active worker; no broad browser-data clearing or automatic forced reload was added.

## Mobile launch and authentication follow-up

Added a mobile-only full-viewport BEMAC/brand intro for approximately 0.5 seconds on opening the root application (shortened at user request). The existing session check runs concurrently. An authenticated user reaches the dashboard without rendering the sign-in form; a slow session check keeps the branded view visible until it resolves. Logout does not replay the intro. Desktop branding stays in its original two-column layout. After the mobile intro, sign-in/signup use a compact logo and form, without repeating the artwork above the form. Entry actions share full width and a 48px minimum height; signup submit/back actions use the same sizing.

Added `src/Brand.tsx`, `src/MobileIntro.tsx` and `tests/mobile-startup-browser.ts`; updated `src/main.tsx`, `src/Operational.tsx` and `src/style.css`. Production build/typecheck and lint passed. Focused disposable browser checks passed for full-screen dimensions/timing, authenticated and slow-session routing with no login flash, equal button dimensions at 320/390px, clean mobile signup, logout, desktop branding and zero runtime errors. The existing 11 PWA checks and four account/theme/logout browser groups also passed. Intro/sign-in/signup screenshots were visually inspected under ignored `test-results/mobile-startup/`. No account/session lifetime, backend permissions, database, credentials or hardware configuration was changed.

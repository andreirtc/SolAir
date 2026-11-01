# SOLAIR frontend integration · October 28

## Current status · 29 October — applied to the authoritative app

**http://localhost:3000 is now the combined updated frontend + current backend/SOC/TTE app.** The candidate was reconciled in an isolated child and then applied after 246 unit/API tests, 59 PostgreSQL-compatible backend tests, production builds and normal four-role/mobile/CPE browser acceptance. All 151,872 existing rows retained their pre-cutover values; existing firmware/configuration/credentials/artwork were preserved. The 3100-only/unmerged descriptions below are historical. Exact implementation, private rollback locations, evidence and still-pending physical acceptance are in [COMBINED_APP_INTEGRATION_2026-10-29.md](COMBINED_APP_INTEGRATION_2026-10-29.md).

Functional SOC/TTE now appears on Driver Home and Energy; reference/SOP4 forms remain engineer/admin protected in CPE Lab. No guessed SOC, calibrated ACS or wireless command completion was introduced. Mobile Security, map-quality/freshness, latched FSM and USB server-acceptance gaps identified below were addressed in the combined version. Actual phone/device/LTE/measurement/alarm acceptance remains separate.

## Latest addition — SOC/TTE and all SOP 4 evidence support

The authoritative current app on **3000** now includes `packages/research/index.ts`, `server/research.ts`, `backend/migrations/017_research.sql`, `src/BatterySummary.tsx` and `src/ResearchPanel.tsx`, with functional integration in Energy/CPE Lab, research registration in server/app, and migration/RLS/SQLite transaction serialization in server/db. Preserve these along with the previous CPE/GPS/LTE contract changes. Candidate port **3100** remains unchanged/unmerged and still has the old forecasting placeholder. Read `SOP4_APP_INTEGRATION.md` for routes, schemas, formulas, quality and integration requirements.

Validation: current-source TypeScript and separate-copy production build pass; SQLite92/92 tests pass;6/6 research/transaction tests pass with the PGlite-backed API fixture. Actual390px browser checks passed for current functional UI/unavailable states and the separate candidate preview, without page errors/overflow or inserted physical evidence. These are software checks, not a device/physical PASS. Keep current values unavailable until reference/validated current/history are present. Percentage and TTE are engineering estimates, never validated model results by default. Firmware was not changed or uploaded.

After laptop interruption, both apps were restored and the device-only3003 ingress/tunnel was restarted. Device must save the new current endpoint and demonstrate actual fresh LTE receipts before the video. Do not confuse local preview availability, a401 reachability response or software fixtures with an actual device upload.


## Latest GitHub frontend — live local preview, 28 October 21:10

User clarified that the live mobile preview must show the latest GitHub overhaul, rather than the older current backend UI. Rechecked all remote branch heads using authenticated GitHub API and Git fetch: newest branch tip remains `feature/solair-quality-ui-updates-2026-10-26-v2` (same non-v2 tip), `e8967336906e023cfeaba134705fcdb3e33fbc60`, committed 26 October 20:29 local. Its history includes `feature/solair-frontend-overhaul` (`a09aac0`) plus the later energy/location/notifications/settings/quality updates.

Live interactive preview: **http://127.0.0.1:3100/**, opened in the existing Orca browser at 390 × 844 and signed in normally as the local Driver. Checkout `/home/ralphandreicastillo326/orca/workspaces/SolAir/latest-frontend-preview` is an Orca-managed child based on the exact candidate SHA; tracked source remains clean. Own Node24 dependencies and fresh `data/frontend-preview.db` isolate candidate migrations/accounts from the authoritative database. Demo mode is visibly labelled; 144 seeded demo frames, zero hardware frames. Paid/cloud services and device LAN listener are disabled. Preview terminal `term_918c3cf2-efe0-4849-8b0d-381ca40b6753` remains running. Use the preview checkout's dev command on port 3100; its historical `start:combined` launcher hardcodes ports 3000/3001 and must not be used alongside the working backend.

`npm ci`, candidate typecheck, preview health, normal Driver login and mobile Home load pass; image loaded and document width equals 390 px. Existing backend health remains OK on port 3000 and device-only ingress remains on 3003. The preview replaces the older UI in the visible browser tab, not the current source/backend. Full candidate tests/build, navigation/role/hardware acceptance and backend reconciliation remain pending. No current credentials/DB/firmware copied, no merge, source commit/push, public deployment or firmware upload. Evidence: `cpe-evidence/2026-10-28-final-day-plan/frontend-preview-live.json`.

Candidate: `feature/solair-quality-ui-updates-2026-10-26-v2`, SHA `e8967336906e023cfeaba134705fcdb3e33fbc60`. Remote head checked October28; the non-v2 branch has the same SHA. Pre-integration audit completed October28: current backend typecheck and86 tests pass; no merge or combined production-build/device acceptance yet.

**Integration findings (28 October evening):** candidate app is at repository root; authoritative current app remains `next-platform/solair-platform`. No common Git merge base was found in this non-shallow repository. Candidate includes backend/schema changes (server/app, index, database, identity, telemetry contract, new migrations005–016), not just frontend. Current local backend/CPE changes are uncommitted/untracked. Preserve and checkpoint them before porting/reconciling the candidate in an isolated integration checkout. Do not replace server/packages/firmware or apply migrations as a blind frontend import. Evidence: `cpe-evidence/2026-10-28-final-day-plan/backend-premerge-check.json`.

1. Work in `next-platform/solair-platform`, Node24. Preserve current dirty backend, firmware, credentials, DB and approved artwork. Do not reset/stash away others' work or switch this checkout blindly.
2. Compare candidate changes against the current implementation before integration. The branch subject includes reliability/security changes: it is not proven frontend-only. Coordinate API/auth/schema conflicts with backend owner.
3. Preserve existing API payloads, auth roles and access checks. Never introduce a demo login bypass or hardware-data substitution.
4. Preserve telemetry source (`hardware`/`demo`), transport (`usb`/`wifi`/`lte`/`simulation`), timestamp/freshness, boot ID and sequence. Queued data is not accepted server data.
5. ACS current remains invalid/null until actual stability, zero and independent current-response acceptance. Keep uncalibrated/fault/stale states visible; never coerce null to zero, absolute current or a guessed offset.
6. Exact FSM states: `DISARMED`, `ARMED`, `TRIGGERED`. Display actual device acknowledgements separately from requested state and physical siren feedback. Do not claim commanded OFF proves sound stopped.
7. Preserve GPS valid-fix/quality and actual timestamps; separate stale/invalid locations from live track points.
8. Match approved SOP3: functional suitability, usability, reliability, performance efficiency, security/maintainability. Keep the approved edition/wording; no ISO certification claim.
9. After integration: typecheck, relevant tests, build; then actual login/role, telemetry, map/history, commands/notifications, invalid/stale-data and USB-free LTE checks. Software tests do not create physical PASS.
10. Freeze broad UI changes by the team's afternoon freeze. Retain a known-working source revision and local video backup. Do not start a new redesign/library migration on defense eve.

Backend ownership covers the whole application, not only CPE. Frontend appearance remains with the frontend member/other AI; this handoff adds no independent visual redesign.

## Final integration acceptance

Other AI owns frontend integration; this agent remains on tonight's CPE/backend work. Integration can start before physical ACS calibration finishes, but invalid current must remain invalid. Freeze the combined app only after combined typecheck/tests/build plus actual role/login, hardware LTE receipts with USB forwarding off, fresh GPS/map/history, exact three-state FSM/events, alarm trial, reconnect/stale-data and saved-record checks. Current86 passing tests cover the current working copy, not the candidate integration.

**Command-path gap:** reviewed current firmware receives security commands from Serial/USB. LTE transports telemetry/events upstream; no cloud-to-device security command execution path was found in the reviewed transport/engine. A web-button click or queued server operation is not wireless arm/disarm acknowledgement. Preserve that distinction; do not label remote control complete. User's overall target remains the whole SOLAIR web application, not only CPE Lab or a simulated dashboard.

## Current-source checkpoint — 28 October 19:56 local

Local source-only archive and manifest: `.tools/backend-baseline/20261028T115506Z/`, archive SHA256 `55232e5ca0cc204711d8cf53e24fbeec53bb018472046f5d1eb369f5123d4723`. It captures 487 current source/test/migration/firmware/artwork/example files, including dirty changes; no private configs, databases, caches or documentation/evidence. Originals and the real Git index remain untouched; nothing uploaded. This is not a Git commit or a full backup of working records.

Node24.22.0 typecheck, 86/86 automated tests and production build pass in the separate source copy. Source hashes match the current app; the original running app remains healthy. Evidence: `cpe-evidence/2026-10-28-final-day-plan/backend-baseline-followup.json`; raw logs beside the private checkpoint. Candidate integration, browser/phone acceptance and physical checks remain pending. Preserve a combined revision and local video backup when those gates are met.

## Backend reconciliation findings — 28 October follow-up

Read-only comparison against the exact candidate SHA above found these concrete conflicts. This is a targeted review, not an exhaustive candidate security audit. Other AI still owns integration; no candidate source or migration has been applied here.

| Candidate difference | Required reconciliation and acceptance |
| --- | --- |
| Strict telemetry objects omit current `security_state`, `cpe.measurements`, motion, ACS ADC/range and LTE diagnostic/destination fields; current helpers/guards are also absent. | Retain current firmware compatibility and independent measurement validity checks. Run existing CPE tests against the combined contract, including null/fault ACS, signed qualified range, historical replay and three-state FSM. Do not replace the contract with the candidate version. |
| Fleet GPS reads the latest raw record instead of using current `GpsTracking.latest`; energy calculation uses PV input fields instead of current `sourcePower`. | Preserve quality-filtered GPS/labelled last-known behavior and validated PZEM MPPT-output energy. Run GPS degradation/recovery and channel/energy tests. Raw GPS records are not automatically live track points. |
| `/api/users`, `/api/assign`, `/api/invite` change operator/admin permissions to admin-only; identity/startup acquire new account-state/migration dependencies. | Preserve approved role permissions and organization/assignment denials; reconcile account lifecycle/schema changes explicitly in the isolated integration copy. Inspect migrations 005–016 before startup can run them, using a disposable database first. |
| Current `/api/cpe-uplink/:id` address discovery and its configuration hook are absent. | Preserve authorized LTE destination discovery and actual device receipt checks. The temporary ingress serves devices; it is not a remotely accessible browser app or a downstream command channel. |

Current command-path evidence: `firmware/solair-cpe/engine.h` parses security commands in the Serial loop; transport sends telemetry upstream and removes queued frames after HTTP success. `cpe.alarm.feedback` remains null. There is no basis to claim wireless arm/disarm or instrumented physical siren confirmation.

## Mobile view — requested 28 October

User clarification: they want a **live interactive mobile view**, with local access sufficient for now. Open the existing app in Orca's live browser at a phone-sized viewport; screenshots alone do not satisfy this request. After combined integration and acceptance, repeat with the actual combined application. Record the source revision and tested URL. A localhost URL or device-only ingress is not a phone-accessible application link; actual phone access needs a reachable application address. Do not publish another website to provide this preview.

Check a narrow phone viewport (390 px) and the group's actual phone when available: login and role access, driver dashboard, operator fleet/map/history, notifications and permitted engineering controls. Verify readable invalid/stale/source labels, navigation, scrolling and usable buttons without horizontal page overflow. Preserve ACS nulls, GPS fix/freshness, exact FSM states and the distinction between USB commands, requested operations and device reports on mobile too. Capture hardware mode honestly, including unavailable data; label any separate demo view. A browser viewport check is software evidence; actual phone and device acceptance remain separate.

Frontend integration and appearance remain with the other AI. Live local preview of the current app can be provided before integration; the final combined mobile presentation remains pending the integration owner and acceptance.

Live local preview opened 28 October in Orca browser page `2645df53-aa61-483e-b295-364bc98ce618` at `http://localhost:3000`, viewport 390 × 844, using the existing Driver login and hardware mode. Home loaded with the approved vehicle image and no horizontal page overflow. Device records shown are explicitly stale/offline (latest displayed 25 October), not new live telemetry. This is an interactive current-app preview, not combined integration, full mobile navigation acceptance or physical evidence. Existing local server and device-only ingress remain running; no public tunnel/deployment added.

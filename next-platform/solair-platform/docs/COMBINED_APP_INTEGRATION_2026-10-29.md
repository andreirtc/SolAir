# Combined SOLAIR application · 29 October 2026

The authoritative app at **http://localhost:3000/** now combines the current CPE/backend/SOC/TTE implementation with frontend revision `e8967336906e023cfeaba134705fcdb3e33fbc60` from `feature/solair-quality-ui-updates-2026-10-26-v2`. All application work remains in `next-platform/solair-platform`. The separate candidate preview on 3100 is historical; use 3000 for the combined app.

This was an inspected source reconciliation in an isolated checkout, followed by controlled application to the current working copy. No unrelated-history Git merge, branch switch, commit or push was performed. Existing frontend appearance and approved BEMAC artwork were retained; the necessary mobile Security sizing correction adds no redesign.

## What was reconciled

| Area | Combined behavior |
| --- | --- |
| SOC and time to empty | Functional `BatterySummary` on Driver Home and Energy; engineering reference and SOP 4 forms remain in CPE Lab. The server computes estimates from an explicit SOC/capacity reference and validated continuous signed current. Missing/invalid/stale/restarted history keeps values unavailable. No voltage-to-percentage guess or validated-model claim. |
| Telemetry and current | Current CPE diagnostics, independent measurement declarations, ADS freshness/range checks, source/transport/boot/sequence/time and strict null ACS rules coexist with candidate alarm identities/sensor-age/event metadata. Uncalibrated diagnostic conversion is excluded from canonical current, energy and SOC/TTE. |
| Commands and alarm | `DISARMED`, `ARMED`, `TRIGGERED` remain exact. TRIGGERED persists after the bounded output pulse. USB requested commands, actual device reports and physical siren feedback remain separate; wireless arm/disarm is not implemented. |
| Acceptance and replay | USB RX is separate from durable matching server acknowledgement. Pending/queued/rejected/mismatched/failed uploads do not count as accepted. Historical/archived events do not refresh live readings or feed SOC/TTE/GPS/energy. |
| GPS and energy | Shared GPS quality/capture-time gates retain labelled last-known positions and track gaps. Validated MPPT-output power remains distinct from PV input. Energy integration does not bridge a reboot. |
| Accounts and other modules | Candidate account/profile/notification/registration/incident APIs coexist with existing authenticated, organization/assignment-scoped APIs. Existing scoped operator permissions are retained; new administrative/elevation actions stay protected. Research evidence survives account lifecycle actions. |
| Storage | Candidate additive migrations 005–016 coexist with current research migration 017 and explicit research privacy migration 018. Serialized SQLite transactions and PostgreSQL RLS remain. |

## Verification

- Node **24.22.0**; TypeScript and production build passed in the isolated checkout and again in the authoritative app.
- **246/246** unit/API tests passed with one test file at a time to avoid a transient parallel fixture connection reset. **59/59** PostgreSQL-compatible CPE/research/operations/account tests passed. The cross-boot energy regression passed with SQLite and PGlite.
- Actual combined browser: **18** observations passed across normal Driver/Operator/Engineer/Admin login, scoped API checks, mobile Home/Energy/SOC/TTE, Security, map/history, notifications/settings and engineering research/reference forms. No page errors or horizontal mobile overflow.
- Intercepted CPE browser fixtures passed USB forwarding-off, persisted acknowledgement/queue/failure distinctions, LTE time/address sync, exact FSM/physical feedback separation and GPS quality/freshness. These fixtures did not operate hardware or write hardware evidence.
- Migration was tested first against a private database copy. At cutover, all values in **151,872 existing rows across 22 existing tables** were preserved; integrity was `ok`, with zero foreign-key failures. Existing password hashes, sessions, device credentials and stored evidence were not replaced with preview data.
- Application/TypeScript lint scope passed. Full repository lint additionally reports historical CommonJS/static-guide fixture errors; those old guide scripts were not rewritten as part of this integration.

Evidence and exact software limits: [`cpe-evidence/2026-10-29-combined-integration/integration-summary.json`](cpe-evidence/2026-10-29-combined-integration/integration-summary.json), with logs and browser reports beside it. No private configuration or database is included in that folder.

## Runtime and rollback

Start the existing local app with the existing `scripts/start-local.sh` or `npm run dev`; Node24 is required. Keep device-only ingress on 3003 pointing to 3000. The integration review process on 3200 uses its own database copy and is not the device backend. Existing public documentation sites are separate from this application.

Private cutover checkpoint: `.tools/backend-ui-integration/cutover-20261028T200825Z/`. It contains source-before archive, file/hash promotion plan and the fresh original SQLite backup. Earlier complete source checkpoint: `.tools/backend-ui-integration/20261028T192916Z/`. These remain local/ignored; do not upload them. A deliberate rollback must stop the app and restore matching source/dependencies/database together, including removing only files identified as newly imported in the promotion plan. Do not copy a backup over a running database.

Firmware, GPIO architecture, private configuration and credentials were not imported from the candidate or uploaded to hardware. Final combined freeze still requires actual role/phone acceptance and genuine USB-forwarding-off LTE receipts, fresh GPS/map/history, physical alarm/FSM events, reconnect/stale/replay and saved-record checks. ACS accuracy remains mandatory and unresolved; neither software tests nor this integration create a physical PASS.

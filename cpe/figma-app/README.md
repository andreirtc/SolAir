# SolAir local operator login

**Current implemented architecture:** ESP32 → bearer-authenticated HTTP POST → receiver → validation → SQLite → operator-authenticated SSE → dashboard. MQTT is future/optional, not implemented. See [software-only hardening](docs/software-hardening.md) for separate REAL export, SNTP, durable event delivery and current validation. Physical testing is unavailable. Earlier milestone sections describe their original scopes.


This milestone adds local operator authentication to the existing persistent simulator. The real-hardware schema task remains **PARTIAL**. Nothing was deployed and no physical device commands were added.

In VS Code's integrated **PowerShell** terminal at the project root:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
npm.cmd run operator:create
npm.cmd run dev:local
```

Setup asks for your case-sensitive operator username and password interactively. Password entry is hidden (no echo or stars); enter at least 15 characters, at most 256 UTF-8 bytes, then confirm. It assigns the existing **ET-01** device. There are no default accounts, automatic accounts, public registration or mock-login bypasses. Do not pass a password as a command argument or share it in chat. If dependencies are missing, first run `npm.cmd install`.

Wait for `[launcher] Both services ready`, then open http://127.0.0.1:5173/dashboard. Use **127.0.0.1**, not localhost. Login keeps the existing design; the dashboard's user area now includes **Log out**. Existing services must be restarted by their known owner to load these backend changes; this implementation does not stop your running services or kill unrelated Node processes. Ctrl+C gracefully stops services launched by that terminal. Separate terminals may use `npm.cmd run dev:backend` and `npm.cmd run dev:frontend`.

Private local password reset:

```powershell
npm.cmd run operator:reset
```

Enter the existing username and a new hidden password. Reset preserves the device assignment and telemetry, atomically invalidates **all** sessions for that operator, and closes their open SSE streams within about one second. It works while the local backend runs. Logout invalidates the current browser session, including other tabs using that cookie; independently signed-in browsers retain their own sessions.

## Authentication storage and lifetime

Accounts and server-side sessions are stored in **data/auth.sqlite**, separately from **data/telemetry.sqlite**. The Git-ignored authentication database also contains the generated 32-byte session-signing secret, account revisions, and throttling counters. No secret is hardcoded, printed, or passed in arguments. Set `SOLAIR_AUTH_DB_PATH` to an alternate file under project data/ or an absolute external path; always use the same setting for setup/reset and startup. Never point it at the telemetry database. Protect the auth database and its WAL/SHM companions with your Windows account permissions; anyone with filesystem access to this local application can read the signing secret or change assignments. Do not share the DB, sidecars or backups, serve them publicly, or commit them. Stop all writers before backing up the database and companions together. Selecting another auth path does not migrate accounts.

Authenticated sessions have an **absolute eight-hour lifetime from login**, including across refresh/backend restart; activity does not extend it. Login rotates the session ID. Anonymous CSRF bootstrap sessions last ten minutes in storage. Cookies are HttpOnly, SameSite=Strict, host-only, scoped to /api; credentials/session tokens never go into localStorage or URLs. State-changing API calls require both the exact local frontend Origin and a session CSRF header. Login attempts are throttled; invalid credentials use a generic error. Protected APIs enforce account/device assignment in the backend, not just navigation. All API responses are no-store. Health is public and contains only an ok flag.

`dev:local` and `dev:backend` **explicitly enable local HTTP cookies**, bind to loopback, and retain strict hosts/origin. Other backend callers default to Secure cookies; direct `node backend/server.mjs` needs `SOLAIR_LOCAL_HTTP=1` for local HTTP. Production mode refuses local HTTP configuration. A future HTTPS deployment must retain Secure cookies and configure real TLS/origin/hosts and, if used, a narrowly trusted reverse proxy; no proxy trust, deployment or certificate integration was added. The current local launcher is not a production server. The old milestone notes below describe historical scope; this authentication milestone supersedes their no-authentication statements.

Details, complete route inventory, dependency rationale, official API/password references, changed files and verification limits: [local authentication handoff](docs/local-authentication.md).

Manual checklist (browser testing still needed):

1. Create your operator privately with `npm.cmd run operator:create`, then start `npm.cmd run dev:local`.
2. Try an incorrect password, then log in successfully.
3. Check live simulated telemetry, stored history, simulated-only CSV, and pause/resume.
4. Refresh and confirm the session remains signed in with saved readings retained.
5. Log out and confirm /dashboard requires login again. Optionally keep a second tab open and confirm it also clears.

# Persistent local telemetry (preserved milestone)

Use Node.js 24+ (tested on installed 24.18.0). In Windows PowerShell:

```powershell
npm.cmd run dev:local
```

Run this in VS Code's integrated **PowerShell** terminal opened at the project root. Keep that terminal open and wait for `[launcher] Both services ready` before opening the dashboard. The combined launcher runs Express and Vite's existing Node API in one Node process, prints service names, and waits for both listeners before announcing readiness. A startup failure prints the service, error and exit code 1, then closes resources it acquired. It does not kill port owners or use a Windows shell to start another service process. Individual frontend/backend commands remain available.

To stop, press Ctrl+C in that terminal and wait for `[launcher] Services stopped.` If Windows asks `Terminate batch job (Y/N)?`, answer Y. Do not use terminal deletion, a coding-tool timeout or forced process termination as a substitute for graceful shutdown. Environment variables `SOLAIR_SIMULATOR_PAUSED` and `SOLAIR_DB_PATH` still apply. The launcher does not alter the selected database or migrate records.

Isolated diagnostic example (temporary file, alternate ports; does not use the working database):

```powershell
$env:SOLAIR_DB_PATH = Join-Path $env:TEMP ('solair-test-' + [guid]::NewGuid().ToString() + '.sqlite')
$env:SOLAIR_SIMULATOR_PAUSED = '1'
npm.cmd run dev:local -- --backend-port 13001 --frontend-port 15173
```

After stopping that diagnostic run, remove those environment overrides with `Remove-Item Env:SOLAIR_DB_PATH, Env:SOLAIR_SIMULATOR_PAUSED` before normal startup. Port flags apply only to the combined launcher; its local proxy/origin/host settings follow the chosen ports. A conflict fails startup rather than selecting another port automatically.

Dashboard: http://127.0.0.1:5173/dashboard. Ctrl+C stops both owned services. Separate terminals may use `npm.cmd run dev:backend` and `npm.cmd run dev:frontend`. `npm.cmd run dev` is frontend-only and requires the backend. If dependencies are missing, use `npm.cmd install`. The production build is a frontend artifact, not backend deployment. Services bind to 127.0.0.1; Vite proxies `/api`, uses strict port 5173, and preserves host/origin restrictions. No permissive CORS. EADDRINUSE means stop the known service yourself; the launcher never kills unrelated processes.

## Storage flow

Every 3 seconds, the backend creates a SIMULATED fixture and validates the shared proposed contract. A SQLite transaction checks the highest sequence for the source/device/session identity and inserts the complete validated message and receipt. It commits before changing accepted state or sending SSE. Stored append-only records are durable ordering state; UNIQUE(source, device_id, session_id, sequence) also prevents duplicates. Gaps are allowed; equal/lower sequences are rejected across restarts.

Records have stable integer IDs, schema version, source, device/session/sequence, original sender UTC time, original server receipt UTC time, and canonical JSON containing all validated fields. JSON preserves null, zero and false and reconstructs the accepted message. Unknown extra fields are removed by validation. Database schema version 1 is separate from proposed telemetry contract version 1. Initialization creates tables/indexes without deleting data and refuses unsupported newer database schemas.

Rejected messages leave accepted readings, receipt, counts and ordering unchanged. Valid acceptance clears validation errors. Write failure reports a separate storage error in the dashboard, console and health endpoint, leaves accepted state unchanged, and never falls back to memory. A later successful commit clears storage errors. Startup database failure stops startup. No public ingestion endpoint exists.

Startup restores the latest sample and lifetime stored count with the ORIGINAL receipt time. Loading, reconnecting and heartbeats never make it fresh. Accepted since backend startup starts at zero; errors/pause are transient. A restarted simulator gets a new UUID session and a new sequence. Refresh/navigation retain backend state. Historical samples lost by the earlier in-memory version cannot be recovered and are not recreated.

## Database, disk growth and safe backup

Default: `data/telemetry.sqlite`, relative to project root regardless of terminal directory. Set `SOLAIR_DB_PATH` to another file under project `data/`, or an absolute path outside the project. Other project-local locations are rejected. Missing parent directories are created. Database/sidecars are ignored by Git, blocked from Vite serving, and excluded from frontend build assets.

SQLite uses WAL journaling and FULL synchronous commits; `telemetry.sqlite-wal` and `telemetry.sqlite-shm` may exist beside the database. No automatic purge. At one sample every 3 seconds, 28,800 records/day can accumulate; records, indexes and WAL consume growing disk space. Pause when logging is not needed and monitor free space. This is local development storage, not cloud hosting or authentication.

Safe backup: stop ALL SolAir backends cleanly with Ctrl+C and confirm they have exited. While every writer stays stopped, copy the database and any remaining -wal/-shm companions together into a dated backup directory. Do not copy just a live database or delete sidecars. To inspect/restore a backup, stop all backends first and select the copied database using SOLAIR_DB_PATH; preserve the original files. CSV is not a complete database backup.

Inspect persistence before new samples arrive:

```powershell
$env:SOLAIR_SIMULATOR_PAUSED = '1'
npm.cmd run dev:local
```

For separate services, set this in the backend terminal before `npm.cmd run dev:backend`. Resume with the dashboard button. To restore normal startup, stop services then `Remove-Item Env:SOLAIR_SIMULATOR_PAUSED`. A custom path example is `$env:SOLAIR_DB_PATH = 'data/my-telemetry.sqlite'`; selecting another path does not migrate existing data.

## History and CSV

Expand Telemetry history on the dashboard. It shows ten recent stored records with IDs, source, sender/receipt UTC times and key measurements, plus loading/empty/error states. Older records advances through stable descending ID pages; Refresh recent records starts a new snapshot. New samples do not shift existing pages. This history is separate from fixed example tamper/alert history. Simulated records are prominently labeled; future device-shaped records are labeled as unauthenticated metadata.

Export simulated telemetry CSV downloads ALL stored source=simulated records at download start, across every history page, ascending by ID. Future device records are excluded. Filename contains SIMULATED. Columns include explicit units, record/schema identity, device/session/sequence, sender/receipt UTC ISO timestamps and every measurement/status. Null exports blank, zero exports zero, booleans export true/false. Text fields escape commas/quotes/newlines; potential spreadsheet formulas are prefixed with an apostrophe. Risky identity text therefore differs from raw JSON in CSV.

Export captures an immutable append-only ID watermark and streams batches of at most 250 with backpressure and a final row-count check. There is no row cap/truncation. X-Telemetry-Record-Count gives expected rows. One export runs at a time; another receives 503 and can retry. Storage/connection failure aborts a download. A browser may retain an interrupted partial file; retry and compare row counts. Do not externally edit/delete rows while services run: snapshots rely on append-only storage.

## API and preserved scope

- GET `/api/health`: public minimal ok flag; 503 after failed write until successful commit.
- GET `/api/telemetry/latest`: accepted message/receipt, lifetime count/storedCount, sessionCount, pause/errors. Empty database has null message/receipt and count zero.
- GET `/api/telemetry/stream`: initial snapshot and SSE state updates, maximum 32 clients. Slow clients disconnect on backpressure; EventSource automatically reconnects.
- GET `/api/telemetry/history?limit=10`: descending stable IDs; limit 1–100. Returned snapshot and nextBefore feed subsequent requests with snapshot and before=nextBefore.
- GET `/api/telemetry/export.csv`: simulated-only streamed snapshot.
- POST `/api/simulator/pause` or `/resume`: assigned-operator local controls requiring session, CSRF header and Origin http://127.0.0.1:5173.

All v1 simulator samples are SIMULATED UI fixtures, not hardware measurements or experimental evidence. MQTT remains offline, GPS simulated, Time-to-Empty null, security controls send no physical commands. Reported security stays separate from local demo controls. Chart/map imagery and tamper/alert history remain fixed examples. Contract v1 remains PROPOSED, awaiting firmware-team agreement. Provisional receipt-age timings: WAITING before a sample; UPDATING under 10 seconds; STALE at 10; DISCONNECTED at 30. SSE connectivity is separate; paused data keeps aging and outdated readings stay visible. Resume waits about 3 seconds. There is no browser fallback.

## Dependencies and limitations

No dependency or upgrade was added for this milestone. Node 24.18.0 includes node:sqlite / DatabaseSync; [official documentation](https://nodejs.org/download/release/v24.18.0/docs/api/sqlite.html) labels it Stability 1.2 — release candidate, not yet stable. Operations are synchronous and can briefly block the local backend as data grows. Storage/driver details are isolated in backend/telemetry-storage.mjs for future migration. Existing Express and built-in TypeScript stripping remain unchanged. No authentication, real MQTT, hardware commands, deployment, automatic retention policy or paid service was added.

## Checks and manual testing

```powershell
node scripts/check-telemetry-simulation.mjs
node scripts/check-telemetry-contract.mjs
npm.cmd run check:backend
node scripts/check-telemetry-storage.mjs
node scripts/check-auth.mjs
node scripts/check-dev-local.mjs
npm.cmd run build
```

Database checks use temporary authentication and telemetry databases, never the working databases. Backend, storage and launcher checks create private temporary fixture accounts and perform real login. Coverage: HTTP/SSE/origins, cadence/pause/resume, restart receipt/order/count, new sessions, uniqueness, actual SQLite failed-insert rollback, null/zero/false, stable history/export snapshots, simulated-only CSV, escaping/formula protection and multi-batch export. These do not mount React or prove visual layout/download behavior.

Manual checklist:

1. Resume, wait for samples, expand history; check SIMULATED labels, UTC timestamps, units, Older records and refresh. Alerts stay fixed examples.
2. Pause; note readings, receipt and lifetime count. Stop backend and restart with SOLAIR_SIMULATOR_PAUSED=1. Reconnection should restore those values, current-startup count zero and age continuing. Resume; a new sample saves after about 3 seconds.
3. Download CSV; verify SIMULATED filename, UTC identity/time columns, rows across pages, blank unavailable fields and literal zero. Pause first for static comparisons.
4. Refresh, switch four tabs and expand/return from map: persistence remains. Pause ages to STALE/DISCONNECTED at 10/30 seconds while SSE stays connected. Security remains local demo controls.

Original Figma design: https://www.figma.com/design/P5D52CMFozrLQI4zm52fpY/SolAir-Software-Design.

## Milestone progress

- **Validated — default simulated Device diagnostics (2026-10-10), awaiting your browser test:** diagnostics flow, authentication, four telemetry checks, local launcher and production build passed using temporary test databases. Expand Device diagnostics below telemetry history, then explicitly start the simulator. No new dependencies; synthetic events remain bounded/in-memory and excluded from CSV. Separate concurrent bench-mode edits were preserved and are outside this simulation verification.

- **Implemented — Device diagnostics (2026-10-09), awaiting browser testing:** separate provisional v2 validator/receiver, authenticated SSE and opt-in backend fixtures, independent heartbeat/report/valid-IMU ages, faults and bounded injected-event history. No dependencies added. MQTT remains future/optional. The subsequent opt-in HTTP receiver and durable tamper logging are implemented; physical sensor validation remains pending. See the diagnostics handoff below.
- **Complete — persistent local telemetry, history and CSV (2026-10-08):** user confirmed browser checks for telemetry history, CSV download and resume all passed. Earlier persistence verification is recorded in `data/verification/report.json`; its 1,842-row comparison retained the original receipt/count and matched history/CSV records. These are simulated software records, not hardware evidence.
- **Complete — combined Windows development launcher (2026-10-08):** isolated startup, failure/conflict cleanup, input-lifecycle and actual PTY Ctrl+C checks passed; see [launcher investigation](docs/dev-local-investigation.md) for evidence and limits. All four telemetry checks and the build passed. No dependencies were added.
- **Future deployment requirement:** provide a short, memorable public URL for the completed PWA. Deployment is outside this milestone; nothing was deployed.

## Telemetry field mapping and firmware handoff

[Canonical field mapping revision 1](docs/telemetry-field-mapping.md), [firmware fill-in checklist and forecasting collection decisions](docs/telemetry-firmware-handoff.md), [proposed contract v1](docs/telemetry-contract.md), and [SIMULATED review JSON](docs/telemetry-review-simulated-v1.json) form the documentation handoff (2026-10-08). The sample comes from the existing saved persistence capture and passed the current validator; no working database or service was opened for this review.

**PARTIAL ? Create dashboard/database telemetry schema using real SOLAIR fields:** software simulation, backend/SSE, SQLite history and simulated-only CSV are complete; actual sensor sources/model/interfaces, calibration, CPE/firmware agreement, hardware agreement, calibration and research experiment/endpoint rules remain pending; software firmware/network/fault reporting is implemented. This documentation adds no payload fields, migration, forecasting model, hardware commands or authentication. Missing external audit/workspace references are recorded explicitly in the mapping. No production build or browser retest is required for this documentation-only milestone.

## Device diagnostics

See [diagnostics startup, browser checklist and limitations](docs/device-diagnostics.md). Diagnostics begin stopped; expand Device diagnostics in the dashboard and explicitly start the synthetic backend simulator. Run the new focused check with `node scripts/check-diagnostics.mjs`.


## Real ESP32 bench demo - October 9, 2026

Follow [docs/hardware-demo.md](docs/hardware-demo.md) for opt-in real Wi-Fi ingestion, firmware, wiring, private provisioning, upload and verification. Real v2 diagnostics/events use a separate database. Earlier no-hardware implementation scope is superseded for this authorized bench milestone; physical tests remain pending. Existing v1/examples and operator auth are preserved.
# ET-01 first CPE milestone — October 10, 2026

Current next step: [staged input/LED demonstration and protected HW-548 checks](docs/staged-bench-integration.md). ET-01 now has a compact monitoring overview; detailed diagnostics/history remain expandable. New `firmware/build.ps1 -BenchIndicator` is an opt-in compile configuration for verified input wiring and an LED-only output; no upload or physical verification is performed by the build.

Start with the [Windows team handoff and DP1 checklist](docs/et01-cpe-handoff.md), [corrected HW-548 wiring gate and upload procedure](docs/hardware-demo.md), and [unexecuted physical evidence template](docs/et01-physical-evidence-template.md). Existing architecture/databases are preserved. GPS/energy/LTE and fleet/PWA work remain subsequent milestones. Physical end-to-end demonstration is pending.

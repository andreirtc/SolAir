# Local operator authentication milestone

**Current implemented architecture (October 10 software hardening): ESP32 → bearer-authenticated HTTP POST → device receiver → validation → atomic SQLite commit → operator-authenticated SSE → dashboard. MQTT is future/optional only. Physical testing is unavailable and has not been performed. See [software hardening](software-hardening.md) for current clock, queue, export and freshness rules.**


Operator sessions protect the ET-01 simulator and opt-in real diagnostics/export. Separate bearer-token binding authorizes ET-01 HTTP ingestion; source metadata alone does not authenticate hardware. The real-hardware schema milestone remains **PARTIAL**. No MQTT, hardware command, registration, cloud service or deployment was added.

## Route inventory and policy

Before implementation the entire backend consisted of health, latest, SSE, history, CSV, and the simulator action route. No ingestion route exists.

| Route | Access |
| --- | --- |
| GET /api/health | Public, only `{ok: boolean}`; 503 on storage failure |
| GET /api/auth/session | Public bootstrap/session inspection; supplies synchronizer CSRF token |
| POST /api/auth/login | Exact configured Origin + session CSRF token + bounded credentials + throttle |
| POST /api/auth/logout | Exact Origin + session CSRF token; destroys current session |
| GET /api/telemetry/latest | Authenticated operator assigned to backend ET-01 |
| GET /api/telemetry/stream | Same assignment; checks before each delivery and once per second |
| GET /api/telemetry/history | Same assignment; SQL filters by server-resolved device |
| GET /api/telemetry/export.csv | Same assignment; SQL filters by device and simulated source; rechecks between batches |
| POST /api/simulator/pause | Same assignment + exact Origin + CSRF token |
| POST /api/simulator/resume | Same assignment + exact Origin + CSRF token |
| Other simulator actions / API paths | JSON 404 after applicable access checks |

Missing/expired/revoked sessions receive JSON 401. An authenticated operator assigned elsewhere receives JSON 403; this single-device backend does not serve the other device. Browser-supplied device IDs do not select data. Restored latest/count, history watermarks/rows and CSV batches are device scoped. SSE binds the server-resolved device and session, checks durable account revision/expiry, and ends with an `auth-required` event on revocation. Logout from another tab and password reset therefore close an already-open stream within about one second; no new telemetry is sent after failed checks. The same rules apply to direct requests and Vite proxy requests.

All API responses use `Cache-Control: no-store`. Session tokens are only in an HttpOnly, SameSite=Strict, host-only cookie scoped to /api. The frontend stores neither credentials nor session tokens in localStorage or URLs. CSRF tokens stay in React memory and request headers. The app checks the session before mounting protected views and opening SSE, restores after refresh, and unmounts protected telemetry/history on sign-out. Network failures have a separate message and do not claim that the session expired. Mock onboarding/pairing routes redirect to authenticated navigation; public sign-up is disabled. Logout uses the existing dashboard user area.

## Configuration verified against official guidance

- [express-session API and store contract](https://expressjs.com/en/resources/middleware/session/): `regenerate`, `save`, `destroy`, Store `get/set/destroy/touch`, `resave:false`, `saveUninitialized:false`, `rolling:false`, cookie settings. Added direct dependency **express-session 1.19.0** (nine packages including its dependencies). SQLite Store is a small adapter to existing Node SQLite; session IDs/signatures come from the maintained middleware, not custom cryptography. MemoryStore is not used.
- [Node 24.18.0 crypto](https://nodejs.org/download/release/v24.18.0/docs/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback) and [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt): asynchronous scrypt, N=2^17, r=8, p=1, 160 MiB maxmem, unique random 16-byte salt, 64-byte key, timing-safe comparison. Installed Node is 24.18.0. This avoids a native hashing dependency and uses the established stable scrypt API; Node's Argon2 API has Stability 1.2 (release candidate) in this version. Hash version is stored with salt/key, never the plaintext password.
- Usernames: case-sensitive 1–64 ASCII letters/digits/underscore/dot/@/hyphen. New/reset passwords: at least 15 characters, at most 256 UTF-8 bytes. Login rejects malformed inputs generically, has a 2 KiB JSON limit, and checks a dummy hash for unknown users. At most two concurrent expensive password checks.
- Login attempts (including successes) are limited to ten per socket IP and per username in a fixed 15-minute window, persisted in the auth DB. Further attempts return JSON 429 with Retry-After. Vite requests share loopback IP, appropriate to this local operator milestone; this is not a deployment-scale abuse-control design.

## Files and checks

Changed/added:

- backend/auth.mjs, backend/local-server.mjs, backend/server.mjs: accounts, sessions, routes, assignment, revocation, explicit local HTTP startup.
- backend/telemetry-storage.mjs, backend/telemetry-csv.mjs: assigned-device queries; existing telemetry schema and records preserved.
- src/app/auth.tsx, src/app/App.tsx, src/app/components/LoginScreen.tsx, src/app/components/DashboardScreen.tsx, src/app/components/TelemetryHistory.tsx, src/app/hooks/useSimulatedTelemetry.ts: session gate/login/logout, protected fetching, SSE cleanup, preserved login styling.
- scripts/operator-setup.mjs, scripts/auth-test-client.mjs, scripts/check-auth.mjs: private account setup/reset and isolated tests.
- scripts/check-telemetry-backend.mjs, scripts/check-telemetry-storage.mjs, scripts/check-dev-local.mjs, scripts/dev-local.mjs: real fixture authentication and explicit local launcher mode.
- package.json, package-lock.json, README.md, AGENTS.md, this document: dependency, commands and handoff.

Automated authentication fixtures and telemetry records use only temporary SQLite databases. Backend/storage/launcher tests authenticate through real login; no test bypass exists. Secure-cookie emission is checked by simulating Express's encrypted-transport flag, not by deploying HTTPS. Existing launcher checks use injected SIGINT, not actual terminal Ctrl+C. Browser rendering, private terminal entry, browser multi-tab/logout behavior and download UX still require manual testing.

Final validation on 2026-10-08 passed: `node scripts/check-auth.mjs`, `node scripts/check-telemetry-simulation.mjs`, `node scripts/check-telemetry-contract.mjs`, `node scripts/check-telemetry-backend.mjs`, `node scripts/check-telemetry-storage.mjs`, `node scripts/check-dev-local.mjs`, and `npm.cmd run build`. The launcher checks also deny every protected route through Vite before fixture login. Build/launcher needed execution outside the filesystem sandbox because esbuild was blocked from reading the project config. An initial launcher shutdown timeout passed on rerun; no permanent user service was stopped. No browser tests or real HTTPS integration were performed for this milestone.

During installation npm reported one high-severity advisory in the pre-existing source-map-js 1.2.1 dependency: [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). No unrelated dependency upgrades were applied. The frontend build retains its existing large-chunk warning.

# Device diagnostics handoff — 2026-10-09

**Current implemented architecture (October 10 software hardening): ESP32 → bearer-authenticated HTTP POST → device receiver → validation → atomic SQLite commit → operator-authenticated SSE → dashboard. MQTT is future/optional only. Physical testing is unavailable and has not been performed. See [software hardening](software-hardening.md) for current clock, queue, export and freshness rules.**


Historical default-simulation handoff (real HTTP mode is documented in software-hardening.md). This handoff describes `dev:local`; v2 agreement remains PROPOSED. Browser testing is pending. This simulation milestone adds no dependencies, database migrations, firmware edits, MQTT, real publishers, hardware commands or persistent tamper logging. Concurrent separate bench-mode edits were preserved; their real-device path is outside the verification reported here.

## Startup

In PowerShell:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
npm.cmd run dev:local
```

Wait for Both services ready, open http://127.0.0.1:5173/dashboard and sign in with your existing operator. If no operator exists, run `npm.cmd run operator:create` first and enter the password privately. Restart only services you own to load changed code. No existing database needs replacement.

## Browser checklist (not yet performed)

1. Expand **Device diagnostics** below telemetry history. Confirm SIMULATED DIAGNOSTICS, stopped opt-in mode, WAITING ages, unavailable vectors and UNKNOWN switches. All four existing tabs retain access to the panel.
2. Start diagnostics. Heartbeat appears immediately, sensors after 3 seconds; heartbeat repeats every 5 seconds. Check firmwareVersion, UTC receipts, vector units and literal zero axes. v1 battery/power/GPS and demo security stay independent.
3. Pause sensors only. Heartbeat keeps updating, while sensor/valid-IMU ages reach STALE at 10 seconds and DISCONNECTED/outdated at 30. Resume; select fault, then unavailable. Next sensor report shows the exact fault/status and keeps last valid IMU values explicitly outdated with their original receipt.
4. Select valid fixture, lid open/closed and mount attached/released. Next report uses OPEN/CLOSED and ATTACHED/DETACHED. No event or security transition should occur. Inject synthetic tamper events; verify injected labels, event type, null sender UTC, boot uptime and server UTC receipt. Only the newest 20 remain.
5. Pause heartbeat only: STALE at 15 seconds, absent/DISCONNECTED at 30, while sensor reports continue. Stop cancels both generation timers; displayed ages continue. Start resumes counters/readings. Navigation/refresh retains backend diagnostics; restart clears them and leaves simulation stopped.
6. Log out, including with a second tab open; protected diagnostics disappear and streams close. Sign in again. Verify existing history, simulated CSV, v1 controls, navigation and local demo security.

## Files and architecture

The implementation uses `src/app/data/diagnosticsV2.ts` for validation, receiver state, independent freshness and browser snapshot checks; `backend/diagnostics.mjs` for the opt-in simulator/routes; `backend/server.mjs` for installation and shared session-expiry/cleanup checks; and `src/app/components/DeviceDiagnostics.tsx` plus the dashboard insertion for the visible panel. Controls use authentication/CSRF; async responses are guarded, SSE closes on unmount, and a separate display clock ages paused readings. `scripts/check-diagnostics.mjs` exercises the full simulated flow. README progress and canonical documents distinguish implemented simulation from pending agreement.

Routes: GET `/api/diagnostics/latest`, `/stream` and `/events`; POST `/api/diagnostics/simulator/:action`. Every route/stream requires an operator assigned to the configured ET-01 fixture. Query parameters cannot select another device. Actions require same-origin CSRF. The default development launcher opens no external message ingestion endpoint. Authentication expiry/logout uses the existing server session checks; browser protected state is removed on sign-out/unmount. Controls affect all authorized local viewers, without altering demo security or v1 generation.

Heartbeat receipt, sensor-attempt receipt and last valid IMU receipt are separate. Fault snapshots renew only the attempt receipt; they cannot make old vectors fresh. Rejected messages retain readings, count, order and receipt; accepted messages clear that type's error. Null remains unavailable and zero remains zero. Sender UTC is null for unsynchronized synthetic messages; event uptime remains available. Raw switches/motion never create classifications. The injected event uses detectorVersion INJECTED-SYNTHETIC-NO-CLASSIFIER.

The receiver supports proposed per-type order and boot activation, but durable boot retirement/order, publisher trust and replay protection are future work. Events (maximum 20), controls and diagnostic state are memory-only. No diagnostic row enters telemetry SQLite or CSV. Timing/cadence, 5-second live timestamp tolerance, physical wiring/polarity, calibration and classifier/state policy all remain provisional. UI DISCONNECTED describes an absent report, not a broker connection.

## Verification

Simulation validation updated 2026-10-10: all checks below passed. Snapshot validation also rejects null event entries and invalid last-valid IMU records before rendering. Simulator stop/start retains the same session/counters; backend restart resets diagnostic state/history and leaves it stopped. Concurrent bench-mode boot handling clears IMU records on a new boot; the simulator does not exercise physical reboot or durable boot restoration. No working database, operator credentials or external service was used in these checks.

Results: PASS diagnostics, telemetry simulation, telemetry contract, telemetry backend, telemetry storage, authentication, development launcher and production build. Vite/launcher initially hit a sandbox parent-directory access denial; the authorized rerun outside the sandbox passed. Build retains the large JavaScript chunk warning. The storage check intentionally logs its tested failed-write condition. No browser checks were performed. Existing files could not be compared with Git because this workspace has no Git repository.

Run `node scripts/check-diagnostics.mjs`, the existing simulation, contract, backend, storage, auth and dev-local scripts, and `npm.cmd run build`. Diagnostics tests use deterministic clocks/timers for freshness and isolated temporary auth AND telemetry databases with real login for HTTP/SSE. They cover validation rejection retention, independent ages, fault/null/zero, authorization on every action/route, CSRF/origin, logout/expiry stream closure, bounded history, start/stop/pause/resume and timer cleanup. Existing tests cover affected v1 storage/history/CSV/auth/launcher behavior. These are automated software checks; they do not mount React or establish browser appearance or physical evidence.

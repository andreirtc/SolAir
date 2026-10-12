# Simulator timing investigation

The reported intermittent gap above 10 seconds was not reproduced during this investigation. No application defect or cause has been confirmed, so generation, validation, SSE, and freshness behavior have not been changed. STALE remains 10 seconds and DISCONNECTED remains 30 seconds.

> Context note ? 2026-10-08: This historical investigation describes the earlier in-memory backend. The current SQLite backend commits every accepted sample before state/SSE updates, retains acceptance history and durable ordering, and restores original receipt/count after restart. Statements below about no per-sample disk write or no retained history apply only to the investigated version. Historical timings/findings have not been remeasured. See [current README](../README.md) and [field mapping](telemetry-field-mapping.md).

## Measurements

These are local simulator software timings, not hardware measurements or research records.

- Existing backend, direct SSE, 45 seconds: accepted sequences/counts 270–285, with 15 receipt gaps of 3003–3025 ms. No validation errors; paused was false. Sender-to-receipt difference was 0 ms. Every SSE state matched the HTTP latest-state count and receipt. New-sample delivery age was 3–31 ms (the initial cached state was older, as expected).
- Existing backend through the Vite proxy, 45 seconds: accepted sequences/counts 295–310, with 15 receipt gaps of 3001–3039 ms. No validation errors; paused was false. Every SSE state matched HTTP latest state. New-sample delivery age was 5–20 ms.
- Isolated backend, real timers, 45 seconds: 14 generation callbacks, spaced 3002–3017 ms, all accepted. Sender-to-receipt difference was 0–1 ms. New-sample SSE delivery age was 5–28 ms. No errors or ordering gaps.

## Code trace and limits

`startSampleTimer` uses one `setInterval` at 3000 ms. Each backend callback increments sequence, creates a simulated message, validates it synchronously, stamps acceptance with server `Date.now()`, and broadcasts the snapshot synchronously. There is no asynchronous ingestion queue, per-sample disk write, or timer restart on SSE reconnect. The six fixture variation phases pass the contract checks.

A rejected message changes only the validation error: receipt, accepted count, readings, and ordering stay unchanged. Thus repeated rejection could create a real accepted-sample gap, but none was seen. On resume, generation starts a fresh 3-second timer. Controls are shared between local viewers; another viewer can pause the backend.

SSE sends initial cached state, state updates, and 5-second heartbeat comments. Heartbeats and cached state never renew receipt time. Backpressure disconnects a slow client; automatic reconnect retrieves latest state. Delivery trouble could make the browser show older state while the server continues accepting, but it cannot itself create a gap between server acceptance timestamps. No such trouble was observed in these runs.

A configured interval is a requested callback delay, not a deadline guarantee. Process/debugger suspension, machine sleep, event-loop blocking, or a wall-clock jump can produce longer apparent receipt gaps. These remain hypotheses for the reported incident, not established causes. There is no retained acceptance history or generation trace in the running backend, so past incidents cannot be reconstructed from its latest-only snapshot. Existing backend measurements observe acceptance and delivery; only the isolated run instruments callback timing directly.

## Capture the next incident

Run in PowerShell while using the dashboard:

```powershell
node scripts/diagnose-telemetry-timing.mjs 180000 http://127.0.0.1:3001
node scripts/diagnose-telemetry-timing.mjs 180000 http://127.0.0.1:5173
```

Use separate terminals to compare direct and proxied delivery. The explicit URL mode only reads the existing service; it never pauses, resumes, or restarts it. Output goes to the terminal and is not stored automatically. Duration is milliseconds. `--isolated` instead starts and cleans up a separate simulator on an ephemeral loopback port and reports its generation callback gaps.

Check `paused`, `validationError`, sequence/count continuity, `receiptGapMs`, and `deliveryGapMs`. An acceptance gap on both connections with consecutive sequence/count and no error points toward delayed generation or a clock change; consecutive server receipt timestamps with delayed delivery point toward transport/client scheduling. A count gap can also mean intermediate SSE deliveries were missed. Compare any incident with sleep/resume or debugger activity before attributing a cause.

All three existing focused checks and the production build passed. The build retained its existing large-chunk warning. Browser visual behavior and the original intermittent incident remain unverified.

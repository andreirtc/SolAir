> **23 October current prepared candidate: 2.0.18.** See [integrated LTE location release](LTE_LIVE_LOCATION_RELEASE.md) for permanent-host discovery, autonomous startup and retained ACS wiring. Last confirmed physical upload remains2.0.17. Older upload/version/temporary-only guidance below is historical; no automatic re-upload or bench retest is ordered.

> **Current upload: 2.0.15, superseding the 2.0.14 upload wording below.** It retains saved-address commissioning and adds the corrected clock handling and bounded binary-USB recovery. Actual uploaded2.0.14 and saved address are confirmed. Keep USB forwarding ON for the initial new capture; do not repeatedly Start/reset. A page refresh is needed once to load the changed client, not after every connection. Physical repeatability remains to be confirmed.

# LTE upload address recovery — firmware 2.0.14

This changes upload-address commissioning. It does not certify modem power, ACS current accuracy or other physical acceptance.

## Current prepared build

The integrated Arduino sketch is `firmware/arduino-ide/solair_cpe/solair_cpe.ino`. Reopen it from disk; the private configuration already contains the replacement address. Keep ESP32 Dev Module, the existing installed ESP32 core 3.3.12, actual port and existing wiring. Firmware 2.0.14 includes the prior 2.0.13 response diagnostics. Upload this integrated sketch, not a standalone diagnostic.

1. In CPE Lab, Stop LTE streaming once and Disconnect USB. Close Arduino Serial Monitor/Plotter.
2. Open the integrated sketch above and upload using the existing USB connection. This does not need a new supply connection or a 12 V change. Keep the unfinished bank disconnected and converter output disconnected.
3. Refresh localhost:3000 once to load the client update. CPE Lab: 115200 baud, Connect ESP32, keep Forward USB readings to server checked. Confirm the displayed firmware is 2.0.14 and RX sequence advances.
4. Click **Update LTE address** once. Wait for **saved on device** and the log **LTE address confirmed saved by the device**. A sent/queued message alone is not confirmation. Failure or a two-minute timeout requires inspecting the existing diagnostics; do not repeatedly reset/reflash.
5. Click **Start LTE streaming** once, unless it is already running. Leave USB forwarding on initially so failures are recorded. On a new actual 200/201 result, uncheck forwarding and keep USB connected for monitoring. New database rows marked transport LTE, not the button/GPIO or USB RX alone, establish delivery.
6. Report the test start time and any new HTTPS/AT error lines. The backend team reviews actual new receipts and gaps. No moving GPS walk or siren repetition is needed for this address repair.

## Runtime contract

- `GET /api/cpe-uplink/:vehicleId` requires an authenticated engineer/admin and organization access to that vehicle. The development server reads only the public origin in ignored `.tools/lte-tunnel-runtime/quick.json`.
- The server probes POST `/api/ingest` with empty JSON and **no token**. Expected 401 proves the restricted listener is reachable; it is not proof of valid device ingestion. Probes forbid redirects, time out after five seconds and coalesce/cache for ten seconds. Unavailable/unconfigured routes return 503 with no secrets.
- The response contains `{url, reachable:true, temporary:true, checked_at}`. Production has no implicit bench discovery provider. A permanent deployment must deliberately configure its provider/endpoint.
- USB command: `{"command":"lte_set_endpoint","url":"https://host.example/api/ingest"}` plus newline. It accepts a lowercase DNS HTTPS host and exactly `/api/ingest`, at most 240 bytes. IP literals, local names, ports, credentials, query/fragment and control characters are rejected. Shared C++/TypeScript fixtures enforce the same policy.
- The acquisition loop queues the update. The transport task saves `lte_url` in its existing NVS namespace and applies it after the current request finishes. It retains queued telemetry, credentials, CA verification, pin map, feature gates and stream intent. Telemetry reports `cpe.lte_endpoint` and `cpe.lte_endpoint_saved`. The UI waits for the reported saved address before enabling a new send/start.
- A valid saved address overrides the compiled default after boot. Invalid stored addresses are ignored. A successful host fixture or compiler result does not prove real-device flash persistence; confirm a later normal ESP32 restart when the live run is established.
- Future replacement addresses using the existing trusted CA can be saved through this button without another address-only firmware upload. A different certificate authority still needs an intentionally reviewed trust update. The feature does not make a temporary tunnel permanent or keep the laptop online after shutdown.

## Remaining final acceptance

Preserve recorded GPS, contacts, IMU, LED and alarm observations. Do not restart those basic checks. Finish the unpowered bank and verify its cold resistance/insulation using the approved full wiring guide; then perform the actual PZEM load/reference test. The current 100 ohm bank at 12 V is about 0.12 A: it cannot alone validate useful accuracy of the 50 A ACS given the observed noise. ACS still needs stable input, repeatable zero and adequately measured known-current points before enabling calibrated amperes. Exact ADS reference accuracy, carrier/USB/power/logic/protection documentation and combined recovery/soak remain release gates. Drafting the schematic may proceed with unresolved nets marked; assembly release requires closure.

## Host restart

With the app and restricted ingress already running, start `python3 scripts/start-lte-bench-tunnel.py` in a persistent terminal. It uses Cloudflare's native quick-tunnel lifecycle with automatic transport selection and records only the announced public origin, atomically, in mode-0600 runtime state under a mode-0700 directory. The compatibility `resume-lte-bench-tunnel.py` now starts this helper; it does not promise recovery of a deleted hostname. No device token or Cloudflare tunnel secret is printed or extracted. The CPE Lab probe still determines readiness before an address is offered. If provisioning exits or the probe returns 503, keep the CPE wiring and inspect the backend connection; do not diagnose this as a failed sensor or modem.

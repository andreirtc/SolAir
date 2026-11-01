## 23 October — team completion handoff and candidate 2.0.19

Latest user instruction: implement the explicit DISARMED/ARMED/TRIGGERED FSM, prepare clear team instructions with enclosure visuals and concurrent motion testing, finish real battery/ACS/PZEM measurements, and leave the final schematic to the owner after returning. User confirms BMS installed. Candidate2.0.19 now implements the FSM, independent source/quality-gated battery/solar publication, validated ACS range guards and concurrent motion-window diagnostics; backend contracts/storage/output-energy integration and functional diagnostic text are updated. Existing private calibration/motion acceptance flags remain off and no coefficients are guessed. Last confirmed physical upload remains2.0.17.

Software PASS:84backend tests,26CPE/LTE tests on PostgreSQL-compatible PGlite, TypeScript, hostC++ policy/decoder tests, isolated production build and exact Arduino core3.3.12 compile(1,226,008flash/53,152RAM). Browser fixtures cover LTE controls/map and the team guide. These are not physical acceptance. Source and secret-free downloads: [integration contract](SOLAIR_CPE_2.0.19_INTEGRATION_CONTRACT.md). Existing account-owned workbench: https://solair-cpe-workbench-oct22-rtc.sandygull6.chatgpt.site/team-handoff.html . Current publication evidence is recorded separately after deployment.

The guide gives12numbered/related sections,4nativeSVG diagrams, all branch endpoints, correct/wrong observations, finite ACS screening/calibration steps, mounted simultaneous motion procedure, DP1 FSM scope, remaining power/measurement/hosting facts and exportable local evidence checklist. Original workbench artwork/cards remain accessible. No new live application/site was created. Progress is browser-local, not a shared cloud PASS record.

ACS must still pass stable input/zero, independent references/useful signed range and power-cycle checks alongside PZEM. DP1 contact demonstration does not waive final current/motion acceptance. Protected battery power, converter/USB/isolation and branch protection facts, actual GPS/LTE/remote-driver and combined recovery remain physical/configuration work. Schematic/perfboard release stays with the owner; no partial paid soldering or release of a draft. Earlier entries below are historical; missing software publication statements describe the prior candidate.

# SOLAIR integrated LTE location release — 23 October 2026

The existing authoritative application and integrated CPE remain the one SOLAIR
system. Candidate firmware is **2.0.18**; last confirmed physical upload remains
**2.0.17**. No new site or frontend redesign is introduced.

| Path | Implementation | Evidence boundary |
| --- | --- | --- |
| NEO-6M → ESP32 | Existing GPIO32 receiver, fix/age/quality diagnostics | Prior physical observations retained; fixtures are not an outdoor route test |
| ESP32 → LTE → server | Existing UART2 GPIO13/14, PPP, CA/hostname-verified HTTPS, device-token POST, retries and atomic/idempotent persistence | No new modem wiring or actual upload claimed |
| Server → live site | Existing authorized `/api/fleet` and organization-scoped `/api/events` SSE invalidations | Existing map/client preserved; poor GPS retains a labelled last known position |
| Permanent receiver | Added configured HTTPS destination provider | Actual hosting/configuration still required |
| Autonomous streaming | Added `LTE_AUTO_START`, with saved ON/OFF overriding the default | Candidate needs upload before new behavior exists on the device |
| ACS | Existing HCW supply, 10k/10k divider and verified ADS A1 | Raw voltage available; accurate amperes remain unaccepted/null |

## Permanent backend

Use the existing [Railway/Supabase deployment](RAILWAY_SUPABASE.md) and secret-free
`.env.production.example`. Set `SOLAIR_PUBLIC_URL` to the exact permanent HTTPS
origin without a trailing slash. The upload address becomes `<origin>/api/ingest`.
Optional `SOLAIR_DEVICE_INGEST_URL` supplies a separate full HTTPS `/api/ingest`
address and takes precedence. The shared firmware URL policy rejects credentials,
ports, local names, query/fragment and unexpected paths. Invalid configured URLs
stop startup rather than falling back to a tunnel. Without configuration,
production discovery returns 503; development retains temporary bench discovery.

Engineer/admin, vehicle-scoped `GET /api/cpe-uplink/:vehicleId` returns
`{url, reachable:true, temporary:false, checked_at}` for configured hosting.
The five-second, redirect-forbidden probe sends empty JSON without credentials
and expects 401. This proves reachability only. The main ingestion application
now returns 401 before schema parsing when no device bearer/USB path is supplied,
matching the bench proxy. Probes coalesce/cache for ten seconds; failures expose
generic 503, not private provider details. No device token is sent during probing.

This workspace has no configured permanent origin, PostgreSQL URL or Supabase
credentials. No service deployment or public launch was performed. A temporary
laptop tunnel cannot continue after that laptop stops.

## Continuous firmware operation

The prepared sketch is `firmware/arduino-ide/solair_cpe/solair_cpe.ino`, generated
from `firmware/solair-cpe`. The ignored integrated Arduino configuration already
had LTE/HTTPS enabled; only `LTE_AUTO_START=true` was added. Existing credentials,
CA, endpoint, interface flags and calibration are preserved and never packaged.
Public examples keep hardware gates disabled and `LTE_AUTO_START=false`.

With the existing commissioned LTE/HTTPS/PPP settings and `LTE_TEST_ONLY=true`
(the existing name means Wi-Fi is disabled), a fresh device can start continuous
LTE without a browser command. Saved ON resumes; saved OFF remains stopped after
reset and overrides automatic startup. ONCE never saves continuous intent. An
explicit first OFF now writes the preference even when the key is absent, fixing
an autostart/reset corner case. Local alarm still boots DISARMED; no ARM or
electrical gate is changed.

Saved endpoint overrides compiled endpoint. Once permanent hosting exists, the
existing CPE Lab **Update LTE address** saves that address over USB and waits for
device acknowledgement. Normal operation then needs LTE, not USB or a browser.
Retain a trusted CA appropriate to the actual host; never disable verification.
Existing Arduino ESP32 core 3.3.12 supports this PPP build. No pin, partition or
power change is required by the software update.

Acquisition targets a two-second heartbeat; accepted delivery cadence depends on
network/request/backoff time. Ordinary queued snapshots coalesce to the latest;
bounded security events remain recoverable and historical events cannot refresh
the live marker. Existing modem/PPP time acquisition and verified HTTPS Date
correction remain; no synthetic position or browser command is needed for normal
autonomous time acquisition.

## ACS placement retained

Existing 12 V bench connections, based on the user's reported solder completion:

| Endpoint | Connection |
| --- | --- |
| Small VCC | HCW 5 V positive rail, separate from independent USB positive rails |
| Small GND | Shared HCW/ESP32/ADS ground |
| OU1/OUT | Upper 10 kΩ resistor leg 1 |
| Upper 10 kΩ leg 2 | ADS A1 + existing reserved GPIO34 wire + lower 10 kΩ leg 1 |
| Lower 10 kΩ leg 2 | Shared ground |
| Bank return | Large IP+ via soldered current lead |
| Large IP− | Shunt large LOAD-side connection |
| Shunt large SOURCE-side connection | Existing adapter negative return |

GPIO34 remains wired/reserved but is not sampled in ADS mode. The IP pair is in
series, never across source +/−. No additional filter is a prerequisite. Supplied
A1 1.1641 V implies approximately 2.3282 V before the nominal divider, not accepted
amperes. No guessed zero/slope or calibration PASS was introduced; GPS/LTE uses
independent sensor quality and continues while ACS current is invalid.

Final shared-battery concept: protected battery P− through its negative connector
→ IP+ → IP− → common negative distribution block; PZEM stays on the solar branch.
This placement is not a release to energize the unresolved 48 V harness. Primary
lead/connector/protection/grounding facts remain in the assembly register; do not
transfer the small bench leads or apply 48 V to the HCW. No battery rewiring is
requested in this software release.

## Verification contract

Disposable SQLite/PostgreSQL-compatible fixtures test actual application probing,
provisioned-token LTE ingestion, movement, driver/operator fleet reads, scoped SSE,
other-organization isolation, retries, fix loss, historical events and boot reset.
Host C++ fixtures test autostart/ON/OFF/one-shot and TLS/recovery policy. Latest
results are recorded in `CPE_VALIDATION.md`. Compilation/fixtures do not certify
physical current accuracy, a real firmware upload or hosted cellular operation.

Production dependencies were patched to Next.js16.4.2 and express-rate-limit8.7.1
(with lockfile) after an independent audit confirmed the startup warning. The
production-only audit now reports zero vulnerabilities. Node24 typecheck/lint,
production build and all79 automated tests pass; Arduino3.3.12 candidate compile
uses1,224,056 flash bytes and53,112 RAM bytes. No physical upload is claimed.

Browser completion: existing LTE controls fixture PASS; production-built map fixture PASS for SSE movement without reload, GPS-quality loss retaining last known location, timer-based stale expiry and tile failures. Every browser API/tile/serial input was intercepted; no physical modem/database readings were manufactured. The isolated in-memory production preview on3007 was stopped. New LTE end-to-end fixture passes again on PostgreSQL-compatible storage after dependency updates. Reproducible source hashes, secret-free build/test logs and acceptance boundaries: docs/cpe-evidence/2026-10-23-final-lte-software-results.json.

# SolAir CPE laboratory review and connection guide

**Reviewed: 11 October 2026, Asia/Taipei. Scope: inspection, isolated verification and guidance only.**

Software reviewed: `C:\Users\Anyang\SolAir\figma-app`. Additional diagnostic firmware: `C:\Users\Anyang\SolAir\firmware`. This guide does **not** describe the separate project under `Videos\SolAir\solair-platform`.

No application behavior, firmware source, GPIO configuration, credentials or database schema was changed. No firmware was uploaded and no hardware output was activated. Working databases were not opened for review or injected with synthetic messages. Existing modified/untracked files were preserved. Commands in the laboratory procedure are **future team actions**, not actions performed by this review.

Navigation: [verdict and evidence](#read-this-verdict-first) · [connection path](#the-actual-connection-path) · [data, persistence and time](#what-travels-persists-and-resets) · [alarm cutoff](#alarm-behavior-and-the-cutoff-review) · [conditional wiring](#conditional-breadboard-wiring) · [nine test stages](#staged-laboratory-procedure) · [feature inventory](#current-screen-and-feature-inventory) · [people and permissions](#people-enforced-permissions-and-suggested-workflows) · [missing information/proposals](#missing-hardware-information-and-prioritized-proposals).

Beginner terms: **telemetry** is sensor/status data sent to the computer; **backend** is the PC program that validates and stores it; **heartbeat** is an identity/liveness message rather than a sensor measurement; **UART** is the hardware serial interface used through the USB bridge. MQTT is an alternative messaging protocol, not the current transport.

## Read this verdict first

The current software is ready for a **conditional, low-voltage ET-01 integration test**: MPU6050 and switches → ESP32 → private Wi-Fi HTTP (a request sent over the network) → authenticated receiver → SQLite (a database saved as a local file) → signed-in operator dashboard. It also has local ARM/DISARM and a timed output path. Firmware means the program executed by the ESP32. A finished hybrid-energy, GPS/LTE, multi-role fleet/PWA system is **not** implemented in this codebase.

Two practical gates remain before the integrated test: approve/reconstruct the actual wiring, and provision the private network settings. At inspection, `figma-app\data\device-token.txt`, `firmware\anti-tamper\secrets.h` and the working real-device database were absent. Current firmware defaults remain `SOLAIR_WIRING=0`, `SOLAIR_SIREN=0`, `SOLAIR_MOTION=0`. Consequently the default build deliberately blocks sensor wiring, leaves the output disabled and has no network credentials. These are safety gates, not evidence of broken hardware.

Do the input-only test first. Keep the HW-548 and actual siren disconnected until the hardware lead approves their specific interface, supply and protection. Compilation, HTTP 202 and a REAL DEVICE label do not prove physical measurements or siren operation.

### Evidence categories used here

| Category | Meaning | Current examples |
| --- | --- | --- |
| **A — checked now** | Source inspected and relevant software check executed in this review; physical operation is not implied | Validator/identity/authorization, SQLite rollback/restart, duplicate handling, source separation, session/logout, frontend build, portable firmware helper tests, isolated browser fixture flow; firmware compile results below |
| **B — previous reports only** | Prior document/user report, not a measurement repeated now | `staged-bench-integration.md` reports previous USB/programming, MPU readings and COM/NO continuity checks; original physical evidence was not independently verified. README also reports earlier v1 browser history/CSV/resume and terminal Ctrl+C tests; those reports were not repeated now. Previous timing captures are historical, not remeasured |
| **C — awaiting tests** | Code exists, but the actual device/module/end-to-end path remains unverified | Upload/execution on the team's ESP32, actual IMU/switch readings reaching this dashboard, Wi-Fi/NTP, physical reset/NVS recovery, GPIO cutoff, HW-548/siren, manual terminal Ctrl+C and full browser reconnection/download/error scenarios |
| **D — demonstration only** | Explicit software examples, not device/research records | v1 battery/PV/wind/SOC/speed; fixed energy chart/map/alerts; local dashboard security controls and SMS screen; opt-in synthetic v2 diagnostics |
| **E — missing/partial/inconsistent** | Not implemented, or claims need reconciliation | Real energy/GPS/LTE/forecasting, four authorization roles, cloud fleet, driver SOS/messages, installable offline PWA, remote ARM/DISARM; hard five-second physical cutoff guarantee; historical docs with superseded statements |

### Checks performed now

All receiver/authentication tests used generated credentials and temporary databases. The additional browser harness used a temporary operator/auth database, temporary v1/v2 databases and **TEST FIXTURE** provenance, served the built frontend on a disposable loopback port, and closed only its own services. It never used working accounts or databases.

| Check | Result and limit |
| --- | --- |
| `check-telemetry-simulation.mjs`, `check-telemetry-contract.mjs` | PASS; v1 cadence/null/zero/validation/order |
| `check-telemetry-backend.mjs`, `check-telemetry-storage.mjs` | PASS; HTTP/SSE, durable simulator records, transaction failure/restart/history/CSV |
| `check-auth.mjs` | PASS; real test login, assigned-device access, CSRF, cookies, expiry/logout/revocation; no working account reset |
| `check-diagnostics.mjs` | PASS; v2 state/fault/freshness, synthetic controls and authenticated SSE |
| `check-hardware-integration.mjs`, `check-software-hardening.mjs` | PASS; token/identity/schema rejection, identical/conflicting/replayed live messages, delayed events, atomic storage/restart/export/provenance; software fixtures only |
| `check-device-monitor.mjs` | PASS; overview projection and honest source/freshness |
| `check-dev-local.mjs` | First run failed with shutdown timeout after successful startup; a second run PASS, including cleanup/port conflicts. Treat as intermittent until investigated; actual terminal Ctrl+C was not exercised |
| `check-firmware-software.ps1` | PASS; actual portable C++ queue/clock/ack helpers with mocked storage. Does **not** execute the complete ESP32 sketch, timer callback, detector or physical flash |
| `check-provisioning.ps1` | PASS; disposable synthetic configuration/address validation/token reuse, not provisioning of the working device |
| Existing frontend production build | PASS, 2,248 modules; existing approximately 645 kB JavaScript chunk warning. Output redirected outside the working project; no dependency upgrade. No configured general lint/full TypeScript typecheck was run; Vite transpilation is not a full typecheck |
| Browser verification | 13 recorded checks/observations passed: anonymous rejection, login, fixture provenance, never-connected state, hidden synthetic controls, SSE values/switches, retained fault values, persistent event panel, v2 CSV download, four tabs, 390px no horizontal overflow, reload/session/event retention, logout and no runtime errors. These observations are software fixtures, not breadboard evidence |
| Firmware compilation | PASS: integrated safe-default 793,909 program / 46,712 RAM bytes; bench-indicator 807,353 / 46,760; all-features 807,817 / 46,780. Standalone serial 262,377 / 21,408; standalone MPU 286,013 / 21,848. See the corresponding logs; copies of public source were compiled outside the project, excluding any `secrets.h`. Safe-default, bench-indicator and all-feature builds are distinct; no review binary is for upload |
| Physical testing | NOT RUN. No upload, sensor measurement, timing measurement, siren test, Wi-Fi device test or power interruption. Serial-port enumeration returned no entries; no actual COM port was selected |

Machine-specific evidence is in `C:\Users\Anyang\Videos\SolAir\review-20261011`: per-check logs, `frontend-build.log`, firmware build logs, `browser-results.json`, fixture CSV and desktop/mobile screenshots. Fixture CSV must never be mixed with physical evidence. The working auth/v1 database file sizes and modification times were unchanged by these checks.

## Canonical documents and how to read older notes

Use [hardware demo](hardware-demo.md) for the integrated setup/upload commands; [staged bench integration](staged-bench-integration.md) for the LED-first plan and HW-548 gates; [software hardening](software-hardening.md) for current clock, event delivery, replay and export rules; [local authentication](local-authentication.md) for accounts/session policy; [device diagnostics](device-diagnostics.md) for the earlier simulator and panel handoff; [contract](telemetry-contract.md), [field mapping](telemetry-field-mapping.md) and [firmware handoff](telemetry-firmware-handoff.md) for protocol/research decisions; [physical evidence template](et01-physical-evidence-template.md) for results.

These documents preserve earlier milestones. Statements such as “no ingestion,” “memory-only diagnostics,” “MQTT proposal,” or “no sender UTC” do not describe the latest integrated real-device path. Read their update sections and the current code: real v2 uses HTTP and durable SQLite, synchronized UTC is optional, and synthetic v2 remains memory-only. “PROPOSED” means team/research agreement is pending even when code implements a provisional rule. This guide reports those differences without rewriting canonical specifications.

## What the first laboratory test demonstrates

Its purpose is to establish a repeatable **input → local detection → remote observation → durable evidence** chain. It addresses SolAir's edge-computed anti-tamper and IoT monitoring requirements. “Edge” means decisions run on the ESP32 near the sensor, rather than waiting for a computer or internet service. It can exercise lid opening and mount release while ARMED, local response while Wi-Fi is lost, and later event delivery/persistence.

It does not demonstrate harvested energy, battery SOC (state of charge: how much charge remains), forecasting accuracy, actual GPS tracking, LTE transport, theft-classifier accuracy or permanent vehicle installation. Changing raw IMU numbers is sensor functionality, not calibration or proof of theft detection. The optional motion rule is a simple heuristic: acceleration magnitude deviation from gravity above 4 m/s² **or** angular-speed magnitude above 1.5 rad/s sustained for at least 200 ms. It is disabled by default and unvalidated.

### Choose the correct sketch and build

| Project/sketch | What it actually does | Build/profile | Dashboard integration |
| --- | --- | --- | --- |
| `C:\Users\Anyang\SolAir\firmware\serial-test\serial-test.ino` | Bare USB/UART banner, counter and uptime only | Sibling `build.ps1`; `serial_test` | None: no sensors/network/events |
| `C:\Users\Anyang\SolAir\firmware\mpu6050-diagnostic\mpu6050-diagnostic.ino` | Standalone MPU detection, checked raw conversion and serial vectors; defaults blocked, pins/address -1 | Sibling `build-mpu6050.ps1`; `mpu6050_diagnostic` | None: its serial lines are not v2 network messages |
| `C:\Users\Anyang\SolAir\figma-app\firmware\anti-tamper\anti-tamper.ino` | Integrated MPU/switch/local state/output, Wi-Fi HTTP, boot identity, clock and event spool | App `firmware\build.ps1`; `anti_tamper` | `backend\hardware-server.mjs` → ET-01 overview / Device monitoring / real event history |

All profiles target classic `esp32:esp32:esp32:FlashSize=4M,PartitionScheme=default,UploadSpeed=115200`, pinned core **2.0.17**, Arduino CLI **1.4.1**. This is a software target, not verification of the actual DevKit layout/flash/USB bridge.

Integrated build outputs:

- Normal build → `figma-app\firmware\build\upload`; uses `config.h` settings. Current defaults are disabled.
- `-BenchIndicator` → `firmware\build\bench-indicator`; overrides wiring=1, output=1, motion=0. It is intended for an **external LED + series resistor on GPIO27 with HW-548/siren disconnected**. Despite the name, the same binary would drive GPIO27 if attached to the module: it is not inherently siren-safe.
- `-VerifyAllFeatures` → `firmware\build\software-check-only`; wiring/output/motion enabled solely for compile coverage. **Do not upload this fixture for the first test.** The build script rejects combining this switch with `-BenchIndicator`.

Flashing a diagnostic sketch replaces the integrated application and vice versa. Preserve the current source/configuration before the team uploads. Do not confuse a successful standalone MPU demonstration with a successful integrated alarm/network demonstration.

## The actual connection path

The **breadboard only provides electrical connections**. It does not execute software or connect to the internet. The ESP32 executes firmware, reads the MPU over I²C (a two-wire sensor bus), reads switches through GPIO (programmable input/output pins), applies local rules, and sends JSON (structured text messages).

```text
MPU6050 SDA/SCL + lid/mount contacts
       ↓ electrical connections on breadboard
ESP32 anti-tamper firmware: readings, debounce, ARM/latch, local GPIO27
       ↓ 2.4 GHz private Wi-Fi; HTTP POST with device bearer token
PC's ACTUAL private LAN IPv4:3002/ingest
       ↓ identity + strict v2 validation + order/deduplication
data/device-telemetry.sqlite: transaction committed
       ↓ authenticated SSE (server-sent events: a continuing update stream)
PC loopback operator API 127.0.0.1:3001/api/diagnostics/stream
       ↓ Vite /api proxy
Operator browser 127.0.0.1:5173/dashboard
       ↓ ET-01 overview, expandable Device monitoring and persisted events
```

The ESP32's `127.0.0.1` means the ESP32 itself. The PC's `127.0.0.1` means the PC. Therefore the firmware must use the **PC LAN IPv4**, not localhost or the frontend port. Both must share a reachable private 2.4 GHz router/hotspot without guest/client isolation. A phone hotspot must permit clients to communicate; verify this rather than assuming it. PC DHCP address changes require reprovisioning/rebuilding/reuploading or a router address reservation.

| Interface | Current purpose/binding | Access |
| --- | --- | --- |
| USB serial, 115200 baud | Upload, human-readable status/diagnostic monitoring; integrated `ARM` and `DISARM` with newline | Local serial monitor only; not the dashboard transport |
| Device HTTP | Receiver bound to exact `SOLAIR_DEVICE_HOST`, a validated private IPv4, fixed TCP3002, `POST /ingest` | Privately provisioned 64-hex-character bearer token bound to hardcoded ET-01; requests with browser Origin rejected |
| Operator API | `127.0.0.1:3001`, auth/telemetry/diagnostics routes | Session/assignment; writes require exact Origin and a CSRF token (a browser-request protection against cross-site forgery) |
| Frontend | `127.0.0.1:5173`, strict port; `/api` proxies to3001 | Existing operator login; use `127.0.0.1`, not `localhost` |
| MQTT/LTE/Web Serial | No current integrated path | Not implemented; browser buttons do not send serial commands |

The bench bearer token is a publishing credential, independent of the operator password/cookie. `source=device` alone authenticates nothing. HTTP is unencrypted: the token/messages could be captured on an untrusted network. Keep this to a private bench; do not port-forward port 3002. Production HTTPS/device credential management is future work. Operator APIs intentionally remain inaccessible directly from a phone using the PC LAN address.

### Startup for hardware mode — team actions after setup

Run only one backend owner. `npm.cmd run dev:local`, `npm.cmd run dev:backend` and direct `node backend/server.mjs` use3001 and conflict with `hardware-server.mjs`. Do not start them concurrently. Have the known owner stop their own conflicting service with Ctrl+C; this review did not stop unrelated services. Hardware entry starts the preserved v1 simulator **paused**, but an authorized operator can still resume v1 examples; real v2 diagnostic simulation is rejected in hardware mode.

Terminal A:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
ipconfig
$env:SOLAIR_DEVICE_HOST = Read-Host 'Enter this PC actual private Wi-Fi IPv4'
node backend/hardware-server.mjs
```

Terminal B:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
npm.cmd run dev:frontend -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/dashboard`. Sign in with an existing ET-01 operator. If none exists, the responsible local custodian may later run `npm.cmd run operator:create` and enter a hidden password; do not reset an existing account as a troubleshooting shortcut. The current account database path must match startup. This review created no working account.

Provisioning is a separate future action:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\provision-hardware.ps1
```

Hidden SSID/password prompts plus the PC IPv4 generate/reuse `data\device-token.txt` and write ignored `firmware\anti-tamper\secrets.h`. URL is `http://<actual-PC-IP>:3002/ingest`. Never display/share these files, passwords or compiled firmware containing credentials. Do not run this script during a documentation review merely to “make it ready.”

Windows Firewall: first establish whether TCP3002 is actually blocked and whether the network is classified Private. If required, the administrator should allow **only inbound TCP3002 on Private**, restricted to the bench device IP or approved bench subnet, optionally to the actual Node executable. Do not disable the firewall, open all ports, expose3001/5173 on LAN or allow Public-profile access. A restrictive firewall is not the only cause: wrong IP, isolation, AP band, missing token and receiver startup failure also matter.

## What travels, persists and resets

The current protocol is strict **v2**, with three message types. All carry ET-01, firmware `SOLAIR-SOFTWARE-2`, a random UUID per boot, a separate sequence counter per type, uptime in milliseconds, sender UTC or null, and clock synchronization status. The first live boot heartbeat uses sequence0. Firmware polls IMU about every 50 ms when enabled, reports sensor snapshots about every 3 seconds, and sends heartbeat about every 5 seconds **when network scheduling permits**; these are requested intervals, not deadlines.

- Heartbeat carries identity/time/liveness; it does not carry sensor readings.
- Sensor snapshot carries acceleration XYZ in m/s², angular velocity XYZ in rad/s, checked read window, IMU validity/fault, chip-axis frame, null calibration reference, lid/mount states, switch availability and reported security. Battery/PV/wind/SOC/time-to-empty/GPS/speed/brake fields are explicitly null.
- Tamper event carries LID_OPEN_DETECTED, MOUNT_DETACH_DETECTED or optional MOTION_TAMPER_DETECTED, detector revision, TRIGGERED, original uptime and null evidenceTelemetrySequence. There is no measured siren feedback field.

Zero is a real value; null means unavailable. Firmware read faults disable subsequent IMU reads until restart; switches can still alarm. `VALID` means the configured register/read checks passed, not calibrated accuracy or genuine-silicon certification. Switch `VALID` means logical states are available, not detection of contact wear or wiring faults.

| Item | Browser refresh | Backend restart | ESP32 restart / power loss |
| --- | --- | --- | --- |
| REAL accepted heartbeat/sensor/event rows and ordering | Retained in separate v2 SQLite | Retained; original receipt restored, not refreshed | Existing server rows retained |
| Latest live boot/sensor state | Restored through SSE | Restored through stored snapshot | New live boot clears old-boot sensor/last-valid vectors; old events remain historical |
| Unsent durable events | Not controlled by browser | Recovered when ESP32 submits/retries | Eight NVS slots are intended to survive; physical power-loss behavior not verified |
| RAM fallback events/latest sample | No browser ownership | Device-side only | Lost; no continuous sensor-history buffer |
| Local ARM/TRIGGERED latch/counters | Device remains as reported | Device remains as reported | Reset to DISARMED, new boot UUID and counters restart |
| SIMULATED v1 records | SQLite retained | Retained; new simulator startup/session count resets | Unrelated to ESP32 |
| Synthetic v2 diagnostics/events | Backend memory retained | Reset/stopped | Unrelated to ESP32 |
| Dashboard demo security/filters | Local component state resets on remount/reload | No durable hardware effect | Never controls hardware |
| Operator sessions | Retained if valid | Same auth DB restores absolute eight-hour lifetime | Unrelated; logout revokes current browser session |

Receiver commits each accepted v2 row and snapshot atomically before notifying SSE. Failure returns 503 and retains accepted state. HTTP 202 means durable acceptance **or an exact stored retry**, not a new measurement. Same boot/type/sequence with changed payload returns 409; equivalent retries increment retry metadata without renewing liveness/count. Stale/retired live boot/order is rejected. Historical tamper events intentionally accept old/unseen boots and out-of-delivery-order event sequences, preserve identity, and never activate a boot or refresh heartbeat/sensor age. This is deduplication, not complete captured-network replay protection.

Snapshot contains 20 recent events; event API returns latest 100; all stored rows remain until an operator-defined retention/backup policy is implemented. REAL CSV starts with 1,000 rows in the UI; API `limit` up to 10,000, `afterId`, `eventsOnly` and `X-Next-After-Id` permit further chunks. Separate v1 CSV exports simulated records only. No automatic purge/backfill exists.

### Offline and time limits

Firmware keeps one overwritten latest sensor sample; failed transmission can lose that sample. It does not archive every offline IMU reading. Important events use 8 immutable NVS (nonvolatile flash storage) slots, at most 1,023 JSON bytes each, with length, format-marker and CRC (cyclic redundancy check: a checksum for accidental data corruption) checks. Corrupt slots are quarantined and reduce usable capacity. Full/write-failed NVS falls back to 16 RAM entries plus one pending network entry; exhausted RAM logs event loss. RAM fallback is lost at reset. Network attempts at most one NVS and one RAM event per 5 seconds, rotating NVS selection; HTTP delay and other work can extend actual timing. Deletion requires exact expected durable HTTP 202 acknowledgment. No infinite/loss-free recorder or backup-power guarantee exists.

Server receipt UTC is separate from ESP32 detection time. UTC is worldwide wall-clock time; uptime is elapsed time since that boot, not a date. Before successful SNTP (network time synchronization), sender UTC=null and clockSynchronized=false. After a valid callback it is system UTC; trust expires after 24 hours without refresh and clears on reboot. Buffered event JSON keeps its original clock status/time. PC receipt uses the PC UTC clock; ensure its time is correct. Live messages use a provisional ±5-second sender/receipt budget; delayed historical events can be old but not more than 5 seconds into the future. Unsynchronized transit age is unknown.

Device connection uses the newest accepted **live heartbeat or sensor receipt**: NEVER CONNECTED before any, ONLINE below 15 seconds, STALE from 15 seconds, OFFLINE from 30 seconds at the five-second default. The detailed heartbeat has its own age. Sensor report/last valid IMU ages are separate: stale 10 seconds, outdated/disconnected 30 seconds. A new fault report refreshes report age but not the old good vectors. Browser SSE CONNECTED means browser↔backend connectivity, not an online ESP32. Delayed events and duplicate acknowledgments cannot make a dead device appear online.

## Alarm behavior and the cutoff review

Only local USB serial `ARM` and `DISARM` are implemented. ARM needs enabled/approved input wiring, uptime≥10 seconds, both debounced contacts secure and no existing TRIGGERED latch. There is no remote equivalent. First lid/mount/motion trigger wins while latched; DISARM clears the latch, stops the timer and commands GPIO27 LOW. Timer cutoff leaves TRIGGERED displayed until DISARM. Dashboard demo arm/reset never changes this state.

The sketch starts an `esp_timer` one-shot **before** setting GPIO27 HIGH and keeps output LOW if timer creation/start fails. A separate network task on core 0 does Wi-Fi/HTTP; the main loop checks cutoff before I²C work, and the callback also drives LOW. Thus it does not intentionally wait for an HTTP response to turn off.

However this is **not an independently powered hardware safety cutoff or a guaranteed maximum five seconds**. `timerArgs` uses default task dispatch, not ISR dispatch. Espressif explicitly documents that timer callbacks can be delayed by higher-priority tasks or flash operations. The event path writes NVS while output is active; mutex waits, flash activity, serial printing/flooding and bounded multiple I²C transfers can delay other loop work. HTTP calls have configured1 second connect/read timeouts, but multiple posts and Wi-Fi reconnect work can delay reporting. Static separation and helper tests do not measure the complete alarm deadline. See [Espressif timer dispatch documentation](https://docs.espressif.com/projects/esp-idf/en/v4.4.7/esp32/api-reference/system/esp_timer.html).

Measure GPIO27/output OFF timing with a logic analyzer/oscilloscope or suitable recording, under Wi-Fi failure and event persistence/retry conditions. A hard maximum needs a separately reviewed hardware cutoff/protection design if the siren/load requires it. The firmware's comment about an “external gate pulldown” is appropriate to some bare-transistor circuits; it is **not automatically the correct input circuit for a packaged isolated HW-548**.

## Conditional breadboard wiring

**No row below is physical wiring approval.** “Code confirmed” means the inspected GPIO matches code. The historical proposals21/22/25/26/27 match the integrated `config.h`. They do not match the sibling diagnostic's current unset -1 pins/address. Use printed GPIO/IO labels, not “pin21” as the21 secondt header position. ESP32-WROOM module pads and 38-pin DevKit headers are different maps.

A pull-up is a weak electrical connection to the positive logic supply that holds an open input HIGH; a closed switch pulls it to GND. Ground (GND) is the shared signal-voltage reference. I²C lines need appropriate pull-ups, whereas these switch inputs use the ESP32 internal pull-up. A MOSFET is a transistor used as an electronic switch; a packaged module includes additional circuitry.

Keep traction battery, solar/wind power wiring and siren load current off the solderless breadboard. First stage: USB-powered ESP32, reviewed MPU, dry-contact switches, optional low-current indicator. Check rail continuity with all power removed: rails may split at the middle and opposite sides are not necessarily connected. Add bridges only between intended equal-voltage rails; mark3.3 V and GND and check for shorts before power.

| Component terminal | ESP32/supply connection | Signal direction | Supply/logic and pull requirement | Firmware setting | Status |
| --- | --- | --- | --- | --- | --- |
| ESP32 USB connector | PC USB data cable | Bidirectional upload/status/commands | USB supplies DevKit regulator; identify exact board/bridge |115200 baud; classic ESP32 profile | Code/toolchain confirmed; physical port pending |
| GY-521 VCC | ESP32 3V3 **only if exact breakout supports this input** | Supply to module | Review regulator dropout and actual chip supply; not blanket 5 V approval | `SOLAIR_WIRING=1` only after review | Conditional module supply |
| GY-521 GND | ESP32 GND | Common signal reference | Continuity; no siren current in this path | Same wiring flag | Proposed physical; code bus mapping confirmed |
| GY-521 SDA | GPIO21 | Bidirectional I²C | Open-drain pull-up to compatible 3.3 V logic; inspect existing pull-ups, do not duplicate blindly | `SDA_GPIO=21`,100 kHz | Code confirmed; physical pending |
| GY-521 SCL | GPIO22 | Clock from ESP32, possible clock stretching | Same logic/pull-up check; no 5 V pull-up into ESP32 | `SCL_GPIO=22` | Code confirmed; physical pending |
| GY-521 AD0 | GND for 0x68; deliberate 3.3 V only with approved logic | Address selection into MPU | Stable level; do not leave address ambiguous | `MPU_ADDRESS=0x68`; change to 0x69 only together with AD0 decision | Current code 0x68; physical pending |
| GY-521 INT/XDA/XCL | Leave unused in first test | Not used | Insulate unused pins | No implemented interrupt/auxiliary use | Not required |
| Lid switch COM / selected contact | COM→GND; contact that closes when secure→GPIO25 (often NO when pressed) | Dry contact into ESP32 | `INPUT_PULLUP`; LOW=CLOSED, HIGH=OPEN. Confirm COM/NO/NC with meter | `LID_GPIO=25`, debounce 50 ms | Code confirmed; continuity reported previously, reconstructed circuit unverified |
| Mount switch COM / selected contact | COM→GND; secure-closing contact→GPIO26 | Dry contact into ESP32 | `INPUT_PULLUP`; LOW=ATTACHED, HIGH=DETACHED | `MOUNT_GPIO=26`, debounce 50 ms | Same conditional status |
| Optional indicator LED | GPIO27→330 Ω→LED anode; cathode→GND | ESP32 output | Verify LED polarity/current; packaged driver and siren fully disconnected | `-BenchIndicator`: output enabled, motion disabled | Documented proposed indicator stage; not physically checked now |
| HW-548 Signal Input+ / − | Proposed +→GPIO27; −→ESP32 GND **only after interface approval** | ESP32 into packaged driver | Required3.3 V/current/polarity/isolation/reset-safe OFF unknown; choose bias/interface only from exact circuit | GPIO27 assumes HIGH=ON, LOW=OFF; default SIREN disabled | BLOCKED, not approved |
| HW-548 DC+/DC− | Proposed fused12 V+/supply−, outside breadboard | Supply to driver | Supply/fuse/cable current, polarity and module rating verified by lead | No supply feedback | BLOCKED |
| HW-548 OUT+/OUT− and siren+/− | Proposed OUT+→siren+, OUT−→siren−, rated terminals/wire | Switched power to load | Actual siren continuous/inrush current and suppression; no breadboard contacts | No measured-siren field | BLOCKED |
|12 V negative versus signal ground | Depends on exact driver isolation/schematic | Return/reference | ESP32/MPU/switches share signal ground. Do not automatically bridge isolated signal− to DC− | No software setting proves isolation | Conditional module-specific |

ESP32 module supply is nominal3.3 V, recommended3.0–3.6 V; treat GPIO as3.3 V logic and keep5V/12 V away. Datasheet GPIO limits are relative to its supply, not5V tolerance. [Espressif module electrical specifications](https://documentation.espressif.com/esp32-wroom-32d_esp32-wroom-32u_datasheet_en.html).

The MPU6050 **chip** VDD is 2.375–3.46 V and VLOGIC 1.71 V through VDD; AD0 selects 0x68/0x69. A GY-521 may add a regulator/pull-ups and have different terminal-level requirements; chip limits do not identify the breakout. Record chip/breakout markings, front/back photos and schematic or supply/pull-up measurements. Secure the MPU in a recorded orientation: data is chip axes, not transformed vehicle axes; gravity at rest is approximately 9.81 m/s² in vector magnitude, with bias/orientation effects. [TDK specification](https://product.tdk.cn/system/files/dam/doc/product/sensor/mortion-inertial/imu/data_sheet/mpu-6000-datasheet1.pdf).

COM is the common switch terminal; NO is open at rest and normally closes when actuated; NC is closed at rest. Verify your actual part with a continuity meter. The current bench convention is pressed=secure, not a validated permanent enclosure geometry. A disconnected wire looks like released/open; software cannot distinguish those causes. INPUT_PULLUP provides internal bias for short bench leads; added pull/EMI protection for longer vehicle leads needs a reviewed design, not guessed values. On boot both switches begin unknown, settle after debounce, and ARM is rejected if either is open or before 10 seconds.

The reported HW-548 is a **packaged six-terminal module**, marked IRF5305S, not a bare N-channel MOSFET. [Infineon identifies IRF5305S as P-channel](https://www.infineon.com/part/IRF5305S); its chip datasheet does not specify the whole module's input. Existing docs record seller claims 3–20 V input/about 5 mA,5–36 V load and 5 A rating; these were not independently verified. No arbitrary bare-transistor gate resistor/pulldown recipe is supplied. Obtain the exact module schematic/input polarity/isolated-side requirements and test LOW/OFF,3.3 V HIGH/ON, reset, unplug and disconnected-input behavior using a rated test load before attaching the siren.

Siren requires a separately rated 12 V supply, measured/rated steady and inrush current, appropriate wire/terminals, fuse and manufacturer-appropriate switching suppression. Do not select fuse solely because 1/2/3 A fuses are available, or trust an advertised 20 A peak. A flyback diode/TVS arrangement depends on the actual load/module; have the lead specify it. Keep acoustic exposure appropriate during the supervised test. Never power the siren from GPIO/3V3/USB or run its load current through breadboard contacts.

Use USB as the only ESP32 power source initially. Do not simultaneously feed a DevKit 5V/VIN or 3V3 from an external supply unless the exact board power schematic permits it; otherwise USB/external backfeeding can damage equipment. Keep 12 V power separate from signal rails. The reported HCW-P715 buck converter is not needed for the initial USB-powered inputs; leave it out until its output and power path are separately approved.

### Purchased parts outside this first integrated test

ADS1115, both ACS758LCB-050B channels, NEO-6M and A7670E have **no drivers in this integrated sketch**. Do not add them during the first alarm-chain test. No GPIO/UART pin proposal for them is implemented here. Later stages require a versioned contract/firmware/backend/UI agreement.

For later design: [TI ADS1115](https://www.ti.com/lit/ds/symlink/ads1115.pdf) supply/input limits must be respected; gain range does not permit an input beyond its supply. [Allegro ACS758](https://www.allegromicro.com/en/products/sense/current-sensor-ics/integrated-current-sensors/acs758) is a current sensor; current alone does not establish PV/wind power or energy, and its analog output/module supply need review. [u-blox NEO-6](https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf) chip specifications do not approve a breakout's VCC terminal. Use the exact A7670E carrier schematic and [SIMCom hardware design files](https://en.simcom.com/product/A7670X.html) for supply peaks/UART levels; do not assume direct ESP32 logic compatibility. Traction sensing is outside this breadboard procedure.

## Staged laboratory procedure

All stages are **NOT RUN physically in this review**. Use [the unexecuted evidence template](et01-physical-evidence-template.md) per actual test. Save tester/date/timezone, wiring photograph, exact flags, firmware build hash, actual serial lines, event boot/type/sequence, original receipt, dashboard screenshot and relevant CSV. Remove credentials from photographs/logs; never share a secrets header/binary/flash dump. Stop at a failed gate rather than marking subsequent items complete.

### Shared tool commands

In each new PowerShell terminal define the actual installed tools:

```powershell
$cli = 'C:\Users\Anyang\AppData\Local\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe'
$cache = 'C:\Users\Anyang\SolAir\firmware\arduino-cli.yaml'
& $cli version
$port = Read-Host 'Enter the ESP32 COM port verified by unplug/replug in Device Manager'
if ($port -notmatch '^COM[0-9]+$') { throw 'Use an actual detected COM port.' }
```

Do not invent COM numbers or install an arbitrary USB driver. Identify the actual USB chip/VID/PID and use its manufacturer's driver only if needed. Close other serial monitors before upload; only one may own the port. Upload replaces the running application; review source/wiring first. BOOT/EN troubleshooting and full upload policy are in [hardware-demo.md](hardware-demo.md).

### Stage 1 — bare ESP32 USB, upload and serial output

**Purpose/components:** establish PC↔board communication using ESP32 and USB data cable only. **Power off:** remove all modules/external supply, preserve current sketch, identify actual board/bridge/port.

Run in sibling firmware root:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\firmware'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
# Team upload only after confirming replacement of the board application:
& $cli --config-file $cache upload --profile serial_test --port $port --input-dir .\build .\serial-test
& $cli --config-file $cache monitor --port $port --config baudrate=115200
```

**Expected example, not observed:** `SOLAIR SERIAL TEST - DIAGNOSTIC ONLY (NOT SENSOR TELEMETRY)` then `DIAGNOSTIC counter=1 uptime_ms=...` increasing about once/s. **Pass:** port follows unplug/replug, upload succeeds, stable banner/counters. **Fail/troubleshoot:** missing port→data cable/connector/device IDs; occupied port→close its known monitor; garbled output→115200 baud; repeated banners→power/reset investigation. **Evidence:** actual port/USB IDs, upload log and several serial lines. No dashboard readings are expected.

### Stage 2 — standalone MPU detection and readings

**Purpose/components:** establish actual MPU functionality independently; ESP32, reviewed GY-521 and low-voltage wires. **Power off:** verify VCC/regulator/pull-ups, common ground, SDA21/SCL22 and AD0 decision. In sibling `mpu6050-diagnostic\diagnostic-config.h`, the hardware lead must later set `WIRING_CONFIRMED=true`, approved GPIOs and address; they are currently false/-1, intentionally blocked. This guide has not changed them.

```powershell
Set-Location 'C:\Users\Anyang\SolAir\firmware'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-mpu6050.ps1
& $cli --config-file $cache upload --profile mpu6050_diagnostic --port $port --input-dir .\build\mpu6050-diagnostic .\mpu6050-diagnostic
& $cli --config-file $cache monitor --port $port --config baudrate=115200
```

**Expected examples:** `DETECTION address=0x68 WHO_AM_I=0x68`, `READY diagnostic only...`, then `RAW_DIAGNOSTIC ... accel_m_s2=[...] angular_velocity_rad_s=[...]` about 500 ms. **Pass:** genuine changing vectors, correct units/address/config, no partial read accepted; roughly gravity magnitude when still. **Fail:** `UNCONFIRMED_WIRING`→approval/settings; identity/read errors→power, rails, AD0, pull-ups, wiring. Resolve with power off and restart; never invent zero vectors to hide failure. **Evidence:** stationary/tilt/rotation serial captures and orientation photo; this is uncalibrated standalone evidence, not integrated delivery.

### Stage 3 — test lid and mount contacts individually

**Purpose/components:** establish correct contacts/polarity before arming; ESP32, one switch at a time, continuity/voltage meter. **Power off:** identify COM/NO/NC using continuity; connect secure-closing contact to GPIO25 or GPIO26 and COM to signal GND. Keep output/module/siren disconnected. Prepare integrated `figma-app\firmware\anti-tamper\config.h` with lead-approved `SOLAIR_WIRING=1`, `SOLAIR_SIREN=0`, `SOLAIR_MOTION=0`; do not edit the standalone config by mistake. The review did not make this change.

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\firmware\build.ps1
& $cli --config-file $cache upload --profile anti_tamper --port $port --input-dir .\firmware\build\upload .\firmware\anti-tamper
& $cli --config-file $cache monitor --port $port --config baudrate=115200
```

**Expected example:** integrated DISARMED banner; `NETWORK_UNCONFIGURED` is expected until Stage 4. Serial does **not** print raw switch vectors/states continuously: electrical measurement verifies contacts now; software state display is confirmed in Stage 5. **Pass:** each closed secure contact gives near GND at its input; released gives near 3.3 V with pull-up; no short/hot component/output. **Fail:** reversed contacts, broken rail or absent pull-up/config→power-off recheck. Do not ARM with the other contact absent/open. **Evidence:** meter/continuity results for each switch and actual flags/photo. Repeat with both connected; Stage 5 must independently confirm CLOSED/ATTACHED and OPEN/DETACHED.

### Stage 4 — Wi-Fi and authenticated heartbeat

**Purpose/components:** establish the actual network publisher path; ESP32 inputs, USB, PC and private 2.4 GHz AP. **Power off/configure:** leave load disconnected. Have the custodian privately run the provisioning script above, inspect IP/path matching without exposing token, then rebuild/upload the integrated normal build as in Stage 3. Existing receiver/frontend/account setup follows the startup section. Do not run `dev:local` alongside it.

**Expected examples:** `EVENT_STORAGE READY...`, `BOOT_HEARTBEAT HTTP=202`, then `HEARTBEAT HTTP=202`. **Pass requires more than HTTP 202:** sign in, observe matching ET-01 boot/firmware, increasing live heartbeat sequence and fresh **server receipt**; validate stored record through the separate real-v2 export/history. **Fail/troubleshoot:** negative HTTP→SSID/band/IP/isolation/firewall/listener;403→token mismatch or Origin rejection;409→format/identity/boot/time;503→storage. Do not paste token into a diagnostic command. **Evidence:** sanitized serial, received identity/time and exported accepted row. This is not a calibration result.

### Stage 5 — actual readings in Device monitoring

**Purpose/components:** prove the board's input changes reach the screen/storage; same setup. **Power off:** review any correction first; keep siren disabled. No new serial command is needed. At `/dashboard`, inspect ET-01 monitoring; expand **ET-01 · Device monitoring** (the implementation of the docs' Device diagnostics).

**Expected example:** REAL DEVICE/Wi-Fi HTTP, IMU VALID, current XYZ values, switchStatus=VALID, pressed switches CLOSED/ATTACHED and released OPEN/DETACHED while DISARMED. **Pass:** actual tilt and each physical switch change produce corresponding new sensor sequence/receipt, durable CSV row and display; zeros/nulls remain honest; browser and device statuses are distinct. **Fail:** browser SSE connected but device NEVER CONNECTED→network path; `BLOCKED`→wiring flag; fault/OUTDATED→electrical/read fault, restart after correction; wrong board/boot→wrong sketch. No `CALIBRATE` command or calibration UI exists in this integrated firmware. **Evidence:** paired physical action/video, serial receipts, screenshot and real-v2 row. Do not use injected synthetic events as substitutes.

### Stage 6 — armed switch event, siren disconnected

**Purpose/components:** prove local classification/latch and event persistence; both switches and reviewed MPU, no load. **Power off:** actual HW-548/siren stays disconnected. Keep normal build with SIREN and MOTION disabled; optionally use the documented LED-only `-BenchIndicator` stage only after that wiring is approved.

Close CLI monitor and use Arduino IDE Serial Monitor at 115200 baud with **newline ending**. Supported controls are exactly:

```text
DISARM
ARM
```

Wait≥10 seconds after boot with both contacts secure before ARM. Open lid>50 ms; then DISARM, secure both, ARM and open mount. **Expected examples:** `ARMED local detector; network not required`; `LOCAL_EVENT LID_OPEN_DETECTED uptime_ms=... siren=DISABLED max_ms=5000`; `DURABLE_EVENT HTTP=202`. The optional indicator instead reports `siren=ON` because the flag enables GPIO, not because a siren was observed. **Pass:** matching event type/boot/sequence and server record/dashboard history, TRIGGERED latch, DISARM clearing and no event on disarmed release. **Fail:** ARM_REJECTED→startup time, contacts or latch; only first event→expected latch, DISARM/rearm; event absent→separate local/network/storage evidence. **Evidence:** serial/video + event ID and original receipt + CSV. Dashboard Arm Security System is a demo and must not be used to arm the board.

### Stage 7 — siren only after driver/supply sign-off

**Purpose/components:** supervised physical output test; exact reviewed HW-548, rated 12 V supply, approved fuse/wires/suppression, rated test load/meter and siren. **Power off:** hardware lead signs off the conditional terminal map, signal input current/polarity/isolation, reset-safe OFF and protection. Test the driver/load before the actual siren. Do not connect the load to breadboard or ESP32 supply.

Only after that approval, the team may enable `SOLAIR_SIREN=1` with wiring enabled/motion disabled in `config.h`, run the normal build/upload commands and reuse local DISARM/ARM. Do not use `-VerifyAllFeatures`; motion must stay disabled. **Expected example:** `LOCAL_EVENT ... siren=ON` then GPIO LOW around the requested five seconds and retained TRIGGERED; `DISARMED SIREN_OFF` on manual stop. **Pass:** physically observed/measured output, safe OFF at reset/boot/unplug, correct load behavior/current and measured cutoff under stress. Serial text is not siren feedback. **Fail:** output at boot, wrong polarity, slow cutoff/heating/overcurrent→disconnect supply, retain evidence and review; do not compensate by arbitrary code/wiring changes. **Evidence:** approved circuit/rating sheet, waveform/duration/current/video, event/CSV. A strict five-second maximum is not yet proven.

### Stage 8 — Wi-Fi loss/recovery and local behavior

**Purpose/components:** demonstrate edge independence and bounded delayed delivery. Start with siren disconnected/approved LED; use actual siren only if Stage 7 passed. **Power off/configuration:** preserve approved setup; do not alter credential/token/boot identity. ARM securely, then remove only Wi-Fi availability; do not unplug ESP32 or PC power.

**Expected examples:** `WIFI_OFFLINE local detector remains active`, local event/output while offline; device freshness ages though browser SSE may remainconnected. Restore Wi-Fi; `DURABLE_EVENT HTTP=202` and historical event appears later. **Pass:** local detection and measured cutoff do not wait for network; event keeps original boot/sequence/uptime/sender clock and has later server receipt; no duplicate physical event inferred from retries; new live receipts restoreONLINE. **Fail:** no local trigger→local inputs/state; no event recovery→queue/NVS/network/auth/storage; flash/full warnings→boundedlossrisk, not success. Disarm/rearm for each cause. **Evidence:** timed physical action, Wi-Fi loss/recovery video, local output timing, raw event/receipt and retry metadata. No event capacity/power-loss guarantee follows from one successful reconnect.

### Stage 9 — restart and persistent-event verification

**Purpose/components:** separate browser/backend persistence from device reset. **Power off/configuration:** keep siren disconnected or verifiedoff; identify the known owner of hardware-server. Do not restart unrelated services or erase flash/NVS. Save the accepted event ID/receipt/count/CSV before proceeding.

1. Refresh browser: compare stored event identity and original receipt, not just a visible sample.
2. Owner stops their hardware-server with Ctrl+C, starts the same command/IP/database again; log in if needed and compare history/export. Never point startup at another empty database and call it data loss.
3. Reset ESP32 usingEN, with safe output disconnected: observe new boot UUID, DISARMED, counters restarting, fresh sensor reports only from the new boot, old events still historical.
4. Only as a separate supervised power-loss test: while Wi-Fi is unavailable, create an event, confirm local storage report, safely reset/power-cycle, restoreWi-Fi and compare the recovered original event. RAM fallback is expected to be reset-lossy. Do not assume physical NVS durability from mock tests.

**Pass:** durable rows/original receipts survive browser/backendrestart; recovered historicalevent does not falselyrenewlive freshness; reset does notremainARMED/soundoutput. **Fail/troubleshoot:** changed file paths, incompatibleDB, unfinished commit, NVS failure or new boot misidentified; preserve originalfiles rather than resettingaccounts/erasingrecords. **Evidence:** before/after real CSV, bootIDs, serial/video, restartcommand/time and failures. Use the canonical safe SQLite backup procedure only with its writers stopped; authentication backups remain private.

## Current screen and feature inventory

Only routes in [App.tsx](../src/app/App.tsx) are reachable: `/login`, protected `/dashboard`, `/map`, and `/sms-alert`. `/pairing` redirects to the protected dashboard. Dashboard tabs are Map, Energy, Security and Alerts. Files named EnergyMetricsScreen, SecurityScreen, AlertsScreen, PairingScreen and OnboardingScreen exist but are **not mounted by the current router**. They are not additional delivered pages. No Settings, Admin or CPE Lab route exists.

| Feature: where and how to use | Actual source and status | Hardware/research connection | Limitations and proposed fixes |
| --- | --- | --- | --- |
| Login/Log out: private operator username/password, then header Log out | **A:** local auth SQLite, session, CSRF and ET-01 assignment | Controls viewer access; does not authenticate the device publisher | Only operator authorization exists. Future roles and TODA ownership need a reviewed access model |
| ET-01 monitoring overview: top of each dashboard tab | **A with browser fixtures:** v2 source, live receipts, security, switches, IMU, boot, count and event | Main anti-tamper/IoT observer | Actual hardware comparison pending; no measured siren feedback or calibration |
| Device monitoring: expand its summary | **A with browser fixtures:** independent heartbeat/report/valid-IMU ages, XYZ vectors, faults, UTC and uptime | MPU/switch firmware diagnostics | Actual faults, reconnection and physical readings still require team evidence |
| Persisted event history / Refresh delivery details / Export REAL records | **A software/browser fixtures:** v2 SQLite, latest 100 events, first 1,000 CSV records and paged API | Durable anti-tamper records | REAL describes the receiver path, not physical verification; fixtures stay TEST FIXTURE. Improve complete-export UX later |
| Separate SIMULATED v1 examples: expand, Pause/Resume, History/CSV | **A + D:** backend-generated v1 samples in SQLite; shared local controls | Demonstrates data handling without sensors | May still run beside real v2. Keep examples and physical evidence separate |
| Battery voltage/SOC: Map cards | **D** in simulation; **E/unavailable** in real or unknown mode | Requires separately designed pack sensing/BMS and validated SOC | No real battery current channel/display. Purchased ACS sensors do not implement this automatically |
| Solar PV / Wind VAWT: Energy tab | **D** v1 examples; real fields null | Hybrid harvesting monitoring requirement | No ADS/ACS/voltage/power-stage driver or calibration installed; no measured power/energy |
| Sample harvested-energy total/chart | **D:** fixed `demoEnergyHistory`, not accumulated v2 energy | Illustrates an energy display only | Remains visible in real mode with sample labels. Later hide/isolate it to reduce confusion |
| Savings / forecasting / time-to-empty | Savings calculation/page **E missing**; Time-to-Empty explicitly unavailable | Future economic/runtime research | No validated model, experiment labels, measured endpoints or error evaluation |
| Map Preview / Tap to Expand / protected map | **D:** bundled image and fixed SVG route; real coordinates unavailable | Future tracking concept | No NEO-6M acquisition, live position, speed or fix history |
| Security tab finite-state machine (FSM: the allowed security states) and manual Arm/Disarm/Reset/Test Trigger | **D:** local browser component state | Explains DISARMED/ARMED/TRIGGERED concepts | Sends no hardware command. “Alarm is active” and “120dB” wording can be confused with actual siren state; separate demo controls later |
| Reported security in overview/diagnostics | **A software:** current-boot sensor/event reports compared by uptime | ESP32 local state independent of demo controls | A latch is not current output. Measured feedback needs approved hardware/contract changes |
| Alerts tab and All/Critical buttons | **D:** fixed `demoAlerts`; filter buttons have no current filter handlers | Example alert presentation | Real history is in Device monitoring. Implement filters and clarify example/history distinction later |
| Intrusion modal and SMS alert screen | **D:** Test Trigger opens modal; navigation opens fixed message example | Future alert/communication concept | No SMS modem/provider, outbound delivery, phone call or message backend |
| Synthetic diagnostics in default local mode | **A + D:** opt-in start/stop, sensor/heartbeat pause, faults, switches and injected event | Software fault-state tests | Hidden and rejected with HTTP 409 in real-v2 mode; not physical classifications or commands |
| PWA installation/offline | **E missing:** no manifest/service-worker/cache implementation found | Future mobile driver access | Responsive page is not an installable/offline PWA. Disconnected pages retain stale memory; cold offline use unavailable |
| Settings/admin/provisioning | No web settings/admin; private terminal setup/provisioning exists | Local account/device custodianship | No web role administration, credential rotation UI or central multi-device fleet |
| Driver SOS/messages/TODA fleet | **E missing** in this repository | Full SolAir goals beyond first CPE test | No request/message/fleet backend; do not import completion claims from another project |

## People, enforced permissions and suggested workflows

The database has an `operators` table with username, password hash, device assignment and account revision. It has no driver, engineer or administrator role field or matching permission rules. All assigned ET-01 operators can read/export its records and use available simulation controls. Local computer/terminal authority, rather than an application role, controls provisioning and firmware work. An operator assigned elsewhere is denied ET-01; this is not centralized TODA tenancy.

| Person | Current enforced access | Useful current workflow | Proposed future access/ownership |
| --- | --- | --- | --- |
| Driver | No distinct driver account; an operator account gives operator privileges | With team permission, observe ET-01 status; browser does not arm the board | Assigned vehicle monitoring/help; no engineering, simulation or credential management |
| Operator | Actual session and exact ET-01 assignment | Log in → overview → compare device and browser freshness → expand monitoring/history → export → log out | Organization-scoped fleet, assistance and communication once implemented |
| Engineer | Persona, not an enforced role | Review wiring/config → team uploads → USB ARM/DISARM → match physical input/event with dashboard → save evidence | Protected bench, calibration, provisioning and technical exports |
| Administrator | Persona, not an enforced role; local computer custodian currently | Manage private account creation, backups, network, provisioning and toolchain; preserve existing accounts | Reviewed role/tenant/device administration and secure deployment |

Nominate a credential custodian, hardware lead and evidence recorder. The custodian handles tokens/accounts/private backups. The lead approves electrical configuration, uploads and output tests. The engineer records measurements; the operator verifies the viewing workflow and authorized exports. Engineering and simulation controls should later be separated from normal driver/operator use. This review adds no roles.

## Missing hardware information and prioritized proposals

Only gate the affected stage: an unknown siren driver need not stop bare USB or reviewed input-only tests.

**Needed for USB/inputs:** front/back DevKit photographs with printed GPIO labels; USB bridge marking/VID/PID and COM port confirmed by unplug/replug; GY-521 front/back photographs, regulator marking and schematic or verified supply/pull-up measurements; switch marking/terminal continuity and intended secure mechanical position; breadboard rail continuity; recorded MPU mounting orientation. Previous reports do not approve a reconstructed circuit.

**Needed specifically before HW-548/siren:** clear module front/back photographs, terminal and transistor markings; exact vendor/model schematic with input polarity/current, 3.3 V compatibility, isolation and reset/disconnected-input OFF behavior; siren label/model and steady/inrush current/load type; supply rating/polarity; wire/connector/fuse-holder ratings; lead-approved fuse and switching suppression. Seller claims alone are insufficient. Later ADC/current/GPS/LTE stages need their own carrier schematics and electrical review.

Proposed work only, in priority order:

1. **Safety and physical evidence:** approve rails, logic and contacts first. Keep load disconnected. Measure GPIO27 cutoff and reset behavior, verify the exact driver interface, and review independent hardware protection if a hard maximum is required.
2. **Whole-firmware tests:** add mocked runtime coverage for ARM, debounce, latch, serial flooding, I²C failure, network/NVS delays and timer cutoff. Current portable helper tests do not execute these paths. Investigate the initial launcher shutdown timeout despite the passing rerun.
3. **Clear operator presentation:** isolate the demo FSM/120dB wording, charts, maps, alerts and SMS. Keep actual reported state separate. Improve export pagination/source labels and preserve unavailable values rather than inventing readings.
4. **Documentation:** reconcile older milestone statements with current HTTP/v2 implementation; distinguish research/protocol approval from code existence. This review did not rewrite canonical documents.
5. **Data and credentials:** reviewed TLS, per-device token rotation, retention/backup restore, spool/storage health and lost-event metrics. Finite queues and quarantined flash slots are not a loss-free recorder.
6. **Research integration:** measure sensor calibration, mounting, false positives/negatives; then separately integrate electrical sensing, valid GPS and the LTE carrier. Add approved, versioned fields and forecasting experiment/endpoint labels. Strict v2 rejects ad-hoc extra JSON fields.
7. **Full platform later:** actual tenant/driver/operator/engineer/admin permissions, central multi-device database, SOS/messages/fleet and secure PWA/offline policy. The local CPE path does not complete these features.

**First practical action:** with all power off and HW-548/siren detached, identify the exact board/modules/rails with the hardware lead, then perform Stage 1 bare USB detection using a known data cable. Record the real COM port and sketch before proceeding. Every physical checklist item remains NOT RUN until actual evidence is saved.

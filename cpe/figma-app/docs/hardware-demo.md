# SOLAIR CPE bench demo - October 9, 2026

**October 10 team clarification:** the [staged bench integration procedure](staged-bench-integration.md) is the current input/LED-first plan, including the separate `-BenchIndicator` build, seller-supplied HW-548 claims, proposed terminal map and October 11 fuse/switching gates. No siren compatibility or permanent microswitch placement is yet verified.

**Current implemented architecture (October 10 software hardening): ESP32 → bearer-authenticated HTTP POST → device receiver → validation → atomic SQLite commit → operator-authenticated SSE → dashboard. MQTT is future/optional only. Physical testing is unavailable and has not been performed. See [software hardening](software-hardening.md) for current clock, queue, export and freshness rules.**

The current first software session prepares the team checklist. The team performs physical upload/wiring tests separately and records actual results; software validation does not complete those tests. See [ET-01 handoff](et01-cpe-handoff.md).


Implemented software path: **ESP32 -> Wi-Fi HTTP POST -> Node receiver -> SQLite commit -> authenticated dashboard SSE**. This is not a physical test report or approved research detector. Board/module identity, wiring, upload, switch polarity, sensor readings, siren ratings/timing and offline hardware behavior are **PENDING team confirmation**. Existing sibling serial/MPU diagnostic sketches are preserved.

Real IMU/switch/security/events appear in **Device diagnostics** on the existing dashboard. Real-mode energy/battery/GPS/speed/brake fields show unavailable; separate v1 logs, charts, map imagery and alert history remain labeled examples. No MQTT, GPS, LTE, battery forecasting, brake commands, OTA or dashboard arm/disarm was added.

## 1. Wire with all power disconnected

Reported board: classic **ESP32-WROOM-32D**, 38-pin development board, 4 MB flash. Confirm the actual board/module and flash size. WROOM does not identify the USB bridge or header layout. Use printed **GPIO numbers**, not header position numbers. Proposed pins avoid boot-strapping, flash, UART0 and input-only GPIOs; compare with [Espressif ESP32 pin documentation](https://documentation.espressif.com/esp32_datasheet_en.pdf). This verifies chip suitability, not your physical board.

For initial tests leave the siren and external supply disconnected.

| Component | Connection | Check before power |
| --- | --- | --- |
| MPU6050 SDA | GPIO21 | Module logic/pull-ups must be 3.3 V compatible |
| MPU6050 SCL | GPIO22 | No 5 V pull-ups on ESP32 GPIO |
| MPU6050 GND | ESP32 GND | Common ground |
| MPU6050 supply | ESP32 3V3 **only if the exact module supports 3.3 V input** | Verify breakout/regulator spec; an unidentified GY-521 is not automatically approved |
| MPU6050 AD0 | GND for 0x68 | If deliberately tied to 3V3, set MPU_ADDRESS=0x69 |
| Lid dry contact | GPIO25 to GND through switch | Contact CLOSED to GND while lid securely closed |
| Mount dry contact | GPIO26 to GND through switch | Contact CLOSED to GND while securely mounted |
| Siren control | GPIO27 reserved; leave disconnected pending exact HW-548 review | Firmware assumes LOW=OFF/HIGH=ON; module compatibility unverified |

Use a continuity meter to select the switch contacts. A plunger depressed when secure often needs COM/NO, but verify it. Both GPIOs use INPUT_PULLUP: LOW=CLOSED/ATTACHED, HIGH=OPEN/DETACHED. Broken wire and open contact cannot be distinguished. Debounce is a provisional 50 ms.

**HW-548 correction (October 10):** the supplied module is marked IRF5305S and has Signal Input +/-, DC+/DC- and OUT+/OUT- terminals. It is not the bare N-channel low-side circuit previously described here. The [Infineon IRF5305S documentation](https://www.infineon.com/part/IRF5305S) identifies a P-channel transistor; that alone does not specify the HW-548 input circuitry, isolation, trigger polarity or current rating. Do not use a bare gate/source/drain wiring recipe on this module.

Keep GPIO27 disconnected from the HW-548 and keep SOLAIR_SIREN=0 until the hardware lead verifies the exact board schematic/specification, allowed signal voltage/current, 3.3 V compatibility, OFF polarity, power-up/reset behavior, siren current, supply/fuse and suppression. The current firmware assumes GPIO27 LOW=OFF and HIGH=ON. If the module does not satisfy that interface, review an appropriate interface circuit and firmware together before enabling it. Software LOW cannot guarantee OFF while the ESP32 GPIO floats during reset.

After that review, the team must document the approved terminal-by-terminal wiring for this exact board. Terminal names suggest power input and load output but do not establish an approved connection. Initially test the ESP32 GPIO27 with a meter, with the module and siren disconnected. With power disconnected, stage the approved circuit; then test the module with a suitable test load before connecting the 12 V siren. Never power the siren from GPIO/3V3 or route its current through ESP32 signal wiring.

## 2. Configure privately

Connect PC and ESP32 to the same private **2.4 GHz Wi-Fi** without guest/client isolation. Run `ipconfig` to find the PC Wi-Fi IPv4. The ESP32 must use the PC LAN address; **127.0.0.1 on the ESP32 means itself**.

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\provision-hardware.ps1
```

Enter SSID/password at the hidden terminal prompts, then the PC private IPv4. The script privately generates/reuses a 32-byte token, writes Git-ignored `data/device-token.txt` and `firmware/anti-tamper/secrets.h`. Never share those files, credentials, compiled firmware or flash dumps. Compiled firmware contains the credentials. Use a dedicated bench Wi-Fi credential; rotate provisioning when transferring the project.

The bearer credential travels over HTTP on the bench LAN. This is **not a production TLS/device-identity design**: do not port-forward it or use untrusted/shared Wi-Fi. Token possession authorizes ET-01 publishing; it does not prove sensor authenticity/calibration or stop captured-network replay. Operator login is separate and stays on loopback.

Edit `firmware/anti-tamper/config.h` only after checking wiring:

```cpp
#define SOLAIR_WIRING 1
```

Keep `SOLAIR_SIREN 0` for input/LED tests. Change to `1` only after MOSFET/supply checks. Keep `SOLAIR_MOTION 0` until switch, event and transmission tests work. Defaults are all zero for safe startup. GPIO uniqueness/address checks are enforced at compilation; they do not prove physical wiring.

## 3. Start real receiver and existing frontend

Stop your existing dev:local/backend with **Ctrl+C in its own terminal** to free port 3001. Do not run two backends simultaneously. Existing stored telemetry/accounts are retained.

Terminal A (replace the example address with the actual PC address):

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
$env:SOLAIR_DEVICE_HOST = '192.168.1.123'
node backend/hardware-server.mjs
```

Device receiver listens on **that specific private address, TCP 3002**, at `/ingest`. Operator API stays **127.0.0.1:3001**. If Windows Firewall blocks it, allow inbound TCP 3002 on **Private profile**, scoped to the bench subnet/device. Do not expose all ports or the operator API. If the PC LAN address changes, repeat provisioning/build/upload or reserve it in the router.

Terminal B:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
npm.cmd run dev:frontend -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://127.0.0.1:5173**, log in with an existing operator assigned to **ET-01**, and expand **Device diagnostics**. If none exists, use the existing private interactive `npm.cmd run operator:create` workflow in [local-authentication.md](local-authentication.md). No test bypass. Do not use dev:local for real mode.

Before messages arrive, expect REAL DEVICE / Wi-Fi HTTP with **NEVER CONNECTED/unavailable** values. This mode label alone does not prove a device connected. Real-mode simulator diagnostics are hidden and rejected server-side. The separate v1 simulator starts paused; restored v1 readings remain explicitly simulated.

## 4. Compile and upload the correct firmware

Sketch: **`firmware/anti-tamper/anti-tamper.ino`** inside this website workspace. Do not upload the sibling serial-test/MPU diagnostic when testing this integration.

Reuses Arduino CLI **1.4.1**, existing sibling cache/config `C:\Users\Anyang\SolAir\firmware\arduino-cli.yaml`, pinned **esp32:esp32 2.0.17**, **ESP32 Dev Module**, 4 MB/default partition, 115200 upload. Bundled Wire/WiFi/HTTPClient report library version 2.0.0; esp_timer/esp_system come with the core. No new third-party dependencies. MPU register reads propagate transfer failures directly; existing Adafruit diagnostics remain unchanged.

Compile **after** provisioning and editing config:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\figma-app'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\firmware\build.ps1
```

Upload-ready output: **firmware/build/upload**. `-VerifyAllFeatures` output goes to **firmware/build/software-check-only**; do not upload that software fixture. On another PC, install the documented CLI/core and adjust the cache config/CLI paths; do not select S2/S3/C3.

Upload replaces the board's current application. Preserve existing source/backup, disconnect siren power, identify the actual COM port by unplug/replug in Windows Device Manager, and close serial monitors.

```powershell
$cli = 'C:\Users\Anyang\AppData\Local\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe'
$cache = 'C:\Users\Anyang\SolAir\firmware\arduino-cli.yaml'
$port = Read-Host 'Enter the actual verified ESP32 COM port'
if ($port -notmatch '^COM[0-9]+$') { throw 'Actual detected COM port required.' }
& $cli --config-file $cache upload --profile anti_tamper --port $port --input-dir .\firmware\build\upload .\firmware\anti-tamper
if ($LASTEXITCODE -ne 0) { throw 'Upload failed; do not proceed to siren tests.' }
& $cli --config-file $cache monitor --port $port --config baudrate=115200
```

If stuck at Connecting: hold BOOT, briefly press/release EN, release BOOT when writing starts. Do not erase flash as a first fix. Press EN after upload to capture startup. To send local commands, close CLI monitor and use Arduino IDE Serial Monitor **115200, newline ending**; type `ARM`/`DISARM` and Send. Only one monitor may own the COM port.

## 5. Expected output and physical success checklist

Expected examples **only; not observed hardware evidence**:

```text
SOLAIR-SOFTWARE-2 DISARMED; commands ARM / DISARM; siren timeout 5 seconds
BOOT_HEARTBEAT HTTP=202
SENSOR HTTP=202
HEARTBEAT HTTP=202
ARMED local detector; network not required
LOCAL_EVENT LID_OPEN_DETECTED uptime_ms=... siren=DISABLED max_ms=5000
DURABLE_EVENT HTTP=202
SIREN_OFF timeout; TRIGGERED latch retained until DISARM
DISARMED SIREN_OFF
```

With siren enabled, event says siren=ON. **202** = durable acceptance or exact previously stored retry acknowledgement. **403** = token/origin rejection; **409** = format/order/boot rejection; **503** = storage failure; negative = network failure. No credentials printed. BLOCKED UNCONFIRMED_WIRING or NETWORK_UNCONFIGURED means incomplete setup.

For each step record tester/date/actual evidence; all are **PENDING** until team confirmation:

1. **Startup:** correct COM/upload, one startup banner, dashboard firmware SOLAIR-SOFTWARE-2, DISARMED and GPIO27 LOW. Verify reset/power cycling never sounds the siren.
2. **IMU:** about every 3 s see a new receipt and imuStatus=VALID, chip-axis acceleration m/s2 and angular velocity rad/s. At rest magnitude should be approximately gravity and rotation approximately zero, subject to actual bias/mounting. Gently tilt/rotate and observe response. This is functional testing, not calibration. Current failed readings are null; retained readings marked OUTDATED. Resolve faults and reset to reinitialize.
3. **Switches while disarmed:** secure contacts give CLOSED/ATTACHED and VALID; opening each gives OPEN/DETACHED. Neither should sound the siren or create tamper events while DISARMED.
4. **Lid:** close contacts, wait >=10 s after boot, send ARM, open lid contact >50 ms. Expect local LID_OPEN_DETECTED, reported TRIGGERED, timestamped dashboard event and GPIO27 HIGH only if enabled, then LOW after five seconds. TRIGGERED stays latched; it does not mean the siren is still sounding.
5. **Mount:** DISARM, close both, ARM, open mount contact; expect MOUNT_DETACH_DETECTED. First trigger wins while latched; subsequent causes generate no events until DISARM/rearm.
6. **Stop:** during output send DISARM; expect immediate LOW/DISARMED. Test actual siren only after LED/meter and driver/supply checks.
7. **Offline:** ARM securely, disable bench Wi-Fi, open contact; local event/output must still work. Dashboard heartbeat stale at 15 s/absent at 30 s; sensors stale at 10 s/outdated at 30 s. Restore Wi-Fi: HTTP202 resumes and queued event appears with original boot uptime and later receipt timestamp. Physical deadline behavior must be measured; a separate network task only establishes the intended separation.
8. **Restart:** note boot/sequence/receipt; refresh/navigation and backend restart retain event/original receipt. Reset ESP32: DISARMED, new boot UUID, zero counters; historical events remain, old IMU vectors are not shown as new-boot readings.
9. **Optional motion:** once core passes, set SOLAIR_MOTION=1, rebuild/upload and test armed with siren disabled. Rule: acceleration magnitude deviation from gravity >4 m/s2 OR angular-speed magnitude >1.5 rad/s for >=200 ms. These are **unvalidated bench heuristics**, not research thresholds/theft-classifier evidence. Record actual vectors, mounting and false positives/negatives before using motion to sound a siren.

## Contract, timing, durability and limits

Reuses [v2 telemetry contract](telemetry-contract.md), [field mapping](telemetry-field-mapping.md), [firmware handoff](telemetry-firmware-handoff.md). Agreement remains provisional. Every message: schemaVersion=2, source=device, ET-01, firmwareVersion, random UUID per boot, independent sequence per type, uptimeMs. Initial device_heartbeat sequence0 activates the boot. Heartbeat 5 s, telemetry 3 s, event on first local trigger. Zero stays zero; unsupported battery, power, speed, brake, GPS and forecasting fields stay null.

MPU configuration: 0x68/0x69; WHO_AM_I=0x68; 100 kHz I2C; bounded transfers; +/-2 g, +/-250 deg/s, 21 Hz filter; complete 14-byte burst/configuration readback before conversion. Units follow the existing diagnostics and [TDK register map](https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf). This proves no module authenticity, mounting transform or calibration. IMU faults do not disable switch alarms; motion requires current valid reads.

Firmware sends **sampledAtUtc=null, clockSynchronized=false** until a valid SNTP callback. Then it emits real system UTC ISO timestamps; sync trust expires after 24 hours without refresh. Uptime is never converted into wall-clock UTC. Live heartbeat/sensor messages retain a provisional ±5-second clock-delay budget. Historical events allow old UTC, reject future UTC beyond 5 seconds, and never update live receipts. NTP accuracy/network behavior remain unverified physically.

Real messages and ordering/snapshot commit atomically in **data/device-telemetry.sqlite**, separate from v1 telemetry and authentication. SSE follows commit. Rejection/write failure preserves accepted count, readings, sequence/order and receipt. Exact retries acknowledge without changing freshness. Backend restart restores receipts/count/order/latest 20 events. No purge/backfill. Authenticated GET **/api/diagnostics/events** returns latest 100 real events; v1 CSV remains simulated-only; authenticated **/api/diagnostics/export.csv** separately exports real-v2 records, with explicit provenance and accepted-retry metadata.

Offline event queue: **8 immutable NVS slots** (max 1,023 JSON bytes per event) persist unsent events with original boot/sequence/time identity. CRC/length/magic failures quarantine a slot without overwriting it. Full/write-failed storage uses the existing **16 RAM entries plus pending delivery**, with an explicit reset-loss warning. Retry is bounded to one NVS and one RAM event per 5 seconds, rotating NVS slots so a rejected event cannot block every other slot. Delete only after exact backend durable acceptance acknowledgement; delete failure causes safe duplicate retry. Storage persistence is tested using a mock adapter, not physical flash/power loss. No automatic purge, remote control or backup-power guarantee. Local ARM/latch intentionally resets to DISARMED. An independent esp_timer one-shot forces the GPIO LOW at the five-second deadline; timer creation/start failure keeps output off. The loop also checks timeout. This software safeguard does not replace physical timing verification or rated hardware protection.

For a safe backup, stop hardware-server with Ctrl+C then copy the closed device database. Do not copy only an open SQLite main file without its WAL. Keep authentication/token files private and separate.

## Software checks versus physical evidence

Automated checks use temporary device, telemetry and authentication databases, generated test credentials and real operator login. They do not open working databases or contact hardware.

```powershell
node scripts/check-telemetry-simulation.mjs
node scripts/check-telemetry-contract.mjs
node scripts/check-telemetry-backend.mjs
node scripts/check-telemetry-storage.mjs
node scripts/check-auth.mjs
node scripts/check-diagnostics.mjs
node scripts/check-hardware-integration.mjs
node scripts/check-software-hardening.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-firmware-software.ps1
node scripts/check-dev-local.mjs
npm.cmd run build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\firmware\build.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\firmware\build.ps1 -VerifyAllFeatures
```

These establish compilation/software receiver behavior only. Browser visual checks, physical ESP32 transmission, upload, wiring, siren and all manual checklist items remain PENDING until confirmation.

> Current prepared candidate **2.0.19**, 23October: explicit three-state FSM, guarded validated battery/solar channels and concurrent motion evidence. Last confirmed physical upload2.0.17. See [team integration contract](../docs/SOLAIR_CPE_2.0.19_INTEGRATION_CONTRACT.md); calibration/motion gates remain off until physical reference acceptance. Earlier entries are historical.

> **23 October current prepared candidate: 2.0.18.** See [integrated LTE location release](../docs/LTE_LIVE_LOCATION_RELEASE.md) for permanent-host discovery, autonomous startup and retained ACS wiring. Last confirmed physical upload remains2.0.17. Older upload/version/temporary-only guidance below is historical; no automatic re-upload or bench retest is ordered.

> **20:50 actual-device update:** 2.0.17 is uploaded and its verified A1 reports are accepted after the shared-schema correction. Keep this firmware and the confirmed wiring. Follow the current load-response step in `docs/CLOUD_CONTINUATION.md`; do not re-upload or repeat the quiet capture from older instructions. ACS amperes remain uncalibrated.

> **22 October latest prepared candidate: 2.0.17, verified ADS register acquisition.** Actual device confirmed 2.0.16; keep the user-confirmed A1/divider wiring. Reopen `arduino-ide/solair_cpe/solair_cpe.ino` from disk for the next upload. This candidate checks I²C transaction status, conversion channel/gain/mode/rate and timeout before accepting readings. Source/credentials/GPIOs/current-calibration gate remain unchanged. Follow the current note in [ACS instructions](../docs/ACS_ADS1115_A1_FIX.md). Exact configured core3.3.12 compile PASS: 1,224,044 bytes flash / 53,112 bytes RAM; this is not a physical voltage/current PASS.

> **22 October current candidate:2.0.16 ADS1115A1 ACS acquisition.** Actual device remains2.0.15until uploadconfirmed. Follow [the exact wiring/upload step](../docs/ACS_ADS1115_A1_FIX.md): removeA1groundtie andconnectit totheexistingdividernode; currentcalibrationstaysdisabled. AllpassedtestsandotherGPIOsretained. Software/buildPASSisnotphysicalACSaccuracyPASS.

> **22 October 15:03: actual 2.0.15 uploaded and bounded LTE/clock capture passed.** Keep this firmware. Earlier prepared/upload instructions below are historical; do not re-upload or repeat the capture merely because of them. USB first-connect/no-refresh repeatability remains separately unconfirmed; remaining physical acceptance gates are unchanged.

## Current prepared integration — 2.0.15, 22 October afternoon

Same integrated Arduino sketch and private configuration; source includes the unset1970modem-date guard, PPP UTC fallback, verified-HTTPS Date correction and accurate bounded rejection diagnostics. App LTE commands use backend UTC; browser handles sustained binary USB noise with one same-port reopen. See latest CLOUD_CONTINUATION. Compilation is PASS; actual physical upload remains2.0.14 until new reports arrive. No new wiring or repeat of completed GPS/alarm tests is requested. Earlier2.0.14 source entries below remain historical.

## Current prepared integration — 2.0.14, 22 October afternoon

Open `arduino-ide/solair_cpe/solair_cpe.ino` from disk for the consolidated upload; it includes prior response diagnostics and runtime HTTPS destination saving. The ignored private configuration has the active public address and existing credentials/CA/GPIO/calibration flags. Keep ESP32 Dev Module / installed core3.3.12 / actual port. No separate diagnostic or 2.0.13 upload is needed. See `../docs/LTE_RUNTIME_DESTINATION.md` for exact upload, saved-address confirmation and actual LTE receipt verification. Hardware upload and flash persistence remain unconfirmed until device reports arrive. Prior sections below are retained historical evidence, not the active upload order.

## Current prepared repair — 2.0.12, 22 October

## Prepared2.0.13 — bounded AT response evidence

Adds optional160-character `cpe.lte_at_diagnostic` for AT/ATH categories (rx, NUL/binary bytes, PPP flags, recognized startup/shutdown and numeric result notices), without raw replies/identifiers/credentials. Preserves embeddedNUL when matching complete response lines. Strict terminal success, existing TLS verification, UART/GPIO/privateconfig and ACS calibration gates remain unchanged. Exact configuredArduino3.3.12 build passes1,223,792flash/53,000RAM; host/contract/browser fixtures pass. No physical upload or LTE-recovery PASS is implied. See docs/CPE_PARALLEL_FINISH_PLAN.md. At02:30 a new2.0.12boot started registration; hold another upload while checking that actual run.

Unanswered periodic AT queries now expire even while recovery owns UART; explicit commands no longer return without transmission due to a stale pending flag. Separate AT/ATH result and byte-count diagnostics; complete-line OK/NO-CARRIER parsing; explicit data-call cleanup retained. Exact private Arduino3.3.12 compilation and host/safety/ACS fixtures PASS; device upload and LTE recovery pending. Reopen `arduino-ide/solair_cpe/solair_cpe.ino` from disk, preserve private config. See newest [continuation](../docs/CLOUD_CONTINUATION.md).

## Current prepared repair — 2.0.11, 22 October

Explicitly hang up a retained modem PS call after PPP cleanup and before fresh dialing;+++alone leaves the call suspended. Dial rejection, IP timeout and PPP error/phase now have distinct diagnostics. Exact private Arduino3.3.12 compile PASS(1,221,556flash/52,936RAM); physical upload/warm-reset verification pending. Reopen `arduino-ide/solair_cpe/solair_cpe.ino` from disk. Existing private configuration and GPIO architecture are preserved. Follow newest [continuation](../docs/CLOUD_CONTINUATION.md).

## Current prepared repair — 2.0.10, 22 October

Modem command recovery now retries after late startup / retained data sessions and reports waiting reasons. Explicit Start/Stop streaming intent survives MCU resets; first boot remains paused. Validated modem clock restores MCU time for verified HTTPS after reset. Exact private Arduino3.3.12 compile PASS (1,220,128flash /52,920RAM); physical upload and warm-reset recovery remain pending. Reopen `arduino-ide/solair_cpe/solair_cpe.ino` from disk; preserve its private config and installed core. Follow the newest [continuation entry](../docs/CLOUD_CONTINUATION.md). Earlier2.0.9 paused-on-every-reset instructions apply to that historical version.

> Latest21October: **2.0.6** adds explicit USB-triggered modem UTC synchronization and visible clock/revision/status after actual2.0.5returnedTLS715. It is compiled, not uploaded/physicallyproven. Follow the newest entry in [Smart LTE guide](../docs/LTE_SMART_BENCH_2026-10-21.md).

## Actual LTE delivery verified — 2.0.9, 21 October 22:02 Manila

Preserve the current2.0.9/privateconfiguration. AfterMagicData99activation and2.0.9upload, the actualdevice delivered34newnonhistoricalLTErecords over119seconds withUSBserverforwardingoff, advancingbootsequence/uptime andqueue_dropped0. This is a physicalshort-live-deliveryPASS, not compilation/duplicateUSB/fixtureevidence. Meaninterval3.608s/max14.208s; longsoak/recovery/electricalreleaseandGPSfix/movementremainpending. KeepLTEstreaming, USBserialopeninmonitor-onlymode andlaptop/server/tunnelonline. ThiscommissioningbuildbootsPAUSED; it is notyetautonomousvehicledeployment. Privateignoredsnapshotretained; do notpublishprovisionedconfig/binaries. See [validation](../docs/CPE_VALIDATION.md).


## Current required streaming repair — 2.0.9 after 21:46 monitor test

Working device is still2.0.8: oneHTTPS200afterMagicDataactivation,butcontinuednetworkfailuresandnostoredLTErows. Uploadthepreparedfinal2.0.9 now: itaddsIPv4/longerboundedconnectiontimeouts,distinctDNS/TCP/TLS/HTTPerrorsintheSerialstatusline,command-moderecoveryandPPPrebuildaftertwoconsecutivenetworkfailureswithoutacknowledgingqueueddata. ExactprivateArduino3.3.12compilePASS1,217,868flash/52,920RAM;hostpolicyfixturesPASS. Physicalrecovery/deliverypending. Afteruploadreload/reconnectCPELab115200,confirm2.0.9,uncheckForwardUSBreadingstoserverandStartLTEstreaming;keepUSBopenformonitoring. See latest [LTE bench guide](../docs/LTE_SMART_BENCH_2026-10-21.md). This supersedes earlierinstructions toretain2.0.8 or closeUSB duringthetest. No pins/privatecredentials changed.


## Latest LTE bench build — 2.0.9

2.0.8 got a PPP address but returned a generic socket/HTTPS error. Prepared2.0.9 adds explicit IPv4 connection selection, longer bounded TCP/TLS timeouts and distinct DNS/TCP/TLS/HTTP diagnostics; verified HTTPS remains required. Private configuration and wiring stay unchanged. Arduino3.3.12 exact final compilePASS1,217,660flash/52,920RAM. Actual modem delivery is pending. WebsiteUSB ingestion is now sequential to prevent delayed frames overtaking each other; refresh after upload. Use the [latest LTE guide](../docs/LTE_SMART_BENCH_2026-10-21.md) and finalArduino`solair_cpe.ino`, not older version instructions below.


## Current LTE bench upload — 2.0.8 (21 October evening)

The tested2.0.7 built-in modemHTTPS still returned715 despite correctUTC and the RSA endpoint. The final private Arduino sketch is now prepared as2.0.8 using opt-inPPP on installedArduino3.3.12 and ESP32 CA/hostname-verifiedHTTPS. Default examples and pinnedArduino2.0.17 retain PPPdisabled. Do not use the legacy core for a PPP-enabled upload. No partition or pin change is needed. Exact configured compilePASS1,215,204flash/52,920RAM; actualPPP/IP/TLS delivery is untested. Keep private config and reopen `arduino-ide/solair_cpe/solair_cpe.ino` from disk. Disconnect websiteUSB/closeMonitor, uploadESP32DevModule with installed3.3.12/actualport, reload/reconnect115200, confirm2.0.8, clickTestLTEuploadonce. See latest [LTE guide](../docs/LTE_SMART_BENCH_2026-10-21.md) for current endpoint, controls, evidence and acceptance limits. Historical2.0.3 directions below do not override this current LTE bench build.


> 21 October current commissioning package: **2.0.5** adds USB-controlled single LTE send / streaming / stop. The locally configured final Arduino sketch starts paused with Wi-Fi disabled for this test; trusted HTTPS and a private provisioned device token are prepared. Upload and actual LTE delivery remain pending. Follow [Smart LTE current step](../docs/LTE_SMART_BENCH_2026-10-21.md). Do not upload the ignored fake compile-proof sketch.

# SOLAIR CPE firmware — Windows quick start

**19 October Linux bench update:** final firmware `solair-cpe-2.0.3` uses the native ADC1 driver on the existing GPIO34, following the user's stable native Test06a readings. Voltage conversion uses the chip's factory eFuse calibration; missing calibration/read failures produce unavailable voltage rather than a guessed correction. ACS current remains uncalibrated until reference testing. The generated final IDE sketch is `arduino-ide/solair_cpe/solair_cpe.ino`; reopen it from disk and preserve its existing private configuration. Keep the divider wiring unchanged and siren12V disconnected for upload. This prepared change still needs an actual dashboard/meter comparison; compilation does not establish physical repair. See [validation](../docs/CPE_VALIDATION.md).

Use the centralized app at `C:\Users\Admin\Videos\SolAir\next-platform\solair-platform`.
New production entry: `solair-cpe/solair_cpe.ino`; its shared code is `engine.h`, `modules.h`, `pins.h`, `protocol.h`.
The older `esp32-solair` source is preserved as historical source; do not upload it for this new test sequence.

## Tools and dependencies

Node 24 and npm for the app. PlatformIO 6.1.18 in project `.tools/cpe-python`, espressif32 6.10.0, ESP32 Dev Module (`esp32dev`, classic WROOM, 4 MB flash), Arduino ESP32 **2.0.17**. No board core upgrade is required. `platformio.ini` pins ArduinoJson 7.3.1, MPU6050 2.2.6, ADS1X15 2.5.0, TinyGPSPlus 1.1.0 and EspSoftwareSerial 8.2.0. Transitive versions are recorded in the compile logs.

On a fresh transfer, in PowerShell at the project root:

```powershell
python -m venv .tools\cpe-python
.\.tools\cpe-python\Scripts\python.exe -m pip install platformio==6.1.18 pyserial==3.5
```

`scripts/cpe-build.ps1` uses a short `.cpe-tools` junction at the archive root to avoid Windows toolchain path limits. It links to this project's `.tools/platformio`; it does not delete/move the toolchain. Keep only one extracted app owning that junction, or set an explicit short `PLATFORMIO_CORE_DIR` when invoking PlatformIO directly. Do not point it at an unrelated checkout.

## Configure / compile / identify / upload / monitor

1. Preserve the source/config of the existing ESP32 program. Review [the wiring guide](../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md). Disconnect all powered loads before flashing; upload resets the ESP32.
2. Copy `firmware/solair-cpe/config.example.h` to ignored `firmware/solair-cpe/solair_config.h` and privately edit values. Do not post this file, compiled provisioned binaries, Wi-Fi credentials or device tokens. All unknown electrical interfaces default disabled. Set only the feature flags whose wiring gates passed. Record pin/polarity changes in the guide. `LOAD_MODE` is `bench_resistor` for resistor tests, never `vehicle_charging` by default. Set `PZEM_SOURCE` to `bench_supply` for adapter tests; only use `mppt_output` when the meter is physically on the actual controller output.
3. Compile first; this command **does not upload**:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 00_esp32_boot_and_status_led
```

4. Identify the CP2102 port by unplug/replug comparison in Device Manager → Ports. Bluetooth COM ports are not the ESP32. Enumeration command:

```powershell
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
```

5. Close all serial monitors, select the **observed** port, then upload. Substitute its name for `COM_NUMBER` (a placeholder, not a valid port):

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 00_esp32_boot_and_status_led -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Console is 115200 baud. Use newline for uppercase `ARM`, `DISARM`, `LED`; diagnostics 03/04 use `ON` and `OFF`. Production supports the existing USB JSON arm/disarm/alarm_off/led_test commands too. These are USB commands, not remote Wi-Fi commands. Baseline motion calibration uses measured configuration, not automatic physical approval.

Production `SENSORS OFF` / `SENSORS ON` pause/resume commissioned acquisition for fault/recovery checks while switch security remains active. Stage06 `ZERO` collects64 actual ADC samples and prints a proposed sensor-side zero coefficient; it does not automatically approve calibration or set `ACS_CALIBRATED`. Verify zero current independently before that command.

6. Repeat with each target below. Each folder has a README with modules, wiring gate, expected observations, exact invocation and cleanup. Test 10 and 11 use the exact production engine, not a second production firmware.

| Stage | Target / source | Gate |
|---|---|---|
| 00 | `tests/00_esp32_boot_and_status_led` | USB + GPIO19 LED/330 Ω only |
| 01 | `tests/01_i2c_mpu6050` | Verified 3.3 V-compatible GY-521, I2C21/22 |
| 01a | `tests/01a_imu_wire_crosscheck` | Independent Arduino/Wire identity comparison; USB-only ESP+IMU, no other modules. Use the generated IDE sketch or Linux wrapper; no sensor reset/config writes. |
| 02 | `tests/02_tamper_switches` | COM GND, NO25/26, NC unused |
| 03 | `tests/03_mosfet_logic_led_first` | HW-548/12 V disconnected; GPIO27 meter/LED test |
| 04 | `tests/04_12v_alarm_fused` | Confirmed polarity + protection; `ENABLE_ALARM` and `ALARM_POLARITY_VERIFIED` |
| 05 | `tests/05_ads1115` | ADS VDD=3.3 V, shared I2C, safe A0 reference |
| 06 | `tests/06_acs758` | Conditioned GPIO34, `ENABLE_ACS`; calibrated coefficients before usable amperes |
| 06a | `tests/06a_adc_wire_crosscheck` | Independent v2 native raw-count/error comparison on GPIO34/35, without voltage conversion, current-path load or sensor libraries. GPIO35 is diagnostic only. See its README. |
| 07 | `tests/07_gps_neo6m` | Verified TX level to32, `ENABLE_GPS`; RX-only software UART9600 |
| 08a | `tests/08a_a7670e_usb_at/usb_at.py` | Actual carrier USB AT port/power; no ESP connection |
| 08b | `tests/08b_a7670e_esp_uart` | UART translator verified, RX13/TX14, `ENABLE_LTE` |
| 09a | `tests/09a_pzem_usb_modbus/pzem_usb.py` | Manufacturer shunt map, isolated low-power bench, USB-RS485 |
| 09b | `tests/09b_pzem_esp32_max3485` | 3.3 V MAX3485, RX16/TX17/DIR23, `ENABLE_PZEM` |
| 10 | `tests/10_wifi_authenticated_ingest` | Device provisioned in CPE Lab; actual PC LAN IP |
| 11 | `tests/11_combined_all_sensors_soak` | All individual stages; concurrent real measurements |
| Final | target `integrated`, `solair_cpe.ino` | Enable only commissioned modules in private config |
| Coverage | target `compile_all_only` | **Never upload**; forces input drivers on for compile coverage |

Final build/upload uses `-Target integrated` in the commands above. Binaries are under `firmware/solair-cpe/.pio/build/<target>`; never share a binary containing credentials. The upload wrapper rejects `compile_all_only`.

PlatformIO is the compiled CLI path on this device. Arduino IDE users: use the clean folders in [arduino-ide](arduino-ide/README.md), which remove duplicate PlatformIO wrappers and localize shared headers. Select ESP32 Dev Module and your observed COM3 port. The IDE packaging was checked; actual Arduino IDE Verify/Upload remains unexecuted here.

## Local app and genuine ingestion

```powershell
Set-Location 'C:\Users\Admin\Videos\SolAir\next-platform\solair-platform'
npm.cmd ci
ipconfig
$env:SOLAIR_INGEST_HOST = '<actual-private-PC-IPv4>'
npm.cmd run dev
```

Browser `http://127.0.0.1:3000`; app/API remain loopback. Optional LAN listener exposes **only** `POST http://<actual-PC-IPv4>:3002/api/ingest`, never the login/dashboard. Same backend/auth/device tables serve both. Local SQLite is `data/solair.db`; migrations initialize on startup. Preserve existing DB; new table migration is additive. Development accounts are documented in the existing app README, not device tokens. Hosted Supabase/Postgres uses the same schema/API; no cloud credentials are invented.

Sign in as engineer, select Real hardware mode, CPE Lab, then provision/rotate the selected device credential only when needed. Rotation revokes its old token. Copy it privately to `DEVICE_TOKEN`, match the exact selected `DEVICE_ID`, set Wi-Fi and `INGEST_URL`. Private local HTTP requires `ALLOW_PRIVATE_BENCH_HTTP=true`; it deliberately exposes a bearer token on the isolated bench LAN. Scope firewall TCP3002 to the Private bench network/device. Production Wi-Fi uses HTTPS plus `ROOT_CA`; certificate verification is never bypassed.

LTE diagnostics implement AT/SIM/CSQ/registration/attachment. Firmware2.0.4 adds opt-in A76XX HTTPS/CA provisioning, TLS1.2/server/SNI/certificate-time verification and upload-failure failover. `LTE_HTTPS_ENABLED=false` is the default; actual carrier power/UART, firmware command support, modem clock, reachable endpoint and real POST acceptance remain commissioning gates. `LTE_APN=""` preserves the SIM/carrier profile; `LTE_TEST_ONLY` permits an isolated cellular-delivery test. The existing private-HTTP route remains limited by `LTE_HTTP_BENCH_COMMISSIONED` and a reachable private endpoint; public cellular service cannot ordinarily reach the laptopLAN. No TLS bypass/publicHTTP-token fallback. AT/OK is not cellular delivery. See [Smart LTE bench preparation](../docs/LTE_SMART_BENCH_2026-10-21.md).

## Validation and physical evidence

See [acceptance](../docs/COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md) and [results](../docs/CPE_VALIDATION.md). Compilation is not upload, physical measurement, UART soak success or reset-safe siren proof.

Current bench clarification: see [team measurements and remaining gates](../docs/CPE_HARDWARE_CLARIFICATION_2026-10-11.md). Keep GPIO27 active-HIGH; reset-safe OFF remains pending. PZEM range must read back50 A before readings become valid; stage09a documents the optional, separately gated laptop setup command.


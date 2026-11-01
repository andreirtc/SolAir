# SOLAIR — follow this wiring and test guide

15 October 2026 · local Linux laptop · one ESP32 · existing SOLAIR application

**Start at 00. Upload one test, check its result, power off, then move to the next.** You do not need to ask between successful stages. If a stage is marked HOLD or fails, record it and continue only with independent stages. Ask for help with the exact failing stage and its serial output. A HOLD identifies a connection that the actual board documentation/measurements have not yet established.

## 1. Fixed ESP32 pin map

Read the **GPIO label printed on your board**, not the pin's position counted from USB. `G21` / `IO21` / `GPIO21` mean GPIO21. If your board labels differ or are unclear, stop rather than count header positions.

| ESP32 label | Connect to | Status / rule |
|---|---|---|
| USB | Laptop USB data cable | ESP power and upload/monitor. |
| 3V3 | Verified MPU VCC; ADS VDD; verified MAX3485 VCC | Low-voltage sensor supply. Never 12 V. |
| GND | MPU GND; ADS GND + ADDR; switch COMs; LED cathode; approved MAX3485 reference | Verify breadboard rail continuity. Other powered/isolated boards need their own reference review. |
| GPIO21 | MPU SDA **and** ADS SDA | Shared I2C data. |
| GPIO22 | MPU SCL **and** ADS SCL | Shared I2C clock. |
| GPIO25 | Lid switch NO | COM to GND; NC unused. |
| GPIO26 | Mount switch NO | COM to GND; NC unused. |
| GPIO19 | 330 Ω resistor → status LED anode (+) | LED cathode (−) to GND. |
| GPIO27 | Verified HW-548 Signal+ | Active-HIGH. Connect only after Test03 and the Test04 electrical checks. |
| GPIO34 | Reviewed, conditioned ACS output | **HOLD:** never raw/unverified ACS VOUT. |
| GPIO32 | GPS TX | **HOLD** until actual breakout supply and 3.3 V-compatible TX are confirmed. GPS RX unused. |
| GPIO16 | MAX3485 RO | PZEM UART receive. |
| GPIO17 | MAX3485 DI | PZEM UART transmit. |
| GPIO23 | MAX3485 DE **and** /RE | Both share the GPIO23 node. |
| GPIO13 | Verified translated LTE TX | **HOLD:** unidentified white connector/native UART must stay disconnected. |
| GPIO14 | Verified translated LTE RX | Same LTE gate; USB modem test first. |
| 5V / VIN | Leave disconnected while ESP is USB-powered | Do not also feed buck 5 V into ESP. |

GPS, PZEM and LTE keep the assigned serial pins above. Do not move GPS to GPIO16; that pin belongs to PZEM.

## 2. Rules used at every stage

| Item | Do this |
|---|---|
| Before moving wires | Unplug ESP USB and turn off every external supply. |
| Individual tests | Connect only the module being tested. Photograph/label earlier working wiring before removing it. |
| ESP supply | USB only. Disconnect buck OUT+ from ESP 5V/VIN. |
| Sensor supply | Measure the 3V3-to-GND rail first. Use only boards approved for that supply. |
| Breadboard | Five holes in one connected strip are one node. Rail breaks and centre gaps are not automatically bridged. Check continuity unpowered. |
| LED | Resistor legs go in **different connected strips**; LED legs also go in different strips. One 330 Ω resistor per LED. |
| Load wiring | Siren, shunt and resistor-load current stay off the breadboard. Keep battery, solar panels, MPPT and wind disconnected for these bench tests. |
| Unknown boards | Follow HOLD. A printed module name does not establish carrier supply, terminal order or logic translation. |
| Result | PASS needs the stated physical observations. I2C address/compilation/AT OK alone is insufficient. |

## 3. Same Arduino IDE procedure every time

Sketch root: **`~/SolAir/next-platform/solair-platform/firmware/arduino-ide/`**.

1. Connect ESP USB. On this Chromebook, share the serial USB device with Linux if prompted; otherwise find it in ChromeOS Linux USB preferences.
2. Open the stage's `.ino` listed below, **inside the folder with the same name**. Never paste it into `modules.h`, and do not open the PlatformIO `entry.cpp` version.
3. Tools → Board → esp32 → **ESP32 Dev Module**. Keep Espressif core **2.0.17**. Tools → Port → the actual connected ESP port. Start with Upload Speed **115200**.
4. Close Serial Monitor and disconnect any CPE Lab USB connection. Click **Verify ✓**, then **Upload →**. If stuck at Connecting, hold the actual board's BOOT button while connection starts and release when writing begins.
5. Open Serial Monitor: **115200 baud**, **Newline**. Commands are uppercase: `ON`, `OFF`, `ARM`, `DISARM`, `LED`, as specified per test.
6. Save the result and complete serial lines. Power off before the next wiring change.

If no port appears, compare this command before/after USB connection:

```bash
solair-cpe integrated ports
```

Try another known data cable/USB socket and confirm Linux USB sharing. A board power LED alone does not establish a USB data connection. Do not select a guessed `/dev/ttyUSB0` or old Windows COM number.

On15 October the connected CP2102 was actually detected at **`/dev/ttyUSB0`** by Linux and Arduino IDE discovery. Select **ESP32 Dev Module** manually even if the port has no recognized board name; do not choose the unrelated `/dev/ttyS*` ports. Recheck after reconnecting because the port number can change. A CLI recheck allowing startup discovery time is `arduino-cli --config-file ~/.arduinoIDE/arduino-cli.yaml board list --discovery-timeout 5s`. If a library-update operation hangs, preserve/save the sketch, close/reopen the local IDE and check whether it completes; avoid starting another bulk update during testing. The installed SOLAIR dependencies are already present.

**Private settings:** when instructed, copy that sketch folder's `config.example.h` to **`solair_config.h` in the same folder**, only if absent. Open it as an Arduino IDE tab. Change the existing `#define` value; do not add conflicting duplicates. Preserve existing private settings. Each sketch has its own config; settings do not transfer automatically. All unrelated/unverified `ENABLE_*` values stay `false`.

**If compilation says `invalid option 'ZigbeeMode'` after changing cores:** core2.0.17 does not define that newer-core option. This is an IDE board-state problem, before firmware compilation. Save sketches and quit **every** Arduino IDE window. Back up `~/.config/arduino-ide/` privately before resetting its UI state, as described in [Arduino issue1762](https://github.com/arduino/arduino-ide/issues/1762); do not erase `.arduino15` (installed tools) or `.arduinoIDE` (configuration), sketches or private firmware settings. Reopen, manually select ESP32 Dev Module and the observed port, and Verify again. Merely restarting/reselecting the same board may retain the stale option. A reset's UI preferences must be reselected; keep the backup for recovery.

## 00 — ESP and LED

Open [00_esp32_boot_and_status_led.ino](../firmware/arduino-ide/00_esp32_boot_and_status_led/00_esp32_boot_and_status_led.ino). No private settings needed. HW-548 and 12 V disconnected.

| From | To |
|---|---|
| Laptop USB | ESP USB |
| GPIO19 | 330 Ω resistor leg 1 |
| Resistor leg 2 | LED anode (+), usually long leg |
| LED cathode (−), usually short leg/flat side | ESP GND |

Upload using section 3. **PASS:** LED blinks and `BOOT uptime_ms=... LED19=...` keeps increasing. This also establishes an actual upload from this laptop.

## 01 — IMU

Open [01_i2c_mpu6050.ino](../firmware/arduino-ide/01_i2c_mpu6050/01_i2c_mpu6050.ino). Test01 enables its MPU acquisition automatically. Use the team's verified 3.3 V-compatible breakout.

| IMU terminal | ESP / connection |
|---|---|
| VCC | 3V3 |
| GND | GND |
| SDA | GPIO21 |
| SCL | GPIO22 |
| AD0 | GND |
| INT, XDA, XCL | Leave disconnected |

Upload. **PASS:** detected at `0x68`, `initialized=1`, `read_valid=1`; still/flat acceleration magnitude roughly 9.8 m/s²; tilt shifts gravity between axes; rotation changes gyro then it settles when stopped. Your reported `WHO_AM_I=0x70` uses the separate MPU6500-compatible profile automatically in this test. Do not change the I2C address to `0x70` or modify the Adafruit library. Authenticity/calibration remain separate from this sanity test.

**If `bytes=0 WHO_AM_I=unavailable`:** no identity byte was received; do not interpret the zero vectors. `register_status=0` does not prove ACK in this repeated-start implementation. Power off, disconnect ADS and all other modules, and test ESP+IMU only with the five wires above. Use good short jumpers and actual soldered header contacts, preferably bypassing suspect breadboard rails. Measure VCC relative to GND at the IMU pins while powered; it should agree with the intended3.3 V supply. Send `SCAN` at115200/Newline and save the actual address lines. No0x68 or unstable/many-address results require wiring/power/bus investigation. Stable0x68 with persistent zero-byte identity reads still needs investigation; do not guess an offset, change address to0x70 or bypass identity checks. Keep core2.0.17 for this project's baseline. If still failing, provide SCAN, the complete probe/error lines and module-pin voltage.

### 01a — if Test01 still returns zero bytes

Use the same isolated five-wire ESP+IMU setup above, USB only, other modules and siren disconnected. Open [01a_imu_wire_crosscheck.ino](../firmware/arduino-ide/01a_imu_wire_crosscheck/01a_imu_wire_crosscheck.ino), Verify/Upload as ESP32 Dev Module/core2.0.17. Close the old Serial Monitor before uploading. Open the new monitor at115200/Newline. **No private settings or SCAN command are needed.**

Startup prints `INDEPENDENT MPU WIRE CHECK v1`, then `SCAN`/`SCAN_END`. Every5seconds it prints BUS_IDLE, ADDRESS and IDENTITY lines for both0x68/0x69 at100kHz/25kHz with STOP and RESTART reads. Save startup plus one entire block ending `END_MPU_CHECK`, and actual IMU VCC-to-GND meter voltage. This comparison uses only Arduino/Wire, not the MPU library or production scanner; it does not reset/configure the sensor or produce motion readings.

| Result | What to do |
|---|---|
| No0x68/0x69 response | Check actual supply, soldered contacts, pin labels, jumpers and reference; cause not yet identified. |
| Stable0x68 and one identity byte0x68/0x70 | Return to Test01 for configuration/full frames/gravity/tilt/rotation. This alone is not a motion PASS. |
| Only0x69 responds | Verify AD0/address selection unpowered; record actual result before a firmware change. |
| ACK but zero identity bytes for all methods | Keep result BLOCKED and report full block plus meter/contact evidence. |
| STOP works but RESTART fails, or only25kHz works | Preserve the difference; report it before changing production transactions/speed. |

The `queued_not_ack` label deliberately distinguishes queued pointer status from an actual completed-write response. See [01a details](../firmware/solair-cpe/tests/01a_imu_wire_crosscheck/README.md). No automatic calibration or guessed cause is applied.

## 02 — switches

Open [02_tamper_switches.ino](../firmware/arduino-ide/02_tamper_switches/02_tamper_switches.ino). No private enable change needed for this diagnostic. Identify COM/NO/NC by labels and unpowered continuity.

| Switch terminal | Connect to |
|---|---|
| Lid COM | GND |
| Lid NO | GPIO25 |
| Mount COM | GND |
| Mount NO | GPIO26 |
| Both NC | Leave disconnected |

No external resistor: firmware uses internal pull-ups. **PASS:** all four physical actions give the following stable values after debounce:

| Action | lid | mount |
|---|---:|---:|
| Both released | 1 | 1 |
| Lid pressed | 0 | 1 |
| Mount pressed | 1 | 0 |
| Both pressed | 0 | 0 |

## 03 — GPIO27 LED control

Open [03_mosfet_logic_led_first.ino](../firmware/arduino-ide/03_mosfet_logic_led_first/03_mosfet_logic_led_first.ino). HW-548 control and 12 V remain disconnected. No private enable change needed.

With power off, move the LED circuit's input from GPIO19 to **GPIO27**, retaining `GPIO27 → resistor leg 1; resistor leg 2 → LED+; LED− → GND`.

Upload. **PASS:** LED starts OFF; `ON` lights it and it goes OFF after five seconds; `OFF` stops it immediately. Meter GPIO27-to-GND: OFF about 0 V, ON about 3.0–3.3 V. After testing, power off and restore the status LED to GPIO19. Keep active-HIGH.

## 04 — fused siren

Open [04_12v_alarm_fused.ino](../firmware/arduino-ide/04_12v_alarm_fused/04_12v_alarm_fused.ino).

**Use this table only when it matches your previously verified HW-548 terminal arrangement.** An unknown board/terminal order is HOLD. First check OFF/reset/disconnected-control behaviour with the reviewed meter/test load and the siren removed. Unexpected ON means stop and resolve the control interface; a software OFF command does not establish safe reset behaviour.

| From | To |
|---|---|
| Adapter +12 V | Existing 2 A inline fuse input |
| Fuse output | Verified HW-548 DC+ |
| Adapter negative | Verified HW-548 DC− |
| Verified HW-548 OUT+ | Siren + |
| Verified HW-548 OUT− | Siren − |
| GPIO27 | Verified HW-548 Signal+ |
| ESP GND | Verified HW-548 Signal− reference |
| Buck OUT+ | Leave disconnected from USB-powered ESP |

Do not invent a Signal−/DC− bridge or new protection arrangement. Keep all load wires off the breadboard.

After electrical checks, set this sketch's `ENABLE_ALARM true`, `ALARM_POLARITY_VERIFIED true`, retain `ALARM_ACTIVE_HIGH true` and `ALARM_DURATION_MS 5000`. Upload with siren power off. Then energize the reviewed fused branch.

**PASS:** actual siren responds to `ON`/`OFF`, cuts off after five seconds, stays OFF at boot/reset/control disconnection/USB loss, and measured current is recorded. Your earlier manual operation is team-reported; complete the remaining safe-OFF checks. Afterward send `OFF` and turn off 12 V.

## 05 / 05a — ADS1115

Your ADS single-ended accuracy is **UNRESOLVED**. Use the independent [05a_ads_register_crosscheck.ino](../firmware/arduino-ide/05a_ads_register_crosscheck/05a_ads_register_crosscheck.ino) first. No private enable change is required for this independent test.

Use ESP + ADS only, USB power only, actual soldered header contacts and good jumpers.

| ADS terminal | Connect to |
|---|---|
| VDD / VCC | ESP 3V3 |
| GND | ESP GND / verified ground node |
| SDA | GPIO21 |
| SCL | GPIO22 |
| ADDR | GND |
| A0, A1, A2, A3 | Each to GND first |
| ALRT | Leave disconnected |

For explicit breadboard ground nodes, use two separate five-hole connected strips:

| Strip | Connections |
|---|---|
| G1 | Hole1 ADS GND; hole2 ESP GND; hole3 bridge to G2 hole1; hole4 ADDR; hole5 A0 |
| G2 | Hole1 bridge from G1 hole3; hole2 A1; hole3 A2; hole4 A3 |

1. Upload05a. Startup should identify `REGISTER CHECK v2`. Save A0–A3 and both differential readings. All intended-ground readings should be near zero.
2. Power off. Remove **only A0's ground jumper**, then connect A0 to ESP3V3. Do not leave a ground wire on A0.
3. Power on. Measure A0 **relative to ADS GND** with the meter and compare the reported single-ended A0 value. A1–A3 stay grounded.
4. Power off and return A0 to GND.
5. If both references agree, repeat with [05_ads1115.ino](../firmware/arduino-ide/05_ads1115/05_ads1115.ino); ADS is enabled automatically in Test05. Require `read_valid=1`, increasing samples, and the same reference agreement.

**PASS requires both ground and measured supply agreement**, using an agreed instrument/module tolerance. If the previous −0.10…−0.19 V ground offset persists, record **BLOCKED**, disconnect ADS and continue independent tests. Near-zero differential readings do not cure single-ended offset. No guessed subtraction/calibration constant. Escalate with full05a scan, actual ADS-pin meter measurements and board/contact evidence or a known-good comparison.

## 06 — ACS758: HOLD before GPIO34

No complete safe wiring has been established for your exact HW-525 board. Required: actual board supply/current-terminal identification and a reviewed output-conditioning circuit proven ESP-safe over the intended current range. A zero-current voltage alone is insufficient.

| Connection | Action |
|---|---|
| ACS VCC / ground / IP+ / IP− | Use actual board documentation; do not infer terminal order or supply. |
| ACS VOUT | Measure relative to its verified reference first, with no ESP input connected. |
| Raw ACS VOUT → GPIO34 | **Do not connect.** |
| Reviewed conditioned output | GPIO34, only after full intended range is verified safe. |

After that gate: open [06_acs758.ino](../firmware/arduino-ide/06_acs758/06_acs758.ino), set `ENABLE_ACS true` and reviewed measured coefficients. With independently verified zero current send `ZERO`; it prints a **proposed** coefficient. Validate a known low-current load against an instrument before setting `ACS_CALIBRATED true`. Do not put an ammeter directly across a supply. Until then record HOLD and skip to07.

## 07 — GPS

**HOLD until the actual breakout's VCC rating and TX level are confirmed.** The NEO-6M chip name alone does not prove the carrier's supply rating.

| GPS terminal | Connect to after verification |
|---|---|
| VCC | Actual breakout's approved supply |
| GND | Approved common ESP reference |
| TX | GPIO32 if verified 3.3 V-compatible; otherwise reviewed translator first |
| RX | Leave disconnected |
| Antenna | Matching GPS antenna connector |

Open [07_gps_neo6m.ino](../firmware/arduino-ide/07_gps_neo6m/07_gps_neo6m.ino). Set this folder's `ENABLE_GPS true`. Upload. ESP monitor is115200; GPS receive is9600 automatically. Take it into open sky, keeping wiring secure. **PASS:** `fix=1`, plausible actual coordinates and satellite count, recent fix age; save actual outdoor observations. `fix=0` or blinking GPS LED is not a positioning pass. Test07 prints received raw NMEA as well as fix/status summaries; raw sentences alone do not establish a valid fix.

## 08a — LTE USB first

**HOLD until the actual green carrier's USB power/data requirements are confirmed.** Leave its white connector and ESP GPIO13/14 disconnected. Attach the correct antenna and insert the SIM with power off; then use only the documented carrier USB/supply arrangement.

No ESP sketch upload. In a Linux terminal:

```bash
cd ~/SolAir/next-platform/solair-platform
.tools/cpe-python/bin/python -m serial.tools.list_ports -v
# Replace /dev/OBSERVED_AT_PORT with the modem's actual AT port.
.tools/cpe-python/bin/python firmware/solair-cpe/tests/08a_a7670e_usb_at/usb_at.py --port /dev/OBSERVED_AT_PORT --confirmed-carrier-usb
```

Close other monitors using that port. The script uses115200 and sends CRLF itself. It reads AT/model/SIM/signal/registration/attachment/operator status without changing PIN/APN settings.

| Response | Meaning |
|---|---|
| `AT` → `OK` | AT interface responds. |
| `+CPIN: READY` | SIM ready. Never guess PIN codes. |
| `+CSQ` | Record actual value;99 is unknown. |
| `+CEREG` status1 or5 | Registered home/roaming. |
| `+CGATT: 1` | Packet attached. |

Record separate AT/SIM/registration results. These do not establish a successful cellular upload to SOLAIR.

## 08b — LTE ESP UART: HOLD

Only after exact connector pins, supply and UART translator are verified:

| Verified signal | Eventual connection |
|---|---|
| Carrier TX, translated appropriately | ESP GPIO13 |
| ESP GPIO14 | Appropriately translated carrier RX |
| Carrier power / reference | Actual approved dedicated supply/reference; not ESP3V3 |

Open [08b_a7670e_esp_uart.ino](../firmware/arduino-ide/08b_a7670e_esp_uart/08b_a7670e_esp_uart.ino), then `ENABLE_LTE true` only after the gate. Require actual AT/registration/attachment evidence. Native modem UART is not assumed 3.3 V-compatible. Keep cellular packet fallback uncommissioned until routing and real POST acceptance are separately proven.

## 09a — PZEM USB-RS485 first

**HOLD until the delivered PZEM terminal/shunt diagram, matched50 A shunt, external communication5 V and isolation arrangement are confirmed.** Do not guess numbered sense terminals. Use isolated, fused, low-power bench supply and a properly rated resistor load; no traction battery/panels/MPPT. Load/shunt conductors remain off the breadboard.

| From | To after diagram verification |
|---|---|
| USB-RS485 A | PZEM RS485 A |
| USB-RS485 B | PZEM RS485 B |
| External regulated communication5 V / return | Documented PZEM communication supply terminals |
| Voltage / shunt sense / load current path | Exact delivered manufacturer diagram; no substituted terminal map |

ESP/MAX3485 stay disconnected. From the app directory, with actual USB-RS485 port:

```bash
.tools/cpe-python/bin/python firmware/solair-cpe/tests/09a_pzem_usb_modbus/pzem_usb.py --port /dev/OBSERVED_RS485_PORT --confirmed-isolated-bench
```

Defaults are address1,9600,8N2. Ctrl+C stops polling. **PASS:** configured50 A range confirmed and actual V/A/W/Wh agree with instruments. Wrong range/CRC/timeout is a fault. Normal polling does not write range or reset energy. If range differs, use only the separately gated procedure in the [09a guide](../firmware/solair-cpe/tests/09a_pzem_usb_modbus/README.md) after confirming the exact register map/shunt; do not write settings merely to remove an error.

## 09b — PZEM through MAX3485

Prerequisite:09a passes. Power off and remove USB-RS485; only one bus master. Use a verified **3.3 V MAX3485** module.

| MAX3485 terminal | Connect to |
|---|---|
| VCC | ESP3V3 |
| GND | Approved ESP signal reference |
| RO | GPIO16 |
| DI | GPIO17 |
| DE | GPIO23 |
| /RE | Same GPIO23 node |
| A | Verified PZEM A |
| B | Verified PZEM B |

Retain09a's approved PZEM supply/sense/shunt/load circuit. MAX3485 VCC is not the meter's communication5 V. Do not automatically defeat isolation by bonding all returns.

Open [09b_pzem_esp32_max3485.ino](../firmware/arduino-ide/09b_pzem_esp32_max3485/09b_pzem_esp32_max3485.ino), set `ENABLE_PZEM true`, upload. **PASS:** `shunt50_verified=1`, `valid=1`, V/A/W/Wh matching09a/instruments. Do not invent termination/bias resistors; use the reviewed bus arrangement.

## 10 — combined readings into the local app

Power off. Combine **only passed modules** using the fixed pin map in section1 and their approved individual power circuits. Leave failed/HOLD modules disconnected and disabled. Restore GPIO19 status LED. This can establish a partial prototype; it does not make missing modules pass.

Open [10_wifi_authenticated_ingest.ino](../firmware/arduino-ide/10_wifi_authenticated_ingest/10_wifi_authenticated_ingest.ino). Despite its folder name, this uses the production engine and also emits **USB telemetry**. Use USB first today; Wi-Fi is a separate follow-up below.

Copy that folder's configuration example if needed, then change only verified values:

| Setting | Value / rule |
|---|---|
| `DEVICE_ID` | Exact device shown in CPE Lab. |
| `ENABLE_SWITCHES` | `true` after02 passes. |
| `ENABLE_MPU` | `true` after01 passes. |
| `ALLOW_MPU6500_COMPAT` | Also `true` if your physically checked IMU reports0x70. |
| `ENABLE_ADS` | `true` only after05/05a reference agreement. |
| `ENABLE_GPS`, `ENABLE_ACS`, `ENABLE_PZEM`, `ENABLE_LTE` | `true` only for individually passed, actually connected modules. |
| `ENABLE_ALARM`, `ALARM_POLARITY_VERIFIED` | `true` only after04's complete electrical/safe-OFF checks. |
| `ALARM_ACTIVE_HIGH` | Keep `true`. |
| `ENABLE_MOTION`, `MOTION_CALIBRATED` | Keep `false` until actual motion coefficients are validated; switches still support tamper testing. |
| ACS coefficients / `ACS_CALIBRATED` | Measured/validated06 settings only. |
| `LOAD_MODE` | `"bench_resistor"` with actual resistor load, otherwise `"none"`. |
| `PZEM_SOURCE` | `"bench_supply"` only for actual adapter-powered metering; never claim MPPT output on this bench. |
| Wi-Fi/token settings for USB-only first run | Leave blank/unprovisioned; USB ingest uses the signed-in engineer session. Do not erase existing credentials. |
| `LTE_HTTP_BENCH_COMMISSIONED` | Keep `false` until separately commissioned. |

1. Start SOLAIR once: run `solair-start` and keep its terminal open. If already running on3000, use it.
2. Open **http://localhost:3000** in Chrome with Web Serial support. Sign in as engineer (`engineer@solair.local`, local development password `SolairDemo!2026`), select **Real hardware bench → CPE Lab** and the actual device.
3. Upload10. Briefly use Serial Monitor115200 to confirm real JSON frames with increasing sequence/uptime. Then **close Serial Monitor**.
4. Click **Connect ESP32** in CPE Lab and select the board. One application owns the serial connection. Chromebook USB ownership may require releasing the Linux connection before the Chrome browser can open it; if it cannot appear, stop and troubleshoot USB sharing rather than changing firmware pins.
5. Move the IMU and press/release switches. Confirm real live values, matching device identity and fresh server receipt. Check commissioned channels against instruments. Disconnected modules remain unavailable/fault.
6. Export actual CPE CSV. No JSON from00–09 is expected: those are mostly text diagnostics. Use10/11/final for dashboard ingestion.

**USB end-to-end PASS:** actual device measurements are accepted/persisted, visible in CPE Lab and consistent in exported records. Neither a serial frame alone nor simulated dashboard data establishes this result.

**Wi-Fi follow-up:** use [local laptop networking instructions](LOCAL_LAPTOP_SETUP.md). Chromebook Linux needs actual container listener address and TCP3002 forwarding; firmware needs the laptop address reachable from ESP, valid device token, SSID/password and private-bench HTTP opt-in. Do not use localhost from ESP or guess the IP. Test genuine accepted Wi-Fi telemetry before calling Wi-Fi commissioned. USB acceptance does not establish Wi-Fi/offline-retry behaviour.

## 11 — combined soak and final firmware

Open [11_combined_all_sensors_soak.ino](../firmware/arduino-ide/11_combined_all_sensors_soak/11_combined_all_sensors_soak.ino). Wiring stays unchanged. Review this folder's own private settings against your validated10 settings; do not assume they copied themselves.

| Action | Required observation |
|---|---|
| Run all commissioned modules together | Record actual duration; readings keep arriving without resets/lockups or rising GPS overflow/checksum faults. |
| `DISARM` | Output OFF. |
| Hold both switches pressed; wait10 seconds after boot; send `ARM` | `ARMED locally`. If rejected, send `DISARM`, secure both switches and retry after the boot delay. |
| Release lid, then separately mount | Correct event/reason. Commissioned siren cuts off after configured5 seconds. `DISARM` and re-arm between separate trigger tests. |
| `LED` while no alarm active | Brief GPIO19 LED response. |
| Interrupt commissioned Wi-Fi | Local switch tamper continues; network loss alone does not sound siren. This row needs actual Wi-Fi commissioning. |
| Restore network/restart backend | Check actual retained/deduplicated events and honest stale/live status. |
| Controlled reset with approved output test arrangement | Safe physical OFF; record observation. |
| Sensor disconnect test | Power off before unplugging/reconnecting sensor wires; after restart, missing readings show unavailable/fault. |

Use the [full acceptance checklist](COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md) for a final claim. A shorter run is an initial soak observation; do not describe it as extended reliability testing. No universal run duration is inferred here.

After successful acceptance, open [solair_cpe.ino](../firmware/arduino-ide/solair_cpe/solair_cpe.ino), review **its own** private config against the proven11 config, and upload. Same pin map, same backend, same device identity. Finish with `DISARM`, disconnect the monitor, and remove power before changing wires.

## 4. Record results and prepare for schematic/soldering

Save actual serial logs, meter readings and photos privately under `~/SolAir/next-platform/solair-platform/data/bench-evidence/` (create this folder if absent). Use filenames such as `2026-10-15-test02.txt`. Do not publish credentials or private location records. Record: tester/date, exact board, supply, firmware/config, observation, PASS/FAIL/BLOCKED and evidence path.

| Stage | Result to fill in | Required evidence |
|---|---|---|
| 00 | ___ | Actual upload, LED and boot log |
| 01 | ___ | Identity, still/tilt/rotation values |
| 02 | ___ | All four switch combinations |
| 03 | ___ | ON/OFF/cutoff + GPIO voltage |
| 04 | ___ | Siren operation, current, safe-OFF checks |
| 05/05a | **UNRESOLVED until retested** | Ground + measured3V3 reference comparisons |
| 06 | ___ | Supply/conditioning + zero and known load |
| 07 | ___ | Supply/TX confirmation + outdoor fix |
| 08a /08b | ___ / ___ | Carrier interface + actual AT/registration |
| 09a /09b | ___ / ___ | Exact shunt circuit/range + meter comparisons |
| 10 USB /Wi-Fi | ___ / ___ | Accepted real telemetry + saved CSV |
| 11 /final | ___ / ___ | Combined run duration, resets/events/recovery |

You can draft the schematic using section1 now. **Release a final soldering revision only after the relevant interfaces are verified.** Include exact connector terminal labels/orientation, voltage domains, approved grounding/isolation, protection, siren safe-OFF arrangement, actual ACS conditioning values, resistor values and the tested pin map. Include the physical board/perfboard layout and wire/connector ratings; a GPIO list alone is not a complete soldering plan. Any unresolved module stays explicitly disconnected/disabled in a partial prototype and is not claimed complete.

If something fails, stop that stage, remove power before touching wires, and bring the exact stage number, sketch, complete error/serial lines and the relevant actual wiring/measurements. Successful independent stages can continue without another confirmation.

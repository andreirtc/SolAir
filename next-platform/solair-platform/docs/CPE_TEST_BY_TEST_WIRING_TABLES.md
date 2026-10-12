# SOLAIR — wiring tables for each test, then the complete system

12 October 2026. **Start at Test 00 and move down in order.** Use Arduino IDE with **ESP32 Dev Module**, the port that belongs to your connected ESP32, Serial Monitor **115200 baud / Newline**. [IDE setup and library installation](../firmware/arduino-ide/README.md). Sketch links below open the clean IDE versions.

This is the 12 V adapter home bench. Battery, solar panels, MPPT and wind turbine remain disconnected. Physical PASS requires your measurements; compilation is not a physical PASS. Preserve/photos of the current working wiring first. Use GPIO labels, not header positions counted from USB. Resolve any difference from your actual wiring before changing it.

## Before every test

| Action | What to do |
|---|---|
| Before moving a wire | Unplug ESP USB and turn off/unplug all external supplies. |
| ESP power | USB from PC only for these tests. Buck OUT+ stays disconnected from ESP 5V/VIN while USB supplies power. |
| Grounds | ESP GND → labeled signal GND rail for approved low-voltage sensors. Do not automatically bond isolated meter/modem/power grounds. |
| Sensor rail | ESP 3V3 → labeled 3.3 V rail. Check actual voltage before attaching a sensor. Never put 12 V on this rail. |
| Breadboard rows | Holes in a connected strip are one electrical node. Put a resistor's two legs in **different connected strips**, and the LED's two legs in **different strips**. Do not bypass the resistor with a jumper. Check your board's rail breaks with power OFF. |
| What stays connected | Core USB/GND/3V3 rails as needed. During an individual diagnostic, connect only that test's modules; keep unrelated powered branches off and unrelated `ENABLE_*` flags false. Photograph/label existing proven wiring before isolating it. Reassemble passed modules for Test 10/11. |
| Upload | Close Serial Monitor → open the linked `.ino` → Verify ✓ → Upload → → reopen Serial Monitor. Flashing replaces the old ESP program; preserve its source/config first. |
| Private config | When a test requires flags, copy `config.example.h` to `solair_config.h` **inside that IDE sketch folder**, if absent. Keep an existing private config; edit only needed fields. Each sketch folder has its own config. Never share credentials. |
| Power conductors | Siren, resistor-load and shunt current stay off the breadboard. Use the existing reviewed protected power branch. |

## Test 00 — ESP32 boot and status LED

Open [00_esp32_boot_and_status_led.ino](../firmware/arduino-ide/00_esp32_boot_and_status_led/00_esp32_boot_and_status_led.ino). No sensors or 12 V branch needed.

| Wire | From | To | Part / placement |
|---|---|---|---|
| 1 | PC USB | ESP32 USB connector | USB data cable; this powers the ESP. |
| 2 | ESP32 GPIO19 | **330 Ω resistor leg 1** | Resistor has no polarity; either leg can be leg 1. |
| 3 | **330 Ω resistor leg 2** | **LED + / anode** | Usually long leg. Resistor legs must not share a connected strip. |
| 4 | **LED − / cathode** | ESP32 GND | Usually short leg / flat side; verify if leads were cut. LED legs must not share a connected strip. |
| — | GPIO27 / HW-548 | **Disconnected** | Siren power off. |

**Complete LED circuit:** `GPIO19 → 330 Ω resistor → LED + ; LED − → GND`. One resistor in series, not across the LED. Expected: blinking LED and increasing `BOOT uptime_ms` messages. Record result; remove power before the next wiring change.

## Test 01 — IMU (MPU6050 or reported 0x70 compatible profile)

Open [01_i2c_mpu6050.ino](../firmware/arduino-ide/01_i2c_mpu6050/01_i2c_mpu6050.ino). It enables MPU for this test automatically. Use your verified 3.3 V-compatible GY-521.

| Wire | From | To | Note |
|---|---|---|---|
| 1 | ESP32 3V3 | MPU VCC | No 5 V pull-ups on the I2C bus. |
| 2 | ESP32 GND | MPU GND | Signal reference. |
| 3 | ESP32 GPIO21 | MPU SDA | Data. |
| 4 | ESP32 GPIO22 | MPU SCL | Clock. |
| 5 | MPU AD0 | GND | Selects address `0x68`. |
| — | MPU INT, XDA, XCL | Leave disconnected | Not needed for this driver. |

Expected: scanner `0x68`, real accel/gyro/raw values changing when moved. If `0x69`, inspect AD0 before changing the firmware address. No extra resistor is specified for this verified breakout test; inspect its existing I2C pull-ups rather than adding arbitrary resistors.

**For your reported WHO_AM_I=0x70:** reopen the updated Test01 `.ino` from disk in Arduino IDE, Verify, Upload, then open Serial Monitor at 115200. Keep the same wiring and I2C address `0x68`. Test01 automatically enables the separate MPU6500-compatible driver; no library editing or extra library installation is needed. `0x70` is an identity value, not the I2C address. This profile follows [TDK's register map](https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6500-Register-Map2.pdf); the unmarked chip's authenticity is unverified.

| Action | Required observation |
|---|---|
| Wait two seconds after startup | `WHO_AM_I=0x70 profile=mpu6500_compatible compat_enabled=1 initialized=1 read_valid=1 status=ok`; `MPU detected=1`. |
| Leave board flat and still | Real nonzero raw readings; acceleration magnitude roughly 9.8 m/s² (usually one axis near +9.8 or −9.8), gyro near zero. This is a sanity check, not calibration. |
| Slowly tilt to a different face | Gravity shifts between acceleration axes. |
| Gently rotate then stop | Gyro changes during rotation, then returns near zero. Do not pull on the jumpers. |
| Read remains invalid | Do not treat zero/stale vectors as measurements. Save the complete `MPU_PROBE` and following `MPU` lines, including `status`. |

Only mark Test01 PASS after those physical observations. Then upload Test02 below. If Test01 remains blocked, Test02 is independent and can still be tested with the IMU result recorded as blocked. For Test11/final firmware, after Test01 passes, set both `ENABLE_MPU true` and `ALLOW_MPU6500_COMPAT true` in **that sketch folder's** private `solair_config.h`. Add the second define if using an older config. Combined firmware keeps compatibility disabled by default until this explicit commissioning step. Motion detection also needs its separate calibration; valid IMU readings do not establish a calibrated alarm threshold.

## Test 02 — both microswitches

Open [02_tamper_switches.ino](../firmware/arduino-ide/02_tamper_switches/02_tamper_switches.ino). Identify COM/NO/NC from labels and unpowered continuity, not terminal position.

| Wire | From | To | Part / behavior |
|---|---|---|---|
| 1 | Lid switch COM | ESP32 GND | Common contact. |
| 2 | Lid switch NO | ESP32 GPIO25 | Firmware uses internal pull-up; no external resistor needed. |
| 3 | Mount switch COM | ESP32 GND | Common contact. |
| 4 | Mount switch NO | ESP32 GPIO26 | Internal pull-up; no external resistor needed. |
| — | Both NC terminals | Leave disconnected | Do not connect all three terminals. |

| Physical action | Expected lid value | Expected mount value |
|---|---|---|
| Neither lever pressed | HIGH / 1 | HIGH / 1 |
| Lid pressed only | LOW / 0 | HIGH / 1 |
| Mount pressed only | HIGH / 1 | LOW / 0 |
| Both pressed | LOW / 0 | LOW / 0 |

Expected debounce: 50 ms. LOW is the provisional secure convention; actual enclosure mounting must make it meaningful.

## Test 03 — GPIO27 control using an LED, without the siren

Open [03_mosfet_logic_led_first.ino](../firmware/arduino-ide/03_mosfet_logic_led_first/03_mosfet_logic_led_first.ino). HW-548 control disconnected and siren power OFF. Use a second LED or move the Test 00 LED assembly with power off.

| Wire | From | To | Part / placement |
|---|---|---|---|
| 1 | ESP32 GPIO27 | **330 Ω resistor leg 1** | Either resistor orientation. |
| 2 | **330 Ω resistor leg 2** | **Test LED + / anode** | Separate connected strips for resistor legs. |
| 3 | Test LED − / cathode | ESP32 GND | Separate strips for LED legs. |
| — | GPIO27 | No HW-548 connection in this test | Test only logic first. |

Expected: LED OFF at startup; send `ON` → LED ON then OFF after 5 seconds; send `OFF` → immediately OFF. Meter from GPIO27 to ESP GND: OFF about 0 V, ON about 3.0–3.3 V. **Keep active-HIGH.** Restore the status LED assembly to GPIO19 afterward; a second LED needs its own 330 Ω resistor.

## Test 04 — existing fused 12 V siren and buck branch

Open [04_12v_alarm_fused.ino](../firmware/arduino-ide/04_12v_alarm_fused/04_12v_alarm_fused.ino). Your active-HIGH siren operation is team-reported. **Reset/power-up safe-OFF is not yet recorded.** This table is conditional on matching your actual working board terminal map; do not rebuild an unknown HW-548 from labels alone.

| Wire | From | To | Required part / condition |
|---|---|---|---|
| 1 | Adapter +12 V | Existing inline **2 A fuse input** | Fuse near source, existing reviewed holder/cable. Off breadboard. |
| 2 | Fuse output | HW-548 DC+ | Only if this matches the actual tested power input. |
| 3 | Adapter negative | HW-548 DC− | Preserve actual reviewed return. |
| 4 | HW-548 OUT+ | Siren + | Only after confirming actual output terminal map; off breadboard. |
| 5 | HW-548 OUT− | Siren − | Same requirement. |
| 6 | ESP32 GPIO27 | HW-548 Signal+ | Only for your verified signal interface; remove the GPIO27 test LED assembly. |
| 7 | ESP32 GND | HW-548 Signal− | Only for verified reference arrangement; no assumed bridge to DC−. |
| 8 | Adapter +12 V | Separately protected buck IN+ | Existing reviewed buck branch, not through ESP/breadboard. |
| 9 | Adapter negative | Buck IN− | Preserve actual reviewed return. |
| — | Buck OUT+ | **Do not connect to USB-powered ESP** | Measure OUT+ to OUT− at 5 V with loads disconnected. |
| — | ESP32 status LED | Same GPIO19 → 330 Ω → LED +; LED − → GND | Optional independent status indicator. |

Before siren attachment, use the reviewed meter/test load to check output OFF on boot/reset, disconnected GPIO and USB loss; loss of Wi-Fi alone must not turn it on. Resolve unsafe floating control before proceeding. After these gates, set `ENABLE_ALARM true`, `ALARM_POLARITY_VERIFIED true`, retain `ALARM_ACTIVE_HIGH true`. Send `ON`/`OFF` in this diagnostic; verify actual 5-second cutoff and measured current. **Do not change fuse, grounding, interface resistors or suppression parts by guesswork.**

## Test 05 — ADS1115, then A0 at 0 V and 3.3 V

Open [05_ads1115.ino](../firmware/arduino-ide/05_ads1115/05_ads1115.ino). It enables ADS automatically. Siren branch off. Use a verified 3.3 V-compatible board/pull-ups.

| Wire | From | To | Note |
|---|---|---|---|
| 1 | ESP32 3V3 | ADS VDD / VCC | 3.3 V supply, not 5 V. |
| 2 | ESP32 GND | ADS GND | Signal reference. |
| 3 | ESP32 GPIO21 | ADS SDA | Shares SDA with MPU in combined wiring. |
| 4 | ESP32 GPIO22 | ADS SCL | Shares SCL with MPU in combined wiring. |
| 5 | ADS ADDR | GND | Address `0x48`. |
| 6 | ADS A0 | GND **first** | Expect near 0 V. |
| 7 | ADS A1 | GND | Stable unused test input. |
| 8 | ADS A2 | GND | Stable unused test input. |
| 9 | ADS A3 | GND | Stable unused test input. |
| — | ADS ALRT | Leave disconnected | Not required. |
| Change only after power off | ADS A0 | Move from GND to measured ESP 3V3 | Expect near 3.3 V. Remove the GND jumper first; never bridge 3V3 to GND. |

Expected: `0x48`, A0 follows each reference and agrees with meter. Return A0 to GND afterward. No series resistor/divider is required for these 0/3.3 V references; **this does not permit 12 V inputs** or establish a higher-voltage sensing circuit.

**12 October fix:** if ADS was detected but every printed voltage stayed at0 despite a measured A0 voltage, reopen and upload the updated Test05 from disk. The earlier code incorrectly polled conversion completion in continuous mode. The shared acquisition now uses nonblocking single-shot channel scans. Expect `detected=1 read_valid=1`, an increasing `samples` counter, and A0's printed voltage close to the actual meter voltage. At3.0V, raw is about24000; at3.3V, about26400 (GAIN_ONE). Do not interpret old/zero values when `read_valid=0`. ADC health becomes valid only after all four channels have completed a read; disconnect/timeout invalidates the scan. This is a software fix, not a physical pass. No wiring or library change is needed to retest.

## Test 06 — ACS758 (electrical gate before direct connection)

Open [06_acs758.ino](../firmware/arduino-ide/06_acs758/06_acs758.ino). The exact HW-525 supply/current path and conditioning need verification. The missing divider/buffer values cannot honestly be filled in yet.

| Wire / check | From | To | Stop condition / required part |
|---|---|---|---|
| Supply | Verified board supply | ACS VCC | Confirm exact board rating first; do not assume ESP 3V3 or 5 V. |
| Reference | ACS/conditioning reference | Approved signal GND | Verify allowed common-ground arrangement. |
| Initial measurement | Multimeter voltage probes | ACS VOUT to its reference | No GPIO34 connection yet; record zero-current VOUT. |
| Conditioning | ACS VOUT | Reviewed divider/buffer/protection input | **Required design/value verification pending. No guessed resistor values.** |
| ADC signal | Verified conditioned output, always 0…3.3 V | ESP32 GPIO34 | ADC1, input only. Check full intended range, not just zero current. |
| Load current | Verified source/load conductors | Board's documented IP+/IP− current path | Low-current fused test only; off breadboard; exact terminal map pending. |

After voltage/conditioning checks, set `ENABLE_ACS true` and measured frontend scale/offset/sensitivity. With independently verified zero current send `ZERO`; it prints a proposed offset, not automatic calibration approval. Verify a known low-current load against an instrument before `ACS_CALIBRATED true`. Until then, usable amperes stay unavailable. Never place an ammeter directly across the supply.

## Test 07 — GPS NEO-6M

Open [07_gps_neo6m.ino](../firmware/arduino-ide/07_gps_neo6m/07_gps_neo6m.ino). Verify actual breakout VCC requirement and TX level first; then `ENABLE_GPS true`.

| Wire | From | To | Required part / condition |
|---|---|---|---|
| 1 | Verified GPS supply | GPS VCC | Exact breakout rating decides voltage; not guessed from name. |
| 2 | GPS GND | Approved signal GND | Shared reference after verification. |
| 3 | GPS TX | ESP32 GPIO32 | Direct only if verified 3.3 V-compatible; otherwise reviewed level translator first. |
| 4 | GPS antenna | GPS antenna connector | Use actual matching connector. |
| — | GPS RX | Leave disconnected | RX-only GPS acquisition on ESP. |

Expected: NMEA at GPS 9600 baud, then a genuine outdoor fix with satellites/coordinates. USB monitor remains 115200. No resistor is automatically prescribed; any required level translation must follow measured electrical levels. GPIO16 is reserved for PZEM, not GPS.

## Test 08a — A7670E through its USB connector

No Arduino sketch for this laptop test. Carrier USB supply/operation must be confirmed first. Native modem UART may be 1.8 V.

| Connection | From | To | Condition |
|---|---|---|---|
| Antenna | Correct LTE antenna | Carrier antenna connector | Attach with power off. |
| SIM | Your SIM | Carrier SIM slot | Follow carrier orientation; insert with power off. |
| USB | Verified carrier USB data/power arrangement | PC USB / approved supply arrangement | Confirm carrier requirements and avoid unreviewed parallel supplies. |
| White connector | Nothing | Leave disconnected | Pinout, power rating and translator unverified. |
| ESP GPIO13/14 | Nothing | Leave disconnected | USB-first test. |

Identify the modem's actual AT COM port (not automatically ESP COM3). From the app folder run:

```powershell
.\.tools\cpe-python\Scripts\python.exe firmware\solair-cpe\tests\08a_a7670e_usb_at\usb_at.py --port COM_NUMBER --confirmed-carrier-usb
```

Replace `COM_NUMBER` with the modem AT port. The read-only script tests AT/model/SIM/signal/registration/attachment. An AT reply alone does not prove cellular upload. [08a details](../firmware/solair-cpe/tests/08a_a7670e_usb_at/README.md).

## Test 08b — A7670E ESP UART (keep disabled until verified)

Open [08b_a7670e_esp_uart.ino](../firmware/arduino-ide/08b_a7670e_esp_uart/08b_a7670e_esp_uart.ino). `ENABLE_LTE false` until connector/supply/translation checks pass. **Do not connect this table yet with the unknown white pinout.**

| Eventual connection | From | To | Required part / condition |
|---|---|---|---|
| Modem supply | Documented dedicated carrier supply | Confirmed carrier power terminals | Not ESP GPIO/3V3; exact terminal/power rating pending. |
| Receive at ESP | Confirmed carrier TX | Correct translator → ESP GPIO13 | Verify carrier already-translated/native level first. |
| Transmit from ESP | ESP GPIO14 | Correct translator → confirmed carrier RX | Translator must suit actual modem voltage; not a guessed resistor network. |
| Reference | Verified carrier/translator reference | Approved signal ground | Follow exact carrier/interface diagram. |

After verification, enable LTE and test real AT/registration. Real cellular POST is a separate acceptance step; production modem HTTPS remains uncommissioned.

## Test 09a — PZEM laptop USB-RS485 and matched 50 A shunt

No Arduino sketch for this laptop test. First confirm delivered PCB labels, manufacturer shunt/sense diagram, matched 50 A shunt, supply and USB isolation. **Load/sense terminal numbers are intentionally not guessed.**

| Connection | From | To | Required part / condition |
|---|---|---|---|
| RS485 A | USB-RS485 A | Confirmed PZEM RS485 A | Match actual labels. |
| RS485 B | USB-RS485 B | Confirmed PZEM RS485 B | Signal pair; not power terminals. |
| Communication +5 V | External regulated 5 V | Documented PZEM communication +5 V | Verify actual terminal and supply rating. |
| Communication return | Supply return | Documented PZEM communication return | Isolation/reference must be reviewed before laptop attachment. |
| Voltage sense +/− | Isolated low-power bench circuit | PZEM's documented voltage-sense terminals | Exact delivered diagram required. No panels/battery/MPPT. |
| Shunt sense | Matched shunt Kelvin/sense points | PZEM's documented shunt-sense terminals | Sense points are not the load-current bolts. |
| Load current | Fused low-power source, rated resistor load and shunt | Series path from exact manufacturer diagram | Off breadboard. Load resistance/wattage/fuse must be chosen for actual test current and heat; **not the LED's 330 Ω resistor**. |
| ESP/MAX3485 | Nothing | Disconnected for laptop test | One bus master. |

After this gate, use actual USB-RS485 port:

```powershell
.\.tools\cpe-python\Scripts\python.exe firmware\solair-cpe\tests\09a_pzem_usb_modbus\pzem_usb.py --port COM_NUMBER --confirmed-isolated-bench
```

Defaults 9600 8N2/address1. Expected stored range 50 A plus V/A/W/Wh agreeing with instruments. Wrong range is a fault. The [09a README](../firmware/solair-cpe/tests/09a_pzem_usb_modbus/README.md) contains the separate explicitly gated 50 A setup command; normal polling does not write settings or reset energy.

## Test 09b — PZEM through MAX3485 to ESP32

Open [09b_pzem_esp32_max3485.ino](../firmware/arduino-ide/09b_pzem_esp32_max3485/09b_pzem_esp32_max3485.ino). Prerequisite: 09a passes. Power off and disconnect USB-RS485 before wiring. Use verified **3.3 V MAX3485**, not an assumed 5 V MAX485 substitute.

| Wire | From | To | Part / condition |
|---|---|---|---|
| 1 | ESP32 3V3 | MAX3485 VCC | Verified 3.3 V module. |
| 2 | ESP32 GND | MAX3485 GND | Approved signal reference. |
| 3 | MAX3485 RO | ESP32 GPIO16 | ESP UART1 RX. |
| 4 | ESP32 GPIO17 | MAX3485 DI | ESP UART1 TX. |
| 5 | ESP32 GPIO23 | MAX3485 DE | Direction control. |
| 6 | Same GPIO23 node | MAX3485 /RE | DE and active-low RE together; LOW receive, HIGH transmit. |
| 7 | MAX3485 A | Confirmed PZEM A | Verify actual module labels. |
| 8 | MAX3485 B | Confirmed PZEM B | Twisted A/B pair. |
| — | PZEM power/sense/shunt/load | Retain verified 09a circuit | External communication 5 V; do not feed MAX VCC with 5 V. Ground/reference according to isolation review. |
| — | Termination/bias resistors | Only as required by the reviewed bus/modules | Do not add arbitrary duplicate termination. |

Set `ENABLE_PZEM true`. Expected `shunt50_verified=1`, `valid=1` and matching V/A/W/Wh. CRC/timeout/mismatch is a fault, not a zero measurement.

## Test 10 — reassemble passed modules and connect to SOLAIR

Open [10_wifi_authenticated_ingest.ino](../firmware/arduino-ide/10_wifi_authenticated_ingest/10_wifi_authenticated_ingest.ino). Power off before combining. Use this consolidated table; **only enable rows whose individual electrical tests passed**.

| Module | Power / ground | Signal / series parts |
|---|---|---|
| ESP32 | PC USB; GND signal rail; 3V3 sensor rail | Buck OUT+ disconnected from ESP while USB powers it. |
| Status LED | Cathode → GND | GPIO19 → **330 Ω resistor → anode**. |
| MPU6050 | Verified VCC → 3V3; GND → GND; AD0 → GND | SDA →21; SCL →22. |
| Lid switch | COM → GND; NC unused | NO →25; internal pull-up, no extra resistor. |
| Mount switch | COM → GND; NC unused | NO →26; internal pull-up, no extra resistor. |
| ADS1115 | VDD →3V3; GND/ADDR →GND | SDA →21; SCL →22; A0–A3 →GND until an actual approved input is assigned; ALRT unused. |
| HW-548/siren | Verified protected 12 V circuit from04 | GPIO27 → verified Signal+; Signal− → approved reference; preserve active-HIGH and reset-safe gate. |
| ACS758 | Verified supply/reference/current path from06 | Verified conditioning output →34; no raw unsafe VOUT jumper. |
| GPS | Verified supply/GND; RX unused | Compatible TX →32; correct translator if needed. |
| PZEM/MAX3485 | Verified meter power/shunt from09; MAX VCC3V3/GND | RO →16; DI ←17; DE+/RE →23; A/B →PZEM. |
| A7670E | Verified dedicated carrier supply/reference | Verified translated TX →13; RX ←14. **Leave disabled/disconnected until08b passes.** |
| Wind / traction / solar input | Disconnected | No invented measurements. |

### 10A — start the web app

Arduino IDE handles firmware. PowerShell starts the website/backend. Open PowerShell and run:

```powershell
cd C:\Users\Admin\Videos\SolAir\next-platform\solair-platform
ipconfig
```

Find the PC Wi-Fi adapter's actual private IPv4. Replace the placeholder below, then run:

```powershell
$env:SOLAIR_INGEST_HOST = '<actual-private-PC-IPv4>'
npm.cmd run dev
```

Leave the server terminal open. Browser: **http://127.0.0.1:3000**. For website-only review, `npm.cmd run dev` is enough; the LAN setting is for ESP ingestion. If a server is already running, stop it with Ctrl+C in its own terminal before starting another. Private firewall/network must allow the ESP to reach device-only TCP3002.

### 10B — private firmware settings in this IDE sketch folder

| Setting | What to enter |
|---|---|
| `DEVICE_ID` | Actual selected device in CPE Lab. |
| `DEVICE_TOKEN` | Its valid device token, privately. Provision/rotate only if needed; rotation revokes the previous token. Browser password is not a device token. |
| `WIFI_SSID`, `WIFI_PASSWORD` | Actual isolated bench Wi-Fi. PC and ESP must have network reachability. |
| `INGEST_URL` | `http://<actual-PC-IPv4>:3002/api/ingest`. ESP must not use `127.0.0.1`. |
| `ALLOW_PRIVATE_BENCH_HTTP` | `true` only for this isolated private HTTP bench. Production uses verified HTTPS. |
| `PZEM_SOURCE` | `"bench_supply"` for adapter tests. No MPPT is connected. |
| `LOAD_MODE` | `"bench_resistor"` only when that actual load is connected, otherwise `"none"`. |
| `ENABLE_MPU`, `ENABLE_SWITCHES`, `ENABLE_ADS` | `true` only for tested, connected modules. |
| `ENABLE_ACS`, `ENABLE_GPS`, `ENABLE_PZEM`, `ENABLE_LTE` | `true` only after each respective gate passed; otherwise `false`. |
| ACS coefficients / calibration | Measured values; `ACS_CALIBRATED true` only after reference-load validation. |
| Alarm flags | `ENABLE_ALARM` and `ALARM_POLARITY_VERIFIED` only after04 passes; `ALARM_ACTIVE_HIGH true`. |
| Motion flags | Enable only after baseline/threshold calibration; do not treat default thresholds as proven. |
| LTE packet fallback flag | Leave uncommissioned until real routing/POST checks; AT registration is not upload proof. |

### 10C — upload and see real data

| Step | Action | Expected evidence |
|---|---|---|
| 1 | Sign in as engineer → Real hardware → CPE Lab → actual device | Correct device identity, not demo mode. |
| 2 | Upload10 through Arduino IDE/COM3, open Serial Monitor115200 | Actual JSON frames, increasing sequence/uptime; keep credentials private. |
| 3 | Inspect CPE Lab last accepted payload | Matching device/firmware/boot/sequence and recent server receipt. |
| 4 | Move MPU / press and release each switch | Real values/states update. |
| 5 | Inspect commissioned ADS/ACS/PZEM/GPS/LTE channels | Values agree with serial/instruments; uncommissioned channels unavailable/fault. |
| 6 | Inspect Energy, GPS and CSV | Same accepted device data; bench energy is not battery charging. GPS requires a genuine fresh fix. |

Individual00–09 sketches mostly print human-readable diagnostics, not web-ingestible JSON. Test10/11/final provide the real backend path.

## Test 11 — combined soak, reset and offline recovery

Open [11_combined_all_sensors_soak.ino](../firmware/arduino-ide/11_combined_all_sensors_soak/11_combined_all_sensors_soak.ino). **Wiring stays exactly as the verified combined table in10.** Copy/review measured private settings in this sketch's own folder; they do not transfer automatically from10.

| Item | Connection / command | What to verify |
|---|---|---|
| All passed modules | Same combined table, no new wires | Concurrent readings; no resets, UART collisions or rising GPS overflow/checksum problems. |
| USB console | CP2102 USB /115200 /newline | `DISARM`, `LED`, `ARM`. ARM requires10 seconds since boot and both switches secure/LOW. |
| LED command | GPIO19 →330 Ω →LED +; cathode →GND | Independent LED response. |
| Local tamper | Release one switch at a time after ARM | Correct event/reason; commissioned alarm bounded to its configured duration. |
| No network | Interrupt Wi-Fi without rewiring live power | Local tamper still works; network loss alone does not turn siren on. |
| Recovery | Restore Wi-Fi / restart backend | Events/history retained and deduplicated; old buffered events do not fake fresh live telemetry. |
| Reset | Controlled reset with reviewed output test arrangement | Safe siren OFF; record actual power-up/reset behavior. |
| Sensor loss | Disconnect only with power off, then test | Unavailable/fault/stale handling; no invented zeros or coordinates. |

Record duration, serial log, real CSV, photos/video, reference readings and tester/date. Use [full acceptance](COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md) for the complete PASS/FAIL/BLOCKED checklist. No combined physical PASS is claimed here.

## Final — one integrated firmware, same wiring and same web app

Open [solair_cpe.ino](../firmware/arduino-ide/solair_cpe/solair_cpe.ino). No new connection table is needed: **use the combined wiring table in10 without reassignment**. Review the final folder's own private configuration against the proven11 configuration, then Verify/Upload through COM3. Test10/11/final use the same production engine.

| Final item | Keep / do |
|---|---|
| LED resistor | Keep330 Ω in series on GPIO19, not GPIO27. |
| Pin map | Keep21/22 I2C,25/26 switches,27 alarm,34 ACS,32 GPS,16/17/23 RS485,13/14 gated modem. |
| Power | Preserve reviewed12 V branches; select one ESP power source. Do not parallel USB5 V and buck5 V without an approved power-selection arrangement. |
| Missing electrical evidence | Leave that interface disabled; record blocker, do not mark it tested. |
| App | Same SOLAIR server/device identity, CPE Lab, Energy and CSV. No second website. |
| Finish | Send DISARM, stop serial monitor; remove power before changing wires. |

The detailed electrical reference remains the [original wiring/power guide](CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md). Software results are in [validation](CPE_VALIDATION.md); these tables add no claim of physical verification or battery-charging authorization.

> **18 October local continuation:** current Linux Arduino core is 3.3.12; the final packaged solair_cpe sketch compiles with it. PlatformIO independently compiles with pinned Arduino2.0.17. Earlier Windows/COM3/core instructions below are historical; preserve the working toolchain and choose the actual observed Linux port. See [current schematic/assembly and retest handoff](../../docs/CPE_SCHEMATIC_AND_ASSEMBLY_HANDOFF.md) and [validation](../../docs/CPE_VALIDATION.md). No upload or new physical acceptance was performed by Codex.

# Arduino IDE — use COM3 if it is your observed ESP32 port

**Latest19October bench result:** native Test06a now reads GPIO34 steadily around1302counts with64valid samples and no errors, siren off/unplugged. No GPIO35 jumper move is needed. Final [solair_cpe](solair_cpe/solair_cpe.ino) version2.0.3 now uses that native GPIO34 acquisition path plus factory eFuse voltage conversion. Reopen the final sketch from disk, retain its private config and upload with the existing divider unchanged and siren12V disconnected. Close SerialMonitor before reconnecting CPE Lab at115200; compare its ACS ADC1 millivolts with the contemporaneous meter voltage. ACS current calibration remains pending. This change is prepared, not yet physically verified; see [validation](../../docs/CPE_VALIDATION.md).

**19 October GPIO34 check:** if the meter shows about1.15V at the actual GPIO34 pin but the website's ACS ADC1 reports only200–245mV, use [06a_adc_wire_crosscheck](06a_adc_wire_crosscheck/06a_adc_wire_crosscheck.ino). Currentv2bypasses ArduinoADCwrappers and prints nativeADC1rawcounts forGPIO34/35 with init/readerror reporting and no ACS correction, sensor libraries or networking. Initially keep the verified divider onGPIO34;GPIO35is a conditional temporarycomparison, not a productionpinchange. Follow its [wiring and upload procedure](../solair-cpe/tests/06a_adc_wire_crosscheck/README.md). It temporarily replaces the combined sketch and does not stream dashboard telemetry. All16 current IDE folders are generated from canonical source; private configs are retained.

These folders package the same CPE firmware for Arduino IDE. Open the `.ino` whose name matches its folder. They contain local shared headers and no PlatformIO `entry.cpp`. Do not open the original PlatformIO test folders directly in Arduino IDE.

## First test: ESP32 + LED only

1. Disconnect the 12 V siren branch and external ESP 5 V supply. Power the ESP from USB only.
2. Wire GPIO19 → 330 Ω resistor → LED anode; LED cathode → ESP GND. Leave HW-548 disconnected from GPIO27 for this test.
3. In Arduino IDE, Boards Manager: install **esp32 by Espressif Systems, version2.0.17**, matching the tested firmware core. If no ESP32 package is listed, Preferences → Additional Boards Manager URLs can include `https://espressif.github.io/arduino-esp32/package_esp32_index.json`.
4. **Test00 needs no sensor libraries**, only the ESP32 board package. Before the later sensor tests, use Library Manager to install **ArduinoJson7.3.1**, **Adafruit MPU6050 2.2.6**, **Adafruit ADS1X15 2.5.0**, **TinyGPSPlus1.1.0**, **EspSoftwareSerial8.2.0** (provides SoftwareSerial.h). Allow required Adafruit BusIO and Unified Sensor dependencies. Those sensors do not all need to be connected for an isolated test.
5. File → Open → `00_esp32_boot_and_status_led/00_esp32_boot_and_status_led.ino` in this directory. Do not paste all sketches into one window.
6. Tools → Board → esp32 → **ESP32 Dev Module**. Tools → Port → **COM3** if it is the connected ESP32 CP2102. Use Upload Speed115200 initially; leave other board options at their defaults.
7. Click **Verify** (✓), then **Upload** (→). If it remains at Connecting, hold BOOT while connecting begins, release once writing starts; use your board's actual BOOT button. Do not alter sensor/power wires while powered.
8. Open Serial Monitor, set **115200 baud** and **Newline**. Expected: `BOOT uptime_ms=... LED19=...`, with the LED blinking. These are expected observations, not a physical PASS already recorded.

## Next tests

If Test01 repeatedly reports `bytes=0 WHO_AM_I=unavailable` after baseline restoration, use **[01a_imu_wire_crosscheck](01a_imu_wire_crosscheck/01a_imu_wire_crosscheck.ino)** with ESP+IMU only and USB power. It automatically prints the address scan and STOP/RESTART identity comparisons at100kHz/25kHz, without a sensor library or sensor configuration changes. Save startup and one entire `END_MPU_CHECK` block. [Detailed instructions](../solair-cpe/tests/01a_imu_wire_crosscheck/README.md).

For the unresolved ADS offset and independent GPS/LTE progression, use [Continue Tests05–08](../../docs/CPE_CONTINUE_TESTS_05_TO_08.md). New `05a_ads_register_crosscheck` is an independent direct-register comparison using only Arduino/Wire; it does not replace final firmware or mark the ADS passed.

Use the [separate wiring table for every test](../../docs/CPE_TEST_BY_TEST_WIRING_TABLES.md), including LED resistor legs, power connections, combined wiring and web-app steps.

Close Serial Monitor before each upload. Remove power before rewiring. Open the matching folder for MPU01, switches02, logic03, ADS05, etc. Follow the [direct breadboard guide](../../docs/CPE_DIRECT_BREADBOARD_QUICK_GUIDE.md) for actual connections and gates; the target names there match these folder names.

The sketch uses `config.example.h` until a local `solair_config.h` is present in that sketch's folder. For gated tests, copy `config.example.h` to `solair_config.h` **inside the sketch folder you are uploading** and edit only verified settings. Each IDE folder has its own config; changes do not automatically propagate between tests. Never share configs containing Wi-Fi/device credentials. Alarm and unknown interfaces remain disabled by default; GPIO27 active-HIGH is preserved, reset-safe OFF remains pending.

For final firmware open `solair_cpe/solair_cpe.ino`, configure that folder's private `solair_config.h` and retain the approved pin map. Tests10/11 and final produce backend telemetry; isolated00–09 primarily print diagnostic text. LTE USB08a and PZEM USB09a are laptop scripts, not Arduino sketches.

Website startup still uses `npm.cmd run dev` in the application folder. Arduino IDE replaces the ESP build/upload/serial workflow; it does not run the website/backend.

## Validation scope

For the sensor reporting WHO_AM_I=0x70 at I2C address0x68, updated Test01 automatically runs an MPU6500-compatible profile with configuration readback and complete-frame checks. Keep the address/wiring unchanged. Follow the physical checks in the Test01 wiring table. After those checks pass, enable `ALLOW_MPU6500_COMPAT true` together with `ENABLE_MPU true` in Test11/final firmware's own private config. No Adafruit library identity check is patched. Physical chip identity, calibration and actual measurements remain subject to your testing.

Shared C++ source was compiled with PlatformIO and ESP32 Arduino2.0.17. Packaging checks verify folder/sketch names, local headers and absence of duplicate wrappers. An Arduino IDE Verify/Upload has not been executed on this device; report an actual compiler error if it occurs. No physical upload/test is claimed.

Generated by `scripts/package-cpe-arduino-ide.py`. Regenerate after authoritative shared firmware changes; do not independently edit the copied headers. Private configuration is never copied by the generator.



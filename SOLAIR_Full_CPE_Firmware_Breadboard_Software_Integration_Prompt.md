# SOLAIR — COMPLETE CPE, ALL-SENSOR FIRMWARE, BREADBOARD TESTING & FINAL PWA INTEGRATION

**Codex implementation directive — 11 October 2026**

## NONNEGOTIABLE GOAL

Build the **one final SOLAIR system** that our group will actually deploy and demonstrate: all available CPE sensors and outputs connect to our one ESP32 and report real measurements/events to the same centralized SOLAIR backend/database and polished driver, TODA operator, and engineering dashboards. This must support **breadboard testing now** and **vehicle installation later** without rewriting the application or replacing the device identity/data model.

**Implement actual code, not only architectural plans:** provide uploadable, separately testable diagnostic sketches; one integrated final firmware; a terminal-by-terminal, beginner-friendly breadboard and power-wiring manual; authenticated ingestion/persistence; real dashboard components; example provisioning templates; run/build/test scripts; and a physical acceptance checklist. Do not claim a hardware test passed unless the team performed it.

**Distinguish implementation from observation:** The team reports the ESP32, MPU6050, two tamper switches, LED, MOSFET switching module/HW-548, active 12 V siren/buzzer, 12 V-to-5 V buck, 12 V/5 A bench supply and 2 A siren fuse/holder now work physically. Other modules are owned or ordered but not necessarily physically tested or integrated. Continue from that progress; do not reduce the final design to an LED-only device.

## 1. Audit the authoritative repository FIRST

- Locate the **new, from-scratch premium centralized SOLAIR application** built most recently, not automatically the older `C:\Users\Anyang\SolAir\figma-app` app. Determine its actual root directory. Inspect package.json, app/api/backend structure, database schema/migrations, deployment settings, auth, existing firmware and dashboards. Do not overwrite working modules or create a competing website.
- The older inspected project at `C:\Users\Anyang\SolAir\figma-app` had `firmware\anti-tamper\anti-tamper.ino` and `docs\cpe-lab-review-guide.md`, with GPIO21/22 (I2C), GPIO25/26 (switches), GPIO27 (alarm), authenticated HTTP `/ingest` over LAN, SQLite device events and SSE updates; those are **historical reference material only**. The new app is authoritative if present. Port proven concepts, not obsolete code/UI.
- If the new project has Next.js + PostgreSQL/Supabase, extend its real tables, RLS, authenticated ingestion, realtime/polling and dashboards. Continue local development without cloud credentials, with a documented real local database path compatible with the eventual production schema. Railway + Supabase are the planned managed providers but accounts/credentials may not be provisioned. Never invent secrets or hardcode tokens; device token is independent of browser-user login.
- Begin by writing a short **audit table: implemented / missing / physically unverified**, and then actually implement missing software within the existing app.

## 2. All physical modules in scope — NOT optional future placeholders

Implement dedicated firmware drivers, acquisition logic, schema, persistence and real dashboard display for each of the following. Do not mark missing/unpowered modules as LIVE. An untested integration must be explicitly labeled pending physical verification, not dropped from code.

| Module | Actual hardware | Required behavior |
|---|---|---|
| Microcontroller | ESP32-WROOM-32D, 38-pin USB-C, CP2102 | Safe boot, USB debug, device identity, configuration, watchdog/recovery, Wi-Fi |
| Inertial sensor | MPU6050 GY-521 | Raw and scaled accel/gyro, I2C status, calibrated thresholds/configurable tamper events |
| Lid tamper | KW11-3Z microswitch #1 | Debounced physical secure/released state, tamper event |
| Mount tamper | KW11-3Z microswitch #2 | Debounced physical attached/released state, tamper event |
| Local visual output | LED + 330 Ω | Independent diagnostic indicator; do not conflict with alarm pin |
| Active alarm | HW-548/F5305S MOSFET/switching board + active 12 V siren/buzzer | Verified safe OFF at boot/reset, alarm state, duration, reason, 12 V protected load |
| Power | 12 V/5 A adapter, 12-to-5 V HCW-P715 buck, existing 2 A inline fuse/holder | Bench power and safe distribution, protection and supply tests |
| Analog ADC | ADS1115 | Real 3.3 V I2C readings, 0x48 address check, grounded/3.3 V calibration, diagnostics |
| Current sensor | HW-525 ACS758LCB-050B ±50 A module | Supply/analog calibration, zero-current offset, current telemetry ONLY when voltage/supply compatibility and current-path ratings checked |
| GPS | NEO-6M GY-GPS6MV2 | Live NMEA parsing, lat/lon, valid fix, sats, accuracy where available, UTC, stale/invalid states |
| Cellular | SIMCom A7670E with microUSB carrier and white multipin connector | Real AT test and registration, carrier-specific voltage/power and logic compatibility, eventual LTE uplink/fallback and diagnostics; no fake connectivity |
| Solar metering | PZEM-017 + external 50 A shunt + USB-to-RS485 adapter | Modbus voltage, output current, watts, Wh, errors; USB laptop test first; ESP32 via RS485 interface |
| RS485 interface | 3.3 V MAX3485 TTL↔RS485 module | Proper DE/RE control, Modbus timing, readouts, electrical-isolation assessment |
| Existing CPE IO | ADS1115 and one ACS758 | Keep in same combined firmware; no separate production device required |
| Wind | Purchased 3-phase VAWT, controller not established | UI, schema and safe unavailable state now; only actual measurements after validated controller/interface |

Solar circuit context: 2 x 200 W PV panels (series; nominal Vmp ~39.4 V), TOMZN DC breaker, MPT-7210A controller, PZEM output measurement, CNLONQ output isolator and detachable Anderson SB50. Resistor load will be used for low-power off-vehicle tests. BEMAC 68VM nominal 55.2 V traction battery direct-bus-bar bypass is **not an automatically approved connection**. Do not equate PZEM voltage alarm or a fuse with cell-level BMS protection.

## 3. Final proposed ESP32 pin allocation — audit against actual working wiring

Implement a configurable `pins.h` with defaults and a single wiring reference table; the team's measured, working board wiring takes priority over this proposed plan. Do not silently reassign pins.

| Connection | Proposed ESP32 pin | Comment |
|---|---|---|
| I2C SDA: MPU6050 + ADS1115 | GPIO21 | Both share SDA |
| I2C SCL: MPU6050 + ADS1115 | GPIO22 | Both share SCL |
| Lid switch NO | GPIO25 | `INPUT_PULLUP`, COM→GND, pressed LOW (verify physically) |
| Mount switch NO | GPIO26 | `INPUT_PULLUP`, COM→GND, pressed LOW (verify physically) |
| HW-548 control output | GPIO27 | Exact active level and reset-safe OFF must be measured; never assume active-HIGH |
| Separate status/diagnostic LED | GPIO19 | Through 330 Ω resistor to LED/GND; GPIO27 LED test is only while MOSFET disconnected |
| ACS758 analogue output | GPIO34 (ADC1, input only) | ONLY after verified 0–3.3 V-safe conditioning/actual breakout supply; ADC1 avoids Wi-Fi/ADC2 contention |
| GPS NEO-6M TX→ESP RX | GPIO32 | Prefer 9600 baud receiver; see simultaneous UART constraints below |
| PZEM/MAX3485 ESP RX | GPIO16 | RS485 RO→GPIO16 (HardwareSerial1 candidate) |
| PZEM/MAX3485 ESP TX | GPIO17 | GPIO17→RS485 DI |
| PZEM/MAX3485 DE and active-LOW RE | GPIO23 | Drive/enable together according to MAX3485 board labels; keep receive mode when idle |
| LTE modem TX→ESP RX | GPIO13 | Only through VERIFIED carrier-level UART interface/level shifting |
| LTE modem RX←ESP TX | GPIO14 | Only through VERIFIED carrier-level UART interface/level shifting |
| UART0 console/programming | Existing CP2102 pins | Keep debug/programming functional |

**Critical simultaneous UART resource problem:** A classic ESP32 has 3 UART controllers, and UART0 is ordinarily used by the USB serial console. GPS, RS485 PZEM and LTE require three additional UART connections. Design and TEST a real concurrency solution rather than pretending GPIO numbers create extra hardware UARTs. Preferred budget path: keep HardwareSerial1 for RS485, HardwareSerial2 for modem, use **RX-only, 9600 baud GPS via a tested ESP32-compatible software UART** on GPIO32 if stable during Wi-Fi/LTE/Modbus activity. Provide isolated per-module sketches and a combined soak test. If software serial is unreliable, document an explicit technically credible alternative (e.g., I2C UART bridge) with exact new hardware and expected cost before requesting purchase; do not hide the limitation. Do not use boot-strapping pins or steal UART0 without documenting the impact on USB logs and uploading.

**Voltage/power safety:** ESP32 inputs are 3.3 V logic. ADS1115 A0-A3 must remain within its supply rails; never feed 60 V directly. ACS758 breakout may be 5 V-only and its output may exceed 3.3 V—verify supply, output, offset and conditioning first. NEO-6M breakout VCC and TX levels require board-level verification. Bare SIMCom modem UART is often 1.8 V: verify the actual A7670E carrier's translator, supply and current peaks from documentation/measurements. Do not energize a raw modem from an ESP32 GPIO/3.3 V pin. The PZEM/USB adapter is not an invitation to connect a laptop to a live traction battery; preserve galvanic isolation and use only supervised low-power test wiring until verified.

## 4. Explicit electrical breadboard and power-guide deliverable

Create `docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md` with:

1. A **complete inventory check**, photo/orientation checklist and two diagrams: signal breadboard and separate 12 V siren power branch.
2. A connection table for EVERY module (module terminal, supply, ground, ESP pin, expected voltage/logic, cable size/routing, test mode).
3. **12 V/5 A adapter distribution:** correctly protected 12 V siren branch through existing inline 2 A fuse as currently tested; separate feed to 12→5 V buck for supported 5 V loads/ESP32 supply. If USB and external 5 V power may backfeed, provide an approved power-selection procedure; never use breadboard rails for siren current.
4. HW-548 terminal labels Signal+/−, DC+/−, OUT+/− and actual tested switching behavior; require photos/measurements before claiming exact wiring polarity. Output OFF on boot, reset, disconnected GPIO, and Wi-Fi failure must be verified. Do not wire the 12 V output to the ESP32.
5. I2C bus shared by MPU6050 and ADS1115 at **3.3 V**, check expected 0x68 and 0x48 with scanner and actual readings. Address discrepancy instructions.
6. Each microswitch COM/NO mapping, `INPUT_PULLUP`, pressed versus released serial evidence. Mounting orientation must eventually make 'secure' physically meaningful.
7. GPS outdoor NMEA fix test with genuine last known fix and no invented coordinates.
8. LTE first test via documented carrier USB/AT, only then MCU UART after measured level/power compatibility, and independently test cellular telemetry transport.
9. ACS758 offset/sensitivity and safe low-current calibration; do not put traction or solar currents through an unreviewed breakout.
10. PZEM 50 A shunt's exact manufacturer wiring including voltage sense terminals and current path, external **regulated 5 V communication power** and Modbus adapter; first laptop USB on safe bench test, then ESP32 MAX3485. No power conductor through small PZEM terminal circuitry unless manufacturer diagram specifically requires it.
11. No shared 12 V and high-voltage wiring on breadboard, grounds/isolation rules, polarity checks and fusing.
12. Real order of power-on, serial configuration, firmware upload, local backend startup and dashboard confirmation.
13. Troubleshooting matrix: I2C not found, inverted switch, unsafe siren default, invalid GPS, AT no response, modem resets, PZEM timeouts, analog overflow, Wi-Fi 401/connection refused, dashboard stale.
14. Link each stage to its exact sketch and PASS/FAIL observable evidence, plus photo/video/CSV capture checklist.

**Write instructions for beginners**: precise terminal names, where on the physical ESP32 the GPIO label appears, common ground where permitted, which jumper goes where, what to disconnect between stages, what serial monitor baud to choose, what software screen will update, and what not to power simultaneously. Do not supply invented tested wire colors or pinouts for unknown modem breakout connectors.

## 5. Create actual independently uploadable firmware diagnostics — NOT pseudocode

Place source under `firmware/solair-cpe/` with Arduino-compatible sketches or an equivalent CLI-selectable set of test targets. Provide a concise `firmware/README.md` with exact board profile, Arduino CLI/build/upload commands, dependency versions, port detection steps, and which sketch to upload for each test. Do not invent the user's COM port. Use ESP32 Dev Module/appropriate WROOM-32 profile, and check core version compatibility with any existing code (historical baseline: ESP32 core 2.0.17).

Required stages (exact names may be refined, but all deliverables must exist):

- `tests/00_esp32_boot_and_status_led`: safe startup, uptime, LED pin and logs. No MOSFET/12 V load attached.
- `tests/01_i2c_mpu6050`: scan I2C; real accel/gyro; 0x68/0x69 diagnostics.
- `tests/02_tamper_switches`: physical GPIO25/26 LOW/HIGH, 50 ms debounce, truth table, pressed/secure convention.
- `tests/03_mosfet_logic_led_first`: prove GPIO27 signal while 12 V load disconnected, startup/off and timing; don't connect 12 V before polarity verified.
- `tests/04_12v_alarm_fused`: final approved HW-548/siren arrangement on fused 12 V; fail-safe boot/reset and duration tests, exact observed current/behavior fields to record; do NOT drive power on upload unintentionally.
- `tests/05_ads1115`: scanner 0x48; 0 V and 3.3 V A0 sanity check with safe input; no traction-voltage connection.
- `tests/06_acs758`: zero calibration, measured VCC/VOUT safe-range test, ADC1 acquisition; low-current known-load validation only after board review.
- `tests/07_gps_neo6m`: receive raw NMEA/parse position, fix/invalid status, UTC age, indoor/outdoor test; distinguish software UART from HWUART settings.
- `tests/08a_a7670e_usb_at`: documented manual/laptop AT test instructions/scripts through modem USB only: `AT`, `ATI`, `AT+CPIN?`, `AT+CSQ`, `AT+CEREG?`, `AT+CGATT?`, `AT+COPS?`, no secret output.
- `tests/08b_a7670e_esp_uart`: compileable modem UART diagnostic **gated** until carrier supply, translator and serial pins confirmed; no unverified activation.
- `tests/09a_pzem_usb_modbus`: laptop script/commands through included USB-RS485 for genuine readings with the supervised resistor load.
- `tests/09b_pzem_esp32_max3485`: Modbus RS485 9600/equipment-specified parameters, GPIO16/17/23, external serial-side power; real data and timeouts.
- `tests/10_wifi_authenticated_ingest`: true ESP32 heartbeat to actual SOLAIR backend with local provisioning and device token, no fake accepted responses.
- `tests/11_combined_all_sensors_soak`: integrate concurrent sensor polling, alarm priority, UART contention/latency, offline recovery for prolonged bench testing.
- `solair_cpe.ino`: **ONE final integrated firmware**, with all validated modules enabled concurrently and each unavailable/unsafe module set UNAVAILABLE/FAULT until safe to activate. Include build-time and runtime feature flags for diagnostics, not separate production firmwares per subsystem.

Every diagnostic must list: exact needed modules and supply; wiring; which previous stage must pass; compilation/upload commands; expected real serial output format with examples explicitly labeled *illustrative*, PASS/FAIL criteria, common faults, saved evidence file name, cleanup before next stage. Do not stop after creating templates: implement code and compile/test what tooling permits.

## 6. Final integrated firmware behavior

- Nonblocking task architecture: security/tamper/alarm tasks must be responsive independent of GPS fix, LTE registration, PZEM timeout or cloud latency. Avoid unsafe blocking `delay()` loops, modem waits or Wi-Fi waits.
- Local tamper rule works even with no internet. Explicit `ARM` / `DISARM` (USB serial uppercase with newline and 115200 baud from inspected firmware baseline), and evolve authenticated remote control **only if genuinely implemented end-to-end**. Maintain 10-second arm-after-boot and both-switch-secure requirement unless hardware-reviewed change is documented.
- GPIO27 MOSFET/siren control uses the **physically verified active level**; boot/reset/network-failure output should be safe and predictable; record/command actual output state. Keep GPIO19 as a separate optional status LED.
- Accurate MPU6050, switches, ADS1115, ACS758, PZEM, GPS, LTE diagnostics; ensure appropriate polling rates, memory usage and watchdog behavior on a single ESP32.
- Time-stamped security events; boot ID and monotonic sequence; event deduplication; bounded offline queue with flash wear considerations; backoff/retry, heartbeat and data quality. Device UTC can be null before clock sync; server receive time separate.
- Wi-Fi first, LTE fallback when physically commissioned; do not assert LTE online just because AT replies. Provide graceful runtime availability state for every module.
- Versioned authenticated schema. Differentiate `bench_resistor`, `vehicle_charging` and `none/unknown` operating modes. NEVER label bench resistor energy as BEMAC battery charging; don't invent pack SOC, PV watts, GPS or VAWT production.
- Device encryption and per-device credentials where supported by approved transport, with onboarding/documentation and no source control secrets.

## 7. ONE complete SOLAIR backend and database

Extend the actual new SOLAIR app (not a sidecar demo UI) with:

- Device registry/vehicle association/firmware version and credentials management; signed-in role-based operator/driver/engineer permissions, RLS where applicable.
- Authenticated device ingestion (HTTP(S) from ESP32; optional future MQTT if genuinely implemented), strict versioned parser/validation, idempotent event storage, true device time versus receipt time, per-sensor quality/unavailable data. Postgres migrations and indexes.
- Tables for telemetry snapshots/history, security events, siren/ARM states, GPS fixes/tracks, LTE connection state, PV/PZEM readings, ACS/ADS diagnostics, availability faults, audit logs, and wind future-proof fields.
- Real device monitoring/live updates via appropriate provider realtime or authenticated SSE/polling. Device offline/stale detection with measured last-seen time. Authenticated historical CSV exports.
- Secure local development path that **actually runs** before managed Railway/Supabase credentials are ready, with same schema/API semantics and no secrets pasted to chat.
- Device-to-user command channel for actual remote ARM/DISARM only if explicitly designed with auth/authorization, delivery acknowledgment, replay protection, safe local policy; otherwise label controls 'not connected' and use physical USB serial control.
- Real SOS/event workflow if already present in new SOLAIR app; indicate offline/pending state rather than fake transmitted messages.

## 8. ONE final premium SOLAIR PWA, including integrated engineering lab

Inside the existing design implement real components, not separate mock dashboards:

**CPE Engineering:** live MPU6050 vectors, two switch states with secure/tampered indicators, armed state, MOSFET commanded/reported state, siren alarm state, sensor health, boot/uptime/firmware, Wi-Fi and LTE registration, last accepted payload, ingestion and validation errors, manual bench test log, CSV export, measurement source badges. Provide guided test stages with actual incoming values and PASS/FAIL only after real evidence.

**Solar Energy:** PZEM voltage/current/power/Wh, source=MPPT output, PZEM health, output load mode (`bench_resistor` vs verified charging), current history, energy history, unavailable/no-data where disconnected. ACS solar/other current and ADS diagnostics should appear only as actual validated channels. Wind must remain unavailable until viable controller/readings exist.

**GPS and fleet:** genuine NEO-6M fix validity, last position map only if valid and fresh, last-fix age, and movement history without placeholder coordinates. Driver view and operator fleet view must share the same real vehicle data.

**Notifications:** genuine anti-tamper/alarm/device offline/SOS events, with timestamps and source traceability; no demo event masquerades as physical data.

Keep premium responsive driver/operator/engineer experience. Do not degrade the existing white BEMAC 68VM vehicle visualization/design; no stock generic fleet dashboard.

## 9. Full physically executable test sequence and software acceptance

Produce `docs/COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md` organized as:

A. Photograph all hardware, actual ESP32 board, modem carrier labels, MAX3485 and buck. Verify wiring and supplies unpowered. Record multimeter checks.
B. Upload and PASS each of the 00–10 diagnostics, capturing serial output. **12 V siren only after LED/control and power checks pass**.
C. Run the final integrated `solair_cpe.ino` with all SAFE modules enabled. Confirm real lid and mount tamper, real motion, working buzzer, safe boot, ARM/DISARM, Wi-Fi loss and reconnection.
D. Run or initialize the **final** SOLAIR backend/database/front-end locally and authorize device identity. Use actual PC LAN IP for local ingestion; never `127.0.0.1` from ESP32. Inspect genuine accepted payloads, heartbeat, persistence, realtime display and export.
E. Test GPS outdoors for real fix; test modem USB AT and SIM/network status, then actual ESP UART/LTE only after hardware checks. Verify ADS1115 A0 GND and 3.3 V; ACS zero and safe load; PZEM on isolated supervised resistor test. Verify all channels display genuine values and disconnected ones go offline/unavailable.
F. Demonstrate full combined continuous run with Wi-Fi, MPU, switches, alarm, GPS, PZEM, ADS/ACS, and LTE module diagnostics without UART collisions, watchdog loops or serial lockups; document any hardware gates preventing concurrent LTE cellular transfer. Don't claim physically passed without actual test.
G. Reboot the ESP32, reboot backend, interrupt network; show safe siren OFF/reset state, replay/deduplication, preserved historic events and accurate last-seen status.
H. Capture final video/screenshots/CSV/logs and write a table: `Module | Hardware observed? | Firmware compiled? | Physical measurement? | End-to-end dashboard? | Pass/fail/blocker | Evidence path`.

Three verdicts: **CPE FULL BENCH-READY** only when all physically available in-scope sensors have proven end-to-end real readings and safety gates, **PARTIALLY READY** when core tamper/alarm/backend works but some GPS/LTE/ADS/ACS/PZEM channels are pending, and **BLOCKED** when there is unsafe wiring, broken local anti-tamper safety behavior or no authenticated data path. Do not conflate CPE readiness with solar-to-traction-battery charging authorization or approval of the entire academic project.

## 10. Deliverables — do not finish with only a proposal

1. Audit of actual current repository and authoritative app.
2. All actual diagnostic Arduino sketches/scripts (00–11) and final `solair_cpe.ino` plus pin/config/secrets templates.
3. Full breadboard + separate 12 V power wiring guide with stages and verified-versus-proposed markings.
4. Backend/device auth, database migrations, telemetry contract and real data persistence.
5. Integrated real CPE, solar, GPS, LTE diagnostics, ADS/ACS, anti-tamper, and fleet/driver SOLAIR UI.
6. Build/upload/run instructions on Windows, correct board/core/dependencies, serial commands; do not invent COM port.
7. Software compilation/tests and results (run them). Physical tests remain pending until our team reports evidence.
8. Exact files created/modified, unresolved physical compatibility requirements and a single consolidated team test checklist.
9. Clear staged path from current 12 V fused working breadboard to one final CPE attached to BEMAC (without pretending direct bus-bar charging has BMS protection).

**EXECUTION REQUIREMENT: Implement everything the current codebase and actual documentation allow now; where a specific breakout pinout, voltage level or power arrangement is unknown, write safe compileable diagnostics with feature DISABLED and one precise verification gate. Don't silently omit modules, don't mark placeholders as implemented, don't invent success or request a whole new architecture. Ask for the minimum actual board photo/specification only for that blocking connection.**

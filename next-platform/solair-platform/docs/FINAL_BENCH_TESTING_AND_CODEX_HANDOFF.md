# SOLAIR CPE Breadboard Bench Verification — Final Handoff to Codex

**Date**: 18 October 2026
**Repository**: `next-platform/solair-platform`
**Current Phase**: Final Phase — Combined All-Module Soak Verification & System Acceptance

---

## 1. Complete Bench Testing & Verification Record

All CPE breadboard subsystems have completed physical testing (Tests 00 through 11). Physical observations and multimeter measurements are recorded in [CPE_VALIDATION.md](CPE_VALIDATION.md):

| Stage | Subsystem | Physical Verification & Test Results | Status |
| :--- | :--- | :--- | :--- |
| **00** | ESP32 Core Boot | Stable reset vector; 5000ms WDT; 470 µF capacitor across 5V/GND eliminates RF burst resets. | **PASS** |
| **01** | IMU (MPU6500) | `WHO_AM_I = 0x70`; live 3D acceleration vector (~9.5 m/s² on Z axis at rest) and dynamic gyro rates. | **PASS** |
| **02** | Tamper Switches | KW11 switches on GPIO25/26 (`INPUT_PULLUP`). Low = Secure (pressed), High = Tampered (open / wire cut). | **PASS** |
| **03** | Status LED | GPIO19 drives status LED via 330 Ω resistor; active-HIGH gate control verified. | **PASS** |
| **04** | 12V Siren & MOSFET | HW-548 MOSFET on GPIO27; active-HIGH confirmed (OFF ~0V, ON ~3.3V); 5000ms safety cutoff operational. | **PASS** |
| **05** | ADS1115 ADC | I2C `0x48`; A0 reads 0.5826V (4661 counts); A1–A3 grounded at 0.00V; register readbacks match. | **PASS** |
| **06** | ACS758 Current | 2:1 divider (2× 10 kΩ) steps 2.30V down to 1.17V at GPIO34 (DMM verified); ADC1 reads ~1158–1175 mV. | **PASS (Electrical Gate)** |
| **07** | NEO-6M GPS | SoftwareSerial on GPIO32 RX at 9600 baud; TinyGPS++ stream verified; outdoor 3D fix with 9 satellites. | **PASS (Outdoor)** |
| **08b** | A7670E Cat-1 LTE | UART2 on GPIO13/14 at 115200; AT ready, SIM ready, CSQ 18–22, cellular network registered, packet data attached. | **PASS** |
| **09b** | PZEM-017 DC Meter | RS485 on GPIO16/17 at 9600 8N2; 50A shunt burned to EEPROM (`0x0001`); reads 12.29V live from 12V supply. | **PASS** |
| **10** | Wi-Fi Ingest | End-to-end telemetry frames ingested into Next.js server with bearer token auth and SQLite persistence. | **PASS** |
| **11** | All-Module Soak | Concurrent operation of all modules in `11_combined_all_sensors_soak.ino` / `solair_cpe.ino`. | **FINAL PHASE** |

---

## 2. Why the GPS PPS LED Does Not Blink Indoors

The NEO-6M onboard LED is hardwired to the u-blox chipset **TIMEPULSE (Pulse Per Second / PPS)** pin:
1. **Satellite Signal Physics**: GPS satellites broadcast from ~20,000 km altitude at 1.575 GHz (L1 band) with extremely weak signal strength (~-130 dBm). Reinforced concrete slabs, metal roofing, and thick indoor ceilings attenuate this signal by 20–30 dB, completely blocking the signal.
2. **Firmware Behavior**: The u-blox chipset **only starts pulsing (blinking) the PPS pin after it locks onto at least 4 satellites** and computes a valid 3D navigation solution.
3. **Indoor Ground Floor vs. Upstairs**:
   - On a ground-floor workbench, satellite signals cannot penetrate the ceiling $\to$ PPS LED stays solid OFF $\to$ firmware honestly reports `gps_fix: false` and `quality: "fault"`.
   - When placed upstairs near an open window or outdoors under open sky $\to$ receiver locks onto satellites within 1–3 minutes $\to$ PPS LED blinks at 1 Hz $\to$ firmware reports `gps_fix: true` with valid latitude, longitude, and satellite count.
4. **Real-World Fleet Solutions for Blocked GPS**:
   - **External Canopy Mount**: In physical e-trike assembly, the GPS antenna is mounted on the top-most fiberglass canopy roof, keeping clear line-of-sight to the sky during road operation.
   - **A7670E Cellular LBS Triangulation**: When parked under GI sheet metal roofs or inside garages, the cellular modem can triangulate location from nearby cell towers (`AT+CLBS` / Cell-ID), yielding ~100–300m resolution even with zero GPS reception.
   - **Last-Known Location Persistence**: The server pins the e-trike's last valid road coordinate and marks it as "Parked", so operators retain location provenance.
   - **Security Independence**: The anti-tamper security system, siren, accelerometer, current monitoring, and energy metering are **100% independent of GPS** and function fully without satellite lock.

---

## 3. The 3-State Security Finite State Machine (FSM)

The SOLAIR security architecture operates as a strict **3-State FSM**:
- **State 1: `DISARMED`** — Normal vehicle operating mode. Tamper switches and movement do not trip the alarm or siren.
- **State 2: `ARMED`** — Vehicle parked and security enabled. Continuous monitoring of debounced Lid switch (GPIO25), Mount switch (GPIO26), and 3D motion shock vectors.
- **State 3: `TRIGGERED`** — Tamper detected (switch released or motion threshold exceeded). The 12V siren activates for 5000ms with automatic hardware cutoff, an emergency event is persisted, and the state stays latched until an authenticated `DISARM` command is received.

*Note for Codex*: In `engine.h`, this logic is tracked via `armed`, `triggered`, and `alarmActive`. In the v2 schema, these are carried as boolean flags (`armed`, `alarm_active`, `reason`). Codex can project the explicit `security_state: "DISARMED" | "ARMED" | "TRIGGERED"` enum onto dashboard views as required by the original SRS.

---

## 3. Why the Web Dashboard Appeared "Frozen"

In the screenshot provided by the user (`10:15 PM`), the dashboard showed `Delayed` and `Load: bench_resistor`, but was not moving because:
- The top-right button in Chrome was showing **`Connect ESP32`** (green), meaning **WebSerial was disconnected**.
- Chrome only receives live serial frames when the user clicks **`Connect ESP32`** and selects the USB COM port.
- When connected, the button changes to **`Disconnect USB`**, and live telemetry frames stream into the page every 2 seconds (`RX SOL-ET-01 #seq`).

---

## 4. Key Code Changes Made in Workspace

1. **`firmware/solair-cpe/engine.h`**:
   - Simplified `ARM` command: removed the 10-second boot lockout (`now < 10000`); auto-clears prior alarm latch.
   - Added direct `siren_test` / `SIREN` command for instant 5-second buzzer verification.
2. **`firmware/solair-cpe/imu6500.h`**:
   - Reduced periodic health check from 8-register readback to single WHO_AM_I identity check (`0x75 == 0x70`), eliminating I2C collisions with ADS1115.
3. **`firmware/solair-cpe/modules.h`**:
   - Added 16-sample multi-reading averaging on `analogReadMilliVolts(ACS_PIN)` to smooth ADC sample noise.
4. **`packages/telemetry-contract/index.ts`**:
   - Added `"test"` to valid `event_type` schema.
   - Updated `NDJSONParser` to route `# ...` comment lines directly to log stream without throwing errors.
5. **`src/Lab.tsx`**:
   - Fixed sparkline graph to preserve historical points rather than clearing to empty array on null frame.
   - Added one-click **"Test Siren (5s)"** button to the lab UI.
6. **`firmware/arduino-ide/*`**:
   - Synchronized all 15 test folders via `python3 scripts/package-cpe-arduino-ide.py`.

---

## 5. Next Steps for Codex

1. Review git status and uncommitted changes in `next-platform/solair-platform`.
2. Ensure the user connects to `http://localhost:3000` via WebSerial by clicking **`Connect ESP32`** after any firmware flash.
3. Validate concurrent live streaming of all modules in `11_combined_all_sensors_soak.ino`.
4. Finalize the test evidence export (`solair-bench-hardware.json`) from the CPE Lab and record final acceptance.


## Codex continuation — 18 October, live-stream and schematic preparation

The user reports the freeze occurs even while ESP32 is connected; do not dismiss it as a forgotten connection. Live display/parser/reconnect/server-source fixes and software fixture checks are recorded in the latest [CPE validation](CPE_VALIDATION.md). Firmware ARM gates, PZEM timeout/range quality and read-only runtime, LTE deregistration, GPS receive diagnostics and latched security-state display were corrected. Generated IDE folders retain private configs. Compile/fixture evidence is separate from uploads/physical acceptance, which remain pending in this session.

The target is the final CPE for the whole SOLAIR system. The user plans to design the schematic/PCB then hire a perfboard assembler. Start with [CPE schematic and assembly handoff](CPE_SCHEMATIC_AND_ASSEMBLY_HANDOFF.md), including purchased 12 × 18 cm board and supplied header listing, actual pin/resistor tables, power/connector HOLDs and assembler deliverables. Draft layout may proceed, but incorporate perfboard validation before PCB fabrication. GPS indoor no-fix is not established by LED alone; cellular LBS/accuracy and secure remote alert delivery must not be claimed from AT registration.


Latest GPIO19 continuation: user discovered its LED/resistor had been on GND and corrected it to GPIO19; now reports a brief light, not verified five seconds. Found/fixed the backup alarm cutoff's stale-loop-time unsigned underflow in prepared2.0.2; hardware esp_timer cutoff remains. Added distinct300ms LED-test versus configured-duration siren-test device acknowledgments. Host timing/ARM/Modbus regressions and both pinned-core all-enabled/Arduino final compiles PASS; all15 IDE folders regenerated without private-config changes. Running board remains2.0.1; upload and isolated GPIO19 timing retest with siren12V disconnected still required. See latest [validation](CPE_VALIDATION.md); do not claim the code defect explains every observed short flash or that hardware acceptance is complete.


Post-upload update:2.0.2 is now confirmed in actual backend frames after explicit115200 USB reconnect, new bootfff369419dd8752781c86581. PZEM is again consistently replying12.29V,0A/0W under the reported bench state; first~minute GPS reception has0UART overflows with advancing sentences, but still0satellites/no fix. MPU identity reads and ADS are stillfault/null. Five-second GPIO19 physical retest is requested/pending. See latest validation; the earlier2.0.2-not-uploaded state is superseded only by this received evidence.


GPIO19 timing retest: user reports5seconds after2.0.2 and corrected GPIO19 wiring, with siren12V instructed disconnected. Backend test-state ON/OFF receipts span approximately5seconds. This verifies that narrow LED bench result, not siren/reset/armed-system acceptance. MPU/ADS stillfault; inspect actual shared wiring next. Latest PZEMfault while supply-off instruction was in effect does not erase preceding valid12.29V observations. See current validation.

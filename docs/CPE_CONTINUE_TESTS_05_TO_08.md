# Continue bench tests 05 to 08

12 October 2026. Existing centralized application and final firmware remain authoritative. Independent tests can proceed with named earlier blockers; this does not make a blocked module PASS. No physical result is established by this guide.

## 05a — independent ADS register comparison

Open [05a_ads_register_crosscheck.ino](../firmware/arduino-ide/05a_ads_register_crosscheck/05a_ads_register_crosscheck.ino). This uses only Arduino/Wire and direct ADS register transactions, not the shared Modules scanner or Adafruit ADC library. It checks configuration readback, conversion readiness and exact response length with a bounded deadline. ADC identity/authenticity is not verified by an I2C response.

1. Disconnect 12 V and USB before touching wires. Keep ADS VDD at ESP3V3, GND at ESPGND, ADDR at GND, SDA21/SCL22. First keep all four inputs connected to ADS GND.
2. Reconnect ESP USB only; open the new sketch, select ESP32 Dev Module and the actual ESP port, Verify then Upload. Monitor115200.
3. Expect each `CHECK A0` through `CHECK A3` to show `valid=1` and voltage close to0. Save one complete scan. This proves a register transaction/conversion completed, not calibrated measurement accuracy.
4. With power off, remove only A0's ground jumper and connect A0 to ESP3V3. Reconnect USB, measure A0-to-ADS-GND and compare the next complete scan. Other channels stay grounded. Return A0 to ground with power off afterward.

| Observation | Decision |
|---|---|
| Independent ground readings near0 and A0 tracks measured3V3 | Compare with original Test05; investigate shared driver if only it fails. |
| Same approximately−0.12V offset in independent test | Original scanner alone does not explain it. Module, reference, measurement contacts and power require examination; no automatic offset subtraction. |
| `valid=0` or config mismatch | Save exact error/config; register communication/configuration remains unresolved. |

Team reported ground continuity with steady beep and displayed001–003, but earlier powered ground difference reached0.4V. Continuity alone does not reconcile those measurements. Do not mark ADS passed without real reference agreement. If unresolved, disconnect the ADS with all power off and proceed with independent GPS/modem tests while recording Test05 BLOCKED.

### One isolated comparison before replacing or calibrating anything

Power off ESP USB and12V. Disconnect other modules from the ESP for this comparison, including HW-548 signal connections. Use only ESP32+ADS, powered by USB. Prefer fresh jumpers; ADS header pins must be soldered, not loose in holes. Keep VDD=ESP3V3, SDA21/SCL22. Use two empty five-hole breadboard strips G1/G2 for the ground node, bridged as below; do not assume a long rail or a strip across the centre gap is continuous.

| Ground jumper | From | To |
|---|---|---|
| 1 | ADS GND pin | G1 hole1 |
| 2 | ESP GND pin | G1 hole2 |
| 3 | G1 hole3 | G2 hole1 |
| 4 | ADS ADDR | G1 hole4 |
| 5 | ADS A0 | G1 hole5 |
| 6 | ADS A1 | G2 hole2 |
| 7 | ADS A2 | G2 hole3 |
| 8 | ADS A3 | G2 hole4 |

All five holes in G1 must belong to one connected strip; likewise G2. Reconnect USB only and re-upload the updated05a sketch. Startup identifies `REGISTER CHECK v2`; each scan adds DIFF_A0_A1 and DIFF_A2_A3. With all inputs grounded, single-ended readings and both differences should be near0. These are comparisons, not compensation. If single-ended/differential disagree, save the complete scan; do not infer a specific defective component solely from that difference. If offsets persist with actual board-pin voltages verified, inspect/compare the board and supply or use a known-good ADC; the cause cannot be guaranteed from serial output alone.

## 06 — ACS758 status

Keep disconnected and disabled until the exact HW-525/ACS758 board supply, current terminals, signal ground and output conditioning are verified. No safe resistor/divider values or full-range output compatibility have yet been established. The existing Test06 software is implemented; an unconnected GPIO reading is not an ACS hardware pass. Continue with independent Test07 without calling Test06 passed.

## 07 — GPS

First confirm the exact breakout model, VCC rating and TX logic level. A NEO-6M chip rating does not establish the supply rating of an unknown breakout. Until confirmed, do not energize by guessing a supply.

| From | To | Condition |
|---|---|---|
| Confirmed GPS supply | GPS VCC | According to actual breakout documentation. |
| GPS GND | ESP GND | Common verified reference. |
| GPS TX | ESP GPIO32 | Only confirmed3.3V-compatible output; otherwise correct translator first. |
| GPS RX | Leave disconnected | Receive-only test. |
| GPS antenna | Matching GPS connector | Actual suitable antenna. |

Copy Test07's config.example.h to solair_config.h inside that sketch folder and change only ENABLE_GPS to true after the interface checks. Open [07_gps_neo6m.ino](../firmware/arduino-ide/07_gps_neo6m/07_gps_neo6m.ino), Verify and Upload. ESP USB monitor115200; GPS UART9600. Use open sky for a fix. NMEA text demonstrates data reception; fix=0 is not valid positioning. PASS requires actual fix=1, plausible coordinates and satellites, with outdoor observations saved. GPS LED blinking alone is not a fix test. ADS/ACS/siren can remain disconnected.

## 08a — LTE USB, using Arduino IDE Serial Monitor

Prerequisite: confirm the carrier's USB power/data requirements and use that approved supply arrangement. The unknown white connector and ESP UART stay disconnected. Attach matching antenna and insert SIM with power off. Once the carrier is correctly powered and USB attached, select its actual AT COM port in Arduino IDE; do not assume it is the ESP port. No ESP sketch upload is needed. Use115200 and **Both NL & CR**. One application owns the port at a time.

Send these separately and wait for each reply:

| Command | What to record |
|---|---|
| AT | OK proves AT interface responds. |
| AT+CGMM | Actual model response. |
| AT+CPIN? | READY means SIM ready. Do not guess PIN codes. |
| AT+CSQ | Record response;99 means unknown signal, not a good signal. |
| AT+CEREG? | Registration status1 or5 means home/roaming registration. |
| AT+CGATT? | 1 means packet attachment; it does not prove backend delivery. |

The existing [USB script](../firmware/solair-cpe/tests/08a_a7670e_usb_at/README.md) is an alternative. AT/SIM/network checks do not establish a real cellular upload. Keep Test08b ESP UART disabled until connector/power/logic translation is confirmed. No APN/PIN/reset/firmware-writing command is needed for this initial read-only check.

Research references: [u-blox NEO-6 manufacturer datasheet](https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf), [SIMCom A7672X/A7670X hardware design](https://files.waveshare.com/wiki/A7670E-Cat-1-GNSS-HAT/A7672X_A7670X_Series_Hardware_Design_V1.03.pdf), [SIMCom AT manuals](https://www.simcom.com/technical_files-p1.html?filetype=0&pro_cat=0&pro_li=155&time=0). The provided Shopee purchase page could not be read during this research. Manufacturer module documents do not establish the unidentified green carrier's connector map, supply circuit or UART translator. No white-connector pinout has been inferred from similar-looking internet boards.

# SOLAIR: direct breadboard guide for tomorrow

**For a separate wiring table per test, start with [Test-by-test wiring tables](CPE_TEST_BY_TEST_WIRING_TABLES.md). It includes both resistor legs, each power/ground wire, Arduino IDE sketch links, the combined system and web-app steps.**

**Use this at the bench. Keep the [full wiring/power guide](CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) for details.** This is a connection procedure, not a report of physical tests passed.

Scope: your 12 V/5 A home adapter only. BEMAC battery, solar panels and MPPT stay disconnected. Preserve and photograph the existing working setup before moving wires. If its pins differ, stop and reconcile with `firmware/solair-cpe/pins.h`; do not silently replace proven wiring.

## 1. Set up the breadboard once

1. Unplug USB and switch off/unplug the 12 V adapter before inserting or moving any wire.
2. Use the GPIO **labels** beside the ESP32 headers: `21`, `22`, `25`, etc. These are not header positions counted from USB. `3V3` and `5V/VIN` are different pins.
3. Keep the ESP beside the breadboard and run jumpers from its labeled headers if it does not fit comfortably. Do not force it into rows that short opposite pins.
4. Choose one rail for **GND** and a different rail for **3.3 V**. Label them. Check rail continuity with power off; some rails have a break halfway. Use only the section you checked, or bridge the matching sections deliberately.
5. Wire **ESP GND → GND rail**.
6. Wire **ESP 3V3 → 3.3 V rail**.
7. Initially power the ESP through its USB cable only. **Leave buck OUT+ disconnected from the ESP while USB supplies power.** Keep the siren power branch off for tests 00–03 and the input tests.
8. Check with a meter: the 3.3 V rail is about 3.3 V relative to GND. It must not be 5 V or 12 V.

Never put siren, resistor-load or shunt current through breadboard rails. Only signal wiring and suitable small sensor supplies belong here. Row numbers/wire colors are not prescribed because your breadboard orientation is not known.

```text
ESP USB ← PC (initial ESP power + data)
ESP GND ── GND rail ── LED / switches / approved sensor grounds
ESP 3V3 ── 3.3 V rail ── MPU VCC / ADS VDD

Separate, off the breadboard:
12 V adapter → existing protected siren branch / buck
buck 5 V OUT → NOT connected to USB-powered ESP
```

## 2. Upload with Arduino IDE (recommended for your COM3 setup)

Open the matching sketch in `firmware/arduino-ide/`, select **ESP32 Dev Module → COM3**, then Verify/Upload. Follow the [Arduino IDE steps and library list](../firmware/arduino-ide/README.md). Use those clean folders rather than the PlatformIO source folders. Serial Monitor is **115200 baud + Newline**. Each numbered target below has a matching IDE sketch folder. PowerShell firmware commands below are optional; website startup still needs its Node server.

### Optional PowerShell upload commands

Open PowerShell:

```powershell
cd C:\Users\Admin\Videos\SolAir\next-platform\solair-platform
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
```

Find the ESP's CP2102 port by unplug/replug comparison. In the following example, replace `COM_NUMBER` with that observed port and replace `$target` for each stage. Close other serial monitors before upload. Flashing replaces the existing ESP program: retain its source/private configuration first.

ccl
$espPort = 'COM_NUMBER'
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target $target
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target $target -Upload -Port $espPort
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port $espPort
```

Monitor: **115200 baud, newline**. Ctrl+C closes it. Never upload `compile_all_only`.

Create private `firmware/solair-cpe/solair_config.h` from `config.example.h` only if it does not already exist. Preserve an existing config. During isolated tests, leave unrelated `ENABLE_*` flags false. Stages 01 and 05 enable their named I2C module automatically; stage 02 reads both switches directly. Other input/powered stages use the flags below. Never share this private file once credentials are added. Full tool installation instructions: [firmware README](../firmware/README.md).

## 3. Core connections: LED, MPU and both switches

Connect only the parts for the stage you are testing. Power off before each change.

| Test / target | Numbered connections | Check in serial / physical result |
|---|---|---|
| **00** `00_esp32_boot_and_status_led` | 1. GPIO19 → 330 Ω resistor. 2. Resistor → LED anode (usually long leg). 3. LED cathode (usually short leg/flat side) → GND rail. | LED blinks; uptime increases. Confirm LED polarity from the actual part. No MOSFET attached. |
| **01** `01_i2c_mpu6050` | 1. GY-521 VCC → 3.3 V rail, after confirming this breakout supports it. 2. GND → GND rail. 3. SDA → GPIO21. 4. SCL → GPIO22. 5. AD0 → GND. 6. Leave INT and XDA/XCL unused. | Scanner finds `0x68`; accel/gyro change when moved. If only `0x69` appears, check AD0 rather than guessing. |
| **02** `02_tamper_switches` | 1. Identify COM/NO/NC using labels + unpowered continuity. 2. Lid COM → GND rail. 3. Lid NO → GPIO25. 4. Mount COM → GND rail. 5. Mount NO → GPIO26. 6. Leave both NC terminals unused. | Press each lever: its value becomes `0` (LOW). Release: `1` (HIGH). Test each independently; debounce is 50 ms. |

These connections can stay for the final combined test after they pass. An LED's lead length is only a clue; verify a trimmed/unknown LED before wiring it.

## 4. GPIO27 logic test, then the existing siren branch

**03 target:** `03_mosfet_logic_led_first`. Disconnect HW-548 Signal+ from GPIO27 and turn off/remove 12 V load power.

1. Use a second LED, or temporarily move the GPIO19 LED assembly to GPIO27: **GPIO27 → 330 Ω → LED anode; cathode → GND**.
2. Upload 03. Startup LED must be OFF.
3. Send `ON` + newline: GPIO27 LED turns ON, then goes OFF after the configured 5 seconds. Send `OFF` to stop immediately.
4. Measure GPIO27 to ESP GND: OFF about 0 V; ON about 3.0–3.3 V. Restore the status LED to GPIO19 afterward.

**Keep `ALARM_ACTIVE_HIGH true`. Your group measured this polarity. Reset/power-up safe-OFF is still pending.**

**04 target:** `04_12v_alarm_fused`. Preserve the existing working HW-548/siren wiring. The following terminal map is usable **only if it matches your actual tested board connections and signal interface**; polarity measurements alone do not establish every terminal or isolation boundary.

| Existing branch | Connection to verify with power OFF |
|---|---|
| Siren supply | Adapter +12 V → existing inline 2 A fuse near source → HW-548 DC+ |
| Siren return | Adapter negative → HW-548 DC− |
| Load | HW-548 OUT+ → siren +; HW-548 OUT− → siren −, **only when this is the actual verified module map** |
| Control | GPIO27 → HW-548 Signal+; ESP GND → Signal−, **only for the verified signal interface** |
| Buck input | Adapter +/− → separately protected buck IN+/IN−, following the existing reviewed branch |
| Buck output | Measure OUT+/OUT− at 5 V with loads disconnected. Do not connect OUT+ to the USB-powered ESP. |

Do not add a Signal−/DC− bridge by assumption. Do not use breadboard contacts for this table's power conductors. If any terminal differs from the working setup, keep that branch off and use the full guide to resolve it.

Before attaching the siren, test the output using the reviewed meter/test load: boot, reset, disconnected GPIO, USB removal and no Wi-Fi must not cause an unintended ON. Resolve any floating input with a hardware-reviewed interface. Then enable `ENABLE_ALARM` and `ALARM_POLARITY_VERIFIED` for 04; retain active-HIGH. This gate is a physical check, not simply changing flags to make the siren sound. With the protected siren attached, `ON` should sound for 5 seconds; `OFF` stops it. Record boot/reset behavior and current. Network loss alone must not activate it; an armed local tamper may.

## 5. ADS1115: direct shared-I2C test

**Target:** `05_ads1115`. Siren branch off. Verify ADS breakout/pull-ups support 3.3 V.

1. ADS **VDD/VCC → 3.3 V rail**.
2. ADS **GND → GND rail**.
3. ADS **SDA → GPIO21** (same node as MPU SDA).
4. ADS **SCL → GPIO22** (same node as MPU SCL).
5. ADS **ADDR → GND rail** for address `0x48`.
6. Leave **ALRT** unused. For this test, **A1/A2/A3 → GND**.
7. First **A0 → GND**. Upload 05: address `0x48`, A0 near 0 V.
8. Power off; move **A0 → measured 3.3 V rail**. Power on: A0 near 3.3 V. Compare with the meter.
9. Power off; return A0 to GND. Keep ADC inputs within 0…VDD. No 12 V input.

## 6. GPS: direct only after supply/TX voltage check

**Target:** `07_gps_neo6m`; set `ENABLE_GPS true` only after verifying the GY-GPS6MV2's actual VCC requirement and TX level.

1. GPS **VCC → its verified supply**. Do not choose 3.3 V or 5 V from the module name alone.
2. GPS **GND → approved signal GND rail**.
3. GPS **TX → GPIO32**, only with verified 3.3 V-compatible logic; otherwise a reviewed translator is required first.
4. GPS **RX stays disconnected**. Attach its antenna.
5. Upload 07. Raw NMEA should appear. Take the antenna outdoors with a clear sky view; wait for a genuine valid fix, satellites and coordinates. Indoors, bytes without a fix are possible.

GPS uses RX-only software serial at 9600 baud. USB monitor stays 115200. Never wire GPS TX to GPIO16: that pin is reserved for PZEM.

## 7. ACS758: stop before GPIO34 until conditioning is verified

**Target:** `06_acs758`. This section cannot supply a direct divider/current-terminal map yet: the actual HW-525 supply, complete output range and conditioning have not been established.

1. Leave **ACS VOUT disconnected from GPIO34** initially. Verify the actual board's VCC/GND and rated supply from its documentation.
2. Power it from that verified supply, with no load current. Measure sensor VOUT and the proposed conditioned ADC output to ground.
3. Confirm the conditioning keeps **GPIO34 input within 0…3.3 V over the whole intended current range**, not just at zero. Confirm the allowed common ground/reference.
4. Only then: **conditioned output → GPIO34**; approved conditioning reference → signal GND. Do not connect a raw 5 V sensor output directly.
5. Set measured `ACS_FRONTEND_SCALE`, `ACS_ZERO_V`, sensitivity; set `ENABLE_ACS true`. Upload 06. `ZERO` proposes an offset from real samples while current is independently confirmed zero.
6. The hardware lead must establish the exact IP+/IP− current path before adding a fused low-current known load. Verify against an instrument, then set `ACS_CALIBRATED true`. Until then, dashboard amperes remain unavailable.

Do not insert a meter's current terminals across the adapter. No ACS load current through breadboard rails.

## 8. LTE: USB first; leave the white connector alone

**08a:** carrier USB test only, after its USB supply/operation is confirmed. Leave ESP GPIO13/14 and the white connector disconnected. Attach antenna/SIM with power off. Identify the actual modem AT COM port, which is different from ESP CP2102.

```powershell
.\.tools\cpe-python\Scripts\python.exe firmware\solair-cpe\tests\08a_a7670e_usb_at\usb_at.py --port COM_NUMBER --confirmed-carrier-usb
```

Replace the port with the modem's observed AT port. Check real AT response, SIM status and registration; AT response alone does not prove internet access.

**08b target:** `08b_a7670e_esp_uart` stays blocked until carrier supply, white-connector pins and translator are verified. `ENABLE_LTE` remains false. Eventual verified wiring is modem TX through correct translation → GPIO13; GPIO14 through correct translation → modem RX; approved signal reference → GND. Native UART may be 1.8 V. No direct 3.3 V jumper instructions are authorized for this unknown carrier.

## 9. PZEM: laptop first, then MAX3485

**Delivery gate:** exact PCB terminal labels, manufacturer sense/shunt diagram, matched 50 A shunt and USB/isolation arrangement must be checked first. Do not connect a guessed numbered terminal. Small sense terminals and large shunt current bolts are different.

**09a laptop:** ESP/MAX3485 disconnected. On the verified isolated low-power resistor bench, connect USB-RS485 A/B → the confirmed PZEM A/B; external regulated 5 V and return → documented communication supply terminals. Follow the delivered diagram for voltage sense and shunt/load conductors; this unverified power map is deliberately not guessed here.

```powershell
.\.tools\cpe-python\Scripts\python.exe firmware\solair-cpe\tests\09a_pzem_usb_modbus\pzem_usb.py --port COM_NUMBER --confirmed-isolated-bench
```

Use the USB-RS485 port, not ESP/modem. Defaults: address 1, 9600 8N2. It checks stored 50 A range before accepting V/A/W/Wh. A mismatch is a fault; [09a README](../firmware/solair-cpe/tests/09a_pzem_usb_modbus/README.md) has the separate, gated range-setting command. No energy reset is needed.

**09b target:** `09b_pzem_esp32_max3485`. After 09a passes, power off and disconnect the USB-RS485 adapter. With verified 3.3 V MAX3485 and approved signal reference:

1. MAX **VCC → 3.3 V rail**; **GND → signal GND rail**.
2. MAX **RO → GPIO16**.
3. MAX **DI → GPIO17**.
4. MAX **DE and /RE → GPIO23** together. `/RE` means active-low RE.
5. MAX **A → confirmed PZEM A**; **B → confirmed PZEM B**.
6. PZEM communication supply stays on its documented external 5 V supply. Verify its required reference/isolation before bonding any ground.
7. Set `ENABLE_PZEM true`, upload 09b. Expect `shunt50_verified=1` and `valid=1` with readings agreeing with the laptop/instruments. Timeout, mismatch or CRC fault is not a zero reading.

No simultaneous USB-RS485 and ESP bus masters. Keep shunt/load power conductors off the breadboard.

## 10. Start the website and connect the final device

**Website review only:** in PowerShell at the app root, run `npm.cmd run dev`, then open **http://127.0.0.1:3000**. Use existing login. Nothing needs to be connected to review it.

**Real ESP Wi-Fi ingestion:** close that server with Ctrl+C, find the PC's actual Wi-Fi IPv4 with `ipconfig`, then restart with:

```powershell
$env:SOLAIR_INGEST_HOST = '<actual-private-PC-IPv4>'
npm.cmd run dev
```

1. PC and ESP must be on the reachable isolated bench network. Private firewall must permit the device-only TCP3002 listener.
2. Engineer login → Real hardware mode → CPE Lab → select the actual device. Use its existing valid device token; provision/rotate only if necessary because rotation revokes the old token.
3. Privately set `DEVICE_ID`, `DEVICE_TOKEN`, Wi-Fi values and `INGEST_URL="http://<actual-PC-IPv4>:3002/api/ingest"`; set `ALLOW_PRIVATE_BENCH_HTTP true` for this isolated bench. Never use `127.0.0.1` as the ESP destination or publish the token.
4. Set `PZEM_SOURCE "bench_supply"`; set `LOAD_MODE "bench_resistor"` only with that actual load, otherwise `"none"`.
5. For **10**, use target `10_wifi_authenticated_ingest`, enabling only electrically verified modules. Keep LTE/ACS/PZEM/GPS/alarm flags false wherever their individual gates have not passed. Enable `ENABLE_MPU`, `ENABLE_SWITCHES`, `ENABLE_ADS` only for the modules actually connected and tested.
6. Upload and check CPE Lab: real last-seen/firmware, changing sequence, MPU/switches, commissioned sensor readings, accepted payload and CSV. Individual 00–09 diagnostics print serial text; **10/11/final** provide ingestible JSON. Missing modules must show unavailable/fault, not invented readings.
7. After individual passes, use **11** target `11_combined_all_sensors_soak`, then final target **`integrated`**. Both use the production engine; retain the same verified wiring/config. Do not enable an unknown module merely to make every badge green.
8. Final USB commands: `DISARM`, `LED`, `ARM` with newline. ARM requires at least 10 seconds since boot and both switches pressed/secure. Test each release independently. Motion/alarm require their separate measured gates. With siren commissioned, confirm local tamper still works without Wi-Fi and output stops within its configured duration.
9. Save serial log, wiring photo, reference readings and real CSV. Record each stage as PASS / FAIL / BLOCKED with tester/date. Run the [full acceptance checklist](COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md) for reset, recovery and concurrent UART soak. Finish with DISARM and remove power before rewiring.

## Tomorrow's honest starting point

| Can follow directly after basic board checks | Still needs exact hardware evidence |
|---|---|
| LED19; MPU21/22; switches25/26; isolated GPIO27 LED; ADS21/22; website startup | Siren boot/reset safe-OFF and confirmed terminal/reference map |
| GPS TX32 once supply/logic verified; MAX3485 RO16/DI17/DIR23 once bus gate passed | GPS supply/TX levels; PZEM delivered terminal/shunt/isolation map |
| Existing LTE USB AT script after carrier USB checks | Modem white connector/power/translation; ACS supply/conditioning/current-path map |

Wind remains disconnected/unavailable until its controller/interface is established. Full hardware readiness is earned by measurements and evidence, not compilation.



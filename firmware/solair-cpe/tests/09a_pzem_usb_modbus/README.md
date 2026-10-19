# 09a — laptop read-only PZEM

Needed: PZEM017 exact revision diagram, configured50A shunt, external regulated5V serial power, appropriate USB-RS485 adapter, isolated fused low-power DC source/rated resistor, multimeter. Prerequisite: power/isolation/shunt mapping approved; never laptop-to-traction wiring. No ESP/MAX3485 connection concurrently.

Follow the main wiring guide section6: manufacturer voltage/shunt sense terminals are mandatory; no guessed numbered terminals or breadboard load current. A/B match actual labels; verify serial5V/reference/isolation. Defaults address1,9600 8N2; normal polling reads function03 range and function04 registers0…7 with CRC validation. Only the separate explicit setup command below writes the50 A range; calibration/energy reset are never performed.

```powershell
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
.\.tools\cpe-python\Scripts\python.exe firmware\solair-cpe\tests\09a_pzem_usb_modbus\pzem_usb.py --port COM_NUMBER --confirmed-isolated-bench
```

Replace the actual USB-RS485 port. Ctrl+C stops/cleans serial. Illustrative only: `{"quality":"ok","voltage_v":12.1,"current_a":0.2,"power_w":2.4,"energy_wh":7,"load_mode":"bench_resistor"}`. PASS: genuine stable readings agree with independent instruments/known shunt range within documented tolerance. FAIL/BLOCKED: CRC/timeout/wrong supply/address/shunt map/isolation; do not invent readings. Save `09a-YYYYMMDD-modbus.txt`, shunt wiring photo and meter results. Remove source/load and adapter power, disconnect USB-RS485 before09b. This laptop stage is a script;09b is the ESP32 upload.

## 50 A range verification and explicit setup

Normal polling is read-only and now reads holding register0x0003 (function03) before each function04 measurement. Expected value0x0001 means50 A. Wrong range/CRC/timeout produces fault, with no accepted measurement. Confirm this family register map against the delivered revision and actual matched50 A shunt first. Firmware checks the same register at startup/periodically, without writes.

If the delivered meter is configured for another range, disconnect the load, retain verified isolated communication power and use this separate setup operation ONLY after those checks:

```powershell
.\.tools\cpe-python\Scripts\python.exe firmware\solair-cpe\tests\09a_pzem_usb_modbus\pzem_usb.py --port COM_NUMBER --confirmed-isolated-bench --set-50a --confirmed-family-register-map-and-50a-shunt
```

This sends function06 register0x0003 value0x0001, checks exact response echo, then function03 readback; it exits afterward. It never changes address, alarm thresholds, energy or factory calibration. PASS requires configured_shunt_a=50 and readback_verified=true from the actual meter. Illustrative output is not evidence. If acknowledgement/readback fails, stop and inspect rather than assuming the write failed or succeeded. Re-run normal polling and capture the physical shunt label plus instrument comparison. Source: [manufacturer family manual, section2.4](https://www.solar-thailand.co.th/pdf/PZEM-003-Manual.pdf). Actual terminal assignments still require the delivered manufacturer's diagram.


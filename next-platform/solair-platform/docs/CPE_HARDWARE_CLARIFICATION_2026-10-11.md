# Hardware clarification — 11 October 2026

Current scope is HOME BREADBOARD TESTING ONLY. The 12 V/5 A adapter powers the low-voltage bench. BEMAC traction battery, PV panels and MPPT are not connected. Use LOAD_MODE="bench_resistor" only when that load is actually connected (otherwise "none"), and PZEM_SOURCE="bench_supply" for this adapter test. These are commissioning settings, not permission to energize unknown interfaces.

## Team-reported observation

Working components reported: ESP32-WROOM-32D, MPU6050, two microswitches, LED, HW-548 F5305S, active12 V siren, buck, adapter and existing2 A siren fuse/holder. GPIO27 measures approximately0 V with siren OFF and3.0–3.3 V with siren ON. Active-HIGH remains the firmware setting; do not invert it without new evidence. This is the group's observation, not a new test performed by Codex. Reset/power-up safe-OFF has not been recorded. ENABLE_ALARM and ALARM_POLARITY_VERIFIED remain false until the full safe-output gate (including reset) is completed; the active-HIGH configuration is already preserved.

## Modem

Purchased carrier: [seller reference](https://shopee.ph/product/1415068025/43911882331), described by the group as compact green A7670E Cat-1 carrier, micro-USB, white multipin connector, micro-SIM and external antenna. The group reports supplying photos; this clarification supplies no inspectable photo attachment. White connector pinout, carrier supply and UART translation remain unverified. Do not infer a pinout from appearance. Existing AT driver and USB-first script remain implemented; ENABLE_LTE=false keeps ESP UART disabled. Follow stage08a, then verify the carrier documentation and voltage levels before08b. Native1.8 V UART is not proof of a carrier translator.

## PZEM-017 / matched50 A shunt

Purchased variation: Peacefair PZEM-017 +50 A shunt +USB-RS485, with separate3.3 V MAX3485 for later ESP integration. Delivered PCB revision/labels/diagram remain pending. No physical readings have been observed here.

The [manufacturer family product page](https://en.peacefair.cn/product/786.html) confirms9600 8N2. The [PZEM-003/017 family manual mirror, section2.4](https://www.solar-thailand.co.th/pdf/PZEM-003-Manual.pdf) defines holding register0x0003 with0x0001 for50 A (0=100 A,2=200 A,3=300 A). The user-provided [reference](https://manuals.plus/m/ac07000dd646b709f8f4d93d9d733d7c07ab0bf46ae0e26eeae2999f58a528) and seller page were inaccessible to the web reader. Family documentation is not confirmation of delivered terminal assignments.

ESP firmware reads back range on startup and at least every30 seconds; a mismatch, invalid response or range-query timeout makes PZEM quality fault and withholds readings. Firmware never writes meter settings. The laptop diagnostic checks range before each measurement and offers a separate explicit --set-50a commissioning command (see09a README). Use that command only after confirming the delivered manual/register map and physical matched50 A shunt, with load disconnected. It changes only range, validates write echo and reads back; it never resets energy or performs factory calibration. A valid range register does not verify the physical shunt or wiring.

Continue the [single acceptance checklist](COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md). Existing application and all module implementations remain authoritative; no new website, database reset or physical upload was performed for this clarification.

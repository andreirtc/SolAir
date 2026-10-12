# 05_ads1115

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: ADS1115 supply3.3V; USB ESP; multimeter reference.
- Prerequisite: 00,01 shared bus check.
- Wiring/configuration: VDD3.3V/GND, ADDRGND, SDA21/SCL22; A0 initiallyGND then measured3.3V, never aboveVDD.
- Real serial observation: I2C0x48; A0 counts and actual V at ±4.096V gain.
- PASS: Actual0V and3.3V compare within team instrument tolerance; record gain/error. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: Power off before changing A0; no high-voltage source.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 05_ads1115
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 05_ads1115 -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `05_ads1115-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=5; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


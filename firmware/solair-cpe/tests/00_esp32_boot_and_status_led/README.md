# 00_esp32_boot_and_status_led

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: USB ESP32, GPIO19 LED +330 Ω; no other modules powered.
- Prerequisite: No prerequisite.
- Wiring/configuration: GPIO19→330Ω→LED anode; cathode GND.
- Real serial observation: LED19 toggles each second; BOOT uptime increases.
- PASS: Observed LED toggles; stable uptime, no reset loop. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: Disconnect USB before adding modules.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 00_esp32_boot_and_status_led
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 00_esp32_boot_and_status_led -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `00_esp32_boot_and_status_led-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=0; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


# 11_combined_all_sensors_soak

Actual uploadable Arduino target using the production engine via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: All physically approved modules and independent instruments.
- Prerequisite: 00–10 individual observations; unknown modules remain disabled.
- Wiring/configuration: Final pin map; UART0USB/UART1RS485/UART2LTE/softwareUARTGPS; use final config.
- Real serial observation: Continuous v2 values, quality/faults, bounded events; alarm responsive under network/sensor load.
- PASS: Recommended≥60-minute measured run; record actual duration/rates/reset/overflow/cutoff/queue loss; no software-only PASS. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: DISARM, remove siren/load supply then ESP supply; save logs/video/CSV.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 11_combined_all_sensors_soak
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 11_combined_all_sensors_soak -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `11_combined_all_sensors_soak-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `{"schema_version":2,"device_id":"…","sequence":…,"cpe":{…}}`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


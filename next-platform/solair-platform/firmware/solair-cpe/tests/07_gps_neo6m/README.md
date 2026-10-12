# 07_gps_neo6m

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: GPS verified supply/TX logic, antenna; USB ESP.
- Prerequisite: 00 + board-level voltage check.
- Wiring/configuration: GPS TX→32, GND reference, documentedVCC; RX unused; ENABLE_GPS true.
- Real serial observation: Raw NMEA + checksum/fix/sats/UTC/position age; RX-only softwareUART9600.
- PASS: Genuine outdoor valid fix and independent location sanity check; disconnect→invalid; no invented coords. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: Disconnect GPS power before rewiring; preserve privacy of real locations.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 07_gps_neo6m
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 07_gps_neo6m -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `07_gps_neo6m-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=7; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


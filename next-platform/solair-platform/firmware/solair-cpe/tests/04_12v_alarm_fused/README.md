# 04_12v_alarm_fused

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: Approved HW-548/active12V siren circuit; existing reviewed2A branch; meter/test load.
- Prerequisite: 03 + measured polarity/interface/reset OFF/protection approval.
- Wiring/configuration: Follow separate12V branch; no power current on breadboard; private config ENABLE_ALARM and ALARM_POLARITY_VERIFIED with measured ALARM_ACTIVE_HIGH.
- Real serial observation: Startup OFF; ON only after explicit command; cutoff at configured5000ms; OFF command.
- PASS: Measure current/trigger/timeout and OFF on reset/GPIO unplug/USB loss. Any unsafe sound on boot is FAIL/BLOCKED. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: DISARM/OFF then remove12V before USB/programming or rewiring.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 04_12v_alarm_fused
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 04_12v_alarm_fused -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `04_12v_alarm_fused-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=4; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


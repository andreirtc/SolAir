# 06_acs758

After independently verifying zero current, send `ZERO` with newline. The diagnostic collects64 fresh ADC samples and prints `PROPOSED ACS_ZERO_V=...`. Compare that with the reference meter before editing private coefficients; this command does not set the calibrated flag or establish gain accuracy.

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: HW-525 ACS758 and independently reviewed supply/conditioner, isolated low-current load/meter.
- Prerequisite: 05 + VCC/VOUT/full-range GPIO34 protection reviewed.
- Wiring/configuration: ConditionedVOUT→34, approved signalGND; current path separate. Set ENABLE_ACS; record frontend scale/zero/sensitivity.
- Real serial observation: ADC_mV/VOUT/zero; ignore A until ACS_CALIBRATED and safe_range true.
- PASS: Zero/reference-load comparisons recorded; actual board/current polarity proven, no overrange. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: Remove current-source power before sense wiring; no traction circuit.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 06_acs758
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 06_acs758 -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `06_acs758-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=6; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


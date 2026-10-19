# 09b_pzem_esp32_max3485

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: PZEM017/50A shunt, external regulated serial5V, verified3.3V MAX3485, isolated resistor bench.
- Prerequisite: 09a + actual manufacturer shunt diagram/isolation checks.
- Wiring/configuration: RO16, DI17, DE+active-lowRE23; A/B matching PZEM; MAX3.3V; ENABLE_PZEM true.
- Real serial observation: Read-only9600 8N2; actual V/A/W/Wh or explicit invalid timeout.
- PASS: Readings match independent instrument/laptop test; timeout/CRC fails honestly; shunt range50A confirmed. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: Power off bench and disconnect RS485 before wiring; no laptop adapter concurrently.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 09b_pzem_esp32_max3485
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 09b_pzem_esp32_max3485 -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `09b_pzem_esp32_max3485-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=9; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


The serial line now includes shunt50_verified. It must be1 before valid=1 can be accepted; startup and periodic function03 register0x0003 readback must equal0x0001. A mismatched range remains invalid. Only the separately gated laptop09a setup command can change range; this ESP sketch never writes meter settings.

# 08b_a7670e_esp_uart

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: Exact A7670E carrier with approved dedicated supply/translator/SIM/antenna.
- Prerequisite: 08a USB AT + verified carrier connector/UART levels.
- Wiring/configuration: CarrierTX→ESP13; carrierRX←14 via required translator; common signal reference only if approved; ENABLE_LTE.
- Real serial observation: LTE AT/registered/attached/CSQ; no fake packet-online.
- PASS: Actual registration/SIM/CSQ transitions; unplug→timeout; no ESP brownouts. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: Remove modem power before changing connector; do not guess PWRKEY.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 08b_a7670e_esp_uart
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 08b_a7670e_esp_uart -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `08b_a7670e_esp_uart-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=8; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


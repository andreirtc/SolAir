# 10_wifi_authenticated_ingest

Actual uploadable Arduino target using the production engine via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: ESP/private reachable Wi-Fi, actual backend/device token; optionally approved inputs.
- Prerequisite: 00 + app startup/provisioning.
- Wiring/configuration: ActualPC-LAN-IP:3002/api/ingest; token in ignored private config; approved sensor flags only.
- Real serial observation: USB v2 NDJSON; actualHTTP201 or duplicate200, matching persisted identity.
- PASS: Authenticated acceptance, history/CSV and same driver/operator vehicle; wrong token401. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: DISARM, stop owned services Ctrl+C, remove power; never paste token.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 10_wifi_authenticated_ingest
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 10_wifi_authenticated_ingest -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `10_wifi_authenticated_ingest-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `{"schema_version":2,"device_id":"…","sequence":…,"cpe":{…}}`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


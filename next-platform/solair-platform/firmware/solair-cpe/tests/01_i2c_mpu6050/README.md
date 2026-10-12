# 01_i2c_mpu6050

Actual uploadable Arduino target using the shared diagnostic driver via this sketch. No physical PASS is inferred from compilation.

- Needed modules/supply: MPU GY-521 verified 3.3V; ESP USB.
- Prerequisite: 00.
- Wiring/configuration: VCC3.3V/GND, SDA21/SCL22, AD0 GND; config MPU_ADDRESS0x68.
- Real serial observation: I2C0x68; raw7-word and scaled accel m/s²/gyro rad/s.
- PASS: Detected address, changing vectors; stationary gravity plausible compared to reference, not detector calibration. Record tester/date, instruments and actual result. FAIL for wrong states, lost traffic, unsafe voltage/output or unexplained resets; BLOCKED for missing electrical approval.
- Cleanup: Power off before switch wiring.

From the centralized application root in PowerShell:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 01_i2c_mpu6050
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 01_i2c_mpu6050 -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Replace COM_NUMBER with the observed CP2102 port. Close other monitors before upload. Console115200/newline. Save `01_i2c_mpu6050-YYYYMMDD-serial.txt`, wiring photo, meter reference and result/evidence path. For10/11 save genuine CPE CSV and device boot/sequence too.

Illustrative format only (not a measured result): `DIAGNOSTIC stage=1; ...`. Diagnostic output is human-readable; only10/11/final generate ingestible JSON. Full [wiring guide](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md) and [fault matrix](../../../../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md#8-troubleshooting) apply. Use only this stage's modules; disable unrelated private feature flags in isolated tests. Do not upload compile_all_only.


If SCAN shows0x68 but detected=0, the updated diagnostic prints MPU_PROBE once per second. It reads WHO_AM_I register0x75 independently and reports register_status, bytes, identity, initialized and read_valid. The pinned Adafruit MPU6050 library expects identity0x68. Address ACK alone does not establish successful initialization/data reads. Capture the whole probe line; do not bypass identity validation or change wiring/power based only on an unexpected ID. zeros with read_valid=0 are invalid, not stationary measurements.

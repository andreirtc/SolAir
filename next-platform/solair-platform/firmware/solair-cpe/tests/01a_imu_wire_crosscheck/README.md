# 01a — independent IMU Wire cross-check

Use when Test01 receives zero bytes from identity register0x75. ESP USB only; siren/external5V and all other modules, including ADS, disconnected. Use the team's previously approved3.3V IMU breakout: VCC→3V3, GND→ESP GND, SDA→GPIO21, SCL→GPIO22, AD0→GND; INT/XDA/XCL unused. Use actual soldered contacts and good short jumpers. Remove all power before wiring. This does not authorize an unknown breakout supply or prove earlier wiring is correct.

Open generated `firmware/arduino-ide/01a_imu_wire_crosscheck/01a_imu_wire_crosscheck.ino` in Arduino IDE, ESP32 Dev Module/core2.0.17, observed ESP port. Close other monitors, Verify, then Upload. Monitor115200/Newline. No private config or external sensor library is needed. Upload replaces the current sketch; retain its source/config. Linux compile-only alternative from the app directory: `bash scripts/cpe-build.sh 01a_imu_wire_crosscheck`.

The sketch performs an actual stop-terminated full address scan at startup. Every5seconds it compares pointer-write/read with STOP versus RESTART at0x68 and0x69, at100kHz and25kHz with a50ms timeout. It writes only the identity register pointer; it does not reset/wake/configure the sensor, generate motion values, use a sensor library, recover the bus by toggling pins or bypass identity checks. GPIO27 is commandedLOW for the team's active-HIGH arrangement; this is not physical safe-OFF evidence. The new test must be used with that branch disconnected.

Save startup through one complete `END_MPU_CHECK` block plus VCC-to-GND measured **at the IMU pins** to private `data/bench-evidence/01a-YYYYMMDD.txt`. Interpret `pointer_status` as completed-write status only for STOP; RESTART status0 may merely mean queued, not address ACK. `read_valid=1` means exactly one identity byte received, not a correct/authentic sensor or physical motion PASS.

With AD0 actually grounded,0x68 is the expected address; no response at0x69 is normal in that arrangement. If startup has already scrolled past when the monitor opens, press the board's actual EN/RESET button once with only the USB-powered ESP+IMU connected, then capture the new startup.

| Actual result | Next step |
|---|---|
| Stable0x68 ACK and WHO_AM_I0x68/0x70 | Identity transport comparison succeeded. Return to Test01 for full frame, configuration, gravity/tilt/rotation checks. |
| Only0x69 responds | With power off verify AD0/board address selection; record actual address before any firmware-address change. |
| Both addresses NACK/error/no identity | Investigate actual power, labels, contacts, ground and wiring; this does not identify a defective part by itself. |
| ACK but all identity reads empty | Save full matrix and actual pin voltages; comparison/board/reference investigation still required. |
| STOP works but RESTART fails | Preserve result; transaction-method difference needs investigation before changing production code. |
| Only25kHz works | Preserve result; timing/signal integrity/pull-up investigation required, not proof the production bus is ready. |
| Idle SDA/SCL low or many unexpected addresses | Check bus wiring/shorts/pull-ups and other connected devices. Digital levels alone are not voltage measurements. |

No guaranteed diagnosis is inferred from a single pattern. Compilation is not a physical read, no upload is performed automatically, and existing sensor/app acceptance remains pending.

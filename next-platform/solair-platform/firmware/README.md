# SOLAIR CPE firmware — Windows quick start

Use the centralized app at `C:\Users\Admin\Videos\SolAir\next-platform\solair-platform`.
New production entry: `solair-cpe/solair_cpe.ino`; its shared code is `engine.h`, `modules.h`, `pins.h`, `protocol.h`.
The older `esp32-solair` source is preserved as historical source; do not upload it for this new test sequence.

## Tools and dependencies

Node 24 and npm for the app. PlatformIO 6.1.18 in project `.tools/cpe-python`, espressif32 6.10.0, ESP32 Dev Module (`esp32dev`, classic WROOM, 4 MB flash), Arduino ESP32 **2.0.17**. No board core upgrade is required. `platformio.ini` pins ArduinoJson 7.3.1, MPU6050 2.2.6, ADS1X15 2.5.0, TinyGPSPlus 1.1.0 and EspSoftwareSerial 8.2.0. Transitive versions are recorded in the compile logs.

On a fresh transfer, in PowerShell at the project root:

```powershell
python -m venv .tools\cpe-python
.\.tools\cpe-python\Scripts\python.exe -m pip install platformio==6.1.18 pyserial==3.5
```

`scripts/cpe-build.ps1` uses a short `.cpe-tools` junction at the archive root to avoid Windows toolchain path limits. It links to this project's `.tools/platformio`; it does not delete/move the toolchain. Keep only one extracted app owning that junction, or set an explicit short `PLATFORMIO_CORE_DIR` when invoking PlatformIO directly. Do not point it at an unrelated checkout.

## Configure / compile / identify / upload / monitor

1. Preserve the source/config of the existing ESP32 program. Review [the wiring guide](../docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md). Disconnect all powered loads before flashing; upload resets the ESP32.
2. Copy `firmware/solair-cpe/config.example.h` to ignored `firmware/solair-cpe/solair_config.h` and privately edit values. Do not post this file, compiled provisioned binaries, Wi-Fi credentials or device tokens. All unknown electrical interfaces default disabled. Set only the feature flags whose wiring gates passed. Record pin/polarity changes in the guide. `LOAD_MODE` is `bench_resistor` for resistor tests, never `vehicle_charging` by default. Set `PZEM_SOURCE` to `bench_supply` for adapter tests; only use `mppt_output` when the meter is physically on the actual controller output.
3. Compile first; this command **does not upload**:

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 00_esp32_boot_and_status_led
```

4. Identify the CP2102 port by unplug/replug comparison in Device Manager → Ports. Bluetooth COM ports are not the ESP32. Enumeration command:

```powershell
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
```

5. Close all serial monitors, select the **observed** port, then upload. Substitute its name for `COM_NUMBER` (a placeholder, not a valid port):

```powershell
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Target 00_esp32_boot_and_status_led -Upload -Port COM_NUMBER
powershell.exe -NoProfile -File .\scripts\cpe-build.ps1 -Monitor -Port COM_NUMBER
```

Console is 115200 baud. Use newline for uppercase `ARM`, `DISARM`, `LED`; diagnostics 03/04 use `ON` and `OFF`. Production supports the existing USB JSON arm/disarm/alarm_off/led_test commands too. These are USB commands, not remote Wi-Fi commands. Baseline motion calibration uses measured configuration, not automatic physical approval.

Production `SENSORS OFF` / `SENSORS ON` pause/resume commissioned acquisition for fault/recovery checks while switch security remains active. Stage06 `ZERO` collects64 actual ADC samples and prints a proposed sensor-side zero coefficient; it does not automatically approve calibration or set `ACS_CALIBRATED`. Verify zero current independently before that command.

6. Repeat with each target below. Each folder has a README with modules, wiring gate, expected observations, exact invocation and cleanup. Test 10 and 11 use the exact production engine, not a second production firmware.

| Stage | Target / source | Gate |
|---|---|---|
| 00 | `tests/00_esp32_boot_and_status_led` | USB + GPIO19 LED/330 Ω only |
| 01 | `tests/01_i2c_mpu6050` | Verified 3.3 V-compatible GY-521, I2C21/22 |
| 02 | `tests/02_tamper_switches` | COM GND, NO25/26, NC unused |
| 03 | `tests/03_mosfet_logic_led_first` | HW-548/12 V disconnected; GPIO27 meter/LED test |
| 04 | `tests/04_12v_alarm_fused` | Confirmed polarity + protection; `ENABLE_ALARM` and `ALARM_POLARITY_VERIFIED` |
| 05 | `tests/05_ads1115` | ADS VDD=3.3 V, shared I2C, safe A0 reference |
| 06 | `tests/06_acs758` | Conditioned GPIO34, `ENABLE_ACS`; calibrated coefficients before usable amperes |
| 07 | `tests/07_gps_neo6m` | Verified TX level to32, `ENABLE_GPS`; RX-only software UART9600 |
| 08a | `tests/08a_a7670e_usb_at/usb_at.py` | Actual carrier USB AT port/power; no ESP connection |
| 08b | `tests/08b_a7670e_esp_uart` | UART translator verified, RX13/TX14, `ENABLE_LTE` |
| 09a | `tests/09a_pzem_usb_modbus/pzem_usb.py` | Manufacturer shunt map, isolated low-power bench, USB-RS485 |
| 09b | `tests/09b_pzem_esp32_max3485` | 3.3 V MAX3485, RX16/TX17/DIR23, `ENABLE_PZEM` |
| 10 | `tests/10_wifi_authenticated_ingest` | Device provisioned in CPE Lab; actual PC LAN IP |
| 11 | `tests/11_combined_all_sensors_soak` | All individual stages; concurrent real measurements |
| Final | target `integrated`, `solair_cpe.ino` | Enable only commissioned modules in private config |
| Coverage | target `compile_all_only` | **Never upload**; forces input drivers on for compile coverage |

Final build/upload uses `-Target integrated` in the commands above. Binaries are under `firmware/solair-cpe/.pio/build/<target>`; never share a binary containing credentials. The upload wrapper rejects `compile_all_only`.

PlatformIO is the compiled CLI path on this device. Arduino IDE users: use the clean folders in [arduino-ide](arduino-ide/README.md), which remove duplicate PlatformIO wrappers and localize shared headers. Select ESP32 Dev Module and your observed COM3 port. The IDE packaging was checked; actual Arduino IDE Verify/Upload remains unexecuted here.

## Local app and genuine ingestion

```powershell
Set-Location 'C:\Users\Admin\Videos\SolAir\next-platform\solair-platform'
npm.cmd ci
ipconfig
$env:SOLAIR_INGEST_HOST = '<actual-private-PC-IPv4>'
npm.cmd run dev
```

Browser `http://127.0.0.1:3000`; app/API remain loopback. Optional LAN listener exposes **only** `POST http://<actual-PC-IPv4>:3002/api/ingest`, never the login/dashboard. Same backend/auth/device tables serve both. Local SQLite is `data/solair.db`; migrations initialize on startup. Preserve existing DB; new table migration is additive. Development accounts are documented in the existing app README, not device tokens. Hosted Supabase/Postgres uses the same schema/API; no cloud credentials are invented.

Sign in as engineer, select Real hardware mode, CPE Lab, then provision/rotate the selected device credential only when needed. Rotation revokes its old token. Copy it privately to `DEVICE_TOKEN`, match the exact selected `DEVICE_ID`, set Wi-Fi and `INGEST_URL`. Private local HTTP requires `ALLOW_PRIVATE_BENCH_HTTP=true`; it deliberately exposes a bearer token on the isolated bench LAN. Scope firewall TCP3002 to the Private bench network/device. Production Wi-Fi uses HTTPS plus `ROOT_CA`; certificate verification is never bypassed.

LTE diagnostics implement AT/SIM/CSQ/registration/attachment. A separate opt-in A76XX HTTP fallback exists only for an isolated reachable private-LAN endpoint with `LTE_HTTP_BENCH_COMMISSIONED`; public cellular networks generally cannot reach a private PC IP. A routable private APN/VPN endpoint and genuine POST acceptance must be proven first. **Production modem HTTPS/CA provisioning is not commissioned**; it remains disabled, not replaced with insecure public HTTP. AT/OK is never cellular-online evidence.

## Validation and physical evidence

See [acceptance](../docs/COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md) and [results](../docs/CPE_VALIDATION.md). Compilation is not upload, physical measurement, UART soak success or reset-safe siren proof.

Current bench clarification: see [team measurements and remaining gates](../docs/CPE_HARDWARE_CLARIFICATION_2026-10-11.md). Keep GPIO27 active-HIGH; reset-safe OFF remains pending. PZEM range must read back50 A before readings become valid; stage09a documents the optional, separately gated laptop setup command.


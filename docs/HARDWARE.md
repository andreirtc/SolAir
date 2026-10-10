# ESP32 connection and physical acceptance

## USB bench: first connection

1. Keep the 12 V siren and traction-battery sensing disconnected. Confirm common ground and board supply/logic levels before connecting any module. Proposed pins are not a wiring certification.
2. ESP32-WROOM-32D: MPU6050 SDA21/SCL22. KW11 switches: COM to GND, NO to GPIO25 and GPIO26, INPUT_PULLUP. Pressed LOW is provisionally secure; released HIGH is tampered. Bench LED uses GPIO2. GPIO27 is reserved for HW-548 and defaults inactive under the configured polarity.
3. Install PlatformIO. In `firmware/esp32-solair/src`, copy `config.example.h` to ignored `solair_config.h`. USB works with empty Wi-Fi fields. Do not commit device credentials.
4. Build/upload: `pio run -d firmware/esp32-solair`; `pio run -d firmware/esp32-solair -t upload --upload-port COMx`. Use the actual COM port. Flashing resets the board and replaces its current firmware; review wiring before upload.
5. Start SOLAIR; sign in as engineer/admin. Select **Real hardware bench**, select the assigned vehicle and open **CPE Lab**.
6. Close PlatformIO/Arduino serial monitors. Click **Connect ESP32**, choose the CP2102 port, baud 115200. Chrome/Edge desktop on localhost or HTTPS is required. Android Web Serial availability is not assumed.
7. Check reported device ID, firmware, uptime and heartbeat. Frames for an unknown/unassigned device are rejected. Provision the selected device once if it has no device registration. USB ingest authenticates the engineer session, not a public server key.
8. Keep MPU6050 still during startup. Click **Calibrate baseline** after stable positioning. **Arm bench**. Move the board or release a microswitch. Observe acceleration, switch raw/debounced state, event and low-voltage LED independently of the UI.
9. **Clear bench alarm** or **Disarm bench**. Disconnect the cable: the UI must show disconnection and retain only last reported server readings.
10. Select the guided test, enter actual measurements, result, notes and photo/report reference; save and export. No test is automatically PASS. Demo-mode records remain labeled simulated.

### Windows project tooling used for build verification

The isolated `.tools/pio` environment is development tooling, ignored by Git. If present:

```powershell
$env:PLATFORMIO_CORE_DIR = "$PWD\.tools\platformio"
.tools\pio\Scripts\python.exe -m platformio run --project-dir firmware\esp32-solair
```

## Wi-Fi to central backend

1. Deploy the same application with PostgreSQL and HTTPS using DEPLOYMENT.md. LAN HTTP is not a substitute for a secure fleet endpoint.
2. Engineer/admin chooses the vehicle, then **Provision / rotate device credential**. Copy the one-time narrow device token to `solair_config.h`; rotation revokes the previous token. Tokens are stored hashed server-side.
3. Set `DEVICE_ID`, Wi-Fi SSID/password, `INGEST_URL=https://your-domain/api/ingest`, `DEVICE_TOKEN`, and the endpoint's trusted root CA PEM in `ROOT_CA`. TLS verification is mandatory; the firmware never calls `setInsecure`.
4. Build and flash. Firmware synchronizes UTC via NTP when available; until then timestamps are null and backend receipt is explicitly the timestamp fallback.
5. Check History for matching boot ID and sequence. Operator/driver use the same central API/database and SSE updates. Validate from a phone on a separate network only after real deployment.
6. Disconnect Wi-Fi while armed. Network upload runs on a separate FreeRTOS task so HTTP/TLS retry does not block the local detection loop. Observe local alarm/LED.
7. Restore Wi-Fi. Check queued event IDs and deduplication. FIFO capacity is 40 frames; overflow reports `event_buffer: fault`. Persistent storage is saved on event enqueue and acknowledgments. Routine heartbeat frames since the last saved snapshot may be lost at power failure. This is bounded retention, not an unlimited recorder. Do not claim loss-free behavior without testing.

## ADC/current/high voltage

ADS1115 is a low-voltage ADC. Its gain range does not permit inputs beyond physical supply rails. Never connect the 55–65 V traction pack directly. The final high-voltage transducer/divider is unspecified and pack voltage/current stays null in default firmware.

ACS758 supply/output and conditioning must be physically verified. A 5 V sensor output can exceed a 3.3 V ADC's safe input. `ENABLE_ACS` is false by default. Record a measured zero-current offset and transfer function with a reference instrument before setting calibration flags. This ADC channel is not assumed to be battery or controller current. No invented pack readings are emitted.

Two 200 W panels and MPT-7210A are reference installation plans. Actual charging limits, controller output and high-voltage sensing must be verified before integration. Software never controls charging or traction contactors.

## GPS and LTE

GPS is disabled until supply/logic/wiring is verified. Proposed RX32/TX33 at 9600 baud; actual GPS fixes require valid location and age below 30 seconds. NMEA reception alone is not a fix.

A7670E proposed UART RX16/TX17 is a modular AT diagnostic probe, disabled by default. Validate carrier-board supply, peak current and UART level shifting first. AT/OK indicates modem detection only. SIM state, network registration, PDP setup and HTTPS delivery over LTE are **not implemented or verified**. The schema accepts future authenticated `lte` transport; the initial firmware's working network transport is Wi-Fi.

## HW-548 and powered siren

The signal polarity, 3.3 V compatibility and startup behavior are unverified. Keep the powered siren physically disconnected until documented testing. GPIO inactive is not proof of load inactivity. Use an appropriately wired low-voltage LED/test load first. Verify terminal identities, startup output, trigger voltage, control polarity and load current with instruments.

Only after physical verification may an engineer set both `SIREN_PHYSICALLY_VERIFIED` and `ENABLE_POWERED_SIREN`, and correct `ALARM_ACTIVE_HIGH` in `solair_config.h`. No browser control bypasses this interlock. Reported `alarm_active` is the software command/state; physical sound/output must be separately observed and recorded.

## Chapter 4 test checklist

Each guided test records engineer, device, firmware, timestamps, mode, PASS/FAIL/BLOCKED/NOT TESTED, measured values, notes and evidence reference. Attach source photographs in the research evidence repository and reference their filenames; this application stores references rather than claiming photographic verification.

Test ESP32 disconnect, MPU I²C/axis response, both switch transitions/debounce, local LED alarm offline, known safe ADC voltages, ACS zero and reference currents, GPS no-fix/fix/disconnect, LTE AT detection separately from network operation, HW-548 electrical triggering, safe siren behavior, end-to-end Wi-Fi, retry/deduplication and queue overflow. Export actual telemetry and physical records only from REAL HARDWARE mode. Software integration tests are not physical tests.

# MPU6050 diagnostic preparation — 2026-10-09

Separate compile-only milestone. Wiring, physical board identity, USB detection,
upload, sensor execution and actual diagnostic samples remain UNVERIFIED.
No Wi-Fi, MQTT, siren, brake, dashboard ingestion or tamper classifier is added.
Existing serial-test, PWA, databases and running services are preserved.

## Required hardware inputs (all UNCONFIRMED)

Hardware lead supplies exact ESP32 DevKit identity/revision and actual GY-521
vendor/revision, chip marking, schematic or equivalent verified electrical evidence;
approved SDA/SCL **GPIO numbers** and their header locations; approved supply pin
and voltage; common-ground connection; pull-up values and rail, any level shifting,
and ESP32 logic compatibility; AD0 level and resulting seven-bit address; module
axis orientation/mounting. Record approver, date and evidence reference.
Do not infer a regulator, 5 V tolerance, pull-up rail or pin layout from “GY-521”.
The Adafruit breakout schematic is not evidence for this unidentified board.

TDK's chip specification gives VDD 2.375–3.46 V and VLOGIC 1.71 V to VDD;
these are IC requirements, not an approved breakout supply. MPU6050 uses I2C;
AD0 selects 0x68 or 0x69. Diagnostic speed is 100 kHz (software choice).
The hardware lead must verify the actual board supply and logic compatibility
before connecting/powering it. No approved wiring diagram is available here.

In `mpu6050-diagnostic/diagnostic-config.h`, deliberately fill `SDA_GPIO`,
`SCL_GPIO` and `SENSOR_ADDRESS`, then set `WIRING_CONFIRMED=true` only after
hardware approval. Current values are unset (-1), confirmation false. The sketch
prints BLOCKED and never calls Wire.begin in this state. GPIO validity checks
cannot detect flash/boot/board conflicts and do not approve wiring. No default
ESP32 I2C pin assignment is used to authorize a connection.

## Library and implementation

Selected vendor-maintained Arduino Library Manager library: **Adafruit MPU6050
2.2.9** (architectures=*), tested for compilation against existing ESP32 core
2.0.17 and CLI 1.4.1. All profile dependencies are pinned:

| Library | Version | Reason |
| --- | --- | --- |
| Adafruit MPU6050 | 2.2.9 | Sensor detection/base driver and register/range constants |
| Adafruit BusIO | 1.17.4 | Driver I2C/register dependency |
| Adafruit Unified Sensor | 1.1.15 | Driver sensor type dependency |
| Adafruit GFX Library | 1.12.6 | Declared MPU6050 package dependency |
| Adafruit SSD1306 | 2.5.17 | Declared MPU6050 package dependency |

The display packages are upstream manifest dependencies, not new display behavior.
No display object is created. Wire, Arduino, gpio and esp_timer are supplied by the
pinned ESP32 platform; existing core/toolchain versions are retained.

Source review found `_read()` ignores its transfer result and reset polling is
unbounded. This diagnostic therefore runs library `begin()` for detection and
initialization in a dedicated FreeRTOS task with a 2.5 s deadline. Timeout deletes
that task, prints an explicit error, and prohibits all further I2C until restart
(Wire resources may be left locked by termination during a transfer). Successful
initialization is followed by checked configuration writes and readback. Each
sample checks identity/configuration, then performs
a checked complete 14-byte Wire burst. Each I2C transfer has a 50 ms timeout.
It does not call upstream getEvent. Upstream reset runs only inside the deadline
task; library source is not patched or subclassed. Errors print their stage and
UNAVAILABLE; no zero substitute, stale
sample replay or automatic recovery. Resolve fault and restart to reinitialize.

WHO_AM_I must read 0x68 (including at bus address 0x69). This is a compatibility
check, not proof of genuine silicon, device authentication or calibration.
Configuration: +/-2 g, +/-250 degrees/s, DLPF 21 Hz, divisor 0. Signed sensor
counts convert using 16384 LSB/g, 131 LSB/(degree/s), standard gravity 9.80665
m/s^2 and pi/180. Output is XYZ acceleration **m/s^2** and angular velocity
**rad/s**, with gravity included, in chip axes. “RAW_DIAGNOSTIC” means uncalibrated
sensor diagnostics expressed in units, not raw integer ADC counts or tamper labels.
500 ms printing is a diagnostic polling interval, not PWA freshness or guaranteed
sensor acquisition timing. Six printed decimals do not establish accuracy.

## Compile only

```powershell
Set-Location 'C:\Users\Anyang\SolAir\firmware'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-mpu6050.ps1
```

Profile `mpu6050_diagnostic` uses the existing generic classic ESP32 FQBN with
4 MB flash. This fits the reported board but does not identify it physically.
Downloads use existing Git-ignored `.arduino/`; output uses
`build/mpu6050-diagnostic/`, separate from the existing serial-test artifacts.
First compile downloads pinned libraries. No upload/monitor is part of this script.
See `MPU6050-BUILD-RESULT.md` for actual build evidence. Compile success only
checks source/toolchain compatibility. It does not verify sensor operation.

## Planned physical checks — none completed

- [ ] Hardware lead records wiring, supply/logic/pull-up compatibility, AD0/address,
  GPIO/header mapping and axis orientation approval. Disconnect power before wiring
  or changing connections. Keep actuators unrelated to this diagnostic disconnected.
- [ ] Independently verify USB/board identity; deliberately configure and rebuild.
  A later manual upload requires authorization to replace the board application.
  Use the actual detected port and 115200 baud; no guessed COM port.
- [ ] Capture startup detection address, WHO_AM_I and READY or error. Missing/wrong
  identity must prevent samples. Do not treat an I2C ACK alone as MPU6050 identity.
- [ ] Record stationary readings in known orientations. Gravity should contribute
  roughly one g across acceleration axes; angular velocity should be near rest
  with possible bias/noise. Rotate/tilt slowly and check axes/signs against mounting.
  Do not use all-zero stationary acceleration as the expected result.
- [ ] With power removed, prepare a missing-sensor startup test; then power safely
  and capture failure/no samples. For read failure after READY, use a hardware-lead
  approved safe fault-injection method (no improvised live shorts or hot rewiring).
  Confirm an error, UNAVAILABLE, no fabricated values, and restart-only recovery.
- [ ] Capture an **actual** serial sample and surrounding startup/error lines with
  board/module identity, configuration, firmware/library versions, test operator,
  date, orientation and conditions. Store it as separate evidence later; no fabricated
  sample is provided by this milestone. Record failures as well as successes.

These are detection and basic response checks. They do not establish calibration,
tamper thresholds, false-positive/negative rates or tamper-detection accuracy.
Any classifier needs a separate agreed protocol, labeled evidence and validation.

## Proposed diagnostic mapping — documentation only, awaiting agreement

Reviewed figma-app `telemetryContract.ts`, contract, field mapping, firmware handoff,
storage code and README. Existing PROPOSED v1 has **no acceleration or rotation
fields**. Unknown extra keys are stripped; storage persists the canonical message.
Motion must not be stuffed into securityState/speed or sent as unrecognized v1 keys.
The existing handoff's older no-authentication scope text is historical: current
PWA has local operator authentication. This diagnostic adds no transport/auth changes.

Propose a separately versioned diagnostic record, NOT an implemented v1 message:

| Proposed field | Meaning / units / availability |
| --- | --- |
| diagnosticSchemaVersion | Separate proposed diagnostic version 1; not telemetry schemaVersion |
| accelerationMps2: {x,y,z} | Finite signed m/s^2, includes gravity; entire vector null on failed read |
| angularVelocityRadPerSec: {x,y,z} | Finite signed rad/s; not orientation angle; entire vector null on failed read |
| readStartUptimeMs / readEndUptimeMs | 64-bit monotonic boot-relative transfer window; current printed start/end fields; not UTC or exact internal sample time |
| sampledAtUtc | null now: no synchronized sender clock. Future sampling definition/time source must be agreed; never replace with receiver time |
| receivedAtUtc | Future capture/receiver-assigned receipt time, separate from sender clock; not printed by firmware and not current backend acceptance |
| sequence | Current successful-read ordinal, first 1; reset on reboot, no increment on failed read |
| deviceId / sessionId | Future provisioned device and unique boot identity, currently unavailable; uptime does not supply either |
| source / sensorModel / firmwareVersion | Future explicit physical diagnostic origin + verified model + firmware revision; MPU6050 is only reported/identity-compatible until physical review |
| status / faultCode | Future explicit valid/blocked/init-error/read-error state; invalid vectors null, not zero; current serial error lines separate from samples |
| configuration / calibrationRef / axisFrame | Approved pin/address/config revision, range/filter, mounting/axis frame and calibration evidence; calibration reference null until established |

Future evidence records must preserve operator/capture provenance and distinguish
real captures from examples/simulation. Origin metadata does not authenticate a
device. Nothing is currently ingested, exported or stored in the PWA. Future schema,
validation, storage migration, UI, clock and transport decisions need separate
agreement. Motion alone does not confirm tampering and must not set TRIGGERED.

## Official sources inspected

- [TDK/InvenSense product specification rev 3.4](https://product.tdk.cn/system/files/dam/doc/product/sensor/mortion-inertial/imu/data_sheet/mpu-6000-datasheet1.pdf), sections 6, 9–11: IC electrical limits, sensitivity, interface and chip axes; not GY-521 board approval.
- [Pinned Adafruit MPU6050 manifest](https://github.com/adafruit/Adafruit_MPU6050/blob/2.2.9/library.properties) and [driver source](https://github.com/adafruit/Adafruit_MPU6050/blob/2.2.9/Adafruit_MPU6050.cpp): dependency declarations, identity, init/reset and read failure limitations.
- [Adafruit API documentation](https://adafruit.github.io/Adafruit_MPU6050/html/class_adafruit___m_p_u6050.html) and [official example](https://github.com/adafruit/Adafruit_MPU6050/blob/2.2.9/examples/basic_readings/basic_readings.ino): usage and SI units; example wiring is not approval for the reported module.
- Official dependency manifests: [BusIO](https://github.com/adafruit/Adafruit_BusIO/blob/1.17.4/library.properties), [Unified Sensor](https://github.com/adafruit/Adafruit_Sensor/blob/1.1.15/library.properties), [GFX](https://github.com/adafruit/Adafruit-GFX-Library/blob/1.12.6/library.properties), [SSD1306](https://github.com/adafruit/Adafruit_SSD1306/blob/2.5.17/library.properties).

# SOLAIR CPE 2.0.19 — team and frontend integration contract

23 October 2026. Candidate software, not physical acceptance. The authoritative application remains `next-platform/solair-platform`; preserve the existing frontend, device credentials, GPIOs and historical evidence. Last user-confirmed physical upload is 2.0.17. The user now confirms the 48 V / 13S pack has its BMS installed.

Team workbench: https://solair-cpe-workbench-oct22-rtc.sandygull6.chatgpt.site/team-handoff.html . It contains numbered work, four engineering illustrations, exact endpoints, expected/failure values, finite stopping points and a local evidence checklist. It is an instructions site, not the live telemetry backend. Browser-local progress must be exported/imported for another teammate.

## Three-state security contract

`security_state`: `DISARMED | ARMED | TRIGGERED`. Firmware boots DISARMED. ARM requires at least 10 seconds uptime, enabled switches, both contacts secure, no real/manual latch. Real lid/mount or validated persistent motion transitions ARMED to TRIGGERED; the siren stops after its configured bound (current 5000 ms), while TRIGGERED remains latched. DISARM clears state/output/reason. A manual siren test disarms first and remains DISARMED. Explicit state is checked against legacy `armed`, `alarm_active` and `cpe.alarm.reason`; older frames remain compatible.

Controls are local USB; remote driver ARM/DISARM, push/SMS and cellular LBS fallback are not implemented. Controlled DP1 contact/FSM presentation can proceed while mounted motion thresholds are being qualified. This is sequencing, not final motion/ACS acceptance.

## Independent electrical channels

| Canonical field | Source | Required device declarations and live sample |
| --- | --- | --- |
| `battery_voltage_v` | PZEM voltage at the verified shared battery bus | Actual `PZEM_SOURCE="mppt_output"`, voltage validated, battery-bus mapping verified, fresh healthy meter |
| `battery_current_a` | ACS net protected-pack return | Calibrated zero/sensitivity and independently measured signed range, net-battery placement verified, fresh usable ACS sample |
| `solar_output_voltage_v`, `solar_output_current_a` | PZEM MPPT charging-output branch | Actual MPPT placement, voltage/current reference validation, healthy meter |
| `solar_voltage_v`, `solar_current_a` | PV input | Not provided by this CPE wiring; remain null |
| Wind fields | No wind hardware commissioned | Remain null/unavailable |

`cpe.measurements` reports runtime per-channel validity booleans: `battery_voltage_validated`, `battery_current_validated`, `solar_output_validated`. False means canonical values are null. Global `calibration_status="calibrated"` means at least one canonical electrical channel qualifies; it never certifies every sensor. Preserve independent channel statuses and source/freshness labels in the frontend. Bench-source values cannot become battery/solar values by enabling flags.

Private configuration defaults: `PZEM_VOLTAGE_VALIDATED`, `PZEM_SOLAR_CURRENT_VALIDATED`, `PZEM_BATTERY_BUS_VERIFIED`, `ACS_NET_BATTERY_VERIFIED`, `ACS_CALIBRATED` false; scale factors 1.0; `ACS_VALIDATED_MIN_A/MAX_A` zero/zero (no qualified range). Do not enable these from fixtures. Calibration compile guard requires ordered measured bounds within the sensor's ±50 A envelope. Outside the declared interval, current is null/fault; the measured range is not the sensor's nameplate range.

New optional ACS metadata: `current_diagnostic` is `not_calibrated`, `ok` or `invalid_sample_or_outside_validated_range`; `validated_min_a/max_a` nullable. The backend checks declared bounds/current/quality consistency. Fresh verified ADS1115 A1 acquisition remains mandatory; no guessed offset, loaded auto-tare or deadband was introduced. Existing `cpe.pzem` values remain raw meter evidence; canonical calibrated V/A can apply independently validated scale factors. Retain scale factors in the accepted calibration record.

Solar energy integration uses validated MPPT-output V×I for these frames; legacy PV/wind handling remains available for older sources. This is charging-output energy, not PV-input energy, battery SOC or net stored battery energy. Battery current and solar current need not match because CPE loads consume power. `LOAD_MODE` remains the existing enum: `bench_resistor`, `vehicle_charging`, `none`, `unknown`.

## Concurrent motion records

Optional `cpe.motion` contains enable/calibration flags, acceleration deviation threshold (m/s²), gyro threshold (rad/s), 200 ms hold, window sample count, peak values and `longest_above_threshold_ms`. The top-level gyroscope vector retains degrees/second; the motion summary gyro value explicitly uses radians/second. Peak/sample windows reset for live snapshots, not replay events. Summaries are not a raw waveform or intent classifier. Capture mounted normal/deliberate cases with LTE and all sensors active; keep alarms disarmed during characterization, then qualify both OR branches and persistence before enabling flags.

## Existing APIs and persistence

- Device-authenticated `POST /api/ingest` validates versioned frames and preserves idempotent transport/storage behavior. Software tests use synthetic fixtures, never research measurements.
- Authorized `GET /api/fleet` plus scoped `/api/events` SSE serve assigned vehicles and invalidate live views. GPS map gates reject stale/high-HDOP/insufficient-satellite positions, preserving labelled last-known markers.
- Authorized `GET /api/cpe-export/:vehicleId` exports up to 5000 samples including `quality_json` (the full CPE metadata). Export genuine records in hardware mode. Historical events are not live measurement samples.
- Engineer/admin `POST /api/calibrations` accepts `device_id`, `sensor`, `values_json` and `evidence`; it records evidence, not remote firmware application. Retain raw references, uncertainty, measured range, zero/sensitivity/scales, polarity and power-cycle results. Apply accepted private constants explicitly and upload once.
- Existing organization/vehicle authorization and real/demo separation remain mandatory. Public workbench deployment does not deploy the live application, expose its database or provide device control.

Permanent remote-driver operation still requires deployment of this same application with the existing Railway/Supabase instructions, private production configuration and a real separate-network phone test. The temporary device-only tunnel does not expose a remote browser application. Frontend visual overhaul belongs to the other team; retain these functional contracts.

## Evidence and release

Software verification: 84 backend tests; 26 CPE/LTE tests with PostgreSQL-compatible PGlite; TypeScript check; host C++ policy/decoder checks; Next production build; Arduino ESP32 core3.3.12 compile (1,226,008 bytes flash, 53,152 bytes RAM). Browser fixtures verify LTE controls, map freshness/recovery and the static guide. No ESP32 upload, physical current calibration, new source wiring, mounted motion threshold PASS or all-module acceptance is inferred.

Final CPE still requires accepted ADS/ACS measurement stability/zero/reference/range, PZEM physical shunt/reference/energy, protected battery/converter power and electrical/USB/isolation/connector facts, mounted motion/contact behavior and combined/recovery evidence. The available 54.6 V / 8 A charger still needs exact-pack approval; previous builder authorization was 5 A. A BMS rating is not that approval.

The owner will finalize the schematic on returning. Give them raw evidence and exact interfaces/holds. Release the full schematic and matching header/perfboard view as one revision only after owner review; concept SVGs are not a released assembly design. Do not commission partial paid assembly or rewrite historical observations into success.

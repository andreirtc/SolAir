# Complete CPE bench and app acceptance

11 October 2026 · **All new physical results start NOT TESTED.** The directive reports prior working tamper/siren components; preserve those reports separately from observed tests on the combined firmware. One final app/device identity: premium `solair-platform`, selected vehicle/device from CPE Lab. No replacement website.

Read [wiring/power](CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md), [exact build/upload/startup](../firmware/README.md), [audit](CPE_IMPLEMENTATION_AUDIT.md) and [software validation](CPE_VALIDATION.md).

Latest evidence: [hardware clarification](CPE_HARDWARE_CLARIFICATION_2026-10-11.md). Current scope is the 12 V home bench; BEMAC battery, PV and MPPT are disconnected. GPIO27 active-HIGH is team-measured; reset/power-up safe-OFF remains pending.

## A — inspect and preserve

- [ ] Photograph every actual board, connector, shunt and power branch. Retain existing ESP sketch/config and wiring photos. Stop owned app writers with Ctrl+C; privately back up existing `data/solair.db` and remaining WAL/SHM together while writers stay stopped. No account/database reset.
- [ ] Record actual CP2102 port, firmware/pin map and tool versions. Inspect unpowered GPIO labels, COM/NO continuity, rails and polarity.
- [ ] Measure and approve3.3V/5V/12V supplies, buck output, modem supply/translator, analog full-range conditioning, HW-548 active level/reset-safe bias and PZEM/shunt/isolation diagram. Existing2A fuse is team-reported; reconfirm branch/current/wiring ratings. No traction battery/PV array attached.

## B — run individual diagnostics

Every stage has an uploadable target or a laptop script, a README, expected observations and cleanup under `firmware/solair-cpe/tests/`. Compile first, then upload to the **observed** port. Human-readable diagnostics00–09 are not telemetry fixtures and are not ingested as device data.

- [ ] 00: USB boot/uptime and independent LED19/330Ω, no reset loop.
- [ ] 01: shared I2C scan, correct MPU address, real raw/scaled XYZ; compare stillness/gravity and deliberate rotation.
- [ ] 02: each switch raw/debounced50ms, pressed secureLOW/releasedHIGH, mounting convention recorded.
- [ ] 03: HW/siren disconnected, meter or LED/resistor on27; explicit ON/OFF, requested five-second cutoff, resetOFF.
- [ ] 04: only after control/protection gate, protected test load then actual fused siren. Measure ON/OFF polarity, current, cutoff, OFF command, boot/reset/GPIO disconnected/USB loss. Record sound/load separately from GPIO command.
- [ ] 05: ADS0x48, A0GND then measured3.3V, raw/scaled comparison; no input beyondVDD.
- [ ] 06: ACS supply/conditioning, actual zero and independently measured low-current load. Apply measured scale/zero/sensitivity before `ACS_CALIBRATED`; disconnected/overrange faults.
- [ ] 07: GPS raw checksummed NMEA outdoors; genuine coordinates/UTC/sats/HDOP/fix age; unplug invalidation.
- [ ] 08a: documented modem USB AT/model/SIM/CSQ/CEREG/CGATT/COPS. No secret output.
- [ ] 08b: only after carrier voltage/connector review, UART13/14 registration/attachment; AT response alone does not pass cellular transport.
- [ ] 09a: laptopUSB-RS485, serial5V, exact50A shunt configuration and isolated resistor circuit; real Modbus V/A/W/Wh and reference instrument.
- [ ] 09b: MAX3485 at3.3V,16/17/23, read-only9600 8N2; compare laptop readings, timeout/CRC behavior.
- [ ] 10: real Wi-Fi authenticated backend acceptance; correct device ID/token, no fake success.

## C — final local security and alarm

- [ ] Upload target `integrated` with only electrically approved flags enabled. Unknown modules remain explicitly unavailable/fault. Never upload `compile_all_only`.
- [ ] Boot DISARMED; approved siren output and LEDOFF. Attempt ARM before10seconds and with either contact insecure: rejected. Wait≥10seconds, secure both, USB uppercase `ARM` newline115200: accepted.
- [ ] Release lid>50ms: local event/LED/approved siren and matching stored dashboard event. Record measured cutoff; TRIGGERED latch stays until `DISARM`. Repeat for mount, then DISARM during output. Disarmed contact changes must not trigger.
- [ ] Motion: measure mounted baseline/noise and thresholds, record coefficients/evidence before `ENABLE_MOTION` + `MOTION_CALIBRATED`. Real held motion>200ms triggers under agreed settings. No assertion of theft-classifier accuracy.
- [ ] Disconnect Wi-Fi without a trigger: no new alarm. Trigger locally while offline: approved alarm remains functional; restore link and match original event identity.

## D — same backend/database and all roles

- [ ] Initialize/run existing app per firmware README; SQLite `data/solair.db`, additive migration003. No cloud credentials needed for local development. Hosted PostgreSQL uses same API/tables; Supabase/Railway live behavior remains separate acceptance.
- [ ] `SOLAIR_INGEST_HOST` is actual privatePC IPv4; device-only3002 `/api/ingest`; browser loopback3000. Confirm same private2.4GHz reachable network/firewall scope. ESP never uses127.0.0.1 for the PC.
- [ ] Engineer selects Real hardware, actual vehicle, provisions device credential privately. Flash matching ID/token/URL/CA. No token in screenshots/reports.
- [ ] CPE Lab shows genuine vectors/raw counts, switch states, arm/alarm command, unavailable physical feedback, firmware/boot/uptime, LTE diagnostic state, last accepted payload/source and actual server receipt. USB parse/HTTP errors must be captured, not called accepted.
- [ ] Driver and operator share the same vehicle's accepted data/history/GPS/security; foreign-organization/assignment access is denied. Real SOS/messages use existing persisted workflows, with offline/pending status; no synthetic send success.
- [ ] Download authenticated CPE CSV (up to5,000 rows) and existing full-payload JSON; compare identity/timestamps/PZEM/load mode with database and serial evidence. For larger histories use existing paginated history API and retain raw DB backup; export caps are explicit.

## E — real sensor channels

- [ ] ADS/reference and ACS/calibration values agree within recorded instrument tolerance; no amperes shown as valid while uncalibrated.
- [ ] Solar/CPE screen shows PZEM V/A/W/cumulativeWh, quality, source and `bench_resistor`. Use `bench_supply` for adapter tests and `mppt_output` only on the actual controller output; bench values never populate battery charging or PV-input fields by assumption. Wind remains unavailable without a validated controller.
- [ ] GPS fresh valid location is genuine; invalid/disconnected state preserves only timestamped last-known history. Check fix age and receipt age independently.
- [ ] LTE registration/attachment/CSQ accurate; disconnect causes timeout/fault. Test actual packet POST separately from AT. Private HTTP fallback requires a reachable private APN/VPN endpoint and commissioning; normal cellular cannot reach the laptop's LAN IP. Modem productionHTTPS remains blocked on documented carrier CA setup; no TLS bypass/publicHTTP substitute.
- [ ] PZEM actual resistor load V/A/W/Wh matches instruments; meter energy reset/history meaning documented. All sensor disconnects cause fault/unavailable and null invalid measurements, never artificial zero/live.

## F — combined soak

- [ ] Upload11 or final integrated, all SAFE modules enabled simultaneously. Recommended minimum60-minute bench run; record actual duration instead of checking a box from a compile.
- [ ] Verify UART0USB logging, UART1RS485, UART2LTE and softwareUARTGPS32 operate concurrently during Wi-Fi retransmits/Modbus timeout/LTE registration. Record GPS checksums/overflow, serial data loss, poll rate, free-memory/reset symptoms and watchdog behavior.
- [ ] Trigger each contact and approved motion while network/LTE/PZEM are busy; video measured alarm onset/cutoff/DISARM latency. No long modem/cloud waits in security loop; physical timing still needs measurement.
- [ ] Record explicit hardware gates blocking cellular transfer/concurrency. No real combined PASS until actual run evidence exists.

## G — recovery

- [ ] Backend restart/browser reload: records, original receipts and device identity persist; historical events do not make device live.
- [ ] ESP reset: DISARMED/new boot and safe output; important NVS-buffered events retry with original identity. Exact duplicates count once; conflicting same-identity payload rejects409 and is not falsely acknowledged by firmware.
- [ ] Network interruption, buffered delivery, lost acknowledgement, bounded queue pressure and power interruption tested. Persistent event FIFO max6 plus one latest volatile snapshot and local event queue16; overflow/persistence failure is reported, not loss-free storage. Each flash event is stored separately to stay within NVS string limits. Do not erase NVS to make a test appear passed. Test fixtures never enter working research storage.

## H — evidence and verdict

Create a dated private evidence folder. Save wiring/power photos, tester/date, build/config without secrets, serial logs, multimeter values/reference, siren timing/current video, app screenshots and realCSV/JSON with matching device/boot/sequence/event/time. Name failures and limitations. Preserve original evidence rather than editing it into success.

| Module | Hardware observed? | Firmware compiled? | Physical measurement? | End-to-end dashboard? | Pass/fail/blocker | Evidence path |
|---|---|---|---|---|---|---|
| ESP / USB / LED19 | Team-reported prior; combined pending | See validation | NOT TESTED here | NOT TESTED | pending | |
| IMU: MPU6050 / MPU6500-compatible | Team reports WHO_AM_I=0x70 at address0x68; old driver rejected it | See validation | Compatible driver physical test pending | NOT TESTED | Re-upload updated Test01; gravity/tilt/rotation checks, then enable profile in final config | |
| Lid / mount | Team-reported prior | See validation | NOT TESTED here | NOT TESTED | pending | |
| HW-548 / siren /2A branch /buck | Team-reported prior | See validation | NOT TESTED here | NOT TESTED | active-HIGH measured by team; reset/protection evidence pending | |
| ADS1115 | pending | See validation | NOT TESTED | NOT TESTED | supply/calibration | |
| ACS758 | pending | See validation | NOT TESTED | NOT TESTED | conditioning/offset/sensitivity | |
| NEO-6M | pending | See validation | NOT TESTED | NOT TESTED | outdoor fix/UART soak | |
| A7670E | pending | See validation | NOT TESTED | NOT TESTED | carrier/power/levels/packetTLS | |
| PZEM /50A shunt /MAX3485 | pending | See validation | NOT TESTED | NOT TESTED | exact diagram/isolation/shunt config | |
| Combined Wi-Fi/backend | pending | See validation | NOT TESTED | software fixtures only | real device test | |
| Wind | controller unavailable | unavailable state compiled | unavailable | unavailable | controller required | |

**CPE FULL BENCH-READY:** all physically available in-scope sensors prove real end-to-end measurements, all required output/supply/UART/recovery gates pass, and any LTE transport scope is explicitly agreed/evidenced. Missing parts/unsafe interfaces cannot be silently excluded to claim full readiness.

**PARTIALLY READY:** physically evidenced core tamper/alarm/backend path works but named ADS/ACS/GPS/LTE/PZEM or combined/resilience checks remain pending.

**BLOCKED:** unsafe wiring/reset/output behavior, broken local tamper policy or no authenticated data path. Current combined physical status is **unverified**, with interfaces gated as documented; software validation alone earns none of these physical PASS labels.

Vehicle path: retain identity/schema, complete low-power bench/combined tests, then separate mechanical/mounting/EMI/supply/isolation/charging/BMS review before installation. Neither bench readiness nor PZEM alarms/fusing authorize direct BEMAC bus-bar charging or academic approval.



## 23 October — team completion handoff and candidate 2.0.19

Latest user instruction: implement the explicit DISARMED/ARMED/TRIGGERED FSM, prepare clear team instructions with enclosure visuals and concurrent motion testing, finish real battery/ACS/PZEM measurements, and leave the final schematic to the owner after returning. User confirms BMS installed. Candidate2.0.19 now implements the FSM, independent source/quality-gated battery/solar publication, validated ACS range guards and concurrent motion-window diagnostics; backend contracts/storage/output-energy integration and functional diagnostic text are updated. Existing private calibration/motion acceptance flags remain off and no coefficients are guessed. Last confirmed physical upload remains2.0.17.

Software PASS:84backend tests,26CPE/LTE tests on PostgreSQL-compatible PGlite, TypeScript, hostC++ policy/decoder tests, isolated production build and exact Arduino core3.3.12 compile(1,226,008flash/53,152RAM). Browser fixtures cover LTE controls/map and the team guide. These are not physical acceptance. Source and secret-free downloads: [integration contract](SOLAIR_CPE_2.0.19_INTEGRATION_CONTRACT.md). Existing account-owned workbench: https://solair-cpe-workbench-oct22-rtc.sandygull6.chatgpt.site/team-handoff.html . Current publication evidence is recorded separately after deployment.

The guide gives12numbered/related sections,4nativeSVG diagrams, all branch endpoints, correct/wrong observations, finite ACS screening/calibration steps, mounted simultaneous motion procedure, DP1 FSM scope, remaining power/measurement/hosting facts and exportable local evidence checklist. Original workbench artwork/cards remain accessible. No new live application/site was created. Progress is browser-local, not a shared cloud PASS record.

ACS must still pass stable input/zero, independent references/useful signed range and power-cycle checks alongside PZEM. DP1 contact demonstration does not waive final current/motion acceptance. Protected battery power, converter/USB/isolation and branch protection facts, actual GPS/LTE/remote-driver and combined recovery remain physical/configuration work. Schematic/perfboard release stays with the owner; no partial paid soldering or release of a draft. Earlier entries below are historical; missing software publication statements describe the prior candidate.

# SOLAIR core capability audit — 23 October2026

Scope: current integrated firmware candidate2.0.18, backend and private prepared
configuration; physical upload last confirmed2.0.17. This is a source review,
not new measurements. The frontend overhaul remains separate.

| Required core function | Present implementation | Outstanding |
| --- | --- | --- |
| Driver views assigned e-trike location remotely | NEO6M/LTE ingestion, GPS history/quality, authorized assigned-driver fleet API and scoped SSE | Public browser-site deployment, field power and actual sustained movement/recovery validation; the bench tunnel exposes ingestion only |
| Lid/mount tamper alarm and events | Existing contacts, armed latch, bounded siren and backend events; prior individual observations retained | Mounted/combined acceptance and field arming workflow |
| Vibration/motion tamper | IMU acquisition and threshold/persistence rule in source | ENABLE_MOTION=false and MOTION_CALIBRATED=false in actual prepared configuration; measured mounted thresholds/normal-vibration rejection; a threshold rule cannot establish malicious intent |
| Remote arm/disarm | USB/local control only, DISARMED boot | Secure driver command/acknowledgement workflow if required for away-from-vehicle use |
| Battery voltage | Contract/database/site fields exist | No battery_voltage_v assignment in integrated firmware; approved actual pack-voltage source and validated publication/mapping |
| Battery current | ACS raw ADS A1 acquisition and gated cpe.acs current path | Measured zero/reference/range calibration; correct final net-battery primary placement; no integrated battery_current_a publication yet |
| Solar V/A/W/Wh | cpe.pzem metering, persistence and display | Currently bench_supply/bench_resistor; actual MPPT placement/commissioning and labelled solar field/energy integration; top-level solar_output fields are not currently assigned |
| Wind | Unavailable/absent state | Hardware/interface excluded for now, per user |
| Backend foundations | Device credentials, strict ingestion, transactional storage, replay handling, user/vehicle authorization, history, scoped live updates | These foundations do not close missing measurement, remote-control or hosting integration |

Do not treat79 passing fixtures/compiled firmware as complete intended-product
acceptance. No guessed current calibration, relabelled bench measurements,
automatic alarm activation or source changes were made in this audit. Preserve
working GPIOs/interfaces and individual physical observations while completing
the explicit gaps above in the same application and circuit architecture.

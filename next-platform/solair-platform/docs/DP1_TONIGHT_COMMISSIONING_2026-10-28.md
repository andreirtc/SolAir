# Tonight: test the assembled prototype

Use the wiring already assembled. No resistor-bank or adapter test in this route. XT60 installation is optional and is not a prerequisite. Keep firmware 2.0.19 for the baseline. The team reports ACS repair completed. Current validation and power-path acceptance remain separate from assembly completion.

**Resume at Step 3: connect the loose inter-box ends with power isolated.** The team reports ACS solder repair and cable fitting completed. Each of the eight inter-box wires still has one loose end under electrical tape. Assembly completion is user-reported; it does not establish current calibration or approval of the modified termination. Keep the original net-battery-current role.

| Current work | Status / next action |
|---|---|
| ACS solder repair | Team reports completed; do not restart hole-fit troubleshooting. Modified termination/protection suitability and powered measurement acceptance remain unverified. |
| Cable fitting and lengths | Team reports completed; finish the loose terminal ends, then restrain the harness. |
| Eight taped loose ends | Not connected yet. Follow the exact endpoint table in Step 3. Tape is temporary insulation, not an electrical connection. |
| PZEM four-wire measurement harness | Inline-fuse route selected:W1/5 →inline holder/fuse →VB+ bottom screw. Install unpowered;verify actual ratings/protection and existing return arrangement before energizing. |
| Baseline CPE checks already passed | Retain earlier evidence; repeat only affected checks after wiring, power or firmware changes. |
| Backend / frontend preview | Latest integration record:3000 now contains the combined frontend/backend,SOC/TTE and SOP4 forms. 3100 is historical. Software checks passed;physical wireless/measurement acceptance remains required. |

**Finish route:** Step3 unpowered terminals → Step4 reviewed battery supply and rails → Step5 real alarm/FSM → Step6 fresh LTE/GPS → Step7 USB-free run → Step8 measurement/app acceptance → Step9 video/final mounting → Step10 daylight solar. USB-only CPE/LTE work can proceed with the battery isolated while a battery-power prerequisite remains open. A checkbox does not override an unresolved electrical prerequisite.

## 1 · Start with USB diagnostics

1. Keep solar disconnected. Isolate battery output before touching wiring; the solar breakers do not isolate the battery-to-buck feed. If there is no confirmed battery disconnect, stop before moving a wire.
2. Remove the removable **HCW OUT+ → ESP32 5V header** jumper. Leave the established logic GND wiring unchanged. Keep battery-side PZEM measurement leads disconnected while its protection/return review is open.
3. Connect ESP32 USB to the computer. Close Arduino Serial Monitor and any other USB reader.
4. Open the **Offline USB monitor** link below. Click **Connect ESP32 · 115200**, select the ESP32 port, then **Disarm / output OFF**. Record firmware and boot ID.
5. Check that the report number increases. If nothing arrives, check the data cable/port and that only one reader owns it. Save the USB report if reports are malformed or the device repeatedly resets.

**Continue when:** fresh device reports arrive. USB diagnostic power does not prove battery operation or external sensor power.

## 2 · Check each CPE input and LED

| Action | Expected observation | If it fails |
|---|---|---|
| Click **Test LED only** | Physical GPIO19 LED blinks | Check its 330 Ω resistor, polarity and ground with power off |
| Press/release lid switch only | Lid input changes; mount input stays unchanged | Inspect that switch's GPIO25/GND connector |
| Press/release removal switch only | Mount input changes; lid input stays unchanged | Inspect GPIO26/GND connector |
| Leave board still, then gently tilt it | Fresh IMU readings respond to tilt | Record the IMU fault/status; do not count an old graph |
| Inspect ADS1115 reports | Fresh A1/config status, no recurring conversion/config faults | Save the report; do not calibrate around a wiring/ADC fault |
| Inspect GPS near an unobstructed sky view | Fresh fix, coordinates, satellites and fix age | Sentences without a fix are communication only |

**Save USB report.** ACS amperes remain invalid until stability, real zero and an independent reference response pass. Do not change offset or use absolute values to hide negative readings.

## 3 · Connect the fitted harness ends with all sources isolated

1. Keep **solar disconnected, USB unplugged and the battery feeds to W1 opening1 and W5 opening1 isolated and individually insulated**. Do not remove tape from multiple loose ends together.
2. Identify one wire by tracing its already-connected end. Remove its temporary tape only when ready to attach it to its intended terminal. Keep copper inside the clamp; clamp the conductor, not insulation. Insulate any end that must remain disconnected.
3. Complete the unpowered 12 V feed and ACS harness endpoints below. The primary repair is recorded as completed according to the team. This table does not approve the trimmed termination for battery operation.

| Inter-box wire | Endpoints | Present action |
|---|---|---|
| 1: regulated12 V positive | Large buck OUT+ → existing5 A fuse on12 V output → CPE W3 opening1 | Attach the remaining loose end with sources isolated. |
| 2: regulated12 V return | Large buck OUT− → CPE W4 opening1 | Attach the remaining loose end with sources isolated. |
| 3: ACS primary input | Power-box W5 opening2 → ACS IP+ | Attach the remaining loose end with sources isolated; keep the modified joint supported. |
| 4: ACS primary output | ACS IP− → power-box W2 opening1 | Attach the remaining loose end with sources isolated; keep the modified joint supported. |
| 5: PZEM VB+; bottom measurement terminal | W1 opening5 → inline holder lead1 → branch fuse → holder lead2 → PZEM VB+ bottom screw | Install with sources isolated. Actual fuse/holder≥60VDC and compatible branch ratings required before energizing;user-selected2A/60VDC fast-acting;independent verification not established. The12V output fuse is separate. |
| 6: PZEM VB−; second measurement terminal from bottom | PZEM VB− → source-side negative reference, the same electrical side as S− | Keep the four-wire measurement harness isolated pending the protection/return review. |
| 7: PZEM S−; second measurement terminal from top | PZEM S− → shunt small SOURCE-side screw | Retain source/load identification; connect only after the harness review. |
| 8: PZEM S+; top measurement terminal | PZEM S+ / SENSE → shunt small LOAD-side screw | Retain source/load identification; connect only after the harness review. |

4. Confirm the existing main routes without rebuilding them: **pack+ →15 A main fuse →W1/1; W1/3 →buck IN+; DALY P− →W5/1; W5/2 →ACS IP+ →ACS IP− →W2/1; W2/3 →buck IN−**. W1 is positive; W5 is protected negative. Never join W1 directly to W5.
5. Restrain cables at both box entries so pulling or opening a lid does not load solder joints or terminals. Keep tape clear of cooling airflow. Check that no loose copper can reach adjacent terminals or the frame. Fit/tape alone does not prove strain relief or an enclosure rating.
6. Keep USB/external5 V selection as before: remove the **HCW OUT+ →ESP32 selected5 V** jumper for USB operation; restore it only with USB unplugged and battery power isolated.

**Finish this stage when:** the permitted loose ends are clamped, labels match, cables are supported and held ends are separately insulated. Do not energize to test continuity. Near-zero resistance through ACS IP+/IP− is expected and does not prove calibrated measurement or current/fault suitability.

**Battery-power prerequisite:** the modified primary termination, input protection and source isolation still need a suitable physical electrical review before Step4. The user-reported solder repair is recorded without marking this review passed. Until then, retain battery isolation and use the already-reviewed USB-only logic/LTE path; PZEM battery-voltage and actual12 V siren tests remain dependent on their supplies being released.

## 4 · Power from the installed battery supply

1. Disconnect USB. Leave the HCW-to-ESP32 positive jumper unplugged initially. Keep PV disconnected.
2. Confirm the existing 12 V route: **buck OUT+ → existing 5 A 12 V fuse → W3/1; buck OUT− → W4/1; W3/2 → HCW IN+; W4/2 → HCW IN−**.
3. Energize the reviewed battery feed. Multimeter black lead in COM, red lead in VΩ, DC voltage mode. Measure **buck OUT+ to OUT−**: the earlier unloaded result was 12.02–12.03 V. It must remain near 12 V now.
4. Measure **HCW OUT+ to OUT−**: verify approximately 5.0 V before connecting the ESP32. If high/unstable, isolate battery power and correct it first.
5. Isolate battery power. Restore **HCW OUT+ → ESP32 selected 5V header** jumper. USB remains unplugged. Re-energize and recheck 12 V and 5 V under the CPE load. Stop for wrong polarity, falling rails, resets, unusual heat, smell or a loose primary joint.

**Continue when:** the CPE runs from the battery and its supply rails remain stable. This establishes power operation, not calibrated ACS measurement.

## 5 · Check the actual siren and three-state logic

1. For USB commands while battery-powered: isolate battery power, remove the **HCW OUT+ → ESP32 5V** jumper, connect USB, then restore the reviewed battery feed for the **12 V alarm branch**. Retain the established common logic ground. Do not join HCW 5 V to USB 5 V.
2. In the offline reader click **Disarm / output OFF**. Confirm the physical siren is silent.
3. Hold both switches in their secure positions. Wait at least 10 seconds after boot, then click **Arm bench**. Confirm ARMED.
4. Release the lid switch only. Confirm TRIGGERED, the reported lid reason and actual siren sound. Click **Disarm / output OFF** and confirm sound stops. Repeat separately for removal.
5. **Motion is currently disabled in your saved report.** Complete the contact/siren tests first. For motion commissioning, save stationary and deliberate-movement diagnostic readings with both contacts secure, then review baseline/noise and thresholds before enabling the retained firmware's **ENABLE_MOTION / MOTION_CALIBRATED** settings. A flag change is not calibration. After a reviewed build/upload, repeat stationary/normal-vibration and deliberate-motion trials; record actual triggers and false alarms. Until then, present IMU readings as sensing only.
6. If state changes but no sound: isolate power and check **W3/3 → existing 2 A alarm fuse → F5305S DC+; W4/3 → DC−; GPIO27 → SIG+; GND → SIG−; OUT+/− → siren +/−**. Record actual output behavior before changing firmware gates.

**Continue when:** both contact trials, disarm behavior and actual siren action are recorded. A reported output command alone is not proof of sound.

## 6 · Verify LTE and GPS in the real application

1. Save the offline report, click **Disconnect**, and close that reader. Open the application's **CPE Lab** on the machine running the backend (normally **http://localhost:3000**). The public guide is separate from the live application.
2. Connect USB in CPE Lab. Click **Update LTE address**. Wait for confirmation that the device saved it. If unavailable, repair backend/ingress reachability first; do not type an old hostname or disable certificate checks.
3. Turn **Forward USB readings to server OFF**. Click **Start LTE streaming**. Confirm several newly accepted server rows with transport **LTE**, increasing sequence and fresh receipt times.
4. Place the GPS antenna where it can see sky. Confirm a fresh fix reaches the real map/history. No fix means tracking is not yet demonstrated.
5. Repeat one secure → arm → trigger trial and confirm the actual FSM state/event appears through LTE. These app/reader buttons send commands through USB; this is not proof of wireless remote arming/disarming.
6. If LTE fails, save the exact latest diagnostic and time. An old HTTP 200, registration alone or serial RX lines are insufficient. Keep the backend host and internet running for a temporary bench ingress.

**After a laptop shutdown:** restore backend 3000, device ingress and the HTTPS endpoint. Repeat **Update LTE address → device-saved confirmation → Start LTE streaming → fresh server receipts**. The previous temporary endpoint may have expired. Keep the laptop awake, powered and online during both videos. The 3100 preview is separate and initially contains demo data, not the device stream.

**Continue when:** repeated real LTE receipts and fresh GPS positions are visible. Report which location functions remain untested if no fix is available.

## 7 · Demonstrate USB-free operation

1. Firmware **2.0.19 boots DISARMED**. It can stream over LTE without USB, but a power-cycle does not retain an armed state. Keep that distinction in the demo.
2. If automatic arming after battery-only startup is required, first finish the preceding alarm tests. Then use the prepared **2.0.20** with the retained private configuration and GPIOs, compile/upload in the existing Arduino IDE project, and verify the reported version. This is a separate change, not needed for the baseline checks.
3. With 2.0.20, both contacts secure and the physical output verified, the offline reader's **Enable standalone arming · 2.0.20** explicitly saves the arming request. **Disarm** cancels that saved request. Repeat the physical startup/trigger checks after changing firmware.
4. Isolate battery power, disconnect USB, restore **HCW OUT+ → ESP32 5V header**, then re-energize. Confirm fresh **LTE** rows from the new boot. For 2.0.20 standalone mode, verify the startup guard and actual ARMED state before triggering.
5. Record start time, power source, initial DMM voltage, and any resets/dropouts. Let normal CPE operation consume energy while preparing the app/PPT. Record end time and final DMM voltage. Do not short, add an improvised discharge load or claim an exact state-of-charge from voltage alone.

**Continue when:** updates continue with USB physically removed. The duration observed is an uptime lower bound, not maximum battery life. Firmware upload and restart behavior still require physical verification.

**If cold-start LTE does not resume:** check the actual retained firmware setting **LTE_AUTO_START**, current saved endpoint and diagnostic before filming. A USB Start command before a later power-cycle is not proof it will start after that cycle. Keep firmware changes deliberate and verify the reported version after upload.

## 8 · Record readings honestly; finish the app

1. **ACS:** complete successful current validation separately; tonight's load variations alone cannot establish accurate sensitivity. Keep amperes invalid until measured stability, true zero and independent known-current/reference response pass. The team reports the wire repair complete; current calibration still requires these measurements.
2. **PZEM:** battery voltage comes from VB+/VB−, not ACS. Without its approved positive protection/return arrangement, keep the measurement harness disconnected and use the DMM for battery voltage. RS485 communication status alone is not a measurement PASS.
3. The latest integration is already applied at **http://localhost:3000**. Use that combined frontend/backend for device acceptance;do not merge the historical3100 preview again. Software checks passed in the integration record;fresh physical device tests below remain required.
4. The integration record includes TypeScript,tests and production build. Now check actual login/roles, hardware LTE receipts with USB forwarding OFF, GPS/map/history, exact **DISARMED / ARMED / TRIGGERED** reports/events, physical alarm, saved records, reconnect and invalid/stale-data display. Keep measurement faults/nulls visible. Current commands are USB; **wireless remote arm/disarm is not implemented in the reviewed command path** and cannot be claimed from an app button.
5. Check the combined app at a narrow phone viewport and on the group's phone when available. Confirm navigation, readable data/quality labels and no page overflow. A localhost address or device-only ingress is not a phone-accessible app link. Freeze the accepted combined revision, keep a working backup, then record the final app video. Do not create another website for the preview.
6. Keep SOP 3 acceptability claims separate from these engineering checks. IT/TODA questionnaire results require actual respondents and recorded ratings.

| New app function | Where to use it / what it requires |
|---|---|
| Estimated battery percentage and TTE | Current app: Energy; engineering reference form in CPE Lab. Select prototype/BEMAC capacity, record actual reference SOC or explicitly labelled assumption, reserve, efficiency and evidence. Validated signed battery current and continuous history are required. Voltage alone does not create a percentage. |
| SOP 4.1 | CPE Lab: record actual environmental protocol, observations and result; no automatic IP65 certification |
| SOP 4.2 | Recorded source/net-battery energy coverage plus entered matched bench/on-vehicle trials; missing wind remains unmeasured |
| SOP 4.3 | Record normal/tamper truth and detection; app computes TP/FP/FN/TN and classification metrics |
| SOP 4.4 | Save an available TTE prediction before the outcome, then record the matching reserve endpoint; app computes MAE/RMSE |
| SOP 4.5 | Enter synchronized actual transmission pairs and observed power intervals; app computes qualified latency and observed autonomy |

**Open the right app:** 3000 is the authoritative backend/current functional app. 3100 is the separate frontend preview until the other AI reconciles it. The public guide is neither app. Missing calibration/reference/trials appear unavailable, not invented percentages or test results.

**Continue when:** the working app build and device evidence are saved; remaining measurement limitations are explicit.

## 9 · Finish the demonstration and presentation

**Video A · stationary battery-powered operation**

1. Use the secured portable CPE box + power box + battery. Solar remains disconnected. Complete Steps 4–7 first.
2. Show battery/power boxes, the connected power route and the physically disconnected USB plug. Then show fresh **Hardware-mode LTE** receipts in the actual app/PWA for about 30 seconds. A serial reader or a demo map is not this evidence.
3. Record the accepted contact/alarm trial separately if arming requires USB; identify that command connection. Do not imply wireless remote control. Save the original as **A-standalone-camera.mp4**, and any screen recording as **A-standalone-PWA.mp4**.

**Video B · walking GPS, two simultaneous recordings**

1. Keep the same portable assembly safely secured; carry all required power parts, not a bare perfboard. Use enough people to support its weight. Do not lift by cables. The panels/large frame stay behind.
2. Screen recorder: open the actual app/PWA in **Hardware mode**, select the device's map/history and expose fresh receipt time/sequence where available. The backend laptop can stay stationary, powered and online. If the final frontend is not accepted yet, use the working actual app and repeat the final view after integration.
3. Camera operator: show the carried assembly, battery power and USB absent. Outdoors, wait for a valid fresh GPS fix. Start both recordings; capture the same spoken countdown and a shared visible clock, or another visible timing cue in both recordings.
4. Walk a short safe route with clear sky view. Record multiple real position updates and a stop/return. A few steps indoors or stationary coordinate jitter do not establish a tracked route. Continue recording if LTE pauses; do not conceal the gap.
5. Stop both recordings. Save originals as **B-walk-camera.mp4** and **B-walk-PWA.mp4**. Align the shared cue and place camera footage beside the PWA recording. Preserve real timing; label any edits or speed changes. This is visual demonstration, not a precise latency measurement.
6. Caption: **Battery-powered wireless GPS tracking test · actual date · LTE · solar disconnected**. Keep originals and the edited MP4 offline for the PPT.

**After walking · final mounting and defense**

1. Isolate power. Bolt the boxes to the 4040 at the marked positions. Keep drilling debris away from electronics; secure cables, keep lids/fan clearance accessible and repeat power/LTE/alarm checks after mounting. Record the complete mounted assembly separately.
2. Keep VAWT static/planned while its stand, controller and battery interface remain unvalidated. State actual completed work and remaining work; do not invent tests or yield.
3. Finalize diagrams, calculation assumptions, SOP evidence table, Gantt actual progress, short script and Q&A using the earlier complete plan below. Mark planned versus measured values. Complete mass and BEMAC structural capacity remain unestablished.
4. Rehearse the accepted demo and video fallback. Back up PPT, MP4/original clips, app build, private firmware/config and test reports. Prepare transport with power isolated and terminals individually insulated.

| Video segment | What it establishes |
|---|---|
| USB reader + fresh GPS fix | GPS reception/positioning only |
| Actual app + fresh accepted LTE positions | Wireless GPS monitoring; movement/history required for a route claim |
| USB physically removed + battery-powered CPE + fresh LTE | Observed battery-powered wireless operation |
| Daylight panels + battery-connected controller output voltage/current | Solar-charging indication; calibrated energy requires validated metering |

**Continue when:** the exact demonstration has been rehearsed and backups open offline.

## 10 · Tomorrow: daylight and school setup

1. Transport early and reassemble using the labelled harness. Inspect terminations, clamp retention and polarity before reconnecting battery power.
2. Repeat battery-only power/LTE checks after transport. Test solar harvesting in daylight only after charge profile, actual protection, polarity and connector checks are complete. Do not reconnect panels into an unfinished controller circuit.
3. Record solar charging separately in daylight: show the panels/actual battery connection and controller output voltage plus positive charging current, then any released app metering. A voltage rise alone is weak evidence. Your reported 54.3–54.4 V is near the stated 54.6 V ceiling, so charging current may be small. Normal supervised CPE operation tonight can consume some energy; do not add an improvised discharge load or raise the ceiling. Do not infer exact state-of-charge from voltage alone. Night testing does not validate solar yield.
4. Record what actually works and use the saved video if weather, LTE or setup prevents a live segment. Keep BEMAC/wind planned interfaces distinct from the physically tested 48 V prototype.

**Final acceptance remains open** wherever primary terminations, battery branch protection, ACS accuracy, PZEM measurement, motion detection or wireless behavior have not passed their actual tests.

**Calculation correction, 29 October:** 10 W is 5 V ×2 A, not battery-side power. With two separately assumed 85% efficiencies, battery demand is 13.84 W / 332.18 Wh per 24 h before additional loads. The corrected calculations and actual-PDF defense script are linked at the start of the guide.


**Current PZEM connection:** W1 opening5 →inline holder lead1 →branch fuse →holder lead2 →PZEM VB+ bottom screw. Place holder beside W1;install with all sources isolated. User-selected fuse:2A/60VDC fast-acting;earlier1A target is superseded. Independent verification is not established. Actual fuse AND holder documented≥60VDC,adequate interrupting capacity and compatible current/time-current ratings are required. Selected installation is not ratings/physical acceptance. Retain the existing shunt/reference endpoints.

**Keep existing architecture:** W5/2 →ACS IP+ →ACS IP− →W2/1;signalGND remains separate. Keep15A main. Do not substitute20/25A or claim instant clearing from rating alone. Brief cool operation does not establish continuous/fault qualification.

**Fuse arithmetic:** if15mA is assumed,54.6V×0.015A=0.819W;2A/0.015A=133.3. The15mA value is unverified;these calculations do not prove an optimum2A fuse.60V−54.6V=5.4V voltage headroom,not a complete fault/holder qualification. No extra purchase is proposed.

**Firmware:** the inline fuse changes no GPIO,calibration coefficient or firmware command. Keep installed2.0.19 for the baseline. Existing source download is solair_cpe_source_2.0.19.zip;no new upload is needed solely for this fuse. Continue rail,alarm/FSM,LTE/GPS,USB-free and measurement tests. Current calibration must still use real measurements,not a guessed offset or absolute value.

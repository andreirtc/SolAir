# SOLAIR · Finish the prototype, step by step

**Follow the steps in order; skip completed work.** Repeat a check after its wiring, power, firmware or software changes.

## 1 · Dry-fit the complete assembly and decide cable lengths

1. Keep PV disconnected, USB/adapter removed and the battery output isolated using the existing reviewed disconnect procedure. Keep battery terminals separately insulated.
2. Follow the reported dry fit: panels perpendicular to three 4040 rails; boxes on the 420 mm exposed end, with about 30 mm allowance at the opposite end. CPE is on the left rail; power box on the middle rail; LONQ is outside the power box. Perfboard lies flat. Rail span is approximately 1380 mm, with approximately 700 mm to the middle rail. Battery placement is not fixed.
3. Use the reported routing allowances: 800 mm per general electrical-to-CPE run; 900 mm each for the ACS IP+ and IP− runs. Confirm the real terminal-to-terminal path, inside-box bends and lid movement before cutting. The visual does not assign a battery location or drilling coordinates.
4. Label both ends: converter OUT+ → W3/1, OUT− → W4/1; W5 → ACS IP+; ACS IP− → W2; PZEM VB+, VB−, S− and S+. Mark box entries and support points.
5. Measure the complete frame length × width × height. Recheck the panel's outside metal-frame height perpendicular to its edge: listing 30 mm versus earlier 27 mm measurement. Test clamp retention. EVA cushioning does not make a loose clamp secure.

**Finished when:** every component has a position, lids open, panels are retained and each unfinished wire has a measured route. Do not permanently close the boxes yet. Keep the unsupported VAWT aside; it is not part of the supported frame until its mounting is solved.

## 2 · Finish the remaining wiring, including the optional XT60

1. Cut only the confirmed routed lengths: general electrical-to-CPE allowance 800 mm, each ACS primary run 900 mm. Keep high-current wiring outside perfboard tracks. Retain the existing main 15 A fuse and12 V output5 A fuse; retain the alarm2 A fuse.
2. Complete converter OUT+ → existing 5 A inline fuse → W3 opening1, and converter OUT− → W4 opening1. W3 is 12 V positive; W4 is 12 V return. Inside CPE: W3/2→HCW IN+, W4/2→HCW IN−; W3/3→2 A alarm fuse→F5305S DC+, W4/3→DC−.
3. If choosing your XT60 pair instead of SB50, build both halves while detached from every power source. Follow the table below. Use the source-side half with recessed metal sockets, insulate each solder cup and check +→+, −→− and no short before energizing. Keep the connector accessible; loads OFF and PV isolated before unplugging.
4. Complete the ACS main-current connection only with a conductor/termination/protection combination that is established for that path. **12 AWG does not fit the present PCB ring. An18 AWG label saying600 V/200 °C/UL758 does not establish coordination with the 15 A main fuse.** Do not force12 AWG, remove strands or approve18 AWG solely from those markings.
5. Finish PZEM leads only as the reviewed measurement circuit permits. VB+ needs suitable battery-side DC branch protection; that part remains unavailable. Keep the measurement harness isolated until protection and communication/measurement return paths are reviewed. A12 V blade fuse rating does not establish suitability on the 54.6 V branch.

| Optional XT60 connection | Exact endpoints | Wire |
|---|---|---|
| Source half + | Existing15 A main-fuse output → XT60 + | 12 AWG |
| Source half − | DALY black P− → XT60 − | 12 AWG |
| Mating half + | XT60 + → W1 opening1 | 12 AWG |
| Mating half − | XT60 − → W5 opening1 | 12 AWG |
| Unchanged measured return | W5 opening2 → ACS IP+; ACS IP− → W2 opening1 | Primary termination still unresolved |

AMASS specifies12 AWG for the XT60 series; check the actual connector fits the complete conductor. This replaces SB50 rather than adding another connector in series. It provides a removable connection; it does not resolve the ACS primary connection or act as a fuse.

| PZEM measurement connector, bottom → top | Required destination |
|---|---|
| VB+ — bottom | W1 opening5 through suitable battery-side DC branch protection; currently held disconnected |
| VB− | Shunt small SOURCE reference |
| S− | Shunt small SOURCE reference |
| S+ — top | Shunt small LOAD sense screw |

Sense/reference leads carry measurement signals; large shunt bolts carry primary current. Keep separate wires in separate PZEM terminals. Keep the existing communication5 V/A/B/GND connector distinct from these four measurement terminals.

**Finished when:** the actual wiring matches the selected route, no exposed live joints remain, source isolation is understood, and protection/termination checks are closed. ACS primary and PZEM protection are presently open requirements. Independent12 V CPE checks below can continue on the existing reviewed bench; full shared-battery energization waits for a released circuit.

## 3 · Power and inspect the CPE before software diagnosis

1. Open the existing offline USB monitor or the app's CPE bench. Record the reported firmware, boot ID and sequence. The last confirmed upload was 2.0.19; do not assume prepared 2.0.20 was uploaded.
2. Keep competing USB5 V and HCW5 V feeds separate with the removable HCW positive jumper. Use the existing reviewed bench-power selection. Ground and ACS VCC must remain correctly supplied in that selected mode.
3. Measure large-converter OUT+/OUT−, HCW OUT+/OUT− and ESP32 3V3/GND before connecting a questionable supply. Previous12.02–12.03 V was an unloaded buck reading, not a completed load test. HCW output must be5 V, never12 V into ESP32.
4. Confirm fresh ADS/IMU reports, switch states, PZEM communication, GPS characters and modem diagnostics. Save one JSON baseline. Record each fault instead of changing multiple wires/settings together.

**Finished when:** rails remain correct, firmware reports are fresh and the board does not reset under the selected bench load. Sensor detection and valid JSON do not establish calibrated current or physical alarm operation.

## 4 · Validate ACS and PZEM, then save only measured corrections

1. Pause LTE for the bounded ACS test. With the ACS primary carrying no current but sensor powered, measure J_TEST4→3 = ACS supply; J_TEST1→3 = rawOUT1; J_TEST2→3 = divider midpoint/ADS A1/GPIO 34. Use DCV20 for supply/raw output; DCV2 for a midpoint near 1.25 V. Never use resistance mode on a powered circuit.
2. Capture at least 30 fresh, valid zero-current reports. Record A1 mean/spread and multimeter reading. ADS A1 must be stable and agree within the instruments' accuracy/resolution. A changing ground offset or ADC faults must be fixed before zero calibration.
3. For an isolated12 V reference test, keep all48 V connections detached. Existing adapter+ → existing 2 A bench fuse →100 Ω bank+; bank− → ACS IP+; ACS IP− → adapter−. Retain the reviewed sensor supply/common logic reference. Keep PZEM measurement wires detached for this ACS-only test. This protected low-current bench is separate from the 15 A battery path.
4. Measure the isolated cold bank resistanceR, then powered voltageV across the bank. Compute **Iref=V/R** and **P=V²/R**; verify the bank's rating first. At exactly 12 V/100 Ω, these are0.120 A and1.44 W. Capture30 loaded reports; repeat zero → load → zero with power off for wiring changes.
5. Check that the signal change is reproducible and larger than noise/drift. For a verified equal10k divider, VOUT=2×VA1; V0=mean true-zero VOUT; sensitivityS=ΔVOUT/Isigned. Save only measured values in the actual firmware configuration: ACS_ZERO_V, ACS_SENSITIVITY_V_PER_A, ACS_FRONTEND_SCALE and supported ACS_VALIDATED_MIN_A/MAX_A. Enable ACS_CALIBRATED only after passing checks.
6. Open the existing solair_cpe sketch in Arduino IDE; retain the actual private configuration/credentials and GPIOs, select the same ESP32 board/port and leave Erase All Flash disabled. Compile/upload; verify the reported version and repeat the independent zero/load check. This is a firmware calibration update, not merely a backend display correction.
7. After its electrical review, compare PZEM voltage with the multimeter, verify the actual 50 A/75 mV shunt setting and compare current/energy against an independent reference over the same interval. Do not use unvalidated ACS to certify PZEM or vice versa; do not issue factory calibration commands.

**Finished when:** zero, stability, reference response and the claimed current range pass with saved evidence. The100 Ω point tests only its low-current region; it does not validate2 A or the entire±50 A range. If the 0.12 A response is buried in noise, save that failed attempt, keep amperes invalid and continue independent functions in Steps 5–6 and frontend work in Step 8. Final CPE acceptance still requires successful ACS validation; a guessed offset, absolute-value display or uncalibrated number is not a substitute.

## 5 · Start the backend and prove wireless monitoring/tracking

1. In the authoritative `next-platform/solair-platform` folder, use Node24 and run `npm run dev`. Open `http://localhost:3000`, check `/api/health`, then sign in. Preserve the existing database/configuration. If startup fails, save the exact terminal error; do not reset the DB.
2. For the existing local LTE endpoint, run the configured `npm run lte:bench-ingress` and `npm run lte:bench-tunnel` in separate terminals. Keep the app, ingress, tunnel and internet running. The public instruction website is not the telemetry backend.
3. In the app, click **Update LTE address** and wait for device-saved confirmation. Turn **Forward USB readings to server OFF**, then start LTE streaming. Use the current endpoint, not an old hostname.
4. Confirm new accepted server rows with matching device ID, boot ID and sequence and transportLTE. Compare receive times and fresh values with the device. An old200, registration, queued packet or serial message alone is not successful delivery.
5. Take the safely powered CPE outdoors, wait for a valid GPS fix, then move it along a short known route. Check that new locations and timestamps appear in the app/history. Keep invalid/stale fixes visibly marked.
6. Fix the exact failed layer: startup/health → current endpoint → registration/attachment → TLS/HTTP → server validation → app freshness. Keep TLS verification enabled. After a fix repeat the failed check, not every earlier test.

**Finished when:** actual device data reaches the backend through LTE and actual fresh GPS positions reach the map/history. Save logs/screenshots with matching timestamps. USB-free battery operation is checked in Step 7.

## 6 · Test the three-state FSM and actual physical alarm

1. In the reviewed powered bench, confirm DISARMED and actual siren OFF. Hold both switch contacts secure; wait for the device's permitted arming state, then arm.
2. Release only the lid input. Verify ARMED → TRIGGERED, the event recorded in the app and actual siren sound. Disarm and confirm sound stops. Repeat for removal input separately.
3. Test deliberate IMU motion and normal handling separately. Use a trial sheet: actual normal/tamper condition, input, device result and app event. A practical pilot is five normal and five deliberate-tamper trials per tested input; report the actual completed count. Label hand-operated trials separately from mounted trials. An acceleration graph alone is not detection accuracy.
4. If the app changes state but the siren does not, check the existing 2 A alarm branch, F5305S DC+/DC−, SIG+→GPIO 27 and SIG−→GND. Confirm configured alarm/polarity gates; do not flip a flag blindly.
5. Check reset/power-up behavior on the installed firmware.2.0.19 boots disarmed; prepared 2.0.20 adds opt-in standalone arming. If that feature is required, upload the prepared revision with the retained configuration, verify it reports2.0.20 and follow the existing standalone-arming instructions. Do not claim it from the source file alone.

**Finished when:** DISARMED, ARMED and TRIGGERED are acknowledged by the device, physical sound follows the intended bounded behavior, and disarm/reset behavior is recorded. Hand tests establish switch logic only; repeat the actual lid/removal action after final mounting in Step 9.

## 7 · Run CPE from the battery and create charging headroom

1. Start only after the shared-battery primary wiring, protection, rails and source-selection review is closed. Check that buck IN− is on final W2/3, not the earlier temporary W5/3 route. All intended net-battery returns must pass through ACS without a bypass.
2. With power off, select HCW5 V as the CPE supply, unplug USB and the 12 V adapter, then power the reviewed battery → large converter → HCW path. Repeat rails under load and check for resets/heat.
3. Repeat fresh LTE receipt, GPS update and wireless arm/disarm using the app. Log start time, boot ID, device uptime and power source. A laptop may host the server; it must not supply CPE power in this test.
4. Keep this **supervised** battery-only run operating while app fixes/documentation continue. Keep PV isolated for this interval. Log restarts, gaps and end time; do not add an unknown discharge load or run unattended.
5. If battery current is validated, compute actual used energy over the interval. Otherwise record time/voltage without inventing Wh or exact SOC. Example only: assumed5 W ×6 h=30 Wh, or6.25% of nominal 480 Wh. Actual duration/load determine actual headroom.
6. Briefly interrupt the network, restore it and record device/server recovery separately from power continuity. For transmission latency, the backend/firmware task is to record an actual send-start UTC timestamp and ingestion UTC timestamp tied to boot ID/sequence; verify clock synchronization first. Collect consecutive real LTE pairs, calculate received−sent in milliseconds and summarize actual samples. A pre-existing sample timestamp is not automatically send-start. Until this instrumentation/clock check passes, keep latency pending; do not substitute sensor age.

**Finished when:** CPE actually runs and updates wirelessly without USB/adapter. Record observed autonomy, not maximum battery lifetime. End this battery-only interval at the first power interruption or when PV is enabled. Record the actual reason; start a separately labelled interval after final mounting if needed. A near-full pack may still accept little charging current; never increase the charge ceiling to force a demonstration.

## 8 · Integrate the frontend, then repeat the same checks

1. Keep the supervised battery-only run from Step 7 operating during app integration if its electrical checks have passed. Give the other AI the frontend handoff download and the actual observations from Steps 3–6. Candidate checked again: `feature/solair-quality-ui-updates-2026-10-26-v2`, SHA `e8967336906e023cfeaba134705fcdb3e33fbc60`; the non-v2 branch has the same SHA.
2. Preserve the current dirty backend/firmware work. Review the branch diff and coordinate API/auth/schema conflicts before merging. Do not reset this checkout, blindly switch branches or overwrite backend changes. The branch contains reliability/security changes, not just appearance.
3. Prioritize the working user flows: login/roles → fresh monitoring → GPS history → arm/disarm/event handling → notifications → understandable invalid/stale/offline states. Retain exact telemetry contracts and the three FSM states. Do not turn null current into0 or simulated data into live readings.
4. Run `npm run typecheck`, relevant tests and `npm run build` on Node24. Then repeat actual LTE/map/command checks through the integrated UI. Save the working app revision and a backup before further changes.
5. Evaluate the five approved SOP 3 criteria with the approved questionnaire and actual IT/TODA participants when available. Fix observable usability issues; preserve security/access checks. If evaluations are not collected, show the evaluation method as pending rather than inventing ratings.

**Finished when:** the integrated UI passes the same real flows and displays measurement limitations correctly. A visual redesign or software test suite alone is not physical validation or SOP 3 acceptance evidence. Additional design polish follows a working build; do not let it block the prototype/video.

## 9 · Resolve final mounting and repeat only affected checks

1. Isolate power, mount the boxes and support the battery in the dry-fit positions. Leave lids removable. Restrain the battery and insulate exposed nickel/tabs; protect cable entries and provide strain relief.
2. Place the perfboard, HCW, F5305S, PZEM and other offboard parts without obstructing fans, stressing headers or shorting the shunt/fuse bolts. Keep the large converter in the power box; preserve the chosen layout rather than forcing the reference image.
3. Recheck panel clamp retention, terminal tightness, fuse support and cable slack with lids both open and closed. Cushioning is not structural retention; an enclosure label is not certification after drilling.
4. Fit the switch so actual lid opening releases its actuator; the removal input needs a fixed reference that stays when the monitored part moves. If no effective mount exists, label the demonstrated input as manual logic only. Secure IMU mechanically with the perfboard/support; no hanging jumper-only mounting.
5. Repeat rail checks and the physical lid/removal/motion tests affected by mounting. Record assembled dimensions and clear photos; tidy wires only after those checks pass.

**Finished when:** parts stay in place, terminals are insulated, cables are supported and the actual mounted inputs behave as claimed. No rain/road/windworthiness claim follows from a stationary demonstration.

## 10 · Test the complete solar-to-battery-to-CPE system

1. Use the existing Electrical block sheets as one system. SheetA is the PV/controller source; the other sheets continue through battery/protection,12 V supply and metering. Keep TOMZN/LONQ solar topology unchanged.
2. With charging disabled, verify the installed MPT profile, output-voltage ceiling and current limit against the prototype battery approval/manual.13S maximum is 54.6 V. Proposed2 A was an initial commissioning proposal, not a measured setting or BEMAC value. Read saved settings back; use only an approved and validated operating range.
3. In daylight, follow the matching controller manual's connection/start sequence. Record battery voltage, MPT input/output readings, sun conditions and time. Two panel labels give series Vmp39.38 V and Voc48.16 V; actual conditions change these values.
4. Confirm the full physical path: panel series link → TOMZN → MPT PV input → reviewed charging/protection path → BMS-protected battery; battery distribution → large converter → CPE/alarm. Keep every required protection device and isolation point identifiable.
5. With both measurement chains validated, record simultaneous source-output and net-battery readings at elapsed 0,1,2,3,4,5 minutes, noting sun/shade changes. Use these six samples for the five-minute energy interval. MPT indicated current remains preliminary display evidence. Watch rail stability and actual CPE updates during charging.
6. Save a continuous solar-only interval. End/label the battery-only run from Step 7 before enabling PV. If darkness/full charge prevents useful charging evidence, record that limit and use an actual earlier sunlight recording; do not invent generation.

**Finished when:** actual solar operation and its measurement boundary are recorded, with no unresolved electrical release issue. Nighttime PV voltage alone does not prove the claimed sunlight performance. Source output and battery net energy are not interchangeable.

## 11 · Decide and document the VAWT demonstration

1. Default for the present build: **static VAWT display / planned wind branch**, because there is no adequate freestanding support and its controller is unlabelled. Do not improvise a spinning unsupported assembly to fill a slide.
2. Show the planned block path: VAWT three-phaseAC → rectifier/wind controller → verified battery-compatible charging interface → protected battery bus. Draw unverified interfaces dashed. Do not connect the unlabelled12/24 V controller directly to the 48 V prototype or55.2 V BEMAC pack.
3. Use the seller's400 W at 12m/s only as a rating. Hand-spinning/open-circuit voltage is not delivered charging power. A real wind test requires a suitable stand, known controller/load and measured voltage/current/wind conditions.
4. State exactly: **“Wind charging has not yet been validated. DP1 measured energy results exclude wind; the controller interface, support and output test remain to be completed.”** Present assumed hybrid calculations separately.

**Finished when:** the wind slide, block diagram and spoken explanation agree. Use the actual limitation rather than a white lie; no measurement is created by the demonstration plan.

## 12 · Record the required working-prototype video

1. Save the first successful functions immediately as backup evidence. After integration, record one clear final demonstration with the physical assembly and app visible or synchronized.
2. Show the actual power/USB state, fresh LTE telemetry/GPS, secure contacts → arm → one deliberate trigger → physical siren → disarm. Show sunlight charging only if it actually passed; identify any separately recorded test.
3. Save matching raw logs, app/firmware revisions and timestamps. Keep credentials out of the recording. Show wind as static/planned if Step 11 was not a validated generation test.
4. Embed the MP4 into the PPT; play the presentation with the internet disconnected. Save the PPT, MP4 and evidence on two devices/drives. Keep the raw original as well as the edited clip.

**Finished when:** the actual PPT plays the video offline, sound is audible and each shown result is supported by its real record. Avoid a last-minute situation where the only proof is a live network connection.

## 13 · Prepare the size, weight and BEMAC explanation

1. Put the actual measured prototype envelope/photo from Steps 1/9 beside the measured BEMAC usable canopy envelope if the field record contains it. If not available, mark vehicle fit pending; do not guess vehicle dimensions.
2. Use the mass table below. Request the actual seller profile kg/m and other component masses if readily available; leave unknowns explicit. No scale means the total cannot be called measured.
3. Explain4040: both solar rail and4040 can mount panels;4040 was selected for adjustable multi-component prototype mounting and reusable T-nuts. Do not claim superior strength/lightness without comparison tests.
4. State vehicle integration conditions: mounting load capacity, wind load/centre-of-gravity/clearance, permissible attachment and vehicle charging/BMS control require separate validation. Vehicle passenger payload is not proof of roof capacity.

| Calculation | Result / limitation |
|---|---|
| Panel mass subtotal | Two panels × seller-listed 10 kg =20 kg; not total prototype mass |
| Full rail length | Three ×6 ft ×0.3048 =5.4864m |
| Rail mass | 5.4864m × actual profile kg/m; currently unknown |
| Total mass | 20 kg + rails + battery/BMS + boxes/electronics + hardware/wires; unknown terms remain unknown |
| Reported rail-frame span | Approximately 1380 mm outer-to-outer; do not treat approximate 700 mm spacing as a drilling survey |
| Rail-end allowances | Approximately 420 mm at box end and 30 mm at opposite end |
| Panel-only area | 2 ×1.32 ×0.67 =1.7688 m² |
| Side-by-side panel footprint | Approximately1.32 ×1.34m before gap/clamps; use actual assembled envelope for fit |

**Finished when:** the slide distinguishes seller data, measured dimensions and unknown structural limits. Say **“prototype fit demonstrated on our frame; vehicle mounting feasibility remains to be validated”** if that is the actual evidence.

## 14 · Put the engineering computations into the PPT

1. Use the existing simple-calculation download. For each row show **formula → substituted numbers → units/result → source or assumption**. Keep prototype and BEMAC columns separate.
2. Include the minimum rows below. Do not substitute54.6 V charge ceiling for nominal 48 V energy or treat observed BEMAC56–60 V as its approved charging ceiling.
3. Explain the UP study correctly: published consumption is a range-equivalent proxy; the motorpool findings establish actual battery configuration/labels. They do not together become a measured route-efficiency test.
4. Put solar-only measured results beside assumptions. Keep stationary-wind scenarios and riding airflow separate; added drag/propulsion energy prevents treating riding wind as free net generation.
5. For fuse justification, show actual protected wire/holder, branch maximum/inrush, DC voltage and fault-interrupt requirements.1 A/5 A battery-side values were preliminary search targets; do not call them calculated/installed approvals. This is separate from the existing 5 A fuse on the 12 V output.

| Formula / parameter | Prototype / shared basis | BEMAC / interpretation |
|---|---|---|
| E=Vnom ×Ah | 48 ×10=480 Wh | 2S2P modules:55.2 V ×80Ah=4416 Wh |
| Solar planning E=P ×PSH ×factor | 400 ×4 ×0.70=1120 Wh/day potential | Same array potential; compatible vehicle charge interface still required |
| Prototype current-cap example | min(280 W,48 V ×2 A) ×4 h=384 Wh/day |2 A and4 effective clock hours are proposed/assumed, not BEMAC settings |
| Corrected electronics energy | 5 V ×2 A=10 W at 5 V; 10/(0.85×0.85)=13.84 W battery-side | Two assumed efficiencies; ×24 h=332.18 Wh/day for5 V branch only;add12 V standby/alarm and direct battery loads |
| Solar-only balance before additional loads |384−332.18=51.82 Wh/day |1120−332.18=787.82 Wh/day, conditional planning case |
| Range-equivalent proxy | UP study7.99 km/kWh →1000/7.99=125.16 Wh/km |787.82/125.156≈6.29 km; at assumed20 km/h≈18.9 min; not measured route extension |
| Wind scenario | Existing assumed stationary case≈13.02 Wh/day | Unmeasured; excluded from DP1 measured totals |

The existing calculation page explains the 70% derivation, wind geometry/efficiencies and sources. Keep those assumptions visible; do not present them as measured MPT efficiency, local sunlight or wind output.

**Finished when:** every number has a traceable input and every result is labelled measured, seller-rated or assumed. A full battery may curtail generation, so potential solar energy is not automatically accepted daily charge.

## 15 · Map each SOP to actual evidence and remaining work

1. Fill the table with actual files/logs. Use PASS only for the specific completed check; use preliminary/pending where appropriate.
2. For SOP 1, retain **22 respondents: Manila 16 BEMAC drivers; Malabon 1 TODA president +5 NWOW drivers**. Show each question's actual response count and group; do not invent missing responses or city-wide representativeness.
3. Keep approved SOP 3 wording/edition and questionnaire. Collect real IT/TODA ratings if available. Team checks and code inspection support testing; they are not substitute participant acceptability scores.
4. Build V-Model traceability from actual artifact IDs/revisions, not just a V-shaped picture. Pair each development level with its corresponding test below.
5. For depletion-forecast accuracy, save each forecast and its target, then compare with the actual matching depletion/end-point outcome under the defined test conditions. If that outcome has not occurred, do not compute a made-up MAE/RMSE; show the test method and pending outcome.

| Requirement | Evidence / calculation | If not established |
|---|---|---|
| SOP 1.1 charging frequency/arrangements/cost | Actual response counts, charging descriptions and reported costs | Preliminary selected sample; no invented mean/cost |
| SOP 1.2 depletion/operations | Actual reports of interruptions/lost service | No measured range improvement inferred |
| SOP 1.3 theft/tampering/security | Actual reported incidents and practices | No claim of proven incident reduction |
| SOP 1.4 regulation/structural constraints | Verified requirements, canopy/mount records and safety review | Removable does not imply automatic legal/structural approval |
| SOP 2 V-Model | Requirements↔acceptance; architecture↔system; interfaces↔integration; modules↔unit tests | Mark unperformed validation open |
| SOP 3.1 functional suitability | Participant tasks: monitor, locate, arm/disarm, inspect events | Actual approved questionnaire results required |
| SOP 3.2 usability | Participant completion/clarity/feedback on those tasks | A nicer UI alone is not acceptability data |
| SOP 3.3 reliability | Actual freshness, reset/network recovery and correct invalid states | Distinguish user ratings from measured test logs |
| SOP 3.4 performance efficiency | Actual response/data freshness and defined timing/resource evidence | No made-up latency/resource claim |
| SOP 3.5 security/maintainability | Roles/access checks, TLS, configuration/source documentation; expert ratings | No ISO certification claim |
| SOP 4.1 IP65 reference | Assembly/penetration/seal inspection and any actual standard-aligned test | Enclosure label is not whole-system certification; no rushed live water test |
| SOP 4.2 harvesting/net energy | Defined boundaries, V/I/time; E≈Σ[(Pi+Pi+1)/2 ×Δt/3600]Wh | Wind/on-vehicle results remain pending if not tested |
| SOP 4.3 tamper accuracy | Label normal/tamper truth; TP/FP/TN/FN; accuracy=(TP+TN)/N; precision=TP/(TP+FP); recall=TP/(TP+FN); F1=2PR/(P+R) | Undefined denominator=N/A; hand pilot is not full mounted validation |
| SOP 4.4 depletion forecasts | Actual paired prediction/outcome; MAE=Σabs(error)/N; RMSE=√(Σerror²/N) | No real outcome/reference means accuracy pending |
| SOP 4.5 transmission/autonomy | Actual paired send/receive timing and observed USB-free battery uptime | Current strict transmission timing lacks validation; stopped run is duration observed, not maximum lifetime |

For questionnaire means use Σ(frequency ×score)/actual responses, following the approved instrument. Keep nonresponses and expert/TODA groups identifiable. For codesign show: ADC divider with firmware scaling/validity; LTE supply/UART with TLS/retries; switch/IMU mount with debounce/FSM/false-alarm testing. For each, show the hardware choice, software response and real test record.

**Finished when:** each SOP/sub-SOP has an evidence reference or a clear pending item, and the spoken claim matches that status. Do not subtract the CPE load twice when using net battery energy.

## 16 · Finalize the diagrams and PPT from the actual build

1. Update one whole-system block diagram: solar/controller, battery/BMS/protection,12 V converter, CPE/sensors/alarm and wireless backend/app. Include the wind branch as planned/dashed when unverified.
2. Match the solar/electrical sheets to the actual topology and connector choice. If XT60 is adopted, replace the SB50 label at that boundary, preserve fuse location/polarity and show W5→ACS→W2. Leave no accidental wire-junction dots. Label gauges and offboard parts.
3. Keep the CPE schematic's existing GPIO architecture. Match connectors/power labels to the actual perfboard; distinguish measured calibration changes from wiring changes. Do not redraw a different circuit merely for cleaner appearance.
4. Update the actual deck in this order: problem/SOP 1 findings → objectives → architecture/V-Model/codesign → actual prototype/wiring → calculation assumptions → actual test evidence/SOP 3–4 → video/demo → limitations/next validation.
5. Replace placeholders with actual figures, captions and test status. Keep units and numbers consistent across PPT, diagrams, app and manuscript. The supplied Canva deck could not be read here earlier; this is a proposed sequence, not an audit of its unseen slide order.

**Finished when:** a viewer can trace solar→protected battery→CPE and distinguish planned wind/BEMAC paths from the demonstrated prototype. Every result slide has a real source/record or an assumption label.

## 17 · Correct the Gantt and archive the working version

1. In the shared Gantt, reconcile **Evidence Checklist E19:F20**: solar tests are credited while proof says pending. Attach actual test evidence when performed; otherwise keep actual completion unearned/projected explicitly labelled.
2. Fill **F24:F26** with actual CPE logs, app/firmware SHAs and function evidence. Reconcile preparation rows with the video, deck and rehearsal actually completed.
3. Separate **WBS8.5 defense completed** from the preparation aggregate. Actual defense remains uncompleted until it happens; preserve the actual-defense criterion0 before then. Correct the link/definition rather than overwriting a formula.
4. Use the sheet's E/F completion/proof inputs. Its visible71.25% overall /98.96% readiness are projected figures, not physical acceptance. Keep post-defense work visible; do not backdate today's work.
5. Save final working app revision, actual firmware/configuration privately, schematic revision, PPT/MP4 and raw evidence in two places. Keep private keys/tokens out of public downloads and slides.

**Finished when:** Gantt status matches evidence, the working build is recoverable and no result is marked complete merely because its planned date passed. The source-review download contains the exact prior findings; no external file has been edited automatically.

## 18 · Follow the actual 62-slide PDF script and rehearse the Q&A

The 29 October slide-matched guide uses GROUP 4_DP1 - TEMPLATE.pdf, 62 pages. Open Defense → Actual PDF: slide script and corrections. Earlier generic script prompts below are reference only; the new page-by-page script takes precedence. Canva itself was not edited.

1. Add short notes to each actual slide: **what it shows → its result/basis → what it does not yet establish → transition**. Use the new exact-page script first; replace bracketed fields only with actual results.
2. Match each speaker's explanation to the final slide/diagram, not an earlier design. Keep the live-demo operator's actions separate from the spoken explanation so the presenter is not improvising wiring.
3. Rehearse the questions below. If the evidence is pending, answer it directly and explain the next test; do not use white lies or call a scenario a measurement.

| Script block | Copy/adapt after actual evidence is entered |
|---|---|
| Problem / SOP 1 | “Our preliminary baseline includes22 selected respondents across the two locations, with different vehicle groups. These findings identify reported charging, depletion and security concerns; they are not a city-wide estimate.” |
| Design / V-Model | “We linked [requirementID] to [design revision] and [test record]. Hardware and firmware were developed together: [specific interface] required [specific software behavior], verified by [actual test].” |
| Energy computation | “The prototype is nominal 480 Wh; the BEMAC reference is 4416 Wh from its module labels. Solar yield is a planning scenario using declared sunlight/loss inputs. Our measured result for [interval] is [actual value/boundary], separate from the scenario.” |
| Results | “The demonstrated functions are [actual passes]. [Open requirement] remains unvalidated, so it is not included as a successful measurement.” |
| Demo transition | “We will show fresh wireless data, arm the system, trigger one monitored input and disarm. The backup video contains the recorded test if the live network becomes unavailable.” |
| Limits / closing | “The remaining validation is [actual list]. Wind energy and BEMAC road/roof integration are not claimed as measured DP1 outcomes.” |

| Likely question | Direct answer |
|---|---|
| Why4040 rather than solar rail? | Both can mount panels;4040 supports adjustable multi-component prototype mounting. Comparative strength/weight superiority was not tested. |
| Is it too heavy for BEMAC? | Panels alone are seller-listed 20 kg; total mass/roof loading is not established. Actual mounting feasibility requires vehicle-specific structural validation. |
| What proves range extension? | The shown km is an energy-equivalent proxy, not measured route range; a controlled vehicle test is still needed. |
| Why two current sensors? | They observe different defined boundaries: source output and net battery flow, after both measurement chains are validated. |
| Why negative ACS readings? | Validated negative current can mean discharge; an unexplained large negative is a fault/unvalidated reading, not proof of actual flow. |
| Why600 V/200°C18 AWG not automatically acceptable? | Those markings concern insulation/material; primary current, termination and fuse coordination still need establishing. |
| Why2 A? | A proposed prototype commissioning limit, subject to pack/controller approval and validated range; it is not a BEMAC setting or measured result. |
| Why1 A/5 A battery fuses? | They were preliminary search targets, not finalized approvals from actual branch/inrush data. Required devices were not obtained; the limitation must remain explicit. |
| Where does wind energy come from? | The hybrid table uses assumptions. Actual wind charging is unvalidated and excluded from measured totals. Riding airflow also creates propulsion/drag costs. |
| Is the assemblyIP65? | Enclosures are sold with that rating; the drilled/modified whole assembly has not been certified to it. |
| How was SOP 3 answered? | With the approved IT/TODA questionnaire and actual participant results if collected; software tests alone do not answer participant acceptability. |
| What proves autonomy/latency? | Actual USB-free observed run and defined paired timing. A stopped run is a lower bound; stale-data age is not transmission latency. |

**Finished when:** each slide has a short explanation, each claim has its basis and presenters can answer without inventing a value.

## 19 · Rehearse the live demo and its fallback

1. Before presenting, confirm the actual power source, firmware/app revision, current backend endpoint/internet and fresh LTE rows. Remove USB/adapter for the autonomous-power claim.
2. Show fresh monitoring and valid GPS; secure contacts and arm; trigger one input; show app event and actual sound; disarm and confirm silence. Keep any alarm test bounded and agreed with the venue.
3. Show actual solar charging if sunlight/charge headroom and the released system permit it. Explain small charging current honestly when the battery is near full. Show the VAWT as static/planned unless it has passed its separate test.
4. If the network fails, state that the live connection is unavailable and play the embedded recorded test. If a measurement is invalid, show its invalid status rather than a fabricated reading.
5. Repeat the full presentation once with the final PPT, actual hardware and fallback video. Freeze broad software/visual changes once that version works; repeat affected checks after a necessary fix.

**Finished when:** the group can perform the intended sequence, stop/disarm it reliably and recover using the real backup evidence.

## 20 · Transport, reassemble at school and perform the final check

1. Photograph final positions, label every unplugged pair and save the wiring/placement revision. Disarm; isolate PV and battery output; insulate separate live battery ends. Protect panels and restrain the battery for transport. Do not transport panels retained by questionable clamps.
2. Bring the final PPT/MP4 backups, private working app/configuration backup, firmware, USB data cable, multimeter, actual tools/fasteners and labelled spare materials. Keep the offline monitor and guide available.
3. At school, place parts in the marked positions while isolated. Check polarity/retention/insulation, then repeat rails, fresh wireless receipt and one bounded physical alarm test. Restore the current endpoint if the local backend/tunnel changed.
4. Check PPT/video playback, projector/display, network and the actual demo area. Record any final change and its repeated test. Leave the assembly disarmed and isolated when unattended.
5. School access ends9pm; defense is October29,12 noon–1pm. Preserve enough actual travel/setup margin rather than treating any earlier task time estimate as a guarantee.

**Finished when:** the setup is ready at the venue, evidence/video is playable, power can be isolated, and all presenters know the actual demonstrated functions and remaining limitations.

## Coverage · Where each requested item is handled

| Requested item | Steps |
|---|---|
| Whole dry fit, cable lengths, mounting problems |1–2,9 |
| Remaining ACS/PZEM/power wiring and calibration |2–4 |
| Backend fixes, wireless monitoring/tracking and three-state FSM |5–7 |
| Other-AI frontend integration and SOP 3 |8,15 |
| Continuous CPE use for battery headroom/autonomy |7–8; solar interval starts10 |
| Whole-system solar test |10 |
| VAWT without stand / how to explain it |11,14,18–19 |
| Required working video |12,19 |
| Size, mass and BEMAC feasibility |1,9,13–14 |
| Computations, SOPs, codesign and V-Model |14–15 |
| PPT, block/solar wiring diagrams |16 |
| Gantt, evidence and recoverable backups |17 |
| Scripts and Q&A |18 |
| Live demo, transport and school reassembly |19–20 |

Additional essentials included: source isolation, final mounted-input retest, actual firmware/app revisions, evidence boundaries, offline MP4 playback and recovery backups. Eight hours is a target only; unresolved hardware cannot be turned into a pass by compressing the schedule.

## References and working links

- [Public SOLAIR guide](https://solair-dp1-final-workday.chirpychime65.chatgpt.site) — Start contains this ordered guide; Electrical/CPE tabs retain detailed pin tables and diagrams.
- [AMASS XT connector catalogue](https://www.china-amass.com/public/upload/20260207/7fa24f5a6f35ec66c7a115c07a34ab06.pdf) — XT60 series cable/connector reference; not verification of an unidentified copy.
- [UL758 scope](https://www.shopulstandards.com/ProductDetail.aspx?productId=UL758) — appliance wiring material standard; voltage/temperature marking alone does not specify the installed circuit's permissible current.
- [Allegro ACS758](https://www.allegromicro.com/en/products/sense/current-sensor-ics/integrated-current-sensors/acs758) — sensor IC reference; the breakout's PCB/terminals still require their own rating review.
- [NASA product realization](https://www.nasa.gov/reference/5-0-product-realization/) — verification and validation evidence basis.
- [ISO/IEC25010:2011](https://www.iso.org/standard/35733.html) — preserve the study's approved edition/terms; no certification claimed.
- [NREL PVWatts technical reference](https://www.nrel.gov/docs/fy14osti/62641.pdf) — existing solar-loss model reference; planning assumptions remain distinct from observations.
- [Team Gantt](https://docs.google.com/spreadsheets/d/1jSECB6eV-FeHrZRTE8qgIFxjEmS-M5lTkNhKTHazcyA/edit) and [team PPT](https://canva.link/3pgroszj5xsnem1) — no external edits made by this guide update.

This guide does not create new physical PASS results. The optional XT60 route is proposed until the group installs and checks it. Existing unresolved measurement/protection requirements remain visible.

# CPE remaining work in parallel — 22 October 2026

## Active sequence — 22 October afternoon

This section supersedes the old 02:xx supply-observation/upload order below. Do not repeat the completed voltage reading or ask for the same chip/pin inventory. Actual uploaded firmware remains 2.0.12 until a new device report establishes otherwise. Integrated 2.0.14 is compiled/prepared, with runtime address commissioning and the prior 2.0.13 diagnostics; see `LTE_RUNTIME_DESTINATION.md`.

Work proceeds in parallel:

| Work | Action and completion evidence |
|---|---|
| Backend/firmware | Restore a reachable public ingest address, validate TLS and engineer-only address discovery, prepare one integrated upload. A temporary host that fails its live probe must not be called ready. |
| Connected device after software is ready | Follow `LTE_RUNTIME_DESTINATION.md`: one integrated upload, device-confirmed saved address, then actual LTE server receipts with USB forwarding off. Keep existing wiring. |
| Groupmate at unpowered bank | Finish the already approved soldered/insulated Y joints; measure complete cold resistance and insulation to its metal mounting plate. No WAGO purchase is required by this topology. Keep unfinished bank disconnected. |
| Hardware documentation | Reconcile actual carrier power/logic/USB/protection and matching BOM. This is a final release requirement, not a reason to restart demonstrated LTE bring-up. |

After the bank is electrically complete, use `PZEM_12V_RESISTOR_FULL_GUIDE.md` for its protected load/current-reference test. ACS still needs adequately resolved known-current reference points, repeatable zero and stable input; the small 0.12 A bank alone cannot prove useful 50 A sensor accuracy. Preserve quiet-zero evidence and keep calibrated amperes invalid until that separate acceptance passes. Remaining ADS reference accuracy, mounted motion and combined recovery/soak stay on the final checklist. Do not re-run the completed basic siren/GPS/contact/IMU/LED sequence to fill waiting time.


Use this order with the latest CLOUD_CONTINUATION entry. Preserve the existing GPIO architecture, wiring and completed observations. This is the backend/firmware team's plan; it does not commission the frontend overhaul or create another website.

## Current position

> Userstoppedforthe night at02:55. Sellerdescriptionhasnoelectricalspecification; donotaskforitagain. ReadlatestCLOUD_CONTINUATIONbeforeusingearlierteststeps. No3minutecapturecompletionorphysicalshutdownisconfirmed. Bankstillunfinished, converteroutputdisconnected, actualfirmware2.0.12; candidate2.0.13remainsonhold.

> Latest02:37 result: user measured modemVCC4.3–4.7V with no visible modemrestart; ESP32resets user-reportedintentionalwithuncertaintiming. Actual2.0.12LTEdeliveryresumed02:32and02:35. Hold2.0.13upload and additionalresettests. Determinewhereexistingstep-downOUTPUTconnectsbeforechangingpowerwiring; measuredvariationisnotproof ofacarrierlimitviolationorsolecause.

- Basic USB streaming, IMU, contacts, LED, five-second siren cutoff, manual stop, held-reset silence and disconnected-control silence have supporting observations. Do not restart these checks.
- The supported outdoor GPS walk and earlier actual GPS delivery over LTE passed their bounded tests. Earlier backend-path outage/recovery also passed; this is not proof of every RF outage or lossless replay.
- Current 2.0.12 USB reports advance normally. LTE repeatedly times out on AT, before an HTTP upload. Some AT waits receive 120 bytes; their contents are unknown in that version. Recent ACS ADC readings also dip below the earlier quiet baseline. Neither timeout nor a byte count proves a particular electrical/software cause.
- User confirms the resistor bank still lacks solder/finished connections. Available equipment: existing 12 V adapter, step-down converter, siren, four 100 Ω resistors and DT830B with **10 A UNFUSED** input. No other ready load is identified. The source and converter are not calibration loads.

## Work that can run together now

| Owner | Work | Record / stopping point |
|---|---|---|
| Person at connected CPE | One bounded voltage observation during the LTE failure, below | Modem VCC while uploads stopped; lowest displayed VCC during one request; LED restart yes/no; test start/end times |
| Groupmate at a separate, unpowered bank | Finish existing approved soldered joints once the iron/solder are available; then cold-check the existing 100 Ω topology | Actual end-to-end resistance; each bank terminal to bare plate must show no DC continuity; secure/insulated terminations. No powered test while unfinished |
| Backend/firmware work | Verify current server/endpoint, review actual receipts and retained passes, fix evidenced software defects and prepare one useful diagnostic capture | Real receipt times/transport/boot/sequence, build/test records. Do not fabricate a physical PASS from a fixture |
| Hardware documentation work | Collect exact carrier/BOM and power/USB/interface evidence; reconcile the existing diagram | Confirmed vs unresolved nets. Do not energize a proposed supply change or treat a similar board's schematic as this carrier's documentation |

People may work simultaneously on separate unpowered parts and read live data. Only one person changes the connected circuit, with its supplies off. Do not have someone rewire the powered CPE while another person probes it.

## Immediate connected test: supply observation, no upload

> Latest adjustment at02:31: a new2.0.12run has reached registration, and earlier actualLTEdelivery was confirmed. Leave that current request running; measure itsVCCrange/LEDbehavior for60seconds without anotherStart/Stop/reset. The stopped-voltagebaseline below can wait. Clarify whether the three02:29ESP32resets were intentional before classifying them.

1. Leave bank disconnected and existing CPE wiring untouched. Use the current 2.0.12 setup and keep **Forward USB readings to server checked**.
2. Click **Stop LTE streaming** once. Do not repeatedly click Start/Stop.
3. DT830B: black lead in **COM**, red lead in **VΩmA**, selector **20 V DC**. This is a voltage test, not the 10 A current mode.
4. Black probe touches the modem carrier's existing **GND** connection; red touches its existing **VCC** connection. Use accessible metal at those two connections without bridging adjacent pins. Do not move supply wires or probe an unidentified pin. If the points cannot be reached safely, stop and report that limitation.
5. Note displayed voltage with uploads stopped. Click **Start LTE streaming** once, keep probes steady, and observe for **60 seconds**. Note the lowest displayed voltage and whether the modem LEDs visibly repeat their startup behavior. Keep hands/wires off the ACS input during this observation.
6. Finish after that single capture. Return the three observations and its time. The backend team correlates actual device samples; do not run another zero capture or copy hundreds of RX lines.

Stopping uploads does not power off the modem. A slow handheld meter cannot rule out brief dips. A voltage fall or startup observation is evidence to investigate, not proof of a precise carrier voltage limit or the sole root cause.

```text
Capture time:
Modem VCC with uploads stopped: ___ V
Lowest displayed VCC during the LTE request: ___ V
Modem LEDs visibly restarted: yes / no / cannot tell
Bank: unfinished / finished; cold resistance ___ Ω
```

## Decide the next LTE action from that result

- If the modem visibly restarts or the supply falls during attempts, review the actual supply/harness and carrier requirements before another calibration run. Do not select a replacement voltage, connect an undocumented VDD/EN/PWR pin, or parallel USB and converter outputs by guess. The previously reported idle 4.6–4.7 V does not settle this question.
- If AT still times out and that observation does not isolate the cause, use prepared **2.0.13** for one informative integrated capture. It retains current wiring/configuration and adds a privacy-limited modem response summary. It also fixes a code defect where embedded NUL bytes could conceal a later complete OK line; its physical relevance remains unproven.
- The summary distinguishes no input, binary data/PPP flags, recognized startup/shutdown notices and numeric result lines. These are clues, not automatic success or a unique diagnosis. Raw responses, SIM identities, APN and credentials are not logged. Complete AT responses still gate progress.
- For that capture only when instructed: disconnect website USB and close Arduino Serial Monitor; reopen `firmware/arduino-ide/solair_cpe/solair_cpe.ino` from disk; retain ESP32 Dev Module, installed core3.3.12, existing port and private configuration; upload once. Refresh/reconnect115200, verify2.0.13 and keep USB forwarding ON. Start once if paused, wait60seconds and report “2.0.13 capture complete” with the time. The backend can read `cpe.lte_at_diagnostic` directly, including in the Modem command response line.
- A fresh LTE201/200 alone with USB forwarding ON can be a duplicate. For independent delivery, leave serial monitoring open, uncheck USB forwarding and verify **new persisted transport=lte** reports. Then verify autonomous stream recovery after the required restart on the accepted build. Earlier successful delivery is retained, but the current AT failure must close.

## Combine measurement work once the bank and supply are ready

| Work | Efficient combination | Evidence needed before calling it passed |
|---|---|---|
| PZEM loaded measurement | Use the completed existing bank, protected12V source and actual four-screw shunt. Preserve serial wiring. The complete endpoint/wire/fuse guide is PZEM_12V_RESISTOR_FULL_GUIDE.md, with the latest no-WAGO soldered-branch option in CPE_TODAY_STEP_BY_STEP_2026-10-21.md | Measured cold resistance, loaded V/A/W, correct shunt sense/load path, reference comparison. Around12.3V/100Ω predicts0.123A/1.51W; theory and rounded UI values are not an accuracy certificate |
| ACS mandatory calibrated current | Put ACS and the PZEM shunt in the **same reviewed current path** for useful shared captures. Final actual wiring instructions must identify the sensor's primary terminals, existing load, branch protection, meter series harness and source before power | Stable input/zero in the intended operating condition; measured useful current references at multiple levels across the claimed range; repeatable return to zero; polarity if claimed. Keep ACS current null until accepted |
| Existing siren as a possible load | Assess its actual label/current and whether its draw is stable enough for a short comparison; no new purchase is assumed | A suitable independently measured current, existing fuse/source/connector limits and complete series wiring. Its successful sound test does not prove adequate calibration current; the adapter/buck alone is not a useful load |
| Missing ADS numerical evidence | Record the actual comparison missing from the previous successful ground/reference check during the measurement session | Exact meter reference, ADS channel value and instrument/error limits. Do not restart I²C scanning or subtract a guessed offset |

The four-resistor bank remains two200Ω series branches in parallel, total100Ω. Do not change it to25Ω without a separately reviewed complete procedure. At12V its ~0.12A is useful for initial PZEM response but cannot by itself establish useful50A ACS accuracy with the recorded noise. If available equipment cannot validate the thesis's required current range/error, record that concrete limitation rather than approve it or invent a tolerance.

The DT830B10A input is UNFUSED. Any later current test requires externally protected low-voltage series wiring and the actual meter's limits. Never place that current-mode meter across the source. This plan is not yet an instruction to move the meter to current mode or energize the unfinished load path.

## Final combined run and release

After the active faults and electrical interfaces are resolved, combine the remaining final checks in the existing recommended **at least60-minute** run: all approved modules and intended LTE delivery, GPS uncovered with the successful carry arrangement, load/PZEM/ACS measurements, Wh progression, responsive local security, required mounted-motion commissioning and matching server history/events. Observe relevant restart/network recovery and one correctly prepared buffered-event replay; verify event identity and once-only persistence. Schedule changes that interrupt power/load outside continuous measurement windows and label them, rather than claiming one uninterrupted soak. A configuration/conditioning change after the run may require relevant revalidation.

Do not spend this run repeating the already passed basic siren/switch/GPS bring-up. Do not perform unreviewed live sensor-disconnection or power-supply rewiring to create a fault. Keep retained history distinct from live data. Record resets, gaps and queue losses rather than hiding them.

Close the exact carrier input/logic/VDD direction, RS485 module rating, PZEM power/isolation, ACS conditioning/protection and USB/external-source selection before release. Current temporary hosting is a bench dependency; final deployed LTE operation requires its agreed reachable backend, not an assumption that a SIM automatically hosts the server.

Then archive the matching firmware/configuration identity, calibration range/error, BOM, power-domain diagram, connector/protection schedule and actual evidence for the one revision-controlled thesis schematic. Drafting verified nets can proceed in parallel; assembly release and “final CPE” require the unresolved electrical and measurement gates to close. No completion percentage or time promise follows from this plan.

# CPE fresh review and finite finish sequence

**Current user direction, 23 October:** stop the proposed ACS switching/calibration test. Show raw output only for the immediate step: latest supplied A1 1.1641 V (9313 counts), inferred sensor output ≈2.328 V before the nominal equal divider. No new measurement, current accuracy PASS or final-ACS waiver. The procedures below are reference only, not an instruction to resume without a new user request.

**Latest live step, 23 October:** user reports soldered ACS leads and loaded readings A1 1.1641 V / PZEM 10.91 V, 0.11 A, 1.2 W, 5 Wh; user confirms no load-only switch. One preliminary unloaded comparison can use power-OFF removal of only the bank external positive feed, insulation/secure restraint of the freed supply end, then USB-first/12 V-second restoration. This is not the continuously powered three-window protocol below and cannot establish calibration across the restart. User wants brief chat instructions, no wiring/solder photographs; do not replay older connection or purchase instructions. No unloaded result yet.

23 October 2026, Asia/Manila. This is the active procedure for the user's request for a fresh assessment. Earlier measurements and PASS statements remain historical records; this review does not independently accept them. No hardware was operated, no ESP32 was uploaded, and no calibration was enabled.

**New direct information:** the user confirms that the ACS758 has bare large IP+/IP− pads/holes, with no terminals. First complete those two mechanical/electrical connections, with all supplies disconnected. This is a prerequisite to a dependable test, not a diagnosis that it caused every previous problem.

## What the fresh source review establishes

| Area | Implemented in the actual source | Still needs actual-system evidence |
| --- | --- | --- |
| ACS/ADS | Checked ADS A1 acquisition, fresh raw readings and a gate preventing uncalibrated amperes | Secure primary connections, stable zero, independently referenced response and accuracy across the claimed operating range |
| PZEM | Modbus CRC/address checks, 50 A range readback, current/power/energy telemetry | Delivered shunt's A/mV compatibility and independent reference/energy checks |
| Contacts, IMU, alarm | Debounced lid/mount inputs, motion gate, local trigger, bounded alarm duration and software OFF at startup | Meaningful enclosure mounting, calibrated motion behavior and electrical OFF through reset/disconnected control |
| GPS and concurrent UARTs | GPS software RX32; PZEM UART1; LTE UART2; USB UART0 | Outdoor fix/stale behavior and concurrent operation on the installed hardware |
| Backend | Authenticated schema-checked ingestion, persistence, replay/deduplication handling | Real device-to-backend observations for the final hardware/configuration |
| LTE | Verified TLS, retry, saved streaming intent, NVS event buffering | Independent power-up/reporting, stable online receiver, outage/power-loss recovery and finite buffer behavior |

Keep the actual firmware and GPIO map while qualifying hardware. The source identifies itself as `solair-cpe-2.0.17`; this does not establish which build is currently on the device. No fresh upload is justified by this review. Existing private configuration, credentials, databases, BEMAC artwork and frontend work are preserved.

## ACS: complete the two current connections first

For this low-current / 12 V bench circuit, use **18 AWG insulated stranded copper**. Position the unpowered ACS so each routed distance from its pad to the bank-return terminal or shunt load stud is at most **12 cm**. Then cut **two 15 cm pieces: 30 cm total**, one per **designated board current pad**. The extra length allows terminations and modest slack; do not tension the wires. If that placement is impossible, measure the actual routed distance and add 3 cm before cutting rather than silently assuming 15 cm will reach. Existing suitable 18 AWG wire can be reused. These are deliberate bench layout dimensions, not a sensor datasheet requirement or a final enclosure harness length.

Use the wire only where it fits the pad/hole correctly. Have a competent person solder it with a suitable electronics iron and solder. Do not cut strands to force a fit or solder to guessed IC legs. Insulate exposed connections and clamp/tie each cable to the mounting support so cable movement cannot pull the copper pad off the board. Connect the bank-return end directly to its proper load terminal and the shunt end to its proper lug; this avoids adding an unnecessary inline connector. Preserve the removed old return lead as a spare.

The shunt-end lead needs a properly crimped ring/fork matching its large current stud and the wire size. The load-end lead needs the actual load's compatible termination. Bare wire is suitable only for a screw clamp specified to accept that conductor; use the appropriate ferrule where required. A matching board terminal block is an alternative only after checking footprint, mounting and current rating; fitting it normally also requires soldering. Loose wires through holes, signal headers/Dupont leads and arbitrary bolts through solder pads are not a dependable primary-current connection.

This permits a low-current bench test only. Neither 18 AWG nor a generic breakout is thereby approved for a 50 A installation. If no suitable iron/person or compatible termination is available, that is the immediate missing item; do not energize loose connections. Completing two pigtails now does not release the rest of the CPE for assembly.

## Why the present small bank may not settle the question

Allegro specifies the **050B** as bidirectional, nominally **40 mV/A at 5 V**, with zero near VCC/2 and an increasing output for IP+→IP− current. Both zero and sensitivity depend on supply voltage. With equal 10 kΩ divider resistors, the nominal ADS sensitivity is 20 mV/A. A designed 100 Ω load at 12 V therefore produces about 0.12 A and only **2.4 mV** at ADS A1. The specified typical sensor noise under the datasheet's stated condition is 10 mV at the sensor output. This explains why that small load is a weak decisive test; it does not prove this board's noise or failure. [Allegro datasheet](https://www.allegromicro.com/-/media/files/datasheets/acs758-datasheet.pdf).

**The user now confirms only the existing bank is available. Keep it intact and use it for the first screen after secure primary termination. No new resistor/load purchase is ordered.** That screen can establish a response only if the small change is distinguishable; otherwise record inconclusive and stop, without treating it as proof of sensor failure or final current calibration.

If a stronger reference later becomes necessary, one possible fixture is a documented **12 Ω power resistor**, mounted/coolable for at least the actual dissipation (12 W at 12 V; about 13 W at 12.5 V). A bare “25/50/100 W” marking is insufficient if that rating requires a heatsink; follow its free-air/mounting specification. This is an explanation of a possible stronger fixture, not the current instruction or an owned part. A siren is not automatically a stable reference load.

## One complete, conditional ACS response test

### Required parts and retained supplies

- Existing identified 12 V / 5 A DC adapter, existing inline **2 A fuse and fitting holder**, securely insulated positive and negative branch harnesses, ACS with completed pigtails, and the PZEM/shunt circuit already in use. Source current capacity does not specify actual load current.
- The **existing assembled resistor bank**, with its existing secure terminal connections and thermal mount. Its design is nominally 100 Ω; this is not a new physical resistance measurement or an independent accuracy reference. Do not rewire its internal resistor arrangement.
- A **load-only DC switch** with documented voltage/current ratings covering 12 V and this load, with compatible insulated terminals. Use an existing suitable switch if available. No loose-wire live switching; do not infer wiring for a multipole isolator from a two-terminal switch diagram. An absent suitable switch/terminal is a genuinely missing item.
- 18 AWG primary leads for this short low-current fixture; 22 AWG signal/sense leads with appropriate ends. Primary load current stays off the breadboard.
- Existing HCW-P715 sensor supply and USB-powered ESP32/ADS signal circuit, retained as described below. The converter input remains on its existing source connection, independent of the load switch. **The powered stage requires that existing input branch to be securely terminated and adequately protected; this review has not established those facts.** The drawing covers the load/PZEM branch only. Do not move the HCW feed onto its 2 A fuse or create another HCW feed. A loose/unfinished/unprotected source branch blocks energization, not the unpowered pigtail work; no repeat VCC measurement resolves that protection question.
- Existing multimeter for **DC voltage only** in this procedure: black lead in COM, red in V/Ω, appropriate DC voltage range covering 12 V (20 V on the recorded DT830B). Do not put its unfused 10 A input across any supply. Resistance/tolerance/temperature and meter uncertainty must be known before V/R is used as an accuracy reference.

Disconnect every supply before changing any conductor. Keep battery, solar, wind and siren power disconnected. Pause LTE uploads for this initial response capture. Do not change existing modem power/UART wiring or add capacitor experiments to this test.

### Primary circuit, including both supply branches

Label the shunt's **load stud** as the large stud presently receiving the load return, and its **source stud** as the large stud presently connected to the adapter negative return. Keep its two small sense leads unchanged; do not infer their positions from a rotated generic photograph.

| Wire | Exact endpoints |
| --- | --- |
| Source positive | Identified adapter 12 V positive output → existing inline 2 A fuse holder input |
| Protected positive | Fuse holder output → existing insulated positive branch harness |
| Meter voltage positive | That positive branch → existing PZEM positive measurement-voltage terminal |
| Switched load feed | That positive branch → load-only switch terminal 1 |
| Load input | Switch terminal 2 → chosen load terminal/leg 1 |
| Load return into ACS | Chosen load terminal/leg 2 → soldered ACS IP+ pigtail |
| ACS return into shunt | Soldered ACS IP− pigtail → shunt large **load stud** |
| Shunt return | Shunt large **source stud** → existing insulated negative branch harness |
| Source negative | That negative branch → identified adapter 12 V negative output |
| Meter voltage negative | That negative branch → existing PZEM negative measurement-voltage terminal |
| Shunt sensing | Keep both existing small-stud-to-PZEM sense wires in their established positions; no load current through these wires |

The load's two terminals are interchangeable for a nonpolar resistor. For the retained bank, terminal/leg 1 means its existing positive input and terminal/leg 2 its existing negative return; leave internal resistor wiring intact. Make these supply splits with separate proper terminals or correctly joined/insulated branch harnesses, not stacked conductors in unverified clamps. Remove any old direct load-return wire that would bypass ACS or the shunt.

```text
Adapter 12 V + ── 2 A fuse ── insulated positive branch
                                    ├── existing PZEM voltage +
                                    └── load-only switch ── load leg 1
                                                            [LOAD]
                                                          load leg 2
                                                              │
                                                           ACS IP+
                                                        internal conductor
                                                           ACS IP−
                                                              │
                                                    shunt LARGE load stud
                                                         shunt element
                                                    shunt LARGE source stud
                                                              │
Adapter 12 V − ───────────── insulated negative branch ─────────┘
                                    └── existing PZEM voltage −

Keep the two separate small shunt-sense wires to PZEM unchanged.
The existing HCW input supply stays outside the load-only switch.
IP+ and IP− are in SERIES with the load, never across source + and −.
```

### Small ACS/ADS wiring: every endpoint

| Connection | Endpoints |
| --- | --- |
| ACS supply | HCW output +5 V screw → separate ACS positive rail → ACS small VCC |
| Signal reference | HCW output negative → signal-ground rail, already joining ACS small GND, ADS GND and ESP32 GND |
| ADC supply | ESP32 3V3 → ADS VDD |
| ADC bus | ESP32 GPIO21 → ADS SDA; GPIO22 → ADS SCL; retain existing address wiring |
| Upper resistor | First leg of existing 10 kΩ resistor → ACS small OU1/VOUT; second leg → divider midpoint |
| Lower resistor | First leg of other 10 kΩ resistor → divider midpoint; second leg → signal-ground rail |
| ADC input | Divider midpoint → ADS A1; retain existing GPIO34 connection/reservation |

Do not join the converter's positive output to the ESP32 USB-fed 5 V rail. Do not connect raw ACS output or 5/12 V directly to ADS A1/GPIO34. Keep existing bypass components; no large output capacitor or guessed offset is prescribed. ADS input voltage must stay within its powered supply rails; choosing ±4.096 V conversion range does not raise those rails. [TI ADS1115 datasheet](https://www.ti.com/lit/ds/symlink/ads1115.pdf).

```text
HCW +5 V ── separate ACS supply rail ── small VCC
HCW GND ── signal GND ── small GND / ADS GND / ESP32 GND

ACS OU1 ── 10 kΩ ──┬── ADS A1
                   ├── GPIO34 (retained/reserved)
                   └── 10 kΩ ── signal GND
ESP32 3V3 ── ADS VDD; GPIO21/22 ── ADS SDA/SCL
```

### Upload, power-up, observation and stopping point

**Arduino IDE: no upload for this wiring test.** Preserve the installed program/private settings. Close Arduino Serial Monitor if SOLAIR needs the same port. Open the existing CPE Lab at **115200 baud**, with USB forwarding enabled and LTE uploads paused. Confirm that its selected source is ADS A1 before interpreting A1 results; if source/status differs, report that specific mismatch instead of flashing another diagnostic. Keep `ACS_CALIBRATED=false`.

1. With load switch OFF, inspect secure insulated connections, correct fuse/holder and absence of a bypass return. Power ESP32 by its existing USB first, then the existing 12 V/HCW supply. Leave 30 seconds to settle. No repeat VCC, unloaded converter or bank-resistance check is requested.
2. Record **Z1: load OFF, 60 seconds** of fresh raw A1 readings. Record times. An actually open load branch establishes zero primary load for this fixture; a PZEM communication error does not establish zero.
3. Turn only the load switch ON. Wait 2 seconds, then record **L1: 60 seconds**. With the meter still in DC voltage mode, measure directly across the bank inputs once: red on its positive input, black on its negative return, then remove probes. Record voltage. For the designed 100 Ω bank near 12 V, calculated current is about 0.12 A; expected ADS change is of order 2.4 mV at nominal sensor supply. These are predictions, not target values to force or independently measured reference values.
4. Turn only the load switch OFF. Wait 2 seconds, then record **Z2: 60 seconds**. Leave switch OFF. Retain all samples, faults, excursions and exact times; do not issue ZERO or alter zero/gain between states.
5. Stop power immediately for a hot/loose terminal, smoke, source cycling, fuse opening, repeated MCU reset or ADC rail/invalid acquisition. A power resistor itself will heat: use its specified mount and avoid touching it. Switch off 12 V first, then remove USB before touching conductors, so ACS does not remain powered into an intentionally unpowered ADC.

Review the complete three windows once. Define D = mean(L1) − mean(Z1), drift = mean(Z2) − mean(Z1), and S = the largest within-window standard deviation. A conservative engineering detectability screen requires correct positive direction and D greater than both |drift| and 3S. A failure to meet this screen is **inconclusive/fail for this screen**, not proof of a defective sensor. End that experiment; do not repeat unchanged captures or subtract a guessed constant. Meeting it is **basic response evidence only**, not an accuracy specification; final zero drift/error limits must come from the declared current requirement.

If further isolation is necessary, select one specific comparison from these recorded results—for example raw OU1 voltage versus A1 for a suspected divider/ADC error. Do not start another general supply/bank/upload cycle. A suspect sensor can be compared with a known-good unit; replacement is not a claim that the existing unit is proved defective.

## Turn a response into validated current

Define the thesis's actual current range and allowable error/resolution. A ±50 A part label neither validates 0–50 A nor requires a 50 A bench test. Obtain independent reference points spanning the range that will actually be claimed, and separate check points not used to fit calibration. Include both directions only if bidirectional measurement is claimed. The present approximately 1 A fixture cannot validate a larger range by extrapolation.

For a resistive reference, use I = V/R with stated resistor tolerance, hot resistance/temperature uncertainty and meter uncertainty. If those are inadequate for the required error, a better reference is genuinely required; PZEM is a cross-check until independently qualified, and cannot validate itself. No particular instrument purchase is ordered.

Calculate measured zero and slope, document residual errors and repeatability, then enable calibrated current only after acceptance. In existing code the equal divider needs reconstruction scale 2; zero and sensitivity are expressed on the reconstructed sensor-output side. Do not mix sensor-side and A1-side units. Compile and consolidate one configured firmware upload only when real coefficients exist. Do not auto-tare on boot when real current may be flowing. Verify zero/current again after power cycle and with LTE active, retaining invalid/stale/disconnected states honestly.

## The rest of the CPE: finite release gates

| Step | Concrete completion evidence |
| --- | --- |
| 1. ACS + PZEM | Referenced current across the declared range, correct shunt A/mV and PZEM 50 A setting, voltage/power and timed energy cross-check. Both meters are required. |
| 2. Mechanical tamper + motion | Lid and mounting plate operate their respective contacts; open/released states reach local alarm and matching backend event. Tune/check IMU in its actual mount. |
| 3. Independent LTE | Real new LTE frames arrive with USB data forwarding absent, ESP32 running on its reviewed field supply, and after cold boot with no browser button. Use a stable always-online HTTPS receiver. |
| 4. Combined + faults | All required channels run concurrently; GPS loss becomes invalid/stale; network/server interruption preserves local security and tests retry/deduplication; power loss tests event recovery and finite queue capacity. Observe a defined combined run, e.g. 60 minutes, without treating duration alone as PASS. |
| 5. Freeze and assembly | Freeze actual BOM, interfaces, firmware and calibration with evidence. Release one matching full schematic and physical socket/wiring layout only after source selection/USB backfeed, modem carrier levels/power peaks, protection, reset-safe outputs and connector geometry are resolved. Repeat functional/insulation/polarity checks after soldering. |

The current code has two deployment facts to address explicitly: saved `LTE ON` intent resumes after reset, but an unset first LTE-only boot is paused; **security boots DISARMED and currently requires a USB ARM command**. Reporting and arming are separate. Decide and implement/test the intended field arming method before calling security autonomous. The PPP implementation currently requires LTE-only mode; general Wi-Fi-to-PPP fallback is not established by this build.

The repository's endpoint-discovery scripts describe a **temporary tunnel to laptop services**, not independently hosted service. This review did not open private provisioning to determine the live device destination. Field release needs a stable receiver that stays running without the laptop, or an explicitly accepted continuously running gateway arrangement. A web dashboard on the laptop is not by itself that proof.

### The two KW11 switches fit ordinary enclosure mechanics

The closed lid presses switch 1 via a small bumper/rib; a fixed mounting plate presses switch 2 only while the enclosure is attached. Mount each body by its proper mounting holes/bracket, adjust for reliable actuation, and use an enclosure hard stop so the switch does not carry the closing force. Do not invent travel/hole dimensions from the KW11 name. [Schlage cover-tamper example](https://kc.allegion.com/kb/article/has-the-main-printed-circuit-board-used-with-all-ad-series-products-been-updated/), [Omron actuation guidance](https://components.omron.com/us-en/system/files/2021-12/ds_related_pdf/B149-E1.pdf).

Use actual contact markings/unpowered continuity to identify COM and NO; terminal position is not universal. Each COM → ESP32 logic GND. Lid NO → GPIO25; mount NO → GPIO26; insulate unused NC. Use 22–24 AWG insulated signal leads with suitable solder/crimp ends and strain relief. No external 5/12 V. Existing firmware uses pull-ups and 50 ms debounce: pressed closes COM–NO = LOW/secure; released = HIGH/tampered. No person holds the switches. The simple two-wire circuit detects an open wire as tamper but cannot detect a short that imitates a closed contact.

## Software verification performed in this review

Node **v24.22.0**: TypeScript check PASS; 71 targeted existing CPE/authenticated-ingest/rollback/deduplicayoution/ingress/serial/LTE destination/proxy fixtures PASS. Existing host C++/Python ACS native/ADS acquisition, verified ADS transaction/error handling, local security/alarm timing, PZEM decoding and LTE TLS/destination fixtures PASS. No working database, secrets or private provisioning were opened. These are software results, not compilation of a fresh provisioned firmware, physical measurement, device upload or CPE acceptance.

Immediate next action remains **secure the two bare ACS primary pads while unpowered**, using the two measured 15 cm 18 AWG leads where the stated layout fits. The existing bank is selected; powered testing still requires the actual load-only switch/terminations and source protection. Earlier open-ended capture, new-load and capacitor suggestions are not instructions to repeat or purchase them.

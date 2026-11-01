# ACS input conditioning and bounded qualification — 23 October 2026

**Latest actual inventory:** user has a 104 ceramic (100 nF; quantity/voltage rating not established), 470 µF / 25 V and 1000 µF / 25 V electrolytics, and a 100 µF / 25 V electrolytic. The proposed 10 µF ceramic is absent; do not install this filter as written or substitute those electrolytics at A1. The existing LONQ 4B DC isolator is only a possible bank-switch candidate, with actual setup/path still to be established; no new switch purchase or rewiring is ordered here. No physical installation or qualification has occurred.

User requests one complete procedure. This is a proposed hardware conditioning experiment and its decision path, not a diagnosed repair or an assurance that ACS can be finalized with the current parts. No hardware change has been performed. Keep the 48 V / 13S battery disconnected. Preserve the 12 V bench, GPIO architecture and uploaded 2.0.17 firmware. The user's 4.65 V DC supply observation is complete; do not repeat VCC, unloaded HCW, bank resistance or basic module tests.

The proposed filter targets noise in slow DC telemetry. It cannot correct actual DC supply variation, drifting sensor zero, wrong connections or inadequate reference/range evidence. A failed result ends this experiment; do not start another unchanged capture loop.

## Exact switch identification example

Maintained SPST ON/OFF means two positions that stay where set and two electrical terminals. Require a documented rating of at least 24 V DC / 2 A; a 125/250 V AC marking alone is not a DC rating. Prefer screw terminals. One manufacturer-verified example is NKK S301T: screw-lug SPST ON/OFF, resistive rating 20 A at 30 V DC ([manufacturer catalogue](https://www.nkkswitches.com/pdf/Toggles.pdf)). An equivalent documented switch is sufficient; no brand purchase is required. Existing LONQ 4B may avoid buying another switch once its actual setup/availability is established. Do not infer its wiring from the two-terminal toggle example.

## Required physical parts

Existing: ACS758 board, ADS1115, ESP32, the two installed 10 kohm divider resistors, PC USB, HCW-P715 with its existing 12 V / 5 A adapter connection, separate converter-fed ACS positive rail, shared signal ground, assembled nominal-100-ohm bank, existing 2 A fused bank/PZEM branch, existing branch harnesses, PZEM/shunt and working communication wiring, DT830B.

Additional parts, **not confirmed owned**:

| Part | Exact proposed use |
| --- | --- |
| One 100 nF ceramic capacitor, at least 10 V | Local bypass between ACS small VCC and small GND, mounted close to those pins. Nonpolarized. |
| One 10 µF ceramic capacitor, at least 10 V, preferably X7R | From ADS A1/divider midpoint to ADS GND, close to the ADC. Nonpolarized. Do not substitute an arbitrary electrolytic whose leakage is unknown. |
| One SPST switch with a documented DC rating of at least 24 V DC / 2 A and suitable terminals | Bank-only on/off control after the existing fused positive split. It must switch the bank without switching the HCW/ACS supply or PZEM voltage feed. An AC-only rating is not the required DC rating. |
| Short 22 AWG solid copper signal leads as needed | Breadboard ends must fit firmly; use properly fitted ferrules at compatible screw clamps for stranded ends. No load current through breadboard or Dupont leads. |
| 18 AWG copper bank-branch wire, matching insulated terminals for the actual switch, and secure bank termination | One conductor per clamp unless the actual connector permits more; use proper crimp terminals for blade terminals. No loose bare-wire wrapping or invented multi-wire stacking. |

If the capacitors, DC switch, correct mating terminals or a secure two-wire join needed to extend the existing bank feed are absent, they are the missing parts for this experiment. Do not assume they exist or instruct a live bare-wire load switch. No purchase has been performed; use the specified parts rather than an unreviewed substitute. Keep the existing protected branch and existing converter input wiring; the bank fuse is not newly claimed to protect the separate converter input/output branch. Siren remains disconnected during this bench experiment.

## All changes with every supply disconnected

1. Unplug the 12 V adapter and ESP32 USB; remove any other power to this bench circuit. Keep the battery disconnected. Leave bank internal wiring and all primary return/shunt connections intact.
2. Install the 100 nF ceramic directly across the ACS small VCC/GND connections. Each leg must connect to the actual corresponding net, not adjacent unrelated holes. Keep leads short and avoid exposed bridges.
3. Install the 10 µF ceramic from the ADS A1/divider midpoint to ADS GND. Keep the upper 10 kohm resistor between ACS OU1/VOUT and this midpoint. Keep the lower 10 kohm resistor from midpoint to signal ground. Keep the GPIO34 connection; ADS mode does not sample it. Do not put this capacitor directly from ACS OU1 to ground.
4. Remove only the fused-positive wire feeding bank LEFT strip position 1 BOTTOM at its bank end. Keep its other end at the existing positive Y branch. Connect its freed end to one terminal of the SPST switch. Connect the switch's other terminal to bank LEFT strip position 1 BOTTOM with 18 AWG wire. Make any needed wire extension with an actual compatible insulated connector or proper crimped join. Insulate and secure the switch terminals. Set it OFF.
5. Do not put the switch before the adapter/HCW input or before the positive split: ACS power and PZEM voltage measurement must stay present with the bank OFF.

## Complete sensor and input endpoints

| Connection | From | To |
| --- | --- | --- |
| ACS supply | Existing HCW 5 V OUT+ screw | Separate positive rail feeding ACS small VCC only |
| ACS/reference ground | HCW OUT− | Existing signal ground shared by ACS small GND, ADS GND and ESP32 GND |
| ADC supply | Existing ESP32 3V3 | ADS VDD |
| ADC bus | ESP32 GPIO21 / GPIO22 | Existing ADS SDA / SCL respectively |
| Upper divider resistor, first leg | ACS small OU1/VOUT | Upper 10 kohm resistor |
| Upper divider resistor, second leg | Upper 10 kohm resistor | ADS A1/divider midpoint |
| Lower divider resistor, first leg | ADS A1/divider midpoint | Lower 10 kohm resistor |
| Lower divider resistor, second leg | Lower 10 kohm resistor | Existing signal ground |
| Reserved native ADC wire | ADS A1/divider midpoint | Existing GPIO34 connection, retained |
| New 100 nF capacitor | ACS small VCC | ACS small GND |
| New 10 µF capacitor | ADS A1/divider midpoint | ADS GND |

Do not connect HCW positive to the ESP32 USB-fed positive rail. No direct OU1/5 V/12 V connection to ADS A1 or GPIO34. ADS address and other channel connections remain as installed.

```text
HCW OUT+ ---- separate positive rail ---- ACS small VCC
                                              |
                                           100 nF
                                              |
HCW OUT- ---- existing signal ground ---- ACS small GND
                          |                     |
                        ADS GND               ESP GND

ACS OU1 ---- 10 kohm ----+---- ADS A1
                        +---- GPIO34 (retained/reserved)
                        |
                        +---- 10 kohm ---- signal ground
                        |
                        +---- 10 µF ceramic ---- ADS GND

ESP32 3V3 -------------------- ADS VDD
```

With nominal 10 kohm resistors, the capacitor sees about 5 kohm source resistance: time constant about 50 ms, corner about 3.2 Hz and approximately 0.25 s for five time constants. These are calculated design values, not measured performance. This intentionally filters slow DC telemetry and does not qualify high-speed current protection. The series upper 10 kohm resistor separates this large capacitor from the ACS output; do not move it directly across OU1/GND.

## Complete existing primary branch and PZEM sense endpoints

```text
12 V adapter + -> existing 2 A fuse -> existing positive Y
                                          |          |
                                          |          +-> PZEM bottom (+voltage) screw
                                          |
                                  NEW bank-only switch
                                          |
                             bank LEFT strip 1 BOTTOM
                                          |
                          existing two-series-pairs bank
                                          |
                             bank RIGHT strip 1 BOTTOM
                                          |
                                     ACS large IP+
                                     ACS large IP-
                                          |
                               shunt LARGE upper-left
                               shunt LARGE upper-right
                                          |
                                 existing negative Y -> adapter -
                                          |
                                          +-> PZEM third (-voltage) screw

Shunt SMALL lower-left  -> PZEM top measurement screw
Shunt SMALL lower-right -> PZEM second measurement screw
```

Shunt and PZEM top/bottom positions refer to the actual previously supplied photograph/rear-label orientation already used by the working bench. Preserve those existing wires; do not choose pins from a different board orientation. Bank/ACS/shunt main wires remain 18 AWG for this low-current bench only, with suitable existing lugs on the large shunt bolts. Small shunt-sense wires remain 22 AWG. Preserve PZEM communication-side power/reference and automatic RS485 wiring. Do not add another ground between the shunt ends or create a return that bypasses ACS/shunt. Do not route primary current through signal ground/breadboard.

The existing converter input stays on its own existing adapter connection, independent of the new bank-only switch. The diagram does not approve a new converter branch or reuse the same fuse for separate independent branches.

## Firmware and power-up

No Arduino upload for this hardware experiment. Retain uploaded solair-cpe-2.0.17/imu6500-compatible and private configuration. Keep ACS_CALIBRATED false. Close Arduino Serial Monitor if it owns the USB port. Connect the existing SOLAIR CPE Lab at 115200, USB forwarding ON and LTE uploads paused. Do not reset PZEM energy, issue ZERO or change calibration coefficients.

With the bank switch OFF: power ESP32 by its existing USB first, then switch on the existing 12 V adapter. Brief unpowered-ACS indications before adapter power are not new faults. Leave the system untouched for 30 seconds. No VCC check is requested.

## One changed-hardware zero/load/zero sequence

Keep ESP32 and HCW/ACS powered throughout. Only operate the new bank switch.

| Stage | Action | Record |
| --- | --- | --- |
| Z1 | Bank switch OFF; leave untouched 60 seconds | Start/end times. This physically opens the only bank-positive feed; no other primary-current source is connected. |
| L1 | Switch bank ON; wait 2 seconds, then leave on 60 seconds | Start/end times; actual bank voltage once, using existing meter black COM/red V-ohm, DCV20, black probe on bank RIGHT strip 1 BOTTOM, red on bank LEFT strip 1 BOTTOM. Remove probes afterward. |
| Z2 | Switch bank OFF; wait 2 seconds, then leave untouched 60 seconds | Start/end times. Leave bank OFF when finished. |

PZEM should retain a plausible adapter voltage while the switch is OFF and show a small positive load response when ON, if communication remains healthy. A fresh no-reply report is not a valid zero-current reading. Do not silently diagnose its cause or restart working serial wiring. If valid PZEM/reference data are absent, keep that evidence missing rather than substituting zero. ADC Z1/Z2 are accepted as unloaded only from the physically open branch, not from PZEM no-reply.

Use the already reported 95–100 ohm bank range. Approximate load current lies between Vbank/100 and Vbank/95 before additional instrument/temperature uncertainty; do not pretend a single precise current or sensitivity is known. Near 12 V this is roughly 0.12 A, with an expected ADC step of order 2 mV for a nominal X050B/equal divider. Absolute zero is not forced to 1.25 V or to VCC/4.

Stop power for a loose/hot wire or terminal, smoke, unexpected voltage, opening fuse or repeated reset. Bank cases may dissipate heat; keep them secured on the existing plate clear of wires. Switch OFF 12 V first, then unplug ESP32 USB before touching wiring. Do not leave ACS externally powered while intentionally removing ADS/ESP power.

## Decision and stopping point

Retain every sample in the three fixed windows, including excursions. The observer computes mean, standard deviation and range for each; D = mean(L1) - mean(Z1), and drift = mean(Z2) - mean(Z1).

A useful response-screen requires the load step to exceed both the absolute zero-return drift and three times the largest within-window standard deviation. This is a conservative detectability screen, **not** an accuracy specification or a final calibration PASS. If the step is not distinguishable or zero shifts substantially, stop this experiment: no guessed zero/gain, sample deletion, another identical run or ACS_CALIBRATED enable. The proposed filter has not resolved the issue; actual-board/supply/front-end diagnosis or hardware replacement remains needed.

If the step becomes clearly repeatable, retain that result as an improved low-current response only. Return bank OFF; do not automatically generate a new firmware upload.

## Full current qualification after the response screen

1. Define the actual thesis current range and acceptable error/resolution. A 50 A sensor label is not proof of usable 0–50 A system accuracy.
2. Use independently qualified current points spanning that range and intermediate points, including both directions if charge/discharge is claimed. A suitably rated resistive load plus measured resistance/voltage can provide a reference with stated uncertainty; load power, adapter capacity, fuse, connectors and conductors must support every point. PZEM must not be its own accuracy reference. The present bank alone cannot cover a larger range.
3. If the required loads/reference are absent, they remain required physical items. No lab access was available per the user; do not ask that question again or invent an owned load. The 48 V pack is not a substitute for a load/reference and remains disconnected from this procedure.
4. Fit zero/sensitivity from the actual reference data, document uncertainty/residual errors and verify at independent points. Preserve the actual selected input source/divider interpretation; no default 2.5 V zero or 40 mV/A sensitivity is accepted merely from a datasheet.
5. Validate zero/current repeatability after power cycling with a physically open bank-only switch. No automatic startup tare is allowed while actual battery current may flow.
6. Only after those gates pass, update the existing private calibration configuration, compile/package the matching integrated sketch, then upload through the existing Arduino board/core/port with SOLAIR USB disconnected and Serial Monitor closed. The exact measured coefficients and build must exist before issuing an upload. Reconnect SOLAIR at 115200 and validate actual current against the references on that firmware, including LTE running and honest disconnect/overrange states.
7. Complete the remaining PZEM reference/shunt/energy and mounted/combined acceptance; freeze the accepted CPE before the two final drawing views. Passing this proposed conditioning screen alone cannot finish CPE or release assembly.

Primary engineering basis: [Allegro ACS758 datasheet](https://www.allegromicro.com/-/media/files/datasheets/acs758-datasheet.pdf) specifies local 0.1 µF bypass, output-load limits (4.7 kohm minimum, 10 nF maximum directly on output), nominal variant sensitivity and supply ratiometry. [TI ADS1115 datasheet](https://www.ti.com/lit/ds/symlink/ads1115.pdf), analog-input filtering, supports external RC filtering and identifies noise/aliasing and source-impedance effects. The chosen low-bandwidth RC is an engineering proposal for this slow DC channel, not a manufacturer-validated fix for this delivered breakout or its observed inter-boot shift.

# ACS supply comparison using the existing HCW-P715

22 October 2026. One controlled bench experiment, not a permanent power-design release or ACS calibration. Finish CPE acceptance before schematic work, as instructed by the user.

**Later simplified instruction and actual result:** user requested plain power-rail wiring and no repeated unloaded output measurement. The issued version used an unused positive power rail for HCW OUT+ and ACS small VCC, separate from the ESP32-fed positive rail; HCW OUT− connected to existing common signal ground. The five-hole group below is historical, not an additional required step. User reports completion at23:17; actual first30reports1132.25–1150.125mV, SD3.345107mV. See cpe-evidence/2026-10-22-2317-hcw-acs-supply-capture.json. Comparison complete; variation remains too large for reliable calibration from the tiny bank signal. Do not repeat unchanged captures or silently enable ACS. The loaded-meter step below was not user-confirmed and must not be recorded as performed.

## Why this changes the previous test

User confirms ACS small VCC connects to the breadboard positive rail supplied by ESP32 5 V. The HCW-P715 5 V screw output is unused; its input is supplied by the existing 12 V / 5 A adapter. Earlier user measurement of that unused output was 5.0 V. The completed USB-supplied ACS baseline varied 25.5 mV, exceeding the roughly 2.4 mV nominal signal from the 0.12 A bank. Supply dependence is a candidate explanation, not a diagnosed cause. This experiment changes the ACS supply while preserving its signal wiring and establishes whether the observed input becomes steadier.

This is a low-voltage adapter-only test. No battery, PV, MPT or vehicle connection. The converter is not being approved for the modem or for powering the USB-connected ESP32.

## Parts, wires and fitting requirements

- Existing 12 V / 5 A adapter, its existing HCW-P715 input connection and the previously checked 5 V output screw pair. Identify output positive and negative from the actual markings/previous polarity measurement; do not choose terminals by left/right from a reference product image. Do not alter the converter input or its existing power/protection arrangement for this test.
- Existing ESP32 USB connection, ACS, ADS1115 and existing divider wiring. Existing siren remains disconnected and LTE uploads paused.
- Two short insulated **22 AWG solid-copper leads**, preferably red and black, suitable for the actual screw clamps and the breadboard. Strip only enough conductor to seat securely without exposed copper outside the connection. If using stranded leads, use the correct fitted ferrule/contact for each end; do not clamp a loose Dupont plug pin, force an oversized wire into a breadboard, or stack wires in an unverified clamp. If suitable screw-terminal-to-breadboard leads are missing, that is the missing item; stop before substituting loose connections.
- One unused, isolated connected group of five breadboard holes. This must be separate from both power rails and from existing signal rows; the two five-hole groups across the centre gap are not connected to each other. It will join only the new converter-positive lead to the existing ACS VCC jumper.
- An insulated cap or suitable electrical insulation for the temporarily disconnected bank feed. No bare loose 12 V end.
- Existing DT830B: black cable in COM, red in V-ohm, DCV20. No current-mode measurement.

The existing 2 A fuse stays in its existing 12 V bank/PZEM branch. It is not a new fuse for the converter output, and this guide does not claim it protects every power branch. A permanent installation still requires the outstanding source/protection/current-budget review. Preserve the existing converter input connection; this experiment does not specify or approve a new unfused 12 V input harness.

## All wiring changes, with every supply unplugged

1. Switch off/unplug the 12 V adapter and unplug ESP32 USB. Remove any other supply to this bench circuit. Keep the siren disconnected.
2. At the bank's **LEFT terminal strip, position 1 BOTTOM**, remove only the external fused positive-feed wire. Keep the bank's internal resistor wiring intact and insulate the removed wire end. This prevents bank current when the adapter is later switched on to run the converter. Leave the bank return, ACS large IP terminals, shunt and PZEM wiring in place. Do not switch the adapter off/on as the load switch during this supply test: it also powers ACS through the converter.
3. Leave the jumper from ESP32 5 V to the breadboard positive rail in place. Leave other devices on that existing rail unchanged.
4. Take the **existing ACS small-VCC jumper out of that positive rail at its breadboard end only**. Leave its other end on ACS small VCC. Put the freed end into one hole of the unused isolated five-hole group.
5. Connect the new red 22 AWG lead from **HCW-P715 output +5 V screw** to another hole in that same isolated five-hole group. The converter positive now reaches only ACS small VCC through its existing jumper. No link from this group to the ESP32-fed positive rail.
6. Connect the new black 22 AWG lead from **HCW-P715 output negative/GND screw** to a free hole on the **existing breadboard ground rail that already connects ACS small GND, ADS GND and ESP32 GND**. Retain all those ground connections. Do not use either large ACS IP terminal as signal ground.
7. Retain the signal network exactly:

| Existing part/wire | Endpoint 1 | Endpoint 2 |
| --- | --- | --- |
| Upper 10 kohm resistor | ACS small OU1/VOUT | Divider midpoint |
| Lower 10 kohm resistor | Divider midpoint | Existing signal ground |
| ADS input jumper | Divider midpoint | ADS1115 A1 |
| Reserved native-input jumper | Divider midpoint | ESP32 GPIO34 |

ADS VDD stays on its existing 3.3 V rail. A1 has no direct ground tie. Do not connect converter 5 V or raw ACS OU1 directly to A1 or GPIO34.

```text
Existing 12 V adapter ---- existing HCW-P715 input
                                  |
                    output +5 V screw
                                  |
                         RED 22 AWG lead
                                  |
                 isolated five-hole breadboard group
                                  |
                       existing ACS VCC jumper
                                  |
                            ACS small VCC

HCW output negative --- BLACK 22 AWG --- existing signal-ground rail
                                             |       |       |
                                          ACS GND  ADS GND  ESP GND

PC USB -> ESP32 -> existing breadboard +5 V rail -> its other existing loads
                         NO positive connection to the converter output

ACS OU1 -> upper 10 kohm -> midpoint -> ADS A1 and retained GPIO34
                              |
                         lower 10 kohm
                              |
                       signal-ground rail

Fused 12 V bank-feed wire: removed at bank LEFT strip position 1 BOTTOM,
insulated and secured. Bank internal wiring/return remain in place.
```

Before powering, inspect that ACS VCC has only the new converter-positive source, that the ESP32-fed positive rail has no converter-positive link, and that positive/negative terminals and the insulated bank feed cannot touch.

## Power-up and the one observation

1. Connect **ESP32 USB first**. Open the existing SOLAIR CPE Lab at 115200 baud, USB forwarding ON; keep LTE paused. No upload or Arduino setting change is needed; preserve actual 2.0.17/private configuration. Close Arduino Serial Monitor if it owns the port.
2. Switch on the existing 12 V adapter to power the HCW-P715. The isolated bank feed must remain disconnected. An unpowered-ACS fault during the interval before adapter power is expected and is not a new sensor failure.
3. Qualify the newly loaded supply once: meter black COM/red V-ohm/DCV20, black probe on **ACS small GND**, red on **ACS small VCC**. Expect approximately 5.0 V. For this nominal-5 V comparison, stop and switch off if it is negative, outside **4.75–5.25 V**, visibly jumping, or tending toward 12 V. This is a conservative test window, not the sensor's absolute-maximum range. The meter cannot certify ripple/transients.
4. Remove both probes. Wait 30 seconds, then leave the circuit untouched for one 60-second capture. No load, wire touching, ACSZERO, calibration enable or smoothing change.
5. Report **“HCW supply test done; ACS VCC = ... V; time = ...”**. The backend will inspect the actual ADC samples; do not copy all RX lines.

With nominal 5 V at the bidirectional sensor and an equal divider, the unloaded ADC input may move toward roughly 1.25 V. That is an expectation, not a target to force, a zero coefficient, or a PASS criterion by itself. The comparison is the full observed spread/drift with valid acquisition. PZEM may have voltage but no bank current, or show a module fault; neither is a current-reference acceptance result in this no-load experiment. Stop if PZEM unexpectedly indicates meaningful sustained current rather than interpreting it as a zero capture.

Stop immediately for hot/loose wiring, source cycling, a blown fuse, unexpected bank current, resets or out-of-range supply. Switch off **12 V first**, then unplug ESP32 USB before touching wires. Do not leave the externally powered ACS driving an intentionally unpowered ADS/ESP32. Keep the two positive sources separate throughout. Do not bypass protection or change converter voltage to chase an ADC value.

## Bounded decision

Review this one changed-supply capture against the retained USB-fed result. If noise/drift persists, stop this branch; do not request repeated unchanged zero/load cycles or guess a filter/offset. If it improves, retain the actual evidence and review repeatability/reference requirements. Either outcome leaves mandatory independently referenced ACS current validation, PZEM accuracy/energy, final power-domain/protection review and remaining combined acceptance open. It does not finish CPE or start schematic work by itself.

Primary sensor reference: [Allegro ACS758 datasheet](https://www.allegromicro.com/-/media/files/datasheets/acs758-datasheet.pdf), common operating characteristics and ratiometry. Nominal 5 V supply and supply-dependent zero/sensitivity support the investigation; they do not establish HCW-P715 noise, delivered-carrier details or a proven cause of this prototype's excursions.

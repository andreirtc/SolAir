# One current-reference check for ACS and PZEM

22 October2026. Use only the existing fused12Vadapter/100ohm assembled bank and current reviewed ACS/shunt series loop. No battery, new load, resistor rearrangement or multimeter-current-mode connection. This obtains an independent approximate bench-current reference from measured bank voltage/resistance; it does not by itself prove accuracy over the full intended operating range.

## Parts and endpoints

Existing DT830B, its ordinary probes, existing assembled bank/circuit. No new wire, holder or connectors. Black probe lead stays in COM; red stays in the V-ohm socket throughout. Do not use the10A or mA socket/mode. Bank LEFT strip position1BOTTOM is the existing fused positive feed; bank RIGHT strip position1BOTTOM returns through ACS primary terminals and the PZEM shunt. Preserve the signal wiring, including A1 at the divider midpoint, GPIO34 and both10kohm resistors. Buzzer remains disconnected; LTE remains paused; USBforwardingON.

```text
Existing12V+ -> existing2Afuse -> positiveY -> bank LEFT strip1BOTTOM
                                                |
                                         existing100ohm bank
                                                |
 bank RIGHT strip1BOTTOM -> ACS IP+ -> ACS IP- -> existing PZEMshunt ->12V-

Voltage check only:
  RED probe -> metal screw bank LEFT strip1BOTTOM
  BLACK probe -> metal screw bank RIGHT strip1BOTTOM
  Selector DCV20; red lead remains in V-ohm jack.
```

## A. Use the already measured resistance

If you recorded the numeric resistance from the completed cold-bank check, report that actual number and skip partB. A statement that it passed or the resistor's nominal100ohm label is not an exact measured value; do not invent one.

## B. Only if the actual numeric resistance was not recorded

1. SwitchOFF/unplug12Vadapter and unplugESP32USB; remove any other power to this same bench circuit. Wait until the bank is cool. No powered resistance measurement.
2. Disconnect ONLY the fused feed wire at **bank LEFT strip position1BOTTOM**. Keep the internal bank wires/strips and all other circuit connections intact. Insulate the freed wire end. This isolates the bank from parallel powered-module paths for the resistance measurement.
3. With blackCOM/redV-ohm, select200ohm range. Touch red to the bank LEFT strip1BOTTOM metal screw, black to bank RIGHT strip1BOTTOM metal screw. Record the actual resistance inohms. The existing topology should be near100ohm, subject to actual parts/meter. OL, nearzero, or a value inconsistent with the previously passed bank is a stopping point, not a calibration number.
4. Remove the probes. **Set the meter to DCV20 before restoring power.** With allpowerstillOFF, reconnect that same fused feed wire securely to bank LEFT strip1BOTTOM; no clamp stacking or altered branch topology.

## C. One loaded-voltage observation

1. If partB was needed, restore only the same previously working USB and12Vbench supplies; reconnect CPELab115200, USBforwardingON/LTEpaused. If using the earlier resistance record, keep the current working stream/circuit untouched.
2. Confirm blackCOM/redV-ohm and selector **DCV20**. Once PZEM reports a fresh loaded reading, touch red probe to **bank LEFT strip position1BOTTOM metal screw** and black probe to **bank RIGHT strip position1BOTTOM metal screw**. Touch only those intended contacts without bridging neighboring terminals. These probes measure across the resistor bank; they do not break the current circuit.
3. Observe10seconds and record the bank voltage/range and clocktime. Expect a voltage near the existing approximately12.2Vadapter test, not5V or a higher-voltage battery. If the meter shows OL/unexpected polarity/voltage or the load remains unpowered, remove probes and report rather than guessing a value. Stop power for a loose/hot joint, opening fuse or source cycling; do not bypass protection.
4. Remove probes and keep the stream running for review. No new upload, ACSZERO command, coefficient change or calibration-enable instruction.

Report only: **Bank R = ...ohm; bank V = ...V; time = ...**. State if partB caused a deliberate powercycle.

## What the backend will do

Compute reference I=Vbank/Rbank and P=Vbank²/Rbank using the actual numbers, not a guessed100ohm or PZEM's rounded0.12A. Compare that reference with the contemporaneous PZEM and connected-ACS capture. Retain meter/resistance uncertainty, temperature effects, wiring and observed ADC spread. Do not force ACS sensitivity from one noisy point or equate current-reference acquisition with completed calibration. This measurement serves both channels; no separate PZEM bring-up rerun is required.

General measurement technique references: [Fluke resistance](https://www.fluke.com/en-ph/learn/blog/digital-multimeters/how-to-measure-resistance), [Fluke DCvoltage](https://www.fluke.com/en-ie/learn/blog/digital-multimeters/how-to-measure-dc-voltage-with-a-digital-multimeter). These support power-off isolated resistance and parallel voltage techniques, not the DT830B's model-specific accuracy or a new current-mode rating.

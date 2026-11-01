# Complete PZEM-017 / shunt / 12V resistor bench test

## Active 22 October clarification

Keep actual integrated firmware **2.0.15**; old2.0.3 references below are historical, not another upload instruction. User now reports the four-resistor bank finished; cold resistance and isolation readings are still pending. The bank remains the approved two-series-pairs-in-parallel design, nominal100ohm.

**No WAGO purchase is required.** The two three-way electrical branches below can use a suitable existing distribution terminal or a properly made soldered/crimped, separately insulated and strain-relieved branch harness. “POSITIVE connector ports1/2/3” in the old tables means the three wires of one positive node; “NEGATIVE connector” means a separate return node. A finished bank's internal Y joints do not by themselves create the two required supply branches. Confirm the actual branch-harness/connector construction before energizing; do not stack wires in unverified PZEM/source clamps or use twist-and-heat-shrink-only joins. Retain source polarity and the inline2A fuse/holder; no load current through the breadboard.

CPE Lab now displays PZEM voltage/current with two decimal places, preserving0.01V/0.01A reported resolution. This is display resolution, not a new accuracy claim. The response test is not mandatory ACS calibration:100ohm at12V only draws about0.12A.

20 October 2026. This guide replaces the fragmented instructions for this test. It uses the user's supplied PZEM rear-label photograph, the supplied four-screw shunt photograph and the manufacturer family wiring diagram. These are instructions and calculated expectations, not completed physical test results.

Use the existing 12V/5A adapter, one 100ohm/100W resistor **or the cold-checked Card1 four-resistor bank measuring about100ohm total**, the PZEM and external shunt. Use only one load option. The completed bank on one common aluminum plate can replace the loose resistor directly: bank J+ replaces leg1 and bank J− replaces leg2 in every connection below. No separate single-resistor test is needed first. Leave the buzzer disconnected. Solar panels, MPT, traction battery and wind equipment are outside this test. Keep final firmware2.0.3 and existing working RS485/ESP32 communication wiring. This test does not approve vehicle/high-current wiring or complete ACS calibration.

## 1. Parts and wire ends

| Item | Required use |
|---|---|
| Existing 12V/5A adapter | Supply only. Its5A marking is capacity, not the current this resistor should draw. Identify the same positive/negative output points that previously gave PZEM/meter12.3V; do not guess barrel polarity. |
| Existing inline fuse holder + correctly fitting 2A fuse | Insert in positive feed, close to source and before the positive split. Holder/fuse must be DC-rated for this12V circuit and accept its actual wire ends. Do not substitute a bare loose fuse. |
| Two insulated common junction connectors, each with at least3 independently clamped wire ports | One connector is POSITIVE; the other is NEGATIVE. Each connector internally joins its own three wires. Example: genuine WAGO221-413 or a documented suitable equivalent. These connectors have not been confirmed in the user's inventory. |
| Existing covered screw-terminal strips, if used instead | Need verified compatible commoning hardware joining at least3 separate wire positions and ratings/end fit. Adjacent screw pairs are not automatically common. One wire per clamp unless the actual terminal explicitly permits more. If suitable commoning is absent, it cannot replace the three-port connector in this plan. |
| 18AWG insulated stranded copper wire | Low-power12V load path, source, fuse and junction connections. Use appropriately sized secure ring/fork lugs at the large shunt screws. This choice does not approve a50A harness. |
| 22AWG insulated copper wire | Two small shunt-sense wires and existing PZEM voltage leads. Properly sized ring/fork ends at small shunt screws; suitable bare/ferrule preparation at meter clamps. |
| One100ohm/100W resistor | The load. Either leg can be positive. Secure its own terminal/eyelet connections using the correct termination method and insulation; no loose twist-and-tape joins. Put the case on a nonflammable surface clear of loose wires. |

**Source-connector gate:** the actual adapter output connector has not been photographed. Use only accessible, identified positive/negative DC output connections. If the adapter ends in a sealed round plug with no accessible wiring connector, a correctly matched barrel-plug breakout is required. Do not open the wall adapter, cut its mains cord or infer polarity from wire colour. A fuse holder and a proper branch connector are physical parts; extra software steps cannot replace them. Do not energize if these required connections/terminations cannot be made securely.

For the three-port connector example, one connector is one common electrical node. Its ports have no fixed input/output order. Label one complete connector `+12V` and the other `NEGATIVE`; never put positive and negative wires together in one common connector. WAGO documents the221 series for solid/stranded/fine-stranded copper, including the18/22AWG sizes here: [manufacturer reference](https://www.wago.com/gb/products/electrical-interconnections/splicing-connectors-221). Follow the actual connector's strip-length/end-preparation instructions; do not invent torque or force a mismatched lug/ferrule into a clamp.

## 2. Identify the actual screws before wiring

Unplug12V, ESP32USB and other supplies. Keep power off throughout assembly.

**PZEM:** use the four-screw measurement block opposite the RS485 block. It is the block containing the user's existing12Vpositive/negative wires. With the microUSB socket along the bottom edge and the orientation matching the supplied rear-label photo, count top to bottom:

| Position | Function | Destination in this test |
|---|---|---|
| Top screw | Load-end shunt measurement | Small lower-left shunt screw in user's horizontal photo |
| Second screw down | Supply-negative-end shunt measurement | Small lower-right shunt screw |
| Third screw down | Voltage negative | NEGATIVE common connector |
| Bottom screw | Voltage positive | POSITIVE common connector after fuse |

If actual occupied power positions do not match this orientation, leave them untouched and reconcile the labels first. Do not choose a block merely by front/back left-right appearance. Preserve the other block's existing RS485 and serial-power connections.

**Shunt:** hold exactly as in the supplied horizontal photograph, two metal ends to left/right:

| Actual photo position | Use |
|---|---|
| Larger upper-left screw | Resistor return/load-current entry |
| Smaller lower-left screw, nearer centre | Thin measurement wire to PZEM top screw |
| Larger upper-right screw | Source return to NEGATIVE common connector |
| Smaller lower-right screw, nearer centre | Thin measurement wire to PZEM second screw |

The visibleFL-2/0.5 marking is not a confirmed50A/75mVrating. Read the full shunt rating from its actual marking/documentation before declaring current accuracy. The software's50Aregister readback does not identify a physical shunt.

## 3. Full circuit

```text
12V adapter POSITIVE
         |
    inline holder
    [2A fuse inside]
         |
    POSITIVE connector ------- 22AWG ------ PZEM bottom screw (+)
         |
       18AWG
         |
   100ohm resistor, leg1
   100ohm resistor, leg2
         |
       18AWG
         |
  SHUNT LARGE UPPER-LEFT
         |   current through shunt
  SHUNT LARGE UPPER-RIGHT
         |
       18AWG
         |
    NEGATIVE connector ------- 22AWG ------ PZEM third screw (-)
         |
       18AWG
         |
12V adapter NEGATIVE

SHUNT SMALL LOWER-LEFT  ------- 22AWG ------ PZEM top screw
SHUNT SMALL LOWER-RIGHT ------- 22AWG ------ PZEM second screw

PZEM RS485 / existing interface / ESP32: retain working wiring.
```

The resistor has two legs joined internally by its100ohm resistance. They are not an extra external wire link. The shunt has a conductive measurement element between its two ends. Load current goes through the two LARGE screws. The two SMALL screws only send the tiny voltage difference to the PZEM.

## 4. Fuse and branch connections, physically

A plain two-wire inline holder puts a fuse **in series**. Both holder wires are in the positive circuit: source-positive → holder → fused-positive output. They are not a positive/negative pair. Follow any IN/OUT markings on an actual directional/indicator holder.

Fit the correct2A fuse inside its matching holder and close it. Do not put the holder between positive and negative; that would short the supply.

Make the POSITIVE connector with exactly these three conductors, one per port:

| Connector port | Wire |
|---|---|
| 1 | Output wire from the fuse holder |
| 2 | Existing wire going to PZEM bottom/positive screw |
| 3 | 18AWG wire going to resistor leg1 |

Make the separate NEGATIVE connector with exactly these three conductors:

| Connector port | Wire |
|---|---|
| 1 | 18AWG wire from adapter negative output |
| 2 | Existing wire going to PZEM third/negative screw |
| 3 | 18AWG wire going to shunt LARGE UPPER-RIGHT screw |

This complete version puts both the PZEM voltage-positive branch and resistor downstream of the2A fuse. It supersedes prior partial diagrams that left the meter feed upstream of that fuse. Do not borrow a fuse simultaneously needed by another energized circuit; the buzzer branch remains disconnected for this test.

Existing PZEM power leads remain single wires at the meter screws. With all power off, disconnect their source ends from their old positive/negative supply connection and reconnect those ends to the appropriate common connectors above. The source-positive point now supplies the fuse-holder input; the source-negative point supplies the NEGATIVE connector. Do not add another wire under the PZEM positive/negative screw or stuff several wires into a barrel-adapter clamp.

## 5. Remaining wires: complete connection list

| Wire | Type | From | To |
|---|---|---|---|
| Supply positive | Existing properly rated holder lead/18AWG | Identified adapter positive DC output | Fuse-holder input |
| Fused positive | Holder lead/18AWG | Fuse-holder output | POSITIVE connector port1 |
| Meter positive | Existing22AWG/protected voltage lead | POSITIVE connector port2 | PZEM bottom screw |
| Resistor feed | 18AWG | POSITIVE connector port3 | Resistor leg1 |
| Resistor return | 18AWG | Resistor leg2 | Shunt large upper-left screw |
| Shunt source return | 18AWG | Shunt large upper-right screw | NEGATIVE connector port3 |
| Supply negative | 18AWG | NEGATIVE connector port1 | Identified adapter negative DC output |
| Meter negative | Existing22AWG/protected voltage lead | NEGATIVE connector port2 | PZEM third screw |
| Left shunt measurement | 22AWG | Small lower-left shunt screw | PZEM top screw |
| Right shunt measurement | 22AWG | Small lower-right shunt screw | PZEM second screw |

There is **no direct resistor-leg2-to-adapter-negative wire**: it would bypass the shunt. Do not put the load through the small measuring screws, breadboard or ESP32headers. Keep existing communications-side ground/reference arrangement; this drawing does not add a new bridge across any isolation boundary. Keep load connections separate from signal wiring.

## 6. Before switching on

Check both sense wires go to the intended small screws; both load wires go to the intended large screws; the resistor is in the loop; the2A fuse is in the positive feed; positive/negative connectors are separate; each wire is securely terminated and no copper/loose clip can bridge neighbouring contacts. Confirm the resistor marking really is100ohm, not100W alone. Use one correctly identified100ohm resistor or the completed Card1 bank: two100ohm series pairs in parallel are also nominal100ohm. Check the actual completed resistance before power. Four100ohm resistors all in parallel would be25ohm and are not the Card1 arrangement.

Use the already working PZEM serial-power/RS485/ESP32 arrangement. Do not add or tie another5VUSB supply into it to make this test work. The rear label/familymanual describe auxiliary microUSB for below7V measurement; it is not a universal instruction to add it at12V. No changes to the successful communications/power-domain setup are required by this guide; undocumented board/interface supply arrangements remain a separate review gate. Do not connect the12V output to an ESP32/RS4855V or3V3 pin.

## 7. Run the single load-response check

1. Leave the buzzer disconnected and use only the low-voltage adapter test circuit above.
2. Reapply the existing reviewed logic/serial supplies and the12Vadapter. No firmware upload or coefficient change is required.
3. Open the existing app at http://localhost:3000. Sign in, select the actual device in Real hardware/CPE Lab and connect USB at115200; close ArduinoSerialMonitor if it owns the port.
4. Wait10seconds for fresh reports. Check the report number advances; yesterday's saved values are not a new load result.
5. Observe current and power for about30seconds. Send their approximate lowest/highest values and the PZEM diagnostic. Power off before changing any connection.

Expected **nominal** values, calculated from the resistor label:

| Quantity | At12.0V | At12.3V |
|---|---:|---:|
| Current, V/100ohm | 0.120A | 0.123A |
| Power, V²/100ohm | 1.44W | 1.51W |
| Energy after10minutes | 0.240Wh | 0.252Wh |

CPE Lab now displays current to two decimal places, so a reported0.12A is visible as0.12A. Backend records remain unchanged. Resistor tolerance and actual supply voltage affect the prediction; this is a basic load-response check, not an independent calibration certificate. Precise acceptance requires actual resistance/current reference, matching physical shunt rating and documented measurement tolerance.

The meter energy register has1Whresolution. At about1.5W, accumulating1Wh takes roughly40minutes; the counter need not change during this short test. Defer energy progression to the planned combined run instead of waiting now. Do not reset its existing energy/history.

## 8. If the result does not match

| Observation | Next action |
|---|---|
| Voltage remains about12V but current/powerstay0 | Do not increase supply or change calibration. Power off; report the readings/diagnostic and whether the resistor and both shunt paths are connected as above. Missing load/sense, bypassed shunt or an incorrect physical range remain possible. |
| Current jumps into whole amperes or power into tens/hundreds of watts | Power off the test and report it. A steady100ohm load at12V should not produce those values; earlier isolated spikes are not a PASS or a reason to hide/filter data. |
| PZEMfault/unavailable | Report the diagnostic; preserve the existing communication wires. Do not swap live wires or change EEPROM range blindly. |
| Fuse opens, connector heats, adapter cycles or there is a loose/shorted connection | Unplug power; inspect actual parts/termination before any retry. Do not bypass or up-rate the fuse to continue. |

Return only this result block after successful assembly/run:

```text
PZEM voltage: ___ V
Current: lowest ___ A / highest ___ A
Power: lowest ___ W / highest ___ W
PZEM diagnostic: ___
Physical shunt rating, if visible: ___ A / ___ mV
```

## References and limits

- User's actual rear-label photo and shunt photo, privately retained in ignoreddata/bench-evidence; product-front screenshot is a reference, not evidence of completed wiring.
- [PZEM manufacturer-family manual, picture4.2 and register/resolution tables](https://www.solar-thailand.co.th/pdf/PZEM-003-Manual.pdf).
- [WAGO connector-family conductor compatibility](https://www.wago.com/gb/products/electrical-interconnections/splicing-connectors-221). A connector example is not a claim that it is already owned or approved for other SOLAIR circuits.
- Existing source connector, fuse/holder DC markings, actual lugs/crimp tool and junction hardware remain unverified until identified/assembled correctly. Do not call the guide itself a physicalPASS. ACS current validation is mandatory and remains a later required test; this guide does not waive it.

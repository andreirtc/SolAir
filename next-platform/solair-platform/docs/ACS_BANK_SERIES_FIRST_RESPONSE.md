# ACS758 first series-load response — existing 12 V / 100 ohm bank

22 October 2026. User confirms only ACS VCC/GND/OU1 pins connected; neither main current terminal was in the load circuit. Previous captures therefore characterize the powered analog output with no intended primary load current. Preserve the previously recorded quiet-zero capture. This procedure adds the missing current path; it does not by itself complete current accuracy calibration.

## Complete change for this one test

Use the same fused12Vadapter,100ohm bank, PZEM/shunt and firmware2.0.15. Buzzer remains disconnected and LTE upload remains paused during this bounded observation. No new source, supply increase, firmware upload, resistor-bank rebuild or meter-current wiring. Use existing18AWG main-current wire and **one additional18AWG lead** with the actual ACS terminal end fitting and a ring/fork matching the shunt's large screw. No loose bare joints, clamp stacking or current through breadboard/logic headers.

Unplug the12Vadapter and ESP32USB before touching wires. Identify the ACS board's two LARGE primary current terminals from their actual IP+/IP− markings. These are not the small VCC/GND/OU1 signal pins. If the actual main terminals use other/unreadable labels, stop before power and identify them; do not guess a left/right assignment from an IC package drawing. Check the two prepared wire ends fit their particular terminals securely; do not force an existing large shunt lug into a smaller ACS clamp.

| Action | Exact endpoint |
|---|---|
| Free the existing bank return | Remove ONLY the wire from bank RIGHT strip position1BOTTOM at its **shunt LARGE upper-left** end. Keep its bank end connected. |
| Route that return into ACS | Connect the freed end to the ACS LARGE IP+ terminal, using the appropriate prepared termination. |
| Add the series link | ACS LARGE IP− -> one18AWG lead -> the same shunt LARGE upper-left screw just vacated. Use the matching shunt lug. |

Keep bank positive, both external solderedYbranches, inline2Afuse, shunt LARGE upper-right/source return, both SMALL shunt-sense wires and all PZEM serial/voltage leads unchanged. Keep ACS VCC/GND/OU1, divider and GPIO34 untouched. No direct bankJ− wire may bypass either ACS primary path or shunt.

```text
Existing12V+ -> existing2Afuse -> positiveY -> bankLEFT strip1BOTTOM
                                            [100ohm bank]
BankRIGHT strip1BOTTOM -> ACS LARGE IP+ -> ACS LARGE IP−
                                            |
                                            +-> shunt LARGE upper-left
                                                [shunt element]
                                                shunt LARGE upper-right
                                                    -> negativeY -> existing12V−

The positiveY also feeds PZEM bottom measurement screw.
The negativeY also feeds PZEM third measurement screw.
Shunt SMALL lower-left -> PZEM top measurement screw.
Shunt SMALL lower-right -> PZEM second measurement screw.
ACS small VCC/GND/OU1 and divider remain as previously connected.
```

IP+/IP− identify primary-current direction. They do not mean 'connect adapter positive/negative across the ACS'. This low-current bench placement is not a change to the separate shared-battery schematic location.

## Observe once

Before power, check tight insulated ends and no old bypass return. Restore only the same working USB and12Vsupplies; leave buzzer disconnected. Reconnect existing CPELab115200 with USBserverforwarding ON, firmware2.0.15, LTEpaused. Do not touch the analog node with meter probes during this capture. Once PZEM reports qualityok, leave the whole circuit untouched60seconds. Stop/poweroff for loose/hot connections, an opened fuse, source cycling or unexpected whole-ampere readings; do not bypass fuse or raise voltage.

PZEM should remain approximately12.2V/0.12A/1.4–1.5W. A zero/fault reading means the new series path needs power-off inspection before interpreting ACS. At nominal0.12A the expected ACS ADC shift is only about2.4mV after the equal divider; it can be buried in the previously observed noise. A larger visible jump is not required and a small/noisy difference does not alone diagnose sensor failure. Do not force calibration coefficients or enable valid amperes from this one point. Reference/range validation is still required.

Report 'ACS series capture done' and the clock time. Backend can inspect the actual stored ADC/PZEM fields; no RX-log dump or hand-copied min/max needed. This is one bounded initial load-response capture, not an open-ended repeat loop.

Source for nominal sensitivity/direction: https://www.allegromicro.com/-/media/files/datasheets/acs758-datasheet.pdf . Actual carrier terminal markings and safe wire fittings govern physical connections.

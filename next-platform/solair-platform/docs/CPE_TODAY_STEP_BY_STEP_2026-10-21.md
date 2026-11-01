# CPE bench sequence — 21 October 2026

Use this short route with the [final acceptance register](CPE_FINAL_ACCEPTANCE_2026-10-20.md). Detailed physical work proceeds one complete test at a time. Retain existing passes and firmware 2.0.3; upload only when a justified diagnostic/configuration change is ready. No promised completion time or unmeasured PASS.

Reviewed other session `01a154ae-d2fd-7693-8502-223c8c8a1479` through 21 October. Its updates concern guide orientation/full-wire display, shared storage, procurement and account handoff. No new physical CPE PASS was found. User now confirms resistor-bank assembly is still in progress and does not know the three-port connector. App health currently responds OK at localhost:3000 with the existing SQLite configuration; no server restart or hardware command was needed.

## Whole remaining route

| Stage | Work | Finish observation |
|---|---|---|
| 1 | Complete and cold-check four-resistor bank below | About 100 Ω across the load; no conductive path to bare plate; secure ends and verified links |
| 2 | Complete the protected PZEM circuit using the full ten-wire table below | Actual stable loaded V/A/W matches measured V/R and V²/R; physical shunt rating established; energy progression during longer run |
| 3 | Close actual power/USB/modem/RS485/analog interface documentation | Supported supplies, UART levels, domains, connectors, protection and power selection established before permanent construction |
| 4 | Finish ACS input stability, zero and known-current reference comparison | Actual calibrated current within a recorded useful range/tolerance, repeated after loading; remain invalid until passed |
| 5 | Close ADS reference evidence, mounted motion and final alarm safe-OFF/cutoff | Exact sensor comparisons/thresholds and physical output behavior recorded; preserve earlier switch/siren passes |
| 6 | Obtain combined outdoor GPS and actual Wi-Fi/LTE backend delivery | Genuine fix; matching accepted/stored/exported identities/events; USB does not carry wireless test |
| 7 | Run combined recovery and recorded soak (recommended ≥60 min) | Concurrent UART/sensor/network operation, responsive alarm, honest faults, stored history and once-only buffered replay |
| 8 | Freeze hardware/firmware/evidence for the single thesis schematic | Final BOM, connector/power map, calibrated range, config identity and test evidence agree |

Secure modem HTTPS/CA transport and failover after Wi-Fi-associated delivery failure still need software work/commissioning; they are not fixed by rewiring. Exact carrier/endpoint information is needed before instructing activation. ACS needs an adequate safe load and independently resolved DC current reference; the 100 Ω/12 V PZEM load alone cannot settle it. Missing interfaces/load/reference are real pending work, not extra tests already performed.

The final SOLAIR integration target in the other chat remains PV → MPT → one compatible protected battery → regulated 12 V → CPE. Existing HCW-P715 retains its reviewed 12 V-to-5 V role. Battery and new converter are not approved from nominal labels alone. Keep the adapter for current bench tests. Shared-storage charging, VAWT and vehicle/rack release remain additional system milestones; do not turn adapter bench success into a complete hybrid/charging claim.

## 1 — finish the resistor bank, with every supply unplugged

Use four actual 100 Ω resistors, existing plate/insulated strips, 18 AWG copper and properly fitting secure resistor terminations. Do not drill resistor cases. Mark actual mounting feet, remove parts/wires, drill/deburr/clean the bare plate, then refit. M3 is a fitting candidate, not an established screw length.

**21 October bank revision — no strip-link accessories:** user confirms heat-shrink is available but no soldering iron. Borrow an iron/stand and electronics solder before completing the two Y branches and resistor-lug joints. Heat-shrink is insulation, not a wire connector. Mounting/individual resistor checks can proceed now; do not power an unfinished bank.

Arrange R1/R2 above and R3/R4 below; both four-position strips remain landscape in the middle. Use only position 1 on each strip; positions 2–4 stay unused. With the empty strips isolated, verify position 1 TOP↔BOTTOM continuity near the shorted-probe baseline. Keep one untinned wire per used strip screw.

| 18 AWG wire piece | From | To |
|---|---|---|
| 1 RED | Strip 1 position 1 TOP | Y+ solder joint |
| 2 RED | Y+ | R1 left lug |
| 3 RED | Y+ | R3 left lug |
| 4 marked series jumper | R1 right lug | R2 left lug |
| 5 marked series jumper | R3 right lug | R4 left lug |
| 6 BLACK | R2 right lug | Y− solder joint |
| 7 BLACK | R4 right lug | Y− solder joint |
| 8 BLACK | Y− | Strip 2 position 1 TOP |

Y+ joins exactly its three RED wires; Y− joins exactly its three BLACK wires. Make mechanically interlocked, soldered joints and completely insulate each separately with correctly fitting heat-shrink. Support them away from hot cases/plate metal and external cable strain. No bare twist/heat-shrink-only joint, inter-position strip bars, stacked screw wires, or solder-tinned clamped ends. Mechanically hook, solder and insulate the actual resistor electrical eyelets with the borrowed tools; do not confuse these with case-mounting feet. Full joint and cold-check procedure is in the existing HTML Card1, `bank-y-solder-procedure`. This is the separate protected12V bench construction, not permission for battery/MPT/high-power use.

```text
                 R1 ─ R2
Strip1/1 TOP ─ Y+         Y− ─ Strip2/1 TOP
                 R3 ─ R4
```

Both series pairs connect between the same Y+ and Y− nodes. Card2 endpoints stay unchanged: fused positive load branch→Strip1 position1BOTTOM; Strip2 position1BOTTOM→shunt LARGE LOAD bolt. Both bottom screws remain free until that step.

**Meter:** BLACK→COM, RED→V/Ω, dialΩ/200Ω or autorange; use2kΩ for each isolated nominal200Ω series pair if needed. With all supplies/modules disconnected, first verify individual100Ω resistors, then check completed bank between Strip1/1BOTTOM and Strip2/1BOTTOM: nominal100Ω (roughly95–105Ω before meter error). HighΩ/autorange: accessible bare plate against each bank terminal must readOL/beyond range. Stop for near-zero,200Ω/OLbank reading, conductive plate path, exposed copper or unfinished/loose solder joint. Record actual readings; no physicalPASS from this revision. DMM screening is not a high-voltage insulation certificate.

## What the three-port connector means

**Latest user constraint:** no WAGO is owned; do not make its purchase a prerequisite. The circuit needs two suitable three-wire electrical branches, not a particular brand or housing. An existing appropriately rated linked distribution terminal or a properly made soldered/crimped, insulated and strain-relieved branch harness can serve the same function when its actual materials/terminations are suitable. Identify which is available before instructing its construction. Loose twist/tape joins and extra wires forced under unverified clamps are not substitutes. GPS can progress independently while the bank and source harness are prepared.

A three-wire common connector has three separate wire clamps internally joined together. A genuine WAGO 221-413 is one example; 18/22 AWG copper are within the documented series range. Follow the actual strip-length and conductor instructions. [Manufacturer](https://www.wago.com/gb/installation-terminal-blocks-and-connectors/splicing-connector-with-levers/p/221-413).

Two such connectors are specified for the PZEM source branches. Keep them distinct from the two resistor-bank strips:

```text
POSITIVE connector: fuse output ─┬─ PZEM positive
                                └─ resistor-bank feed

NEGATIVE connector: adapter − ──┬─ PZEM negative
                                └─ large source-side shunt screw
```

Each box joins only its own three wires. Positive and negative must never share one common connector. The existing four-position strips may substitute only if their commoning/ratings/clamps support the actual three-conductor branch. They are not automatically equivalent. Do not dismantle the bank to borrow its strips for simultaneous source distribution. If correct branch hardware is missing, stop before powering Stage 2 and identify the actual part; no loose twists/stacked meter wires.

## 2 — complete PZEM load test

Required: cold-checked bank; existing 12 V/5 A adapter with accessible identified DC connector; matching DC-rated inline holder with 2 A fuse; two suitable three-port common connectors; 18 AWG load wires and correct ring/fork ends at large shunt screws; 22 AWG sense/voltage wires with fitting small-screw ends/meter clamp preparation. Do not open/cut the mains adapter. If its sealed output plug has no accessible terminals, use the correctly matching DC breakout.

Keep buzzer, PV, MPT and batteries out of this test. Unplug every supply before wiring. The shunt positions below refer to the supplied horizontal photograph: large screws upper-left/upper-right, small screws lower-left/lower-right nearer the centre. The PZEM block is the four-position measurement block already containing the 12 V leads, opposite its RS485 block, in the supplied rear-label orientation. If actual labels/occupied positions differ, reconcile before moving power.

| Wire | From | To |
|---|---|---|
| 18 AWG / fitting holder lead | Identified adapter DC + | Inline fuse-holder input |
| Holder lead / 18 AWG | Fuse-holder output | POSITIVE connector port 1 |
| Existing voltage lead / 22 AWG | POSITIVE port 2 | PZEM measurement-block bottom screw (+) |
| 18 AWG | POSITIVE port 3 | Strip 1 position 1 bottom screw / bank J+ |
| 18 AWG | Strip 2 position 1 bottom screw / bank J− | Shunt LARGE upper-left screw |
| 18 AWG | Shunt LARGE upper-right screw | NEGATIVE connector port 3 |
| 18 AWG | Adapter DC − | NEGATIVE port 1 |
| Existing voltage lead / 22 AWG | NEGATIVE port 2 | PZEM third screw down (−) |
| 22 AWG | Shunt SMALL lower-left screw | PZEM top measurement screw |
| 22 AWG | Shunt SMALL lower-right screw | PZEM second screw down |

Both inline-holder leads belong to the positive path; the fuse sits inside it. They are not a plus/minus pair. Existing PZEM voltage leads remain single wires at the meter: move only their source ends to the correct common connectors. Do not directly join bank J− to adapter −; that would bypass the shunt. Preserve successful RS485/ESP/serial-side power; add no new USB/5 V/ground bridge.

Inspect secure terminations, separate +/− blocks, no stray copper and correct 2 A fuse. Then restore only the existing reviewed supplies. No upload. Open SOLAIR CPE Lab, Real hardware, correct device, USB115200; Arduino Serial Monitor must be closed. Wait ten seconds for advancing fresh reports and observe V/A/W for thirty seconds. Nominal 12.3 V and 100 Ω predicts 0.123 A / 1.51 W; UI may round to 0.1 A. This is an initial response check, not a calibration certificate. Wh resolution is 1 Wh; retain its counter and observe energy progression in the longer run rather than waiting now. [PZEM manual](https://www.solar-thailand.co.th/pdf/PZEM-003-Manual.pdf).

Stop/disconnect power for repeated whole-amp readings inconsistent with the measured load, hot/loose wiring, blown fuse or unexplained resets. If current remains zero, power off before checking main loop/sense positions; do not change software to make it nonzero. Record actual bank Ω, shunt rating, fresh V/A/W ranges and diagnostics. Full context: [PZEM guide](PZEM_12V_RESISTOR_FULL_GUIDE.md).

## Following stages — keep the same test format

After Stage 2 results, select the next bounded ACS test from its actual stability record and available reference/load; do not automatically repeat every earlier upload. Close exact carrier/power questions using existing photos/markings before giving new power wiring. Any required upload uses the generated Arduino IDE folder, ESP32 Dev Module, observed CP2102 port, closed Web Serial/Monitor and reviewed power arrangement; never `compile_all_only`. Restore the final integrated sketch after diagnostics only when the resulting private configuration is ready.

Each following physical test must state all its parts/endpoints, power state, meter setting, procedure, expected observation and stopping point. Detailed new connections cannot be responsibly invented for unknown carrier pins, unavailable load/reference or unselected final power parts. Preserve every result in validation. Final acceptance requires actual evidence for every required row; full procedures for later stages are completed against that evidence as we progress, not guessed in advance.

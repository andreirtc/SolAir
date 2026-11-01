# CPE remaining tests and paid-assembler release review — 22 October 2026

**Latest explicit instruction, 23 October:** user authorizes draft schematic and component-placement work now, before ACS final acceptance. Review draft A0 is available: [full circuit](../output/pdf/solair_cpe_full_schematic_draft_a0.pdf), [header/placement concept](../output/pdf/solair_cpe_header_placement_draft_a0.pdf), and [buy/reuse plus next ACS test](schematic-reference/draft-a0/BUY_REUSE_AND_TEST.md). This supersedes the earlier requirement to wait before any drafting. Final solderer release still needs measurement/electrical/mechanical closure; no current accuracy PASS, native EasyEDA project or measured socket-pad layout is claimed.

**Later user instruction supersedes this audit's parallel-work suggestions: complete and validate the CPE on the existing prototype first; freeze its accepted hardware/firmware/calibration; then start the final schematic and assembler package.** Run the remaining combined acceptance before schematic work under this sequence. Historical construction options below do not authorize concurrent drafting or partial paid assembly. The future soldered unit still requires verification after transfer. See CPE_CURRENT_ACCEPTANCE_STATUS.md for the active sequence.

Audit of the authoritative application records and the two existing CPE/DP1 Codex conversations. This is an evidence snapshot, not a new bench result, firmware upload, completed CAD design or assembly release. Preserve the user's requirement for one complete final package before paid soldering. Do not commission a partial build or restart passed module diagnostics.

## Latest conversation evidence

- CPE session `01a14d80-a26e-73d3-af7f-f5f7303f0019`: at 22:13 Manila the user reaffirmed correct bank assembly and rejected another photo request. Preserve the assembly and solder joints. The last user message read for this audit, 22:15:52 Manila, reports **“around 04.5 to 05.0”** after the instructed probe-tip short check on the 200-ohm range. Record this as approximately 4.5–5.0 ohms, user-reported; the meter/contact cause and subsequent resolution are not established. No duplicate physical check is issued by this audit.
- The earlier reported approximately 62-ohm bank reading remains unresolved as a reference. Do not subtract the probe-short value and call the result validated, infer a wiring fault, or calibrate current from nominal resistor labels/PZEM's own current. Keep the preceding power-off stopping instruction until the active bench review resolves the discrepancy.
- DP1/session `01a154ae-d2fd-7693-8502-223c8c8a1479` also remains relevant to shared-battery planning. Procurement statements do not establish electrical installation acceptance. Existing battery/controller/protection interfaces require their own reviewed limits; the resistor fixture is not that installed circuit.
- Actual accepted firmware evidence is 2.0.17, using ADS1115 A1 at the existing 10-kohm/10-kohm midpoint. Earlier disconnected-A1 captures cannot validate ACS. The 21:25/21:27 connected comparison records an approximately +4.000 mV mean change and PZEM 12.19–12.20 V / 0.12 A / 1.4 W. It establishes a bounded response observation, not accepted ACS amperes. No coefficients or flags changed here.

## Completed basics to preserve

USB telemetry; IMU response; lid/mount operation and recorded armed contact events; LED operation; reported siren automatic cutoff, DISARM, reset silence and disconnected-control silence; recorded outdoor GPS fix/supported walk; actual LTE delivery and bounded backend-path outage recovery; PZEM basic loaded response. These retain their original scope. No blanket combined-system, current-accuracy or installed-power PASS follows from them.

## Finite remaining-work register

| Work | Evidence still needed | Relationship to soldering release |
| --- | --- | --- |
| 1. Shared current reference | Resolve the bank/meter discrepancy already under review. Establish trustworthy isolated resistance and loaded voltage/reference with uncertainty before using V/R. Reuse retained observations where their conditions are valid. | Required to qualify the measurement design; not a new PZEM bring-up or request for another photograph. |
| 2. Mandatory ACS and ADC validation | Correctly connected input/reference agreement; stable zero and repeatable referenced current response at useful points covering the claimed operating range, polarity if claimed; accepted calibration and stated limits. Include any justified conditioning/protection change in the same schematic revision. Keep amperes invalid until accepted. | Electrical conditioning/input envelope must close before final circuit release. Firmware coefficients alone need not change the wires. The small bank comparison alone does not validate the whole range. |
| 3. Remaining PZEM measurement evidence | Actual physical shunt A/mV marking and matching meter setting; independent current/power comparison; energy progression over sufficient running time. Preserve loaded-response PASS. | Shunt/range/current-path facts belong in the released circuit. Energy observation can share the final combined run. |
| 4. Final power and logic design | Actual carrier supply/peak-current/UART/VDD/USB roles; GPS/automatic RS485/PZEM permitted supplies and communication references/isolation; regulator budget, source envelope, branch fuses, conductors, connectors and reset-safe alarm circuit. Reconcile all auxiliary supplies. | Wire-affecting release blocker. Successful GPS/LTE/Modbus operation does not supply missing electrical ratings. Resolve from matching documentation or qualified actual-board review without restarting working bring-up. |
| 5. Actual assembly drawing | Match the user's EasyEDA drawing to the actual 38-pin ESP32/module connectors. Record the real perfboard copper pattern/grid, socket spacing, orientations, mounting and USB/antenna/enclosure clearances. Produce consistent component-side placement and copper-side wiring views. | Required for the single paid-assembler package. Reported 120 × 180 mm dimensions alone do not define a pad layout. No completed reviewed EasyEDA/KiCad schematic was found in the checked workspace; a drawing open elsewhere has not been inspected. |
| 6. Final mounted and combined acceptance | Mounted motion baseline/threshold and armed trigger; all required sensors plus GPS/LTE and local alarms concurrently; missing-sensor handling; relevant restart/network recovery and stored event identity/replay; matching SOLAIR history/export. Existing recommendation: record at least 60 minutes, including PZEM energy progression. Credit prior bounded recovery tests. | Can run on the assembled unit after electrical release and assembly continuity/rail checks. It need not prevent drafting. It remains required before calling the complete CPE accepted. |

This is the existing remaining scope, not six new module tests. Final live Wi-Fi/fallback behavior, if claimed, also needs actual transport evidence; LTE-only receipts or USB forwarding cannot prove it. Preserve the current GPIO architecture and existing frontend work.

## Drawing corrections and established choices

- **ACS input:** ADS A1 connects to the existing divider midpoint/GPIO34 net, with no A1 ground tie. GPIO34 stays reserved/wired. Older references saying unused A1 is grounded or that 2.0.16 is merely awaiting upload are superseded by actual 2.0.17 acceptance.
- **Automatic TTL485:** GPIO16 receives its output; GPIO17 drives its input; GPIO23 stays reserved/unwired. Do not copy a manual MAX3485 DE/RE connection from older artwork.
- **IMU:** retain the actual 0x70 identity/MPU6500-compatible profile in the BOM; do not silently substitute a generic MPU6050 part claim.
- **Bench shared return:** bank return -> ACS IP+ -> ACS IP- -> shunt LOAD. Published Card 2 predates this ACS insertion. Local 57-row CSV contains it; the earlier 56-row published download is not final assembly documentation.
- **Installed measurement topology:** the existing EasyEDA decision sheet places ACS in the protected battery return and PZEM's shunt in the solar return. They measure different quantities when CPE also consumes power. Do not copy the removable bank into the installed circuit or expect the channels always to agree there.
- **Power selection:** a manual external-5V disconnect policy is already proposed. Its actual connector, complete supply domains and absence of backfeed still need review; do not reopen the policy as wholly undecided or claim it has been physically accepted.

## Single assembler package and stopping point

Provide one matching revision of: schematic PDF and editable EasyEDA source; measured placement and underside wiring; actual-part BOM with ratings; pin/connector/wire/fuse schedule; and assembly, continuity, rail-check and first-power instructions. Include the external shunt/ACS/siren/power harness and distinguish it from signal perfboard wiring. Keep credentials and provisioned private files out of the package.

Drafting can continue using confirmed nets. Release for paid soldering only when the wire-affecting electrical decisions and actual assembly drawing are closed. Final combined running and calibration verification on the assembled unit remain acceptance work. A deadline cannot establish physical PASS; this audit makes no tonight-completion guarantee.

## Sources checked

- CLOUD_CONTINUATION.md, latest 22 October entries.
- CPE_VALIDATION.md and cpe-evidence/2026-10-22-2127-connected-acs-load.json.
- CPE_CURRENT_ACCEPTANCE_STATUS.md, CPE_FINAL_ACCEPTANCE_2026-10-20.md and COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md, with later corrections taking precedence.
- CPE_PAID_ASSEMBLER_HANDOFF.md, CPE_PERFBOARD_BUILD_DECISIONS.md and CPE_SCHEMATIC_AND_ASSEMBLY_HANDOFF.md.
- schematic-reference/CPE_REV_A_CONNECTIONS.csv, CPE_REV_A_DRAWING_REFERENCE.md and EASYEDA_DECISIONS_2026-10-22.md.
- A7670_V100_HARDWARE_REVIEW.md, LTE_CARRIER_LISTING_REVIEW_2026-10-22.md and canonical firmware/solair-cpe/pins.h.
- Read-only Orca session-history search and the latest user/assistant turns of the two CPE/DP1 sessions above. No account/session material copied into the assembler package.

Validation of this audit: current pin-map and 57-row connection schedule cross-check; checked workspace for completed schematic CAD artifacts. No software changes, runtime commands, database writes, physical tests, calibration changes or additional test suite run were required.

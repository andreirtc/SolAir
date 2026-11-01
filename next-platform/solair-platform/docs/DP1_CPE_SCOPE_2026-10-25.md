# SOLAIR - current CPE work and two drawing packs, 25 October 2026

Use the existing assembled 12 V / 5 A adapter and HCW bench while the final 12 AWG arrives on 26 October. Keep the 48 V battery/PV separate from this bench. Shared-battery power remains the final source. Bench time is not autonomous battery uptime.

The latest workspace AGENTS requirement retains validated ACS current alongside PZEM for final CPE acceptance. The earlier proposed DP1/DP2 waiver is not an assembly release. Drafting and independent module work can proceed while ACS validation remains unresolved. No guessed offset, hidden drift or calibrated-current flag is introduced. The separate client-side UNCALIBRATED estimate never replaces canonical battery current or feeds energy/SOC/forecasting. Validated amperes remain invalid until measured stability, zero and known-current/reference response pass. A single 100-ohm low-current point cannot establish the whole claimed range.

## Two groupmates, two coordinated schematic packs

1. `SOLAIR_WHOLE_ELECTRICAL_COPY_B1.pdf`: E01/E02 whole-system vectors and S01/S02 physical endpoints, wire sizes and fittings. Use directly for paper/PPT; recreation in EasyEDA is optional.
2. `SOLAIR_CPE_CIRCUIT_COPY_B1.pdf`: S03-S06 CPE circuit, A01 actual-header assembly checklist and N01-N06 pin-to-pin copy list. `CPE_COPY_CONNECTIONS_B1.csv` contains 57 individual connections.

The full combined PDF includes all sheets. SVG sheets are provided for layout/export. These are review references, not an edited native EasyEDA project, verified ERC/netlist or measured 1:1-scale perfboard drilling template. The owner must finish matching physical placement/underside views from the actual parts and verify power/logic/USB/isolation/protection/reset-safe outputs before release. References U1-U11 match the supplied placement screenshot; U9 is deleted, U11 retained, U5 renamed 050B without changing its user-confirmed matching footprint. Heavy-current paths remain external to signal headers/perfboard tracks.

Confirmed wiring facts:

| Part | Existing connection |
| --- | --- |
| U10 automatic MAX3485/TTL485 | VCC ->ESP32 3.3 V; TXD output ->GPIO16; RXD input <-GPIO17; PZEM A/B/GND ->A/B/GND screw terminals |
| PZEM communication supply | 5V ->ESP32 5 V; communication GND as recorded; do not add measurement DC-/shunt reference bridges |
| U11 modem carrier | VCC ->5 V; VDD ->3.3 V; TXD ->GPIO13; RXD <-GPIO14; PWR_EN unused; no separate EN; unlabelled position gets no invented wire |
| GPS | VCC ->3.3 V; TX ->GPIO32; RX unused; logic GND |
| ACS conditioning | OU1 ->upper10k leg1; upper leg2 ->A1/GPIO34/lower10k leg1/C1 leg1; lower leg2 and C1 leg2 ->logic GND |
| C1 already fitted | 104 =100 nF, ACS divider midpoint toGND; not VCC-toGND |
| C2 already fitted | 470 uF /25 V, positive toshared ESP32/modem5 V, negative toGND |
| HW548/F5305S | SIG+ ->GPIO27; SIG- ->GND; DC+ viaexisting2 A12 V branch; OUT+/OUT- ->siren+/siren- |

These are user reports, not new physical measurements or manufacturer input-rating verification.

## Work order and backend checkpoints

Follow CPE top-to-bottom: retained bench/version ->readouts ->contacts/FSM/motion ->ACS validation status ->PZEM Wh ->GPS/LTE ->SOP4.5 method ->combined/recovery ->matching owner-reviewed drawings. Keep previous individual passes; do not restart serial bring-up or unchanged failed ACS loops.

B0 health/auth and assigned vehicle; B1 fresh USB frames; B2 USB forwarding ON for actual persisted records/export; B3 forwarding OFF for actual LTE receipts; B4 physical security action/history; B5 GPS/stale/history persistence; B6 combined records and recovery. Successful independent checks proceed without waiting for chat. Report failures as B# /firmware/source/boot+sequence/last backend receipt/expected->actual/exact error. Never include credentials.

The application runs at localhost:3000; the public Site is documentation. Read-only health200 is liveness, not telemetry persistence. Software fixtures and browser mocks do not establish hardware PASS.

## Groupmates and schedule

One groupmate copies whole-system vectors; another copies the CPE circuit and prepares matching physical header placement. Another records timed tests/video/CSV/Evidence JSON and inserts evidence into the already-finished PPT/Gantt. Mechanical dry-fit and the group's own layout are already done: await the missing box/screws, prepare the actual M8 base/washer/T-nut stack, leave lids accessible; do not force the example layout or redo dry-fit. Procurement checks actual DC fuse+holder specifications, stock and delivery. Existing1 A/5 A values are provisional search targets; normal-current arithmetic alone does not approve a protective device. Unknown250 V glass/automotive parts remain unverified on54.6 V.

Targets: review25October11:00; proposed solderer handoff13:00 only if reviewed; wire26October; actual perfboard return26-27October tobe confirmed with solderer; completion/testing/rehearsal by28October; defense29October. These are plans, not achieved release or a promised finish time. Preserve existing team owners/dates/status/evidence when exporting/importing the guide plan.

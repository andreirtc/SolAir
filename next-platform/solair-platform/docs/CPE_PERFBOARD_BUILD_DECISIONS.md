# CPE perfboard construction decisions — 22 October 2026

**Latest drawing scope, 23 October — two coordinated views of one circuit:** the user requires (1) the full CPE system schematic for the team's reference, thesis paper and presentation, including external power, measurement and alarm connections, and (2) a practical perfboard/header placement and point-to-point wiring drawing for the solderer. Both carry the same revision, module/connector references and pin/net assignments; the assembly view must not become a different circuit. The full schematic must be complete enough to follow independently even if that is the only sheet the solderer consults. Most suitable modules will plug into matching female headers; socketability, pin order and orientation must follow the actual boards rather than generic symbols.

**Special mounting and wiring cases explicitly named by the user:** MOSFET module, Peacefair/PZEM meter, HCW-P715 24 V/12 V-to-5 V buck converter, NEO-6M if not directly socketed on the perfboard, the actual RS485 board (called MAX3485 by the user, with upright male headers), and the external shunt. Show each item's actual mounting method and every external wire/connector endpoint in both applicable views. Upright headers do not by themselves establish direct-fit geometry or a need to replace the module; decide direct sockets versus a matching connector/harness from actual fit. Do not assume high-current wiring routes through ordinary signal header pins or generic perfboard tracks. Preserve existing GPIO/interface assignments. This scope clarification does not start drafting or change hardware; finish CPE acceptance first.

**Latest user workflow correction:** a hired assembler needs one final schematic/placement package before paid soldering. Do not use the earlier staged-construction suggestion as an instruction to commission a partial build. See [paid assembler handoff](CPE_PAID_ASSEMBLER_HANDOFF.md). Electrical and placement release remain unconfirmed.

Purpose: distinguish constructing the confirmed interconnections from accepting the entire powered CPE. Do not require the long combined run, final firmware coefficients or thesis exports before soldering the confirmed low-voltage socket/interconnection section. Preserve every completed basic test. This is a staged construction plan, not approval to energize unresolved power/logic interfaces or a completed CAD/pad layout.

## Construction baseline

Use removable module sockets and labelled signal connectors. Keep USB/BOOT/EN accessible. Fit sockets to the actual unpowered boards before soldering; no assumed header spacing, perfboard copper pattern or pad coordinates. On strip copper, isolate nets as needed and verify the intended connections/absence of shorts before installing modules or applying power. Work on the empty unpowered perfboard while the connected breadboard is being measured; do not move live breadboard wiring.

| Connection to retain | Exact signal endpoints |
| --- | --- |
| I2C | GPIO21 to MPU SDA and ADS SDA; GPIO22 to both SCL. Retain actual3.3V sensor rail and common logic ground, MPU AD0/ADS ADDR to ground. No extra guessed pull-ups. |
| Lid | GPIO25 to switch NO; switch COM to logic ground. |
| Mount | GPIO26 to switch NO; switch COM to logic ground. |
| LED | GPIO19 to330ohm resistor to LED anode; LED cathode to logic ground. |
| Alarm control | Label connector GPIO27 and logic ground for the existing tested active-HIGH driver interface. Keep siren current and its fused12V branch off the signal perfboard. |
| ACS signal | ACS small OU1 to upper10kohm resistor; its other leg joins lower10kohm resistor and the ADC node. Lower resistor's remaining leg to logic ground. ADC node to ADS A1 and retained GPIO34. A1 has no direct ground jumper. Keep this small network accessible/removable until the connected-input result closes. |
| Other ADS inputs | A0 labelled reference connector; A2/A3 grounded; ALERT unused. |
| GPS interface label | GPS TX to RX GPIO32 through the actual accepted module-level interface; GPS RX unused. Keep power/interface harness removable while its ratings are documented. |
| RS485 interface label | Existing transceiver TX to GPIO16; GPIO17 to transceiver RX. Current automatic-direction board has no external GPIO23 control wire. Preserve its existing A/B/GND serial harness. |
| LTE interface label | Carrier TX toward ESP RX GPIO13; ESP TX GPIO14 toward carrier RX through the verified carrier-level interface. Use a removable harness; do not assume its undocumented VDD header is a3.3V input. |

This fixes GPIO/interface allocation for construction. It does not newly validate an undocumented carrier voltage or authorize soldering an unknown logic-level connection permanently.

## Two circuit areas that can still affect the build

1. **ACS conditioning/connection:** the earlier A1 captures were disconnected from the ACS midpoint and cannot qualify its zero or response. Use the already arriving, newly connected stream; do not repeat I2C scans, firmware uploads or the cancelled3V3 reference test. Actual connected input and known-current response must qualify before enabling amperes. Zero/sensitivity values themselves are firmware data. Keep the divider/testpoint section accessible so a justified conditioning change would not require rebuilding the controller section. No guessed filter or zero correction.
2. **Power/interface harness:** close the actual carrier VCC/VDD/UART/USB role and source-selection decisions before hardwiring or energizing that harness. Keep successful LTE evidence and existing removable connections; no modem bring-up restart, speculative voltage change or new component purchase. Draw USB/external5V source exclusion explicitly. Exact converter/carrier/domain/protection facts remain required; sockets do not solve an electrical incompatibility.

Keep ACS primary current, PZEM external shunt, bank, siren load and installation-current conductors on their rated external harness/terminals. The removable100ohm/12V bench load is not an installed CPE component. Bench18AWG does not establish a vehicle-current rating.

## Finite sequence

1. Finish the connected ACS input/current comparison; retain PZEM's completed load-response observation. Reference/accuracy claims still require actual evidence. Sensor50A maximum alone does not mean a50A bench injection is mandatory; acceptance must match the actual claimed operating range and available evidence.
2. Resolve the two wire-affecting areas above and match the schematic/net schedule to the real build. Construct the already confirmed socket/interconnection section in parallel; final powered assembly release follows electrical closure. No promise of zero schematic revisions if a physical change is required.
3. After transfer, perform continuity/power checks appropriate to the soldered build and one combined functional/recovery run. Group LTE/GPS, security/motion and measurement/energy observations into that run; the existing60minute recommendation can be conducted on the assembled unit. Long soak and final calibration coefficients are not prerequisites to soldering the confirmed low-voltage section. Do not restart all passed basic module diagnostics.

Current software:2.0.17, existing private configuration, ACS_CALIBRATED remainsfalse. No firmware or wiring change is made by this document.

# CPE final acceptance and schematic release — 20 October 2026

**21 October update:** [Smart LTE commissioning preparation](LTE_SMART_BENCH_2026-10-21.md) supersedes the historical statement below that modemHTTPS/failover is unimplemented. Opt-in2.0.4 code is now prepared/compiled/tested with a temporary restrictedHTTPSendpoint; it is **not uploaded or physically commissioned**. Actualcarrier power/UART remains unresolved (userconfirms ESP325V/VIN supply), as do actualcellularPOSTandrecovery. Later prolongedGPSnofix also reopens its stability/movement acceptance; preserve earlier successful observations at their scope. No required final gate is waived.

This is the consolidated remaining-work list, not a new physical PASS. It reconciles the user-requested Orca session `01a154ae-d2fd-7693-8502-223c8c8a1479`, its current visual workbench, current finish checklist, validation history, schematic handoff and canonical firmware/backend. Earlier successful observations stay valid at their recorded scope. ACS validated current remains mandatory alongside PZEM. Another team owns frontend design.

## What is already retained

Firmware 2.0.3 uploaded by the group; real USB live delivery; LED and siren operation; lid/mount contact behavior and armed events/disarm; IMU movement using the MPU6500-compatible profile; user-reported ADS ground/reference agreement; PZEM voltage agreement near 12.3 V. Earlier standalone outdoor GPS fix is historical evidence. Do not restart basic tests from old unchecked template tables.

Missing exact ADS reference/tolerance records and unfinished combined/fault tests are not converted into PASS by those observations. A working transport frame, I2C identity, compile or illustration cannot prove measurement accuracy or electrical ratings.

## One remaining-work register

| Order / gate | Actual unfinished work | Evidence that closes it |
|---|---|---|
| 1. PZEM loaded measurement | Complete the protected 12 V resistor/shunt loop and two small sense connections. Preserve the working serial wiring. Establish the physical shunt A/mV marking and matching meter range. | Cold measured load resistance, loaded voltage, steady actual PZEM current/power and comparison with measured V/R and V²/R; independent current reference for an accuracy claim. Retain Wh progression over a sufficiently long run. Resolve any repeat of the earlier unexplained current spikes. |
| 2. ACS current — mandatory | Finish actual GPIO34 input stability, measured zero, divider ratio and adequate known-current/reference response. Determine the required current range and error/resolution from the thesis measurement claim before declaring accuracy. | Simultaneous input/reference records with and without the meter probe, repeatable zero before/after loading, reference comparisons at multiple useful currents spanning the claimed range, and polarity if bidirectional operation is claimed. Derive coefficients from evidence; validate again on integrated firmware. Keep current null/uncalibrated until passed. If conditioning changes are necessary, include and validate them before circuit freeze. |
| 3. Final electrical interfaces | Identify exact ESP carrier power path, modem carrier revision/input pins/supply envelope/peak-current needs/UART translation, buck operating envelope, actual automatic RS485 supply/logic and PZEM communication-side power/reference/isolation. Resolve USB versus external power selection. | A labelled power/domain diagram and actual-board documentation/measurements supporting every connected rail and signal, including full analog input/fault envelope. One reviewed supply arrangement avoids backfeeding independent outputs. Record actual connectors, pin numbers, wire ends, branch protection and source choice. No generic VIN/VDD assumption. |
| 4. Alarm/security | Retain successful switch and siren operation. Close physical reset/power-loss/disconnected-control OFF, final automatic cutoff and DISARM. Commission required motion detection on the final mounted assembly. | Actual switched-load observations and timing, safe OFF across relevant power combinations, and circuit bias/conditioning documented. Mounted motion baseline/thresholds and actual armed trigger/event test; MPU vectors alone do not establish motion alarm operation. |
| 5. Remaining measurement evidence | Preserve ADS tests, recover their actual readings/tolerance or close only that missing comparison. Obtain a current combined outdoor GPS fix and loss/recovery. | ADS reference/ground values with units and instrument limits; no guessed offset. GPS real position/UTC/satellites/fix age, plus honest invalid/last-known state when reception is lost. |
| 6. Real CPE → SOLAIR delivery | Real authenticated Wi-Fi upload and commissioned LTE fallback to the same backend/device/database; verify matching history, security events and GPS/energy fields. | Server receipt and persisted/exported matching device/boot/sequence/event identities with USB ingestion not carrying the wireless test. Registration/attachment is not LTE upload. Complete secure modem transport and reachable endpoint commissioning; see software gap below. Confirm required role/vehicle access and actual alert workflow; do not require a frontend redesign. |
| 7. Combined recovery/soak | Run all approved modules concurrently, including actual required wireless operation. Exercise network interruption, restart/reconnect and missing-sensor handling. | Recorded combined duration (existing guide recommends at least 60 minutes), no unexplained resets/freezes/measurement loss, GPS checksum/overflow observations, responsive local alarm under communications load, persistent records and once-only buffered event replay. Fault/overflow/loss must remain visible; records must not fabricate live or valid zero readings. |
| 8. Freeze and archive | Close all required rows above; reconcile actual build with one hardware design and final firmware configuration. | Versioned BOM, power/domain and connector tables, schematic net list/pin map, assembly layout, calibration coefficients/range/tolerance, secret-free configuration identity, logs/photos/reference readings and matching SOLAIR export. Release one schematic revision for the thesis; subsequent electrical changes require a recorded revision. |

Orders 3 and mechanical preparation can proceed alongside measurement work. We will give the next detailed physical procedure one test at a time; this register is the complete destination. No completion-time guarantee and no acceptance by omission of ACS, LTE or another required module.

## What the HTML actually establishes

The reviewed file is [the visual workbench](visual-workbench/SOLAIR_WORKBENCH_CARDS.html). The user’s two-resistors / middle terminal strips / two-resistors arrangement uses:

```text
J+ ─ R1 100 Ω ─ R2 100 Ω ─ J−
 └── R3 100 Ω ─ R4 100 Ω ──┘
```

Each branch is 200 Ω; two parallel branches total 100 Ω. At 12.3 V, predicted total current is 0.123 A and power 1.513 W. Four resistor cases do not make this a larger calibration current or establish the assembled plate's thermal rating. Use this cold-checked bank in place of the single loose 100 Ω resistor for the PZEM test; do not attach both loads or repeat a separate single-resistor test first.

For ACS758-050B, nominal sensitivity is 40 mV/A at 5 V, approximately 20 mV/A at GPIO34 after an equal divider. Thus 0.123 A yields only about 2.46 mV change at the ADC at that nominal supply, before accounting for the reported 4.7 V supply and actual calibration. This is too small to resolve the documented probe dependence/drift by assuming nominal coefficients. Even the HTML's 25 Ω / four-parallel illustration is only a calculation, not an accepted calibration load or rewiring instruction. A suitable safely limited load and adequately resolved independent DC current reference remain necessary; do not choose a higher current until the actual source, load, fuse and terminations support it. [Allegro datasheet](https://www.allegromicro.com/-/media/files/datasheets/acs758-datasheet.pdf).

Card 2 and the [complete PZEM procedure](PZEM_12V_RESISTOR_FULL_GUIDE.md) now agree: source positive → inline test fuse → positive common junction → separate meter/load feeds; load return through the large shunt connections; separate small sense wires; negative common junction. Actual suitable branch connectors, strip links and end fittings must exist. Adjacent terminal-strip positions are not automatically a bus.

Some retained artwork still says MPU6050/MAX3485 and labels the PZEM pins RX2/TX2. Actual build records govern the BOM: WHO_AM_I 0x70 uses the MPU6500-compatible driver, the present board is automatic TTL485 v2.0, and firmware uses UART1 for RS485, UART2 for LTE, software RX32 for GPS. The pictured 50 A / 75 mV shunt label is not proof of the photographed shunt's complete rating. These are reconciliation items before copying artwork into the schematic, not reasons to rewire working signals.

## Mechanical work that can proceed

**Resistor plate:** dry-fit the real four resistors and insulated strips, then select actual fitting through-bolts/nuts/washers and mark from the mounting feet. M3 is a candidate from the reported 3 mm hole, not a confirmed bolt length/clearance/torque. If there are two feet per resistor, eight fastening sets are needed. Drill only the bare plate with components/wires removed, then deburr and remove chips. Refit flat bases; maintain terminal/plastic/wire clearance from hot cases. Check bank resistance and each bank terminal to bare plate with everything unpowered. A DMM open-circuit result is a useful screen, not an insulation certification or high-power thermal approval.

**CPE enclosure / perfboard / final harness:** dry-fit and mark provisional positions now. Delay final holes/cuts/soldering until board footprints, standoffs, power/USB arrangement, connectors, gland routes and lid/service/antenna clearances are fixed. A later analog interface or UART change could otherwise force physical rework. Do not drill extra isolator holes; use its compatible factory entries.

**Glands / rails:** exactly five purchased PG9 glands are recorded; their fit and sufficiency are not verified. M20 × 1.5 coin-slot parts are blanking plugs, not glands. Match the real factory entry, wire/cable outside diameter and sealing arrangement; PG16 is not a direct M20 replacement. Boxes need actual feet/brackets/plate-to-compatible-T-nut mounting on a mechanically secure rail structure. The graphic is not a scaled mounting or roof structural release.

**Auxiliary source:** keep the existing adapter for current bench acceptance. The later motorcycle-battery suggestion is conditional on actual battery label, fuse/short-circuit protection, voltage envelope and reviewed standalone connections. It has not been electrically approved and does not demonstrate solar charging. A change of source must be reflected in the power/protection design before claiming that design final.

## Concrete software finding

Canonical [engine.h](../firmware/solair-cpe/engine.h) has authenticated Wi-Fi POST with CA verification for HTTPS. `ltePost()` currently refuses any URL outside the explicitly commissioned private-HTTP bench path; carrier-specific modem HTTPS/CA handling is not implemented/commissioned. Ordinary SIM Internet service does not provide a route to the laptop's private LAN address. Registration and attachment alone cannot close final Internet fallback.

The current transport choice tries Wi-Fi whenever associated and selects LTE when Wi-Fi is disconnected. An associated Wi-Fi network with a failing/unreachable backend does not automatically select LTE. Before claiming general delivery-failure fallback, define and implement the retry/failover policy and test it against the actual commissioned transport. Do not bypass certificate validation or expose device tokens over public HTTP to mark this done.

The backend already has credential, schema/quality, persistence, history/export and replay/conflict checks. Fresh review run: **Node 24.22.0, `npm test`: 51/51 PASS**, isolated software tests on 20 October. This is software evidence only. No production database fixtures, physical commands, firmware uploads, wiring changes or new bench PASS were produced by this audit.

## Schematic decision and system boundary

Draft the known GPIO architecture now if useful. For the user's preferred workflow of finishing CPE first and then focusing exclusively on the schematic, close the eight rows before calling the CPE final. Circuit release depends on electrical/physical evidence; a drawing itself cannot close those gates. Do not promise the same unverified circuit will need no revision.

The HTML also contains MPT commissioning, PV power delivery, actual charging, VAWT and roof/rack tasks. These are distinct SOLAIR system milestones. A finished adapter-powered CPE does not finish them. Freeze explicit CPE interfaces to reviewed power/metering/charging subsystems; never feed boosted MPT voltage into the 12 V siren/buck/ESP circuits by assumption or connect a vehicle bus/BMS bypass. The existing 100 Ω bank proves a load, not storage or charging. Missing wind controller means wind remains unavailable, not measured zero or completed production.

Next physical task remains **Card 1 cold bank check → complete Card 2 PZEM loaded measurement**, using the full guide, with no change to the working serial wiring or 2.0.3 upload. No source push, hosted HTML change or frontend redesign was performed for this audit.

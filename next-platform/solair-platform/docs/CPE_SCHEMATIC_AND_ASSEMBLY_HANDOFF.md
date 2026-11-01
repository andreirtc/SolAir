## 25 October — short assembler USB check

Use the existing2.0.19firmware with `public/SOLAIR_ASSEMBLY_MONITOR.html`: close other serial clients, open the file in desktop Chrome/Edge, connect ESP32 at115200. The file displays labelled module rows and one physical check beside each; optional Save USB report returns a bounded observation record. No login/internet/replacement firmware required. This is a reader for the same contract, not another website or assembly-release approval. Refer to current validation entry for software fixture evidence and unresolved physical gates. Do not replace ACS calibration or LTE server-receipt acceptance with displayed status. No long solderer manual is required by this addition.

## 25 October — connector footprints, J12 boundary and perfboard calibration workflow

Clarification: J12wasfunctionalgroupingofW3/W4four12Vfeedwires, notanowned/purchased4pinheader. ExistingW3/W4WAGOsarebox-mountedinsideCPEenclosure, notperfboard-soldered. Fullsystemdrawingmustshowthemoffboard; noJ12signalheaderpowerfootprint. EachremoteKW11getsactual2pinperfboardconnector(GPIO25or26/GND), withNO/COM stillshownonexternal switch;NCunused. J_TEST1×5final; GPSremovable4pinsocketinsideplasticenclosurewithpatchskyfacingandclosed-lidfixvalidation. ExternalACS3pinsandHW548control2pinsmayuseactualheaders, highcurrent/sirenpowerstayoutsideperfboardtracks; PZEMA/B/GNDretainsU10screwroutewithoutnewmeasurementgroundbridge.

Created CPE_PERFBOARD_CONNECTORS_AND_CALIBRATION_2026-10-25.md for assemblerreference. Actualperfboardcalibrationrequiresstablereferences,independentreferencecurrentsdeclaredrange/error,verifiedzero/sensitivity,postupload/reset/LTEvalidation. Existing100ohmbankcanprovideonlylowcurrentpoint;noseveral-ampererangecertificationorperfectionpromise. Currentbackendcalibrationendpoint/UIrecordsJSONandevidence;doesnotapplycoefficientsorupdatefirmware. Currentcoefficientsliveinfirmwareprivateconfigandrequireintentionalrebuild/uploadaftermeasuredqualification. User’spreferredpostperfboardtestingretained; no newbreadboardtestrequested.

## 25 October12:35 — final optional-access header fixed atfivepins; next independent testLTE

User has sufficientmaleheaders and asks tolockchoice. One1×5male2.54mmheaderJ_TEST is final for diagnosticaccess:1OU1(beforeupper10k),2A1(midpoint),3commonlogicGND,4actualexistingACSVCCrail,5actualADSVDD3.3V. Eachpinisolated; shortparallelbranches, nointernallycommonWAGO-stylejoin. Noadditionaldiagnosticheaders required; actualmodule sockets/externalwire entriesremain asdrawn. Addedtestbranchesdonotcorrectmeasurementthemselves.

Read-onlylateststored2.0.19reports12:19:43–53 remainUSBonly; LTEdiagnosticpaused_use_LTE_ONCE_or_LTE_ON, endpointsavedtrue butreportedendpointdoesnotmatchcurrentquicktunnel. LastactualLTErow22October15:22Manila/2.0.15; donotcallcurrent2.0.19LTEpassed. Nextindependentwork is finite2minuteLTEreceiptcheck onexistingreviewedbench: DISARMED, USBmonitorconnected, UpdateLTEaddress/awaitsavedcurrentendpoint, forwardingOFF, StartLTEonce, verifyfreshactualLTEreceipts. Ifnoactualreceipt, saveLTEdiagnostic/HTTPresultandstoprepeatingStart. NoACS/groundrewiring or repeatedswitchtestordered. Perfboard/schematicreviewproceedsinparallel; finalACSvalidationremainsrequired.

## 25 October12:21 Manila — user stops repeated breadboard diagnosis; prioritize reviewed perfboard handoff

User reports meter200ohm tips-together stabilizes0.7ohm. Groundrail→ADSGND withjumper installed reported2–3ohm; removed readsleftmost1. This establishes a connection-dependent groundpath but doesnot isolate jumper/contact/breadboard/reference failure. Do not claim breadboard is proven solecause or that perfboard soldering fixesACS. Previous0.27–0.30Vgrounddifference variedtozero, and actualACS/ADCreferenceaccuracyremainsunresolved.

User explicitly says no time for more repeatedbreadboardchecks and prefers diagnosis on the completedperfboard. STOP this live ground/ACS testloop now; no more coldground, VCC, bank or identicalzero/load captures requested. Preserve stableGPIOarchitecture, femaleheaders, actual2×10kdivider/104midpointcap and470uF5Vbulk. Prioritize completecircuit+matchingactualheader/top/underside/layoutreview and assemblerhandoff. SharedgroundandlabelledOU1/A1/GNDtestaccess must be explicit. HighcurrentACS/shunt paths stayexternal. Use removablemodules and accessibleconditioningparts so corrections remain possible.

Drafting/physicalplanning proceed without ACS calibration; actual ownerassemblyrelease still requires existing power/logic/USB/isolation/protection/reset-safe-outputandconnectorfacts, not merely correctGPIOpin names. ACS calibration is not waived or markedPASS: validate stablezero, reference response, range and integrated/powercycle behavior on actualfinalassembly before acceptingamperes. KeepACS_CALIBRATEDfalse/canonicalcurrentinvalid. No guarantee ofassemblyduration or13:00handoff; no new hardwarepurchase, firmware/privatecoefficient/datachange. Stop bench power whenpaused. User-reportedswitchwiringresecuringresolvedthatunwantedtrip in theircheck; mountedswitchtestdeferreduntilperfb ready.

## 25 October — C3 clean electrical / CPE diagram routing

Primary drawings now use eight native SVG sheets: electrical A–E (PV input, LONQ/shunt, protected battery, converter/CPE feeds, PZEM) and CPE F–H (communications, I²C/ACS conditioning, switch/alarm/power). GND/+3.3V/+5V supply labels remove long power runs; +5V_RAW and 12V_RETURN remain distinct. All signal wiring stays drawn. Repeated U1 means the same ESP32; repeated WAGO tags mean the same five existing connectors. Earlier crowded views are closed reference disclosures; existing perfboard views and original artwork retained.

Structural checks preserve all 38 external and 31 CPE canonical nets/endpoints, with zero different-net crossing/touching segments. Browser tests pass trace/dim/reset/zoom, unique IDs/options, 39 ordered cards, downloads, mobile and offline views. Clean-sheet rendered text/text and text/conductor collision checks return zero; native SVG labels bypass prose spacing substitutions. Evidence: cpe-evidence/2026-10-25-clean-c3/; generators: schematic-reference/clean-c3/.

Documentation consistency only: no wiring/assembly acceptance, protection approval or ACS physical PASS. Existing USB/modem/RS485/domain checks and mandatory ACS stability/zero/reference validation alongside PZEM remain required. No backend, firmware, private data or localhost3000 changes.

## 25 October — C2 connected schematics, real board views and selected header stock

Current copy-reference sections replace B1 block/table pages with full connected native SVG circuits: whole SOLAIR (38 nets/39 wire branches), CPE actual supplied pin arrangements (31 nets/61 wire branches), 180 × 120 mm isolated-pad perfboard top and mirrored underside (19 nets/50 wire branches), and loose-wire solder-entry cross-section. Trace selection/zoom, SVG/PNG downloads and two vector PDF packs are available in the same guide. U11 has eight physical header positions, including unused O and PWR_EN; no separate EN is invented. No new PZEM communication-to-shunt/measurement ground bridge is introduced.

User-selected sockets: two continuous 1×20 female strips for ESP32, 19 occupied and one unused at the same top end on each row; one 1×12 ADS strip, first ten occupied and final two unused. Extra 4/3-pin and male headers are stock, not mandatory cable connectors. Dedicated round isolated pads accept loose external conductors, with insulated underside jumpers to the actual socket tails. F5305S SIG+ → ALARM CTRL pad → GPIO27; SIG− → ALARM GND pad → logic GND. PZEM communication 5V uses its solder-entry pad; A/B/GND retain direct MAX3485 screw-terminal connections.

Measured modem envelope 32 × 57 mm and reported ESP32 row distance 26.5 mm are recorded. That distance is not declared a standard-grid fit: owner must loose-fit both strips without bending pins before soldering. Other module outlines are placement allowances, not a factory drill template. IMU remains on the main perfboard, with nearby clearance and fixed insulating opposite-edge support. No native EasyEDA project/ERC or owner assembly release is claimed.

The invented stable 1.50 A main calculation example is removed. Separate label-derived cases are 48 V × 10 Ah = 480 Wh prototype and four 27.6 V/40 Ah/1104 Wh modules in 2S2P = 55.2 V × 80 Ah = 4416 Wh BEMAC. Unit derivation, interval energy sum, integral and sampled trapezoidal formula are explained; measured operating V/I/time remains required. Nameplate 400 W arithmetic is not measured harvest. Wind/interface and protective-device checks remain unresolved where previously documented.

Evidence: `cpe-evidence/2026-10-25-wired-c2/`. Targeted browser checks cover connected SVGs, header extras, wire entries, calculations, downloads, mobile/offline and no JS errors. Structural checks cover endpoint connectivity and no conductor segment shared by different nets; PDF pages visually reviewed. These are documentation/software results only. Latest AGENTS still requires validated ACS input stability/zero/reference response alongside PZEM; no physical PASS, firmware upload, current calibration, app/frontend merge or private-data change.

## 25 October - current bench plan and coordinated copy references

Latest workspace AGENTS retains validated ACS stability/zero/known-current response alongside PZEM for final CPE acceptance. Independent module testing/drafting may proceed; the earlier proposed diagnostic-only DP1 waiver is not an assembly release. Separate read-only UNCALIBRATED estimate does not populate canonical current/energy/SOC/forecasting or calibration flags. User confirms original adapter/HCW/breadboard available while12AWGarrives26October. Finish target28October, defense29October. See [today's scope](DP1_CPE_SCOPE_2026-10-25.md).

Two coordinated whole-system/CPE vector-copy PDFs and57-rowCSV use actual U references and newly confirmed U10VCC3.3V, GPS3.3V, PZEMcomm5V, U11VCC5V/VDD3V3/PWR_ENunused/no separateEN; existing104midpoint capacitor and470uF25Vshared5Vbulk included. Original placement screenshot is only symbol/footprint evidence, not a native reviewed netlist. Owner must finish actual measured header placement and electrical interface/protection review before assembly. Whole-systemPDF/SVG may be used directly without EasyEDA recreation. No physical PASS or new firmware upload.

## 24 October — current full wiring and test guide

See latest CLOUD_CONTINUATION entry and `visual-workbench/dp1-hub/electrical_complete.py`, `switch_mount.py`, `resilience_demo.py`. Preserve existing current topology/GPIOs. Complete high-current endpoints and SB50 contact gauge issue are documented; actual power/USB/RS485, fuse/controller and measurement acceptance remain required. No added current meter purchase. V/R load reference does not qualify entire ACS useful range or CPE power budget. SOP4.5 timed autonomous operation is a physical run; strict transmission timing capture is not yet implemented.

## 24 October — design search targets versus actual hardware release

Latest electrical audit supersedes earlier unconditional exact-fuse buy wording:5Aconverter/1APZEM are selected DESIGN targets under explicit60W/85%/5W assumptions; actualDCparts/coordination/startup remain unverified.48Vnominal is not a minimum; earlier40Vwas not a confirmedBMScutoff. FourToshiba27.6V40Ah1104Whmodules2S2P=55.2V80Ah4416Wh;56–60Vobserved is not an OEMchargeceiling. Prototype13Ssettings do not establishBEMACcompatibility. Same-siteguiderevision is not hardware/soldering release; preserve oneGPIOarchitecture and mandatory validatedACS+PZEMacceptance.

## 24 October — DALY side placement is not an extra nickel connection

Actualcasereferencehastwocircularmotifs/bothpowerleadsononeedge;nativeguideupdatedplusphysicalpack/BMS/W5placementview. OnlyoriginalBLUEB−attachesknownTOTAL−nickel;BLACKP−→W5hole1, W5hole2→mainnegative/ACSIP+,3–5spare. Connectorrestrainttakeswireload,notnickel. Photoisappearance-only,notpolarity/balance/currentratingevidence; noassemblyPASSorlimit/GPIOchange. Mainbattery/return/placementpicturesdefaultalltokeepbothP−connectionsvisible.

## 24 October — solar-only DP1 branch revision for the single schematic

Userdeferswallcharger/socket. Remove separatechargebranch in thisDP1revision; donotbuy/drawaT-prongmate asrequired. W5onlyoriginalP−in1andmainnegativein2→ACSIP+;3–5spare. KeeprawB−andpost-ACSW2distinct. SelectedF1=5ADC10×38high-interruptingfuse/holderonW1opening3→converterIN+,12AWGRED; F2=1ADC10×38high-interruptingfuse/holderonW1opening5→12AWGRED→insulatedsolderedreduction→22AWGREDPZEMDC+/terminal4. Gauge reductionafterF2; noextraWAGO. Retain15A500VDCmainfuse; owned5Aautomotivesetonregulated12VOUT+→W3,existing2Aalarmbranch. Unmarkedautomotivesetsnot54.6Vparts. F1isaboundedCPEbranchselection,not25Aconverterrelease;startupopens→stop/reviewinrush,nobypass/upsize. Exactfuse/holderauthenticity/terminalfit/physicaldryfitandexistingground/USB/domainreviewstillrequired.

IMUonthemainperfboard:existingmaleheader→solderedfemale2.54mmsocket;oppositeedgefixedrigidinsulatingblock/factory-holeretention. No loosejumperbundle/independentIMUbase; preserve3.3V/GND/SDA21/SCL22andfixperfboardtoboxposts. Allguidepicturesupdated;originalreferencearchivepreserved. NoGPIO/firmwarechangeorphysicalPASS. Finalassemblyacceptancestillrequiresverifiedpower/logic/protection/resetoutputsandvalidatedACS+PZEM;nearfull54.6Vtotalisnotchargeorcell-balanceacceptance. SeeCLOUD_CONTINUATIONlatestforproductsourceandsoftwareQA.

## 24 October — measured component mounting and DP1 dry-weather boundary

Latest user-reported stock: three6ft4040rails, M8T-nuts/screws, panelclamps/zipties; one150×150×70box, one255×200×120box; delivered converter100×60×30mm. Same documentation guide now shows smallKW11body/mountstrip/M2holes versus M8rail attachment, fixed bench-block removal-input fixture, actual IMU breakout/spacer/perfboard support and all-five-WAGO endpoint map. Fixture remainsDP1inputdemo, not final rack theft acceptance; no firmware/GPIO change. Converter-only200×150×100ABSgasketedblankwallcasewithmountplate recommended subject to usableinterior; sunnyDRYDP1only, first loaded converter testopenlidguarded, closed-case thermal/rain operation unreleased. Existing fusebox/posts+phenolic retained. PZEM/shunt/ACS crowding into150mmbox is not approved by a picture. Branchprotection/DCratings, USB/isolation and validatedACS+PZEM still govern assembly release; diagrams/tests are not hardwarePASS. See CLOUD_CONTINUATION latest entry for procurement and30scene software QA.

## 24 October — known battery ends and detection scope supersede earlier identification hold

Group confirms total+/−nickel ends already identified and nickel/BMS solder work reported. Remove repeat-identification/photo/return-to-assembler requirement; retain actual B−/P− completion, exact balance-wire checks and protected-output/charging acceptance. Supplied B−blue→known totalnegative; P−black→W5externalnegative, never nickel. Guide version9 explains ordinary insulated wires rather than requiring special pigtails. T-prong/C13-style charger mate is a family inference from described slots; no available8A-ratedmatching socket or pinout is approved from a generic listing. Lid switch is planned final box-opening detection; separate removal fixture isDP1only. Whole-system/component-theft claims require actual fixed-support/motion tests, not a hand-operated switch or animation. GPIOs/FSM and mandatory validated ACS/PZEM remain unchanged. See latest CLOUD_CONTINUATION.md entry for source/evidence/publication.

## 24 October — DP1 fixture / actual pack connection clarification

User selects lid switch inside the plastic enclosure and a separate labeled removal-input demo fixture; preserve GPIO25/26, actual secure-contact ARM condition and rigid IMU trials. This changes DP1 test placement only; it does not remove final lid/removal sensors or constitute vehicle-mount acceptance. Original BMS B−/P− power leads remain unfinished; exposed nickel tabs have not been physically identified. B− goes only to verified full-stack negative, P− to protected external negative, never a nickel strip. Correct charger is black three-contact T-Plug3Pin, not red Deans; solder-side mapping and third contact remain unverified. Current five-WAGO role map, short procurement and entry repair facts are recorded at the top of CLOUD_CONTINUATION.md and public guide version8. Assembly release and mandatory validated ACS/PZEM acceptance remain unchanged; no physical PASS.

## 23 October — team completion handoff and candidate 2.0.19

Latest user instruction: implement the explicit DISARMED/ARMED/TRIGGERED FSM, prepare clear team instructions with enclosure visuals and concurrent motion testing, finish real battery/ACS/PZEM measurements, and leave the final schematic to the owner after returning. User confirms BMS installed. Candidate2.0.19 now implements the FSM, independent source/quality-gated battery/solar publication, validated ACS range guards and concurrent motion-window diagnostics; backend contracts/storage/output-energy integration and functional diagnostic text are updated. Existing private calibration/motion acceptance flags remain off and no coefficients are guessed. Last confirmed physical upload remains2.0.17.

Software PASS:84backend tests,26CPE/LTE tests on PostgreSQL-compatible PGlite, TypeScript, hostC++ policy/decoder tests, isolated production build and exact Arduino core3.3.12 compile(1,226,008flash/53,152RAM). Browser fixtures cover LTE controls/map and the team guide. These are not physical acceptance. Source and secret-free downloads: [integration contract](SOLAIR_CPE_2.0.19_INTEGRATION_CONTRACT.md). Existing account-owned workbench: https://solair-cpe-workbench-oct22-rtc.sandygull6.chatgpt.site/team-handoff.html . Current publication evidence is recorded separately after deployment.

The guide gives12numbered/related sections,4nativeSVG diagrams, all branch endpoints, correct/wrong observations, finite ACS screening/calibration steps, mounted simultaneous motion procedure, DP1 FSM scope, remaining power/measurement/hosting facts and exportable local evidence checklist. Original workbench artwork/cards remain accessible. No new live application/site was created. Progress is browser-local, not a shared cloud PASS record.

ACS must still pass stable input/zero, independent references/useful signed range and power-cycle checks alongside PZEM. DP1 contact demonstration does not waive final current/motion acceptance. Protected battery power, converter/USB/isolation and branch protection facts, actual GPS/LTE/remote-driver and combined recovery remain physical/configuration work. Schematic/perfboard release stays with the owner; no partial paid soldering or release of a draft. Earlier entries below are historical; missing software publication statements describe the prior candidate.

# SOLAIR final CPE — schematic and assembly handoff

**Latest explicit instruction, 23 October:** user authorizes draft schematic and component-placement work now, before ACS final acceptance. Review draft A0 is available: [full circuit](../output/pdf/solair_cpe_full_schematic_draft_a0.pdf), [header/placement concept](../output/pdf/solair_cpe_header_placement_draft_a0.pdf), and [buy/reuse plus next ACS test](schematic-reference/draft-a0/BUY_REUSE_AND_TEST.md). This supersedes the earlier requirement to wait before any drafting. Final solderer release still needs measurement/electrical/mechanical closure; no current accuracy PASS, native EasyEDA project or measured socket-pad layout is claimed.

**Latest drawing scope, 23 October — two coordinated views of one circuit:** the user requires (1) the full CPE system schematic for the team's reference, thesis paper and presentation, including external power, measurement and alarm connections, and (2) a practical perfboard/header placement and point-to-point wiring drawing for the solderer. Both carry the same revision, module/connector references and pin/net assignments; the assembly view must not become a different circuit. The full schematic must be complete enough to follow independently even if that is the only sheet the solderer consults. Most suitable modules will plug into matching female headers; socketability, pin order and orientation must follow the actual boards rather than generic symbols.

**Special mounting and wiring cases explicitly named by the user:** MOSFET module, Peacefair/PZEM meter, HCW-P715 24 V/12 V-to-5 V buck converter, NEO-6M if not directly socketed on the perfboard, the actual RS485 board (called MAX3485 by the user, with upright male headers), and the external shunt. Show each item's actual mounting method and every external wire/connector endpoint in both applicable views. Upright headers do not by themselves establish direct-fit geometry or a need to replace the module; decide direct sockets versus a matching connector/harness from actual fit. Do not assume high-current wiring routes through ordinary signal header pins or generic perfboard tracks. Preserve existing GPIO/interface assignments. This scope clarification does not start drafting or change hardware; finish CPE acceptance first.

**23 October — assembler-facing drawing requirement:** user clarifies the hired solderer will follow the schematic and physical connection drawings, not read the validation/handoff narrative. The build uses many female headers so modules can plug into sockets. The released drawings must stand alone: identify each actual module and female header, pin names/numbers, orientation and the viewing side, and every required wire endpoint. Show power/ground, any protection/conditioning/driver components and external connections explicitly. Include a pin-to-pin socket/placement view where the schematic alone cannot establish physical orientation; do not invent footprints or mechanically compatible pin order from generic module symbols. Validation records remain the team's design evidence, not required reading to discover a connection or resolve an unknown electrical decision. This clarification does not request drafting now, authorize a pin/interface redesign or establish electrical PASS. Finish CPE first, then produce the single final drawing revision.

## 22 October — prepared ACS ADC-source amendment

For preparedfirmware2.0.16, removeADS1115A1fromGNDandaddittotheexistingACSdivider midpoint/GPIO34net. GPIO34remainsreserved/physicallyconnectedbutnativeADCisnot sampled inA1mode. See [precise amendment](ACS_ADS1115_A1_FIX.md). Thiscandidateiscompiled, notuploaded/physicallyvalidated. Earlierunused-A1groundtablesapplyto2.0.15baseline; do notgroundA1afterthisamendment. NootherGPIO/primarycurrentlocationchange. Currentcalibrationremainsmandatoryanddisabled.


## 22 October — draw now from one Rev A reference

Use [the six-sheet drawing reference](schematic-reference/CPE_REV_A_DRAWING_REFERENCE.md) and [56-connection CSV](schematic-reference/CPE_REV_A_CONNECTIONS.csv) while the group finishes Card2. Current firmware2.0.15 and established GPIOs govern older version notes below. This package is not completed CAD or an assembly-released schematic. Keep power/carrier/USB, analog conditioning/envelope and external shunt/current-path/protection release items visible; mandatory ACS accuracy and remaining acceptance are not waived. The removable resistor bank goes on a test-fixture sheet.


## 22 October 01:14 Manila — PPP retained-call cleanup corrected in prepared 2.0.11; actual 2.0.10 LTE receipt recovered

After user enabled USB forwarding, real2.0.10 boot `e31cb79937ebfc70b688b3e6` advanced without MCU reset. AT response/registration/attachment returned but PPP attempts repeatedly failed before IP. Later **actual transport=lte receipt01:07:46.667 seq296** reached the real backend, followed by USB seq305/306 reporting201 and seq307/308 reporting200. User had USB forwarding enabled, so duplicate200 is expected and does not establish additional newLTErows. Latest stored receipt at inspection01:12:46 remained01:07:53.791; do not describe it as currently live or a sustained recovery/soak PASS. Intermittent recovery on2.0.10 is observed; no stable warm-reset result yet. Native connection detail in the actual received frame included TCP errno119 and PPP reconnect scheduled; do not attribute all delays solely to PDP cleanup or assume SIM/APN/power failure.

Found and corrected a concrete lifecycle omission:2.0.10 `stop()` returned PPP to command mode with+++ then destroyed the MCU PPP driver without always hanging up the modem PS call; its already-AT-ready recovery branch also returned withoutATH. SIMCom A76XX manual2.2.5 explicitly says+++maintains the data connection, while2.2.3ATH terminates PS calls. This is a code defect, not proof it alone caused this hardware's failures. **2.0.11** now performsATH plus settle/AT resync even when already command-ready, after PPP teardown and before fresh dial. No guessed APN, PDPprofile overwrite, factory reset or power-pin operation. The code separates dial/PDP activation rejection from IP-negotiation timeout, captures native PPP error/phase and bounded CEER reason when command mode permits, and provides a45-second IP negotiation window.2.0.10 persisted Start/Stop, clock validation, timed recovery and explicit waiting logs remain. Normal alarm/sensor/GPIO/credentials behavior unchanged.

Exact private Arduino3.3.12 compile PASS: **1,221,556bytes flash(93%)**,52,936RAM(16%), same default partition. Host recovery/hangup-failure/clock/intent/TLS/APN/failover fixtures PASS; existing alarm/PZEM safety and native ACS driver fixtures PASS. Generated16IDEfolders are identical to shared headers; candidate2.0.11 is not yet flashed or physically validated. The first compile session was interrupted by new user input and produced no completed result; the restarted final compile completed successfully. Logs `docs/cpe-evidence/2026-10-22-lte-ppp-hangup-*`; private candidate archive under`.tools/cpe-candidates/2026-10-22-2.0.11-ppp-hangup/`. Preserve working2.0.9 and prior2.0.10 archives. No source push or secret output.

Next physical action: reopen final `firmware/arduino-ide/solair_cpe/solair_cpe.ino` from disk and upload2.0.11 with the existing reviewed USB setup/core3.3.12/ESP32DevModule/actualport, websiteUSB disconnected and Serial Monitor closed. Reconnect website115200, verify2.0.11. Saved streaming intent may resume by itself; pressStart only if paused. Keep USB forwarding ON temporarily for diagnostics, then OFF once actualHTTPsuccessreturns to verify fresh transport=lte rows. Verify an ESP32-only EN reset while modem remains powered resumes uplink without Start. Capture LTEworking ACSzero baseline only after that path is stable. Physical upload/measurement still requires connected equipment; do not call entireCPEfinal from compilation or single recovery receipt.

Current remaining acceptance grouped for user: six technical areas—LTE restart/delivery/events workflow reliability; mandatory ACS stablezero and multiple known-current references; PZEM loaded/shunt/reference and energy evidence; ADS missing exactreference/tolerance evidence; carrier/power/USB/logic/protection verification; final mounted motion/combined fault/recovery/event-replay/soak. Then freeze matching BOM/configuration/evidence for one revision-controlled schematic. Basic siren cutoff/manualstop/reset/disconnectedinput and supportedGPSwalk passes retained; do not restart those basic checks or invent a completion percentage/time. Solder is still missing for resistorbank; keep it unpowered.

Primary source: SIMCom-authored A76XX AT command manual sections2.2.3/2.2.5/2.2.6, mirrored at https://www.tinytronics.nl/product_files/004977_A7670-Series_AT_Command_Manual_V1.06.pdf .

## 22 October — 2.0.10 modem-reset recovery repair compiled; upload and physical verification pending

User explicitly asks to resolve the failure now rather than repeatedly defer it or require full power resets. Repaired firmware path after source review:2.0.9 attempted orphaned-PPP command-mode recovery only once at transport startup; if AT readiness failed, pending LTE requests remained gated forever without a fresh HTTP result. Actual physical cause of AT silence is not proved; no software can restore a physically unpowered modem or validate its electrical interface.

Prepared **2.0.10**: new shared `lte_recovery.h` performs bounded AT sync / guarded escape / hangup / resync with up to two escape attempts; transport retries recovery15seconds after a failed attempt while a request is active and owns the UART exclusively. AT-ready state is correctly published back to sensor/transport state; pending query flags are cleared. Explicit serial waiting messages distinguish no modem response, network registration and packet attachment; an HTTPS-attempt message precedes the actual request. Recovery is in the transport task, not the security loop. No automatic MCU/modem hardware reset, new power wiring or undocumented carrier pin operation.

Explicit Start now saves streaming intent in existing NVS; reset restores a previously started stream. Stop saves paused intent; first/unset boot remains paused; Test Once does not itself enable persistent streaming. Writes occur only on changed intent and report save failure. No unconditional auto-enable of disabled interfaces. Complete calendar/timezone-validated modem +CCLK can initialize the MCU UTC clock after reset; CA/hostname/TLS-time verification remains enabled. Failure to apply browser clock is reported/retried for a continuous request instead of silently stopping it. Website supported-version matcher includes2.0.10. GPIO architecture, calibration flags, queue acknowledgement rules and private credentials/APN/endpoint/CA remain unchanged. Private config byte-for-byte matches working2.0.9 snapshot.

Validation: exact configured ArduinoESP32 **3.3.12** build PASS: **1,220,128 bytes flash(93%)**,52,920bytes RAM(16%), unchanged default partition. Host recovery fixtures cover already-command-ready, orphan data mode, second escape success, absent modem, bounded retry/rollover, persisted Start/Stop and failed persistence, UTC offsets/leap-date/invalid clocks, existing TLS/APN/retry/failover; alarm/PZEM safety fixtures and ACS native-driver fixtures PASS. TypeScript/focusedlint and LTE-controls browser fixture PASS including2.0.10. All fixtures are software-only; no device flashed from this cloud host. Build/host logs: `docs/cpe-evidence/2026-10-22-lte-reset-recovery-*`. Canonical source packaged into16IDEfolders; provided private final sketch is `firmware/arduino-ide/solair_cpe/solair_cpe.ino`. Prior2.0.9 known-good snapshot retained, candidate snapshot private/ignored. No push or credential exposure.

Next necessary physical action: upload updated final sketch using existing installed3.3.12 / ESP32DevModule / actual CP2102port, websiteUSB disconnected and Arduino Serial Monitor closed. Reopen sketch from disk so staleIDEbuffers do not overwrite new headers. Use existing reviewed USB upload setup, no new wiring. After upload refresh/reconnect115200, confirm2.0.10, uncheckUSBserverforwarding and pressStartLTEstreaming once. If201returns, press/releaseESP32EN/RESET without switching off modem supply and without pressingStartagain; verify new-boot actualLTEdelivery resumes automatically. If no initial201 within90seconds, send currentLTEwaiting/recovery/HTTPS log lines rather than blindly resetting or relabelingUSBrecords. Cloud independently checks actual transport/boot/sequence/uptime; only then record physical recovery PASS. After recovery keep zero-currentACS setup untouched60seconds for the paused stability capture. Other PZEM/mandatoryACS/reference/power/soak/schematic gates retain status. Prior alarm observations remain historical valid; no blanket new-firmware/all-CPE PASS.

Primary references reviewed for mode-control semantics: Espressif esp-modem documentation https://docs.espressif.com/projects/esp-protocols/esp_modem/docs/latest/README.html and https://docs.espressif.com/projects/esp-protocols/esp_modem/docs/latest/api_docs.html .

## 22 October — disconnected GPIO27 control remains silent: user-reported PASS

User explicitly reports “disconnected control and stayed silent” and “passed” after the instructed existing-circuit check: all supplies off before removing only the ESP32 GPIO27 end of the HW-548 Signal+ lead, insulated loose lead, existing grounds retained, same supplies restored and 30-second observation. Record bounded physical disconnected-control silence PASS. This is a user-observed acoustic result, not independent output feedback or a guarantee of every electrical condition. The prior instructions require supplies off before restoring GPIO27; do not assume the restoration itself has been independently observed.

Completed basic alarm observations now include five-second automatic cutoff, manual early DISARM stop with sustained silence, held-reset/startup silence, and disconnected-control silence. Preserve these passes and do not repeat them. Cold power-domain/backfeed/interface engineering, mounted motion thresholds, actual power interruptions and final all-module soak remain separate. Preserve existing active-HIGH GPIO27, firmware2.0.9 and configuration. No firmware/source change or push.

Next available step while resistor solder is missing: one bounded 60-second ACS zero-load stability capture under resumed LTE. Restore only the existing GPIO27 connection with supplies off if not yet restored; keep ACS signal/divider/supply connections unchanged and its primary-current path unloaded, bank disconnected. Reconnect CPE USB monitoring, keep USB server forwarding off, start LTE commissioning after the intentional reset and first confirm fresh LTE HTTP201. Leave setup untouched and without multimeter probes for 60 seconds, then report completion so actual server min/max/drift can be evaluated. Latest server evidence at inspection was old (22 October 00:11:53.580), not current after the reset/control tests; do not claim live access or evaluate a new capture using those old readings. No guessed zero, amperes enable or current-accuracy PASS from this stability capture. If HTTP201 does not resume, inspect that status before proceeding. PZEM loaded reference and ACS known-current/reference acceptance remain unresolved; bank remains unpowered until electrical assembly is complete.

## 22 October — manual DISARM interrupts siren early: user-reported PASS

Following the five-second manual siren test, user pressed the stop action (Clear test latch / DISARM) before automatic cutoff and explicitly reports “stopped early and stayed silent,” then “passed.” Record bounded physical manual-stop PASS based on user observation. Combined with the immediately preceding physical reports, commanded five-second cutoff, quiet held-reset/startup and manual early stop are now passed. Do not repeat these tests. No physical feedback sensor or independent acoustic timing measurement was added; this is not a software-fixture or GPIO-only acceptance claim.

Disconnected-control OFF, cold power sequencing/USB isolation, actual switching-interface bias/protection, mounted thresholds and final combined operation remain separate. Next load-free alarm safety check, if continuing: with existing protected siren circuit and all supplies OFF, remove only the GPIO27 control lead from the ESP32 end, insulate/secure its loose end, retain Signal−/GND and all other wiring; restore the same existing supplies with the output source readily switchable and observe whether siren remains OFF for 30 seconds. If any sound occurs, switch off the siren supply and record failure; do not guess/add pull resistors or short unknown terminals. Switch all supplies OFF before restoring GPIO27. No firmware upload or new 12V branch. Previously verified reset behavior is not proof of disconnected-input behavior. PZEM loaded current, mandatory ACS zero/reference calibration and other final gates remain unresolved.

## 22 October 00:13 Manila — user-reported siren cutoff and reset-silence PASS

User completed the existing-circuit alarm check and explicitly reports: five-second test sounded and stopped automatically; no sound while holding the ESP32 EN/RESET button for two seconds; no sound after releasing it during the instructed 30-second observation. Mark these bounded physical observations PASS: commanded five-second automatic cutoff and quiet held-reset/startup after reset. Evidence is the user's physical observation, not an audio sensor, build result or GPIO report. Preserve active-HIGH GPIO27, firmware2.0.9 and existing wiring. Do not repeat this completed check or require another upload.

This does not establish disconnected-control behavior, cold power sequencing/USB isolation, measured off-state electrical margins, manual DISARM interruption, mounted alarm thresholds or complete CPE acceptance. Earlier entries saying reset/cutoff pending are historical and superseded for the exact checks above only. Next available load-free check: during a new five-second manual siren test, press Clear test latch (or Disarm bench if that is the displayed stop action) before the automatic timeout; observe whether sound stops promptly and stays off. The client maps both stop actions to the disarm command. If the button has not changed from Arm bench, do not press it as a stop command; wait for current USB telemetry or report the label. After a deliberate reset LTE commissioning is paused and must be explicitly started again; this is existing behavior, not a failed automatic backend-path recovery test. PZEM loaded reference, mandatory ACS calibration, resistor solder and other final gates retain their unresolved status.

## 22 October 00:01 Manila — backend delivery-path outage/recovery PASS

User interrupted only the laptop internet while leaving ESP32/USB/LTE streaming running, then restored it. Supplied console logs show HTTP 530 with queued=1 at 21 October 23:52:51 and 23:53:02, followed by repeated accepted_via_PPP_ESP32_TLS HTTP 201 at 23:55:06–23:55:16. Exact Wi-Fi restoration time was not recorded; user estimates recovery within about two minutes. Do not claim a measured two-minute latency limit.

Read-only SQLite verification: last pre-gap LTE receipt 23:52:16.454, seq3424; first recovered actual LTE receipt **23:55:00.490, seq3506**. Total receipt gap 164.036 seconds includes the outage and recovery, not just time after Wi-Fi restoration. **101 actual transport=lte records** arrived from 23:55:00.490 through 22 October 00:00:21.102, last seq3665. Same boot `3bc0732d1f8c65916f38ac2a`, advancing device uptime, queue_dropped=0 in that recovered window. First recovered frame carries the previous HTTP 530 diagnostic because its upload result is reported in a later frame; its successful server insertion is independently verified. No device reboot required for this observed recovery. Private redacted evidence: `data/bench-evidence/2026-10-21-backend-path-recovery-pass.json`.

Mark **bounded automatic backend-path recovery PASS**. Console 530 during this intentional outage did not indicate permanent device failure. Do not generalize this to a forced SIM/RF-network outage, lossless sample/event replay, autonomous cold boot, permanent hosting, final combined soak, or all-CPE acceptance. Receipt sequence gaps are compatible with heartbeat coalescing; queue_dropped=0 does not prove every acquisition was retained. Preserve firmware2.0.9, configuration and wiring; keep USB server forwarding off while independently checking LTE delivery. No source change, upload, credentials rotation or push required. Resistor bank still lacks soldered electrical terminations; keep it unpowered. PZEM loaded/reference current and mandatory ACS stable-zero/known-current calibration remain unresolved alongside the other electrical/reset-safe/final combined gates. Do not repeat this completed outage test.

## 21 October 23:43 Manila — supported walking GPS/map functional test PASS

User twiceconfirms(theduplicatemessageisthesametest) supportedwalkwas smooth,beyond20m,noGPSblinkingloss,andlivemapfollowed. Independentlyreviewed **323actualreports23:32:02.350→23:42:49.299**,same2.0.9boot`3bc0732d1f8c65916f38ac2a`,seq2822→3144,**zero reportedgps_fixlosses**,0softwareUART overflows,queue_dropped0.290reportspassedmapqualitygates;qualifiedsatellites4–9,maxqualifiedfixage990ms. Storedpositionsmoved**24.4mmaxfromfirstqualifiedpoint**;thisisGPS-reporteddisplacement,NOTsurveyedwalkingdistanceorpositionerror.5703newpassedNMEAsentences/27newchecksumfailuresarepreserved; donotclaimzeroerrorsorall323pointsreliable. Coordinateskeptprivateinevidence`data/bench-evidence/2026-10-21-gps-supported-walk-pass.json`.

Mark **bounded supported-walk functional GPS/maptrackingPASS**,retaininguserobservationandstoredcoordinate/fixcontinuityevidence. ThisstepusedUSBforwardingCHECKEDwithLTEstreamingactive;200duplicatesareexpectedanddonotindependentlydemonstratenewLTErowsduringthisparticularwalk. PriorindependentnewLTEdeliveryandoutdoorGPSoverLTEtestsremainvalid. Do notrelabelUSBdataasLTE. Measuredpositionaccuracy,repeatablefieldreliability,power/antenna/reset/recoveryandall-modulecombinedsoakremainseparate;no“perfectGPS”orwholeschematicassemblyreleaseclaim.

Preserveworking2.0.9/GPIO/configurationandcurrentantenna/carryarrangement: laptopbesidebox,nothingcoveringpatch,flatupward,boards/leadssecuredandboxsupportedfromunderneath. Initialobstructionremovalalonefailed;supported/warmedreceiverwalksucceeded,butexactmechanical/power/RFrootcausewasnotisolated.DonotstateastheprovedrootcauseorrequiremoreGPSbringupnow. No firmware/sourcechangeforthisresult;nohardwarecommandsbyagent/sourcepush.

NextfocusPZEMloadedreferenceandmandatoryACScurrentvalidation. Askedonefocusedreadinessquestion: resistorbankfullyassembled/unpoweredversusstillbeingassembled. Waitforanswerbeforedictatingloadwiring. PZEMwasintentionallyunplugged;prior12.3V/RS485successpreserved. Restoreonlyexistingverifiedmeterconnectionswithallpoweroffbeforeitsnexttest; actualbranch/fuse/terminationsandreferencecurrentneedadequateequipment. NoinventedWAGOrequirementorrepeatedpin/photoquestions.The100ohm12VbankisadequateforPZEMresponsebutinsufficientbyitselftoresolveobservedACSnoise/currentaccuracy. NeverenableACS_CALIBRATEDfromGPSsuccess. Remainingfinalgroups: ACScalibratedcurrent,PZEMloadedmeasurement,electricalpower/interfaces/reset-safeoutputs,andcombinedrecovery/events/soak plus requiredapp/workflowevidence. DraftonecpeGPIOschematicnowwithunverifieddetailsmarkedunreleased; nofinish-timeorpercentageguarantee.


## 21 October late evening — movement exposes GPS loss; map quality corrected, laptop obstruction identified

User says marker moves but position is inaccurate and GPS repeatedlylosesfix/requiresreadjustment. Userthenclarified **GPS/breadboard are inside the IP65box with the laptop on top**, whileGPSfacesup. This introduces overheadobstruction and is a likely contributor; not proof oftheonlycause or ofa damagedmodule. NextONEphysicalcomparison: movelaptopbesidethebox,leaveantennauncovered,keepboxorientation/power/wiring/LTEstreaming/USBmonitor-onlyunchanged,thenrepeatsameoutdoorwalk. Do not requireanotherupload ornewantenna/powerpartbeforethiscomparison. Ifitstillfails, nextisaboundedpower/coexistencecheck, notcontinuousrewiring.

Movement **reliability/accuracy NOT PASSED**. Actualrecords showfixloss22:41:28.218→recovery22:41:48.681 andanotherloss22:44:28.730, whileLTEuploadscontinued. SeparateLTE/serverdeliverygaps68.67s,327.92s,61.78salsocontributetomaplag;donotattributeallfreezestotheGPSreceiver. Privateevidence`data/bench-evidence/2026-10-21-gps-movement-reception-loss.json`. Prioroutdoorstationaryfix/LTEpositiondeliveryPASSretained; itdoesnotestablishmovementaccuracyorwholeCPEfinal.

**Concreteapplicationfixcompleted without firmwarechange:** newsharedGPSmappolicyrequiresCPEpositionage≤5s,≥4satellites,HDOP(0,3],qualityok,recentreportedserialactivity. Legacyv1compatibilityretained. FleetbackendnowselectslastreliableGPSreportwithpagedread-onlyhistoryscan/per-device-modewatermarkcache;rawtelemetryandallGPSrecordsremainunchanged. Maplabelsweakreportslastknownandexpireslivestatusafter10swithanindependenttimer,usingacquisition/receipttimes. No simulatedcoordinates,road-snapping,guessedmetres,extrapolation,migrationorfrontendre-design. Rawlegacyfirmwaregps_fixcanremaintrue30s; thisno longermeanslive/reliableonmap. Genuineexample: latestrawGPSseq1399/22:44:18had0satellites,HDOP99.99,age29.838s;helpernowselectsseq1384/22:43:48. Positionisretainedhonestlyonloss,notclaimedtobefixedreception.

Validation: **58/58isolatedAPItestsPASS**,includingrawpoorficesretained,coldhistoryscanbeyondonepage,andgoodfixrecovery. BrowserPASSforqualityrejection,unchangedmarkerposition,staleexpirywithoutnewSSE,movementupdates,lastknownretention,tiles/referrer/failure;TypeScript/focusedlint/diffcheckPASS. Logs`docs/cpe-evidence/2026-10-21-gps-quality-*`;Postgres-specificCPErunrecordedseparatelywhencomplete. InitialbrowserfixturefailureswereincompletefixtureCPEdata/focus-stylecomparison,correctedbeforePASS;nohardwaredatachanged. See [GPStrackingcontract](GPS_TRACKING_QUALITY.md) forconsumersemantics/thresholdlimits. HDOPgateisdisplaypolicy,notaguaranteedmetreaccuracy.

u-bloxhardwareintegrationmanualexplicitlyrequirescleanpower,appropriateantennaimplementationandisolationfromcellularradios. Thesearephysicalintegrationconcerns,notproofofthisboard'sexactrootcause. Firmware2.0.9andprivateconfigremainunchangedandarchived;noadditionalhardwarecommand,modemflash,powerrewire,credentialrotationorsourcepush. ADS/ACS/PZEM/electrical/alarm/recovery/combinedsoak/schematicgatesretainstatus;ACSvalidatedcurrentremainsmandatory.


## 21 October 22:35 Manila — outdoor GPS fix and LTE position delivery PASS

User completed the outdoor stationary GPS test with USB server forwarding unchecked. Read-only database verification found **257 actual LTE position records**, same2.0.9boot`3bc0732d1f8c65916f38ac2a`, **22:18:35.120–22:33:51.412 Manila**, sequences628→1083. Reported satellites4–10; latest9, HDOP0.86, positionage582msatacquisition, GPSqualityok,0softwareUART overflows,queue_dropped0. Valid coordinates are stored in the private researchdatabase, not generated fixtures or old17:42positions. Private evidence`data/bench-evidence/2026-10-21-gps-outdoor-over-lte-pass.json` includes actual coordinates; do not publish it or the provisionedbuildsnapshot.

This closes **outdoor position acquisition and position delivery overLTE** for the observed run. It does not by itself verify physical location match, intentional movement/maptracking, networkloss/recovery or allmoduleacceptance. Latest receipt remains22:33:51 at inspection22:35:21 (about90s old); say “latest recorded fix,” not “currently live” if no newer receipt exists. Preserve2.0.9/wiring; no GPSdriver rewrite needed for the current validfix. Checksumcounter3045is cumulative, not proof every newpacketfailed: last~7minutesincreased3017→3045whilepassedchecksummessagesincreased15626→19383, withretainedGPSfix. Keepthismeasurementerror evidence for combinedsoak; don't promise zeroUARTerrors or diagnosedcause.

LatestACSinput142mV/qualityfault, currentnull; physicalACSconnectionduringoutdoormoveunconfirmed. This is not validatedzero or ACScurrentPASS anddoesnotundoearliermeasuredtests. PZEMwasexplicitlytemporarilyunplugged. LTEbootqueue_dropped0onlyappliestothisrun. OtherACS/PZEM/power/interface/alarm/recovery/soak/schematicgatesremain.

Nextonephysicaltest: ensureLTEstreamingandlaptop/server/tunnelInternetareactiveagain (lastreceiptgapmustnotbemistakenforfreshdata),keepUSBmonitor-only,walk30–50mwiththeGPSsetup,pausestationary30seconds,thenreturnandreport“movementtested.” GPSantennaflat/upwardwithopensky;keepworkingconnections. VerifyrealstoredLTEcoordinateschangeoverthatreportedtimeandmapmovement; stationaryGPSjitterorfirstfixsettlingalonecannotpassmovement. Do not instructanunprotectedmotorcycleride or anotherfirmwareupload.


## 21 October 22:02 Manila — actual live LTE delivery PASS on 2.0.9

User uploaded **2.0.9/imu6500-compatible**, started LTE streaming with **Forward USB readings to server unchecked**, and supplied repeated actual status201 lines. Independently verified working SQLite: **34 new nonhistorical `transport=lte` rows**, boot`3bc0732d1f8c65916f38ac2a`, sequences **85 → 145**, received **22:00:25.015 → 22:02:24.090 Manila**. LastUSBreceipt was21:59:59.163/seq75, before every LTEreceipt. These are actual newly stored authenticated device readings, not USB-first duplicate acknowledgements or fixtures. Source/transport/authentication are independently enforced by the existing ingestion path. Current registered/attachedtrue/RSSI19, empty TLSerror, sameboot/advancinguptime, queue_dropped0 throughout this observedboot.

This establishes the **short live LTE delivery test**, not fullCPE/long-run reliability. Observed span119.075s, mean receipt gap3.608s, longest14.208s; most earlygaps3–4s. Heartbeats are intentionally coalesced to the newest queued reading, so sequence85→145 with34storedrecords is not proof every2s acquisition was delivered. `queue_dropped=0` does not certify losslessrawsampledelivery. No forced network-loss/recovery, longsoak, autonomouspower/reboot startup, permanenthosting, modem electrical interface or GPSmovementPASS. Firmware stillbootsmanuallyPAUSED in commissioningmode and relies on the current laptop/server/tunnel; do not call this independentvehicledeployment.

**Preserve this working version/configuration.** Privateignored host snapshot `.tools/cpe-known-good/2026-10-21-2.0.9-lte-host-snapshot/` contains finalsketch/privateconfig/compiledhostbinary/partition/bootloader andchecksums. Device reportsmatchingversion; itsflashedbinarychecksumwasnotreadback, so do notclaimbitidenticalreadback. Never publishthisprovisionedsnapshot orignoredcredentials. Actualredacted testsummary privately saved`data/bench-evidence/2026-10-21-lte-live-delivery-pass.json`; no synthetictelemetry/researchdataedits/sourcepush.

Currentfaults remain explicit: GPSno-fix/0satellites (recentserialbytes17ms,103506chars,2051passedsentences,303checksumsfailed,0softwareoverflows); ADSfault; PZEMno_reply_check_UART_and_meter_power; ACSuncalibrated/currentinvalid. These states reachedSOLAIRthroughLTE correctly but do not establishhealthy/calibratedsensors or diagnosewiring. Do not reclassify absentPZEMorunstableADSasPASS. Preservepriorindependenttests and confirmpresentbenchconfigurationonlyatrelevantnexttest.

Next one physicaltest: keepLTEstreaming andUSBmonitor-onlyrunning; obtain a fresh stationaryoutdoorGPSfix with antennaflat/upwardandclear sky, keepinglaptopInternet/server/tunnelalive. Observe5minutes,theninspectfreshLTESTOREDgps_fix/satellites/fixage/coordinatesbeforeanymovementtest. No GPSrewiring/upload/coordinate fabrication. RemainingrequiredACS/PZEM/power/alarm/recovery/soak/schematicreleasegatesareunchanged.


**20 October review:** [consolidated final acceptance and release register](CPE_FINAL_ACCEPTANCE_2026-10-20.md) reconciles the latest visual guide/session, remaining electrical evidence, ACS/PZEM measurements, actual SOLAIR transport and mechanical preparation. Preserve the architecture below; use that register before declaring the CPE or its schematic final.

**Latest19October user override:** ACS758 must be used successfully for validated current measurement in the finalCPE, alongsidePZEM. The proposedDP1exception below permitting diagnostic-only/uncalibratedACS is historical and explicitly withdrawn by the user. Do not release a “finalCPE” on that exception. Measured ACS input stability, zero and known-current/reference validation are still required; keep current invalid until passed. Deferring its troubleshooting to progress other tests is scheduling only. No new hardware result or firmware/calibration change is implied by this scope correction.

18 October 2026 · This is the CPE for the whole SOLAIR system. The breadboard, perfboard and eventual PCB are successive physical implementations of the same firmware, device identity, telemetry contract and premium application. DP1 does not create a reduced CPE or a second website.

**Release state: schematic drafting can begin; electrical design and physical acceptance remain conditional on the HOLD rows below. This document is a schematic input brief, not a completed circuit drawing or permission to fabricate.** The user will design the schematic/PCB and hire an assembler for perfboard soldering. The user supplied purchase links: [12 × 18 cm perfboard](https://shopee.ph/product/1367148707/27114059630) and [Circuitrocks single-row female headers](https://shopee.ph/product/20469516/1492598474). Shopee could not be fetched by the web reader; size and 2.54 mm header pitch are user-supplied, not independently verified dimensions. The description mixes ordinary sockets and round machined sockets; The user clarified five 15-pin strips and five 4-pin strips (10 strips total). The user also has 3-pin and other smaller strips but cannot recall the full inventory; count against the actual modules before assembly. Contact style and tail dimensions still need an actual-part check. Physical dimensions and carrier pinouts must be checked against the delivered parts.

Suggested order: freeze interfaces → schematic review → perfboard assembly → continuity/power/functional/soak acceptance → finalize PCB layout → fabricate. A PCB draft can proceed alongside the perfboard; incorporate physical findings before ordering it.

## 19 October review — one CPE design for the thesis

The user wants the final CPE schematic to remain the common hardware design throughout the thesis. Preserve the existing architecture/GPIO allocation and use one revision-controlled schematic, exact module BOM and connector schedule. Do not create a reduced DP1 CPE or a replacement application. Subsequent verified corrections must be recorded as revisions rather than hidden to keep an inaccurate drawing unchanged. A draft can proceed now; release for soldering/fabrication remains conditional on the unresolved electrical rows below. Backend/API/frontend completion is separate from freezing a physically verified electrical interface.

**Accepted DP1 measurement role:** PZEM-017 is the primary instrument for voltage/current/power/cumulative energy on the actual circuit where its voltage leads and shunt are installed. For the present12V adapter this remains `bench_supply`; it becomes MPPT-output metering only after actual installation there. It does not establish PV-input production, batterySOC, cell-level BMS protection or MPPT control. Keep ACS758 installed/diagnosed with current explicitly uncalibrated/null until separate reference testing passes; no main DP1 function may rely on unverified ACS amperes. This is a documented measurement limitation, not a claim that all sensor accuracy has passed or permission to leave unsafe/unverified power wiring energized.

| Review item | Current evidence and schematic treatment |
|---|---|
| MPU identity | Actual WHO_AM_I0x70 uses an explicitly separate MPU6500-compatible driver/profile; firmware2.0.3 labels it accordingly. Do not describe it as a proven genuine MPU6050 or silently change the manuscript. Record marking/compatible identity in BOM; retain GPIO21/22 and3.3V bus. |
| ADS1115 | Independent05a and user-reported ground/positive-reference agreement already exist. Preserve those tests; do not restart scanner/diagnostics automatically. Latest19October exact positive reference/tolerance was not supplied, and earlier offset history remains. Record actual reference evidence before claiming measurement accuracy; no guessed subtraction. |
| Switches/LED/siren | Existing contact/LED/output operation and lid/mount trigger reports retained. Schematic GPIO27 activeHIGH is supported, but hardware reset-safeOFF, supply interruption behavior and final automatic cutoff/DISARM evidence still need closure. |
| ACS divider/formula | Existing GPIO34,2x10k divider and100nF input-bypass trial retained as documented. Nominal4.70V supply gives2.35Vrawzero/1.175Vdividedzero; this estimate is not a measured calibration coefficient. Temporary3V3dividerreference expected1.65V only for that isolation test, never as sensor zero. Native ADC factory conversion and16sample averaging are in2.0.3; probe-dependent instability remains unresolved. |
| GPS | GPIO32RX is retained. Earlier independent outdoor fix is historical evidence; latest combined screenshot has reception/no fix. Obtain current combined outdoor/concurrency evidence. Final carrier supply and TX rating must match the actual breakout, rather than choosing5V or3V3 interchangeably on a drawing. |
| A7670E carrier — electrical HOLD | AT/registration/attachment and earlier brownout/capacitor observations do not verify carrier regulator capacity, peak-current budget, UART levels or VDD/VMCU pin direction. Do not freeze “ESP VIN→modem supply” or “3V3→VDD/VMCU” from the generic table. Need exact carrier model/revision/documentation, supported input/source and input-vs-output pins. Bare-module specifications do not identify carrier wiring. |
| RS485 board | Current recorded bench board is automatic-direction TTL-to-RS485v2.0; TXDoutput→GPIO16 and RXDinput←GPIO17 by actual arrows. Specify the actual module/transceiver and supply/logic rating in BOM rather than relabeling it as a manual-directionMAX3485. GPIO23 stays reserved; an automatic board with no direction pin gets no invented DE/RE connection. |
| PZEM power/shunt — board-match HOLD | Meter12.3V matches userDMM and50Aregisterreadback is accepted. Familymanualpicture4.2 supports the supplied4+/3-/1&2sense mapping and negative-return shunt loop, but actual revision/markings/power-domain match still needs documentation before fabrication. Loaded current/power/energy response remains pending. |
| USB/auxiliary power correction | Earlier notes that microUSB “ensures boot” describe the reported working setup, not a universal requirement. Familymanual5.1 requires separate5Vserial-sidepower;5.2 specifies auxiliarymicroUSB when measurement voltage is below7V. Do not automatically require/feed auxiliarymicroUSB at12Vor60V, connect it toPCUSB or tie independent5Voutputs together without the actual revision's power/isolation diagram. No live supply removal/change is instructed by this review. |

ACS implementation units are explicit in `modules.h`:

`I = ((ADC_mV / 1000) * ACS_FRONTEND_SCALE - ACS_ZERO_V) / ACS_SENSITIVITY_V_PER_A`

`ACS_ZERO_V` is **sensor-side/reconstructed output volts**, not the GPIO34 divided voltage. With scale2, a genuinely verified1.175V ADC zero corresponds to2.35V in this setting; copying1.175 directly into it would be wrong. Current private settings are scale2/zero2.34V/nominal0.04VperA, calibrationfalse. Neither these values nor supply/4 are newly approved calibration results. Both quiescent voltage and sensitivity vary with supply according to [Allegro's datasheet](https://www.allegromicro.com/-/media/files/datasheets/acs758-datasheet.pdf); known-current validation must use actual supply/conditioning, not a guessed datasheet midpoint.

Before releasing the schematic for assembly, close the actual-carrier power/logic/USB selection and isolation diagram, exact connector numbering/shunt loop, reset-safe alarm circuit, analog conditioning limits and component/conductor/fuse ratings. Then perform loadedPZEM, currentGPS, combined output/recovery and soak acceptance. ACS coefficient calibration and application integration can continue with the same verified interface; if electrical findings require a circuit change, revise before soldering. Preserve current test evidence and do not reopen the deferred ACS diagnostic loop merely because this review was supplied.

Sources: [SIMCom A7670 hardware documents](https://en.simcom.com/product/A7670X.html), [PZEM manufacturer manual, sections5.1/5.2 and picture4.2](https://www.solar-thailand.co.th/pdf/PZEM-003-Manual.pdf), [ESP32 schematic guidance](https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html), and latest [validation](CPE_VALIDATION.md). No new electrical gate, hardware test or calibration is marked passed by this review.

## Current evidence versus remaining work

| Area | Available evidence | Remaining acceptance / design work |
|---|---|---|
| Live application | USB/network graph, stream age/errors, reconnect and storage-failure display tested with isolated software fixtures; existing real database retained | Run updated app against connected board, tilt MPU and check increasing report sequence; saved samples alone do not establish current live operation |
| MCU / MPU / contacts / alarm | Prior group observations in CPE_VALIDATION.md; compatible IMU ID 0x70 retained | Combined timing/recovery, safe OFF during reset/disconnected control and final mounting validation |
| ADS1115 | Later handoff reports improved ground/reference results; earlier unresolved-offset investigation remains in history | Independently retain the actual reference/ground measurement records; no invented offset correction or overall measurement-accuracy signoff |
| ACS758 | Group reports 4.70 V supply, 2.30 V raw output, 1.17 V divider node | Known-load calibration, full input/fault envelope and connector/current-path review; amperes remain uncalibrated/null |
| GPS | Group reports earlier outdoor fix; indoor no-fix is reported | Current stream/fix test; installed antenna placement and outdoor recovery under concurrent UART/network load |
| LTE | Group reports AT/registration/attachment | Actual carrier supply/logic/connector evidence; secure Internet telemetry is separate from attachment and remains a deployment gate |
| PZEM | Group reports 12.29 V and matched 50 A register readback | Exact revision/terminal diagram, physical shunt/current-path reference check, disconnect/timeout retest |
| Vehicle supply / charging / wind | Software has unavailable/gated states | Vehicle input envelope, converter/protection/isolation, charging/BMS approval and wind interface remain separate required design work |

## Firmware pin map — keep these GPIO numbers

GPIO numbers are ESP32 board labels, **not connector/header positions**. Use the actual 38-pin board to draw the two header rows. Do not substitute an ESP32-S3 or a different development-board footprint.

| Net | ESP32 GPIO | Peripheral connection | Schematic note |
|---|---:|---|---|
| I2C_SDA | 21 | MPU SDA + ADS1115 SDA | Shared 3.3 V bus; inspect existing pull-ups and their rail before adding any |
| I2C_SCL | 22 | MPU SCL + ADS1115 SCL | Same bus; short wiring; record total pull-up resistance |
| LID_IN | 25 | Lid switch NO; COM to logic GND | INPUT_PULLUP, LOW pressed/secure, HIGH released/tampered; NC unused |
| MOUNT_IN | 26 | Mount switch NO; COM to logic GND | Same convention; verify each switch's real COM/NO by continuity |
| ALARM_CTRL | 27 | HW-548 control input through verified interface | Active HIGH retained; hardware reset-safe OFF bias/interface must be reviewed |
| STATUS_LED | 19 | 330 Ω resistor → LED anode; cathode → GND | Either resistor leg orientation is valid; preserve LED polarity |
| ACS_ADC | 34 | Midpoint of the existing two-resistor divider | ADC1 input; never raw sensor output or a high-current conductor |
| GPS_RX | 32 | Verified GPS TX output | RX-only 9600 baud software UART; GPS RX left unconnected |
| RS485_RX | 16 | Transceiver receive output (RO/TXD by actual board labels) | Hardware UART1, 9600 8N2 |
| RS485_TX | 17 | Transceiver transmit input (DI/RXD by actual board labels) | Cross by signal direction, not just printed TX/RX names |
| RS485_DIR | 23 | DE + active-LOW RE on a manual-direction MAX3485 | Reserve this net. The latest bench reports an automatic-direction board, which may have no DIR terminal; do not wire it to an invented terminal |
| LTE_RX | 13 | Carrier UART TX through approved level interface | Hardware UART2, 115200 baud; carrier translator evidence required |
| LTE_TX | 14 | Carrier UART RX through approved level interface | Do not assume carrier UART voltage from USB power or successful AT replies |
| USB programming | Existing USB/CP2102 | Laptop | Keep connector and BOOT/EN accessible; one serial owner at a time |

### Exact low-voltage resistor connections

| Part | Leg 1 | Leg 2 | Status |
|---|---|---|---|
| LED resistor, 330 Ω | GPIO19 | LED anode | Existing wiring reference; LED cathode goes to logic GND |
| ACS upper resistor, 10 kΩ | ACS analog output (team labels it OU1/VOUT) | ACS_ADC / GPIO34 node | Existing 2:1 bench divider |
| ACS lower resistor, 10 kΩ | Same ACS_ADC / GPIO34 node | Sensor/ESP logic GND | Existing 2:1 bench divider |

The divider obeys V_GPIO34 = V_OUT × R_lower / (R_upper + R_lower). Nominal ratio is 1/2; firmware ACS_FRONTEND_SCALE must match the measured ratio. Record resistor tolerance, input loading, supply range, protection and ADC calibration. A zero-load voltage check is not current calibration or approval for a 50 A perfboard current path.

## Power and isolation sheets

Draw separately named power nets; never label every supply simply VCC.

| Net/domain | Design basis | HOLD before build/vehicle use |
|---|---|---|
| BENCH_12V | Existing 12 V/5 A adapter only | Polarity and actual output; suitable entry connector, fuse and conductor ratings |
| SIREN_12V | Separate branch through existing 2 A inline fuse, HW-548 and siren | Confirm actual terminal labels/topology, measured load/inrush, safe OFF and current return; no siren current through MCU header/perfboard signal pads |
| LOGIC_5V | Verified output of existing 12-to-5 V buck where supported | Current budget with all attached modules; USB/external supply selection or documented reverse-current protection; never assume two 5 V sources may be tied together |
| LOGIC_3V3 | Existing ESP32 board/regulator or separately reviewed rail | Regulator capacity and noise with MPU/ADS/RS485 board; include existing module loads in budget |
| LTE_SUPPLY | Actual carrier-specified power input | Exact board pinout, supply range, peak current, decoupling and UART translation; never power modem from a GPIO/ESP32 3V3 rail by assumption |
| PZEM communication side | Latest bench notes mention external logic power and auxiliary USB | Confirm delivered meter's power domains and diagram; do not bridge an isolation barrier with an assumed common ground |
| VEHICLE_INPUT | Not the 12 V adapter; actual pack maximum plus transients required | Select/review a rated protected converter, fuses, reverse polarity/transient protection and grounding/isolation. Existing bench buck is not automatically a traction-pack converter |

The reported 470 µF bulk capacitor near the ESP32 5 V input is historical bench evidence. Draw its actual polarity, rating and location; it does not replace local decoupling or a measured supply/current budget. Choose supply protection and capacitance against component documentation and actual carrier requirements.

High-current ACS/PZEM shunt/siren branches use separate rated wiring, terminals, fuses and mechanical support. Keep analog returns and low-voltage digital wiring away from switching/load returns. Do not route traction/shunt current through 2.54 mm signal headers or thin perfboard pad bridges.

## Draft sheet and placement plan

| Sheet / physical area | What to draw / place |
|---|---|
| 1 — power entry | Supply connector, fuse(s), polarity/protection, power selection, regulators, test points and domain labels |
| 2 — controller | Actual ESP32 38-pin board/socket rows, GPIO nets, USB/EN/BOOT access and mounting holes/standoffs |
| 3 — I2C and switches | MPU + ADS at 3.3 V, pull-ups, switch connectors and contacts; unused ADS inputs deliberately handled |
| 4 — analog current | ACS module connector, both 10 kΩ legs, ADC test point and reviewed filter/protection footprints |
| 5 — GPS/LTE | Verified connectors, UART directions/levels, dedicated modem power and antenna clearance; antenna accessible near an RF-friendly enclosure edge |
| 6 — RS485/PZEM | Exact chosen transceiver, A/B bus and reference/isolation scheme, optional direction net, meter/shunt interface by delivered manual |
| 7 — alarm | Logic control/interface and measured reset-safe OFF circuit; fused load branch physically separate |

For perfboard, place sockets and actual modules first without solder. Mark pin 1, USB end and component-side orientation. Measure row spacing, board outline, tall-component clearance and enclosure screw positions. Make a top-view placement drawing and an underside wiring drawing with mirrored orientation explicitly labeled. Identify whether copper consists of isolated pads, strips, grouped buses or no copper before routing or specifying cuts. The purchased perfboard is reported as 120 × 180 mm; copper pattern, hole pitch/diameter, thickness and mounting-hole pattern are unconfirmed. Do not assume every hole is an isolated pad.

For the PCB, use the same net names/pins. Follow the development-module antenna keep-out requirements; do not place a copper plane, wires or metal enclosure against its antenna. Add accessible ground/3V3/5V/ACS/control/UART/I2C test points. Retain module removal and programming access.

## What to give the hired assembler

| Deliverable | Required contents |
|---|---|
| Reviewed schematic PDF + editable source | Revision/date, exact module labels, all power/ground domains, connector pin numbering, resistor values and unpopulated/HOLD circuits |
| Actual modules + BOM | Quantity/value/tolerance/rating, correct board variants, matched 50 A shunt, both 1×19 ESP32 sockets if confirmed compatible, terminals, wires, standoffs and enclosure |
| Placement and underside wiring drawing | Actual perfboard size/grid/copper pattern, module orientation, USB/antenna access, jumper routes, required strip cuts, off-board power branches |
| Connector schedule | Pin number → net → wire destination; supply voltage/polarity and signal direction printed at connectors |
| Assembly instructions | Socket removable modules; solder joints inspected; no substitutions/pin changes without updating the schematic; no high-current signal-header routing |
| Acceptance sheet | Unpowered continuity/short checks; current-limited rail checks without MCU; correct voltages/levels; install modules one at a time; then original Tests 00–11/final |

An experienced assembler can route from a schematic, but the extra documents make orientation, power domains and substitutions reviewable. Inspect continuity against the schematic before the first powered test. Soldering completion alone is not functional acceptance.

### Female headers

2.54 mm specifies **pitch**; it says nothing about tail length, socket height, contact quality or current rating. Match it to the actual perfboard/module grid. Standard through-hole female sockets normally serve removable modules. Long tails are useful for stacking/pass-through or extra clearance; longer pins do not provide mechanical support. Tail protrusion must suit the actual board thickness and solder joint. Confirm the purchased product drawing and selected variant.

The user confirmed five 15-pin and five 4-pin strips. Two 15-pin + two 4-pin strips provide the two required 19-position rows, leaving three strips of each size. One of each can form a 19-position row only if a dry fit confirms 2.54 mm pitch across the join, mating contact fit and full seating. Align them on the unpowered ESP32 while locating the sockets; do not force mismatched round sockets onto square pins.

For the reported 38-pin ESP32, two 1×19 rows are the expected socket arrangement, but measure row spacing on the actual board. Do not buy a tightly joined 2×19 socket assuming its row spacing matches. Support the board with standoffs; provide strain relief/retention for off-board vehicle wiring.

## GPS acceptance and fleet behavior

No blinking indoor LED alone cannot diagnose a failed receiver. The module's timepulse and the breakout LED wiring/configuration are separate from a trustworthy position fix. Improved firmware reports characters processed, checksummed sentence count and last-byte age even with no fix; it reports satellite count when fresh, without inventing coordinates.

| Test | Expected evidence / next step |
|---|---|
| Stream indoors | Increasing characters + checksummed sentences and fresh byte age prove serial reception; they do not prove a position fix |
| No characters | Recheck actual supply, common reference where appropriate, GPS TX → GPIO32 and 9600 baud; use Test07 diagnostic |
| Characters but no passing sentences | Check baud/noise/UART overflow; capture raw NMEA in Test07 |
| Outdoor or suitable sky view | Place patch antenna facing sky with correct attachment and stable supply; record actual acquisition time, fix, satellites and coordinate age |
| Return indoors | Valid current fix may disappear; keep only timestamped last-known coordinates with stale/no-fix indication; security and non-GPS telemetry continue |

A software change cannot guarantee indoor satellite reception. Antenna placement is a design input. Cellular approximate location would need an actually implemented, service-supported and verified path; the prior handoff's suggested LBS fallback/100–300 m accuracy is not an implemented or guaranteed feature here. LTE network attachment is not proof of an uploaded alert or location.

## Tonight's connected-board retest

Use current firmware only after saving private config and selecting electrically approved modules. The update has been compiled, not uploaded by Codex. PlatformIO is pinned to Arduino core 2.0.17; the actual installed Arduino IDE/CLI core is now 3.3.12 and also compiled the final packaged sketch successfully. Preserve the working configuration/toolchain; do not silently switch cores based on an older setup note. Disconnect Web Serial before Arduino upload; use ESP32 Dev Module and the observed port, and the existing packaged final solair_cpe sketch. Keep unsafe/unverified interfaces disabled. Do not upload compile_all_only.

| Step | Action | Evidence to retain |
|---|---|---|
| 1 | Open http://localhost:3000 in Chrome, engineer account, Real hardware, correct vehicle, CPE Lab | Device/firmware/boot/sequence and mode; no credentials in capture |
| 2 | Connect at 115200; tilt MPU after at least two frames | USB streaming, increasing report numbers, uptime, X/Y/Z values and the selected motion graph; current default is one X-axis line, with other axes selectable |
| 3 | Leave USB open without frames / disconnect and reconnect | Streaming indication times out after 10 s; exact parser/storage error visible; new frames recover without fake values |
| 4 | With siren load safely isolated, test ARM before 10 s, insecure contacts, then both secure after 10 s | Invalid ARM rejected; valid ARM accepted; release contact triggers; cutoff retains TRIGGERED; DISARM clears latch |
| 5 | Remove PZEM communication or approved measurement power | Timeout/fault and null PZEM values, followed by real recovery; no EEPROM writes from runtime |
| 6 | GPS indoor stream then outdoor fix | Receive counters/age, real fix evidence; no indoor fix promise |
| 7 | Known ACS current/reference; ADS ground/reference checks | Actual meter readings and tolerance; ACS current remains null until calibrated |
| 8 | Minimum 60-minute combined run including network loss/recovery | Actual duration, resets/errors/queue drops, event identities, output timing, sensor quality and accepted backend records |
| 9 | Record physical test results in CPE Lab, Export JSON + CPE CSV | solair-bench-hardware.json includes saved tests/calibrations/latest report and errors; verify it contains your results before claiming acceptance |

## Sources and continuing records

- [CPE validation history](CPE_VALIDATION.md), [acceptance checklist](COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md), [Linux bench guide](START_BENCH_HERE_LINUX.md).
- [Espressif ESP32 schematic checklist](https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html) and [ESP32 datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf): supply/reset/ADC/interface constraints; a development board's carrier power circuit still needs its own drawing.
- [TI ADS1115 documentation](https://www.ti.com/product/ADS1115): input/supply limits; programmable full-scale range does not permit exceeding supply rails.
- [Allegro ACS758 documentation](https://www.allegromicro.com/en/products/sense/current-sensor-ics/integrated-current-sensors/acs758): actual suffix, supply and transfer function must match the installed module.
- [SIMCom A7670 documentation](https://en.simcom.com/product/A7670X.html): module family documentation does not identify an unknown carrier's connector/translator.
- [u-blox NEO-6 datasheet](https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_(GPS.G6-HW-09005).pdf), [GNSS signal limitations](https://www.u-blox.com/en/blogs/insights/dual-band-gps-dead-reckoning) and [antenna placement](https://www.u-blox.com/en/blogs/tech/dual-band-aftermarket-telematics).
- [Adafruit through-hole female-header assembly example](https://learn.adafruit.com/permaproto-feather-case/assembly).


## Later connected-board result — do not freeze the electrical design yet

At22:59:29–31 the user's held switches actually reported 0/0 secure, and the user confirmed that state on screen. MPU stopped supplying vectors after22:53:24 while USB/ACS/ADS continued. PZEM supplied no accepted readings in this boot despite user-reported meter power connections. Resolve those faults and test actual armed-security behavior before claiming final perfboard/PCB acceptance. Current software labels retained MPU lines and manual siren test state explicitly; new final firmware adds prompt contact snapshots and named MPU/PZEM/GPS diagnostics for the next connected test. A software build does not establish that the missing modules are repaired.

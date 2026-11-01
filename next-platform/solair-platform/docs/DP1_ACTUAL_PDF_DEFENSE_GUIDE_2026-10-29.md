# SOLAIR defense guide matched to the actual PDF · 29 October 2026

Source: GROUP 4_DP1 - TEMPLATE.pdf;62 pages;SHA256 f286392f42374e792be2bfff2df2fe21ea6fbdd1c44540d6d0591a44998787ac. Original PDF/Canva deck unchanged. Page numbers below are PDF pages, including the title.

**Architecture distinction:** slides 33–34 describe intended SOLAIR/BEMAC. Keep that scope. The separate Mermaid diagrams describe the actual48 V prototype and carry its present validation status. Proposed features remain proposed.

**Full CPE clarification:**332.18 Wh/day covers the5 V branch and conversion losses only. Full daily offset adds12 V idle,alarm sounding and direct battery loads;the buzzer is marked12 V only. Use the new power/fuse screenshot sheets.

**Power correction:** 5 V×2 A=10 W at5 V. Two chosen85% efficiencies give13.84 W and332.18 Wh/day before additional loads. This is not a measured load or fuse-sizing calculation.

## Exact changes in the supplied slides

| PDF page | Existing text / issue | Change / action |
|---|---|---|
| 4 | Network layer: Gateways, Routers, Bluetooth | For this design: A7670E LTE / cellular internet; retain generic technologies only if explicitly background theory. |
| 5 | 300 W turbine; Armed/Disarmed/Auto-Idle; Anderson Y-Splitter VCU Bypass | 400 W seller rating at 12 m/s; DISARMED/ARMED/TRIGGERED; OEM-approved BMS-supervised charge interface. Do not propose defeating a lockout. |
| 5, 34 | Backup cell/TP4056 and manual PWA controls shown without implementation distinction | Retain these as intended SOLAIR features if still in scope. Label proposed/unverified; a TP4056 alone does not establish a safe complete power path. The prototype diagram omits absent hardware. |
| 17 | Community Security & Government Initiatives heading over academic groups | Academic Community and Future Researchers. |
| 20 | 00: ARMED; 01: ARMED; 10: TRIGGERED | Left maintenance state: 00: DISARMED; 01: ARMED; 10: TRIGGERED. These diagram codes need not be transmitted enum values. Correct acknowledgement/communication typos. |
| 22 | Percentage error near a zero reference | Use absolute error at zero; percentage error is undefined when the reference is zero. Mass/drag results require actual parameters. |
| 24 | SOC fraction equation presented as percent without conversion | Define SOC as a 0–1 fraction, or multiply the integrated Ah/capacity term by 100 when displaying percent. Define charging-positive sign. Explain TTE reserve and averaging. |
| 24 | Accuracy ≥90%, FAR ≤5% shown as benchmark | Retain only as approved study targets with basis; they are not measured results or generic ISO requirements. Give trial counts and denominator. |
| 26, 27 | 10 W ×24 h=240 Wh; 48 V prototype4 / 8 V typo | 5 V×2 A=10 W at 5 V; 10/(0.85×0.85)=13.84 W battery-side; 332.18 Wh/day before additional loads. Fix capacity text to 48 V ×10 Ah=480 Wh. |
| 27 | Duplicated prototype-current and electronics rows | Keep one row per calculation. Show both assumed 85% converter efficiencies. |
| 28 | Empty formula/result cells | Fill: prototype 384−332.18=51.82 Wh; BEMAC 1120−332.18=787.82 Wh; 10.80%/17.84% nominal energy; 1.16×/3.37× load coverage; study benchmark 125.156 Wh/km. |
| 29 | Empty distance/time cells | Prototype 0.41 km /1.2 min energy-only equivalent; BEMAC 6.29 km /18.9 min. Natural wind stays 4.34 W ×3 h=13.02 Wh under separate assumptions. |
| 30 | 144+13.02=157.02 Wh; 880+13.02=893.02 Wh | 51.82+13.02≈64.84 Wh; 787.82+13.02≈800.84 Wh, using unrounded inputs. Complete riding-airflow row: 20/3.6=5.56 m/s. |
| 33 | 300 W Micro-VAWT; solar branch labelled Wind branch protection | 400 W VAWT (seller rated at 12 m/s); solar path box: Solar branch protection and electrical measurement. |
| 33 | Compatible traction charging state / Selection unresolved | Compatible wind-to-traction charging interface (selection unresolved). Wind and solar converge through independently suitable charge paths. Battery-side DC protection must be near its source. |
| 33 | Busbar attachment interpreted as charging approval | The intended charge interface must preserve BMS charge-stop behavior and OEM permissions. Technician busbar identification does not establish charging limits or fault disconnection. |
| 34 | Net-current channel and forecast without vehicle-current interface limit | For intended BEMAC, specify an appropriately rated net-current interface. A small prototype breakout cannot be assumed suitable for the traction pack main current or its 325 A protected circuit. |
| 34 | Proposed PWA controls read as current wireless device commands | Keep intended authorized controls in the SOLAIR architecture, but identify the command path as planned until implemented/tested. Current LTE evidence covers telemetry; USB service commands are separate. |
| 40 | Score interpretation has gaps, e.g. 4.01–4.09 | Align all contiguous intervals with the approved scoring scheme. Do not silently invent a replacement validated scale. |
| 46, 48 | SOLAIR development subtotal 1.18; composite 3.46 | 0.30×3.90=1.17; 0.60+1.68+1.17=3.45. Round only final totals. SOLAIR ranking remains first. |
| 47 | Security & Processing Reliability heading | Development & Integration Complexity, matching that table and 30% weighting. |
| 49 | PZEM +VB labelled LARGE_SCREW_LOAD | Protected positive supply being measured. On prototype: W1 opening5 through suitable battery-side branch protection to PZEM +VB; positive-feed protection remains unresolved. |
| 49 | PZEM second −VB labelled LARGE_SCREW_LOAD | SOURCE-side negative reference, same electrical side as the other −VB. It is not a positive supply or separate load-current path. |
| 49 | PZEM SENSE and first −VB | Keep SENSE to small LOAD-side shunt screw; first −VB to small SOURCE-side screw. Review communication/measurement ground isolation before battery connection. |
| 49 | ACS symbol says ACS758LCB-050B while earlier records use 100B | Use the actual marked sensor variant and matching sensitivity. A symbol rename does not establish the physical part or calibration. IP+/IP− primary circuit is not shown fully on this CPE-only sheet. |
| 49 | HCW-to-ESP32 +5 V drawn as permanent power feed | Identify the removable/exclusive USB-versus-HCW power selection. Keep 5V_HCW sensor supply distinct from selected ESP32 5V as in the physical assembly. |
| 50, 52–58 | CAD and Gantt image treated as physical/percentage proof | Keep as design/planning records. Complete mass, roof rating, clamp retention and task completion need actual evidence. |
| 51, 59–61 | Landscape placeholder graphics | Replace with actual prototype photo, app view, original video and test evidence. Do not script a successful video/test while these remain placeholders. |

## Speaking notes in your exact slide order

Use the corrected slide content before speaking these notes. Bracketed or pending evidence must be supplied from actual tests. The Gantt notes refer to the visible task rows; the screenshots are not a fresh progress audit.

| PDF page | Actual slide | Short speaking notes |
|---|---|---|
| 1 | Title | Good day. We present SOLAIR, a hybrid energy-harvesting and edge-computed anti-tamper system with IoT tracking and monitoring for commuter e-trikes. We will explain the proposed vehicle system and distinguish it from our present prototype evidence. |
| 2 | Introduction | The design addresses charging dependence, battery depletion, equipment security and monitoring needs. Solar supplementation, local tamper detection and wireless monitoring are the proposed responses. |
| 3 | Theoretical Framework | These theories guide energy conversion, local security processing, communication and evaluation. They provide methods and design limits; the prototype tests establish what the implementation actually achieves. |
| 4 | Three-Layer IoT Architecture | The perception layer acquires electrical, location and tamper inputs. The network layer carries data through LTE, and the application layer stores and presents the information in the SOLAIR web app. |
| 5 | Conceptual Framework: IPO | The inputs are the project requirements and selected hardware and software. Development and testing produce the intended integrated SOLAIR system. This diagram describes the full proposed system; the present prototype implements a subset with the limitations documented separately. |
| 6 | Hardware–Software Co-Design | We develop the physical interfaces and firmware together. For example, the ACS analog conditioning must match the ADC input and conversion formula, while switch wiring must match the firmware's active input logic. Integration tests check those interfaces together. |
| 7 | V-Model | Each design level has a corresponding verification activity. Module tests check individual functions, integration tests check interfaces, and acceptance tests check the original requirements. |
| 8 | Development Stages 1–5 | We began with problem validation and architecture, then detailed the modules and implemented the hardware and software. Unit testing records the behavior of each module before combined testing. |
| 9 | Development Stages 6–7 | Integration testing checks the connected system. System validation and participant acceptability evaluation require their own evidence and remain separate from compiling software or detecting a sensor. |
| 10 | SOP 1 | We investigate charging arrangements and cost, depletion effects, security incidents, and mounting or regulatory constraints. Our current baseline comprises 16 Manila BEMAC drivers, five Malabon e-trike drivers and one association president or key informant. The selected sample is preliminary. |
| 11 | SOP 2 | We answer this question through the V-Model development record. Requirements, design revisions and test records show how the system developed and how each requirement was checked. |
| 12 | SOP 3 | We assess functional suitability, usability, reliability, performance efficiency, security and maintainability using the approved questionnaire. IT experts and eligible end-users have different evaluation roles. The six characteristics appear under five numbered subquestions because security and maintainability share item 3.5. |
| 13 | SOP 4 | The technical evaluation covers weatherproofing, net harvesting, tamper classification, forecasting error and IoT resilience. Each requires actual trials and recorded conditions. A planned test method does not yet establish a performance result. |
| 14 | Scope and Limitations | This is a selected-participant study and an intended single-vehicle implementation. The system supplements charging and provides security monitoring. Range improvement, weather resistance and vehicle mounting must be evaluated under documented conditions. |
| 15 | Significance: Transport Stakeholders | Drivers and operators may benefit from energy and security information. Passengers and TODA may benefit from better visibility into vehicle operations. Those are intended benefits to be evaluated. |
| 16 | Significance: Government and Security | The study can provide operational and technical observations relevant to transport and community-security work. It does not claim approval or certification from the agencies shown. |
| 17 | Significance: Academic Community | The project documents hardware–software integration and its validation methods. Future researchers can use the recorded design choices, test conditions and unresolved limitations. |
| 18 | Research Design | The research combines exploratory problem validation, engineering development, technical testing and participant evaluation. We keep interview evidence, measured technical results and questionnaire ratings separate. |
| 19 | Process Flow: Acquisition and Energy | The system acquires timestamped sensor readings and records their validity. Battery charge and time estimates require valid net battery current and initialization. When those inputs are unavailable, the estimate remains unavailable while other valid readings can continue. |
| 20 | Process Flow: Security and Communication | The implemented security states are DISARMED, ARMED and TRIGGERED. Local logic evaluates enabled inputs and controls the supported siren response. LTE carries telemetry to the service, while a connection failure must remain visible rather than appearing as a fresh update. |
| 21 | Research Instruments | The operational interview guide addresses baseline needs. Engineering logs address technical performance, and the acceptability instrument addresses expert and user ratings. Each instrument answers its corresponding research question. |
| 22 | Statistical Treatment: Baseline and Physical Penalties | Frequency and percentage summarize the selected responses. Sensor error compares a reading with an independent reference. Drag and added-mass equations estimate penalties only after their parameters and operating conditions are established. |
| 23 | Statistical Treatment: Energy and Motion | Electrical energy is voltage times current accumulated over time. Wind benefit subtracts the propulsion penalty from generated energy. Motion magnitude is a feature for detection; it still needs calibrated decision rules and false-alarm testing. |
| 24 | Statistical Treatment: Detection and Battery Estimate | A confusion matrix distinguishes actual tampering from non-tampering trials. Coulomb counting estimates charge from validated net current and an initial reference. Time-to-empty additionally requires positive net discharge and a stated reserve or usable capacity. |
| 25 | Statistical Treatment: Forecast and Acceptability | MAE and RMSE compare predictions with later observed outcomes in matching units. Mean and weighted mean summarize valid observations or questionnaire responses. No forecast accuracy or acceptability score is claimed before those records exist. |
| 26 | Energy Calculations: Power and Capacity | Our 5-volt, 2-ampere budget is 10 watts at the 5-volt rail. Assuming 85 percent efficiency for each converter gives 13.84 watts at the battery and 332.18 watt-hours daily. Nominal battery energy is 480 watt-hours for the prototype and 4,416 watt-hours for BEMAC. |
| 27 | Energy Calculations: Solar and Prototype Cap | The 400-watt array, four peak sun hours and chosen 70 percent yield give 1,120 watt-hours of daily solar potential. The separate prototype example uses a proposed 2-ampere cap at nominal 48 volts for four chosen clock hours, giving 384 watt-hours. Those clock hours are an independent assumption. |
| 28 | Energy Calculations: Balance | Subtracting the modelled 332.18 watt-hours gives 51.82 watt-hours for the prototype and 787.82 for the BEMAC reference before additional loads. These equal 10.80 and 17.84 percent of nominal energy. They are theoretical energy comparisons, not measured SOC gains. |
| 29 | Energy Calculations: Distance and Stationary Wind | Using the study benchmark of 125.156 watt-hours per kilometre gives 0.41 kilometres of prototype energy equivalent and 6.29 kilometres for BEMAC. The stationary wind example adds 13.02 watt-hours under its separate assumed wind and interface conditions. |
| 30 | Energy Calculations: Future Hybrid | Adding the stationary wind scenario gives 64.84 watt-hours for the prototype and 800.84 for BEMAC before additional loads. The wind contribution remains a model until the rotor, resource and compatible charging interface have been tested. |
| 31 | Energy Calculations: Riding Wind | At the assumed riding condition, the turbine produces 17.9 watt-hours gross but requires at least 25.5 watt-hours of extraction-related propulsion energy. The resulting wind-only change is at most negative 7.7 watt-hours before other losses. Riding airflow is therefore not free energy. |
| 32 | Previous versus Current Design | This comparison should show the actual revisions retained in the current design. We distinguish proposed vehicle features from the shared-battery prototype and identify the evidence that motivated each change. |
| 33 | SOLAIR Vehicle Energy Block Diagram | This is the intended SOLAIR vehicle architecture. Solar and wind require separate compatible conversion and protection paths before an approved battery charging interface. The battery chemistry, permitted charge limits and BMS supervision govern the BEMAC connection. The prototype diagram is separate. |
| 34 | SOLAIR Sensing and Telemetry Block Diagram | This is the full proposed sensing, security and telemetry architecture. Electrical acquisition, contacts, motion and GPS feed the ESP32. Local processing supports the siren and cellular telemetry, while proposed remote controls and backup power require separate implementation and validation. |
| 35 | Development Activities: Problem, Mechanics, Procurement | These records document problem validation, mechanical design and procurement activities. Each photograph or record shows the named activity; it does not by itself establish completed system validation. |
| 36 | Development Activities: Software and Integration | These records show software and embedded development and integration work. We report each tested function with its actual setup and result, keeping outstanding calibration and combined-system checks visible. |
| 37 | English Questionnaire | This is the English operational questionnaire. Instrument validation and collecting representative responses are separate tasks. We retain the actual validation record and report only the responses collected. |
| 38 | Tagalog Questionnaire | The Tagalog version supports respondent comprehension while retaining the same intended constructs. The interview groups and the key informant remain identified separately in the analysis. |
| 39 | Hardware Cost Distribution | The listed baseline hardware budget is 32,596.81 pesos. Hybrid energy hardware is the largest category. This is a cost breakdown, not measured operating savings or a payback result. |
| 40 | Multiple-Constraint Scales | These are the declared scoring rules for comparing candidate designs. The design-selection scores describe our engineering decision model and are separate from the participant acceptability survey. |
| 41 | Economic Feasibility | The comparison uses a common pricing basket and the stated cost-ratio rule. The proposed SOLAIR option costs more than the budget candidate, so its selection must also consider function and integration. |
| 42 | Security and Reliability: Budget Candidate | The budget candidate receives the shown design-assessment scores for processing, sensing, communication, hardware and software. These are comparative design ratings rather than measured security-test outcomes. |
| 43 | Security and Reliability: SOLAIR | SOLAIR's proposed local FSM, conditioned acquisition and LTE dashboard raise its design score. Features still under development remain proposed; the score does not establish a physical reliability pass. |
| 44 | Security and Reliability: Overkill Candidate | The high-end candidate provides additional processing and sensing capability but adds hardware and integration demands. We assess it using the same weighting method. |
| 45 | Development Complexity: Budget Candidate | The simple candidate is easier to implement in several subsystems. Its unresolved vehicle compatibility remains part of the comparison rather than being ignored because the electronics are simple. |
| 46 | Development Complexity: SOLAIR | SOLAIR balances interfaces, cellular integration and a web application. Its weighted complexity result must be calculated from unrounded values before rounding the final total. |
| 47 | Development Complexity: Overkill Candidate | The high-end candidate adds operating-system, vision and network-maintenance demands. This slide belongs to development and integration complexity; its current security heading needs correction. |
| 48 | Composite Design Selection | Using consistent unrounded arithmetic, SOLAIR scores 3.45, the budget candidate 3.28 and the overkill candidate 2.33. SOLAIR remains the highest-ranked option under the chosen weights. These are design-selection scores, not respondent acceptability results. |
| 49 | CPE Schematic | The circuit shows the ESP32 interfaces, conditioned current channel, communications and offboard alarm components. The PZEM positive-voltage connection and source-return labels must match the corrected terminal map. The team reports ACS solder repair complete; measurement acceptance and modified-termination suitability remain unverified. |
| 50 | Prototype Design: Vehicle CAD | These images show the intended vehicle fit and access arrangement. CAD dimensions guide packaging, but roof-load capacity, complete system mass, clamp retention and road vibration still need vehicle-specific verification. |
| 51 | Sample Design | Show the actual assembled prototype here and identify its solar, power and CPE boxes. Explain that it uses the small 48-volt test battery rather than the BEMAC traction pack. Replace the placeholder image before presenting this explanation. |
| 52 | Gantt Chart: Page 1 | This is the project's recorded work breakdown. Explain the tasks visible on this page and use evidence-backed status rather than treating a planned finish date as completion. |
| 53 | Gantt Chart: Page 2 | This continuation retains the same task and status rules. Point to the visible dependency relevant to the work shown and identify any unfinished activity honestly. |
| 54 | Gantt Chart: Page 3 | This page continues the development record. Describe the visible work stage and distinguish completed documentation from unresolved physical testing. |
| 55 | Gantt Chart: Page 4 | This continuation shows the next scheduled activities. Explain any changed date or pending dependency using the actual team record. |
| 56 | Gantt Chart: Page 5 | This page continues the project plan and progress record. Use the visible tasks to explain sequencing rather than repeating an unverified overall completion percentage. |
| 57 | Gantt Chart: Page 6 | This continuation covers the remaining recorded activities on the page. Identify which tests still require data before their task can be marked complete. |
| 58 | Gantt Chart: Page 7 | This is the final Gantt continuation in the supplied deck. Close the planning explanation with the actual outstanding work and its dependencies. |
| 59 | Software | Show the actual app version and distinguish live hardware data from demonstrations. Explain measurement validity, location freshness and event status. Present SOC and time-to-empty only when their required inputs are valid. |
| 60 | Demonstration Video | State the actual power source, communication path and test shown before playing the recording. The recording demonstrates only those observed functions. Replace the placeholder with the real video. |
| 61 | Testing | Present each actual test with its conditions, observation and result. Keep uncompleted ACS calibration, wind charging, autonomy and vehicle validation separate from the functions that passed. Replace the placeholder with actual evidence. |
| 62 | Closing | This concludes our presentation. We welcome questions on the architecture, calculations, implementation and the validation still required. |

## Panel Q&A tied to your slide topics

| PDF page / topic | Likely question | Direct answer |
|---|---|---|
| 10 / SOP1 | Are 22 responses enough? | They are a preliminary selected sample:16 Manila BEMAC drivers,5 Malabon drivers and1 key informant. Report group denominators separately; do not claim city-wide representativeness. |
| 10 / SOP1 | Does interview data prove LTO compliance? | No. Interviews describe operations. Applicable rules, dimensions and vehicle-specific structural checks require separate documented review. |
| 6–9 / SOP2 | What proves hardware–software co-design? | Show a real paired change: divider/ADC input and firmware scaling, or switch polarity/debounce and FSM response. Link the actual design revision to its test record. |
| 7–9 / SOP2 | What proves the V-Model? | A trace from each requirement to module design, implementation and corresponding unit/integration/acceptance evidence. The diagram alone does not prove completed validation. |
| 12 / SOP3 | Why five items but six characteristics? | Item3.5 groups security and maintainability. There are six selected characteristics under five subquestion numbers. |
| 12 / SOP3 | Does a working app answer acceptability? | Function tests support technical behavior. Acceptability requires the actual approved IT-expert/end-user evaluation and its collected ratings. |
| 13 / SOP4.1 | Is the assembly certified IP65? | The bought boxes carry a rating; the drilled and assembled system has not been certified. Report the actual weatherproofing procedure and observations. |
| 13, 23 / SOP4.2 | Can you claim solar and wind charging today? | Only report the sources with actual accepted electrical-energy records. Wind remains a separate planned/interface-validation case unless its charging test exists. |
| 13, 24 / SOP4.3 | What demonstrates tamper accuracy? | Label tamper and normal trials, record TP/FP/TN/FN, then compute the declared metrics. Switch operation or an acceleration graph alone does not establish classification accuracy. |
| 13, 25 / SOP4.4 | Is SOC/TTE forecasting validated? | Software support exists, but valid net-current history, initialization and paired later outcomes are required. MAE/RMSE remain unmeasured until prediction/outcome trials exist. |
| 13 / SOP4.5 | What is autonomous uptime? | Elapsed observed operation without USB/adapter, under stated load, source and stop condition. An intentionally ended run gives observed duration, not maximum endurance. |
| 13 / SOP4.5 | Is fresh-data age transmission latency? | No. Latency needs a defined device event/send timestamp and server receipt with stated clock synchronization. Freshness and latency are different metrics. |
| 26–30 | Where did 10 W come from? | 5 V×2 A. It belongs to the 5 V rail. Assuming85% per converter gives13.84 W battery-side and332.18 Wh/day before additional loads;2 A is unmeasured unless independently recorded. |
| 26–30 | Why85% and70%? | 85% per converter is an explicit chosen assumption, not measured efficiency.70% solar yield uses published loss/temperature context plus chosen conditions; it is not an MPT efficiency test. |
| 27 | Why2 A MPT? | A proposed modest prototype commissioning setting:2 A/10 Ah=0.2C. It is not an optimum, confirmed saved value or BEMAC charge-current permission. |
| 28–29 | How do motorpool findings and the UP study combine? | Motorpool module labels give4416 Wh nominal battery energy. The solar model gives contributed Wh. The UP charging-energy economy supplies a separate approximate distance benchmark. |
| 29 | Did you prove6.29 km extra range? | No.6.29 km is the corrected energy-equivalent scenario before omitted loads and mounting penalties. Actual added kilometres require controlled vehicle comparisons. |
| 31 | Does wind generated while riding provide free energy? | No. The model includes extraction-related propulsion cost. In the stated still-air example, wind-only net is at most−7.7 Wh before other losses. |
| 33 | Can you connect straight to BEMAC busbars? | Identifying polarity or a suitable attachment point does not establish the charging profile or BMS shutdown path. The intended interface still needs approved charge limits and disconnection behavior. |
| 33–34 | Why is the prototype different from SOLAIR? | The48 V/10 Ah prototype demonstrates selected system functions on a smaller pack. It does not establish BEMAC traction-current, roof, charging or road compatibility. |
| 34, 59 | Can the PWA arm/disarm the device wirelessly now? | That is an intended SOLAIR feature. Current verified implementation must be stated separately: LTE uplink reports telemetry/FSM, while device commands currently use the supported local USB/service path. Do not present UI buttons as proof of wireless actuation. |
| 49 | Why use both PZEM and ACS? | PZEM monitors the defined solar branch voltage/current/energy; ACS is intended to measure net prototype battery flow. Their measurement points differ and both need their own validation. |
| 49 | Does ACS measure battery voltage? | No. ACS measures current. Battery voltage comes from the appropriately connected PZEM voltage input or another validated voltage channel. |
| 49 | Why is battery percentage unavailable? | Current-based estimation needs valid net battery current, known capacity and a documented starting reference. Showing an invalid reading as a plausible percentage would be misleading. |
| 49 | Can you use #18 wire just for the demo? | A demo does not establish wire/protection compatibility. The exact Niara/Circuit wires lack verified ratings for the unchanged15 A battery path; the termination must still match its protection; current calibration remains unverified. |
| 49 | Why were1 A and5 A fuses listed? | They were preliminary battery-side search targets, not final approvals from measured branches/inrush and protection curves. The existing5 A fuse on12 V output is a separate device. |
| 50 | Why4040 instead of ordinary solar rail? | Both can mount panels.4040 provides adjustable mounting for the prototype electronics and frame. No comparative strength, mass or vibration superiority was established. |
| 50 | Is the prototype safe for the BEMAC roof? | The two panels are seller-listed at20 kg total. Complete mass and vehicle roof/mounting capacity are unestablished; frame fit and CAD do not prove road suitability. |
| 40–48 | Are your design scores expert acceptability results? | No. They are a weighted candidate-selection model. The participant acceptability evaluation is separate and requires actual responses. |
| 60–61 | What if live data or testing fails? | State the actual unavailable function and show genuine recorded evidence where available. Do not relabel an old frame, software fixture or prediction as a new physical pass. |

## Block-diagram review

| Diagram | What to preserve | What to correct |
|---|---|---|
|4:Three-layer IoT|Perception,network,application abstraction|Use actual LTE for the project network example; genericBluetooth is not the current device transport.|
|5:IPO|Full intended SOLAIR scope|Correct400 W listing,three-state labels and OEM/BMS-compatible charging. Separate proposed backup/remote features from prototype evidence.|
|6:Co-design|Requirements,parallel hardware/software design,co-verification|Show concrete interface evidence. A flow diagram does not establish all acceptance tests completed.|
|7–9:V-Model|Design levels and corresponding test levels|Retain proposed/implemented/tested distinction; support with requirement-to-test records.|
|19–20:Process|Validity-gated forecasts,local FSM,telemetry/failure paths|CorrectDISARMED label. Identify supported commands,enabled motion and implemented notification path. Displayed validity must reflect real data.|
|33:SOLAIR energy|Two renewable branches converging at compatible approved vehicle charging interface|Solar-labelled protection in solar branch;400 W listing;compatible wind conditioning;per-source DC protection;BMS charge-stop behavior. A direct busbar is not a complete approved interface.|
|34:SOLAIR acquisition|Sensors/DAQ,ESP32,siren,LTE,PWA;future features if retained in scope|Distinguish power arrows from data;include PZEM/MAX3485 and ADC conditioning;vehicle-rated net-current channel;identify proposed command/backup paths.|
|49:CPE circuit|Reported GPIO architecture,divider/filter,test headers,offboard separation|PZEM+VB andsource-reference labels;actualACSvariant/sensitivity;removableUSB/HCWselection;show primary circuit separately. Screenshot review is not netlist or physical acceptance.|

The published prototype Mermaid diagrams are additional diagrams. They do not replace the intended SOLAIR/BEMAC block diagrams. No new charging-interface or powered-test approval follows from this documentation.

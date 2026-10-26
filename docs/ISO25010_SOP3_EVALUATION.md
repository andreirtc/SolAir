# SOP3 — IT expert and TODA evaluation worksheet

Prepared 26 October 2026. **Proposed study worksheet, not an already validated questionnaire or an ISO-issued scoring instrument.** Use the institution-approved instrument, anchors, sampling and interpretation rules where they exist. No participant responses or acceptance results are prefilled.

## Evaluation record

Participant code: ______  Group: IT expert / TODA operator / TODA driver

Date: ______  App/build: ______  Device/browser: ______  Hardware/device build: ______

Conditions: TEST FIXTURE demonstration / validated real-device session. Network and scope: ______

Observer code: ______  Tasks demonstrated: ______  Missing/failed/unsafe tasks: ______

Use participant codes rather than publishing names, phone numbers, photos or precise personal routes. Explain the study, obtain the participation permissions/consent required by the approved research protocol, and use authorized accounts. Do not operate the app while driving. Physical tests use the existing qualified bench procedure; simulated readings are always identified as simulated.

## Observation tasks before ratings

| Task | Expected evidence to observe | Record |
|---|---|---|
| T1 — Entry and assignment | Open the welcome screen, sign in, identify the authorized role/TODA and assigned vehicle. Confirm an unassigned account does not acquire extra access. | Completed / failed / not observed; time; error/help needed |
| T2 — Interpret readings | Identify real versus simulated source, missing/stale readings and valid energy values/graphs. Compare actual hardware readings to reference measurements when available. | Correct/incorrect interpretation; reference and tolerance; not observed if no real data |
| T3 — Location history | Find the assigned e-trike, inspect GPS time/coordinates, recorded track and stop filter. Explain estimated distance and an unavailable address. | Completed/failed; navigation errors; exact-address requirement status |
| T4 — Alerts | Interpret reported security/lid/mount/alarm state and freshness. Distinguish a recorded event from a physically verified siren or operator response. | Completed/failed/not observed; genuine event evidence when tested |
| T5 — Assistance and recovery | Submit a fixture request, distinguish server receipt/acknowledgment, demonstrate an offline/failed save and reconnect retry. Never send a false real emergency. | Request identity; unsent/received/acknowledged; duplicates; retained details |
| T6 — Account and privacy | Review settings, register/assignment details, change allowed profile fields/photo, observe forbidden access being denied using approved test accounts. | Completed/failed; scope; privacy understanding |
| T7 — Reports and help | Open/search FAQ, use keyboard to open/close the manual, download its PDF and export authorized reports. | Completed/failed; assistance needed; accessibility observations |
| T8 — Reliability | Observe authorized fault/recovery demonstrations: stale data, provider/network failure, restart and preserved records. Real power-loss testing requires the bench procedure. | What was genuinely observed; recovery/loss/duplication; not observed cases |
| T9 — Performance | Record task times, device/network condition and resource measurements against project-defined targets. | Measured values; target; sample count; result or target not specified |
| T10 — Expert maintenance | Review modules, migrations, access controls, test results and logs; make a representative controlled maintenance change in a disposable copy and rerun checks. | Expert evidence; regression/rollback result; TODA N/O if not observable |

A participant must not rate an unobserved function from screenshots or an explanation alone. Uncommissioned hardware, missing exact-address lookup, unavailable delivery evidence and non-demonstrated maintenance properties stay explicitly recorded. Do not hide an unmet critical requirement by excluding it from the score denominator.

## Rating anchors and items

Suggested anchors for agreement statements: **1 Strongly disagree; 2 Disagree; 3 Neither agree nor disagree; 4 Agree; 5 Strongly agree; N/O Not observed / unable to judge.** These are proposed study choices, not ISO-mandated pass/fail values. Retain the approved scale if it differs. Each item needs a score plus task/evidence reference and an optional comment.

| ID | Quality attribute | Statement to rate after observing the relevant task | Primary evidence/observer |
|---|---|---|---|
| FS1 | Completeness | The demonstrated system provides the functions needed for my defined tasks, with missing functions clearly identified. | T1–T7; IT/TODA |
| FS2 | Correctness | The results I observed agree with the expected reference results and stated tolerances. | T2–T5; IT/TODA; real measurements required for sensor-accuracy claims |
| FS3 | Appropriateness | The available functions help me complete those tasks without unnecessary steps. | T1–T7; IT/TODA |
| U1 | Recognizability | I can identify what the system is for, which vehicle I may access, and what its data/source labels mean. | T1–T4; IT/TODA |
| U2 | Learnability | The instructions and Help/manual allow me to learn the observed tasks. | T1/T7; IT/TODA |
| U3 | Operability | I can navigate and control the observed functions on the tested device. | T1–T7; IT/TODA |
| U4 | Error protection | The system helps me recognize/correct mistakes and explains whether an action failed, was queued or was received. | T5/T6/T8; IT/TODA |
| U5 | Aesthetics | The text, spacing, colours and card presentation support a clear and satisfactory interaction. | T1–T7; IT/TODA |
| U6 | Accessibility | I can use the observed interface with the input/reading/assistive methods needed in this evaluation. | T7; record keyboard/text-size/screen-reader conditions; IT/TODA |
| R1 | Maturity | During the observed normal-use session, the system performs the specified tasks without unexpected failures. | T1–T7; IT/TODA |
| R2 | Availability | The needed service remains accessible during the defined observation period or clearly reports an outage. | T8; log period and uptime evidence; IT/TODA |
| R3 | Fault tolerance | The demonstrated failures are handled without presenting invalid readings/actions as successful. | T5/T8; IT/TODA |
| R4 | Recoverability | After the demonstrated interruption, the required records/state recover without unexplained loss or duplication. | T5/T8; IT/TODA; physical claims need actual power-loss evidence |
| P1 | Time behaviour | The observed task/response times meet the test targets defined for the tested conditions. | T9; IT/TODA; N/O until a target and observations exist |
| P2 | Resource utilization | The measured resource use is suitable for the specified devices and operating conditions. | T9; IT measurements; TODA rates only actually observable battery/data/device behaviour |
| P3 | Capacity | The system sustains the declared test load while meeting the specified behaviour. | T9; IT load evidence; TODA N/O without a demonstrated load case |
| S1 | Confidentiality | The observed access controls protect information outside my authorized account/vehicle/TODA scope. | T6/T10; IT/TODA |
| S2 | Integrity | The demonstrated controls prevent unauthorized or invalid changes and preserve required data relationships. | T6/T10; IT; TODA only demonstrated outcomes |
| S3 | Non-repudiation | The demonstrated evidence mechanism meets the project's stated requirement for proving the origin of an action/event. | T10; expert evidence review; document the assurance limits of ordinary editable audit logs |
| S4 | Accountability | Recorded actions and follow-up can be traced to the appropriate identities and times in the demonstrated cases. | T4/T5/T10; IT; TODA observable follow-up |
| S5 | Authenticity | The demonstrated sign-in/device controls distinguish authorized identities and reject unauthorized ones. | T1/T6/T10; IT/TODA; device identity requires expert evidence |
| M1 | Modularity | A reviewed component can be changed with limited effects on unrelated parts. | T10; IT; TODA N/O without appropriate evidence |
| M2 | Reusability | Reviewed components/contracts can be reused without copying hidden dependencies or breaking behaviour. | T10; IT; TODA N/O when unable to judge |
| M3 | Analysability | The demonstrated diagnostics/documentation help identify the cause and location of a fault. | T10; IT; TODA only the demonstrated user-support portion |
| M4 | Modifiability | The representative maintenance change can be implemented and rolled back without degrading required behaviour. | T10; IT; TODA N/O unless a controlled change was demonstrated |
| M5 | Testability | The required behaviours have repeatable tests with observable, interpretable results. | T10; IT; TODA only actually demonstrated checks |

For every item: score ______; task/evidence ______; comment/required improvement ______.

## Reporting rules

1. Report IT-expert and TODA results separately, with actual participant counts, role mix, conditions and missing observations. A TODA member must not be required to pretend to evaluate source-code modularity.
2. Keep automated-test results, physical measurements and survey ratings in separate tables. A 100% automated pass rate is not a participant acceptability percentage.
3. Retain all N/O entries and explain their causes. Report coverage as well as scores. If essential functionality was not demonstrated, keep the readiness limitation visible even when observed items receive high scores.
4. With equal item weights, a respondent's domain mean is the sum of valid item scores divided by their number of observed items; if none were observed, report N/O. Report item distributions and optionally medians/spread. Use mean/weighted-mean interpretation only as specified by the approved methodology; do not invent responses or substitute N/O with 0, 3 or 5.
5. Aggregate respondent domain scores within each cohort using the approved weighting. Do not silently weight participants differently because one observed more items, or combine cohort means without explaining the weighting.
6. Report Security and Maintainability separately within SOP3 heading 5. If the approved method requires a combined figure, predeclare the combination rule and require evidence for both domains; do not invent a maintainability score from a security score.
7. Apply only the interpretation bands and decision rules approved for this study. ISO/IEC 25010:2011 does not make a particular Likert mean an automatic universal pass.
8. Final report format: criterion; cohort; participants; observed/missing items; descriptive score/distribution; interpretation under the approved rules; technical/physical evidence; failures and corrective actions.

**Current participant acceptability result: not determined — actual completed evaluator data were not supplied to this audit.**

References: [official ISO/IEC 25010:2011 model scope](https://www.iso.org/standard/35733.html), [SOLAIR technical audit](ISO25010_SOP3_AUDIT.md), and the project's physical bench acceptance guide.

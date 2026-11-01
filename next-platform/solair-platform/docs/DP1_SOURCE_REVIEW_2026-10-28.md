## 29 October update · actual PPT source found

The supplied local GROUP 4_DP1 - TEMPLATE.pdf has62 pages. It was read and selected diagrams, formulas, CAD, questionnaire and placeholder pages were visually inspected. The exact-page script,28 correction rows and30 Q&A answers are in DP1_ACTUAL_PDF_DEFENSE_GUIDE_2026-10-29.md. Canva remains inaccessible and unchanged; source PDF remains unchanged. Slides33–34 describe intended SOLAIR/BEMAC, not the prototype. New Mermaid diagrams describe only the48 V prototype. Gantt screenshots are not a fresh audit of the Google Sheet or progress percentage.

# October 28 source-review status

| Source | Observed | Review status |
|---|---|---|
| GitHub branches | Newest dated head: `feature/solair-quality-ui-updates-2026-10-26-v2`, `e8967336906e023cfeaba134705fcdb3e33fbc60`; non-v2 same SHA. | Candidate identified; no branch merge or compatibility acceptance. |
| Canva supplied link | HTTP403 from this environment. | Slide contents not audited. Team must check current deck against the final-day documentation queue. |
| Gantt supplied link | Sharing-page HTTP200, title `_4104 Gantt Chart v4_10-22-2026`; `prototype & system`, `Milestone Dashboard` and `Evidence Checklist` tabs read through public HTML sheets. | **Not ready to call actual readiness final:** projected statuses and pending proof need reconciliation. No live formulas were changed. Budget/techno tabs were not audited. |
| Team survey counts | User: Manila16 BEMAC; Malabon1 TODA president +5 NWOW. | 22 respondents, preliminary; raw responses/selection/statistics not independently audited. |
| Weights | User supplied seller panel listing10kg; no scale, rail density or total assembled mass. | 20kg panel-pair subtotal is seller-based, not a measured system total. |

Gantt readiness check: include Oct28 cable/fitting, ACS/PZEM gates, wireless/physical tests, actual solar/video, software integration, evidence/slides/scripts/rehearsal, transport/setup, Oct29 noon defense; assign owners and actual statuses. Keep incomplete future wind/vehicle/weather/forecast validation visible. Do not backdate completion.

No shared Google/Canva file was modified.

## Gantt corrections for the team to apply

Source: `prototype & system`, gid1140278886. HTML rows retained in `docs/cpe-evidence/2026-10-28-final-day-plan/gantt-first-sheet-rows.json`. Row numbers below are the displayed sheet row labels, not invented test results.

| WBS / row | Currently shown | Required correction |
|---|---|---|
| 8.5 / row211 | October29 defense completed milestone:75%, In Progress | Separate this actual-defense milestone from the M08 preparation+defense aggregate. The defense itself remains Not Started /0% until it occurs; correct the link/definition rather than overwriting a formula. |
| 6.9.3 / row163; 7.3.1–7.3.2 / rows177–178 | Solar measurements100%, Completed, dueOct26 | Match the latest physical evidence. Solar testing remains on today's task list; use Pending/In Progress unless dated actual logs establish these exact measurements. |
| 6.5.4 / row149 | Forecast recalibration100%, Completed | Attach actual calibration/evaluation evidence or change to Pending/Not Performed. Planning a method is not completed forecast calibration. |
| 7.6.1 / row189;8.3.4 / row208 | Recorded video and offline backup100%, Completed | Confirm an actual working-prototype MP4 exists and plays offline. Today's required recording is not automatically completed. |
| 8.3.1–8.3.3 / rows205–207;8.3.5 / row209 | Final slides, operational rig, rehearsals, safety/evidence sign-off100%, Completed | Reopen whatever is still being finalized, assembled or tested. Complete only after today's corresponding checks. |
| 1.2.2 / row18;1.4.4 / row30 | Battery/BMS protection requirements and protective devices/connectors100%, Completed | Clarify whether the deliverable was a documented review only. List unresolved actual branch fuses, ACS termination and BEMAC charge-control interface explicitly; do not imply hardware readiness. |
| 6.7.2 / row155 | “Connect MQTT/LTE Data Flow”100%, Completed | Name the transport actually demonstrated. Existing device logs show HTTPS/PPP; do not imply MQTT was tested without its own evidence. |

## Dashboard / evidence findings

The dashboard explicitly calls its percentages **PROJECTED / not independently verified**. Visible milestone weights/earned shares sum to71.25%; pre-defense weights sum to72%, so71.25/72=98.96% projected defense readiness. This arithmetic is consistent with the displayed values; it does not establish physical readiness or verify the underlying formulas.

| Evidence Checklist location | Observation | Team action |
|---|---|---|
| E19:F20 — M04 criteria2–3 | Completion1, but proof notes say “pending test” for solar readings/charging observations. | If still unperformed, set completion to0 for actual tracking; keep projected work explicitly labelled PROJECTED – NOT VERIFIED. Attach actual dated evidence before earning completion. |
| F24:F26 — M06 | GPS/LTE/anti-tamper and source-archive evidence links remain pending. | Attach actual firmware/app SHAs, accepted transport records and physical function logs. A generic future filename is not evidence. |
| E32:F35 — M08 preparation | Slides/demo/rehearsal/sign-off marked1. | Reconcile each with today's outstanding tasks; attach the actual file/log when complete. |
| E36:F36 — actual defense | Completion0 with Oct29 evidence pending. | This is correct before the defense; preserve it. |

Use the sheet's intended completion/proof inputs (E/F). Do not manually overwrite calculated task/milestone percentages. If projected planning remains in the same dashboard, retain the PROJECTED label on any slide/screenshot; show actual evidenced completion separately. Keep post-defense wind, weather/forecast and expanded tests separate from DP1 evidence.

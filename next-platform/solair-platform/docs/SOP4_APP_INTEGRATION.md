# SOC/TTE and SOP 4 application support

Work in `next-platform/solair-platform`, Node 24. As of 29 October, app port **3000** combines this functional backend with the updated frontend. The earlier **3100** preview is historical; use 3000. See `COMBINED_APP_INTEGRATION_2026-10-29.md` for reconciliation, checks and rollback. Software integration does not create device or physical evidence.

| Function | Implementation | Actual acceptance still needed |
|---|---|---|
| Battery percentage | `GET /api/battery/:vehicleId`: current integration from an explicit reference and capacity; prototype 48 V / 10 Ah and BEMAC reference are separate profiles | Validated signed net battery current, documented initial SOC/capacity/efficiency; estimate is not a validated fuel gauge |
| TTE | Recent time-weighted mean net discharge, to the configured SOC reserve | Continuous recent samples, stable measurement/reference and held-out actual endpoint trials |
| 4.1 Weatherproofing | Append-only protocol/result/evidence records | Physical standard-aligned tests; software cannot certify IP65 |
| 4.2 Energy harvesting | Accepted-sample solar/wind/signed battery Wh with coverage; separate entered bench/on-vehicle trials | Validated meters, matched boundaries/conditions, real wind and propulsion/auxiliary records |
| 4.3 Anti-tamper accuracy | Ground-truth trial records; TP/FP/FN/TN, accuracy, precision, recall, specificity, F1 | Actual mounted contact/motion/siren trials and all misses/false alarms |
| 4.4 Forecast accuracy | Freeze a server-computed TTE snapshot; link one later actual outcome; MAE/RMSE | Same declared reserve endpoint, independent outcomes and evaluation protocol; software does not auto-validate a model |
| 4.5 Resilience | Clock-qualified wireless timing pairs; median/p95/mean/max; named observed autonomy intervals | Actual send/receipt clocks and continuously observed battery-only power. A stopped run is not maximum runtime |

**Where to find it:** Driver Home and Energy display percentage/TTE. CPE Lab includes an engineering SOC-reference form, SOP 4 summary, structured evidence-entry forms, prediction capture and JSON export. These functional components are integrated into the updated frontend; its appearance is retained.

## Calculation basis

| Quantity | Formula | Meaning |
|---|---|---|
| Initial available charge | `Q0 = capacity_Ah × SOC0 / 100` | SOC0 is a recorded reference or explicitly labelled assumption |
| Transferred charge | `ΔQ = mean(Iprevious, Inext) × Δt_seconds / 3600` | Positive charges; negative discharges. Charge efficiency applies only to positive portions |
| Estimated SOC | `100 × (Q0 + ΣΔQ) / capacity_Ah` | Uses the declared capacity, not battery voltage converted linearly into percentage |
| Estimated TTE | `60 × max(0, Qremaining − capacity × reserve/100) / abs(mean_net_discharge_A)` | Minutes to the selected reserve at recent net load, not guaranteed maximum life |
| Recorded energy | `Σ mean(Pprevious, Pnext) × Δt_seconds / 3600` | Channel-specific Wh; no integration across invalid samples, boot changes or large gaps |
| Forecast errors | `MAE = mean(abs(predicted − observed)); RMSE = sqrt(mean(error²))` | Minutes; paired saved predictions and later matching outcomes only |

Current counting requires an initial reference and accumulates measurement/capacity/timing errors. See [NASA-hosted research on coulomb-counting errors](https://ntrs.nasa.gov/citations/20220008848) and [Analog Devices' SOC estimation explanation](https://www.analog.com/en/resources/technical-articles/a-closer-look-at-state-of-charge-and-state-health-estimation-tech.html). An assumed reference remains labelled assumed. No learned/validated prediction model is claimed.

## Integration contract

- `GET /api/battery/:id?mode=hardware|demo`: authenticated organization/assignment-scoped estimate. `quality`, `soc_pct`, `tte_minutes`, `reason`, `tte_reason`, `reference`, `as_of`, `model_validated:false`.
- `POST /api/battery/:id/reference`: engineer/admin only; see `batteryReferenceSchema` in `packages/research/index.ts`. Capacity, reference basis/time/SOC, reserve, charge efficiency and evidence are explicit. No automatic 100% from 54.4 V.
- `GET /api/research/:id?mode=...`: scoped evidence, SOP metrics, channel energy/coverage and implementation limitations. `POST /records` appends a validated structured trial; `POST /predictions` freezes an available server estimate. Outcomes cannot precede the saved prediction or be duplicated.
- `backend/migrations/017_research.sql` adds dedicated append-only records/reference/outcome tables; retain it during integration. PostgreSQL browser roles have no direct policy/grant to these tables. API authorization remains mandatory.
- Preserve invalid/null current and SOC/TTE as unavailable, not zero. Stale samples, current-history gaps greater than 10 s, restarts, non-monotonic sequence and uncalibrated ACS invalidate the tracked estimate until a new appropriate reference is established. TTE needs at least 10 s of recent current and is unavailable while net charging/idle.
- SOC integration is bounded to 20,000 queried samples; energy summary is a labelled latest-5,000 sample window, with truncation disclosed. It is not an all-time battery-energy balance.
- Missing wind is null, not zero. Environmental/trial/manual timing records remain entered evidence, separate from automatic sensor records. No trials means metrics are unavailable.
- Existing command gap remains: current security commands arrive over USB/Serial; LTE transports telemetry/events upstream. Remote arm/disarm is not implemented by these endpoints.

**Physical status:** team reports ACS soldering and basic continuity passed and is fitting wires. Accuracy, battery-side PZEM release, motion commissioning, actual LTE walk and final merged-app acceptance remain separate.

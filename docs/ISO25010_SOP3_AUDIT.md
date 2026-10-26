# SOLAIR — SOP3 quality-readiness audit

Audit date: 26 October 2026 (Asia/Taipei). Reference edition: ISO/IEC 25010:2011, as requested by the study. This document assesses local software evidence and the available IoT bench notes; it does not assign participant ratings or award ISO certification.

## Assessment conclusion

**The system has substantial software verification evidence, but overall SOP3 acceptability is not yet determined.** No completed IT-expert or TODA-member questionnaires were supplied to this audit. A successful build, dependency scan or automated test is engineering evidence, not a substitute for their evaluation. Physical sensor accuracy, power/network recovery and full device-to-dashboard acceptance remain separate gates.

SOP3 uses five headings but covers six product-quality characteristics: Functional suitability; Usability; Reliability; Performance efficiency; and Security plus Maintainability. Security and Maintainability must retain separate observations/scores inside the fifth heading. Compatibility and Portability belong to the complete eight-characteristic product model but are not separately rated in the supplied SOP3. The SOP3 headings must not be confused with the standard's separate quality-in-use model. Retaining the 2011 edition is intentional; this audit does not silently substitute a later edition.

ISO supplies the quality model. It does not, by itself, supply this project's universal pass mark, Likert interpretation bands, required sample size or response-time target. Those must come from the study's approved requirements and evaluation method.

## Changes made during this audit

1. Applied targeted compatible dependency updates and refreshed the lockfile. The initial production dependency scan reported one critical and four high-severity affected packages. The final full scan, including development tools, is recorded in the evidence file; advisory results are dated snapshots, not proof against every vulnerability.
2. `/api/health` now checks database reachability. An unavailable or timed-out probe returns HTTP 503 instead of a false healthy result. Concurrent health requests share a pending probe; the default response deadline is two seconds. Recovery and exception redaction have regression coverage. This checks database reachability, not hardware status or external-provider delivery.
3. Malformed, oversized and unsupported-encoding request bodies now return safe client errors, including 413/415, without exposing parser details. Added IPv4/IPv4-mapped IPv6 rate-limit and compressed-body robustness regression checks.
4. Production databases and the embedded PostgreSQL fixture now use the same ordered migration registry. The fixture had omitted profile-photo migration 015; the original PostgreSQL-mode run failed two tests because of that omission. Photo tests now support PostgreSQL mode. Added a permission test applying all current hosted migrations and denying anonymous/authenticated direct table reads, including photos.
5. Hardened assistance-queue reads/writes against corrupt JSON, malformed records, blocked storage and quota exhaustion. Unreadable saved data is preserved; failed offline saving no longer claims successful queuing. A browser fault-injection case checks that form details survive and a connected retry produces one fixture server record.
6. Updated two outdated browser expectations to the approved welcome-screen behavior: fresh mobile sessions use Get started, and the BEMAC caption is intentionally absent. Account lifecycle protections, keyboard navigation, reload behavior and visible controls remain tested.
7. Assistance request replay now rejects conflicting payload/source/author identities instead of falsely acknowledging a different request. Exact retries retain the original receipt time and current status; SQLite/PostgreSQL regression checks cover this.
8. Fixed first-install offline branding/energy/manual availability: public essentials are precached, approved optimized images have public fallbacks, public asset bytes/build identity version the cache, and unrelated origin caches are preserved. Private API and unapproved image caching remain blocked.
9. Added repeatable `quality:check`, `quality:browser`, `audit:production` and `test:performance` commands. No real account records, firmware wiring, electrical flags, real provider configuration, Git commits or remotes were changed.

## Evidence matrix

Statuses below describe evidence coverage, not participant acceptance scores.

| SOP3 area / subcharacteristic | Current implementation and local evidence | Remaining acceptance evidence |
|---|---|---|
| Functional completeness | Assigned vehicles, role-specific navigation, GPS history/stops, energy histories, alerts, assistance, accounts, reports, Help/manual and settings have software implementations. | Confirm approved requirements coverage on the real installation. Address lookup is deferred; wind remains uncommissioned; browser push is not configured. Do not advertise these as physically demonstrated functions. |
| Functional correctness | Telemetry contracts, calibration masks, gap-aware energy integration, GPS stop/distance estimates, replay identity and export scope have unit/API/browser fixtures. Missing readings remain unknown. | Compare real voltage/current/energy/GPS readings with reference instruments and agree tolerances. GPS tracks are sampled estimates, not guaranteed exact road routes or street addresses. |
| Functional appropriateness | Driver workflow and registered assignments constrain the information/actions shown; common tasks are exercised in browser fixtures. | IT experts and TODA members must complete the intended tasks and report unnecessary steps or unmet needs. |
| Usability — appropriateness recognizability | Mode, no-data/stale states, selected vehicle and source labels explain what the screen represents. | Observe whether actual users understand those distinctions without coaching. |
| Usability — learnability | Searchable FAQ, registration guidance and an accessible user-manual popup with downloadable PDF are available. | First-use task completion and time-to-learn with TODA participants. |
| Usability — operability | Mobile/laptop navigation, settings, location controls and keyboard-operated manual/confirmation dialogs have browser checks. | Real phones, touch conditions, browser differences and users' operational feedback. |
| Usability — user error protection | Input validation, permission checks, typed deletion confirmation, pending deletion, request states and storage-failure messages are tested. | Observe correction of mistakes and understanding of queued versus server-received versus acknowledged requests. |
| Usability — interface aesthetics | Shared fonts, card surface, responsive layouts and consistent blue/yellow backgrounds are implemented. | Aesthetic acceptability is a respondent judgment; screenshots do not prove it. |
| Usability — accessibility | Labels, focus return/trapping, keyboard controls, responsive widths and empty/error states have targeted checks. | Screen-reader, text magnification, real-device contrast and assistive-technology evaluation remain required. No blanket WCAG conformance claim is made. |
| Reliability — maturity | Repeatable API/domain tests cover normal and erroneous workflows. | Sustained operation on the final integrated hardware and deployment. |
| Reliability — availability | Database-aware health checks report failures and recovery; UI exposes connection/data uncertainty. | Measured uptime, hosting/restart behavior, watchdog/power evidence and provider availability over the study period. |
| Reliability — fault tolerance | Tests exercise malformed frames, missing/stale data, retry paths, corrupt browser storage and bounded request errors. | Combined sensor/network failure, queue pressure and reset-safe alarm behavior on hardware. |
| Reliability — recoverability | Stored incident identity/acknowledgment, replay/deduplication and account state transitions have isolated-store tests; queued help uses request IDs. | Production backup restore, real power-loss/NVS recovery and lost-acknowledgment tests. The firmware's bounded storage must not be described as loss-free. |
| Performance — time behaviour | Reproducible local browser measurements collect startup, login and navigation timings under normal and simulated slower conditions. | Agreed project thresholds and repeated measurements on the target phones, actual LTE/Wi-Fi and final hosted system. Local values are not field-network measurements. |
| Performance — resource utilization | Local assets, bounded history queries and resource-transfer measurements provide partial software evidence. | Target-device CPU/RAM/flash, battery/energy use, radio usage and sustained backend resource measurements. |
| Performance — capacity | Pagination, bounded history/export windows, rate limits and firmware queue limits are implemented. | A declared concurrent-user/device target and sustained ingest/load tests at that target. A unit-test count does not establish deployment capacity. |
| Security — confidentiality | Account/role/TODA/vehicle scoping, private photo endpoints, API no-store behavior and simulated hosted table permissions are tested. | Hosted permission review, least-privilege credentials, device/disk security and confirmed data-controller/privacy contact details. |
| Security — integrity | Schema validation, authenticated device tokens, atomic persistence, duplicate/conflict rules and permission boundaries have fixture tests. | Actual device provisioning/rotation, hostile-input review of the deployed boundary, and operational backup/restore integrity. |
| Security — non-repudiation | Saved event identities and first-handler records support investigation. | Ordinary database audit logs are not independently proven tamper-evident or cryptographically non-repudiable. Define and validate the study's evidentiary requirements. |
| Security — accountability | User actions, incident handlers, request states and exports retain scoped identities/times. | Review real audit completeness, time synchronization, retention and authorized administrator access. |
| Security — authenticity | Salted password hashing, private server sessions, production secure cookies, role approval and device authentication are implemented and tested. | Real HTTPS/provider configuration, identity verification and physical-device credential handling remain deployment checks. |
| Maintainability — modularity | Shared telemetry contracts, readiness helper, migration registry and queue parser reduce duplication. | Expert review of coupling; `src/main.tsx` and `server/app.ts` remain large and merit gradual extraction, not a disruptive rewrite during evaluation. |
| Maintainability — reusability | Shared components/contracts and both database fixtures support reuse. | Expert demonstration that a component or rule can be reused without copying hidden dependencies. |
| Maintainability — analysability | Controlled errors, logs, replay identity, evidence files and reproducible tests assist diagnosis. | Observed diagnosis of an injected fault and a deployment monitoring/log-access review. |
| Maintainability — modifiability | Pinned patched dependencies, lockfile, common card token and migration registry support controlled change. | A representative maintenance change with before/after regression evidence and rollback. |
| Maintainability — testability | Unit/API, embedded PostgreSQL, role-permission and isolated browser fixtures provide repeatable checks. | Recreate the firmware compiler environment and complete physical, hosted-provider and human-evaluation protocols. |

## Outstanding gates before a defensible overall acceptance claim

- **Human evaluation:** collect actual, independently completed IT-expert and TODA worksheets. Keep the cohorts separate. Do not manufacture scores, respondent counts or an acceptability label.
- **Physical IoT acceptance:** the inspected continuation notes record unresolved ADS single-ended accuracy and unaccepted ACS/GPS/LTE/PZEM/full combined tests. These are historical notes, not new measurements. Follow the current bench acceptance guide and retain instrument/reference, device/build identity, tester, date and genuine outcomes.
- **Firmware reproduction:** the current compile attempts could not start because `.tools/cpe-python` is absent. This is a missing toolchain, not a compiler-diagnosed source failure. Earlier documented compile passes remain historical; no fresh firmware compile PASS is claimed.
- **End-to-end response:** measure real event-to-server/UI latency, legitimate false/missed alarm outcomes, safe physical alarm cutoff, connection failure/recovery and power interruption. Software cannot supply these measurements.
- **External services:** local tests disable paid SMS/cloud and use mocks where applicable. Real provider acceptance, actual delivery/receipt and operator acknowledgment are distinct facts. Browser push is not currently configured.
- **Location/energy scope:** choose and deploy an address provider if exact street addresses are required. Commission wind and validate solar/controller/battery measurements before treating illustrated channels as operational data.
- **Privacy/deployment:** operator/controller identity, privacy contact, effective policy date, appropriate retention/backup expiry, HTTPS, hosting/provider settings and a restore exercise need actual operational decisions/evidence. Draft policy content was not silently finalized by this audit.
- **Capacity and field performance:** specify intended fleet/user load and measure it. Adopt targets from the research requirements before classifying measured timings as acceptable.

## Reproduce the software checks

Use Node 24 at the current application root. All fixture checks must use disposable stores with cloud/paid services disabled.

```powershell
npm.cmd ci
npm.cmd run quality:check
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run quality:browser
npm.cmd run test:performance

# Additional PostgreSQL-backed fixtures; no hosted database credentials required.
$env:SOLAIR_TEST_POSTGRES='1'
$env:DATABASE_URL=''
npx.cmd tsx --test --test-concurrency=2 tests/*.test.ts
Remove-Item Env:SOLAIR_TEST_POSTGRES
```

`quality:check` is a local engineering gate, not an ISO certification command. Do not enable paid providers or upload firmware just to make a test pass. The existing firmware wrapper's compile targets require its pinned toolchain; omit Upload/Monitor for software-only verification.

Final observed results are recorded in [the software evidence summary](iso25010-evidence/2026-10-26-software-results.json). Read [the SOP3 evaluator worksheet](ISO25010_SOP3_EVALUATION.md) for task observations and honest scoring.


## Observed software results — this audit

| Check | Observed result | Scope |
|---|---|---|
| Lint / TypeScript / production build | PASS | Current patched software; no hardware execution |
| Default SQLite-mode suite | 140 passed, 0 failed, 0 skipped | Disposable unit/API stores |
| PostgreSQL-mode suite | 140 passed, 0 failed, 0 skipped | Embedded PostgreSQL for supported suites; not hosted-provider commissioning |
| Browser workflow suites | 11 passed | Driver, operator, admin, engineer; responsive/keyboard/error/recovery cases; fixture data |
| Full npm dependency audit | 0 known reported vulnerabilities | Installed production and development dependency tree at audit date |
| Synthetic firmware protocol checks | PASS (2 reported groups) | Decoder/range/readback fixtures only; no serial port or physical action |
| Fresh integrated/all-input firmware compile | NOT COMPLETED — setup blocked | Pinned PlatformIO Python environment absent; no source-compile verdict |
| IT-expert/TODA acceptability rating | NOT DETERMINED | Actual completed participant data not supplied |

| Local performance condition | Sign-in ready | Login | Settings navigation |
|---|---:|---:|---:|
| Unthrottled localhost | 479 ms | 247 ms | 61 ms |
| Simulated 1.6Mbps download, 150ms latency, 4x CPU slowdown | 3647 ms | 1012 ms | 97 ms |

One cold-load sample per condition, desktop Chromium emulating a phone. Service workers were blocked for this timing measurement; no ISO or study pass threshold was invented. Resource entries and one-time JS heap samples are in the JSON evidence. Public offline essentials total 3,605,674 bytes (about 3.44 MiB), plus compiled static bundles; first installation requires successful online caching and its bandwidth/time cost is not included in the cold-load timings. API/private data and third-party map tiles are not precached.

The operator smoke check verified request acknowledgment/resolution and denial of organization administration. The admin could open People. Seven engineer/CPE observations used authenticated TEST FIXTURE telemetry and downloads, not real sensors or a serial connection.

## References

- [ISO/IEC 25010:2011 — official record and model scope](https://www.iso.org/standard/35733.html)
- [ISO/IEC 25010:2011 — official terminology/model preview](https://www.iso.org/obp/ui/?_escaped_fragment_=iso%3Astd%3Aiso-iec%3A25010%3Aed-1%3Av1%3Aen)
- [Next.js advisory recorded by the dependency audit](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
- [Rate-limit advisory](https://github.com/advisories/GHSA-46wh-pxpv-q5gq)
- [Request-parser advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828)
- [Validation-library advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- Existing project evidence: CPE_VALIDATION.md, CLOUD_CONTINUATION.md, OPERATIONAL_ACCEPTANCE.md, COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md.

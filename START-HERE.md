# SolAir transfer checkpoint — 11 October 2026

## Latest instruction override — full centralized CPE integration

The subsequently supplied `SOLAIR_Full_CPE_Firmware_Breadboard_Software_Integration_Prompt.md` supersedes the CPE-only continuation below. The authoritative premium application is now `next-platform/solair-platform`, extended in place. Begin with its `docs/CPE_IMPLEMENTATION_AUDIT.md`, `firmware/README.md`, `docs/CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md`, `docs/COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md` and `docs/CPE_VALIDATION.md`. The older `cpe/figma-app` remains preserved historical reference. The old pending-other-AI draft is not the current implementation guide. Physical sensor/output/UART/charging claims still require actual evidence.

## Resume on your own Codex account

Extract the transfer archive, open the desired project folder in Codex, and paste the continuation prompt below. This transfers source and written context; it does not transfer the original account, a live agent session, installed tools, credentials or running services. No chat import/automatic memory transfer is assumed.

## Two different projects — do not merge them accidentally

- **Current CPE work:** `cpe/figma-app`, with sibling `cpe/firmware` standalone diagnostics. Original paths: `C:\Users\Anyang\SolAir\figma-app` and `C:\Users\Anyang\SolAir\firmware`.
- **Earlier separate full-platform implementation:** `next-platform/solair-platform`. Original path: `C:\Users\Anyang\Videos\SolAir\solair-platform`; local checkpoint commit9051544. Next.js/Railway/Supabase development project, not the current Vite CPE application's implementation. Its approved white BEMAC asset and own README/RESUME/VERIFICATION/deployment docs are included independently.

The latest user request concerned the CURRENT CPE project. Preserve all existing modifications in the copied source; no source reset or repository replacement.

## Current CPE facts

Vite/React frontend5173, Node operator API loopback3001, token-bound real ingress on actual private PC IP:3002/ingest. SQLite; existing operator authentication and ET-01 assignment, not four authorization roles. Integrated firmware: `cpe/figma-app/firmware/anti-tamper`, profile anti_tamper. Sibling serial-test/MPU6050 diagnostic sketches have no network/dashboard integration.

Integrated pins: MPU SDA21/SCL22/address0x68, lid25, mount26, output27 active HIGH. Default wiring/siren/motion flags remain0; startup DISARMED. Real commands are local USB serial ARM/DISARM at115200 with newline. Dashboard security controls are demos. HW-548/siren wiring and reset-safe interface are conditional, not approved. Current energy/GPS/LTE/forecasting/PWA/fleet functionality is incomplete in this CPE codebase.

Review performed without changing behavior, firmware, wiring, credentials or working schemas/data. Nine focused Node checks passed; launcher first timed out during shutdown and passed on rerun. Portable firmware helper and provisioning tests passed. Frontend production build passed with existing large-chunk warning. Five firmware configurations compiled: integrated default/indicator/all-feature, standalone serial/MPU. Thirteen isolated browser observations passed, using generated test credentials and temporary TEST FIXTURE databases. No upload, powered output or physical test was performed.

## User preferences and next action

The user has beginner coding/hardware knowledge and wants SHORT, concrete breadboard steps: wire → configure/upload → run SolAir → perform each physical test → observe dashboard/database → save evidence → classify DP1 bench-ready/partially-ready/blocked. They rejected a long general tutorial.

Important: another AI holds NEW CPE decisions. We have not received that AI's reply. FIRST obtain/reconcile it using `cpe/figma-app/docs/cpe-changes-ai-handoff.md`. Then inspect current files and prepare a simplified checklist. Do not infer that changes recalled by that AI are already implemented. Do not automatically implement proposals from the review.

Read these in the current project:

1. AGENTS.md and README.md (latest overrides supersede historical milestone claims).
2. docs/cpe-changes-ai-handoff.md — message for the other AI.
3. docs/cpe-lab-review-guide.md — detailed actual-code review, safety gates, tests and limitations.
4. docs/staged-bench-integration.md, hardware-demo.md, software-hardening.md.
5. docs/local-authentication.md, device-diagnostics.md, telemetry-contract.md, telemetry-field-mapping.md and telemetry-firmware-handoff.md.

## Setup on the new device

For current software, use Node24+ and run `npm.cmd ci` in cpe/figma-app on Windows. Existing dependencies must be installed locally; node_modules is excluded. Read README for simulated startup. Hardware mode requires separate private provisioning and operator account creation on the NEW computer; no passwords/tokens or working account database are transferred. Do not guess credentials or a COM port. Never reset the original accounts.

Arduino CLI1.4.1/pinned ESP32 core2.0.17 are not bundled. Both firmware locations contain paths specific to Anyang's PC in build scripts/arduino-cli.yaml. Have the receiving Codex inspect the new OS/tool paths and adapt local toolchain configuration deliberately before building. Preserve the cpe/figma-app + sibling cpe/firmware directory relationship. Compilation is not upload. Never reuse the old PC LAN IP for the new PC.

Credentials, working data/, SQLite/WAL/SHM, .env, secrets.h, .git, build outputs, flash binaries, caches and installed dependencies are intentionally excluded. Historical real records/account sessions therefore do not move with this archive. If research records must move, arrange a separate private, owner-approved database backup with writers stopped; this handoff has not copied them.

Review-evidence files are SOFTWARE/TEST FIXTURE evidence only, never actual sensor measurements. Some machine-specific evidence links in old docs need the new extracted path; source-relative links remain useful.

## Paste this into the groupmate's Codex

> Continue the CURRENT SolAir CPE project in cpe/figma-app. Read START-HERE.md at the archive root, AGENTS.md, README.md and docs/cpe-changes-ai-handoff.md. Preserve existing source modifications. The other AI's latest CPE changes are still pending: help us obtain its answer, reconcile it with actual code, and prepare a short beginner-friendly wire → upload → start software → physical test checklist with DP1 bench-ready/partially-ready criteria. Do not confuse sibling diagnostics with integrated anti-tamper firmware or the separate next-platform project. Do not implement proposed fixes, upload firmware, activate outputs, change credentials/schemas or deploy without authorization. Test only with temporary databases and TEST FIXTURE provenance. First confirm the actual project/tool paths on this device and summarize the next concrete step concisely.

For the earlier Next.js project instead, open next-platform/solair-platform and read its docs/RESUME.md before acting. Railway/Supabase accounts are not configured; all secrets must be environment variables. Hosted/hardware connectivity is unverified. Do not carry its completed-feature claims into the current CPE app.

## Optional conversation context

A chat share link, if you choose to create/send one, is additional reference, not a replacement for source/checkpoint. It may expose conversation content to its recipients. Do not copy the original Codex login/auth files or share the account password. Use the groupmate's own account. Keep future updates in a private shared Git repository after checking secrets, or send dated source bundles and updated checkpoints.

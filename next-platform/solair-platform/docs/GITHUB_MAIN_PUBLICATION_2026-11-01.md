# GitHub main source checkpoint · 1 November 2026

This checkpoint contains the combined updated frontend, current authentication/scoped backend, SOC/TTE and SOP 4 evidence APIs, quality-gated telemetry/GPS, additive database migrations and current public CPE/Arduino source. The authoritative application remains `next-platform/solair-platform`; historical `cpe/` and approved artwork are preserved.

Validation on the isolated publication copy using Node24.22.0: TypeScript passed, **247/247 automated tests passed**, and the production build passed. The source credential scan had no secret findings after four exact code/prose false positives were manually inspected. The GPS rendering fixture now supplies a valid legacy frame, and the previously missing browser-check scripts are included. PDF bytes and third-party font license text are preserved unchanged.

The publication excludes private firmware configurations, `.env` credentials, device tokens, working databases, raw device captures, generated guide/workbench archives, build/tool/dependency caches and account/session metadata. These remain local. A new clone needs its own private configuration and device provisioning; the group's working records are not demo seed data supplied by Git.

The local dirty working branch is preserved. Publication uses a separate checkout based on the existing GitHub `main` and an ordinary fast-forward push; it does not replace another branch's history. Earlier frontend-only branches remain available as historical references.

Calibration and physical acceptance are separate from this source publication. Canonical ACS current remains invalid without accepted calibration. SOC/TTE requires an explicit battery reference and valid continuous signed current; it is an engineering estimate. Opt-in LTE command delivery/device reports do not prove physical siren output, hardware safety or a successful combined bench trial. The latest limitations and observations remain in `CPE_VALIDATION.md` and `CLOUD_CONTINUATION.md`.

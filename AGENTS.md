# Combined SOLAIR local application

This checkout is the active application serving localhost:3000. Its application root is this directory, not a nested next-platform folder. Run `npm.cmd run start:combined` after building. Port 3001 redirects to 3000.

Work on `feature/daily-workflows-readiness` for the approved daily workflow additions. It was created from the existing uncommitted combined checkout; preserve that work. The earlier combined branch is `feature/combined-operational-ui`. The original demo checkpoint is `2d372ac` on `solair-demo-checkpoint-2026-10-18`. Reviewed code was transferred from the separate operational checkout; unrelated Git histories were not merged. Do not commit, push or merge without user approval.

Read `docs/PORT3000_INTEGRATION.md`, `docs/OPERATIONAL_SETUP.md` and the CPE validation notes before continuing. The local database and private rollback backups are ignored. Never commit environment files, device tokens, local databases or private firmware configuration. Preserve the approved BEMAC artwork and existing wiring. Physical hardware and actual provider delivery remain unverified by software checks.

The combined launcher explicitly disables paid SMS and cloud services. It is a local demo/presentation environment, not a production deployment. Do not activate hardware, flash firmware, enable paid services or infer physical PASS from compilation or fixture tests.

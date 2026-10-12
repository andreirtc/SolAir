# SOLAIR continuation

The authoritative premium application is `next-platform/solair-platform`. Work there for application/backend/firmware changes. Preserve `cpe/` and the approved BEMAC artwork; the historical CPE application is reference, not the target for new integration. Do not create another website.

Read `next-platform/solair-platform/docs/CLOUD_CONTINUATION.md` first, then the root `SOLAIR_Full_CPE_Firmware_Breadboard_Software_Integration_Prompt.md` and current application guides. Its all-module directive supersedes older CPE-only transfer text in START-HERE.md.

Preserve existing changes, credentials and working records. Check actual paths/tools in each environment. Use Node24 for this app; Windows instructions and local toolchain junctions do not automatically apply in a Linux cloud workspace.

Distinguish implementation/compilation, software fixtures and user-reported physical observations. Never infer physical PASS from compilation, I2C detection, a valid transport frame, or synthetic data. ADS1115 measurement accuracy remains unresolved; see the latest validation entry. Keep unverified electrical interfaces disabled by default. Do not hide the ADS offset by subtracting a guessed constant.

User prefers short, direct test-by-test wiring tables, including resistor legs, supply and Arduino IDE upload steps. Answer live hardware questions plainly. Cloud work can modify/test software; physical wiring, ESP32 uploads and bench acceptance still require the group's connected equipment.

Do not upload ignored configurations, databases, tool caches or account/session files. Use the provided secret-free examples. Record material changes and test results in the current validation/handoff documents without rewriting historical evidence into success.

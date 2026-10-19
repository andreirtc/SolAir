# CPE integration audit — 11 October 2026

Authoritative application: `C:\Users\Admin\Videos\SolAir\next-platform\solair-platform`.
The new root directive supersedes the previous CPE-only continuation. The older `cpe/figma-app` is reference material and is unchanged. The approved white BEMAC image and existing role navigation are retained.

| Area | Existing implementation | Missing at audit | Physical status |
|---|---|---|---|
| Premium Next/Express app | Driver/operator/engineer/admin; shared SQLite/Postgres; Supabase auth/RLS; SOS/messages; SSE | Additional CPE channels | Hosted providers unverified |
| Device ingestion | Hashed device credentials, strict v1, atomic history/events/GPS/energy | v2 PZEM/load mode/ACS ADC1/LTE quality, conflict rejection, CSV | No device ingestion observed on this PC |
| Firmware | MPU, switches, ADS, GPS hardware UART, LTE AT probe, Wi-Fi TLS, retry FIFO | PZEM, third sensor UART solution, calibrated ACS ADC1, timed cutoff/ARM guard, individual tests | Existing default compile is historical evidence only |
| Tamper/siren/power | Local output code | Explicit polarity gate and separate LED19 | New directive reports successful ESP32/MPU/switch/LED/HW-548/12 V siren/buck/2 A fused supply tests; tester/date/captures and exact polarity still absent |
| ADS/ACS/GPS/LTE/PZEM/MAX3485 | Owned/ordered per directive | Concurrent drivers and diagnostics | Not independently measured; exact carrier/shunt interfaces require evidence |
| Wind/traction | Unavailable data model | Controller/approved charging interface | No approved wind controller or traction-bus connection |

This audit is a source inspection, not a physical PASS. See the acceptance guide and validation report for implemented changes and tests actually executed after this audit. No credentials, original database or device flash are reset. Firmware safe defaults intentionally leave unknown electrical interfaces disabled.

# Software validation - October 9 CPE milestone

Current October 10 software-only architecture/validation: [software-hardening.md](software-hardening.md). ESP32 uses token-bound HTTP → validation → SQLite → authenticated SSE; MQTT is future/optional. This document preserves earlier mapping/validation evidence; physical tests remain unperformed.


Final validation completed October 10, 2026. No physical ESP32 tests or board upload were performed. Browser visual checks remain pending. The existing website design was preserved.

| Check | Result |
| --- | --- |
| check-telemetry-simulation.mjs | PASS |
| check-telemetry-contract.mjs | PASS |
| check-telemetry-backend.mjs | PASS |
| check-telemetry-storage.mjs | PASS; injected write-failure message expected |
| check-auth.mjs | PASS; real login with temporary databases |
| check-diagnostics.mjs | PASS |
| check-hardware-integration.mjs | PASS; software fixtures only, temporary device/auth/telemetry databases |
| check-dev-local.mjs | PASS; sandbox-blocked Vite read resolved by approved unrestricted rerun |
| npm.cmd run build | PASS; existing large-chunk advisory remains |
| ESP32 final safe-default compile | PASS; 780821/1310720 program bytes, 46228/327680 global RAM bytes |
| ESP32 final all-features compile | PASS; 794757/1310720 program bytes, 46280/327680 global RAM bytes |
| Private provisioning script | PowerShell parser PASS; no real credentials entered or provisioning run |

Firmware: Arduino CLI 1.4.1, esp32:esp32 2.0.17, ESP32 Dev Module 4 MB/default partition/115200 upload; bundled Wire, WiFi, HTTPClient. Final source includes the independent esp_timer siren cutoff. Fully enabled compile is under build/software-check-only and must not be uploaded as a physical-wiring-approved fixture.

Integration checks verify token/origin rejection, strict v2 validation, null/zero, exact retry without receipt refresh, transactional record/state rollback, operator/device authorization, SSE real-mode snapshot, durable events and ordering after restart, and new-boot IMU clearing. They do not verify physical Wi-Fi, sensor accuracy, detector thresholds, switch polarity, siren current, timing, or offline hardware operation.

Follow [hardware-demo.md](hardware-demo.md) for wiring, private provisioning, normal compile/upload and the pending physical checklist. Current safe defaults remain wiring/siren/motion disabled and DISARMED startup. No working databases or existing credentials were used for automated checks; no new third-party dependencies were installed.

# DP1 breadboard → SolAir checklist

11 October 2026 · **DRAFT: latest hardware changes not yet received or reconciled.**

Send [the hardware handoff](cpe-changes-ai-handoff.md) to the AI holding the latest decisions and return its completed table or exact changed files. Do not treat this baseline as approval to wire, upload or activate outputs. This checklist records future team actions; none were performed here.

## This computer: setup gates

- Project: `C:\Users\Admin\Videos\SolAir\cpe\figma-app`. Sibling diagnostics: `..\firmware`; separate Next.js project: `..\..\next-platform`.
- Node 24.15.0 / npm 11.12.1 available; `node_modules` absent. After reconciliation, install locked dependencies with `npm.cmd ci` from the project folder.
- Arduino CLI is not on PATH. The user Arduino directory contains ESP32 core 3.3.12; integrated `sketch.yaml` pins **2.0.17**. CLI 1.4.1 and the pinned project toolchain still need locating/configuring.
- **Missing from transfer:** integrated `firmware\build.ps1` and `firmware\arduino-cli.yaml`. Recover the reviewed originals before using the documented build/upload procedure. Sibling build scripts target different sketches and retain Anyang's paths; they are not substitutes.
- All 232 transferred manifest files matched SHA-256 on this device. The two missing integrated helper files are absent from the manifest too. No source/configuration was replaced.
- Private operator/network provisioning must be checked locally. Never paste credentials or tokens into a chat. Determine this PC's actual private IPv4 and the actual ESP32 COM port; neither is supplied by the transfer.

## Reconciliation record

| Item | Source baseline | Latest other-AI decision |
| --- | --- | --- |
| Minimum bench | ESP32 + MPU6050 + two dry-contact switches + LED/330 Ω + USB/breadboard/jumpers | Awaiting reply |
| MPU | SDA21, SCL22, AD0 GND/address 0x68; supply/logic/pull-ups must be verified 3.3 V compatible | Awaiting reply |
| Switches | COM→GND; lid NO→25; mount NO→26; NC unused; temporary pressed=secure convention | Awaiting reply |
| Output | GPIO27 HIGH=ON; LED first; exact HW-548/siren circuit unapproved | Awaiting reply |
| Firmware | `firmware/anti-tamper/anti-tamper.ino`, profile `anti_tamper`; safe defaults 0/0/0 | Awaiting reply; build helper absent |
| Controls/path | USB ARM/DISARM; Wi-Fi HTTP→SQLite→authenticated dashboard; dashboard buttons are demos | Awaiting reply |
| Added modules / DP1 minimum | ADC/current/GPS/LTE/energy/forecasting not integrated; siren required by existing CPE goal | Awaiting reply |

Reconcile each returned decision against actual files. Mark it **implemented**, **planned**, **reported physical test without evidence**, or **physical test with evidence**. Request exact patches/settings for claimed implementation and tester/date/setup/result/evidence for physical claims. Resolve conflicting pins, polarity, build flags and DP1 scope before finalizing this guide.

## Short team procedure — after the gates above are resolved

1. **Preserve.** Retain the current ESP32 sketch and project files. Stop owned SolAir services with Ctrl+C; privately back up any existing databases and WAL/SHM companions while all writers are stopped.
2. **Wire inputs and LED with power disconnected.** Have the hardware lead approve the exact board/module supply and printed GPIO labels. Use the baseline MPU/switch map above only if confirmed by reconciliation. LED: GPIO27→330 Ω→anode; cathode→GND. Keep HW-548, siren and 12 V disconnected. Hold both switches pressed for the temporary secure state.
3. **Configure privately.** From this project run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\provision-hardware.ps1`; use reachable private 2.4 GHz Wi-Fi and this PC's actual LAN IPv4. Create an ET-01 operator with `npm.cmd run operator:create` only if needed; enter passwords privately.
4. **Compile, then upload separately.** After restoring/adapting the integrated build helper and verifying the pinned toolchain, use its `-BenchIndicator` configuration: wiring=1, output=1, motion=0; output directory `firmware/build/bench-indicator`. Follow the verified-port upload procedure in [hardware-demo.md](hardware-demo.md#4-compile-and-upload-the-correct-firmware), selecting that directory and the actual COM port. Do not execute the currently broken build command or guess upload settings. Never upload `software-check-only` for this test. Keep source defaults at 0/0/0.
5. **Start real software.** Terminal A, project folder: set `$env:SOLAIR_DEVICE_HOST = '<actual-private-IPv4>'`, then `node backend/hardware-server.mjs`. Terminal B: `npm.cmd run dev:frontend -- --host 127.0.0.1 --port 5173 --strictPort`. Sign in at `http://127.0.0.1:5173/dashboard`. Do not run simulation `dev:local` concurrently. Receiver ingress is PC-LAN-IP:3002/ingest; operator API is loopback:3001.
6. **Test and record.** Use the table below. USB Serial Monitor: 115200 baud, newline, uppercase `ARM` / `DISARM`. Wait at least 10 seconds after boot and secure both switches before ARM. Dashboard controls do not command the ESP32.
7. **Save evidence and verdict.** Use [the physical evidence template](et01-physical-evidence-template.md). Save tester/date, exact wiring/build/settings, serial capture, video of output timing, dashboard screenshots and separate real-v2 export with matching boot/event sequence/receipt identity. Keep TEST FIXTURE exports separate; record failures too. UI real-v2 export is limited to the first 1,000 records; use documented API pagination if needed.

| Physical action | Required observation / pass condition |
| --- | --- |
| Power on | DISARMED; LED OFF; accepted heartbeat/sensor reports; fresh ET-01 receipts and boot identity; changing valid MPU vectors; both secure contacts correct |
| Release a switch while DISARMED | Its displayed state changes; no armed tamper trigger |
| Secure both, wait ≥10 s, ARM, release lid >50 ms | Local LID_OPEN_DETECTED; LED ON then measured OFF around requested five seconds; matching persisted dashboard event; TRIGGERED remains latched |
| DISARM, secure both, ARM, release mount | Local MOUNT_DETACH_DETECTED and matching persisted dashboard event; repeat LED timing observation |
| DISARM during indication | LED OFF and latch cleared |
| Disconnect Wi-Fi, ARM/trigger locally, reconnect | Local indication works offline; original event boot/sequence/uptime arrives later without creating a new event identity |
| Restart backend, reload browser | Stored event identity/count/original receipt retained; restored data is not falsely fresh |
| Controlled ESP32 reset / queued-event recovery | Startup DISARMED and new boot; successfully buffered events retain original identities; historical events do not make the device appear live. Bounded buffering is not guaranteed loss-free storage |

**Siren is a separate gated stage.** Hardware lead must identify the exact HW-548 and siren; approve signal voltage/current/polarity, reset/disconnected OFF behavior, supply, measured steady/inrush current, fuse/wiring and suppression. Test a protected suitable load before the actual siren. Then repeat trigger, cutoff, DISARM, reset and offline observations with the approved siren circuit. Do not use the proposed six-terminal map as approved wiring. A serial `siren=ON` log or successful LED test does not establish siren operation. Software timeout is not a verified hard cutoff.

## Evidence and readiness

- **Historical software evidence:** handoff/review report passing Node checks, build, five firmware configurations and 13 isolated browser fixture observations. Launcher initially timed out at shutdown and passed on rerun. Transferred browser evidence is under `../../review-evidence`; it is TEST FIXTURE evidence. No application tests/build/compile were rerun on this PC during this documentation review.
- **Reported hardware only:** earlier USB/serial, changing standalone MPU readings and switch continuity. Original captures/tester/date are not supplied; reconstructed integrated wiring and the end-to-end path remain unverified.
- **DP1 bench-ready:** team agrees the reconciled minimum, and every required physical/evidence test passes. Existing CPE goal includes the approved actual siren plus dashboard event; LED alone does not satisfy that goal. This is bench readiness, not academic approval or completion of the whole SolAir project.
- **Partially ready:** a repeatable evidenced input/LED→receiver→database→dashboard chain passes, but siren or resilience tests remain pending. Name each missing test.
- **Blocked:** unresolved wiring/output compatibility, missing build/provisioning/toolchain, or inability to obtain accepted integrated reports prevents the required test. Current device status: **setup blocked; physical DP1 readiness unverified**, pending the other AI's reply and missing integrated helpers/toolchain setup.

Real energy/SOC, GPS, LTE, forecasting, fleet/PWA and four access roles are outside this implemented baseline. Changing raw IMU readings does not validate motion detection; motion remains disabled. Confirm deferred scope with the team rather than expanding DP1 by assumption.

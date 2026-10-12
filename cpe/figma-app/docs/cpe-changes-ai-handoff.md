# SolAir CPE changes — handoff to our other AI

Prepared 11 October 2026. Send this entire file to the AI that holds our latest CPE decisions. Bring its answer back to our software reviewer before changing code or wiring.

## What we need from you

Help us reconcile your latest SolAir CPE memory with the software that was inspected. We need a short, beginner-friendly breadboard procedure that leads to an observable demonstration in the SolAir software.

Our intended final checklist is:

**Wire → configure → upload the correct sketch → start SolAir → test physical inputs/output → confirm readings and events in the dashboard → save evidence.**

We need clear pass/fail criteria for **DP1 bench-ready**, **partially ready**, or **blocked**. Do not equate a working breadboard demonstration with completion of the entire hybrid-energy/fleet project or academic approval.

This request is for clarification and a handoff. Do not implement changes, upload firmware, activate outputs, reset accounts or invent successful tests.

## Project inspected by the reviewer

| Item | Location |
| --- | --- |
| Current software | `C:\Users\Anyang\SolAir\figma-app` |
| Integrated anti-tamper firmware | `C:\Users\Anyang\SolAir\figma-app\firmware\anti-tamper` |
| Separate serial/MPU diagnostic firmware | `C:\Users\Anyang\SolAir\firmware` |
| Detailed inspection report | `C:\Users\Anyang\SolAir\figma-app\docs\cpe-lab-review-guide.md` |

Do not confuse this software with another SolAir project. The reviewer inspected these files and ran software checks; they did not perform a physical breadboard test.

## Baseline found in the integrated implementation

Please compare your latest decisions against this baseline rather than assuming they are already present in the files.

### Inputs and output

| Item | Current code |
| --- | --- |
| MPU6050 SDA | GPIO21 |
| MPU6050 SCL | GPIO22 |
| MPU6050 address | `0x68`; AD0 decision must match |
| Lid microswitch | GPIO25, internal pull-up; LOW = CLOSED/secure |
| Mount microswitch | GPIO26, internal pull-up; LOW = ATTACHED/secure |
| Output control | GPIO27; firmware assumes HIGH = ON, LOW = OFF |
| Input debounce | 50 milliseconds |
| Startup | DISARMED; ARM requires at least 10 seconds since boot and both contacts secure |
| Local commands | USB serial `ARM` and `DISARM`, uppercase, newline ending, 115200 baud |
| Motion detection | Optional rule-based detector, disabled by default; thresholds are not experimentally validated |

These are GPIO numbers, not physical header positions. Code agreement is not physical wiring approval.

The integrated sketch is `figma-app\firmware\anti-tamper\anti-tamper.ino`. The sibling `serial-test` and `mpu6050-diagnostic` sketches are standalone diagnostics and do not send integrated dashboard messages.

### Builds and safety gates

- Current `config.h` defaults: `SOLAIR_WIRING=0`, `SOLAIR_SIREN=0`, `SOLAIR_MOTION=0`.
- Normal `firmware\build.ps1` output: `firmware\build\upload`; uses the selected configuration.
- `-BenchIndicator` output: `firmware\build\bench-indicator`; enables inputs and GPIO27, disables motion. Intended for the reviewed LED/resistor stage with HW-548 and siren disconnected.
- `-VerifyAllFeatures` output: `firmware\build\software-check-only`; compile coverage only, not the first-test upload.
- Board profile: classic ESP32 Dev Module, 4 MB flash, pinned ESP32 core 2.0.17; Arduino CLI 1.4.1.

The timed GPIO output uses a separate timer and network task, but its requested five-second cutoff is not a physically verified hard deadline. The exact HW-548 input polarity, 3.3 V compatibility, reset-safe OFF behavior, load protection and siren supply still need hardware-lead approval.

### Hardware-to-software path

```text
MPU6050 / microswitches
        ↓
ESP32 integrated anti-tamper firmware
        ↓ private Wi-Fi, authenticated HTTP POST
Actual PC LAN IPv4:3002/ingest
        ↓ device identity + strict v2 validation
Separate real-device SQLite database
        ↓ authenticated SSE updates
Signed-in ET-01 dashboard
```

- Operator API: `127.0.0.1:3001`.
- Frontend: `127.0.0.1:5173`.
- Hardware backend entry: `backend\hardware-server.mjs`.
- The ESP32 must use the PC's actual private LAN address, not `127.0.0.1`.
- Device bearer token is separate from operator login.
- Dashboard displays actual accepted reports in **ET-01 monitoring / Device monitoring**, with persistent event history and separate real-v2 CSV.
- Dashboard Arm/Disarm/Reset controls are demonstrations; they do not command the ESP32.
- MQTT, browser USB serial control and remote ARM/DISARM are not the current integrated transport/control path.
- Do not run the normal simulation backend/`dev:local` concurrently with the hardware backend on port3001.

At review time, the working device token file and firmware secrets header were absent. No private network provisioning was performed by the reviewer. Do not include or request passwords, tokens or Wi-Fi credentials in your answer.

### Data and limitations

- Reports include heartbeat, MPU vectors/faults, switch states, reported security, boot identity, sequence counters and timestamps.
- Important events have bounded flash buffering and RAM fallback; this is not guaranteed loss-free storage.
- Sender UTC is null until valid network clock synchronization. Device uptime and server receipt UTC remain separate.
- Real-device messages and simulated examples use separate paths/storage/provenance.
- ADS1115, ACS758 current sensors, NEO-6M GPS and A7670E LTE are not integrated into this sketch.
- Real battery/solar/wind sensing, SOC, forecasting and GPS are unavailable in this first integrated implementation.
- Current enforced access is assigned-operator authentication, not four separate driver/operator/engineer/admin roles.

Software checks, the frontend build, five firmware configurations and isolated browser fixture checks passed. The launcher initially hit a shutdown timeout and passed on rerun. Compilation and software fixtures do not prove that our physical inputs, siren, Wi-Fi or flash recovery work.

## Please provide the latest changes from your memory

Use this table. If no change was made, say **unchanged**. If a decision is only in memory and not implemented, say **planned, not implemented**.

| Item | Latest decision/change | Implemented, planned or physically tested? | Exact file/settings or proposed wiring | Evidence or remaining gate |
| --- | --- | --- | --- | --- |
| Components included in the DP1 test | | | | |
| ESP32 board/USB interface | | | | |
| MPU6050 wiring/address/orientation | | | | |
| Lid switch wiring/secure position | | | | |
| Mount switch wiring/secure position | | | | |
| GPIO27 output/LED-first stage | | | | |
| Exact HW-548 module/interface | | | | |
| Siren model/supply/fuse/protection | | | | |
| Firmware sketch/build/flags | | | | |
| ARM/DISARM mechanism | | | | |
| Motion rule/calibration decisions | | | | |
| Network/provisioning/startup | | | | |
| Telemetry fields/backend/UI changes | | | | |
| Added ADC/current/GPS/LTE modules | | | | |
| Tests already completed | | | | |
| DP1 minimum demonstration | | | | |
| Features deferred to DP2 | | | | |

## Questions we need answered

1. **What is the exact minimum DP1 breadboard system?** List only components that must be connected now. Separate optional/later modules.
2. **Which pins or electrical assumptions changed?** Include supply/logic, switch COM/NO/NC convention, MPU address and any output polarity changes. Distinguish proposals from approved wiring.
3. **What is the exact output plan?** LED first or actual siren? Identify the HW-548 and siren, ratings, protection and physically verified OFF/ON/reset behavior. If documentation or measurements are missing, name them.
4. **Which firmware belongs to the final demonstration?** Give its exact path, profile/build flags and supported commands. Distinguish standalone diagnostics from the integrated sketch.
5. **What has actually been implemented since the reviewed baseline?** Give filenames/settings or patches if available. Do not call a remembered plan implemented without file evidence.
6. **What changes does the software reviewer need to integrate?** List required firmware, message contract, receiver/storage and dashboard changes separately. Explain dependencies and whether they are necessary for DP1 or can wait.
7. **What physical tests already passed?** Give tester/date, setup, actual result and evidence location. Separate observed hardware results from expected examples and compilation.
8. **What remains to test?** Include actual readings, each switch, armed event with load disconnected, approved output timing, Wi-Fi loss/recovery and event persistence after restart.
9. **What constitutes DP1 bench-ready versus partially ready?** State observable pass conditions and blockers. If hybrid energy/GPS/LTE are outside this minimum test, say that explicitly and identify the resulting research limitation.

## Required answer format

Keep the response practical and concise:

1. Completed change table.
2. Minimum component list for the next breadboard test.
3. Short list of required code/configuration changes, with exact files; **do not execute them**.
4. Physical tests already observed versus still pending.
5. Proposed DP1 bench-ready / partially-ready / blocked criteria.
6. Exact missing information the team must supply.

Do not provide another long general tutorial or propose a replacement architecture unless a specific incompatibility requires it. Do not invent credentials, a COM port, module ratings, implemented features or successful hardware tests.

## What happens after your reply

We will return your answer to the software reviewer. They will reconcile it against current files and prepare one simplified guide:

- What to place on the breadboard.
- The approved terminal-to-GPIO wiring.
- Exact configuration/build/upload and software startup steps.
- Which physical actions to perform and which SolAir readings/events must appear.
- Pass/fail criteria and evidence to save.
- A clear readiness verdict with remaining limitations.

Implementation, upload and output activation remain separate authorized actions. This handoff itself does not approve wiring or complete any physical checklist item.

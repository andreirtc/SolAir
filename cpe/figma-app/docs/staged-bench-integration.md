# Staged ET-01 integration — October 10–11, 2026

This procedure incorporates the team's October 10 clarification. It is a test plan, not an executed hardware report. Existing ESP32 → HTTP receiver → v2 validation → SQLite → authenticated SSE architecture and databases are preserved. No hardware was uploaded or activated by the software agent.

## Reported hardware and observations

The user reports ESP32 programming/USB/Serial Monitor, MPU6050 detection/changing readings and both KW11-3Z COM/NO continuity already physically checked. The breadboard was dismantled; integrated wiring must be reconstructed and rechecked. Final switch mounting, HW-548/siren, GPS/LTE/ADS1115/ACS758 and integrated anti-tamper behavior remain unverified.

Seller claims for the six-terminal HW-548: signal 3–20 V, about 5 mA; load 5–36 V DC; rated 5 A; advertised maximum 20 A with cooling above 5 A; advertised isolation/digital triggering/PWM; 46 × 25 × 18 mm; IRF5305S marking. These are **supplier claims supplied by the user**, not independently measured ratings or an approved schematic. Do not use the 20 A advertisement as a validated operating rating. The [Infineon transistor page](https://www.infineon.com/part/IRF5305S) does not document the complete HW-548 module interface.

## October 10 — inputs, LED and real dashboard

1. Stop services and preserve source/closed databases using the [handoff](et01-cpe-handoff.md). Start with all power disconnected. Disconnect HW-548 signal/load supply and the actual siren entirely.
2. Reconstruct MPU SDA GPIO21, SCL GPIO22, AD0 GND (0x68), GND common; verify the module's 3.3 V supply and logic/pull-ups. No buck converter or 12 V connection is needed for this USB-powered input/LED stage.
3. Switch 1 COM → ESP32 GND, NO → GPIO25. Switch 2 COM → ESP32 GND, NO → GPIO26. NC unused. Both use INPUT_PULLUP. **Pressed=LOW=CLOSED/ATTACHED**, **released=HIGH=OPEN/DETACHED** is the temporary breadboard convention only. Both levers must be held pressed before ARM; final enclosure/mount mechanics are not validated.
4. LED path: GPIO27 → 330 Ω series resistor → LED anode, LED cathode → ESP32 GND. Verify polarity and keep HW-548/12 V/siren disconnected. No firmware readback confirms LED current or light; observe it physically.
5. Provision privately and start receiver/frontend exactly as in [Windows instructions](et01-cpe-handoff.md#windows-team-procedure). Bind receiver to the laptop's actual LAN address, port3002; ET-01 operator/API remain loopback. Confirm Wi-Fi is 2.4 GHz without client isolation.
6. After the team checks the reconstructed inputs and LED-only load, compile:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\firmware\build.ps1 -BenchIndicator
   ```

   This opt-in build overrides wiring=1, GPIO output=1, motion=0 without editing safe defaults. Output is **firmware/build/bench-indicator**. Compile does not upload. Never upload `software-check-only` for this stage: motion and siren flags are enabled there solely for compile coverage.
7. Use the [existing verified-port upload command](hardware-demo.md#4-compile-and-upload-the-correct-firmware), replacing only `--input-dir .\firmware\build\upload` with `--input-dir .\firmware\build\bench-indicator`. Physically verify the correct COM port and close other monitors. Upload overwrites the current ESP32 application; retain its source first.
8. Observe LED OFF and DISARMED at startup; capture BOOT_HEARTBEAT/SENSOR HTTP202. On the dashboard, source is REAL DEVICE in receiver mode; expect accepted receipts, active boot UUID and real changing IMU vectors. No accepted receipt means NEVER CONNECTED even when browser SSE is connected.
9. With both levers pressed, wait ≥10 seconds after boot, send USB serial `ARM` with newline. Release lid >50 ms: observe LED ON then OFF after five seconds, local LID_OPEN_DETECTED and matching durable dashboard event. `TRIGGERED` stays latched after LED OFF. Send `DISARM`, press both levers, ARM and release mount; observe MOUNT_DETACH_DETECTED. Disarm during output must turn LED OFF. Disarmed releases must not trigger.
10. Record disconnect/reconnect and backend-restart checks from the handoff. Offline triggering should remain local; after reconnect the original event boot/sequence/uptime must match its later server receipt. Observe rather than infer local timing. Save actual serial/video/screenshots/real-v2 CSV; mark test failures and missing observations honestly using the [evidence template](et01-physical-evidence-template.md).

The LED validates only the GPIO indication path. It does **not** prove the HW-548 can switch the siren. Existing serial `siren=ON` means the firmware commanded GPIO27 HIGH; in this stage that is an LED command, not observed siren operation. Motion stays disabled; an IMU change is a sensor measurement, not a motion-trigger demonstration.

## October 11 — protected HW-548 verification

The user has a 12 V/5 A adapter, HCW-P715 buck converter, inline blade fuse holders and 1/2/3 A fuses. Fuse holders become available October 11. Supply rating alone does not determine the correct fuse. Select protection after checking actual siren steady/inrush current and ratings of the wiring, holder, connectors and module; do not invent a fuse value from the available choices. Leave the buck converter out of this demonstration unless separately measured/approved for a specific load.

Proposed terminal map, **pending physical confirmation**:

| Connection | Team-proposed wiring |
| --- | --- |
| Signal Input + | GPIO27 |
| Signal Input − | ESP32 GND |
| DC+ | Fused 12 V positive |
| DC− | 12 V negative |
| OUT+ | Siren red (+) |
| OUT− | Siren black (−) |

The seller's input range includes 3.3 V nominal; it does not establish reliable triggering, real input current, polarity, reset-safe OFF, or isolation. No direct connection is approved solely by these claims. Have the hardware lead verify the exact board's signal-side voltage/current, isolation and whether any additional interface/biasing is needed. Do not assume Signal Input − must be bridged to DC− because the supplier advertises isolation. Keep 12 V away from ESP32 GPIO/3V3.

1. With actual siren disconnected, use a suitably rated test load/meter and protected supply. Verify LOW=OFF and HIGH=ON at actual 3.3 V, measure input/load behavior, and establish OFF with signal disconnected, ESP32 reset/boot and USB disconnection. Current firmware assumes active HIGH; inversion requires reviewed changes before load connection.
2. Check steady load, supply polarity, fuse, cable/module heating and suitable suppression for the exact active alarm. Software timeout does not guarantee safety during reset or a stuck driver.
3. Only after the protected switching stage passes, connect the siren under the hardware lead's supervision. Reuse the timed local ARM/DISARM path with motion disabled; record startup OFF, trigger response, cutoff and offline behavior. The bench-indicator binary becomes a physical output driver if attached to the HW-548, so do not connect it before these gates pass.
4. The immediate CPE goal is complete only after the team records one physical switch event → ESP32 → actual local siren → Wi-Fi receiver → SQLite → dashboard event, plus safe output behavior. Until then it remains pending.

## Software presentation and limits

The navy/teal ET-01 overview shows source, device connection independent of browser SSE, reported security, switch freshness, IMU report status, live receipt/session/count and latest received event. Historical events cannot mark a device online or overwrite active-boot security with old-boot state. Detailed vectors/faults/history/export remain in the expandable Device monitoring panel. Default simulation and fixed example screens remain explicitly separate. No driver messaging/SOS, cloud synchronization, public location endpoint or remote hardware commands are added.

Fresh software validation: all nine existing Node checks PASS; provisioning and portable firmware checks PASS; new `check-device-monitor.mjs` PASS; mutually exclusive build-option guard PASS; production build PASS (existing bundle-size warning). All test storage is temporary. Safe-default compile PASS (793,909 program bytes / 46,712 global RAM), bench-indicator compile PASS (807,353 / 46,760), all-feature compile PASS (807,817 / 46,780). No binary was uploaded. `config.h` safe defaults remain zero.

The launcher/build used approved execution outside the sandbox because Vite requires parent-directory access. Browser inventory was rechecked and still contains no available browser; responsive visual/interaction testing remains pending. Passing these checks is not genuine hardware evidence. Pre-change source snapshot: `data/source-backups/pre-staged-bench-20261010-183342`; working data/credentials were excluded and untouched.

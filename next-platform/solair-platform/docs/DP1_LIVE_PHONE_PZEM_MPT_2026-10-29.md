# SOLAIR · complete remaining live steps

Lid-only update: local final sketch solair_cpe.ino requires upload. ENABLE_MOUNT_SWITCH=false is retained in private configuration. After upload mount is excluded from arming/triggers and reported null. Startup prints lid=enabled mount=disabled; firmware tag ends /lid-only. Disconnect browser serial and remove competing external5V before USB upload. No physical upload performed here.

1. Open the updated app. Refresh the laptop app once, reconnect ESP32 in CPE Lab, then open the phone link and sign in. Select REAL HARDWARE and ET-01 / SOL-ET-01 on both browsers. The laptop needs internet and must stay awake.

2. Check the supply rails before the remaining tests. With the working battery feed and no USB, use DC voltage mode: big-buck OUT+ to OUT− should remain near the previously set 12.02 V; HCW OUT+ to OUT− should be near 5 V; perfboard 3V3 to GND should be near 3.3 V. Avoid bridging adjacent terminals. Stop for a renewed spark, burnt smell, abnormal heating, reversed polarity or a collapsing supply. All terminal work requires power isolated.

3. Use one ESP32 supply for the USB checks. Isolate battery power, remove the HCW OUT+→ESP32 5V jumper, then connect USB. Keep the required common logic ground. Open CPE Lab, select the ESP32 serial port and confirm fresh reports. For the actual siren test, restore its accepted 12 V branch while that positive HCW-to-ESP32 jumper stays removed. If currently operating without USB, leave it that way until a USB command is needed.

4. Test the lid switch and actual siren (mount disabled after upload). In CPE Lab, click Disarm bench or Clear test latch. Upload the prepared lid-only sketch before using this procedure. Hold/release the lid switch and confirm its lid value changes; mount should show Disabled with blank raw value. Do not bypass the lid input. Click Test Siren (5s): listen for the physical siren, then clear the test latch. Hold the lid switch in its secure position; click Arm bench and confirm ARMED. Release the lid switch: confirm TRIGGERED and the actual siren. Disarm to silence it. The mount switch is excluded from arming and alarm triggers after the lid-only firmware is uploaded. Keep the IMU still during switch tests; record deliberate motion separately. A changing acceleration graph alone does not prove a working motion alarm.

5. Confirm wireless delivery. If the endpoint is not confirmed saved, click Update LTE address and wait for the saved-on-device report. Click Start LTE streaming once if it is stopped. Turn Forward USB readings to server OFF after reconnecting. Look for new LTE server timestamps and sequence numbers on the phone. Address-saved and registration messages alone are not delivery evidence.

6. Check PZEM battery voltage input. Latest diagnostic is no reply / zero received bytes. With the meter in DCV 200, measure PZEM bottom VB+ against the VB− terminal immediately above it. Expect approximately the same voltage as protected battery + to DALY P− (previously 54.4 V). Do not select resistance on an energized circuit.

7. Check PZEM communications power. If its battery input is present, measure the separate communication connector 5V to GND: approximately 5 V. MAX3485 logic VCC remains 3.3 V. With all sources isolated, check A→A, B→B and communication GND→MAX3485 GND. Correct supply with continued no-reply can indicate damage from the earlier spark; do not hide the fault in software.

8. Publish battery voltage only after comparison. When PZEM gives a stable voltage, record it beside a DMM reading from the same bus. After the bus/reference comparison passes, the existing firmware configuration needs PZEM_SOURCE="mppt_output", PZEM_VOLTAGE_VALIDATED=true and PZEM_BATTERY_BUS_VERIFIED=true. Keep ENABLE_ACS=false, ACS_CALIBRATED=false, ACS_NET_BATTERY_VERIFIED=false and PZEM_SOLAR_CURRENT_VALIDATED=false until actual current validation. Preserve credentials and the working project. Close the browser serial connection before an IDE upload. Do not set validation flags just to fill a blank field.

9. Configure MPT with charging disabled. Keep the controller output isolated from the battery through the existing correctly wired LONQ output isolator. Isolate PV before any terminal work. Solar can power the display for settings. If the panel matches the referenced SET/▲/▼/OK manual, short SET advances highlighted settings, arrows edit and OK saves. Keep output OFF during setup.

10. Enter the prototype settings. MPPT mode; PV nominal reference 39.38 V = 2×19.69 Vmp; charge-voltage ceiling 54.6 V for the 13S Li-ion pack; the previously proposed initial current cap is 2.00 A (0.2C of 10 Ah), subject to the pack limit; nameplate capacity 10 Ah; charge timer disabled. Do not copy the manual’s 24 V example or a generic lead-acid preset. The 2 A cap is a commissioning target, not a calibration result.

11. Verify real charging in daylight. Only after the arcing damage/misrouting is resolved, use the installed rated isolators to enable the charging path; do not move live terminal wires. Confirm saved settings before enabling MPT output. Record controller-reported PV voltage, charging-output V/A/W and Ah/time. Compare output voltage with the DMM. Stop solar charging for voltage above 54.6 V, renewed sparking, heat, smell or unstable rails.

12. Interpret the charging result. At 54.4 V the battery is near full, so charging current can be small. Do not raise the ceiling to force current. MPT output V×A is charging-branch power, not PV-input power or net stored battery energy. Voltage comparison and setup are possible now; current calibration needs a suitable independent reference. Comparing two unvalidated displays is a cross-check, not a calibrated-current claim.

13. Prove USB-free operation. Isolate battery power; unplug USB; restore HCW OUT+→ESP32 5V jumper; restore the accepted battery feed. Verify new LTE records after the restart with USB physically absent. If uploads do not resume, auto-resume still needs attention. Do not join USB 5 V and HCW 5 V.

14. Record the evidence. First record a stationary video showing battery power, USB physically absent, fresh LTE timestamps and the observed uptime start/end. Then one phone screen-records the real app while another camera records the secured CPE/power/battery assembly moving outdoors with a fresh GPS fix. Do not carry only the bare perfboard: its battery, regulated supply and modem must remain connected. Keep the alarm disarmed during this walking test. Align both recordings with one spoken/clap cue. The backend laptop stays powered and online. Record MPT daylight charging separately if it is a different test interval.

15. Recover after internet loss. Reconnect laptop internet without stopping the app or either tunnel, then refresh the phone and verify fresh LTE timestamps. If a tunnel process restarted and the hostname changed, replace the phone link or sync the new device endpoint using Update LTE address over USB. Local sensing/FSM can continue; finite buffering does not guarantee every missing reading is recovered.

16. Save evidence and finish the defense material. Save the assembly report, accepted LTE timestamps, GPS movement screen recording, actual siren/FSM clip and daylight charge readings. Use the technology table and wireless diagram below in the PPT. Save local copies of the PPT, videos and guide. Recheck affected wiring and rails after final mounting or transport; carry the system with power isolated. Label ACS current/SOC/TTE and any unfinished charging or motion validation as limitations. Survey findings and modeled energy yields are separate from prototype measurements.

## Technology stack

|Layer|Technology|Purpose|
|---|---|---|
|Web interface|Next.js 16 · React 19 · TypeScript|Responsive phone/laptop web app|
|Backend|Node.js 24 · Express 5|Authentication, ingestion APIs, processing|
|Current database|SQLite|Persistent telemetry, events and evidence|
|Device firmware|Arduino C++ · ESP32 / FreeRTOS|Sensor acquisition and local three-state FSM|
|Device wireless uplink|SIMCom A7670E · UART / PPP · LTE · HTTPS JSON|Device-authenticated telemetry uploads|
|Phone access|Cloudflare HTTPS tunnel|Phone browser accesses laptop-hosted backend|
|Live updates|HTTPS API polling every 5 seconds on phone tunnel; SSE on direct connection|Refresh stored readings without USB forwarding|
|Maps and PWA|Leaflet · OpenStreetMap · web manifest / service worker|GPS display and browser-installable interface|
|Access protection|HTTP-only sessions · roles / TODA scope · device credentials|Protect application and device endpoints|

export const guides: Record<string, string[]> = {
  "ESP32 connectivity": [
    "Connect CP2102 USB to a desktop Chrome/Edge browser. Close other serial monitors.",
    "Open the port at 115200 baud. Check device ID, firmware, uptime and genuine RX frames.",
    "Unplug USB and verify the connection changes to disconnected.",
  ],
  "MPU6050 I²C detection": [
    "Power the GY-521 using its verified board supply and connect SDA21/SCL22 with common ground.",
    "Keep the board still, calibrate the baseline and verify approximately one gravity magnitude at rest.",
    "Move each axis and compare response to an independent reference. Record actual observations.",
  ],
  "Microswitch transitions": [
    "Connect COM to GND and NO to GPIO25/26 using INPUT_PULLUP.",
    "Press and release each switch: LOW means pressed, HIGH means released under this provisional convention.",
    "Arm the bench, release a switch and verify debounced transition, event and reported local alarm.",
  ],
  "Anti-tamper LED": [
    "Keep the 12 V siren disconnected. Use the configured low-voltage bench LED only.",
    "Arm, release a switch or move the calibrated MPU6050, then observe LED behavior without Wi-Fi.",
    "Clear the alarm and document the observed LED state separately from the command.",
  ],
  "ADS1115 known-voltage measurement": [
    "Use a verified ADC supply and a safe input within the physical supply rails; never attach traction voltage directly.",
    "Measure a low-voltage reference with a multimeter, then compare A0 raw counts and converted voltage.",
    "Repeat at several safe inputs and record gain, error, reference instrument and wiring.",
  ],
  "ACS758 zero-current calibration": [
    "Verify sensor supply and a conditioned output below the ADS1115 supply rails. Do not connect unconditioned 5 V output.",
    "With zero current, measure offset and enter coefficients in ignored solair_config.h only after verification.",
    "Compare several independently measured currents. Record sensor location and evidence; do not equate it with pack current.",
  ],
  "GPS reception and fix": [
    "Enable GPS after validating supply and UART logic levels. Receive on GPIO32.",
    "Observe NMEA reception outdoors and wait for a valid fresh fix. Incoming bytes alone do not prove location.",
    "Record coordinates, satellite count and fix age; unplug the module and verify unavailable state.",
  ],
  "LTE AT verification": [
    "Validate carrier-board supply, peak current capacity and UART levels before enabling GPIO16/17.",
    "Enable the diagnostic adapter and observe AT/OK detection.",
    "Check SIM/network/data separately using the module documentation. AT detection does not establish LTE ingestion.",
  ],
  "HW-548 control verification": [
    "Disconnect the powered siren. Verify board terminal identification and electrical polarity with a safe test load.",
    "Measure startup signal and reliable 3.3 V triggering. Compare actual output to GPIO command.",
    "Document polarity, current, trigger voltage and safe startup before any powered siren enablement.",
  ],
  "Siren after safety verification": [
    "BLOCKED until the HW-548 physical checks, fused power wiring and siren electrical test are documented.",
    "A qualified engineer sets both verification and enable flags in firmware after checking control polarity.",
    "Test startup and local activation with appropriate hearing protection and record actual sound/load observation.",
  ],
  "End-to-end telemetry": [
    "Provision a device credential in CPE Lab and configure the HTTPS endpoint and trusted root certificate.",
    "Send a genuine frame over Wi-Fi; compare sequence and timestamps in History and the driver dashboard.",
    "Confirm operator and driver updates share one backend and unauthorized access is rejected.",
  ],
  "Offline and reconnection": [
    "Disconnect Wi-Fi while armed and observe local switches, motion and LED alarm still responding.",
    "Restore connectivity and check queued event IDs, deduplication and timestamps.",
    "Overflow is a bounded-buffer fault; document any loss instead of claiming unlimited retention.",
  ],
};

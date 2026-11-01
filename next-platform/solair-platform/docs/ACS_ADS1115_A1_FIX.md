# ACS measurement change — prepared firmware 2.0.16

> **Latest physical clarification:** A1 was not connected to the ACS divider midpoint during the earlier captures. Those captures are invalid for ACS calibration; USB/config acceptance and PZEM load observations remain valid. Cancel the proposed A1-to3V3 reference test. Retain firmware2.0.17 and review the new stream separately; do not fit coefficients from disconnected-input readings.


> **2.0.17 parser correction:** the shared application schema now accepts the exact verified A1 diagnostic while retaining freshness/calibration gates. If an already-uploaded 2.0.17 sends readable bytes but the site accepts no frame, reload localhost once and reconnect USB to load this corrected parser. Keep firmware/wiring unchanged; no additional upload is needed for this correction.


> **Current follow-up: prepared 2.0.17, same wiring.** The uploaded 2.0.16 capture confirmed A1 transport but disagreed with the user’s direct meter reading. User explicitly confirms the wiring is correct and declines photos/repeated checks. Keep the wiring as confirmed. The software now checks every ADS register transaction, reads back channel/gain/mode/rate, rejects incomplete or mismatched conversions, and starts a new full scan after failure/recovery. This closes a confirmed unchecked-I²C failure path; it does not establish that this caused the observed voltage discrepancy.

> For the next upload, reopen the same integrated sketch from disk, preserve its private configuration and existing board/core/port, and upload **2.0.17** with 12 V off. Keep USB forwarding on and LTE paused. After connecting the site at 115200, leave the circuit untouched for 60 seconds and report **“2.0.17 verified capture done”** plus the time. A healthy selected input includes **`ok_A1_config_0xD383_verified`** in the diagnostic. Failed transfers/configuration checks report a specific error and invalidate data; they do not produce a substituted voltage or current. No new wiring, guessed calibration or repeated VCC/OU1/meter check is required for this capture.


22 October 2026. Actual uploaded firmware remains2.0.15 until a new device report confirms2.0.16. User accepts the meter checks as correct and explicitly requests a fix without more repetitions. Sensor supply measured4.6V with load off; OU1 correctness is user-reported, without a newly provided numeric/stability trace. The exact cause of native ADC drift is not proved. This candidate uses the already installed ADS1115 A1 as a finer, independent conversion path; no claim of physical success from compilation.

## One wiring change, power off

1. Disconnect website USB, unplug ESP32USB and12Vadapter. Buzzer stays disconnected.
2. Remove **ADS1115 A1 -> GND** completely. A1 must no longer be tied to ground. Keep A2/A3 grounded and A0's working reference unchanged.
3. Connect **ADS1115 A1 -> the existing midpoint between the two10kohm ACS divider resistors**. That is the same point already wired to ESP32GPIO34. Leave the existing GPIO34 wire connected/reserved.
4. Keep ACS VCC/GND/OU1, both divider resistors, its newly inserted large current-terminal path, PZEM/shunt, supplyYjoints, all other sensors and GPIOs unchanged. Use a short existing signal jumper, not a new power branch.

```text
ACS small OU1 ---- upper 10kohm ----+---- ESP32 GPIO34 (reserved; not sampled in ADS mode)
                                   |
                                   +---- ADS1115 A1  <-- new connection
                                   |
                                lower 10kohm
                                   |
                               logic GND

REMOVE the old ADS A1-to-GND jumper. A2 and A3 stay grounded.
```

Do not connect raw ACS OU1,5V or12V directly to A1. ADS VDD stays on its existing3.3Vrail; the divider remains necessary. Do not leave the old A1ground tie in place, which would short the measurement point to ground.

## Upload once

Open/reopen `firmware/arduino-ide/solair_cpe/solair_cpe.ino` from disk so old IDE buffers do not overwrite updated headers. Preserve the existing Arduino ESP32DevModule/core3.3.12/actualport selection and private credentials. The prepared ignored integrated config already selects `ACS_USE_ADS1115_A1 true`, keeps `ENABLE_ADS true`, and explicitly keeps `ACS_CALIBRATED false`. Public examples remain opt-in/off. This preparation is not a calibration approval.

With12Vstilloff, reconnectUSB, closeSerialMonitor and upload. Refresh the website once to load the new source-aware client, connect115200, keepUSBforwardingON and LTEpaused. Confirm actual reported version2.0.16 and the label **ACS ADS1115 A1**. If it still saysESP32ADC1, do not interpret that as the new acquisition path.

## One first capture

Keep12Voff andUSB/ACS powered. Leave the divider untouched/no meter probes for60seconds. Report **'2.0.16 A1 capture done'** with clock time. Backend can compare ADCraw/counts, millivolts, sample age and channel diagnostics directly. Typical zero is near half sensorVOUT after the divider (roughly1.15V from the reported4.6Vsupply); record actual values, do not force that expected value into firmware.

PZEMfault with12Voff is expected in this phase. `— A` remains expected until independently validated calibration. This capture verifies the candidate conversion path; loaded/current-reference validation follows only once input behaviour supports it. The100ohm load at~0.12A still does not establish the whole claimed current range or justify marking ACS accurate.

## Implemented behaviour

- ADS1115 keeps GAIN_ONE(±4.096V), four-channel nonblocking single-shot scan and the existingI2C21/22bus. A1 reports nominal0.125mV/count; no highergain, guessed offset or moving-average outlier deletion introduced.
- ACS uses only real completedA1samples while the bus is healthy and that sample is no older than500ms. Startup, channel absence, conversion timeout, pause and invalid range cannot create a usable old reading. No fallback to the untrusted native measurement.
- GPIO34 assignment/physical node is retained; its native ADC is not sampled in ADS mode. The legacy source remains available with the explicit source option false; it is not silently selected on failure.
- Payload includes `cpe.acs.adc_source`, `adc_diagnostic`, `adc_raw`, `adc_age_ms`; app labels the source and shows sub-mV detail. Old firmware without these fields remains supported. Current remainsnull unless calibration is explicitly validated/enabled.
- No device token, CA, endpoint, LTE recovery, alarm polarity, switch logic, bank topology or otherGPIO assignment changed.

## Validation and schematic delta

Actual configured ESP32core3.3.12 compilePASS:1,223,568bytesflash(93%);53,040bytesRAM(16%).75Node tests and19CPEtests through PostgreSQLadapterPASS. HostnativeADC/ADSfreshness and existingalarm/PZEM/TLSfixturesPASS. Intercepted-browserfixturePASS forsource, precise voltage, invalid-current preservation, clearing failed voltage and legacy compatibility; typecheck/targetedlintPASS. These are software results, not hardware upload/stability/current accuracyPASS.

Original private2.0.15sketch retained in ignored `.tools/cpe-known-good/2026-10-22-2.0.15-before-acs-ads/`, access-restricted. Do not publish it or any provisioned binary.

EasyEDA: add ADSA1 to the existingACS_ADCnet and delete A1'sGNDconnection. KeepGPIO34reserved/onthatnet. Annotate firmware source selection and calibration separately; no new sensor purchase or GPIO reassignment. This candidate signal-routing change must be physically verified before assembly release.

Primary references: [TI ADS1115](https://www.ti.com/lit/ds/symlink/ads1115.pdf), [Espressif ADC calibration/noise guidance](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/adc/adc_calibration.html). These explain component capabilities, not the cause of the specific bench fault or completed board accuracy.

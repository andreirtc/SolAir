# GPIO34 / GPIO35 native ADC crosscheck — v2

Use when a multimeter at the actual GPIO34 pin disagrees with the combined firmware's ACS ADC1 millivolts. V1 used Arduino's raw/millivolt wrappers; v2 bypasses those wrappers and reads native ADC1 channels6/7, corresponding to physicalGPIO34/35 on the classic ESP32. Arduino3 uses ESP-IDF oneshot; Arduino2 uses its native ADC1 driver. Resolution is12bits with the same highest attenuation (called11dB in the older SDK,12dB in the newer one). Init/read errors are reported rather than silently accepted as valid zero. No voltage/current conversion, offset, sensor libraries or networking is used. GPIO27/19 stayLOW. FinalproductionACS_PIN remains34;35 is a temporary diagnostic input only. SerialMonitor output is not dashboard telemetry or a physicalPASS.

## Wiring and upload

1. Keep siren12V/current-path load disconnected and the already verified two10kΩdivider intact. Upper resistor:OU1to midpoint; lower:midpointto commonGND. Initially leave the midpointjumper onGPIO34. Never connect rawOU1,5V or12V to anESPinput.
2. Close SerialMonitor (and disconnect websiteUSB if connected). Reopen the generated `firmware/arduino-ide/06a_adc_wire_crosscheck/06a_adc_wire_crosscheck.ino` to loadv2. The user's board selection is already confirmedESP32DevModule; keep it and the installed core. No privateconfig changes are needed.
3. Upload, then open SerialMonitor115200. Require `ADC_CROSSCHECK v2 native_IDF` and `ADC_INIT status=OK`. Save a fewADC34/ADC35pairs plus the meter voltage directlyatGPIO34relative toESP32GND. Ignore an unconnectedGPIO35; a floating reading is not a valid reference. First inspect these results before asking the user to move a jumper.
4. Only if a physicalpin comparison is still needed: turnALLpoweroff, move only the midpointjumper fromGPIO34to the otherwise unusedGPIO35, then poweron. Measure directlyatGPIO35relative toESP32GND and saveADC35lines. Do not change resistor legs, feed rawOU1 toGPIO35, or change productionpins. Ignore the now-unconnectedGPIO34reading.
5. Optional groundedreference: withALLpoweroff, disconnect the midpoint from the tested pin and connect that pin onlytoESP32GND. Save rawreadings; never retain a simultaneous source connection. Return the wiring to its reviewed arrangement withpoweroff after testing.

| Test | Connection | Record |
|---|---|---|
| Initial native check | Verified midpoint remains onGPIO34 | Startup/initstatus, ADC34/35pairs, simultaneousGPIO34meter voltage |
| Conditional comparison | Midpoint moved onlytoGPIO35, allpoweroffduring move | ADC35pairs and simultaneousGPIO35meter voltage |
| Optional ground | Tested input toESPGNDonly, midpoint disconnected | Rawcountmeans/min/max and read-errorcounts |

For a stable measured~1.17V on a connected input, expect rawcounts clearlyabovezero; rawcounts alone do not establish calibrated voltage/current accuracy. If nativeGPIO34reads normally whilev1Arduino wrappers didnot, investigate that softwarepath before changing calibration. If onlyGPIO35responds under a measured equivalent input, theGPIO34input/contactpath needs further investigation; do not declare the wholeESP32damaged or change productionpins automatically. If bothdisagree, retain raw/init/error/meter evidence. No guessed voltage factor is applied.

After collecting results, close Serial Monitor before another upload. Restore the preserved final `solair_cpe` sketch/config to resume the dashboard; this diagnostic intentionally does not send SOLAIR telemetry. Keep siren power disconnected during uploads.

Compile only from the application directory:

```sh
bash scripts/cpe-build.sh 06a_adc_wire_crosscheck
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/arduino-ide/06a_adc_wire_crosscheck
```

API references: [ESP-IDF native ADC](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/adc_oneshot.html), [Arduino ADC wrappers used in v1](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html).

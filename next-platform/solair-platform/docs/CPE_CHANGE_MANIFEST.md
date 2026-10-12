# CPE change inventory — 11 October 2026

Authoritative app: next-platform/solair-platform. Generated dependencies, toolchains, temporary databases and build caches are excluded. All152 historical CPE source/BEMAC image transfer hashes were checked and preserved. Root START-HERE.md was also updated with the current directive. Latest hardware clarification is recorded in docs/CPE_HARDWARE_CLARIFICATION_2026-10-11.md.

## Modified original app files

- `.gitignore`
- `packages\telemetry-contract\index.ts`
- `README.md`
- `server\app.ts`
- `server\db.ts`
- `server\health.ts`
- `server\index.ts`
- `src\bench-guides.ts`
- `src\FleetMap.tsx`
- `src\Lab.tsx`
- `src\main.tsx`
- `tests\core.test.ts`
- `tests\postgres-store.ts`
- `tests\providers.test.ts`

## Added app files

- `docs\cpe-evidence\mpu-identity-probe-build.log`

- `docs\cpe-evidence\led-no-sensor-libraries-build.log`

- `docs\CPE_TEST_BY_TEST_WIRING_TABLES.md`

- `firmware\arduino-ide\source-manifest.json`
- `firmware\arduino-ide\solair_cpe\solair_cpe.ino`
- `firmware\arduino-ide\solair_cpe\protocol.h`
- `firmware\arduino-ide\solair_cpe\pins.h`
- `firmware\arduino-ide\solair_cpe\modules.h`
- `firmware\arduino-ide\solair_cpe\engine.h`
- `firmware\arduino-ide\solair_cpe\diagnostic.h`
- `firmware\arduino-ide\solair_cpe\config.example.h`
- `firmware\arduino-ide\README.md`
- `firmware\arduino-ide\11_combined_all_sensors_soak\protocol.h`
- `firmware\arduino-ide\11_combined_all_sensors_soak\pins.h`
- `firmware\arduino-ide\11_combined_all_sensors_soak\modules.h`
- `firmware\arduino-ide\11_combined_all_sensors_soak\engine.h`
- `firmware\arduino-ide\11_combined_all_sensors_soak\diagnostic.h`
- `firmware\arduino-ide\11_combined_all_sensors_soak\config.example.h`
- `firmware\arduino-ide\11_combined_all_sensors_soak\11_combined_all_sensors_soak.ino`
- `firmware\arduino-ide\10_wifi_authenticated_ingest\protocol.h`
- `firmware\arduino-ide\10_wifi_authenticated_ingest\pins.h`
- `firmware\arduino-ide\10_wifi_authenticated_ingest\modules.h`
- `firmware\arduino-ide\10_wifi_authenticated_ingest\engine.h`
- `firmware\arduino-ide\10_wifi_authenticated_ingest\diagnostic.h`
- `firmware\arduino-ide\10_wifi_authenticated_ingest\config.example.h`
- `firmware\arduino-ide\10_wifi_authenticated_ingest\10_wifi_authenticated_ingest.ino`
- `firmware\arduino-ide\09b_pzem_esp32_max3485\protocol.h`
- `firmware\arduino-ide\09b_pzem_esp32_max3485\pins.h`
- `firmware\arduino-ide\09b_pzem_esp32_max3485\modules.h`
- `firmware\arduino-ide\09b_pzem_esp32_max3485\engine.h`
- `firmware\arduino-ide\09b_pzem_esp32_max3485\diagnostic.h`
- `firmware\arduino-ide\09b_pzem_esp32_max3485\config.example.h`
- `firmware\arduino-ide\09b_pzem_esp32_max3485\09b_pzem_esp32_max3485.ino`
- `firmware\arduino-ide\08b_a7670e_esp_uart\protocol.h`
- `firmware\arduino-ide\08b_a7670e_esp_uart\pins.h`
- `firmware\arduino-ide\08b_a7670e_esp_uart\modules.h`
- `firmware\arduino-ide\08b_a7670e_esp_uart\engine.h`
- `firmware\arduino-ide\08b_a7670e_esp_uart\diagnostic.h`
- `firmware\arduino-ide\08b_a7670e_esp_uart\config.example.h`
- `firmware\arduino-ide\08b_a7670e_esp_uart\08b_a7670e_esp_uart.ino`
- `firmware\arduino-ide\07_gps_neo6m\protocol.h`
- `firmware\arduino-ide\07_gps_neo6m\pins.h`
- `firmware\arduino-ide\07_gps_neo6m\modules.h`
- `firmware\arduino-ide\07_gps_neo6m\engine.h`
- `firmware\arduino-ide\07_gps_neo6m\diagnostic.h`
- `firmware\arduino-ide\07_gps_neo6m\config.example.h`
- `firmware\arduino-ide\07_gps_neo6m\07_gps_neo6m.ino`
- `firmware\arduino-ide\01_i2c_mpu6050\protocol.h`
- `firmware\arduino-ide\01_i2c_mpu6050\pins.h`
- `firmware\arduino-ide\01_i2c_mpu6050\modules.h`
- `firmware\arduino-ide\01_i2c_mpu6050\engine.h`
- `firmware\arduino-ide\01_i2c_mpu6050\diagnostic.h`
- `firmware\arduino-ide\01_i2c_mpu6050\config.example.h`
- `firmware\arduino-ide\01_i2c_mpu6050\01_i2c_mpu6050.ino`
- `firmware\arduino-ide\00_esp32_boot_and_status_led\diagnostic.h`
- `firmware\arduino-ide\00_esp32_boot_and_status_led\config.example.h`
- `firmware\arduino-ide\00_esp32_boot_and_status_led\00_esp32_boot_and_status_led.ino`
- `firmware\arduino-ide\00_esp32_boot_and_status_led\modules.h`
- `firmware\arduino-ide\00_esp32_boot_and_status_led\engine.h`
- `firmware\arduino-ide\00_esp32_boot_and_status_led\pins.h`
- `firmware\arduino-ide\00_esp32_boot_and_status_led\protocol.h`
- `firmware\arduino-ide\05_ads1115\protocol.h`
- `firmware\arduino-ide\05_ads1115\pins.h`
- `firmware\arduino-ide\05_ads1115\modules.h`
- `firmware\arduino-ide\06_acs758\protocol.h`
- `firmware\arduino-ide\06_acs758\pins.h`
- `firmware\arduino-ide\06_acs758\modules.h`
- `firmware\arduino-ide\06_acs758\engine.h`
- `firmware\arduino-ide\06_acs758\diagnostic.h`
- `firmware\arduino-ide\06_acs758\config.example.h`
- `firmware\arduino-ide\06_acs758\06_acs758.ino`
- `firmware\arduino-ide\05_ads1115\config.example.h`
- `firmware\arduino-ide\05_ads1115\05_ads1115.ino`
- `firmware\arduino-ide\05_ads1115\diagnostic.h`
- `firmware\arduino-ide\05_ads1115\engine.h`
- `firmware\arduino-ide\03_mosfet_logic_led_first\diagnostic.h`
- `firmware\arduino-ide\03_mosfet_logic_led_first\config.example.h`
- `firmware\arduino-ide\03_mosfet_logic_led_first\03_mosfet_logic_led_first.ino`
- `firmware\arduino-ide\03_mosfet_logic_led_first\protocol.h`
- `firmware\arduino-ide\03_mosfet_logic_led_first\pins.h`
- `firmware\arduino-ide\03_mosfet_logic_led_first\modules.h`
- `firmware\arduino-ide\03_mosfet_logic_led_first\engine.h`
- `firmware\arduino-ide\04_12v_alarm_fused\04_12v_alarm_fused.ino`
- `firmware\arduino-ide\04_12v_alarm_fused\config.example.h`
- `firmware\arduino-ide\04_12v_alarm_fused\protocol.h`
- `firmware\arduino-ide\04_12v_alarm_fused\pins.h`
- `firmware\arduino-ide\04_12v_alarm_fused\modules.h`
- `firmware\arduino-ide\04_12v_alarm_fused\engine.h`
- `firmware\arduino-ide\04_12v_alarm_fused\diagnostic.h`
- `firmware\arduino-ide\02_tamper_switches\protocol.h`
- `firmware\arduino-ide\02_tamper_switches\pins.h`
- `firmware\arduino-ide\02_tamper_switches\modules.h`
- `firmware\arduino-ide\02_tamper_switches\engine.h`
- `firmware\arduino-ide\02_tamper_switches\diagnostic.h`
- `firmware\arduino-ide\02_tamper_switches\config.example.h`
- `firmware\arduino-ide\02_tamper_switches\02_tamper_switches.ino`
- `scripts\package-cpe-arduino-ide.py`

- `docs\CPE_DIRECT_BREADBOARD_QUICK_GUIDE.md`

- `backend\migrations\003_cpe.sql`
- `backend\migrations\004_cpe_supabase.sql`
- `docs\COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md`
- `docs\CPE_BREADBOARD_WIRING_AND_TEST_GUIDE.md`
- `docs\CPE_CHANGE_MANIFEST.md`
- `docs\CPE_HARDWARE_CLARIFICATION_2026-10-11.md`
- `docs\CPE_IMPLEMENTATION_AUDIT.md`
- `docs\CPE_TELEMETRY_V2.md`
- `docs\CPE_VALIDATION.md`
- `docs\cpe-evidence\browser-results.json`
- `docs\cpe-evidence\browser.log`
- `docs\cpe-evidence\firmware-all14.log`
- `docs\cpe-evidence\firmware-final-refresh.log`
- `docs\cpe-evidence\hardware-clarification-firmware.log`
- `docs\cpe-evidence\hardware-clarification-protocol.log`
- `docs\cpe-evidence\lint.log`
- `docs\cpe-evidence\pglite-tests.log`
- `docs\cpe-evidence\production-build.log`
- `docs\cpe-evidence\sqlite-tests.log`
- `docs\cpe-evidence\TEST-FIXTURE-cpe.csv`
- `docs\cpe-evidence\TEST-FIXTURE-lab-desktop.png`
- `docs\cpe-evidence\TEST-FIXTURE-lab-mobile.png`
- `firmware\README.md`
- `firmware\solair-cpe\config.example.h`
- `firmware\solair-cpe\diagnostic.h`
- `firmware\solair-cpe\engine.h`
- `firmware\solair-cpe\modules.h`
- `firmware\solair-cpe\pins.h`
- `firmware\solair-cpe\platformio.ini`
- `firmware\solair-cpe\protocol.h`
- `firmware\solair-cpe\solair_cpe.ino`
- `firmware\solair-cpe\src\main.cpp`
- `firmware\solair-cpe\tests\00_esp32_boot_and_status_led\00_esp32_boot_and_status_led.ino`
- `firmware\solair-cpe\tests\00_esp32_boot_and_status_led\entry.cpp`
- `firmware\solair-cpe\tests\00_esp32_boot_and_status_led\README.md`
- `firmware\solair-cpe\tests\01_i2c_mpu6050\01_i2c_mpu6050.ino`
- `firmware\solair-cpe\tests\01_i2c_mpu6050\entry.cpp`
- `firmware\solair-cpe\tests\01_i2c_mpu6050\README.md`
- `firmware\solair-cpe\tests\02_tamper_switches\02_tamper_switches.ino`
- `firmware\solair-cpe\tests\02_tamper_switches\entry.cpp`
- `firmware\solair-cpe\tests\02_tamper_switches\README.md`
- `firmware\solair-cpe\tests\03_mosfet_logic_led_first\03_mosfet_logic_led_first.ino`
- `firmware\solair-cpe\tests\03_mosfet_logic_led_first\entry.cpp`
- `firmware\solair-cpe\tests\03_mosfet_logic_led_first\README.md`
- `firmware\solair-cpe\tests\04_12v_alarm_fused\04_12v_alarm_fused.ino`
- `firmware\solair-cpe\tests\04_12v_alarm_fused\entry.cpp`
- `firmware\solair-cpe\tests\04_12v_alarm_fused\README.md`
- `firmware\solair-cpe\tests\05_ads1115\05_ads1115.ino`
- `firmware\solair-cpe\tests\05_ads1115\entry.cpp`
- `firmware\solair-cpe\tests\05_ads1115\README.md`
- `firmware\solair-cpe\tests\06_acs758\06_acs758.ino`
- `firmware\solair-cpe\tests\06_acs758\entry.cpp`
- `firmware\solair-cpe\tests\06_acs758\README.md`
- `firmware\solair-cpe\tests\07_gps_neo6m\07_gps_neo6m.ino`
- `firmware\solair-cpe\tests\07_gps_neo6m\entry.cpp`
- `firmware\solair-cpe\tests\07_gps_neo6m\README.md`
- `firmware\solair-cpe\tests\08a_a7670e_usb_at\README.md`
- `firmware\solair-cpe\tests\08a_a7670e_usb_at\usb_at.py`
- `firmware\solair-cpe\tests\08b_a7670e_esp_uart\08b_a7670e_esp_uart.ino`
- `firmware\solair-cpe\tests\08b_a7670e_esp_uart\entry.cpp`
- `firmware\solair-cpe\tests\08b_a7670e_esp_uart\README.md`
- `firmware\solair-cpe\tests\09a_pzem_usb_modbus\pzem_usb.py`
- `firmware\solair-cpe\tests\09a_pzem_usb_modbus\README.md`
- `firmware\solair-cpe\tests\09b_pzem_esp32_max3485\09b_pzem_esp32_max3485.ino`
- `firmware\solair-cpe\tests\09b_pzem_esp32_max3485\entry.cpp`
- `firmware\solair-cpe\tests\09b_pzem_esp32_max3485\README.md`
- `firmware\solair-cpe\tests\10_wifi_authenticated_ingest\10_wifi_authenticated_ingest.ino`
- `firmware\solair-cpe\tests\10_wifi_authenticated_ingest\entry.cpp`
- `firmware\solair-cpe\tests\10_wifi_authenticated_ingest\README.md`
- `firmware\solair-cpe\tests\11_combined_all_sensors_soak\11_combined_all_sensors_soak.ino`
- `firmware\solair-cpe\tests\11_combined_all_sensors_soak\entry.cpp`
- `firmware\solair-cpe\tests\11_combined_all_sensors_soak\README.md`
- `scripts\cpe-build.ps1`
- `scripts\test-cpe-protocol.py`
- `server\ingress.ts`
- `src\CpeHistory.tsx`
- `src\CpeIngressErrors.tsx`
- `src\CpeReadings.tsx`
- `tests\cpe-browser.ts`
- `tests\cpe.test.ts`
- `tests\ingress.test.ts`

Previous checkpoint inventory: 14 modified original app files; 179 added app files. Test fixtures are marked explicitly; no provisioned credentials are included.

## 12 October — compatible IMU continuation

Added `firmware/solair-cpe/imu6500.h` and its copies in all 13 Arduino IDE sketch folders. Updated shared module acquisition, diagnostic probe, example config, integrated telemetry identity, IDE packaging script/manifest and generated headers. Updated `src/Lab.tsx` to display the compatible profile and `tests/cpe.test.ts` to verify its authenticated backend round trip with isolated TEST FIXTURE data. Updated Test01 wiring/upload instructions, IDE README, validation and acceptance status. Original detailed wiring guide remains unchanged. New evidence logs use the `imu6500-` prefix under `docs/cpe-evidence`; these are software evidence, not physical measurements.

Subsequent Test05 correction: shared ADS scanner now uses single-shot conversions with complete-scan validity, reconnect/timeout recovery, and diagnostic read_valid/sample count. Updated canonical modules/diagnostic headers, generated IDE copies and source manifest, Test05 wiring notes and validation. Firmware compile evidence: `docs/cpe-evidence/ads-single-shot-firmware-build.log`. Physical ADS readings still require team retest.

Added independent `05a_ads_register_crosscheck` sketch/wrapper and PlatformIO target, generated matching Arduino IDE folder, `docs/CPE_CONTINUE_TESTS_05_TO_08.md`, and `docs/cpe-evidence/ads-register-crosscheck-build.log`. IDE source manifest now covers14 folders. This comparison does not replace the centralized firmware or assert an ADS hardware pass.






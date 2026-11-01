#pragma once
// Copy to ignored solair_config.h AFTER the corresponding electrical gate passes.
#define DEVICE_ID "SOL-ET-01"
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define DEVICE_TOKEN ""
#define INGEST_URL "https://YOUR-DOMAIN/api/ingest"
#define ROOT_CA ""
// Private RFC1918 HTTP only for isolated local bench. Production uses verified HTTPS.
#define ALLOW_PRIVATE_BENCH_HTTP false
#define ENABLE_MPU false
#define MPU_ADDRESS 0x68
// Test01 can exercise reported ID0x70. Enable in combined/final ONLY after real
// changing accel/gyro and stationary gravity checks pass; no authenticity claim.
#define ALLOW_MPU6500_COMPAT false
#define ENABLE_SWITCHES false
// Set false for a lid-only installation; disabled mount input is not sampled or reported secure.
#define ENABLE_MOUNT_SWITCH true
// Temporary header substitution only: requires ENABLE_MOUNT_SWITCH=false and switch disconnected.
#define ALARM_USE_MOUNT_HEADER false
// Requires verified HTTPS PPP and commissioned alarm output; opt-in remote ARM/DISARM/siren.
#define ENABLE_REMOTE_CONTROL false
#define ENABLE_ADS false
#define ENABLE_ACS false
// Opt-in only after A1's ground tie is removed and A1 is connected to the
// existing safe divider midpoint. GPIO34 remains reserved; no native fallback.
#define ACS_USE_ADS1115_A1 false
#define ENABLE_GPS false
#define ENABLE_PZEM false
#define ENABLE_LTE false
#define ENABLE_MOTION false
#define MOTION_CALIBRATED false
#define MOTION_DELTA_MPS2 4.0f
#define MOTION_GYRO_RAD_S 1.5f
#define ENABLE_ALARM false
#define ALARM_POLARITY_VERIFIED false
#define ALARM_ACTIVE_HIGH true
// Team measured GPIO27 OFF ~0 V, ON ~3.0–3.3 V on 11 Oct 2026.
// Keep active-HIGH. Reset/power-up safe-OFF is still unrecorded; gate stays false.
#define ALARM_DURATION_MS 5000
#define ACS_CALIBRATED false
// Enter the independently validated useful range before enabling calibration.
// Zero/zero intentionally declares no validated range; never assume +/-50A.
#define ACS_VALIDATED_MIN_A 0.0f
#define ACS_VALIDATED_MAX_A 0.0f
#define ACS_ZERO_V 2.5f
#define ACS_SENSITIVITY_V_PER_A 0.04f
// Actual sensor Vout / conditioned voltage at GPIO34; measure your divider/buffer.
#define ACS_FRONTEND_SCALE 1.0f
#define PZEM_ADDRESS 1
#define LTE_BAUD 115200
#define LOAD_MODE "unknown"
#define PZEM_SOURCE "unknown" // bench_supply for adapter tests; mppt_output only at actual controller output.
// Publish real battery/solar channels only after the corresponding reference and
// current-path checks pass. A BMS installation alone does not validate a sensor.
#define PZEM_VOLTAGE_VALIDATED false
#define PZEM_SOLAR_CURRENT_VALIDATED false
// PZEM voltage terminals on the shared charging bus, compared with a meter at
// the protected pack. Preserve its manufacturer shunt/reference wiring.
#define PZEM_BATTERY_BUS_VERIFIED false
#define ACS_NET_BATTERY_VERIFIED false
// Identity defaults; change only from documented independent reference data.
#define PZEM_VOLTAGE_SCALE 1.0f
#define PZEM_CURRENT_SCALE 1.0f
// Packet fallback uses carrier A76XX HTTP commands, isolated private HTTP only.
// Set true ONLY after USB AT, UART/registration and actual POST acceptance tests.
// HTTPS modem uplink remains disabled until carrier-specific CA provisioning is verified.
#define LTE_HTTP_BENCH_COMMISSIONED false
// Requires reviewed carrier power/UART, reachable HTTPS URL and trusted PEM ROOT_CA.
// Enabling permits commissioning tests; it is not evidence of delivery.
#define LTE_HTTPS_ENABLED false
// Empty preserves the modem/SIM-selected APN; set only to a confirmed carrier APN.
#define LTE_APN ""
// Commissioning route: Wi-Fi disabled; first boot paused. Explicit LTE ON saves
// stream intent for later MCU resets; LTE OFF saves paused intent. ONCE does not
// enable persistent streaming. An unset/disabled interface stays disabled.
#define LTE_TEST_ONLY false
// For a commissioned LTE-only installation, true starts continuous telemetry
// on a fresh device without USB. A saved LTE OFF/ON choice overrides this
// default across resets. This does not enable LTE or bypass any module gates.
#define LTE_AUTO_START false
// Arduino 3 only: modem provides PPP Internet, ESP32 performs verified TLS.
// Opt-in commissioning only; retains UART2 GPIO13/14, no CTS/RTS/reset rewiring.
#define LTE_PPP_ENABLED false

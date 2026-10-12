#pragma once
// Copy to ignored config.h. No production secrets in repository.
#define DEVICE_ID "SOL-ET-01"
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define INGEST_URL "https://YOUR-DOMAIN/api/ingest"
#define DEVICE_TOKEN ""
// Root CA PEM for your HTTPS endpoint. Required; TLS verification is never bypassed.
#define ROOT_CA ""
#define ENABLE_GPS false
#define ENABLE_LTE_DIAGNOSTICS false
#define ENABLE_ADS true
#define ENABLE_ACS false
#define ACS_CALIBRATED false
#define ACS_ZERO_V 1.65f
#define ACS_SENSITIVITY_V_PER_A 0.04f
#define ACS_FRONTEND_SCALE 1.0f
// ACS758 output requires a verified 3.3 V-safe frontend before connection.
#define SIREN_PHYSICALLY_VERIFIED false
#define ENABLE_POWERED_SIREN false
#define ALARM_ACTIVE_HIGH true
#define BENCH_LED_PIN 2
#define MOTION_DELTA_MPS2 3.0f

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <driver/gpio.h>
#include <esp_timer.h>
#include "diagnostic-config.h"

static bool ready = false;
static uint64_t sequence = 0;
static const char *failure = "UNCONFIRMED_WIRING";

// Never consume an incomplete transfer. Caller prints no numeric sample on failure.
static bool readRegisters(uint8_t reg, uint8_t *out, size_t count) {
  Wire.beginTransmission(static_cast<uint8_t>(SENSOR_ADDRESS));
  if (Wire.write(reg) != 1 || Wire.endTransmission(false) != 0) return false;
  const size_t received = Wire.requestFrom(static_cast<uint8_t>(SENSOR_ADDRESS), count, true);
  if (received != count || Wire.available() != static_cast<int>(count)) {
    while (Wire.available()) Wire.read();
    return false;
  }
  for (size_t i = 0; i < count; ++i) out[i] = Wire.read();
  return true;
}

static bool writeRegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(static_cast<uint8_t>(SENSOR_ADDRESS));
  if (Wire.write(reg) != 1 || Wire.write(value) != 1) return false;
  return Wire.endTransmission(true) == 0;
}

static bool configurationMatches() {
  uint8_t settings[4]; // SMPLRT_DIV, CONFIG, GYRO_CONFIG, ACCEL_CONFIG
  uint8_t power;
  return readRegisters(0x19, settings, sizeof(settings)) &&
         readRegisters(0x6B, &power, 1) &&
         settings[0] == 0 && settings[1] == MPU6050_BAND_21_HZ &&
         settings[2] == (MPU6050_RANGE_250_DEG << 3) &&
         settings[3] == (MPU6050_RANGE_2_G << 3) && power == 0x01;
}

static Adafruit_MPU6050 sensor;
static volatile bool initializationPassed = false;

// Library reset polling is unbounded. Run begin in a dedicated task with a
// deadline. Timeout terminates that task and permanently prevents further I2C
// use until restart; a timed-out task may leave Wire resources locked.
static void initializeSensor(void *caller) {
  initializationPassed = sensor.begin(static_cast<uint8_t>(SENSOR_ADDRESS), &Wire);
  xTaskNotifyGive(static_cast<TaskHandle_t>(caller));
  // Keep handle valid until setup deletes this task, including timeout races.
  for (;;) vTaskDelay(pdMS_TO_TICKS(1000));
}

static int16_t signedWord(const uint8_t *p) {
  const uint16_t word = (static_cast<uint16_t>(p[0]) << 8) | p[1];
  return static_cast<int16_t>(word);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("SOLAIR RAW SENSOR DIAGNOSTICS - NOT TAMPER CLASSIFICATION");
  if (!WIRING_CONFIRMED) {
    Serial.println("BLOCKED UNCONFIRMED_WIRING: I2C not started; no sensor operation");
    return;
  }
  // Generic chip checks do NOT certify board wiring or electrical compatibility.
  if (SDA_GPIO < 0 || SCL_GPIO < 0 || SDA_GPIO == SCL_GPIO ||
      !GPIO_IS_VALID_OUTPUT_GPIO(SDA_GPIO) || !GPIO_IS_VALID_OUTPUT_GPIO(SCL_GPIO) ||
      (SENSOR_ADDRESS != 0x68 && SENSOR_ADDRESS != 0x69)) {
    failure = "INVALID_CONFIGURATION";
    Serial.println("ERROR INVALID_CONFIGURATION: supply approved GPIO/address values");
    return;
  }
  failure = "I2C_INIT_FAILED";
  if (!Wire.begin(SDA_GPIO, SCL_GPIO, I2C_CLOCK_HZ)) return;
  Wire.setTimeOut(50);
  uint8_t identity;
  failure = "SENSOR_ID_READ_FAILED";
  if (!readRegisters(0x75, &identity, 1)) return;
  Serial.printf("DETECTION address=0x%02X WHO_AM_I=0x%02X\n", SENSOR_ADDRESS, identity);
  failure = "SENSOR_ID_MISMATCH";
  if (identity != 0x68) return; // WHO_AM_I is 0x68 also when AD0 selects address 0x69.
  failure = "SENSOR_INIT_OR_CONFIG_FAILED";
  TaskHandle_t initTask = nullptr;
  if (xTaskCreate(initializeSensor, "mpu-init", 4096,
                  static_cast<void *>(xTaskGetCurrentTaskHandle()), 1, &initTask) != pdPASS) {
    failure = "INIT_TASK_CREATE_FAILED";
    return;
  }
  const bool completed = ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(2500)) != 0;
  vTaskDelete(initTask);
  if (!completed) {
    failure = "SENSOR_INIT_TIMEOUT_RESTART_REQUIRED";
    return; // Never touch Wire again after task termination during an I2C call.
  }
  if (!initializationPassed) return;
  // Upstream setters do not propagate write failures. Check every configuration
  // write ourselves and verify exact readback before relying on conversion scales.
  if (!writeRegister(0x19, 0) ||
      !writeRegister(0x1A, MPU6050_BAND_21_HZ) ||
      !writeRegister(0x1B, MPU6050_RANGE_250_DEG << 3) ||
      !writeRegister(0x1C, MPU6050_RANGE_2_G << 3) ||
      !writeRegister(0x6B, 0x01) || !configurationMatches()) return;
  delay(100);
  ready = true;
  Serial.println("READY diagnostic only: accel=+/-2g gyro=+/-250deg/s DLPF=21Hz; uncalibrated");
}

void loop() {
  delay(PRINT_INTERVAL_MS);
  if (!ready) {
    Serial.printf("ERROR %s readings=UNAVAILABLE restart after resolving cause\n", failure);
    return;
  }
  uint8_t identity;
  if (!readRegisters(0x75, &identity, 1) || identity != 0x68 || !configurationMatches()) {
    failure = "IDENTITY_OR_CONFIG_READ_FAILED";
    ready = false; // Require explicit restart/reinitialization after bus/config failure.
    Serial.println("ERROR IDENTITY_OR_CONFIG_READ_FAILED readings=UNAVAILABLE");
    return;
  }
  uint8_t data[14];
  const uint64_t startMs = static_cast<uint64_t>(esp_timer_get_time()) / 1000;
  if (!readRegisters(0x3B, data, sizeof(data))) {
    failure = "SENSOR_BURST_READ_FAILED";
    ready = false;
    Serial.println("ERROR SENSOR_BURST_READ_FAILED readings=UNAVAILABLE");
    return;
  }
  const uint64_t endMs = static_cast<uint64_t>(esp_timer_get_time()) / 1000;
  const float accelScale = 9.80665f / 16384.0f;
  const float gyroScale = (PI / 180.0f) / 131.0f;
  Serial.printf("RAW_DIAGNOSTIC sequence=%llu read_start_uptime_ms=%llu read_end_uptime_ms=%llu sampled_at_utc=null accel_m_s2=[%.6f,%.6f,%.6f] angular_velocity_rad_s=[%.6f,%.6f,%.6f]\n",
    static_cast<unsigned long long>(++sequence),
    static_cast<unsigned long long>(startMs), static_cast<unsigned long long>(endMs),
    signedWord(data) * accelScale, signedWord(data + 2) * accelScale,
    signedWord(data + 4) * accelScale, signedWord(data + 8) * gyroScale,
    signedWord(data + 10) * gyroScale, signedWord(data + 12) * gyroScale);
}

// Independent native ADC1 comparison. Serial Monitor only; no sensor libraries,
// private config, networking, current conversion, or guessed voltage correction.
#include <Arduino.h>
#include <esp_arduino_version.h>
#include "pins.h"
#if !CONFIG_IDF_TARGET_ESP32
#error "Use the classic ESP32 Dev Module for this GPIO34/35 crosscheck"
#endif
#if ESP_ARDUINO_VERSION_MAJOR >= 3
#include <esp_adc/adc_oneshot.h>
adc_oneshot_unit_handle_t adcUnit = nullptr;
adc_channel_t channels[2];
#else
#include <driver/adc.h>
const adc1_channel_t channels[2] = {ADC1_CHANNEL_6, ADC1_CHANNEL_7};
#endif

static_assert(ACS_PIN == 34, "The final CPE pin remains GPIO34");
constexpr int testPins[2] = {34, 35};
bool adcReady = false;

esp_err_t startAdc() {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  adc_oneshot_unit_init_cfg_t unitConfig = {};
  unitConfig.unit_id = ADC_UNIT_1;
  esp_err_t error = adc_oneshot_new_unit(&unitConfig, &adcUnit);
  if (error != ESP_OK) return error;
  for (unsigned i = 0; i < 2; ++i) {
    adc_unit_t unit;
    error = adc_oneshot_io_to_channel(testPins[i], &unit, &channels[i]);
    if (error != ESP_OK || unit != ADC_UNIT_1) return error == ESP_OK ? ESP_ERR_INVALID_ARG : error;
    adc_oneshot_chan_cfg_t config = {};
    config.bitwidth = ADC_BITWIDTH_12;
    config.atten = ADC_ATTEN_DB_12;
    error = adc_oneshot_config_channel(adcUnit, channels[i], &config);
    if (error != ESP_OK) return error;
  }
  return ESP_OK;
#else
  esp_err_t error = adc1_config_width(ADC_WIDTH_BIT_12);
  if (error != ESP_OK) return error;
  for (unsigned i = 0; i < 2; ++i) {
    error = adc1_config_channel_atten(channels[i], ADC_ATTEN_DB_11);
    if (error != ESP_OK) return error;
  }
  return ESP_OK;
#endif
}

int readRaw(unsigned index) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  int raw = 0;
  const esp_err_t error = adc_oneshot_read(adcUnit, channels[index], &raw);
  return error == ESP_OK ? raw : -1;
#else
  return adc1_get_raw(channels[index]);
#endif
}

void setup() {
  digitalWrite(ALARM_PIN, LOW);
  pinMode(ALARM_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  delay(200);
  Serial.printf("ADC_CROSSCHECK v2 native_IDF chip=%s core=%d.%d.%d bits=12 GPIO34=ADC1_CH6 GPIO35=ADC1_CH7\n",
                ESP.getChipModel(), ESP_ARDUINO_VERSION_MAJOR, ESP_ARDUINO_VERSION_MINOR,
                ESP_ARDUINO_VERSION_PATCH);
  const esp_err_t error = startAdc();
  adcReady = error == ESP_OK;
  Serial.printf("ADC_INIT status=%s code=%d\n", adcReady ? "OK" : "FAILED", int(error));
  Serial.println("Raw counts only. No Arduino analogRead/mV wrappers or voltage correction. GPIO27/19 held LOW.");
  Serial.println("Start with the divider still on GPIO34. GPIO35 comparison is a later step; any jumper move requires ALL power OFF. Ignore an unconnected pin.");
}

void loop() {
  if (!adcReady) {
    Serial.println("ADC_INIT_FAILED: no measurement accepted");
    delay(1000);
    return;
  }
  constexpr unsigned samples = 64;
  uint32_t sums[2] = {};
  unsigned counts[2] = {}, errors[2] = {};
  int minima[2] = {4095, 4095}, maxima[2] = {};
  for (unsigned n = 0; n < samples; ++n) {
    for (unsigned i = 0; i < 2; ++i) {
      const int raw = readRaw(i);
      if (raw < 0 || raw > 4095) { errors[i]++; continue; }
      sums[i] += raw;
      counts[i]++;
      if (raw < minima[i]) minima[i] = raw;
      if (raw > maxima[i]) maxima[i] = raw;
    }
    delay(1);
  }
  for (unsigned i = 0; i < 2; ++i) {
    if (counts[i]) {
      Serial.printf("ADC%d uptime_ms=%lu native_raw_mean=%.2f raw_min=%d raw_max=%d valid=%u read_errors=%u\n",
                    testPins[i], static_cast<unsigned long>(millis()), sums[i] / float(counts[i]),
                    minima[i], maxima[i], counts[i], errors[i]);
    } else Serial.printf("ADC%d READ_FAILED valid=0 read_errors=%u\n", testPins[i], errors[i]);
  }
  delay(900);
}

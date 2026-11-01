#pragma once
#include <Arduino.h>
#include <esp_arduino_version.h>
#if !CONFIG_IDF_TARGET_ESP32
#error "SOLAIR ACS ADC is commissioned for classic ESP32 GPIO34/ADC1"
#endif
#if ESP_ARDUINO_VERSION_MAJOR >= 3
#include <esp_adc/adc_oneshot.h>
#include <esp_adc/adc_cali.h>
#include <esp_adc/adc_cali_scheme.h>
#else
#include <driver/adc.h>
#include <esp_adc_cal.h>
#endif

// One owner (acquisition task), one physical input: ADC1 GPIO34. Factory
// calibration converts each actual raw sample; no guessed Vref/scale/offset.
class CpeAcsAdc {
public:
  bool readingValid = false;
  float rawMean = -1, millivolts = 0;
  const char* error = "not_initialized";
  const char* calibration = "unavailable";

  bool begin() {
    if (ready) return true;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    adc_cali_line_fitting_efuse_val_t source;
    if (adc_cali_scheme_line_fitting_check_efuse(&source) != ESP_OK ||
        source == ADC_CALI_LINE_FITTING_EFUSE_VAL_DEFAULT_VREF)
      return fail("factory_calibration_missing");
    adc_oneshot_unit_init_cfg_t unitConfig = {};
    unitConfig.unit_id = ADC_UNIT_1;
    if (adc_oneshot_new_unit(&unitConfig, &unit) != ESP_OK) return initFail("ADC1_init_failed");
    adc_unit_t mappedUnit;
    if (adc_oneshot_io_to_channel(34, &mappedUnit, &channel) != ESP_OK || mappedUnit != ADC_UNIT_1)
      return initFail("GPIO34_ADC1_mapping_failed");
    adc_oneshot_chan_cfg_t config = {};
    config.bitwidth = ADC_BITWIDTH_12;
    config.atten = ADC_ATTEN_DB_12;
    if (adc_oneshot_config_channel(unit, channel, &config) != ESP_OK) return initFail("ADC1_channel_config_failed");
    adc_cali_line_fitting_config_t calConfig = {};
    calConfig.unit_id = ADC_UNIT_1;
    calConfig.atten = ADC_ATTEN_DB_12;
    calConfig.bitwidth = ADC_BITWIDTH_12;
    // Zero default_vref is intentional: only the chip's eFuse calibration is accepted.
    if (adc_cali_create_scheme_line_fitting(&calConfig, &cal) != ESP_OK) return initFail("ADC1_calibration_init_failed");
    calibration = source == ADC_CALI_LINE_FITTING_EFUSE_VAL_EFUSE_TP ? "efuse_two_point" : "efuse_vref";
#else
    const bool factory = esp_adc_cal_check_efuse(ESP_ADC_CAL_VAL_EFUSE_TP) == ESP_OK ||
                         esp_adc_cal_check_efuse(ESP_ADC_CAL_VAL_EFUSE_VREF) == ESP_OK;
    if (!factory) return fail("factory_calibration_missing");
    if (adc1_config_width(ADC_WIDTH_BIT_12) != ESP_OK ||
        adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_11) != ESP_OK)
      return fail("ADC1_channel_config_failed");
    const auto source = esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, 0, &cal);
    if (source == ESP_ADC_CAL_VAL_DEFAULT_VREF) return fail("factory_calibration_missing");
    calibration = source == ESP_ADC_CAL_VAL_EFUSE_TP ? "efuse_two_point" : "efuse_vref";
#endif
    ready = true;
    error = "waiting_for_sample";
    return true;
  }

  bool sample() {
    readingValid = false;
    rawMean = -1;
    millivolts = 0;
    if (!ready) return false;
    uint32_t rawSum = 0, mvSum = 0;
    constexpr unsigned samples = 16;
    for (unsigned i = 0; i < samples; ++i) {
      int raw = 0, mv = 0;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
      if (adc_oneshot_read(unit, channel, &raw) != ESP_OK) return fail("ADC1_read_failed");
#else
      raw = adc1_get_raw(ADC1_CHANNEL_6);
#endif
      if (raw < 0 || raw > 4095) return fail("ADC1_raw_out_of_range");
#if ESP_ARDUINO_VERSION_MAJOR >= 3
      if (adc_cali_raw_to_voltage(cal, raw, &mv) != ESP_OK) return fail("ADC1_voltage_conversion_failed");
#else
      mv = int(esp_adc_cal_raw_to_voltage(raw, &cal));
#endif
      if (mv < 0 || mv > 3300) return fail("ADC1_voltage_out_of_range");
      rawSum += uint32_t(raw);
      mvSum += uint32_t(mv);
    }
    rawMean = rawSum / float(samples);
    millivolts = mvSum / float(samples);
    readingValid = true;
    error = "ok";
    return true;
  }

private:
  bool ready = false;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  adc_oneshot_unit_handle_t unit = nullptr;
  adc_cali_handle_t cal = nullptr;
  adc_channel_t channel = ADC_CHANNEL_6;
  bool initFail(const char* reason) {
    if (cal) { adc_cali_delete_scheme_line_fitting(cal); cal = nullptr; }
    if (unit) { adc_oneshot_del_unit(unit); unit = nullptr; }
    return fail(reason);
  }
#else
  esp_adc_cal_characteristics_t cal = {};
#endif
  bool fail(const char* reason) {
    readingValid = false;
    rawMean = -1;
    millivolts = 0;
    error = reason;
    return false;
  }
};

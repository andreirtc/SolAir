#pragma once
#include <stdint.h>
#include <math.h>

// A measurement is published only while the selected physical channel is fresh.
// No offset, smoothing, guessed zero or fallback to another ADC is applied here.
class CpeAcsAdsInput {
public:
  int16_t raw = 0;
  float millivolts = 0;
  uint32_t sampledAt = 0;
  bool observed = false;
  const char* error = "ADS1115_A1_waiting_for_sample";
  static constexpr uint32_t maxAgeMs = 500;

  void invalidate(const char* reason) {
    observed = false;
    raw = 0;
    millivolts = 0;
    error = reason;
  }
  void observe(int16_t counts, float volts, uint32_t now) {
    if (counts < 0 || !isfinite(volts) || volts < 0 || volts > 3.3f) {
      invalidate("ADS1115_A1_out_of_range");
      return;
    }
    raw = counts;
    millivolts = volts * 1000.0f;
    sampledAt = now;
    observed = true;
    error = "ok";
  }
  bool fresh(uint32_t now, bool busHealthy) {
    if (!busHealthy) { invalidate("ADS1115_unavailable"); return false; }
    if (!observed) return false;
    if (uint32_t(now - sampledAt) > maxAgeMs) {
      error = "ADS1115_A1_stale";
      return false;
    }
    error = "ok";
    return true;
  }
};

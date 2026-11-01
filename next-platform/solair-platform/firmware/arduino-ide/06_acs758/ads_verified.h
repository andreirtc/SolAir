#pragma once
#include <stdint.h>

template<class WireType> class CpeAdsWireIo {
 public:
  explicit CpeAdsWireIo(WireType& wire): wire_(wire) {}
  bool write16(uint8_t reg, uint16_t value) {
    wire_.beginTransmission(0x48);
    bool queued = wire_.write(reg) == 1;
    queued = (wire_.write(uint8_t(value >> 8)) == 1) && queued;
    queued = (wire_.write(uint8_t(value)) == 1) && queued;
    const uint8_t status = wire_.endTransmission(true);
    return queued && status == 0;
  }
  bool read16(uint8_t reg, uint16_t& value) {
    wire_.beginTransmission(0x48);
    const bool queued = wire_.write(reg) == 1;
    const uint8_t status = wire_.endTransmission(!queued);
    if (!queued || status != 0) return false;
    if (wire_.requestFrom(int(0x48), int(2)) != 2 || wire_.available() != 2) {
      while (wire_.available()) wire_.read();
      return false;
    }
    const uint8_t high = wire_.read(), low = wire_.read();
    value = (uint16_t(high) << 8) | low;
    return true;
  }
 private:
  WireType& wire_;
};

// ADS1115, single-ended A0..A3, +/-4.096 V, 128 SPS, single shot.
// IO exposes checked read16/write16 operations. No failed transaction may
// advance the channel or publish a conversion from the preceding channel.
template<class IO> class CpeVerifiedAds1115 {
 public:
  explicit CpeVerifiedAds1115(IO& io): io_(io) {}
  static constexpr uint32_t timeoutMs = 200;
  static constexpr uint32_t retryMs = 1000;
  bool online = false, healthy = false, updated = false;
  uint8_t lastChannel = 0, mask = 0;
  int16_t lastRaw = 0;
  uint16_t lastConfig = 0, observedConfig = 0, requestedConfig = 0;
  uint32_t samples = 0, errors = 0;
  const char* error = "ADS1115_waiting_for_sample";

  static uint16_t configFor(uint8_t channel) {
    return uint16_t(0xC383u + (uint16_t(channel) << 12));
  }
  static float volts(int16_t raw) { return float(raw) * 0.000125f; }
  bool begin(uint32_t now) {
    mask = 0; healthy = false; updated = false;
    return start(0, now);
  }
  void pause() {
    online = healthy = updated = pending_ = retryPending_ = false;
    mask = 0; error = "acquisition_paused";
  }
  void poll(uint32_t now) {
    updated = false;
    if (!pending_) {
      if (!retryPending_ || uint32_t(now - failedAt_) >= retryMs) begin(now);
      return;
    }
    const uint32_t age = uint32_t(now - startedAt_);
    // Do not mistake the previous idle OS bit for the conversion just started.
    if (age < 2) return;
    if (age > timeoutMs) { fail("ADS1115_conversion_timeout", now); return; }
    uint16_t config = 0;
    if (!io_.read16(1, config)) { fail("ADS1115_config_read_failed", now); return; }
    observedConfig = config;
    if (!matches(config)) { fail("ADS1115_config_mismatch", now); return; }
    if (!(config & 0x8000u)) return;
    uint16_t bits = 0;
    if (!io_.read16(0, bits)) { fail("ADS1115_conversion_read_failed", now); return; }
    // Also guard against a changed configuration during the result transfer.
    if (!io_.read16(1, config)) { fail("ADS1115_config_read_failed", now); return; }
    observedConfig = config;
    if (!matches(config) || !(config & 0x8000u)) {
      fail("ADS1115_config_changed_during_read", now); return;
    }
    lastChannel = channel_; lastRaw = int16_t(bits); lastConfig = config;
    mask |= uint8_t(1u << channel_); samples++; updated = true;
    healthy = mask == 15; error = "ok";
    start(uint8_t((channel_ + 1) % 4), now);
  }
 private:
  IO& io_;
  uint8_t channel_ = 0;
  bool pending_ = false, retryPending_ = false;
  uint32_t startedAt_ = 0, failedAt_ = 0;
  bool matches(uint16_t config) const {
    // OS changes as conversion completes; every other bit must match.
    return (config & 0x7FFFu) == (requestedConfig & 0x7FFFu);
  }
  void fail(const char* reason, uint32_t now) {
    pending_ = online = healthy = updated = false;
    retryPending_ = true; failedAt_ = now; mask = 0; errors++; error = reason;
  }
  bool start(uint8_t channel, uint32_t now) {
    requestedConfig = configFor(channel);
    if (!io_.write16(1, requestedConfig)) { fail("ADS1115_config_write_failed", now); return false; }
    uint16_t config = 0;
    if (!io_.read16(1, config)) { fail("ADS1115_config_read_failed", now); return false; }
    observedConfig = config;
    if (!matches(config)) { fail("ADS1115_config_mismatch", now); return false; }
    channel_ = channel; startedAt_ = now; pending_ = online = true;
    retryPending_ = false;
    return true;
  }
};

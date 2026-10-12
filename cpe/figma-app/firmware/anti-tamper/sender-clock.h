#pragma once
#include <stdint.h>
// Wall-clock trust expires after 24h without a new successful SNTP callback.
// This is a validity gate, never a wall clock derived from boot uptime.
inline bool senderClockValid(int64_t utcSeconds, bool synchronized, uint64_t nowMs, uint64_t syncedAtMs) {
  return synchronized && utcSeconds >= 1704067200LL && utcSeconds < 4102444800LL && nowMs >= syncedAtMs && nowMs-syncedAtMs < 86400000ULL;
}

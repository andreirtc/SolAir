#include <Arduino.h>
#include <esp_timer.h>

// Serial diagnostics only: no sensors, actuators, networking or telemetry.
static uint64_t counter = 0;

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("SOLAIR SERIAL TEST - DIAGNOSTIC ONLY (NOT SENSOR TELEMETRY)");
}

void loop() {
  delay(1000);
  ++counter;
  const uint64_t uptimeMs = static_cast<uint64_t>(esp_timer_get_time()) / 1000;
  Serial.printf("DIAGNOSTIC counter=%llu uptime_ms=%llu\n",
                static_cast<unsigned long long>(counter),
                static_cast<unsigned long long>(uptimeMs));
}

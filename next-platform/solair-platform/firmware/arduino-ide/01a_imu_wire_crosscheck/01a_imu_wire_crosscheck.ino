// Independent identity-read diagnostic. No sensor library, reset or config writes.
// USB-only ESP + previously approved 3.3V IMU; all other modules/12V disconnected.
// VCC=3V3, GND=GND, SDA=21, SCL=22, AD0=GND. Do not move wires powered.
#include <Arduino.h>
#include <Wire.h>
#include "pins.h"

uint32_t lastCheck = 0;
bool wireReady = false;

void scanBus() {
  unsigned found = 0;
  for (uint8_t address = 1; address < 127; ++address) {
    Wire.beginTransmission(address);
    uint8_t status = Wire.endTransmission(true);
    if (status == 0) {
      Serial.printf("SCAN address=0x%02X stop_probe_ack=1\n", address);
      ++found;
    }
  }
  Serial.printf("SCAN_END found=%u (address response is not valid sensor data)\n", found);
}

void checkIdentity(uint8_t address, uint32_t clockHz, bool repeatedStart) {
  while (Wire.available()) Wire.read();
  Wire.beginTransmission(address);
  Wire.write(uint8_t(0x75));
  uint8_t pointerStatus = Wire.endTransmission(!repeatedStart);
  size_t received = 0;
  int identity = -1;
  if (pointerStatus == 0) {
    received = Wire.requestFrom(uint16_t(address), size_t(1), true);
    if (received == 1 && Wire.available() == 1) identity = Wire.read();
  }
  while (Wire.available()) Wire.read();
  Serial.printf("IDENTITY address=0x%02X hz=%lu method=%s pointer_status=%u status_kind=%s bytes=%u WHO_AM_I=",
                address, (unsigned long)clockHz, repeatedStart ? "RESTART" : "STOP",
                pointerStatus, repeatedStart ? "queued_not_ack" : "completed_write",
                unsigned(received));
  if (identity >= 0) Serial.printf("0x%02X", identity);
  else Serial.print("unavailable");
  Serial.printf(" read_valid=%d\n", identity >= 0);
}

void setup() {
  // Preserve the team's active-HIGH control default. No siren attached in this test.
  digitalWrite(ALARM_PIN, LOW); pinMode(ALARM_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  wireReady = Wire.begin(SDA_PIN, SCL_PIN, 100000);
  Wire.setTimeOut(50);
  Serial.printf("INDEPENDENT MPU WIRE CHECK v1 SDA=%d SCL=%d begin=%d; no sensor library/configuration writes\n",
                SDA_PIN, SCL_PIN, wireReady);
  if (wireReady) scanBus();
  else Serial.println("WIRE_BEGIN_FAILED; no sensor result");
}

void loop() {
  if (!wireReady || uint32_t(millis() - lastCheck) < 5000) {
    delay(2);
    return;
  }
  lastCheck = millis();
  Serial.printf("BUS_IDLE SDA=%d SCL=%d (digital levels only; measure supply separately)\n",
                digitalRead(SDA_PIN), digitalRead(SCL_PIN));
  const uint32_t clocks[] = {100000, 25000};
  for (uint32_t clockHz : clocks) {
    Wire.setClock(clockHz);
    for (uint8_t address : {uint8_t(0x68), uint8_t(0x69)}) {
      Wire.beginTransmission(address);
      uint8_t status = Wire.endTransmission(true);
      Serial.printf("ADDRESS address=0x%02X hz=%lu status=%u stop_probe_ack=%d\n",
                    address, (unsigned long)clockHz, status, status == 0);
      checkIdentity(address, clockHz, false);
      checkIdentity(address, clockHz, true);
    }
  }
  Wire.setClock(100000);
  Serial.println("--- END_MPU_CHECK; identity read is not motion/calibration acceptance ---");
}

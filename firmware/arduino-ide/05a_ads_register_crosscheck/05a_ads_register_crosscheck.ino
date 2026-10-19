// Independent bench diagnostic: no SOLAIR Modules class or ADS library.
// USB only; 12 V disconnected. ADS VDD=3V3, GND=ESP GND, SDA21/SCL22,
// ADDR=GND (0x48). First connect A0-A3 to ADS GND, then test one input at 3V3.
// Power off before moving jumpers. Never connect an input to 12 V.
#include <Arduino.h>
#include <Wire.h>

constexpr uint8_t ADC_ADDRESS = 0x48;
bool readRegister(uint8_t reg, uint16_t &value) {
  Wire.beginTransmission(ADC_ADDRESS);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(int(ADC_ADDRESS), 2) != 2) {
    while (Wire.available()) Wire.read();
    return false;
  }
  uint8_t high = Wire.read(), low = Wire.read();
  value = (uint16_t(high) << 8) | low;
  return true;
}
bool writeRegister(uint8_t reg, uint16_t value) {
  Wire.beginTransmission(ADC_ADDRESS);
  Wire.write(reg); Wire.write(uint8_t(value >> 8)); Wire.write(uint8_t(value));
  return Wire.endTransmission() == 0;
}
void setup() {
  digitalWrite(27, LOW); pinMode(27, OUTPUT);
  digitalWrite(19, LOW); pinMode(19, OUTPUT);
  Serial.begin(115200);
  Wire.begin(21, 22, 100000); Wire.setTimeOut(20);
  Serial.println("INDEPENDENT ADS REGISTER CHECK v2; single-ended + differential; address=0x48; +/-4.096V; no backend; GPIO27 OFF");
}
void checkConversion(const char *label, uint16_t requested) {
    if (!writeRegister(1, requested)) {
      Serial.printf("CHECK %s valid=0 error=config_write\n", label); return;
    }
    uint32_t started = millis(); uint16_t config = 0; bool ready = false;
    const char *error = "conversion_timeout";
    while (uint32_t(millis() - started) < 150) {
      if (!readRegister(1, config)) { error = "config_read"; break; }
      if ((config & 0x7FFF) != (requested & 0x7FFF)) { error = "config_mismatch"; break; }
      if (config & 0x8000) { ready = true; break; }
      delay(2);
    }
    uint16_t bits = 0;
    if (!ready || !readRegister(0, bits)) {
      Serial.printf("CHECK %s valid=0 config=0x%04X error=%s\n", label, config, ready ? "conversion_read" : error);
      return;
    }
    int16_t raw = int16_t(bits);
    Serial.printf("CHECK %s valid=1 config=0x%04X raw=%d V=%.5f\n", label, config, raw, raw * 0.000125f);
}
void loop() {
  for (uint8_t channel = 0; channel < 4; channel++) {
    // OS=start, MUX=single-ended channel, PGA=+/-4.096V,
    // MODE=single shot, DR=128SPS, comparator disabled. A0 config=0xC383.
    char label[3] = {'A', char('0' + channel), 0};
    checkConversion(label, 0xC383u + (uint16_t(channel) << 12));
  }
  // With ALL inputs at the same ground, both differences should be near zero.
  // These checks help investigate the offset; they do not auto-calibrate it away.
  checkConversion("DIFF_A0_A1", 0x8383);
  checkConversion("DIFF_A2_A3", 0xB383);
  Serial.println("--- END SCAN ---");
  delay(1000);
}

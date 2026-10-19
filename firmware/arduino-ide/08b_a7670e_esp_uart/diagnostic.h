#pragma once
#include <Arduino.h>
#if __has_include("solair_config.h")
#include "solair_config.h"
#else
#include "config.example.h"
#endif
#if TEST_STAGE == 0
// Boot/LED test needs only the ESP32 core, not any sensor or GPS libraries.
#include "pins.h"
uint32_t ledLastPrint=0;
void setup(){
 Serial.begin(115200);
 digitalWrite(ALARM_PIN,ALARM_ACTIVE_HIGH?LOW:HIGH);pinMode(ALARM_PIN,OUTPUT);
 digitalWrite(LED_PIN,LOW);pinMode(LED_PIN,OUTPUT);
 Serial.println("DIAGNOSTIC stage=0; USB only; GPIO19 LED; GPIO27 OFF; no sensors required");
}
void loop(){
 uint32_t now=millis();
 if(uint32_t(now-ledLastPrint)>=1000){ledLastPrint=now;digitalWrite(LED_PIN,!digitalRead(LED_PIN));Serial.printf("BOOT uptime_ms=%lu LED19=%d\n",(unsigned long)now,digitalRead(LED_PIN));}
 vTaskDelay(pdMS_TO_TICKS(2));
}
#else
// Isolated input tests activate only their named hardware. Powered/analogue/UART gates use private config.
#if TEST_STAGE == 1
#undef ENABLE_MPU
#define ENABLE_MPU true
#endif
#if TEST_STAGE == 5
#undef ENABLE_ADS
#define ENABLE_ADS true
#endif
#include "modules.h"
Modules hw;Contact dlid,dmount;String command;uint32_t lastPrint=0,offAt=0;
bool zeroCollect=false;float zeroSum=0;unsigned zeroSamples=0;uint32_t zeroAt=0;
void scan(){for(int a=1;a<127;a++){Wire.beginTransmission(a);if(!Wire.endTransmission())Serial.printf("I2C address=0x%02X\n",a);}}
void probeMPU(){
 // Independent identity read: an address ACK alone does not prove MPU6050 initialization.
 Wire.beginTransmission(MPU_ADDRESS);Wire.write(0x75);uint8_t status=Wire.endTransmission(false);
 int count=0,id=-1;if(status==0){count=Wire.requestFrom(int(MPU_ADDRESS),1);if(count==1&&Wire.available())id=Wire.read();}
 Serial.printf("MPU_PROBE address=0x%02X register_status=%u bytes=%d WHO_AM_I=",MPU_ADDRESS,status,count);
 if(id>=0)Serial.printf("0x%02X",id);else Serial.print("unavailable");
 Serial.printf(" profile=%s compat_enabled=%d initialized=%d read_valid=%d status=%s (ignore measurement zeros when read_valid=0)\n",hw.imuProfile(),ALLOW_MPU6500_COMPAT,hw.mpuSeen,hw.mpuOK,hw.imuIdentity==0x70?hw.imu6500.error:hw.mpuOK?"ok":"mpu6050_init_or_read_failed");
}
void off(){digitalWrite(ALARM_PIN,ALARM_ACTIVE_HIGH?LOW:HIGH);digitalWrite(LED_PIN,LOW);offAt=0;}
void setup(){Serial.begin(115200);digitalWrite(ALARM_PIN,ALARM_ACTIVE_HIGH?LOW:HIGH);pinMode(ALARM_PIN,OUTPUT);pinMode(LED_PIN,OUTPUT);off();
 if(TEST_STAGE==2){dlid.begin(LID_PIN);dmount.begin(MOUNT_PIN);}hw.begin();if(TEST_STAGE==1||TEST_STAGE==5)scan();
 Serial.printf("DIAGNOSTIC stage=%d; 115200 newline; outputs OFF; ON starts bounded manual test, OFF stops\n",TEST_STAGE);
}
void loop(){uint32_t now=millis();
 if(TEST_STAGE==2){dlid.poll(now);dmount.poll(now);if(dlid.transition||dmount.transition)Serial.printf("SWITCH lid=%d mount=%d; LOW=pressed/secure HIGH=released\n",dlid.stable,dmount.stable);}
 hw.pollSensors(now);hw.pollLTE(now);
 if(zeroCollect&&hw.acsAt!=zeroAt){zeroAt=hw.acsAt;if(!hw.acsOK){zeroCollect=false;Serial.println("ZERO rejected: ADC unsafe/near rail");}else{zeroSum+=hw.acsMV/1000*ACS_FRONTEND_SCALE;if(++zeroSamples==64){zeroCollect=false;Serial.printf("PROPOSED ACS_ZERO_V=%.6f from64 actual samples; verify zero load/reference; calibration flag unchanged\n",zeroSum/64);}}}
 while(Serial.available()){char c=Serial.read();if(c=='\n'){command.trim();
  if(command=="OFF"||command=="DISARM")off();
  else if(command=="SCAN")scan();
  else if(command=="ZERO"&&TEST_STAGE==6&&ENABLE_ACS){zeroCollect=true;zeroSum=0;zeroSamples=0;zeroAt=hw.acsAt;Serial.println("ZERO acquisition started; current path must have independently verified zero current");}
  else if(command=="ON"&&(TEST_STAGE==3||(TEST_STAGE==4&&ENABLE_ALARM&&ALARM_POLARITY_VERIFIED))){digitalWrite(ALARM_PIN,ALARM_ACTIVE_HIGH?HIGH:LOW);digitalWrite(LED_PIN,HIGH);offAt=now+ALARM_DURATION_MS;}
  else Serial.println("REJECTED: command or commissioning gate");command="";
 }else if(command.length()<80)command+=c;else command="";}
 if(offAt&&int32_t(now-offAt)>=0){off();Serial.println("OUTPUT OFF timeout; measure physical behavior");}
 if(now-lastPrint>=1000){lastPrint=now;
  if(TEST_STAGE==1)probeMPU();
  if(TEST_STAGE==0){digitalWrite(LED_PIN,!digitalRead(LED_PIN));Serial.printf("BOOT uptime_ms=%lu LED19=%d\n",(unsigned long)now,digitalRead(LED_PIN));}
  if(TEST_STAGE==1){Serial.printf("MPU detected=%d address=0x%02X raw=",hw.mpuOK,MPU_ADDRESS);for(int i=0;i<7;i++)Serial.printf("%d,",hw.mpuRaw[i]);Serial.printf(" accel_mps2=%.3f,%.3f,%.3f gyro_rad_s=%.3f,%.3f,%.3f\n",hw.accel.acceleration.x,hw.accel.acceleration.y,hw.accel.acceleration.z,hw.gyro.gyro.x,hw.gyro.gyro.y,hw.gyro.gyro.z);}
  if(TEST_STAGE==2)Serial.printf("SWITCH lid=%d mount=%d debounced_ms=50\n",dlid.stable,dmount.stable);
  if(TEST_STAGE==3||TEST_STAGE==4)Serial.printf("OUTPUT gpio27=%d verified_polarity=%d enabled=%d command_active=%d\n",digitalRead(ALARM_PIN),ALARM_POLARITY_VERIFIED,ENABLE_ALARM,offAt!=0);
  if(TEST_STAGE==5){Serial.printf("ADS1115 detected=%d read_valid=%d samples=%lu gain=+/-4.096V ",hw.adsSeen,hw.adsOK,(unsigned long)hw.adsSamples);for(int i=0;i<4;i++)Serial.printf("A%d_raw=%d V=%.4f ",i,hw.adsRaw[i],hw.adsV[i]);Serial.println(" (ignore values when read_valid=0)");}
  if(TEST_STAGE==6)Serial.printf("ACS gate=%d safe_range=%d ADC_mV=%.1f VOUT=%.4f zero=%.4f A=%.4f calibrated=%d (ignore A until calibrated)\n",ENABLE_ACS,hw.acsOK,hw.acsMV,hw.acsMV/1000*ACS_FRONTEND_SCALE,ACS_ZERO_V,hw.acsCurrent,ACS_CALIBRATED);
  if(TEST_STAGE==7){Serial.printf("GPS gate=%d fix=%d sats=%lu checksum_fail=%lu overflow=%lu ",ENABLE_GPS,hw.fix(),(unsigned long)hw.gps.satellites.value(),(unsigned long)hw.gps.failedChecksum(),(unsigned long)hw.gpsOverflows);if(hw.fix()){Serial.printf("lat=%.7f lon=%.7f age=%lu ",hw.gps.location.lat(),hw.gps.location.lng(),(unsigned long)hw.gps.location.age());if(hw.gps.date.isValid()&&hw.gps.time.isValid())Serial.printf("UTC=%04d-%02d-%02dT%02d:%02d:%02dZ",hw.gps.date.year(),hw.gps.date.month(),hw.gps.date.day(),hw.gps.time.hour(),hw.gps.time.minute(),hw.gps.time.second());else Serial.print("UTC=unavailable");}Serial.println();}
  if(TEST_STAGE==8)Serial.printf("LTE gate=%d AT=%d registered=%d attached=%d CSQ=%d; AT alone is not uplink\n",ENABLE_LTE,hw.atDetected,hw.registered,hw.attached,hw.rssi);
  if(TEST_STAGE==9)Serial.printf("PZEM gate=%d shunt50_verified=%d valid=%d V=%.2f A=%.2f W=%.1f Wh=%lu (ignore values when invalid)\n",ENABLE_PZEM,hw.shunt50OK,hw.pzemOK,hw.meter.voltage,hw.meter.current,hw.meter.power,(unsigned long)hw.meter.wh);
 }vTaskDelay(pdMS_TO_TICKS(2));
}
#endif // TEST_STAGE == 0


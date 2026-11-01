#pragma once
#include "lte_recovery.h"
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>
#include <atomic>
#include "pins.h"
#include "protocol.h"
#include "imu6500.h"
#include "acs_adc.h"
#include "acs_ads_input.h"
#include "ads_verified.h"
#include "measurement_policy.h"
#ifndef ACS_USE_ADS1115_A1
#define ACS_USE_ADS1115_A1 false
#endif
static_assert(ACS_PIN == 34, "ACS native ADC must retain the reviewed GPIO34 pin");
#ifndef ALLOW_MPU6500_COMPAT
#define ALLOW_MPU6500_COMPAT false
#endif
#if (defined(TEST_STAGE) && TEST_STAGE == 1) || defined(SOLAIR_COMPILE_ALL)
#undef ALLOW_MPU6500_COMPAT
#define ALLOW_MPU6500_COMPAT true
#endif
struct ImuWireIo {
 bool read(uint8_t reg,uint8_t* out,size_t size){
  Wire.beginTransmission(MPU_ADDRESS);Wire.write(reg);if(Wire.endTransmission(true)!=0)return false;
  if(Wire.requestFrom(int(MPU_ADDRESS),int(size))!=int(size)){while(Wire.available())Wire.read();return false;}
  for(size_t i=0;i<size;i++){if(!Wire.available())return false;out[i]=Wire.read();}return true;
 }
 bool write(uint8_t reg,uint8_t value){Wire.beginTransmission(MPU_ADDRESS);Wire.write(reg);Wire.write(value);return Wire.endTransmission()==0;}
};
#if defined(SOLAIR_COMPILE_ALL)
#undef ENABLE_MPU
#undef ENABLE_SWITCHES
#undef ENABLE_ADS
#undef ENABLE_ACS
#undef ENABLE_GPS
#undef ENABLE_PZEM
#undef ENABLE_LTE
#undef ENABLE_MOTION
#define ENABLE_MPU true
#define ENABLE_SWITCHES true
#define ENABLE_ADS true
#define ENABLE_ACS true
#define ENABLE_GPS true
#define ENABLE_PZEM true
#define ENABLE_LTE true
#define ENABLE_MOTION true
#endif
static_assert(!ACS_USE_ADS1115_A1 || ENABLE_ADS, "ACS ADS1115 A1 source requires ENABLE_ADS");
struct Contact {
 int pin,raw=HIGH,stable=HIGH;uint32_t changed=0;bool transition=false;
 void begin(int p){pin=p;pinMode(p,INPUT_PULLUP);raw=stable=digitalRead(p);}
 void poll(uint32_t now){transition=false;int v=digitalRead(pin);if(v!=raw){raw=v;changed=now;}if(v!=stable&&uint32_t(now-changed)>=50){stable=v;transition=true;}}
};
struct Modules {
 std::atomic<bool> running{true};
 Adafruit_MPU6050 mpu;TinyGPSPlus gps;
 CpeAdsWireIo<TwoWire> adsIo{Wire};CpeVerifiedAds1115<CpeAdsWireIo<TwoWire>> ads{adsIo};
 ImuWireIo imuIo;Imu6500<ImuWireIo> imu6500{imuIo};int imuIdentity=-1;uint32_t identityAt=0;
 EspSoftwareSerial::UART gpsUart;HardwareSerial rs{1},modem{2};
 bool mpuOK=false,adsOK=false,pzemOK=false;bool mpuSeen=false,adsSeen=false;
 sensors_event_t accel{},gyro{},temp{};int16_t adsRaw[4]={};float adsV[4]={};
 int16_t mpuRaw[7]={};float acsMV=0,acsCurrent=0,acsRawCode=0;uint32_t acsSampledAt=0;bool acsOK=false,acsInputValid=false;CpeAcsAdc acsAdc;CpeAcsAdsInput acsAds;
 uint32_t imuAt=0,adsAt=0,acsAt=0,pzemAt=0,rsSent=0,gpsByteAt=0;
 uint32_t adsSamples=0;uint16_t acsVerifiedConfig=0;char acsVerifiedDiagnostic[48]={};
 const char* adsReportedError=nullptr;
 uint8_t rsBytes[64];size_t rsCount=0;bool rsPending=false,rsRangeQuery=false,shunt50OK=false;uint32_t shuntAt=0,pzemSampleAt=0;PzemReading meter{};
 const char* pzemDiagnostic="not_polled";
 uint32_t gpsOverflows=0;bool atDetected=false,registered=false,attached=false;
 int rssi=-1;uint32_t lteAt=0,lteResponseAt=0;int lteStep=0;String lteLine;bool ltePending=false;
 void begin(){
  Wire.begin(SDA_PIN,SCL_PIN,100000);Wire.setTimeOut(20);
  if(ENABLE_MPU){uint8_t id=0;if(imuIo.read(0x75,&id,1))imuIdentity=id;if(imuIdentity==0x68){mpuOK=mpu.begin(MPU_ADDRESS);mpuSeen=mpuOK;if(mpuOK){mpu.setAccelerometerRange(MPU6050_RANGE_4_G);mpu.setGyroRange(MPU6050_RANGE_500_DEG);}}}
  if(ENABLE_ADS){adsSeen=ads.begin(millis());adsOK=false;}
  // External mode does not sample GPIO34: its input remains reserved/wired,
  // without repeatedly charging the internal ADC's sampling circuit.
  if(ENABLE_ACS&&!ACS_USE_ADS1115_A1)acsAdc.begin();
  // At9600 baud a blocked~0.2s USB frame can coincide with~200 GPS bytes,
  // each requiring up to10 ISR edge entries. Keep room for concurrent bursts.
  if(ENABLE_GPS)gpsUart.begin(9600,SWSERIAL_8N1,GPS_RX,-1,false,1024,4096);
  if(ENABLE_PZEM){pinMode(RS_DIR,OUTPUT);digitalWrite(RS_DIR,LOW);rs.begin(9600,SERIAL_8N2,RS_RX,RS_TX);}
  if(ENABLE_LTE)modem.begin(LTE_BAUD,SERIAL_8N1,LTE_RX,LTE_TX);
 }
 bool present(uint8_t addr){Wire.beginTransmission(addr);return Wire.endTransmission()==0;}
 const char* imuDiagnostic(){
  if(!ENABLE_MPU)return "disabled";
  if(!running)return "acquisition_paused";
  if(imuIdentity<0)return "identity_read_failed_check_MPU_power_SDA21_SCL22";
  if(imuIdentity==0x70)return ALLOW_MPU6500_COMPAT?imu6500.error:"ID_0x70_compatible_profile_disabled";
  if(imuIdentity==0x68)return mpuOK?"ok":"MPU6050_initialization_or_sample_read_failed";
  return "unexpected_WHO_AM_I_identity";
 }
 const char* imuProfile(){return imuIdentity==0x68?"mpu6050":imuIdentity==0x70?"mpu6500_compatible":"unknown";}
 const char* acsSource(){return ACS_USE_ADS1115_A1?"ads1115_a1":"esp32_adc1_gpio34";}
 const char* acsDiagnostic(){
  if(!ACS_USE_ADS1115_A1)return acsAdc.error;
  if(!ads.online)return ads.error;
  if(strcmp(acsAds.error,"ok"))return acsAds.error;
  snprintf(acsVerifiedDiagnostic,sizeof(acsVerifiedDiagnostic),"ok_A1_config_0x%04X_verified",acsVerifiedConfig);
  return acsVerifiedDiagnostic;
 }
 float acsRaw(){return acsRawCode;}
 bool acsReadable(){return running&&ENABLE_ACS&&acsInputValid&&(!ACS_USE_ADS1115_A1||(acsAds.fresh(millis(),adsOK)&&uint32_t(millis()-acsSampledAt)<=CpeAcsAdsInput::maxAgeMs));}
 bool acsCurrentUsable(){return ACS_CALIBRATED&&acsOK&&acsReadable()&&cpeAcsCurrentWithinRange(acsCurrent,ACS_VALIDATED_MIN_A,ACS_VALIDATED_MAX_A);}
 void pollSensors(uint32_t now){
  if(!running){mpuOK=adsOK=pzemOK=acsOK=acsInputValid=false;adsSeen=false;ads.pause();acsAds.invalidate("acquisition_paused");return;}
  if(ENABLE_MPU&&uint32_t(now-imuAt)>=50){imuAt=now;
   if(imuIdentity<0||uint32_t(now-identityAt)>=1000){identityAt=now;uint8_t id=0;int previous=imuIdentity;imuIdentity=imuIo.read(0x75,&id,1)?id:-1;if(previous!=imuIdentity)mpuSeen=false;}
   mpuOK=false;
   if(imuIdentity==0x70&&ALLOW_MPU6500_COMPAT){
    Imu6500Sample sample{};mpuOK=imu6500.poll(now,sample);mpuSeen=imu6500.initialized();
    if(mpuOK){for(int i=0;i<7;i++)mpuRaw[i]=sample.raw[i];accel.acceleration.x=sample.accel[0];accel.acceleration.y=sample.accel[1];accel.acceleration.z=sample.accel[2];gyro.gyro.x=sample.gyro[0];gyro.gyro.y=sample.gyro[1];gyro.gyro.z=sample.gyro[2];}
   }else if(imuIdentity==0x68){
    mpuOK=present(MPU_ADDRESS);if(mpuOK&&!mpuSeen){mpuOK=mpu.begin(MPU_ADDRESS);mpuSeen=mpuOK;if(mpuOK){mpu.setAccelerometerRange(MPU6050_RANGE_4_G);mpu.setGyroRange(MPU6050_RANGE_500_DEG);}}
    if(mpuOK){mpu.getEvent(&accel,&gyro,&temp);uint8_t bytes[14];mpuOK=imuIo.read(0x3b,bytes,sizeof(bytes));if(mpuOK)for(int i=0;i<7;i++)mpuRaw[i]=int16_t((uint16_t(bytes[i*2])<<8)|bytes[i*2+1]);}
   }
  }
  if(ENABLE_ADS&&uint32_t(now-adsAt)>=20){adsAt=now;
   ads.poll(now);adsSeen=ads.online;adsOK=ads.healthy;adsSamples=ads.samples;
   if(!ads.online)acsAds.invalidate(ads.error);
   if(ads.updated){
    const uint8_t channel=ads.lastChannel;
    adsRaw[channel]=ads.lastRaw;adsV[channel]=ads.volts(ads.lastRaw);
    if(ACS_USE_ADS1115_A1&&channel==1){acsVerifiedConfig=ads.lastConfig;acsAds.observe(adsRaw[1],adsV[1],now);}
   }
   if(!adsReportedError||strcmp(adsReportedError,ads.error)){
    adsReportedError=ads.error;
    Serial.printf("# ADS1115 verify status=%s requested=0x%04X observed=0x%04X errors=%lu\n",ads.error,ads.requestedConfig,ads.observedConfig,(unsigned long)ads.errors);
   }
  }
  if(ENABLE_ACS&&uint32_t(now-acsAt)>=50){
   acsAt=now;
   acsInputValid=ACS_USE_ADS1115_A1?acsAds.fresh(now,adsOK):acsAdc.sample();
   acsMV=acsInputValid?(ACS_USE_ADS1115_A1?acsAds.millivolts:acsAdc.millivolts):0;
   acsRawCode=acsInputValid?(ACS_USE_ADS1115_A1?float(acsAds.raw):acsAdc.rawMean):0;
   acsSampledAt=ACS_USE_ADS1115_A1?acsAds.sampledAt:now;
   acsOK=acsInputValid;acsCurrent=0;
   if(acsOK){acsOK=acsMV>20&&acsMV<3250;acsCurrent=((acsMV/1000.0f)*ACS_FRONTEND_SCALE-ACS_ZERO_V)/ACS_SENSITIVITY_V_PER_A;if(!isfinite(acsCurrent)||fabsf(acsCurrent)>50)acsOK=false;}
  }
  if(ENABLE_GPS){unsigned count=0;while(gpsUart.available()&&count++<256){gpsByteAt=now;char b=gpsUart.read();gps.encode(b);
#if defined(TEST_STAGE) && TEST_STAGE == 7
    Serial.write(b);
#endif
   }if(gpsUart.overflow())gpsOverflows++;}
  if(ENABLE_PZEM)pollRS(now);
 }
 bool fix(){return running&&ENABLE_GPS&&gps.location.isValid()&&gps.location.age()<=30000&&uint32_t(millis()-gpsByteAt)<5000;}
 void pollRS(uint32_t now){
  unsigned count=0;while(rs.available()&&count++<128){int c=rs.read();if(rsCount<sizeof(rsBytes))rsBytes[rsCount++]=c;}
  size_t expected=255;
  if(rsCount>=3){if(rsBytes[1]==3||rsBytes[1]==4)expected=size_t(rsBytes[2])+5;else if(rsBytes[1]&0x80)expected=5;}
  bool complete=rsPending&&rsCount>=expected&&expected<=sizeof(rsBytes);
  bool timeout=rsPending&&uint32_t(now-rsSent)>600;
  if(complete||timeout){
   if(timeout&&!complete)pzemDiagnostic=rsCount?"incomplete_reply":"no_reply_check_UART_and_meter_power";
   else if(rsBytes[0]!=PZEM_ADDRESS)pzemDiagnostic="reply_address_mismatch";
   else if(modbusCRC(rsBytes,rsCount)!=0)pzemDiagnostic="reply_CRC_error";
   else if(rsBytes[1]&0x80)pzemDiagnostic="Modbus_exception_reply";
   else pzemDiagnostic=rsRangeQuery?"shunt_range_mismatch":"invalid_measurement_reply";
   if(rsRangeQuery){
    shunt50OK=complete&&decodePzem50A(rsBytes,rsCount,PZEM_ADDRESS);
    if(shunt50OK){shuntAt=now;pzemDiagnostic="50A_verified_waiting_measurement";}else pzemSampleAt=0;
   }else{
    PzemReading next{};
    if(complete&&shunt50OK&&decodePzem(rsBytes,rsCount,PZEM_ADDRESS,next)){meter=next;pzemSampleAt=now;pzemDiagnostic="ok";}
    else pzemSampleAt=0;
   }
   rsPending=false;
  }
  pzemOK=shunt50OK&&pzemSampleAt&&uint32_t(now-pzemSampleAt)<5000;
  if(!rsPending&&uint32_t(now-pzemAt)>=2000){
   pzemAt=now;rsCount=0;while(rs.available())rs.read();
   rsRangeQuery=!shunt50OK||uint32_t(now-shuntAt)>=30000;
   // Read only. Explicit laptop commissioning sets the matched 50 A range;
   // never write EEPROM automatically from runtime or from an unchecked reply.
   uint8_t q[8]={PZEM_ADDRESS,uint8_t(rsRangeQuery?3:4),0,uint8_t(rsRangeQuery?3:0),0,uint8_t(rsRangeQuery?1:8),0,0};
   uint16_t crc=modbusCRC(q,6);q[6]=crc&255;q[7]=crc>>8;
   digitalWrite(RS_DIR,HIGH);rs.write(q,8);rs.flush();digitalWrite(RS_DIR,LOW);rsSent=millis();rsPending=true;
  }
 }
 // Called ONLY by transport task; modem UART has one owner.
 void pollLTE(uint32_t now,bool allowQuery=true){
  if(!ENABLE_LTE)return;unsigned count=0;
  while(modem.available()&&count++<512){char c=modem.read();if(c=='\n'){
    lteLine.trim();
    if(lteLine.length()>0){
      if(lteLine=="OK"){atDetected=true;lteResponseAt=now;ltePending=false;}
      if(lteLine=="ERROR"||lteLine.startsWith("+CME ERROR:"))ltePending=false;
      if(lteLine.startsWith("+CEREG:")){
        int comma=lteLine.indexOf(',');
        int status=lteLine.substring(comma>=0?comma+1:7).toInt();
        registered=status==1||status==5;if(!registered)attached=false;
      }
      if(lteLine.startsWith("+CGATT:"))attached=registered&&lteLine.substring(7).toInt()==1;
      if(lteLine.startsWith("+CSQ:")){int v=lteLine.substring(5).toInt();rssi=v>=0&&v<=31?v:-1;}
    }
    lteLine="";
   }else if(lteLine.length()<180)lteLine+=c;
  }
  if(uint32_t(now-lteResponseAt)>30000){atDetected=false;registered=false;attached=false;rssi=-1;}
  // Expire unanswered queries even while explicit command recovery owns the
  // UART and has disabled periodic queries. Otherwise recovery never sends AT.
  if(lteQueryExpired(ltePending,now,lteAt))ltePending=false;
  if(allowQuery&&uint32_t(now-lteAt)>=3000&&!ltePending){lteAt=now;const char* cmds[]={"AT","AT+CPIN?","AT+CSQ","AT+CEREG?","AT+CREG?","AT+CGATT?","AT+COPS?"};ltePending=true;modem.println(cmds[lteStep++%7]);}
 }
};

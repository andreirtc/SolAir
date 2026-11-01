#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <esp_timer.h>
#include <driver/gpio.h>
#include "alarm_output.h"
#include "command_text.h"
#include <esp_task_wdt.h>
#include <time.h>
#if __has_include("solair_config.h")
#include "solair_config.h"
#else
#include "config.example.h"
#endif
#ifndef ENABLE_MOUNT_SWITCH
#define ENABLE_MOUNT_SWITCH true
#endif
#ifndef ENABLE_REMOTE_CONTROL
#define ENABLE_REMOTE_CONTROL false
#endif
#include "remote_control.h"
#include "modules.h"
#include "security_policy.h"
#include "measurement_policy.h"
#include "lte_https.h"
#include "lte_recovery.h"
#include "lte_destination.h"
#ifndef LTE_HTTPS_ENABLED
#define LTE_HTTPS_ENABLED false
#endif
#ifndef LTE_APN
#define LTE_APN ""
#endif
#ifndef LTE_TEST_ONLY
#define LTE_TEST_ONLY false
#endif
#ifndef LTE_AUTO_START
#define LTE_AUTO_START false
#endif
#ifndef LTE_PPP_ENABLED
#define LTE_PPP_ENABLED false
#endif
#if LTE_PPP_ENABLED
#if ESP_IDF_VERSION_MAJOR < 5
#error "PPP transport requires the installed ESP32 Arduino 3 core"
#endif
#include "lte_ppp.h"
static_assert(LTE_TEST_ONLY,"PPP commissioning requires LTE_TEST_ONLY to isolate its route");
#endif
#if defined(SOLAIR_COMPILE_ALL)
// The existing never-upload coverage target also compiles the gated TLS path.
#undef LTE_HTTPS_ENABLED
#define LTE_HTTPS_ENABLED true
#endif
static_assert(ALARM_DURATION_MS>0&&ALARM_DURATION_MS<=10000,"Bound the output duration");
static_assert(ACS_SENSITIVITY_V_PER_A>0,"ACS sensitivity must be positive");
static_assert(!ACS_CALIBRATED||(ACS_VALIDATED_MIN_A>=-50&&ACS_VALIDATED_MAX_A<=50&&ACS_VALIDATED_MIN_A<ACS_VALIDATED_MAX_A),"Set the independently validated ACS useful range before enabling calibrated current");
Modules modules;Contact lid,mountContact;
QueueHandle_t remoteQueue;
char remoteLastId[37]={},remoteLastCommand[16]={};const char* remoteLastResult=nullptr;
constexpr bool remoteEnabled=ENABLE_REMOTE_CONTROL&&LTE_PPP_ENABLED&&LTE_HTTPS_ENABLED&&ENABLE_ALARM&&ALARM_POLARITY_VERIFIED;
SemaphoreHandle_t moduleMutex,queueMutex;QueueHandle_t eventQueue,destinationQueue;
Preferences spool,securityStore;bool securityStoreReady=false,standaloneArmWanted=false;String boot;uint32_t seq=0,eventSeq=0,dropped=0;
String frames[7],persisted[6];int frameCount=0;
portMUX_TYPE securityMux=portMUX_INITIALIZER_UNLOCKED;
CpeSecurityFsm securityFsm;
bool manualTestLatched=false,alarmActive=false,motionNow=false,stateDirty=false;
float motionPeakDelta=0,motionPeakGyro=0;uint32_t motionWindowSamples=0,motionObservedAt=UINT32_MAX;
bool motionAbove=false;uint32_t motionAboveSince=0,motionLongestMs=0;
std::atomic<const char*> lteDiagnostic{"not_started"};
LteCommissioning lteCommissioning(LTE_TEST_ONLY);
std::atomic<uint32_t> lteClockPending{0};
std::atomic<int> lteHttpStatus{-1};
String lteClockReport,lteRevisionReport,lteTlsError,lteAtReport;
String ingestDestination=INGEST_URL,lteEndpointReport;
bool lteEndpointSaved=false;
uint32_t alarmSince=0;const char* alarmReason=nullptr;esp_timer_handle_t cutoff;
// Main loop alone owns contacts/commands; short critical sections protect alarmActive timer state.
int lidStable=HIGH,mountStable=HIGH;
void forceOff(void*){portENTER_CRITICAL(&securityMux);stateDirty=true;alarmActive=false;digitalWrite(ALARM_PIN,ALARM_ACTIVE_HIGH?LOW:HIGH);digitalWrite(LED_PIN,LOW);portEXIT_CRITICAL(&securityMux);}
void disarm(){esp_timer_stop(cutoff);portENTER_CRITICAL(&securityMux);stateDirty=true;securityFsm.disarm();manualTestLatched=false;alarmActive=false;alarmReason=nullptr;digitalWrite(ALARM_PIN,ALARM_ACTIVE_HIGH?LOW:HIGH);digitalWrite(LED_PIN,LOW);portEXIT_CRITICAL(&securityMux);}
void cancelStandaloneArm(){
 standaloneArmWanted=false;
 if(securityStoreReady&&securityStore.getBool("arm_req",false)&&!saveStandaloneArmIntent(securityStore,false))Serial.println("# DISARM active; standalone preference clear failed: verify before restart");
}
void trigger(const char* reason){
 portENTER_CRITICAL(&securityMux);if(securityFsm.triggered()||manualTestLatched){portEXIT_CRITICAL(&securityMux);return;}if(strcmp(reason,"test")==0)manualTestLatched=true;else if(!securityFsm.trigger()){portEXIT_CRITICAL(&securityMux);return;}stateDirty=true;alarmActive=true;alarmReason=reason;alarmSince=millis();digitalWrite(LED_PIN,HIGH);if(ENABLE_ALARM&&ALARM_POLARITY_VERIFIED)digitalWrite(ALARM_PIN,ALARM_ACTIVE_HIGH?HIGH:LOW);portEXIT_CRITICAL(&securityMux);
 esp_timer_stop(cutoff);if(esp_timer_start_once(cutoff,uint64_t(ALARM_DURATION_MS)*1000)!=ESP_OK)forceOff(nullptr);
 if(xQueueSend(eventQueue,&reason,0)!=pdTRUE)dropped++;
}
String utc(){time_t t=time(nullptr);if(!lteUtcUsable(t))return "";tm v;gmtime_r(&t,&v);char s[24];strftime(s,sizeof(s),"%Y-%m-%dT%H:%M:%SZ",&v);return s;}
void persist(){int slot=0;for(int i=0;i<frameCount&&slot<6;i++){if(frames[i].indexOf("\"event_id\"")<0)continue;String key=String("e")+slot;if(persisted[slot]!=frames[i]){if(spool.putString(key.c_str(),frames[i])!=frames[i].length())dropped++;else persisted[slot]=frames[i];}slot++;}for(;slot<6;slot++)if(persisted[slot].length()){String key=String("e")+slot;if(spool.remove(key.c_str()))persisted[slot]="";else dropped++;}}
void enqueue(const String& frame,bool event){
 xSemaphoreTake(queueMutex,portMAX_DELAY);
 int eventCount=0;for(int i=0;i<frameCount;i++)if(frames[i].indexOf("\"event_id\"")>=0)eventCount++;
 if(event&&eventCount>=6){dropped++;xSemaphoreGive(queueMutex);return;}
 if(!event){for(int i=frameCount-1;i>=0;i--)if(frames[i].indexOf("\"event_id\"")<0){for(int j=i+1;j<frameCount;j++)frames[j-1]=frames[j];frameCount--;}}
 frames[frameCount++]=frame;if(event)persist();xSemaphoreGive(queueMutex);
}
void emitFrame(const char* event){
 JsonDocument d;d["schema_version"]=2;d["device_id"]=DEVICE_ID;d["firmware_version"]="solair-cpe-2.0.20";d["boot_id"]=boot;d["sequence"]=seq++;d["device_uptime_ms"]=millis();String ts=utc();if(ts.length())d["device_timestamp"]=ts;else d["device_timestamp"]=nullptr;
 d["source_type"]="hardware";d["transport"]="usb";auto h=d["sensor_health"].to<JsonObject>();
 xSemaphoreTake(moduleMutex,portMAX_DELAY);
 const bool acsReadable=modules.acsReadable();
 const bool acsCurrentValid=modules.acsCurrentUsable();
 if(ENABLE_MPU&&modules.imuIdentity==0x70)d["firmware_version"]="solair-cpe-2.0.20/imu6500-compatible";
 if(!ENABLE_MOUNT_SWITCH)d["firmware_version"]=String(d["firmware_version"].as<const char*>())+"/lid-only";
 if(remoteEnabled)d["firmware_version"]=String(d["firmware_version"].as<const char*>())+"/remote";
 if(ALARM_USE_MOUNT_HEADER)d["firmware_version"]=String(d["firmware_version"].as<const char*>())+"/alarm26";
 d["firmware_version"]=String(d["firmware_version"].as<const char*>())+"/off-fix/mem";
 h["mpu6050"]=!ENABLE_MPU||modules.imuIdentity==0x70?"absent":modules.mpuOK?"ok":"fault";
 h["mpu6500_compatible"]=!ENABLE_MPU||modules.imuIdentity!=0x70?"absent":modules.mpuOK?"ok":"fault";
 h["switches"]=ENABLE_SWITCHES?"ok":"absent";h["ads1115"]=!ENABLE_ADS?"absent":modules.adsOK?"ok":"fault";h["acs758"]=!ENABLE_ACS?"absent":!modules.acsOK||!acsReadable?"fault":ACS_CALIBRATED?(acsCurrentValid?"ok":"fault"):"uncalibrated";h["gps"]=!ENABLE_GPS?"absent":modules.fix()?"ok":"fault";h["pzem017"]=!ENABLE_PZEM?"absent":modules.pzemOK?"ok":"fault";h["lte"]=!ENABLE_LTE?"absent":modules.atDetected?"ok":"fault";h["wind"]="absent";h["event_buffer"]=dropped?"fault":"ok";
 if(modules.mpuOK){auto a=d["accelerometer"].to<JsonArray>();a.add(modules.accel.acceleration.x);a.add(modules.accel.acceleration.y);a.add(modules.accel.acceleration.z);auto g=d["gyroscope"].to<JsonArray>();g.add(modules.gyro.gyro.x*RAD_TO_DEG);g.add(modules.gyro.gyro.y*RAD_TO_DEG);g.add(modules.gyro.gyro.z*RAD_TO_DEG);}
 if(modules.adsOK){auto a=d["ads_raw"].to<JsonArray>();auto v=d["ads_voltage"].to<JsonArray>();for(int i=0;i<4;i++){a.add(modules.adsRaw[i]);v.add(modules.adsV[i]);}d["ads_gain"]="GAIN_ONE +/-4.096 V";}
 d["gps_fix"]=modules.fix();if(modules.fix()){d["latitude"]=modules.gps.location.lat();d["longitude"]=modules.gps.location.lng();d["gps_fix_age_ms"]=modules.gps.location.age();}
 if(ENABLE_GPS&&modules.gps.satellites.isValid()&&modules.gps.satellites.age()<5000&&uint32_t(millis()-modules.gpsByteAt)<5000)d["satellites"]=modules.gps.satellites.value();
 auto c=d["cpe"].to<JsonObject>();c["load_mode"]=LOAD_MODE;c["historical"]=event!=nullptr;c["queue_dropped"]=dropped;
 auto remote=c["remote_control"].to<JsonObject>();remote["enabled"]=remoteEnabled;remote["last_id"]=nullptr;remote["last_command"]=nullptr;remote["last_result"]=nullptr;if(remoteLastId[0]){remote["last_id"]=remoteLastId;remote["last_command"]=remoteLastCommand;remote["last_result"]=remoteLastResult;}
 c["meter_source"]=PZEM_SOURCE;c["imu_diagnostic"]=modules.imuDiagnostic();c["pzem_diagnostic"]=!ENABLE_PZEM?"disabled":modules.pzemDiagnostic;c["pzem_rx_bytes"]=modules.rsCount;c["pzem_shunt50_verified"]=modules.shunt50OK;
 c["mpu_raw"]=nullptr;if(modules.mpuOK){auto r=c["mpu_raw"].to<JsonArray>();for(int i=0;i<7;i++)r.add(modules.mpuRaw[i]);}
 auto p=c["pzem"].to<JsonObject>();p["quality"]=!ENABLE_PZEM?"unavailable":modules.pzemOK?"ok":"fault";
 for(const char* key:{"voltage_v","current_a","power_w","energy_wh","alarm_high","alarm_low"})p[key]=nullptr;
 if(modules.pzemOK){p["voltage_v"]=modules.meter.voltage;p["current_a"]=modules.meter.current;p["power_w"]=modules.meter.power;p["energy_wh"]=modules.meter.wh;p["alarm_high"]=modules.meter.high;p["alarm_low"]=modules.meter.low;}
 auto ac=c["acs"].to<JsonObject>();ac["quality"]=!ENABLE_ACS?"unavailable":!modules.acsOK||!acsReadable?"fault":ACS_CALIBRATED?(acsCurrentValid?"ok":"fault"):"uncalibrated";ac["current_a"]=nullptr;ac["adc_mv"]=nullptr;ac["zero_v"]=nullptr;ac["sensitivity_v_per_a"]=nullptr;if(ENABLE_ACS){if(acsReadable)ac["adc_mv"]=modules.acsMV;ac["zero_v"]=ACS_ZERO_V;ac["sensitivity_v_per_a"]=ACS_SENSITIVITY_V_PER_A;if(acsCurrentValid)ac["current_a"]=modules.acsCurrent;}
 ac["current_diagnostic"]=!ACS_CALIBRATED?"not_calibrated":acsCurrentValid?"ok":"invalid_sample_or_outside_validated_range";ac["validated_min_a"]=nullptr;ac["validated_max_a"]=nullptr;if(ACS_CALIBRATED){ac["validated_min_a"]=ACS_VALIDATED_MIN_A;ac["validated_max_a"]=ACS_VALIDATED_MAX_A;}
 ac["adc_source"]=modules.acsSource();ac["adc_diagnostic"]=modules.acsDiagnostic();ac["adc_raw"]=nullptr;ac["adc_age_ms"]=nullptr;
 if(acsReadable){ac["adc_raw"]=modules.acsRaw();ac["adc_age_ms"]=uint32_t(millis()-modules.acsSampledAt);}
 if(ENABLE_ACS&&modules.acsOK&&acsReadable){d["acs_output_v"]=modules.acsMV/1000*ACS_FRONTEND_SCALE;if(ACS_CALIBRATED)d["acs_zero_v"]=ACS_ZERO_V;}
 CpeMeasurementRoles roles;roles.voltageValidated=PZEM_VOLTAGE_VALIDATED;roles.solarCurrentValidated=PZEM_SOLAR_CURRENT_VALIDATED;roles.batteryBusVerified=PZEM_BATTERY_BUS_VERIFIED;roles.acsNetBatteryVerified=ACS_NET_BATTERY_VERIFIED;roles.voltageScale=PZEM_VOLTAGE_SCALE;roles.solarCurrentScale=PZEM_CURRENT_SCALE;
 const auto measured=cpePublishedMeasurements(roles,PZEM_SOURCE,modules.pzemOK,modules.meter.voltage,modules.meter.current,acsCurrentValid,ACS_CALIBRATED,modules.acsCurrent);
 for(const char* key:{"battery_voltage_v","battery_current_a","solar_output_voltage_v","solar_output_current_a"})d[key]=nullptr;
 if(measured.batteryVoltageValid)d["battery_voltage_v"]=measured.batteryVoltage;
 if(measured.batteryCurrentValid)d["battery_current_a"]=measured.batteryCurrent;
 if(measured.solarOutputValid){d["solar_output_voltage_v"]=measured.solarVoltage;d["solar_output_current_a"]=measured.solarCurrent;}
 d["calibration_status"]=measured.any()?"calibrated":"unverified";
 auto measurement=c["measurements"].to<JsonObject>();measurement["battery_voltage_validated"]=measured.batteryVoltageValid;measurement["battery_current_validated"]=measured.batteryCurrentValid;measurement["solar_output_validated"]=measured.solarOutputValid;
 auto motion=c["motion"].to<JsonObject>();motion["enabled"]=ENABLE_MOTION;motion["calibrated"]=MOTION_CALIBRATED;motion["delta_threshold_mps2"]=MOTION_DELTA_MPS2;motion["gyro_threshold_rad_s"]=MOTION_GYRO_RAD_S;motion["hold_ms"]=200;motion["window_samples"]=motionWindowSamples;motion["longest_above_threshold_ms"]=motionLongestMs;
 motion["peak_delta_mps2"]=nullptr;motion["peak_gyro_rad_s"]=nullptr;
 if(modules.mpuOK&&motionWindowSamples){motion["peak_delta_mps2"]=motionPeakDelta;motion["peak_gyro_rad_s"]=motionPeakGyro;}
 if(!event){motionPeakDelta=motionPeakGyro=0;motionWindowSamples=motionLongestMs=0;}
 auto g=c["gps"].to<JsonObject>();g["quality"]=!ENABLE_GPS?"unavailable":modules.fix()?"ok":"fault";g["hdop"]=nullptr;if(modules.fix()&&modules.gps.hdop.isValid())g["hdop"]=modules.gps.hdop.hdop();g["checksum_failures"]=modules.gps.failedChecksum();g["software_uart_overflows"]=modules.gpsOverflows;
 g["chars_processed"]=modules.gps.charsProcessed();g["sentences_passed"]=modules.gps.passedChecksum();g["last_byte_age_ms"]=nullptr;if(ENABLE_GPS&&modules.gps.charsProcessed())g["last_byte_age_ms"]=uint32_t(millis()-modules.gpsByteAt);
 c["lte_diagnostic"]=lteDiagnostic.load();c["lte_http_status"]=lteHttpStatus.load();
 c["lte_clock"]=lteClockReport;c["lte_revision"]=lteRevisionReport;c["lte_tls_error"]=lteTlsError;c["lte_at_diagnostic"]=lteAtReport;c["lte_endpoint"]=lteEndpointReport;c["lte_endpoint_saved"]=lteEndpointSaved;
 c["lte_engine"]=LTE_PPP_ENABLED?"esp32_ppp_tls":"modem_https";
 auto l=c["lte"].to<JsonObject>();l["quality"]=!ENABLE_LTE?"unavailable":modules.atDetected?"ok":"fault";l["at_detected"]=modules.atDetected;l["registered"]=modules.atDetected&&modules.registered;l["attached"]=modules.atDetected&&modules.registered&&modules.attached;l["rssi"]=nullptr;if(modules.rssi>=0)l["rssi"]=modules.rssi;l["uplink_commissioned"]=LTE_HTTP_BENCH_COMMISSIONED||LTE_HTTPS_ENABLED;d["lte_registration"]=modules.registered?"registered":"not registered";if(modules.rssi>=0)d["lte_signal_quality"]=modules.rssi;
 xSemaphoreGive(moduleMutex);
 bool armedCopy,alarmCopy,motionCopy;CpeSecurityState securityCopy;int lidCopy,mountCopy;const char* reasonCopy;
 portENTER_CRITICAL(&securityMux);securityCopy=securityFsm.state();armedCopy=securityFsm.armed();alarmCopy=alarmActive;motionCopy=motionNow;lidCopy=lidStable;mountCopy=mountStable;reasonCopy=alarmReason;portEXIT_CRITICAL(&securityMux);
 d["security_state"]=cpeSecurityStateName(securityCopy);d["armed"]=armedCopy;d["alarm_active"]=alarmCopy;d["motion_detected"]=motionCopy;if(ENABLE_SWITCHES){d["lid_raw"]=lidCopy;if(ENABLE_MOUNT_SWITCH)d["mount_raw"]=mountCopy;else d["mount_raw"]=nullptr;d["lid_state"]=lidCopy==LOW?"secure":"tampered";if(ENABLE_MOUNT_SWITCH)d["mount_state"]=mountCopy==LOW?"secure":"tampered";else d["mount_state"]=nullptr;}auto a=c["alarm"].to<JsonObject>();a["commanded"]=alarmCopy&&ENABLE_ALARM&&ALARM_POLARITY_VERIFIED;a["output_level"]=nullptr;if(ALARM_POLARITY_VERIFIED)a["output_level"]=(alarmCopy&&ENABLE_ALARM)==ALARM_ACTIVE_HIGH?1:0;a["feedback"]=nullptr;if(reasonCopy)a["reason"]=reasonCopy;else a["reason"]=nullptr;a["duration_ms"]=ALARM_DURATION_MS;
 d["siren_verified"]=ALARM_POLARITY_VERIFIED;
 if(event){d["event_id"]=String(eventSeq++);d["event_type"]=event;}
 String s;serializeJson(d,s);Serial.println(s);d["transport"]="wifi";s="";serializeJson(d,s);enqueue(s,event!=nullptr);
}
bool privateBenchURL(){String u=ingestDestination;if(!ALLOW_PRIVATE_BENCH_HTTP||!u.startsWith("http://"))return false;int end=u.indexOf('/',7);String host=u.substring(7,end<0?u.length():end);int colon=host.indexOf(':');if(colon>=0)host=host.substring(0,colon);IPAddress ip;if(!ip.fromString(host))return false;return ip[0]==10||(ip[0]==192&&ip[1]==168)||(ip[0]==172&&ip[1]>=16&&ip[1]<=31);}
int wifiPost(const String& frame){HTTPClient http;http.setConnectTimeout(1500);http.setTimeout(2500);WiFiClient plain;WiFiClientSecure tls;String url=ingestDestination;bool opened=false;if(url.startsWith("https://")&&strlen(ROOT_CA)){tls.setCACert(ROOT_CA);opened=http.begin(tls,url);}else if(privateBenchURL())opened=http.begin(plain,url);if(!opened)return -1;http.addHeader("Content-Type","application/json");http.addHeader("Authorization",String("Bearer ")+DEVICE_TOKEN);int status=http.POST(frame);http.end();return status;}
// Modem command waits occur in transport task, never the security loop. Do not log tokens/HTTP frames.
bool waitAT(const char* expected,uint32_t timeout){String response;uint32_t start=millis();while(uint32_t(millis()-start)<timeout){while(modules.modem.available()){char c=modules.modem.read();if(response.length()>1000)response.remove(0,500);response+=c;if(response.indexOf(expected)>=0)return true;if(response.indexOf("ERROR")>=0)return false;}vTaskDelay(pdMS_TO_TICKS(10));}return false;}
bool atCommand(const String& s,const char* expected="OK",uint32_t timeout=2000){while(modules.modem.available())modules.modem.read();modules.modem.println(s);return waitAT(expected,timeout);}
int httpAction(uint32_t timeout=15000){modules.modem.println("AT+HTTPACTION=1");String line;uint32_t start=millis();while(uint32_t(millis()-start)<timeout){while(modules.modem.available()){char ch=modules.modem.read();if(ch=='\n'){line.trim();if(line.startsWith("+HTTPACTION:")){int a=line.indexOf(','),b=line.indexOf(',',a+1);return a>0&&b>a?line.substring(a+1,b).toInt():-1;}if(line=="ERROR")return -1;line="";}else if(line.length()<200)line+=ch;}vTaskDelay(pdMS_TO_TICKS(10));}return -1;}
struct LteChannel {
 String response;
 LteReplyObservation observation;
 const char* replyResult="not_sent";
 void closeUart(){modules.modem.end();}
 void openUart(){
  modules.modem.begin(LTE_BAUD,SERIAL_8N1,LTE_RX,LTE_TX);
  xSemaphoreTake(moduleMutex,portMAX_DELAY);modules.atDetected=false;modules.registered=false;modules.attached=false;modules.ltePending=false;modules.lteLine="";modules.lteAt=millis()-3000;xSemaphoreGive(moduleMutex);
 }
 bool receive(const char* expected,uint32_t timeout){
  response="";observation=LteReplyObservation{};replyResult="timeout";uint32_t started=millis();
  while(uint32_t(millis()-started)<timeout){
   while(modules.modem.available()){
    const unsigned char byte=modules.modem.read();observation.feed(byte);
    response+=char(byte);if(response.length()>3072)response.remove(0,1024);
    // Preserve embedded NUL bytes in leftover data traffic. C-string conversion
    // would hide a later complete OK line for the entire command timeout.
    const std::string text(response.c_str(),response.length());
    if(lteHasReplyLine(text,"OK")){replyResult="OK";if(String(expected)=="OK"||String(expected)=="HANGUP")return true;}
    if(lteHasReplyLine(text,"NO CARRIER")){replyResult="NO_CARRIER";if(String(expected)=="HANGUP")return true;}
    if(lteHasReplyLine(text,"ERROR")||response.indexOf("+CME ERROR:")>=0){replyResult="ERROR";return false;}
    if(String(expected)!="OK"&&String(expected)!="HANGUP"&&response.indexOf(expected)>=0){replyResult="expected_response";return true;}
   }vTaskDelay(pdMS_TO_TICKS(10));
  }return false;
 }
 bool command(const std::string& cmd,const char* expected,unsigned timeout){
  const uint32_t started=millis();bool pending=true;
  while(pending&&uint32_t(millis()-started)<5000){
   xSemaphoreTake(moduleMutex,portMAX_DELAY);modules.pollLTE(millis(),false);pending=modules.ltePending;xSemaphoreGive(moduleMutex);
   if(pending)vTaskDelay(pdMS_TO_TICKS(10));
  }
  if(pending){
   xSemaphoreTake(moduleMutex,portMAX_DELAY);modules.ltePending=false;modules.lteLine="";xSemaphoreGive(moduleMutex);
   Serial.println("# LTE stale periodic query cleared; explicit command continues");
  }
  while(modules.modem.available())modules.modem.read();
  modules.modem.println(cmd.c_str());const bool ok=receive(expected,timeout);
  if(cmd=="AT"||cmd=="ATH"){
   const std::string summary=observation.summary();
   String report=String("step=")+cmd.c_str()+" result="+replyResult+" "+summary.c_str();
   xSemaphoreTake(moduleMutex,portMAX_DELAY);lteAtReport=report.substring(0,160);xSemaphoreGive(moduleMutex);
   Serial.printf("# LTE AT %s\n",report.c_str());
  }
  return ok;
 }
 bool recoverCommand(){
  const bool ready=lteRecoverCommand(*this);
  xSemaphoreTake(moduleMutex,portMAX_DELAY);
  modules.ltePending=false;modules.lteLine="";modules.atDetected=ready;
  if(ready)modules.lteResponseAt=millis();else modules.registered=modules.attached=false;
  modules.lteAt=millis()-3000;
  xSemaphoreGive(moduleMutex);return ready;
 }
 void guard(uint32_t ms){vTaskDelay(pdMS_TO_TICKS(ms));}
 void escape(){modules.modem.print("+++");modules.modem.flush();}
 bool finishDataCall(){return lteFinishDataCall(*this);}
 bool setClock(uint32_t epoch){
  if(!lteUtcUsable(epoch))return false;
  const time_t seconds=epoch;tm v;gmtime_r(&seconds,&v);char value[40];
  strftime(value,sizeof(value),"%y/%m/%d,%H:%M:%S+00",&v);
  return command(std::string("AT+CCLK=\"")+value+"\"","OK",5000);
 }
 bool clockValid(){
  if(command("AT+CGMR","OK",5000)){
   String revision=response;revision.replace("\r", "");revision.replace("\nOK", "");revision.replace("AT+CGMR", "");revision.trim();revision=revision.substring(0,100);
   xSemaphoreTake(moduleMutex,portMAX_DELAY);lteRevisionReport=revision;xSemaphoreGive(moduleMutex);
  }
  if(!command("AT+CCLK?","OK",5000))return false;
  int at=response.indexOf("+CCLK: \"");if(at<0)return false;
  String clock=response.substring(at+8);int quote=clock.indexOf('"');if(quote>=0)clock=clock.substring(0,quote);clock=clock.substring(0,40);
  xSemaphoreTake(moduleMutex,portMAX_DELAY);lteClockReport=clock;xSemaphoreGive(moduleMutex);
  const uint32_t epoch=lteClockEpoch(clock.c_str());
  if(!epoch)return false;
  if(!lteUtcUsable(time(nullptr))){timeval tv={};tv.tv_sec=epoch;if(settimeofday(&tv,nullptr)!=0)return false;}
  return true;
 }
 bool installCa(const std::string& pem){
  if(!command("AT+CCERTLIST","OK",5000))return false;
  if(response.indexOf("\"solair-ca.pem\"")>=0&&!command("AT+CCERTDELE=\"solair-ca.pem\"","OK",5000))return false;
  if(!command("AT+CCERTDOWN=\"solair-ca.pem\","+std::to_string(pem.size()),">",10000))return false;
  modules.modem.write(reinterpret_cast<const uint8_t*>(pem.data()),pem.size());return receive("OK",10000);
 }
 bool data(const std::string& payload,unsigned timeout){modules.modem.write(reinterpret_cast<const uint8_t*>(payload.data()),payload.size());return receive("OK",timeout);}
 int action(unsigned timeout){return httpAction(timeout);}
};
LteChannel lteChannel;LteHttps<LteChannel> lteHttps(lteChannel);
#if LTE_PPP_ENABLED
LtePppTransport<LteChannel> ltePpp(lteChannel);
#endif
bool applyLteClock(uint32_t epoch){
#if LTE_PPP_ENABLED
 if(!ltePpp.ownsUart()&&!lteChannel.setClock(epoch))return false;
 timeval tv={};tv.tv_sec=epoch;return settimeofday(&tv,nullptr)==0;
#else
 return lteChannel.setClock(epoch);
#endif
}
void receiveRemoteReply(const String& reply,uint32_t sequence){
 if(!remoteEnabled||reply.length()>1024)return;
 JsonDocument d;if(deserializeJson(d,reply)||d["accepted"]!=true||d["ack"]["persisted"]!=true||d["ack"]["sequence"]!=sequence)return;
 const char* ackDevice=d["ack"]["device_id"]|"";const char* ackBoot=d["ack"]["boot_id"]|"";
 if(strcmp(ackDevice,DEVICE_ID)||strcmp(ackBoot,boot.c_str()))return;
 auto c=d["remote_command"];if(c.isNull())return;
 const char* id=c["id"]|"";const char* action=c["command"]|"";const char* device=c["device_id"]|"";const char* targetBoot=c["boot_id"]|"";
 if(strlen(id)>=37||strlen(action)>=16||strlen(device)>=81||strlen(targetBoot)>=41||!c["expires_at"].is<uint32_t>())return;
 CpeRemoteCommand command{};strcpy(command.id,id);strcpy(command.command,action);strcpy(command.device,device);strcpy(command.boot,targetBoot);command.expires=c["expires_at"];
 if(cpeRemoteEnvelopeValid(command,DEVICE_ID,boot.c_str(),uint32_t(time(nullptr))))xQueueOverwrite(remoteQueue,&command);
}
void applyRemoteCommand(uint32_t now){
 CpeRemoteCommand command{};if(!remoteEnabled||xQueueReceive(remoteQueue,&command,0)!=pdTRUE)return;
 if(!strcmp(remoteLastId,command.id))return;
 const char* result="rejected";
 if(!cpeRemoteEnvelopeValid(command,DEVICE_ID,boot.c_str(),uint32_t(time(nullptr))))result="expired";
 else if(!strcmp(command.command,"disarm")){cancelStandaloneArm();disarm();result="accepted";}
 else if(!strcmp(command.command,"arm")){
  portENTER_CRITICAL(&securityMux);const bool accepted=securityFsm.arm(now,ENABLE_SWITCHES,lid.stable==LOW,cpeRequiredContactSecure(ENABLE_MOUNT_SWITCH,mountContact.stable==LOW),manualTestLatched);if(accepted)stateDirty=true;portEXIT_CRITICAL(&securityMux);if(accepted)result="accepted";
 }else if(!strcmp(command.command,"siren_test")){disarm();trigger("test");result="accepted";}
 xSemaphoreTake(moduleMutex,portMAX_DELAY);strcpy(remoteLastId,command.id);strcpy(remoteLastCommand,command.command);remoteLastResult=result;xSemaphoreGive(moduleMutex);
 portENTER_CRITICAL(&securityMux);stateDirty=true;portEXIT_CRITICAL(&securityMux);
 Serial.printf("# REMOTE command=%s result=%s; physical output must be observed\n",command.command,result);
}
int ltePost(String frame){
 if(ENABLE_LTE&&LTE_HTTPS_ENABLED){
  uint32_t postedSequence=0;
  // Destroy the parsed telemetry tree before TLS allocates its handshake buffers.
  {JsonDocument d;if(deserializeJson(d,frame))return -1;postedSequence=d["sequence"].as<uint32_t>();d["transport"]="lte";frame="";serializeJson(d,frame);}
  LteHttpsSettings settings;settings.enabled=true;settings.url=ingestDestination.c_str();settings.token=DEVICE_TOKEN;settings.ca=ROOT_CA;settings.apn=LTE_APN;
#if LTE_PPP_ENABLED
  int status=ltePpp.post(settings,frame.c_str());lteDiagnostic.store(ltePpp.diagnostic);if(status>=200&&status<300)receiveRemoteReply(ltePpp.serverReply,postedSequence);
  xSemaphoreTake(moduleMutex,portMAX_DELAY);lteTlsError=ltePpp.tlsError.substring(0,160);xSemaphoreGive(moduleMutex);return status;
#else
  int status=lteHttps.post(settings,frame.c_str());lteDiagnostic.store(lteHttps.diagnostic);return status;
#endif
 }
 if(!ENABLE_LTE||!LTE_HTTP_BENCH_COMMISSIONED||!privateBenchURL())return -1;
 JsonDocument d;if(deserializeJson(d,frame))return -1;d["transport"]="lte";frame="";serializeJson(d,frame);
 // Carrier-specific HTTPS CA setup is intentionally not bypassed. This path is isolated HTTP bench only.
 atCommand("AT+HTTPTERM");if(!atCommand("AT+HTTPINIT"))return -1;
 bool ok=atCommand(String("AT+HTTPPARA=\"URL\",\"")+ingestDestination+"\"")&&atCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"")&&atCommand(String("AT+HTTPPARA=\"USERDATA\",\"Authorization: Bearer ")+DEVICE_TOKEN+"\"")&&atCommand(String("AT+HTTPDATA=")+frame.length()+",10000","DOWNLOAD");
 int status=-1;if(ok){modules.modem.print(frame);if(waitAT("OK",11000))status=httpAction();}
 atCommand("AT+HTTPTERM");return status;
}
void applyDestinationUpdate(){
 LteDestinationUpdate update{};if(xQueueReceive(destinationQueue,&update,0)!=pdTRUE)return;
 const std::string url(update.url);
 xSemaphoreTake(queueMutex,portMAX_DELAY);const bool saved=lteSaveDestination(spool,url);xSemaphoreGive(queueMutex);
 if(!saved){lteDiagnostic.store("LTE_destination_save_failed");Serial.println("# LTE destination NOT saved; previous address retained");return;}
 if(ingestDestination!=update.url){
#if LTE_PPP_ENABLED
  if(ltePpp.ownsUart())ltePpp.stop();
#endif
  ingestDestination=update.url;lteHttps.reset();lteHttpStatus.store(-1);
 }
 xSemaphoreTake(moduleMutex,portMAX_DELAY);lteEndpointReport=update.url;lteEndpointSaved=true;xSemaphoreGive(moduleMutex);
 lteDiagnostic.store("LTE_destination_saved");Serial.println("# LTE destination saved; credentials and certificate verification retained");
}
void transportTask(void*){
 uint32_t lastWiFi=0,nextTry=0,lastWifiProbe=0;uint32_t backoff=500;unsigned wifiFailures=0;
#if LTE_PPP_ENABLED
 LteRecoverySchedule recovery;
#endif
 uint32_t waitingAt=0;const char* lastWaiting=nullptr;
 for(;;){applyDestinationUpdate();uint32_t now=millis();
#if LTE_PPP_ENABLED
  if(ltePpp.ownsUart()&&!lteCommissioning.active())ltePpp.stop();
  if(ENABLE_LTE&&lteCommissioning.active()&&!ltePpp.ownsUart()){
   xSemaphoreTake(moduleMutex,portMAX_DELAY);const bool atReady=modules.atDetected;xSemaphoreGive(moduleMutex);
   if(!atReady&&recovery.due(now)){
    lteDiagnostic.store("recovering_modem_command_mode");Serial.println("# LTE recovering modem command mode; stream request retained");
    const bool ready=lteChannel.recoverCommand();recovery.completed(millis());
    lteDiagnostic.store(ready?"waiting_for_network_registration":"modem_AT_recovery_failed_retrying");
    Serial.printf("# LTE recovery=%s; stream request retained\n",ready?"AT_ready":"AT_not_responding_retry_in_15s");
   }else if(atReady)recovery.reset();
  }
#endif
  now=millis();
  xSemaphoreTake(moduleMutex,portMAX_DELAY);
#if LTE_PPP_ENABLED
  const bool pppOwns=ltePpp.ownsUart();
  if(pppOwns){modules.atDetected=true;modules.attached=ltePpp.connected();if(modules.attached)modules.registered=true;}
  else modules.pollLTE(now);
  bool cellularReady=pppOwns||(modules.atDetected&&modules.registered&&modules.attached);
#else
  modules.pollLTE(now);bool cellularReady=modules.atDetected&&modules.registered&&modules.attached;
#endif
  xSemaphoreGive(moduleMutex);
  if(ENABLE_LTE&&lteCommissioning.active()&&!cellularReady){
   xSemaphoreTake(moduleMutex,portMAX_DELAY);
   const char* reason=!modules.atDetected?"modem_not_responding_recovery_pending":!modules.registered?"waiting_for_network_registration":"waiting_for_packet_attachment";
   xSemaphoreGive(moduleMutex);
   if(lastWaiting!=reason||uint32_t(now-waitingAt)>=5000){waitingAt=now;lastWaiting=reason;lteDiagnostic.store(reason);Serial.printf("# LTE waiting diagnostic=%s; upload has not started\n",reason);}
  }else lastWaiting=nullptr;
  if(!cellularReady)lteHttps.reset();
  if(!LTE_TEST_ONLY&&strlen(WIFI_SSID)&&WiFi.status()!=WL_CONNECTED&&uint32_t(now-lastWiFi)>=15000){lastWiFi=now;WiFi.begin(WIFI_SSID,WIFI_PASSWORD);}
  if(int32_t(now-nextTry)>=0&&strlen(DEVICE_TOKEN)){
   xSemaphoreTake(queueMutex,portMAX_DELAY);String frame=frameCount?frames[0]:"";xSemaphoreGive(queueMutex);
   if(frame.length()){bool useWifi=preferWifi(!LTE_TEST_ONLY&&WiFi.status()==WL_CONNECTED,cellularReady&&(LTE_HTTPS_ENABLED||LTE_HTTP_BENCH_COMMISSIONED),wifiFailures,now,lastWifiProbe);int status=-1;
    if(useWifi){lastWifiProbe=now;status=wifiPost(frame);if(status>=200&&status<300)wifiFailures=0;else if(retryableDelivery(status))wifiFailures++;else wifiFailures=0;}
    else if(lteCommissioning.take(cellularReady)){
     xSemaphoreTake(moduleMutex,portMAX_DELAY);lteTlsError="";xSemaphoreGive(moduleMutex);
     const uint32_t epoch=lteClockPending.exchange(0);
     if(epoch&&!applyLteClock(epoch)){
      lteDiagnostic.store("modem_clock_update_rejected_retrying");status=-1;lteClockPending.store(epoch);
     }else{
      if(epoch)lteHttps.reset();
      lteDiagnostic.store("connecting_to_SOLAIR");Serial.println("# LTE HTTPS attempt started; awaiting network/TLS result");status=ltePost(frame);
     }
     lteHttpStatus.store(status);
     Serial.printf("# LTE HTTPS status=%d diagnostic=%s%s%s\n",status,lteDiagnostic.load(),lteTlsError.length()?" detail=":"",lteTlsError.c_str());
    }else {vTaskDelay(pdMS_TO_TICKS(20));continue;}
    if(status>=200&&status<300){xSemaphoreTake(queueMutex,portMAX_DELAY);if(frameCount&&frames[0]==frame){bool event=frame.indexOf("\"event_id\"")>=0;for(int i=1;i<frameCount;i++)frames[i-1]=frames[i];frameCount--;if(event)persist();}xSemaphoreGive(queueMutex);backoff=500;}
    else {backoff=min(uint32_t(30000),backoff*2);Serial.printf("# INGEST status=%d queued=%d; no acknowledgement on conflict/error\n",status,frameCount);}nextTry=millis()+backoff;
   }
  }vTaskDelay(pdMS_TO_TICKS(20));
 }
}
void acquisitionTask(void*){
 uint32_t reportAt=0;
 for(;;){
  uint32_t now=millis();xSemaphoreTake(moduleMutex,portMAX_DELAY);modules.pollSensors(now);
  const float delta=fabsf(sqrtf(sq(modules.accel.acceleration.x)+sq(modules.accel.acceleration.y)+sq(modules.accel.acceleration.z))-9.80665f);
  const float angular=sqrtf(sq(modules.gyro.gyro.x)+sq(modules.gyro.gyro.y)+sq(modules.gyro.gyro.z));
  if(!modules.mpuOK)motionAbove=false;
  if(modules.mpuOK&&modules.imuAt!=motionObservedAt){
   const bool above=delta>MOTION_DELTA_MPS2||angular>MOTION_GYRO_RAD_S;
   if(above){if(!motionAbove||uint32_t(modules.imuAt-motionObservedAt)>150)motionAboveSince=modules.imuAt;motionAbove=true;motionLongestMs=max(motionLongestMs,uint32_t(modules.imuAt-motionAboveSince));}else motionAbove=false;
   motionObservedAt=modules.imuAt;motionPeakDelta=fmaxf(motionPeakDelta,delta);motionPeakGyro=fmaxf(motionPeakGyro,angular);motionWindowSamples++;
  }
  bool motion=modules.mpuOK&&(delta>MOTION_DELTA_MPS2||angular>MOTION_GYRO_RAD_S);
  xSemaphoreGive(moduleMutex);
  portENTER_CRITICAL(&securityMux);motionNow=motion;bool dirty=stateDirty;stateDirty=false;portEXIT_CRITICAL(&securityMux);
  const char* event=nullptr;bool hasEvent=xQueueReceive(eventQueue,&event,0)==pdTRUE;
  if(hasEvent)emitFrame(event);
  // Current contact/command/output changes get a live snapshot as well as any
  // event record. Disarmed short presses must not wait for the 2 s heartbeat.
  if(dirty||(!hasEvent&&uint32_t(now-reportAt)>=2000)){reportAt=now;emitFrame(nullptr);}
  vTaskDelay(pdMS_TO_TICKS(5));
 }
}
void setup(){
 // Queue USB frames instead of blocking acquisition for their full wire time.
 struct OutputIo {void preload(int pin,int level){gpio_set_level(gpio_num_t(pin),level);}void output(int pin){pinMode(pin,OUTPUT);}void write(int pin,int level){digitalWrite(pin,level);}} outputIo;
 cpeInitializeOutput(outputIo,ALARM_PIN,ALARM_ACTIVE_HIGH?LOW:HIGH);cpeInitializeOutput(outputIo,LED_PIN,LOW);
 Serial.setTxBufferSize(4096);Serial.begin(115200);
 remoteQueue=xQueueCreate(1,sizeof(CpeRemoteCommand));moduleMutex=xSemaphoreCreateMutex();queueMutex=xSemaphoreCreateMutex();eventQueue=xQueueCreate(16,sizeof(const char*));destinationQueue=xQueueCreate(1,sizeof(LteDestinationUpdate));esp_timer_create_args_t args={};args.callback=forceOff;args.name="alarmActive-cutoff";
 if(!remoteQueue||!moduleMutex||!queueMutex||!eventQueue||!destinationQueue||esp_timer_create(&args,&cutoff)!=ESP_OK){forceOff(nullptr);Serial.println("# FATAL resources; outputs OFF");while(true)delay(1000);}
 if(ENABLE_SWITCHES){lid.begin(LID_PIN);if(ENABLE_MOUNT_SWITCH)mountContact.begin(MOUNT_PIN);}
 boot=String(esp_random(),HEX)+String(esp_random(),HEX)+String(esp_random(),HEX);spool.begin("solair-cpe-v2",false);for(int i=0;i<6;i++){String key=String("e")+i;String f=spool.getString(key.c_str(),"");JsonDocument stored;if(f.length()&&!deserializeJson(stored,f)&&stored["schema_version"]==2&&!stored["event_id"].isNull()&&stored["device_id"]==DEVICE_ID){frames[frameCount++]=f;persisted[i]=f;}}
 const String savedDestination=spool.getString("lte_url","");
 if(lteDestinationValid(std::string(savedDestination.c_str(),savedDestination.length()))){ingestDestination=savedDestination;lteEndpointSaved=true;}
 if(lteDestinationValid(std::string(ingestDestination.c_str(),ingestDestination.length())))lteEndpointReport=ingestDestination;
 if(ENABLE_LTE&&(LTE_HTTPS_ENABLED||LTE_HTTP_BENCH_COMMISSIONED)&&lteStreamAtBoot(spool,LTE_TEST_ONLY,LTE_AUTO_START)){
  lteCommissioning.start();lteDiagnostic.store("resuming_configured_LTE_stream");
 }else {lteCommissioning.stop();lteDiagnostic.store("paused_use_LTE_ONCE_or_LTE_ON");}
 securityStoreReady=securityStore.begin("solair-security",false);
 standaloneArmWanted=securityStoreReady&&securityStore.getBool("arm_req",false)&&ENABLE_SWITCHES&&ENABLE_ALARM&&ALARM_POLARITY_VERIFIED;
 if(standaloneArmWanted)Serial.println("# Standalone arm requested; waiting startup guard and enabled secure contacts");
 Serial.printf("# Alarm control output GPIO%d; mount-header substitution=%s\n",ALARM_PIN,ALARM_USE_MOUNT_HEADER?"enabled":"disabled");
 Serial.printf("# Security contacts: lid=%s mount=%s\n",ENABLE_SWITCHES?"enabled":"disabled",ENABLE_SWITCHES&&ENABLE_MOUNT_SWITCH?"enabled":"disabled");
 modules.begin();if(ENABLE_ACS)Serial.printf("# ACS_ADC source=%s init=%s calibration=%s\n",modules.acsSource(),modules.acsDiagnostic(),ACS_USE_ADS1115_A1?"ADS1115_GAIN_ONE_0.125mV_per_count":modules.acsAdc.calibration);WiFi.mode(LTE_TEST_ONLY?WIFI_OFF:WIFI_STA);if(!LTE_TEST_ONLY&&strlen(WIFI_SSID)){WiFi.begin(WIFI_SSID,WIFI_PASSWORD);configTime(0,0,"pool.ntp.org","time.cloudflare.com");}
 if(xTaskCreatePinnedToCore(acquisitionTask,"acquisition",12288,nullptr,1,nullptr,0)!=pdPASS||xTaskCreatePinnedToCore(transportTask,"transport",12288,nullptr,1,nullptr,0)!=pdPASS){forceOff(nullptr);Serial.println("# FATAL task startup");while(true)delay(1000);}
#if ESP_IDF_VERSION_MAJOR >= 5
 esp_task_wdt_config_t twdt_cfg = {.timeout_ms = 5000, .idle_core_mask = 0, .trigger_panic = true};
 esp_task_wdt_init(&twdt_cfg);
#else
 esp_task_wdt_init(5,true);
#endif
 esp_task_wdt_add(nullptr);Serial.println("# SOLAIR CPE v2 DISARMED; ARM/DISARM newline 115200; module flags are commissioning gates");
}
void loop(){
 static String cmd;static uint32_t motionStart=0,ledUntil=0;
 esp_task_wdt_reset();uint32_t now=millis();
 if(ENABLE_SWITCHES){lid.poll(now);if(ENABLE_MOUNT_SWITCH)mountContact.poll(now);portENTER_CRITICAL(&securityMux);lidStable=lid.stable;mountStable=mountContact.stable;if(lid.transition||(ENABLE_MOUNT_SWITCH&&mountContact.transition))stateDirty=true;portEXIT_CRITICAL(&securityMux);}
 unsigned count=0;while(Serial.available()&&count++<128){char ch=Serial.read();if(ch=='\n'||ch=='\r'){cmd.trim();if(!cmd.length()){cmd="";continue;}if(cmd.startsWith("{")){JsonDocument d;if(!deserializeJson(d,cmd)){String c=d["command"]|"";
 if(c=="lte_set_endpoint"){
  const JsonString value=d["url"].as<JsonString>();
  const std::string url(value.c_str()?value.c_str():"",value.size());
  if(!lteDestinationValid(url))Serial.println("# LTE destination rejected: use HTTPS DNS host and /api/ingest, max240 characters");
  else {LteDestinationUpdate update{};memcpy(update.url,url.data(),url.size());xQueueOverwrite(destinationQueue,&update);Serial.println("# LTE destination update queued; await saved address in telemetry");}
  cmd="";continue;
 }
 if((c=="lte_once"||c=="lte_start")&&d["utc_seconds"].is<uint32_t>()){
  uint32_t epoch=d["utc_seconds"].as<uint32_t>();if(lteUtcUsable(epoch))lteClockPending.store(epoch);
 }
 if(c=="standalone_arm")cmd="STANDALONE ARM";else if(c=="arm")cmd="ARM";else if(c=="disarm"||c=="alarm_off")cmd="DISARM";else if(c=="led_test")cmd="LED";else if(c=="lte_once")cmd="LTE ONCE";else if(c=="lte_start")cmd="LTE ON";else if(c=="lte_stop")cmd="LTE OFF";else if(c=="siren_test"||c=="siren"||c=="alarm_test")cmd="SIREN";}}
   cmd=cpeCommandText(std::string(cmd.c_str(),cmd.length())).c_str();
   if(cmd=="DISARM"){cancelStandaloneArm();disarm();Serial.println("# DISARMED output OFF");}
   else if(cmd=="LTE ONCE"||cmd=="LTE ON"){
    if(ENABLE_LTE&&LTE_HTTPS_ENABLED){if(cmd=="LTE ONCE")lteCommissioning.once();else {lteCommissioning.start();if(!lteSaveStreamIntent(spool,true))Serial.println("# LTE stream active but resume preference could not be saved");}lteDiagnostic.store(cmd=="LTE ONCE"?"one_upload_requested":"streaming_requested");Serial.println("# LTE upload requested; await actual server receipt");}
    else Serial.println("# LTE upload disabled in configuration");
   }
   else if(cmd=="LTE OFF"){lteCommissioning.stop();if(!lteSaveStreamIntent(spool,false))Serial.println("# LTE paused but stop preference could not be saved; check before reset");lteDiagnostic.store("paused_inflight_request_may_finish");Serial.println("# LTE uploads paused; an in-flight request may finish");}
   else if(cmd=="SENSORS OFF"){modules.running=false;Serial.println("# acquisition paused; contacts/security remain active");}
   else if(cmd=="SENSORS ON"){modules.running=true;Serial.println("# acquisition resumed for compile-time commissioned modules only");}
   else if(cmd=="STANDALONE ARM"){
    if(!securityStoreReady||!canResumeStandaloneArm(true,ENABLE_ALARM&&ALARM_POLARITY_VERIFIED,now,ENABLE_SWITCHES,lid.stable==LOW,cpeRequiredContactSecure(ENABLE_MOUNT_SWITCH,mountContact.stable==LOW),securityFsm.triggered()||manualTestLatched))Serial.println("# Standalone arm rejected: verify output gates, wait10s, secure enabled contacts, DISARM latched trip first");
    else if(!saveStandaloneArmIntent(securityStore,true))Serial.println("# Standalone arm rejected: preference not saved");
    else {standaloneArmWanted=true;portENTER_CRITICAL(&securityMux);const bool accepted=securityFsm.arm(now,ENABLE_SWITCHES,lid.stable==LOW,cpeRequiredContactSecure(ENABLE_MOUNT_SWITCH,mountContact.stable==LOW),manualTestLatched);if(accepted)stateDirty=true;portEXIT_CRITICAL(&securityMux);Serial.println(accepted?"# Standalone arm saved and ARMED; resumes after restart when enabled contacts secure; DISARM cancels":"# Standalone request saved; arm pending");}
   }
   else if(cmd=="ARM"){
    portENTER_CRITICAL(&securityMux);const bool accepted=securityFsm.arm(now,ENABLE_SWITCHES,lid.stable==LOW,cpeRequiredContactSecure(ENABLE_MOUNT_SWITCH,mountContact.stable==LOW),manualTestLatched);if(accepted)stateDirty=true;portEXIT_CRITICAL(&securityMux);
    if(accepted)Serial.println("# ARMED locally");
    else Serial.println("# ARM rejected: wait 10 s after boot, enable switches and secure enabled contacts, DISARM any latched trigger first");
   }
   else if(cmd=="SIREN"||cmd=="siren_test"||cmd=="alarm_test"){disarm();trigger("test");Serial.printf("# SIREN TEST requested %lu ms\n",(unsigned long)ALARM_DURATION_MS);}
   else if(cmd=="LED"&&!alarmActive){digitalWrite(LED_PIN,HIGH);ledUntil=millis()+300;Serial.println("# LED TEST requested 300 ms");}
   else Serial.println("# Unknown command; motion calibration uses measured configuration, not auto-approval");cmd="";
  }else if(cmd.length()<512)cmd+=ch;else cmd="";
 }
 applyRemoteCommand(now);
 if(standaloneArmWanted&&!securityFsm.armed()&&canResumeStandaloneArm(true,ENABLE_ALARM&&ALARM_POLARITY_VERIFIED,now,ENABLE_SWITCHES,lid.stable==LOW,cpeRequiredContactSecure(ENABLE_MOUNT_SWITCH,mountContact.stable==LOW),manualTestLatched)){
  portENTER_CRITICAL(&securityMux);const bool accepted=securityFsm.arm(now,ENABLE_SWITCHES,lid.stable==LOW,cpeRequiredContactSecure(ENABLE_MOUNT_SWITCH,mountContact.stable==LOW),manualTestLatched);if(accepted)stateDirty=true;portEXIT_CRITICAL(&securityMux);
  if(accepted)Serial.println("# Standalone ARMED after startup/contact guard");
 }
 if(ledUntil&&int32_t(now-ledUntil)>=0){if(!alarmActive)digitalWrite(LED_PIN,LOW);ledUntil=0;}
 if(securityFsm.armed()&&!securityFsm.triggered()){if(lid.stable==HIGH)trigger("lid");else if(ENABLE_MOUNT_SWITCH&&mountContact.stable==HIGH)trigger("mount");else if(ENABLE_MOTION&&MOTION_CALIBRATED&&motionNow){if(!motionStart)motionStart=now;if(uint32_t(now-motionStart)>=200)trigger("motion");}else motionStart=0;}
 // Commands/contact processing can start an alarm after the loop's `now` was
 // sampled. Re-sample after activation; an older sample must never cut it off.
 // The independent esp_timer cutoff remains active as before.
 portENTER_CRITICAL(&securityMux);
 const bool alarmExpired=alarmActive&&cpeAlarmDurationElapsed(millis(),alarmSince,ALARM_DURATION_MS);
 portEXIT_CRITICAL(&securityMux);
 if(alarmExpired)forceOff(nullptr);
 vTaskDelay(pdMS_TO_TICKS(2));
}

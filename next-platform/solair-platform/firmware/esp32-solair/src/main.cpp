#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <time.h>
#if __has_include("solair_config.h")
#include "solair_config.h"
#else
#include "config.example.h"
#endif
#include "sensors.h"
constexpr char FW[]="solair-1.0.0";
MotionSensor motion;AnalogSensors analog;GPSModule gps;LTEProbe lte;DebouncedSwitch lid,mountSwitch;
Preferences prefs;String bootId;uint32_t sequence=0,eventNumber=0;bool armed=false,alarmActive=false,lastMotion=false;
SemaphoreHandle_t queueMutex;
unsigned long lastSample=0,lastWifi=0,lastSync=0;String serialBuffer;
// Persistent bounded FIFO: up to 40 frames. Overflow is explicitly reported, never fabricated.
String queue[40];int queued=0;uint32_t dropped=0;
void persistQueue(){JsonDocument d;JsonArray a=d["frames"].to<JsonArray>();for(int i=0;i<queued;i++)a.add(queue[i]);String s;serializeJson(d,s);prefs.putString("queue",s);}
void loadQueue(){JsonDocument d;if(!deserializeJson(d,prefs.getString("queue","{}"))){for(JsonVariant v:d["frames"].as<JsonArray>()){if(queued<40)queue[queued++]=v.as<String>();}}}
void enqueue(const String&s,bool event){
 if(!strlen(WIFI_SSID))return;
 xSemaphoreTake(queueMutex,portMAX_DELAY);
 if(queued>=40){
  int replace=-1;
  if(event)for(int i=0;i<queued;i++)if(queue[i].indexOf("\"event_id\"")<0){replace=i;break;}
  dropped++;
  if(replace<0){xSemaphoreGive(queueMutex);return;}
  for(int i=replace+1;i<queued;i++)queue[i-1]=queue[i];
  queued--;
 }
 queue[queued++]=s;
 if(event)persistQueue();
 xSemaphoreGive(queueMutex);
}
void output(){bool active=alarmActive&&SIREN_PHYSICALLY_VERIFIED&&ENABLE_POWERED_SIREN;digitalWrite(27,ALARM_ACTIVE_HIGH?active:!active);digitalWrite(BENCH_LED_PIN,alarmActive?HIGH:LOW);}
String timestamp(){time_t n=time(nullptr);if(n<1700000000)return "";struct tm tm;gmtime_r(&n,&tm);char b[32];strftime(b,sizeof(b),"%Y-%m-%dT%H:%M:%SZ",&tm);return String(b);}
void makeTelemetry(const char* event){
 analog.update();JsonDocument d;d["schema_version"]=1;d["device_id"]=DEVICE_ID;d["firmware_version"]=FW;d["boot_id"]=bootId;d["sequence"]=sequence++;d["device_uptime_ms"]=millis();String ts=timestamp();if(ts.length())d["device_timestamp"]=ts;else d["device_timestamp"]=nullptr;
 d["source_type"]="hardware";d["transport"]="usb";
 auto health=d["sensor_health"].to<JsonObject>();health["mpu6050"]=motion.available?"ok":(motion.fault?"fault":"absent");health["switches"]="ok";health["ads1115"]=analog.available?"ok":(analog.fault?"fault":"absent");health["acs758"]=ENABLE_ACS?(ACS_CALIBRATED?"ok":"uncalibrated"):"absent";health["gps"]=ENABLE_GPS?(gps.fix()?"ok":"fault"):"absent";health["lte"]=ENABLE_LTE_DIAGNOSTICS?(lte.detected?"ok":"fault"):"absent";health["wind"]="absent";health["event_buffer"]=dropped?"fault":"ok";
 // High-voltage inputs and independent pack current remain NULL until commissioned.
 d["battery_voltage_v"]=nullptr;d["battery_current_a"]=nullptr;d["solar_voltage_v"]=nullptr;d["solar_current_a"]=nullptr;d["wind_voltage_v"]=nullptr;d["wind_current_a"]=nullptr;
 d["calibration_status"]="unverified";
 if(motion.available){auto a=d["accelerometer"].to<JsonArray>();a.add(motion.a.acceleration.x);a.add(motion.a.acceleration.y);a.add(motion.a.acceleration.z);auto g=d["gyroscope"].to<JsonArray>();g.add(motion.g.gyro.x*RAD_TO_DEG);g.add(motion.g.gyro.y*RAD_TO_DEG);g.add(motion.g.gyro.z*RAD_TO_DEG);}
 d["lid_raw"]=lid.stable;d["mount_raw"]=mountSwitch.stable;d["lid_state"]=lid.stable==LOW?"secure":"tampered";d["mount_state"]=mountSwitch.stable==LOW?"secure":"tampered";d["motion_detected"]=lastMotion;d["armed"]=armed;d["alarm_active"]=alarmActive;d["siren_verified"]=SIREN_PHYSICALLY_VERIFIED;
 if(analog.available){auto a=d["ads_raw"].to<JsonArray>();auto v=d["ads_voltage"].to<JsonArray>();for(int i=0;i<4;i++){a.add(analog.counts[i]);v.add(analog.volts[i]);}d["ads_gain"]="GAIN_ONE ±4.096 V";if(ENABLE_ACS){d["acs_output_v"]=analog.volts[0]*ACS_FRONTEND_SCALE;if(ACS_CALIBRATED)d["acs_zero_v"]=ACS_ZERO_V;else d["acs_zero_v"]=nullptr;}}
 d["gps_fix"]=gps.fix();if(gps.fix()){d["latitude"]=gps.parser.location.lat();d["longitude"]=gps.parser.location.lng();d["gps_fix_age_ms"]=gps.parser.location.age();d["satellites"]=gps.parser.satellites.value();}
 // No LTE network registration claim from an AT response.
 if(event){d["event_id"]=String(eventNumber++);d["event_type"]=event;}
 String s;serializeJson(d,s);Serial.println(s);d["transport"]="wifi";serializeJson(d,s="");enqueue(s,event!=nullptr);
}
void commands(){while(Serial.available()){char c=Serial.read();if(c=='\n'){JsonDocument d;if(!deserializeJson(d,serialBuffer)){String cmd=d["command"]|"";if(cmd=="arm")armed=true;else if(cmd=="disarm"){armed=false;alarmActive=false;}else if(cmd=="calibrate_motion")motion.calibrate();else if(cmd=="alarm_off")alarmActive=false;else if(cmd=="led_test"){digitalWrite(BENCH_LED_PIN,HIGH);delay(300);digitalWrite(BENCH_LED_PIN,LOW);}output();}serialBuffer="";}else if(serialBuffer.length()<512)serialBuffer+=c;else serialBuffer="";}}
void syncWiFi(){if(!strlen(WIFI_SSID))return;if(WiFi.status()!=WL_CONNECTED){if(millis()-lastWifi>15000){WiFi.begin(WIFI_SSID,WIFI_PASSWORD);lastWifi=millis();}return;}if(millis()-lastSync<500||!strlen(ROOT_CA)||!strlen(DEVICE_TOKEN))return;
 xSemaphoreTake(queueMutex,portMAX_DELAY);String frame=queued?queue[0]:String("");xSemaphoreGive(queueMutex);if(!frame.length())return;lastSync=millis();WiFiClientSecure client;client.setCACert(ROOT_CA);HTTPClient http;http.setTimeout(1200);if(!http.begin(client,INGEST_URL))return;http.addHeader("Content-Type","application/json");http.addHeader("Authorization",String("Bearer ")+DEVICE_TOKEN);int code=http.POST(frame);http.end();if((code>=200&&code<300)||code==409){
  xSemaphoreTake(queueMutex,portMAX_DELAY);
  // A priority event may evict this heartbeat while HTTP is in flight.
  // Remove only the frame actually acknowledged, never its replacement.
  if(queued>0&&queue[0]==frame){
   for(int i=1;i<queued;i++)queue[i-1]=queue[i];
   queued--;
   persistQueue();
  }
  xSemaphoreGive(queueMutex);
 }
}
void networkTask(void*){for(;;){syncWiFi();vTaskDelay(pdMS_TO_TICKS(100));}}
void setup(){Serial.begin(115200);pinMode(27,OUTPUT);digitalWrite(27,ALARM_ACTIVE_HIGH?LOW:HIGH);pinMode(BENCH_LED_PIN,OUTPUT);digitalWrite(BENCH_LED_PIN,LOW);Wire.begin(21,22);lid.begin(25);mountSwitch.begin(26);motion.begin();analog.begin();gps.begin();lte.begin();queueMutex=xSemaphoreCreateMutex();prefs.begin("solair",false);bootId=String((uint32_t)esp_random(),HEX);loadQueue();WiFi.mode(WIFI_STA);if(strlen(WIFI_SSID)){WiFi.begin(WIFI_SSID,WIFI_PASSWORD);configTime(0,0,"pool.ntp.org","time.google.com");}xTaskCreatePinnedToCore(networkTask,"solair-network",8192,nullptr,1,nullptr,0);}
void loop(){commands();lid.update();mountSwitch.update();gps.update();lte.update();bool m=motion.update();const char* event=nullptr;if(armed&&lid.transitioned&&lid.stable==HIGH)event="lid";else if(armed&&mountSwitch.transitioned&&mountSwitch.stable==HIGH)event="mount";else if(armed&&m&&!lastMotion)event="motion";lastMotion=m;if(event){alarmActive=true;output();makeTelemetry(event);}if(millis()-lastSample>2000){lastSample=millis();makeTelemetry(nullptr);}delay(5);}

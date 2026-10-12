#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <esp_timer.h>
#include <esp_system.h>
#include <Preferences.h>
#include <esp_sntp.h>
#include <sys/time.h>
#include <atomic>
#include "durable-events.h"
#include "sender-clock.h"
#include "durable-ack.h"
#include "config.h"
#if __has_include("secrets.h")
#include "secrets.h"
#else
const char *WIFI_SSID = "", *WIFI_PASSWORD = "", *INGEST_URL = "", *DEVICE_TOKEN = "";
#endif

// Uses only pinned ESP32 core libraries. No remote actuation endpoint.
static QueueHandle_t samples, events;
static SemaphoreHandle_t eventStorageMutex;
struct NvsEventStore {
  Preferences preferences; bool ready=false;
  size_t length(const char *key) { if(!ready) return 1; if(!preferences.isKey(key)) return 0; size_t bytes=preferences.getBytesLength(key); return bytes ? bytes : 1; }
  size_t read(const char *key,void *data,size_t size) { return ready ? preferences.getBytes(key,data,size) : 0; }
  size_t write(const char *key,const void *data,size_t size) { return ready ? preferences.putBytes(key,data,size) : 0; }
  bool remove(const char *key) { return ready && preferences.remove(key); }
};
static NvsEventStore eventStore;
static DurableEvents<NvsEventStore> durableEvents(eventStore);
static std::atomic<uint64_t> clockSyncedAtMs{UINT64_MAX};
static esp_timer_handle_t sirenTimer = nullptr;
static void forceSirenOff(void *) { digitalWrite(SIREN_GPIO, LOW); }
static String bootId;
static uint64_t sensorSequence = 0, eventSequence = 0;
static bool armed = false, triggered = false;
static uint64_t sirenUntil = 0, motionSince = 0;
static bool motionPending = false;
static String command;
struct Packet { char json[2200]; };
struct Switch {
  explicit Switch(int gpio) : pin(gpio) {}
  int pin; bool raw = true, stable = true, known = false; uint64_t changed = 0;
  void poll(uint64_t now) {
    bool value = digitalRead(pin) == HIGH;
    if (value != raw) { raw = value; changed = now; }
    if (now - changed >= DEBOUNCE_MS) { stable = raw; known = true; }
  }
};
static Switch lid{LID_GPIO}, mount{MOUNT_GPIO};
static uint64_t uptime() { return uint64_t(esp_timer_get_time()) / 1000; }
static String number(uint64_t n) { char b[24]; snprintf(b, sizeof(b), "%llu", (unsigned long long)n); return String(b); }
static const char *security() { return triggered ? "TRIGGERED" : armed ? "ARMED" : "DISARMED"; }
static void clockSynced(struct timeval *time) {
  clockSyncedAtMs.store(time && time->tv_sec >= 1704067200LL && time->tv_sec < 4102444800LL ? uptime() : UINT64_MAX);
}
static String senderUtcFields() {
  struct timeval time{}; gettimeofday(&time,nullptr);
  uint64_t syncedAt=clockSyncedAtMs.load();
  if (!senderClockValid(time.tv_sec,syncedAt!=UINT64_MAX,uptime(),syncedAt)) return ",\"sampledAtUtc\":null,\"clockSynchronized\":false";
  struct tm utc{}; time_t seconds=time.tv_sec; gmtime_r(&seconds,&utc);
  char date[24], stamp[32]; strftime(date,sizeof(date),"%Y-%m-%dT%H:%M:%S",&utc);
  snprintf(stamp,sizeof(stamp),"%s.%03ldZ",date,long(time.tv_usec/1000));
  return String(",\"sampledAtUtc\":\"")+stamp+"\",\"clockSynchronized\":true";
}
static String envelope(const char *kind, uint64_t seq, uint64_t time) {
  return String("{\"schemaVersion\":2,\"messageType\":\"") + kind + "\",\"source\":\"device\",\"deviceId\":\"ET-01\",\"firmwareVersion\":\"SOLAIR-SOFTWARE-2\",\"sessionId\":\"" + bootId + "\",\"sequence\":" + number(seq) + senderUtcFields() + ",\"uptimeMs\":" + number(time);
}
static bool readReg(uint8_t reg, uint8_t *out, size_t count) {
  Wire.beginTransmission(MPU_ADDRESS); Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(MPU_ADDRESS, count, true) != count || Wire.available() != int(count)) { while (Wire.available()) Wire.read(); return false; }
  for (size_t i = 0; i < count; i++) out[i] = Wire.read();
  return true;
}
static bool writeReg(uint8_t reg, uint8_t value) { Wire.beginTransmission(MPU_ADDRESS); Wire.write(reg); Wire.write(value); return Wire.endTransmission() == 0; }
static bool configMatches() {
  uint8_t id, regs[4], power;
  return readReg(0x75, &id, 1) && id == 0x68 && readReg(0x19, regs, 4) && regs[0] == 0 && regs[1] == 4 && regs[2] == 0 && regs[3] == 0 && readReg(0x6B, &power, 1) && power == 1;
}
static bool imuReady = false;
static const char *imuFault = "SENSOR_INIT_OR_CONFIG_FAILED";
static float a[3], g[3];
static int16_t word(uint8_t *p) { return int16_t((uint16_t(p[0]) << 8) | p[1]); }
static bool readImu() {
  if (!imuReady) return false;
  if (!configMatches()) { imuFault = "IDENTITY_OR_CONFIG_READ_FAILED"; imuReady = false; return false; }
  uint8_t bytes[14];
  if (!readReg(0x3B, bytes, 14)) { imuFault = "SENSOR_BURST_READ_FAILED"; imuReady = false; return false; }
  for (int i = 0; i < 3; i++) { a[i] = word(bytes + 2*i) * (9.80665f/16384.0f); g[i] = word(bytes + 8 + 2*i) * ((PI/180.0f)/131.0f); }
  return true;
}
static String vectorJson(float *v) { return String("{\"x\":") + String(v[0],6) + ",\"y\":" + String(v[1],6) + ",\"z\":" + String(v[2],6) + "}"; }
static void enqueueSample(uint64_t start, uint64_t end, bool valid) {
  String json = envelope("sensor_telemetry", sensorSequence++, end) + ",\"readStartUptimeMs\":" + number(start) + ",\"readEndUptimeMs\":" + number(end);
  json += ",\"accelerationMps2\":" + (valid ? vectorJson(a) : String("null")) + ",\"angularVelocityRadPerSec\":" + (valid ? vectorJson(g) : String("null"));
  json += String(",\"imuStatus\":\"") + (valid ? "VALID" : !WIRING_CONFIRMED ? "BLOCKED" : "READ_ERROR") + "\",\"imuFaultCode\":" + (valid ? String("null") : String("\"") + (!WIRING_CONFIRMED ? "UNCONFIRMED_WIRING" : imuFault) + "\"");
  // Init failure uses the contract's init fault vocabulary.
  if (!valid && WIRING_CONFIRMED && String(imuFault) == "SENSOR_INIT_OR_CONFIG_FAILED") json.replace("READ_ERROR", "INIT_ERROR");
  const char *switchStatus = lid.known && mount.known ? "VALID" : !lid.known && !mount.known ? "UNKNOWN" : "FAULT";
  String switchFault = lid.known == mount.known ? "null" : lid.known ? "\"MOUNT_INPUT_UNAVAILABLE\"" : "\"LID_INPUT_UNAVAILABLE\"";
  json += String(",\"axisFrame\":\"MPU6050_CHIP\",\"calibrationRef\":null,\"lidState\":\"") + (lid.known ? lid.stable ? "OPEN" : "CLOSED" : "UNKNOWN") + "\",\"mountState\":\"" + (mount.known ? mount.stable ? "DETACHED" : "ATTACHED" : "UNKNOWN") + "\",\"switchStatus\":\"" + switchStatus + "\",\"switchFaultCode\":" + switchFault + ",\"securityState\":\"" + security() + "\"";
  json += ",\"batteryVoltageV\":null,\"batterySocPercent\":null,\"timeToEmptySeconds\":null,\"solarPowerW\":null,\"windPowerW\":null,\"latitudeDeg\":null,\"longitudeDeg\":null,\"gpsFixValid\":null,\"speedKmh\":null,\"electromagneticBrakeActive\":null}";
  Packet packet{}; json.toCharArray(packet.json, sizeof(packet.json)); xQueueOverwrite(samples, &packet);
}
static void trigger(const char *kind, uint64_t now) {
  triggered = true; sirenUntil = now + SIREN_MS;
  bool outputEnabled = false;
  if (SIREN_ENABLED && sirenTimer) {
    esp_timer_stop(sirenTimer);
    // Output can go HIGH only after an independent cutoff is successfully armed.
    outputEnabled = esp_timer_start_once(sirenTimer, uint64_t(SIREN_MS) * 1000) == ESP_OK;
  }
  digitalWrite(SIREN_GPIO, outputEnabled ? HIGH : LOW);
  if (SIREN_ENABLED && !outputEnabled) Serial.println("SIREN_TIMER_FAILED output forced OFF");
  String json = envelope("tamper_event", eventSequence++, now) + ",\"eventType\":\"" + kind + "\",\"detectorVersion\":\"BENCH-SWITCH50MS-MOTION-OPTIN-1\",\"securityState\":\"TRIGGERED\",\"evidenceTelemetrySequence\":null}";
  Packet packet{}; json.toCharArray(packet.json, sizeof(packet.json));
  bool persisted=false;
  if (xSemaphoreTake(eventStorageMutex,pdMS_TO_TICKS(100))==pdTRUE) { persisted=durableEvents.append(packet.json); xSemaphoreGive(eventStorageMutex); }
  if (!persisted) {
    Serial.println("EVENT_STORAGE_FULL_OR_FAILED: RAM fallback only; reset may lose this event");
    if (xQueueSend(events, &packet, 0) != pdTRUE) Serial.println("EVENT_QUEUE_FULL event not retained; local alarm still operates");
  }
  Serial.printf("LOCAL_EVENT %s uptime_ms=%llu siren=%s max_ms=%lu\n", kind, (unsigned long long)now, outputEnabled ? "ON" : "DISABLED", (unsigned long)SIREN_MS);
}
static int post(const String &json) {
  WiFiClient client; HTTPClient http;
  http.setConnectTimeout(1000); http.setTimeout(1000);
  if (!http.begin(client, INGEST_URL)) return -1;
  http.addHeader("Content-Type", "application/json"); http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  int status = http.POST(json);
  if (status==202) {
    String ack=http.getString();
    if (!durableAcknowledgement(status,ack.c_str())) status=-2;
  }
  http.end(); return status;
}
static void networkTask(void *) {
  // Blocking Wi-Fi/HTTP work never runs in the GPIO/alarm loop.
  WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true); WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint64_t heartbeatSequence = 0, lastHeartbeat = 0, lastReconnect = 0;
  bool initialized = false, pendingEvent = false, timeStarted=false;
  uint64_t lastEventAttempt=0;
  String firstHeartbeat = envelope("device_heartbeat", 0, uptime()) + "}";
  Packet event{};
  for (;;) {
    uint64_t now = uptime();
    if (WiFi.status() != WL_CONNECTED) {
      if (now-lastReconnect >= 10000) { WiFi.reconnect(); lastReconnect=now; Serial.println("WIFI_OFFLINE local detector remains active"); }
    } else if (!initialized) {
      if (!timeStarted) { sntp_set_time_sync_notification_cb(clockSynced); configTime(0,0,NTP_SERVER_PRIMARY,NTP_SERVER_SECONDARY); timeStarted=true; }
      int status = post(firstHeartbeat); Serial.printf("BOOT_HEARTBEAT HTTP=%d\n", status);
      if (status == 202) { initialized = true; heartbeatSequence = 1; lastHeartbeat = now; }
    } else {
      if (now-lastHeartbeat >= 5000) { int status=post(envelope("device_heartbeat", heartbeatSequence++, uptime()) + "}"); Serial.printf("HEARTBEAT HTTP=%d\n",status); lastHeartbeat=now; }
      if(now-lastEventAttempt>=5000) {
        lastEventAttempt=now;
        char durable[DurableEvents<NvsEventStore>::MAX_JSON]{}; unsigned slot=0; bool found=false;
        if(xSemaphoreTake(eventStorageMutex,pdMS_TO_TICKS(100))==pdTRUE) { found=durableEvents.next(durable,sizeof(durable),slot); xSemaphoreGive(eventStorageMutex); }
        if(found) {
          int status=post(durable); Serial.printf("DURABLE_EVENT HTTP=%d\n",status);
          if(status==202 && xSemaphoreTake(eventStorageMutex,pdMS_TO_TICKS(100))==pdTRUE) {
            if(!durableEvents.acknowledge(slot,durable)) Serial.println("EVENT_STORAGE_DELETE_FAILED: safe duplicate retry retained");
            xSemaphoreGive(eventStorageMutex);
          }
        }
        if (!pendingEvent) pendingEvent = xQueueReceive(events, &event, 0) == pdTRUE;
        if (pendingEvent) { int status=post(event.json); Serial.printf("RAM_EVENT HTTP=%d\n", status); if (status==202) pendingEvent=false; }
      }
      Packet sample{};
      if (xQueueReceive(samples, &sample, 0) == pdTRUE) { int status=post(sample.json); Serial.printf("SENSOR HTTP=%d\n", status); }
    }
    vTaskDelay(pdMS_TO_TICKS(250));
  }
}
void setup() {
  // External gate pulldown is essential while reset/boot leaves GPIO floating.
  digitalWrite(SIREN_GPIO, LOW); pinMode(SIREN_GPIO, OUTPUT); digitalWrite(SIREN_GPIO, LOW);
  Serial.begin(115200); Serial.println("SOLAIR-SOFTWARE-2 DISARMED; commands ARM / DISARM; siren timeout 5 seconds");
  esp_timer_create_args_t timerArgs{};
  timerArgs.callback=forceSirenOff; timerArgs.name="siren-off";
  if(esp_timer_create(&timerArgs,&sirenTimer)!=ESP_OK) { sirenTimer=nullptr; Serial.println("SIREN_TIMER_FAILED output remains OFF"); }
  uint8_t uuid[16]; esp_fill_random(uuid, sizeof(uuid)); uuid[6]=(uuid[6]&15)|64; uuid[8]=(uuid[8]&63)|128;
  char id[37]; snprintf(id,sizeof(id),"%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",uuid[0],uuid[1],uuid[2],uuid[3],uuid[4],uuid[5],uuid[6],uuid[7],uuid[8],uuid[9],uuid[10],uuid[11],uuid[12],uuid[13],uuid[14],uuid[15]); bootId=id;
  if (WIRING_CONFIRMED) {
    pinMode(LID_GPIO, INPUT_PULLUP); pinMode(MOUNT_GPIO, INPUT_PULLUP);
    bool busReady=Wire.begin(SDA_GPIO,SCL_GPIO,100000); Wire.setTimeOut(20);
    imuReady=busReady && writeReg(0x6B,1) && writeReg(0x19,0) && writeReg(0x1A,4) && writeReg(0x1B,0) && writeReg(0x1C,0) && configMatches();
    delay(100); // MPU settling while disarmed and siren off.
  } else Serial.println("BLOCKED UNCONFIRMED_WIRING; edit config only after checks");
  samples=xQueueCreate(1,sizeof(Packet)); events=xQueueCreate(16,sizeof(Packet));
  eventStorageMutex=xSemaphoreCreateMutex();
  if (!samples || !events || !eventStorageMutex) { Serial.println("FATAL QUEUE allocation; remain DISARMED"); while(true) delay(1000); }
  eventStore.ready=eventStore.preferences.begin("solair-events",false);
  Serial.printf("EVENT_STORAGE %s corrupt_slots=%u (quarantined; no automatic purge)\n",eventStore.ready ? "READY" : "FAILED_RAM_ONLY",eventStore.ready ? durableEvents.corruptCount() : 0);
  if (*WIFI_SSID && *INGEST_URL && strlen(DEVICE_TOKEN)==64) {
    if (xTaskCreatePinnedToCore(networkTask,"network",12288,nullptr,1,nullptr,0)!=pdPASS) Serial.println("NETWORK_TASK_FAILED local detector available");
  } else Serial.println("NETWORK_UNCONFIGURED; run private provisioning script");
}
void loop() {
  uint64_t now=uptime();
  // Cut off siren before any bounded I2C work. DISARM also clears the latch.
  if (sirenUntil && now>=sirenUntil) { digitalWrite(SIREN_GPIO,LOW); sirenUntil=0; Serial.println("SIREN_OFF timeout; TRIGGERED latch retained until DISARM"); }
  while (Serial.available()) {
    char c=Serial.read();
    if(c=='\n' || c=='\r') {
      command.trim();
      if(command=="DISARM") { armed=false; triggered=false; motionPending=false; if(sirenTimer) esp_timer_stop(sirenTimer); digitalWrite(SIREN_GPIO,LOW); sirenUntil=0; Serial.println("DISARMED SIREN_OFF"); }
      else if(command=="ARM") {
        if(!WIRING_CONFIRMED || now<STARTUP_MS || !lid.known || !mount.known || lid.stable || mount.stable || triggered) Serial.println("ARM_REJECTED: wait 10s, close both contacts, DISARM to clear latch");
        else { armed=true; motionPending=false; Serial.println("ARMED local detector; network not required"); }
      }
      command="";
    } else if(command.length()<32) command+=c;
  }
  if(WIRING_CONFIRMED) { lid.poll(now); mount.poll(now); }
  if(armed && !triggered) {
    if(lid.known && lid.stable) trigger("LID_OPEN_DETECTED",now);
    else if(mount.known && mount.stable) trigger("MOUNT_DETACH_DETECTED",now);
  }
  static uint64_t lastRead=0, lastSample=0;
  if(now-lastRead>=50) {
    uint64_t start=uptime(); bool valid=WIRING_CONFIRMED && readImu(); uint64_t end=uptime(); lastRead=end;
    if(armed && !triggered && MOTION_ENABLED && valid) {
      float an=sqrtf(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]), gn=sqrtf(g[0]*g[0]+g[1]*g[1]+g[2]*g[2]);
      bool moving=fabsf(an-9.80665f)>MOTION_ACCEL_DELTA_M_S2 || gn>MOTION_GYRO_RAD_S;
      if(moving && !motionPending) { motionSince=end; motionPending=true; }
      if(!moving) motionPending=false;
      if(motionPending && end-motionSince>=MOTION_HOLD_MS) trigger("MOTION_TAMPER_DETECTED",end);
    } else motionPending=false;
    if(end-lastSample>=3000) { enqueueSample(start,end,valid); lastSample=end; }
  }
  delay(5);
}

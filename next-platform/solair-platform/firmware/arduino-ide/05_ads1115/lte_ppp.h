#pragma once
#include <PPP.h>
#include <ArduinoJson.h>
#include <NetworkClientSecure.h>
#include <HTTPClient.h>
#include <sys/time.h>
#include <lwip/netdb.h>
#include <cerrno>
#include <atomic>
#include <esp_netif_ppp.h>
#include "lte_https.h"
#include "lte_ppp_policy.h"

// HTTPClient decodes chunked responses into this bounded sink. Only small,
// whitelisted rejection codes are used; raw server bodies are never logged.
class LteReplyBuffer : public Stream {
public:
 String text;bool overflow=false;
 int available() override{return 0;}
 int read() override{return -1;}
 int peek() override{return -1;}
 void flush() override{}
 size_t write(uint8_t value) override{return write(&value,1);}
 size_t write(const uint8_t* bytes,size_t size) override{
  if(text.length()+size>1024){overflow=true;return 0;}
  return text.concat(reinterpret_cast<const char*>(bytes),size)?size:0;
 }
};

// Keep the HTTP hostname for SNI/certificate verification while selecting IPv4
// addresses for this IPv4 PPP session. No HTTP/header/body bytes are sent until
// the certificate-verified handshake succeeds.
class LteSecureClient : public NetworkClientSecure {
public:
 const char* failure="PPP_TCP_connection_failed";
 String detail;
 int connect(const char* host,uint16_t port,int32_t timeout) override {
  detail="";_timeout=timeout;
  addrinfo hints={};hints.ai_family=AF_INET;hints.ai_socktype=SOCK_STREAM;
  addrinfo* addresses=nullptr;
  const int lookup=lwip_getaddrinfo(host,nullptr,&hints,&addresses);
  if(lookup||!addresses){failure="PPP_DNS_lookup_failed";detail=String("DNS error=")+lookup;return 0;}
  unsigned attempts=0;
  for(auto* a=addresses;a&&attempts<2;a=a->ai_next){
   if(a->ai_family!=AF_INET)continue;
   ++attempts;
   const IPAddress ip(((sockaddr_in*)a->ai_addr)->sin_addr.s_addr);
   // This postpones only the handshake, so TCP and TLS failures are distinct.
   // The CA and hostname are configured by the standard secure client here.
   _stillinPlainStart=true;errno=0;
   if(!NetworkClientSecure::connect(ip,port,host,_CA_cert,_cert,_private_key)){
    const int socketError=errno;char message[112]={};const int tlsError=lastError(message,sizeof(message));
    if(tlsError < -1){failure="PPP_TLS_configuration_failed";detail=String("TLS setup ")+tlsError+": "+message+"; free="+ESP.getFreeHeap()+" largest="+ESP.getMaxAllocHeap();}
    else {failure="PPP_TCP_connection_failed";detail=String("TCP ")+ip.toString()+":"+port+" errno="+socketError;}
    continue;
   }
   const int tlsResult=ssl_starttls_handshake(sslclient.get());
   sslclient->last_error=tlsResult;
   if(tlsResult<0){
    char message[112]={};lastError(message,sizeof(message));
    failure="PPP_TLS_verification_or_handshake_failed";
    detail=String("TLS ")+tlsResult+": "+message;stop();continue;
   }
   _stillinPlainStart=false;detail="";lwip_freeaddrinfo(addresses);return 1;
  }
  lwip_freeaddrinfo(addresses);return 0;
 }
};

// Used only with explicit LTE-only commissioning on Arduino 3. The transport
// task transfers UART2 ownership; no raw AT polling runs while PPP owns it.
template<class Io> class LtePppTransport {
 Io& io;bool owns=false;
 LtePppRetryPolicy retry;
 std::atomic<int> lastPppError{0},lastPppPhase{0};
 esp_event_handler_instance_t statusObserver=nullptr;
 static void pppStatus(void* arg,esp_event_base_t,int32_t event,void*){
  auto* self=static_cast<LtePppTransport*>(arg);
  if(event>0&&event<0x100)self->lastPppError.store(event);
  else if(event>=0x100)self->lastPppPhase.store(event);
 }
 void connectionDetail(const char* stage){
  tlsError=String(stage)+"; PPP error="+lastPppError.load()+" phase="+lastPppPhase.load();
  if(PPP.mode()==ESP_MODEM_MODE_COMMAND){
   String reason;
   if(PPP.cmd("AT+CEER",reason,2000)){
    reason.replace("\r"," ");reason.replace("\n"," ");
    tlsError+="; "+reason.substring(0,90);
   }
  }
  tlsError=tlsError.substring(0,160);
 }
public:
 const char* diagnostic="PPP_not_started";
 String tlsError,serverReply;
 explicit LtePppTransport(Io& channel):io(channel){}
 bool ownsUart()const{return owns;}
 bool connected()const{return owns&&PPP.hasIP();}
 void stop(){
  if(!owns)return;
  if(PPP.handle())PPP.mode(ESP_MODEM_MODE_COMMAND);
  PPP.end();owns=false;io.openUart();
  // Explicitly hang up even when +++ successfully returned command mode.
  if(!io.recoverCommand())diagnostic="PPP_stop_AT_recovery_failed";
  else if(!io.finishDataCall())diagnostic="PPP_previous_call_hangup_failed";
 }
 int post(const LteHttpsSettings& c,const std::string& body){
  tlsError="";serverReply="";
  if(!lteHttpsSettingsValid(c)){diagnostic="https_config_or_CA_missing";return -1;}
  if(!owns){
   std::string apn=c.apn;
   // An unset modem RTC must not block dialing: obtain ESP32 UTC over PPP
   // below before the certificate-verified HTTPS connection. Legacy modem
   // HTTPS still requires its own valid clock through LteHttps.
   io.clockValid();
   if(apn.empty()){
    if(!io.command("AT+CGDCONT?","OK",5000)){diagnostic="PPP_APN_query_failed";return -1;}
    apn=ltePdpApn(io.response.c_str());
   }
   if(apn.empty()||apn.size()>100||!lteAtValue(apn)){diagnostic="PPP_needs_confirmed_APN_from_current_profile";return -1;}
   if(!io.finishDataCall()){diagnostic="PPP_previous_call_hangup_failed";return -1;}
   // Stop the HardwareSerial owner before installing esp_modem's UART2 driver.
   io.closeUart();owns=true;
   if(!PPP.setApn(apn.c_str())||!PPP.setPins(LTE_TX,LTE_RX,-1,-1,ESP_MODEM_FLOW_CONTROL_NONE)||!PPP.begin(PPP_MODEM_SIM7600,2,LTE_BAUD)){
    diagnostic="PPP_UART2_initialization_failed";stop();return -1;
   }
   if(!statusObserver&&esp_event_handler_instance_register(NETIF_PPP_STATUS,ESP_EVENT_ANY_ID,pppStatus,this,&statusObserver)!=ESP_OK){
    diagnostic="PPP_status_observer_failed";stop();return -1;
   }
  }
  if(!PPP.hasIP()){
   if(PPP.mode()==ESP_MODEM_MODE_DATA&&!PPP.mode(ESP_MODEM_MODE_COMMAND)){
    diagnostic="PPP_recovery_failed";stop();return -1;
   }
   lastPppError.store(0);lastPppPhase.store(0);
   if(!PPP.mode(ESP_MODEM_MODE_DATA)){
    diagnostic="PPP_dial_or_PDP_activation_rejected";connectionDetail("dial rejected");stop();return -1;
   }
   if(!PPP.waitStatusBits(ESP_NETIF_HAS_IP_BIT,45000)){
    diagnostic=lastPppError.load()==NETIF_PPP_ERRORAUTHFAIL?"PPP_authentication_rejected":"PPP_IP_negotiation_timed_out";
    connectionDetail("IP timeout");stop();return -1;
   }
  }
  if(!PPP.setDefault()){diagnostic="PPP_default_route_failed";return -1;}
  if(!lteUtcUsable(time(nullptr))){
   configTime(0,0,"time.cloudflare.com","pool.ntp.org");
   uint32_t started=millis();while((!lteUtcUsable(time(nullptr)))&&uint32_t(millis()-started)<12000)vTaskDelay(pdMS_TO_TICKS(50));
   if(!lteUtcUsable(time(nullptr))){diagnostic="ESP32_clock_missing_use_website_LTE_button";return -1;}
  }
  LteSecureClient tls;tls.setCACert(c.ca.c_str());tls.setHandshakeTimeout(30);
  HTTPClient http;http.setConnectTimeout(20000);http.setTimeout(20000);
  if(!http.begin(tls,c.url.c_str())){diagnostic="PPP_HTTPS_URL_rejected";return -1;}
  const char* headers[]={"Date"};http.collectHeaders(headers,1);
  http.addHeader("Content-Type","application/json");
  http.addHeader("Authorization",String("Bearer ")+c.token.c_str());
  const int status=http.POST(String(body.c_str()));
  if(status>0){
   const uint32_t serverEpoch=lteHttpDateEpoch(http.header("Date").c_str());
   const int64_t drift=int64_t(serverEpoch)-int64_t(time(nullptr));
   if(serverEpoch&&(drift>2||drift< -2)){timeval tv={};tv.tv_sec=serverEpoch;settimeofday(&tv,nullptr);}
  }
  if(status>=200&&status<300&&http.getSize()<=1024){LteReplyBuffer capture;const int count=http.writeToStream(&capture);if(count>=0&&!capture.overflow)serverReply=capture.text;}
  const char* rejection=nullptr;
  if((status==400||status==409)&&http.getSize()<=1024){
   LteReplyBuffer capture;const int count=http.writeToStream(&capture);
   JsonDocument response;
   if(count>=0&&!capture.overflow&&!deserializeJson(response,capture.text)){
    const char* code=response["code"]|"";
    rejection=lteRejectionDiagnostic(status,code);
   }
  }
  if(status<0){
   if(tls.detail.length())tlsError=tls.detail;
   else tlsError=String("HTTP ")+status+": "+HTTPClient::errorToString(status);
  }
  http.end();
  diagnostic=rejection?rejection:status>=200&&status<300?"accepted_via_PPP_ESP32_TLS":status<0?(tls.detail.length()?tls.failure:"PPP_HTTP_transfer_failed"):lteDeliveryDiagnostic(status);
  if(retry.reconnectAfter(status)){
   stop();tlsError+="; PPP reconnect scheduled";
  }
  return status;
 }
};

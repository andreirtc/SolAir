#pragma once
#include <string>
#include <cstdint>
#include <atomic>

// Commissioning is initially paused. The caller can restore an explicitly saved
// stream intent; one-shot tests never turn themselves into continuous retries.
class LteCommissioning {
 std::atomic<int> mode;
public:
 explicit LteCommissioning(bool testOnly):mode(testOnly?0:2){}
 void once(){mode.store(1);}
 void start(){mode.store(2);}
 void stop(){mode.store(0);}
 bool active()const{return mode.load()!=0;}
 bool take(bool ready){
  if(!ready)return false;
  int expected=1;
  if(mode.compare_exchange_strong(expected,0))return true;
  return expected==2;
 }
};

// Shared with host regressions. Io owns the modem UART; these waits never run
// in the security loop. Unsupported TLS commands must fail closed.
struct LteHttpsSettings { bool enabled=false;std::string url,token,ca,apn; };
inline bool lteAtValue(const std::string& value){
 for(unsigned char c:value)if(c<32||c>126||c=='"'||c=='\\')return false;
 return true;
}
inline bool lteHttpsSettingsValid(const LteHttpsSettings& c){
 if(!c.enabled||c.url.compare(0,8,"https://")||!lteAtValue(c.url)||c.url.size()>256)return false;
 const auto slash=c.url.find('/',8);const auto host=c.url.substr(8,slash==std::string::npos?std::string::npos:slash-8);
 if(host.empty()||host.find('@')!=std::string::npos||host.find(' ')!=std::string::npos)return false;
 if(c.token.empty()||c.token.size()>220||!lteAtValue(c.token)||!lteAtValue(c.apn)||c.apn.size()>100)return false;
 return c.ca.size()>=100&&c.ca.size()<=10240&&c.ca.find("-----BEGIN CERTIFICATE-----")!=std::string::npos&&c.ca.find("-----END CERTIFICATE-----")!=std::string::npos;
}
inline bool retryableDelivery(int status){return status<=0||status==408||status==429||status>=500;}
inline const char* lteDeliveryDiagnostic(int status){
 if(status>=200&&status<300)return "accepted";
 switch(status){
  case 401:case 403:return "device_authentication_rejected";
  case 409:return "server_sequence_or_payload_rejected";
  case 713:return "DNS_lookup_failed_713";
  case 714:return "socket_connection_failed_714";
  case 715:return "TLS_handshake_failed_715_check_clock_CA_and_modem_revision";
  case 719:return "CA_certificate_missing_719";
  default:return status>0?"HTTP_or_modem_error":"TLS_DNS_network_or_HTTP_timeout";
 }
}
inline const char* lteRejectionDiagnostic(int status,const std::string& code){
 if(status==400&&code=="future_timestamp")return "device_clock_ahead_of_server";
 if(status==409&&code=="stale_sequence")return "older_sequence_already_superseded";
 if(status==409&&code=="payload_identity_conflict")return "payload_identity_conflict";
 return nullptr;
}
inline bool preferWifi(bool wifi,bool cellular,unsigned failures,uint32_t now,uint32_t lastProbe){return wifi&&(!cellular||failures<3||uint32_t(now-lastProbe)>=60000);}
template<class Io> class LteHttps {
 Io& io;bool initialized=false;
public:
 const char* diagnostic="not_started";
 explicit LteHttps(Io& channel):io(channel){}
 void reset(){initialized=false;}
 int post(const LteHttpsSettings& c,const std::string& body){
  if(!lteHttpsSettingsValid(c)){diagnostic="https_config_or_CA_missing";return -1;}
  auto step=[&](const std::string& command,const char* error,unsigned timeout=5000){if(!io.command(command,"OK",timeout)){diagnostic=error;return false;}return true;};
  if(!initialized){
   if(!step("ATE0","modem_echo_control_failed"))return -1;
   if(!c.apn.empty()&&!step("AT+CGDCONT=1,\"IP\",\""+c.apn+"\"","APN_rejected"))return -1;
   if(!io.clockValid()){diagnostic="modem_clock_invalid_for_TLS";return -1;}
   if(!io.installCa(c.ca)){diagnostic="CA_provision_failed";return -1;}
   if(!step("AT+CSSLCFG=\"sslversion\",0,3","TLS12_unsupported")||
      !step("AT+CSSLCFG=\"authmode\",0,1","server_verification_unsupported")||
      !step("AT+CSSLCFG=\"ignorelocaltime\",0,0","certificate_time_check_unsupported")||
      !step("AT+CSSLCFG=\"enableSNI\",0,1","SNI_unsupported")||
      !step("AT+CSSLCFG=\"negotiatetime\",0,20","TLS_timeout_rejected")||
      !step("AT+CSSLCFG=\"cacert\",0,\"solair-ca.pem\"","CA_binding_failed"))return -1;
   initialized=true;
  }
  io.command("AT+HTTPTERM","OK",3000);
  if(!step("AT+HTTPINIT","PDP_or_HTTP_start_failed",20000))return -1;
  int status=-1;
  if(step("AT+HTTPPARA=\"URL\",\""+c.url+"\"","HTTPS_URL_rejected")&&
     step("AT+HTTPPARA=\"SSLCFG\",0","HTTP_SSL_context_rejected")&&
     step("AT+HTTPPARA=\"CONNECTTO\",20","HTTP_timeout_rejected")&&
     step("AT+HTTPPARA=\"RECVTO\",15","HTTP_timeout_rejected")&&
     step("AT+HTTPPARA=\"CONTENT\",\"application/json\"","content_type_rejected")&&
     step("AT+HTTPPARA=\"USERDATA\",\"Authorization: Bearer "+c.token+"\"","authorization_header_rejected")){
   if(io.command("AT+HTTPDATA="+std::to_string(body.size())+",10000","DOWNLOAD",10000)&&io.data(body,12000)){
    status=io.action(55000);
    diagnostic=lteDeliveryDiagnostic(status);
   }else diagnostic="HTTP_body_upload_failed";
  }
  io.command("AT+HTTPTERM","OK",3000);return status;
 }
};

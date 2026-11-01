"""Host dialogue/policy fixtures only; no modem, secrets or network requests."""
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
source = r'''
#include "lte_https.h"
#include "lte_ppp_policy.h"
#include "lte_recovery.h"
#include <cassert>
#include <vector>
#include <algorithm>
struct Io {
 std::vector<std::string> commands;
 std::string fail,body;bool clock=true,ca=true;int status=201,uploads=0;
 bool command(const std::string& c,const char*,unsigned){commands.push_back(c);return fail.empty()||c.find(fail)==std::string::npos;}
 bool clockValid(){return clock;}
 bool installCa(const std::string&){return ca;}
 bool data(const std::string& b,unsigned){body=b;uploads++;return true;}
 int action(unsigned){return status;}
};
struct RecoverIo {
 std::vector<std::string> operations;unsigned attempts=0,readyAfter=0;bool hangup=true;
 bool command(const std::string& c,const char*,unsigned){operations.push_back(c);if(c=="AT")return ++attempts>=readyAfter;return hangup;}
 void guard(uint32_t ms){assert(ms==300||ms>=1200);operations.push_back(ms==300?"settle":"guard");}
 void escape(){operations.push_back("+++");}
};
struct IntentStore {
 bool value=false,exists=false,fail=false;unsigned writes=0;
 bool getBool(const char*,bool fallback){return exists?value:fallback;}
 unsigned putBool(const char*,bool next){++writes;if(fail)return 0;value=next;exists=true;return 1;}
};
int main(){
 assert(lteHttpDateEpoch("Thu, 22 Oct 2026 06:13:19 GMT")==lteClockEpoch("26/10/22,06:13:19+00"));
 for(const char* bad:{"Thu, 22 Oct 1970 06:13:19 GMT","Wed, 01 Jan 2070 00:00:00 GMT","Thu, 22 Oct 2026 06:13:19 PST","Thu, 22 Oct 2026 06:13:19 GMTjunk","Thu, 29 Feb 2026 06:13:19 GMT","","bad"})assert(!lteHttpDateEpoch(bad));
 assert(std::string(lteRejectionDiagnostic(409,"stale_sequence"))=="older_sequence_already_superseded");
 assert(std::string(lteRejectionDiagnostic(409,"payload_identity_conflict"))=="payload_identity_conflict");
 assert(std::string(lteRejectionDiagnostic(400,"future_timestamp"))=="device_clock_ahead_of_server");
 assert(!lteRejectionDiagnostic(200,"stale_sequence"));assert(!lteRejectionDiagnostic(409,"TEST FIXTURE unknown"));

 IntentStore store;
 assert(!lteStreamAtBoot(store,true,false)); // Fresh commissioning is paused.
 assert(lteStreamAtBoot(store,true,true)); // Fresh autonomous installation.
 assert(lteStreamAtBoot(store,false,false)); // Preserve Wi-Fi/LTE fallback default.
 assert(lteSaveStreamIntent(store,false));assert(store.writes==1);
 assert(!lteStreamAtBoot(store,true,true)); // Explicit OFF defeats autostart.
 assert(!lteStreamAtBoot(store,false,true)); // OFF also survives fallback boot.
 assert(lteSaveStreamIntent(store,false));assert(store.writes==1);
 assert(lteSaveStreamIntent(store,true));assert(store.value&&store.writes==2);
 assert(lteSaveStreamIntent(store,true));assert(store.writes==2);
 assert(lteStreamAtBoot(store,true,false)); // Saved ON defeats paused default.
 LteCommissioning restored(true);if(store.getBool("lte_stream",false))restored.start();assert(restored.take(true));
 assert(lteSaveStreamIntent(store,false));assert(!store.value&&store.writes==3);
 LteCommissioning paused(true);if(store.getBool("lte_stream",false))paused.start();assert(!paused.take(true));
 store.fail=true;assert(!lteSaveStreamIntent(store,true));assert(!store.value);
 assert(!lteQueryExpired(false,5000,0));assert(!lteQueryExpired(true,4999,0));assert(lteQueryExpired(true,5000,0));assert(lteQueryExpired(true,4000,UINT32_MAX-1000));
 assert(lteHasReplyLine("OK\r\n","OK"));assert(lteHasReplyLine("\r\nOK\r\n","OK"));assert(!lteHasReplyLine("BOOK\r\n","OK"));assert(!lteHasReplyLine("\r\nOK","OK"));
 assert(lteHasReplyLine("\r\nNO CARRIER\r\n","NO CARRIER"));
 const std::string binaryPrefix("\0~\x01\r\nOK\r\n",9);
 assert(lteHasReplyLine(binaryPrefix,"OK"));assert(!lteHasReplyLine(std::string(binaryPrefix.c_str()),"OK"));
 LteReplyObservation binaryObservation;for(unsigned char b:binaryPrefix)binaryObservation.feed(b);
 const auto binarySummary=binaryObservation.summary();
 assert(binarySummary.find("nul=1 binary=2 ppp_flags=1")!=std::string::npos);
 LteReplyObservation startup;for(unsigned char b:std::string("\r\nRDY\r\nSMS Ready\r\nNORMAL POWER DOWN\r\n"))startup.feed(b);
 assert(startup.summary().find("boot=1 powerdown=1 numeric=0")!=std::string::npos);
 LteReplyObservation numeric;for(unsigned char b:std::string("\r\n0\r\n"))numeric.feed(b);
 assert(numeric.summary().find("numeric=1")!=std::string::npos);assert(!lteHasReplyLine("\r\n0\r\n","OK"));
 LteReplyObservation privateResponse;const std::string secret="TEST-FIXTURE-private-identifier";
 for(unsigned char b:secret+"\r\n+CGDCONT: private-profile\r\n")privateResponse.feed(b);
 assert(privateResponse.summary().find(secret)==std::string::npos);assert(privateResponse.summary().find("private-profile")==std::string::npos);
 LteReplyObservation overflow;for(unsigned char b:std::string(10000,'x')+"RDY\n")overflow.feed(b);
 assert(overflow.summary().size()<160);assert(overflow.summary().find("boot=0")!=std::string::npos);
 RecoverIo awake;awake.readyAfter=1;assert(lteRecoverCommand(awake));assert((awake.operations==std::vector<std::string>{"AT"}));
 RecoverIo hangupFailure;hangupFailure.readyAfter=1;hangupFailure.hangup=false;assert(lteRecoverCommand(hangupFailure));assert(!lteFinishDataCall(hangupFailure));
 RecoverIo hung;hung.readyAfter=1;assert(lteFinishDataCall(hung));assert((hung.operations==std::vector<std::string>{"ATH","settle","AT"}));
 RecoverIo orphan;orphan.readyAfter=2;assert(lteRecoverCommand(orphan));
 assert((orphan.operations==std::vector<std::string>{"AT","guard","+++","guard","AT"}));
 RecoverIo second;second.readyAfter=3;assert(lteRecoverCommand(second));assert(std::count(second.operations.begin(),second.operations.end(),"+++")==2);
 RecoverIo absent;absent.readyAfter=99;assert(!lteRecoverCommand(absent));assert(absent.attempts==3);
 LteRecoverySchedule recovery;assert(recovery.due(0));recovery.completed(10000);assert(!recovery.due(24999));assert(recovery.due(25000));recovery.reset();assert(recovery.due(25001));
 recovery.completed(UINT32_MAX-1000);assert(!recovery.due(1000));assert(recovery.due(14000));
 assert(!lteUtcUsable(0));assert(!lteUtcUsable(3155760000LL));assert(lteUtcUsable(1792648800));
 assert(lteClockEpoch("70/01/01,00:04:53+00")==0);
 assert(lteClockEpoch("26/10/21,15:29:17+00")==1792596557U);
 assert(lteClockEpoch("26/10/21,23:29:17+32")==lteClockEpoch("26/10/21,15:29:17+00"));
 assert(lteClockEpoch("26/10/21,07:29:17-32")==lteClockEpoch("26/10/21,15:29:17+00"));
 assert(lteClockEpoch("24/02/29,00:00:00+00")>0);
 for(const char* bad:{"23/12/31,00:00:00+00","26/02/29,00:00:00+00","26/10/32,00:00:00+00","26/10/21,24:00:00+00","26/10/21,00:60:00+00","26/10/21,00:00:60+00","26/10/21,00:00:00+99","26/10/21,00:00:00x00","26/10/21,00:00:00+00junk",""})assert(lteClockEpoch(bad)==0);
 LtePppRetryPolicy retry;
 assert(!retry.reconnectAfter(-1));assert(retry.reconnectAfter(-11));
 assert(!retry.reconnectAfter(-1));assert(!retry.reconnectAfter(201));
 assert(!retry.reconnectAfter(-1));assert(!retry.reconnectAfter(401));
 assert(!retry.reconnectAfter(-1));assert(!retry.reconnectAfter(409));
 assert(!retry.reconnectAfter(-1));assert(!retry.reconnectAfter(503));
 assert(!retry.reconnectAfter(-1));assert(retry.reconnectAfter(0));
 assert(ltePdpApn("+CGDCONT: 2,\"IP\",\"ims\"\r\n+CGDCONT: 1,\"IPV4V6\",\"existing.profile\",\"0.0.0.0\"\r\nOK")=="existing.profile");
 assert(ltePdpApn("+CGDCONT: 1,\"IP\",\"\"\r\nOK").empty());
 assert(ltePdpApn("+CGDCONT: 1,\"IP\",\""+std::string(101,'a')+"\"").empty());
 assert(ltePdpApn("+CGDCONT: 2,\"IP\",\"ims\"").empty());
 LteCommissioning commissioning(true);assert(!commissioning.take(true));
 commissioning.once();assert(!commissioning.take(false));assert(commissioning.take(true));assert(!commissioning.take(true));
 commissioning.start();assert(commissioning.take(true));assert(commissioning.take(true));commissioning.stop();assert(!commissioning.take(true));
 commissioning.once();commissioning.stop();assert(!commissioning.take(true));
 LteCommissioning normal(false);assert(normal.take(true));normal.stop();assert(!normal.take(true));
 assert(std::string(lteDeliveryDiagnostic(715)).find("TLS_handshake_failed_715")==0);
 assert(std::string(lteDeliveryDiagnostic(713))=="DNS_lookup_failed_713");

 LteHttpsSettings c;c.enabled=true;c.url="https://fixture.example/api/ingest";c.token="TEST-FIXTURE-token";
 c.ca="-----BEGIN CERTIFICATE-----\n"+std::string(100,'a')+"\n-----END CERTIFICATE-----\n";
 assert(lteHttpsSettingsValid(c));
 for(const auto& url:{"http://fixture.example/api/ingest","https://user@fixture.example/api/ingest","https://fixture.example/\r\nAT","https:///path"}){auto bad=c;bad.url=url;assert(!lteHttpsSettingsValid(bad));}
 auto bad=c;bad.enabled=false;assert(!lteHttpsSettingsValid(bad));bad=c;bad.ca="";assert(!lteHttpsSettingsValid(bad));bad=c;bad.token="token\"\r\nAT";assert(!lteHttpsSettingsValid(bad));
 Io io;LteHttps<Io> http(io);assert(http.post(c,"{\"fixture\":true}")==201);assert(io.uploads==1);
 const auto has=[&](const char* command){return std::find(io.commands.begin(),io.commands.end(),command)!=io.commands.end();};
 assert(has("AT+CSSLCFG=\"authmode\",0,1"));assert(has("AT+CSSLCFG=\"ignorelocaltime\",0,0"));assert(has("AT+CSSLCFG=\"enableSNI\",0,1"));assert(has("AT+CSSLCFG=\"sslversion\",0,3"));assert(has("AT+HTTPPARA=\"SSLCFG\",0"));
 assert(std::none_of(io.commands.begin(),io.commands.end(),[](const std::string& s){return s.find("CGDCONT")!=std::string::npos;}));
 for(const char* fail:{"sslversion","authmode","ignorelocaltime","enableSNI","cacert","SSLCFG","HTTPINIT","USERDATA","HTTPDATA"}){Io f;f.fail=fail;LteHttps<Io> h(f);assert(h.post(c,"body")==-1);assert(f.uploads==0);assert(std::string(h.diagnostic)!="accepted");}
 Io clock;clock.clock=false;LteHttps<Io> hc(clock);assert(hc.post(c,"body")==-1);assert(std::string(hc.diagnostic)=="modem_clock_invalid_for_TLS");assert(clock.uploads==0);
 Io ca;ca.ca=false;LteHttps<Io> ha(ca);assert(ha.post(c,"body")==-1);assert(ca.uploads==0);
 Io auth;auth.status=401;LteHttps<Io> h401(auth);assert(h401.post(c,"body")==401);assert(std::string(h401.diagnostic)=="device_authentication_rejected");
 Io conflict;conflict.status=409;LteHttps<Io> h409(conflict);assert(h409.post(c,"body")==409);assert(std::string(h409.diagnostic)=="server_sequence_or_payload_rejected");
 assert(preferWifi(true,true,0,1000,0));assert(preferWifi(true,true,2,1000,0));assert(!preferWifi(true,true,3,1000,0));assert(preferWifi(true,true,3,61000,1000));assert(preferWifi(true,false,5,1000,0));assert(!preferWifi(false,true,0,1000,0));
 assert(preferWifi(true,true,3,60000,UINT32_MAX-1000));
 assert(retryableDelivery(-1)&&retryableDelivery(408)&&retryableDelivery(429)&&retryableDelivery(503));
 assert(!retryableDelivery(201)&&!retryableDelivery(400)&&!retryableDelivery(401)&&!retryableDelivery(403)&&!retryableDelivery(409));
}
'''
with tempfile.TemporaryDirectory(prefix="solair-lte-fixture-") as folder:
    p = Path(folder)
    (p / "test.cpp").write_text(source)
    subprocess.run(["g++", "-std=c++11", "-Wall", "-Wextra", "-Werror", "-I", str(root / "firmware/solair-cpe"), str(p / "test.cpp"), "-o", str(p / "test")], check=True)
    subprocess.run([str(p / "test")], check=True)
print("PASS: TEST FIXTURE TLS verification/SNI/time/CA gates, credential/URL validation, failed-step rejection, HTTP error handling and Wi-Fi/LTE failover; no physical modem test")

#pragma once
#include <cstdint>
#include <cstdio>
#include <string>

inline bool lteUtcUsable(int64_t epoch){return epoch>=1704067200LL&&epoch<3155760000LL;}

inline bool lteQueryExpired(bool pending,uint32_t now,uint32_t sent){return pending&&uint32_t(now-sent)>=5000;}
inline bool lteHasReplyLine(const std::string& text,const std::string& expected){
 size_t start=0;
 while(start<text.size()){
  const size_t end=text.find_first_of("\r\n",start);if(end==std::string::npos)return false;
  if(text.substr(start,end-start)==expected)return true;
  start=end+1;
 }
 return false;
}

// Report categories, never raw modem text (which can contain phone numbers,
// APNs or identifiers). Binary/PPP and modem boot output need different fixes.
class LteReplyObservation {
 unsigned bytes=0,nulls=0,binary=0,ppp=0;
 bool boot=false,powerdown=false,numeric=false,discard=false;
 std::string line;
public:
 void feed(unsigned char c){
  ++bytes;if(c==0)++nulls;
  if((c<32&&c!='\r'&&c!='\n'&&c!='\t')||c>126)++binary;
  if(c==0x7e)++ppp;
  if(c=='\r'||c=='\n'){
   if(!discard){
    if(line=="RDY"||line=="PB DONE"||line=="SMS Ready"||line=="Call Ready")boot=true;
    if(line=="NORMAL POWER DOWN"||line=="UNDER-VOLTAGE POWER DOWN")powerdown=true;
    if(line=="0"||line=="3"||line=="4")numeric=true;
   }
   line.clear();discard=false;
  }else if(!discard){
   if(line.size()<160)line+=char(c);
   else {line.clear();discard=true;}
  }
 }
 std::string summary()const{
  char value[160];std::snprintf(value,sizeof(value),"rx=%u nul=%u binary=%u ppp_flags=%u boot=%u powerdown=%u numeric=%u",bytes,nulls,binary,ppp,unsigned(boot),unsigned(powerdown),unsigned(numeric));
  return value;
 }
};

// All calls run in the transport task with exclusive modem-UART ownership.
// A modem can finish booting after the MCU, or retain a data session across an
// MCU reset. Neither condition should leave a requested stream stuck forever.
template<class Io> bool lteFinishDataCall(Io& io){
 // +++ retains the PS call (SIMCom A76XX manual 2.2.5). Command-mode
 // readiness alone is insufficient before a fresh PPP dial.
 if(!io.command("ATH","HANGUP",5000))return false;
 io.guard(300);return io.command("AT","OK",1500);
}
template<class Io> bool lteRecoverCommand(Io& io){
 if(io.command("AT","OK",1500))return true;
 for(unsigned attempt=0;attempt<2;attempt++){
  io.guard(1200);io.escape();io.guard(1200);
  if(!io.command("AT","OK",2500))continue;
  return true;
 }
 return false;
}
class LteRecoverySchedule {
 bool attempted=false;uint32_t last=0;
public:
 bool due(uint32_t now){return !attempted||uint32_t(now-last)>=15000;}
 void completed(uint32_t now){attempted=true;last=now;}
 void reset(){attempted=false;}
};
template<class Store> bool lteSaveStreamIntent(Store& store,bool enabled){
 // Use the opposite default so an explicit OFF is persisted even when the
 // key is absent and an autonomous build would otherwise start next boot.
 if(store.getBool("lte_stream",!enabled)==enabled)return true;
 return store.putBool("lte_stream",enabled)==1;
}
template<class Store> bool lteStreamAtBoot(Store& store,bool testOnly,bool autoStart){
 return store.getBool("lte_stream",!testOnly||autoStart);
}

// +CCLK uses a local clock with a signed timezone in quarter-hours. Validate
// the complete value before deriving UTC; never disable TLS time verification.
inline uint32_t lteClockEpoch(const std::string& value){
 unsigned y=0,m=0,d=0,h=0,min=0,s=0,zone=0;char sign=0;int used=0;
 if(std::sscanf(value.c_str(),"%2u/%2u/%2u,%2u:%2u:%2u%c%2u%n",&y,&m,&d,&h,&min,&s,&sign,&zone,&used)!=8||used!=int(value.size()))return 0;
 // Modems commonly start at 70/01/01 (1970), which must not become 2070.
 // This two-digit clock parser supports 2024 through 2069.
 if(y<24||y>=70||m<1||m>12||h>23||min>59||s>59||(sign!='+'&&sign!='-')||zone>(sign=='+'?56u:48u))return 0;
 y+=2000;const bool leap=y%4==0&&(y%100!=0||y%400==0);
 const unsigned months[]={31,28,31,30,31,30,31,31,30,31,30,31};
 if(d<1||d>months[m-1]+(m==2&&leap?1u:0u))return 0;
 int64_t days=0;
 for(unsigned year=1970;year<y;year++)days+=365+(year%4==0&&(year%100!=0||year%400==0));
 for(unsigned month=1;month<m;month++)days+=months[month-1]+(month==2&&leap?1u:0u);
 days+=d-1;
 const int64_t local=days*86400+h*3600+min*60+s;
 const int64_t utc=local+(sign=='+'?-1:1)*int64_t(zone)*900;
 return lteUtcUsable(utc)?uint32_t(utc):0;
}

// RFC 1123 Date from the certificate-verified HTTPS peer. Correct a plausible
// but wrong modem RTC without weakening server timestamp or TLS checks.
inline uint32_t lteHttpDateEpoch(const std::string& value){
 char weekday[4]={},month[4]={},zone[4]={};unsigned day=0,year=0,hour=0,minute=0,second=0;int used=0;
 if(std::sscanf(value.c_str(),"%3[A-Za-z], %2u %3[A-Za-z] %4u %2u:%2u:%2u %3s%n",weekday,&day,month,&year,&hour,&minute,&second,zone,&used)!=8||used!=int(value.size())||std::string(zone)!="GMT"||year<2024||year>=2070)return 0;
 const std::string weekdays[]={"Sun","Mon","Tue","Wed","Thu","Fri","Sat"};bool known=false;for(const auto& name:weekdays)if(name==weekday)known=true;if(!known)return 0;
 const std::string months[]={"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};unsigned number=0;for(unsigned i=0;i<12;i++)if(months[i]==month)number=i+1;if(!number)return 0;
 char clock[40];std::snprintf(clock,sizeof(clock),"%02u/%02u/%02u,%02u:%02u:%02u+00",year-2000,number,day,hour,minute,second);
 return lteClockEpoch(clock);
}

"""Fault-injected ADS register transport fixtures; no physical acceptance."""
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
source = r'''
#include <cassert>
#include <cmath>
#include <cstring>
#include <vector>
#include "ads_verified.h"

struct FakeIo {
 uint16_t config=0, bits=0;
 bool writeOk=true, readConfigOk=true, readConversionOk=true;
 bool ready=false, silentlyKeepOldConfig=false, mutateDuringResult=false;
 int writes=0;
 bool write16(uint8_t reg,uint16_t value){
  assert(reg==1);writes++;
  if(!writeOk)return false;
  if(!silentlyKeepOldConfig){config=value&0x7fff;ready=false;}
  return true;
 }
 bool read16(uint8_t reg,uint16_t& value){
  if(reg==1){if(!readConfigOk)return false;value=config|(ready?0x8000:0);return true;}
  assert(reg==0);if(!readConversionOk)return false;value=bits;
  if(mutateDuringResult)config^=0x1000;
  return true;
 }
 void complete(int16_t raw){bits=uint16_t(raw);ready=true;}
};
using Scanner=CpeVerifiedAds1115<FakeIo>;
static void isError(Scanner& s,const char* error){
 assert(!s.online&&!s.healthy&&!s.updated&&s.mask==0);
 assert(!strcmp(s.error,error));
}
struct FakeWire {
 uint8_t status=0;int count=2,availableCount=2,reads=0,queued=1;
 bool stop=true;std::vector<uint8_t> sent;
 void beginTransmission(int address){assert(address==0x48);sent.clear();}
 int write(uint8_t value){sent.push_back(value);return queued;}
 uint8_t endTransmission(bool stopValue){stop=stopValue;return status;}
 int requestFrom(int address,int size){assert(address==0x48&&size==2);return count;}
 int available(){return availableCount;}
 int read(){availableCount--;return reads++==0?0x12:0x34;}
};
int main(){
 // Every channel has its actual datasheet config; signed near-ground codes
 // and sub-mV counts are retained, not replaced with guessed zeroes.
 FakeIo io;Scanner s(io);assert(s.begin(0));
 assert(Scanner::configFor(0)==0xc383&&Scanner::configFor(1)==0xd383);
 assert(Scanner::configFor(2)==0xe383&&Scanner::configFor(3)==0xf383);
 for(int ch=0;ch<4;ch++){
  io.complete(ch==1?9201:ch==2?-5:4600);
  s.poll(uint32_t((ch+1)*20));
  assert(s.updated&&s.lastChannel==ch&&s.lastConfig==Scanner::configFor(ch));
  assert(s.samples==uint32_t(ch+1));
  if(ch==1)assert(fabs(s.volts(s.lastRaw)-1.150125f)<0.000001f);
  if(ch==2)assert(s.lastRaw==-5);
  assert(s.healthy==(ch==3));
 }
 // A write failure must never relabel the previous conversion as A1.
 io.complete(4600);io.writeOk=false;s.poll(100);
 isError(s,"ADS1115_config_write_failed");assert(s.samples==5);
 const int writes=io.writes;s.poll(1099);assert(io.writes==writes);
 io.writeOk=true;s.poll(1100);assert(s.online&&!s.healthy&&!s.updated);
 // Recovery requires a new whole scan, not retained valid bits.
 for(int ch=0;ch<4;ch++){io.complete(9000+ch);s.poll(1120+20*ch);}
 assert(s.healthy&&s.lastChannel==3);

 {FakeIo i;Scanner a(i);i.writeOk=false;assert(!a.begin(0));isError(a,"ADS1115_config_write_failed");}
 {FakeIo i;Scanner a(i);i.readConfigOk=false;assert(!a.begin(0));isError(a,"ADS1115_config_read_failed");}
 {FakeIo i;Scanner a(i);i.silentlyKeepOldConfig=true;i.config=0x5383;
  assert(!a.begin(0));isError(a,"ADS1115_config_mismatch");}
 {FakeIo i;Scanner a(i);assert(a.begin(0));i.config^=0x0200;i.complete(123);
  a.poll(20);isError(a,"ADS1115_config_mismatch");assert(a.samples==0);}
 {FakeIo i;Scanner a(i);assert(a.begin(0));i.readConfigOk=false;
  a.poll(20);isError(a,"ADS1115_config_read_failed");}
 {FakeIo i;Scanner a(i);assert(a.begin(0));i.complete(9200);i.readConversionOk=false;
  a.poll(20);isError(a,"ADS1115_conversion_read_failed");assert(a.samples==0);}
 {FakeIo i;Scanner a(i);assert(a.begin(0));i.complete(9200);i.mutateDuringResult=true;
  a.poll(20);isError(a,"ADS1115_config_changed_during_read");assert(a.samples==0);}
 {FakeIo i;Scanner a(i);assert(a.begin(0));a.poll(20);assert(!a.updated);
  a.poll(201);isError(a,"ADS1115_conversion_timeout");}
 {FakeIo i;Scanner a(i);assert(a.begin(0));i.complete(9200);a.poll(201);
  isError(a,"ADS1115_conversion_timeout");assert(a.samples==0);}
 {FakeIo i;Scanner a(i);assert(a.begin(0));i.complete(9200);a.poll(1);assert(!a.updated);
  a.poll(20);assert(a.updated);a.pause();assert(!a.healthy&&!a.online);
  a.poll(21);assert(a.online&&!a.healthy&&!a.updated);}
 {FakeIo i;Scanner a(i);assert(a.begin(0xfffffff0u));i.complete(9200);a.poll(4);
  assert(a.updated&&a.samples==1);i.writeOk=false;i.complete(9200);a.poll(24);
  isError(a,"ADS1115_config_write_failed");i.writeOk=true;a.poll(1023);assert(!a.online);
  a.poll(1024);assert(a.online&&!a.healthy);}

 // Actual Wire adapter rejects NACK/short or inconsistent transfers and never
 // returns a stale buffer value after a failed read.
 FakeWire w;CpeAdsWireIo<FakeWire> adapter(w);uint16_t value=0xbeef;
 assert(adapter.read16(1,value)&&value==0x1234&&!w.stop);
 assert(adapter.write16(1,0xd383)&&w.stop);
 assert((w.sent==std::vector<uint8_t>{1,0xd3,0x83}));
 w.status=2;value=0xbeef;assert(!adapter.read16(1,value)&&value==0xbeef);
 assert(!adapter.write16(1,0xd383));w.status=0;
 w.queued=0;assert(!adapter.read16(1,value)&&w.stop);assert(!adapter.write16(1,0xd383));
 w.queued=1;w.count=1;w.availableCount=1;
 assert(!adapter.read16(1,value)&&value==0xbeef&&w.availableCount==0);
 w.count=2;w.availableCount=1;
 assert(!adapter.read16(1,value)&&value==0xbeef&&w.availableCount==0);
}
'''
with tempfile.TemporaryDirectory(prefix="solair-ads-verified-") as folder:
    path = Path(folder)
    (path / "test.cpp").write_text(source)
    binary = path / "check"
    subprocess.run(["g++", "-std=c++11", "-Wall", "-Wextra", "-Werror",
                    "-I", str(root / "firmware/solair-cpe"),
                    str(path / "test.cpp"), "-o", str(binary)], check=True)
    subprocess.run([str(binary)], check=True)
print("PASS: software verified ADS scan: checked Wire NACK/short reads, failed/ignored config writes, MUX/gain readback, result-read/config-change failures, timeout, recovery, pause and rollover; no hardware PASS")

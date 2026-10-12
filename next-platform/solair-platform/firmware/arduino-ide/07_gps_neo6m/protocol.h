#pragma once
#include <stdint.h>
#include <stddef.h>
inline uint16_t modbusCRC(const uint8_t* p,size_t n){uint16_t c=0xffff;while(n--){c^=*p++;for(int i=0;i<8;i++)c=(c&1)?(c>>1)^0xa001:c>>1;}return c;}
struct PzemReading{float voltage,current,power;uint32_t wh;bool high,low;};
// Family manual: holding register 0x0003, value 0x0001 = matched 50 A shunt.
inline bool decodePzem50A(const uint8_t* b,size_t n,uint8_t address){
 return n==7&&b[0]==address&&b[1]==3&&b[2]==2&&b[3]==0&&b[4]==1&&modbusCRC(b,n)==0;
}
inline bool decodePzem(const uint8_t* b,size_t n,uint8_t address,PzemReading& r){
 if(n!=21||b[0]!=address||b[1]!=4||b[2]!=16||modbusCRC(b,n)!=0)return false;
 auto word=[&](int i)->uint16_t{return (uint16_t(b[3+i*2])<<8)|b[4+i*2];};
 r.voltage=word(0)*0.01f;r.current=word(1)*0.01f;
 r.power=(uint32_t(word(2))|(uint32_t(word(3))<<16))*0.1f;
 r.wh=uint32_t(word(4))|(uint32_t(word(5))<<16);r.high=word(6)==0xffff;r.low=word(7)==0xffff;
 return r.voltage<=350&&r.current<=300&&r.power<=100000;
}

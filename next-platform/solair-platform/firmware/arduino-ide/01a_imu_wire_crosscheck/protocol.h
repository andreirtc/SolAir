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
 uint16_t w0=(uint16_t(b[3])<<8)|b[4];
 uint16_t w1=(uint16_t(b[5])<<8)|b[6];
 uint16_t w2=(uint16_t(b[7])<<8)|b[8];
 uint16_t w3=(uint16_t(b[9])<<8)|b[10];
 uint16_t w4=(uint16_t(b[11])<<8)|b[12];
 uint16_t w5=(uint16_t(b[13])<<8)|b[14];
 uint16_t w6=(uint16_t(b[15])<<8)|b[16];
 uint16_t w7=(uint16_t(b[17])<<8)|b[18];
 r.voltage=w0*0.01f;r.current=w1*0.01f;
 r.power=(uint32_t(w2)|(uint32_t(w3)<<16))*0.1f;
 r.wh=uint32_t(w4)|(uint32_t(w5)<<16);r.high=w6==0xffff;r.low=w7==0xffff;
 return r.voltage<=350&&r.current<=300&&r.power<=100000;
}

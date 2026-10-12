#pragma once
#include <stdint.h>
#include <stddef.h>
// MPU6500-compatible profile, not silicon authenticity verification.
// WHO_AM_I=0x70; +/-4g (8192 LSB/g), +/-500deg/s (65.5 LSB/deg/s).
// Io supplies bounded read(register,buffer,length) and write(register,value).
// Reset/wake settling uses timestamps; it never waits in a blocking loop.
struct Imu6500Sample {int16_t raw[7];float accel[3],gyro[3];};
template<class Io> class Imu6500 {
 Io& io;enum Phase{Idle,ResetWait,WakeWait,Ready} phase=Idle;
 uint32_t changed=0,checked=0;bool attempted=false;
 bool fail(){phase=Idle;valid=false;return false;}
 bool matches(uint8_t reg,uint8_t expected){uint8_t value=0;return io.read(reg,&value,1)&&value==expected;}
 bool configOK(){return matches(0x75,0x70)&&matches(0x6b,1)&&matches(0x6c,0)&&matches(0x19,9)&&matches(0x1a,3)&&matches(0x1b,8)&&matches(0x1c,8)&&matches(0x1d,3);}
 public:
 bool valid=false;const char* error="not_initialized";
 explicit Imu6500(Io& bus):io(bus){}
 bool initialized()const{return phase==Ready;}
 static float accelSI(int16_t raw){return float(raw)*(9.80665f/8192.0f);}
 static float gyroSI(int16_t raw){return float(raw)*(0.017453292519943295f/65.5f);}
 bool poll(uint32_t now,Imu6500Sample& out){
  valid=false;
  if(phase==Idle){
   if(attempted&&uint32_t(now-changed)<1000)return false;
   attempted=true;changed=now;
   if(!matches(0x75,0x70)){error="identity_read_or_mismatch";return fail();}
   if(!io.write(0x6b,0x80)){error="reset_write";return fail();}
   phase=ResetWait;error="reset_settling";return false;
  }
  if(phase==ResetWait){
   if(uint32_t(now-changed)<100)return false;
   if(!io.write(0x6b,1)||!io.write(0x6c,0)||!io.write(0x19,9)||!io.write(0x1a,3)||!io.write(0x1b,8)||!io.write(0x1c,8)||!io.write(0x1d,3)){
    changed=now;error="configuration_write";return fail();
   }
   phase=WakeWait;changed=now;error="wake_settling";return false;
  }
  if(phase==WakeWait){
   if(uint32_t(now-changed)<100)return false;
   if(!configOK()){changed=now;error="configuration_readback";return fail();}
   checked=now;phase=Ready;
  }
  if(uint32_t(now-checked)>=1000){
   if(!configOK()){changed=now;error="configuration_changed_or_disconnected";return fail();}
   checked=now;
  }
  uint8_t bytes[14];
  if(!io.read(0x3b,bytes,sizeof(bytes))){changed=now;error="incomplete_sensor_read";return fail();}
  Imu6500Sample sample{};bool any=false;
  for(int i=0;i<7;i++){sample.raw[i]=int16_t((uint16_t(bytes[i*2])<<8)|bytes[i*2+1]);if(i!=3&&sample.raw[i]!=0)any=true;}
  if(!any){error="all_zero_motion_frame";return false;}
  for(int i=0;i<3;i++){sample.accel[i]=accelSI(sample.raw[i]);sample.gyro[i]=gyroSI(sample.raw[i+4]);}
  out=sample;valid=true;error="ok";return true;
 }
};

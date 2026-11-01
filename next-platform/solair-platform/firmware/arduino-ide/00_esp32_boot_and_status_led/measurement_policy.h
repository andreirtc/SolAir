#pragma once
#include <math.h>
#include <string.h>

inline bool cpeAcsCurrentWithinRange(float current,float minimum,float maximum){
 return isfinite(current)&&isfinite(minimum)&&isfinite(maximum)&&minimum>=-50&&maximum<=50&&minimum<maximum&&current>=minimum&&current<=maximum;
}

struct CpeMeasurementRoles {
 bool voltageValidated=false,solarCurrentValidated=false,batteryBusVerified=false,acsNetBatteryVerified=false;
 float voltageScale=1.0f,solarCurrentScale=1.0f;
};
struct CpePublishedMeasurements {
 bool batteryVoltageValid=false,batteryCurrentValid=false,solarOutputValid=false;
 float batteryVoltage=0,batteryCurrent=0,solarVoltage=0,solarCurrent=0;
 bool any()const{return batteryVoltageValid||batteryCurrentValid||solarOutputValid;}
};
// Roles must describe the actual installed circuit. Bench-source readings never
// become battery/solar values, even if a commissioning flag is set accidentally.
inline CpePublishedMeasurements cpePublishedMeasurements(const CpeMeasurementRoles& roles,
 const char* source,bool meterFresh,float volts,float amps,bool acsFresh,bool acsCalibrated,float batteryAmps){
 CpePublishedMeasurements out;
 const bool sourceIsSolar=source&&strcmp(source,"mppt_output")==0;
 const bool voltageValid=sourceIsSolar&&meterFresh&&roles.voltageValidated&&
  isfinite(volts)&&volts>=0&&isfinite(roles.voltageScale)&&roles.voltageScale>0&&volts*roles.voltageScale<=100;
 if(voltageValid&&roles.batteryBusVerified){out.batteryVoltageValid=true;out.batteryVoltage=volts*roles.voltageScale;}
 if(voltageValid&&roles.solarCurrentValidated&&isfinite(amps)&&amps>=0&&
    isfinite(roles.solarCurrentScale)&&roles.solarCurrentScale>0&&amps*roles.solarCurrentScale<=100){
  out.solarOutputValid=true;out.solarVoltage=volts*roles.voltageScale;out.solarCurrent=amps*roles.solarCurrentScale;
 }
 if(roles.acsNetBatteryVerified&&acsFresh&&acsCalibrated&&isfinite(batteryAmps)&&fabsf(batteryAmps)<=100){
  out.batteryCurrentValid=true;out.batteryCurrent=batteryAmps;
 }
 return out;
}

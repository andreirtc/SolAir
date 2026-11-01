"""Host software regression only; no connected hardware, uploads, or EEPROM writes."""
from pathlib import Path
import subprocess
import tempfile
root = Path(__file__).resolve().parents[1]
source = r'''
#include "security_policy.h"
#include "alarm_output.h"
#include "command_text.h"
#include "remote_control.h"
#include "measurement_policy.h"
#include "protocol.h"
#include <cassert>
#include <string>
struct TestPreferences {bool requested=false,fail=false;size_t putBool(const char*,bool value){if(fail)return 0;requested=value;return sizeof(bool);}};
struct PinFixture {bool driven=false;int latch=1,level=-1;void preload(int,int v){assert(!driven);latch=v;}void output(int){driven=true;level=latch;assert(level==0);}void write(int,int v){if(driven)level=latch=v;}};
int main(){
 PinFixture pin;cpeInitializeOutput(pin,26,0);assert(pin.driven&&pin.level==0);
 assert(cpeCommandText("disarm")=="DISARM");assert(cpeCommandText("DISARM\r\n")=="DISARM");
 assert(cpeCommandText("siren")=="SIREN");assert(cpeCommandText("siren_test")=="SIREN");
 assert(cpeCommandText(" alarm_off ")=="DISARM");assert(cpeCommandText(" \r\n")=="");
 assert(cpeCommandText("unknown")=="UNKNOWN");
 // Disabled mount cannot block arming; the lid and startup/latch guards remain required.
 assert(cpeRequiredContactSecure(false,false));
 assert(cpeRequiredContactSecure(false,true));
 assert(!cpeRequiredContactSecure(true,false));
 assert(cpeRequiredContactSecure(true,true));
 assert(canArmCpe(10000,true,true,cpeRequiredContactSecure(false,false),false));
 assert(!canArmCpe(10000,true,false,cpeRequiredContactSecure(false,false),false));
 assert(!canArmCpe(10000,true,true,cpeRequiredContactSecure(true,false),false));
 assert(canResumeStandaloneArm(true,true,10000,true,true,cpeRequiredContactSecure(false,false),false));
 assert(!canResumeStandaloneArm(true,true,9999,true,true,cpeRequiredContactSecure(false,false),false));
 CpeRemoteCommand remote{};strcpy(remote.id,"12345678-1234-1234-1234-123456789abc");strcpy(remote.command,"arm");strcpy(remote.device,"fixture-device");strcpy(remote.boot,"fixture-boot");remote.expires=1800000030;
 assert(cpeRemoteEnvelopeValid(remote,"fixture-device","fixture-boot",1800000000));
 assert(!cpeRemoteEnvelopeValid(remote,"other-device","fixture-boot",1800000000));
 assert(!cpeRemoteEnvelopeValid(remote,"fixture-device","old-boot",1800000000));
 assert(!cpeRemoteEnvelopeValid(remote,"fixture-device","fixture-boot",1800000031));
 assert(!cpeRemoteEnvelopeValid(remote,"fixture-device","fixture-boot",1600000000));
 remote.expires=1800000100;assert(!cpeRemoteEnvelopeValid(remote,"fixture-device","fixture-boot",1800000000));
 assert(!cpeRemoteActionAllowed("raw_gpio"));assert(!cpeRemoteIdValid("not-a-uuid"));
 TestPreferences store;
 assert(!store.requested);
 assert(!canResumeStandaloneArm(false,true,20000,true,true,true,false));
 assert(!canResumeStandaloneArm(true,false,20000,true,true,true,false));
 assert(!canResumeStandaloneArm(true,true,9999,true,true,true,false));
 assert(!canResumeStandaloneArm(true,true,20000,true,false,true,false));
 assert(!canResumeStandaloneArm(true,true,20000,true,true,false,false));
 assert(!canResumeStandaloneArm(true,true,20000,true,true,true,true));
 assert(saveStandaloneArmIntent(store,true)&&store.requested);
 CpeSecurityFsm rebooted;
 assert(!rebooted.armed());
 assert(canResumeStandaloneArm(store.requested,true,10000,true,true,true,false));
 assert(rebooted.arm(10000,true,true,true));
 assert(saveStandaloneArmIntent(store,false)&&!store.requested);
 assert(!canResumeStandaloneArm(store.requested,true,20000,true,true,true,false));
 store.fail=true;assert(!saveStandaloneArmIntent(store,true));assert(!store.requested);

 CpeSecurityFsm fsm;
 assert(fsm.state()==CpeSecurityState::Disarmed);assert(!fsm.trigger());
 assert(!fsm.arm(9999,true,true,true));assert(!fsm.arm(10000,true,false,true));
 assert(!fsm.arm(10000,true,true,true,true));
 assert(fsm.arm(10000,true,true,true));assert(fsm.armed()&&!fsm.triggered());
 assert(fsm.trigger());assert(fsm.triggered());assert(!fsm.trigger());
 assert(!fsm.arm(20000,true,true,true));
 // Output cutoff is separate from the latched FSM state.
 assert(cpeAlarmDurationElapsed(15000,10000,5000));assert(fsm.triggered());
 fsm.disarm();assert(!fsm.armed());assert(fsm.arm(20000,true,true,true));
 assert(std::string(cpeSecurityStateName(fsm.state()))=="ARMED");
 assert(cpeAcsCurrentWithinRange(-1,-1,1));assert(cpeAcsCurrentWithinRange(1,-1,1));
 assert(!cpeAcsCurrentWithinRange(1.01f,-1,1));assert(!cpeAcsCurrentWithinRange(-1.01f,-1,1));
 assert(!cpeAcsCurrentWithinRange(0,0,0));assert(!cpeAcsCurrentWithinRange(NAN,-1,1));
 assert(!cpeAcsCurrentWithinRange(0,-51,50));assert(!cpeAcsCurrentWithinRange(0,-50,51));
 CpeMeasurementRoles roles;
 assert(!cpePublishedMeasurements(roles,"mppt_output",true,48,1,true,true,-1).any());
 roles.voltageValidated=roles.solarCurrentValidated=roles.batteryBusVerified=roles.acsNetBatteryVerified=true;
 auto readings=cpePublishedMeasurements(roles,"mppt_output",true,48,1,true,true,-0.5f);
 assert(readings.batteryVoltageValid&&readings.batteryVoltage==48&&readings.batteryCurrent==-0.5f&&readings.solarCurrent==1);
 auto bench=cpePublishedMeasurements(roles,"bench_supply",true,12,0.12f,true,false,0);
 assert(!bench.batteryVoltageValid&&!bench.solarOutputValid&&!bench.batteryCurrentValid);
 auto missing=cpePublishedMeasurements(roles,"mppt_output",false,48,1,false,true,-1);assert(!missing.any());
 roles.voltageScale=NAN;assert(!cpePublishedMeasurements(roles,"mppt_output",true,48,1,false,false,0).any());
 roles.voltageScale=1;roles.solarCurrentScale=0;
 assert(!cpePublishedMeasurements(roles,"mppt_output",true,48,1,false,false,0).solarOutputValid);
 assert(!cpePublishedMeasurements(roles,"mppt_output",true,INFINITY,1,false,false,0).batteryVoltageValid);
 assert(!canArmCpe(9999,true,true,true,false));
 assert(canArmCpe(10000,true,true,true,false));
 assert(!canArmCpe(20000,false,true,true,false));
 assert(!canArmCpe(20000,true,false,true,false));
 assert(!canArmCpe(20000,true,true,false,false));
 assert(!canArmCpe(20000,true,true,true,true));
 // Command/physical contact activation can happen after the loop clock sample.
 // Previously a 1 ms older sample wrapped and immediately switched the alarm off.
 assert(!cpeAlarmDurationElapsed(10000,10001,5000));
 assert(!cpeAlarmDurationElapsed(10001,10001,5000));
 assert(!cpeAlarmDurationElapsed(15000,10001,5000));
 assert(cpeAlarmDurationElapsed(15001,10001,5000));
 assert(cpeAlarmDurationElapsed(15002,10001,5000));
 // The same duration must survive millis() rollover, including an older sample.
 const uint32_t rolloverStart=UINT32_MAX-999;
 assert(!cpeAlarmDurationElapsed(rolloverStart-1,rolloverStart,5000));
 assert(!cpeAlarmDurationElapsed(3999,rolloverStart,5000));
 assert(cpeAlarmDurationElapsed(4000,rolloverStart,5000));
 assert(!cpeAlarmDurationElapsed(UINT32_MAX,0,5000));
 uint8_t range[7]={1,3,2,0,1,0,0};auto crc=modbusCRC(range,5);range[5]=crc&255;range[6]=crc>>8;
 assert(decodePzem50A(range,7,1));
 range[4]=0;assert(!decodePzem50A(range,7,1)); // Includes invalid CRC.
 crc=modbusCRC(range,5);range[5]=crc&255;range[6]=crc>>8;
 assert(!decodePzem50A(range,7,1)); // Valid CRC, wrong range.
 uint8_t data[21]={1,4,16,0x04,0xCD,0,20,0,24,0,0,0,7,0,0,0,0,0xff,0xff,0,0};
 crc=modbusCRC(data,19);data[19]=crc&255;data[20]=crc>>8;
 PzemReading reading{};assert(decodePzem(data,21,1,reading));
 assert(reading.voltage>12.28f&&reading.voltage<12.30f&&reading.wh==7&&reading.low);
 assert(!decodePzem(data,21,2,reading));assert(!decodePzem(data,20,1,reading));
 data[20]^=1;assert(!decodePzem(data,21,1,reading));
}
'''
with tempfile.TemporaryDirectory(prefix='solair-cpe-policy-') as folder:
    path=Path(folder)
    (path/'check.cpp').write_text(source)
    subprocess.run(['g++','-std=c++11','-Wall','-Wextra','-Werror','-I',str(root/'firmware/solair-cpe'),str(path/'check.cpp'),'-o',str(path/'check')],check=True)
    subprocess.run([str(path/'check')],check=True)
print('PASS: TEST FIXTURE host C++ ARM gates, alarm cutoff stale-clock/5-second/rollover checks and actual PZEM CRC/address/range/scaling decoders; no physical test')

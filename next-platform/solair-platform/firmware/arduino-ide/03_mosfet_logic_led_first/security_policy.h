#pragma once
#include <stdint.h>
// Pure policy shared with host regression tests. This does not verify physical contacts.
inline bool cpeRequiredContactSecure(bool enabled,bool secure){return !enabled||secure;}
inline bool canArmCpe(uint32_t uptime,bool switchesEnabled,bool lidSecure,bool mountSecure,bool latched){
 return uptime>=10000&&switchesEnabled&&lidSecure&&mountSecure&&!latched;
}
enum class CpeSecurityState { Disarmed, Armed, Triggered };
inline const char* cpeSecurityStateName(CpeSecurityState state){
 return state==CpeSecurityState::Armed?"ARMED":state==CpeSecurityState::Triggered?"TRIGGERED":"DISARMED";
}
// Alarm duration is independent: cutting the siren never clears a security trip.
// Manual siren tests are an output test in DISARMED, not a fourth security state.
class CpeSecurityFsm {
 CpeSecurityState current=CpeSecurityState::Disarmed;
public:
 CpeSecurityState state()const{return current;}
 bool armed()const{return current!=CpeSecurityState::Disarmed;}
 bool triggered()const{return current==CpeSecurityState::Triggered;}
 bool arm(uint32_t uptime,bool switchesEnabled,bool lidSecure,bool mountSecure,bool manualTestLatched=false){
  if(!canArmCpe(uptime,switchesEnabled,lidSecure,mountSecure,triggered()||manualTestLatched))return false;
  current=CpeSecurityState::Armed;return true;
 }
 bool trigger(){if(current!=CpeSecurityState::Armed)return false;current=CpeSecurityState::Triggered;return true;}
 void disarm(){current=CpeSecurityState::Disarmed;}
};
// Durations are bounded below half the uint32 clock range. A timestamp sampled
// before activation must not wrap into an apparently enormous elapsed time.
inline bool cpeAlarmDurationElapsed(uint32_t now,uint32_t started,uint32_t duration){
 const uint32_t elapsed=now-started;
 return elapsed<0x80000000U&&elapsed>=duration;
}

// Standalone arming is opt-in and stored separately from event/transport data.
// Missing preference, failed storage, open contacts and unverified outputs stay OFF.
inline bool canResumeStandaloneArm(bool requested,bool outputVerified,uint32_t uptime,bool switchesEnabled,bool lidSecure,bool mountSecure,bool latched){
 return requested&&outputVerified&&canArmCpe(uptime,switchesEnabled,lidSecure,mountSecure,latched);
}
template<class Store> inline bool saveStandaloneArmIntent(Store& store,bool enabled){
 return store.putBool("arm_req",enabled)==sizeof(bool);
}

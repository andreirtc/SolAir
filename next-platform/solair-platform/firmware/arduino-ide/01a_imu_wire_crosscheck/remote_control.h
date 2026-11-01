#pragma once
#include <stdint.h>
#include <string.h>
struct CpeRemoteCommand {char id[37],command[16],device[81],boot[41];uint32_t expires;};
inline bool cpeRemoteActionAllowed(const char* value){return value&&(!strcmp(value,"arm")||!strcmp(value,"disarm")||!strcmp(value,"siren_test"));}
inline bool cpeRemoteIdValid(const char* value){
 if(!value||strlen(value)!=36)return false;
 for(unsigned i=0;i<36;i++){const char c=value[i];if(i==8||i==13||i==18||i==23){if(c!='-')return false;}else if(!((c>='0'&&c<='9')||(c>='a'&&c<='f')||(c>='A'&&c<='F')))return false;}
 return true;
}
inline bool cpeRemoteEnvelopeValid(const CpeRemoteCommand& c,const char* device,const char* boot,uint32_t now){
 return cpeRemoteIdValid(c.id)&&cpeRemoteActionAllowed(c.command)&&!strcmp(c.device,device)&&!strcmp(c.boot,boot)&&now>=1700000000U&&uint64_t(c.expires)>=now&&uint64_t(c.expires)<=uint64_t(now)+65;
}

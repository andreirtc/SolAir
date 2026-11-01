#pragma once
#include <string>
#include <cstdio>

// A retained PPP address does not prove its socket path is still usable.
// Recreate the session after repeated network failures, never after HTTP errors
// such as an authentication/conflict rejection from a reachable application.
class LtePppRetryPolicy {
 unsigned failures=0;
public:
 bool reconnectAfter(int status){
  if(status>0){failures=0;return false;}
  if(++failures<2)return false;
  failures=0;return true;
 }
};

// Read CID1's existing APN, not an operator-name guess or an IP address.
inline std::string ltePdpApn(const std::string& response){
 size_t at=0;
 while((at=response.find("+CGDCONT:",at))!=std::string::npos){
  unsigned cid=0;int consumed=0;char type[16]={},apn[101]={};
  if(std::sscanf(response.c_str()+at,"+CGDCONT: %u , \"%15[^\"]\" , \"%100[^\"]\"%n",&cid,type,apn,&consumed)==3&&consumed>0&&cid==1)return apn;
  at+=9;
 }
 return "";
}

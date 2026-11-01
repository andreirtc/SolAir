#pragma once
#include <string>

// USB commissioning may update the HTTPS destination without recompiling
// credentials/CA/GPIO. Limit it to a DNS host and the exact ingestion path.
inline bool lteDestinationValid(const std::string& url){
 if(url.size()>240||url.compare(0,8,"https://"))return false;
 const size_t slash=url.find('/',8);
 if(slash==std::string::npos||url.substr(slash)!="/api/ingest")return false;
 const std::string host=url.substr(8,slash-8);
 if(host.empty()||host.find('.')==std::string::npos)return false;
 size_t start=0;
 for(size_t end=0;end<=host.size();++end){
  if(end<host.size()&&host[end]!='.')continue;
  const size_t size=end-start;if(size==0||size>63||host[start]=='-'||host[end-1]=='-')return false;
  for(size_t i=start;i<end;i++)if(!((host[i]>='a'&&host[i]<='z')||(host[i]>='0'&&host[i]<='9')||host[i]=='-'))return false;
  start=end+1;
 }
 const std::string tld=host.substr(host.rfind('.')+1);
 if(tld.size()<2||tld=="local"||tld=="localhost"||tld=="internal"||tld=="lan")return false;
 for(char c:tld)if(c<'a'||c>'z')return false;
 return true;
}
template<class Store> bool lteSaveDestination(Store& store,const std::string& url){
 return lteDestinationValid(url)&&store.putString("lte_url",url.c_str())==url.size();
}
struct LteDestinationUpdate { char url[241]; };

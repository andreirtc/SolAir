#pragma once
#include <string>
inline std::string cpeCommandText(std::string value){
 const auto first=value.find_first_not_of(" \t\r\n"),last=value.find_last_not_of(" \t\r\n");
 if(first==std::string::npos)return "";
 value=value.substr(first,last-first+1);
 for(char& c:value)if(c>='a'&&c<='z')c=char(c-'a'+'A');
 if(value=="SIREN_TEST"||value=="ALARM_TEST")return "SIREN";
 if(value=="ALARM_OFF")return "DISARM";
 if(value=="STANDALONE_ARM")return "STANDALONE ARM";
 if(value=="LED_TEST")return "LED";
 return value;
}

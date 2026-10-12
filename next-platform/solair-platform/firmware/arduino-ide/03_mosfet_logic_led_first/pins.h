#pragma once
// GPIO numbers printed on board, NOT header positions. Changes must be recorded in wiring guide.
constexpr int SDA_PIN=21,SCL_PIN=22,LID_PIN=25,MOUNT_PIN=26,ALARM_PIN=27,LED_PIN=19;
constexpr int ACS_PIN=34,GPS_RX=32,RS_RX=16,RS_TX=17,RS_DIR=23,LTE_RX=13,LTE_TX=14;
constexpr int allPins[]={SDA_PIN,SCL_PIN,LID_PIN,MOUNT_PIN,ALARM_PIN,LED_PIN,ACS_PIN,GPS_RX,RS_RX,RS_TX,RS_DIR,LTE_RX,LTE_TX};
constexpr bool pinsUnique(unsigned i=0,unsigned j=1){return i>=13?true:j>=13?pinsUnique(i+1,i+2):allPins[i]!=allPins[j]&&pinsUnique(i,j+1);}
static_assert(pinsUnique(),"CPE pins must be unique");

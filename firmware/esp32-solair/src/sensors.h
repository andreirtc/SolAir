#pragma once
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_ADS1X15.h>
#include <TinyGPSPlus.h>
struct DebouncedSwitch {
 uint8_t pin; int stable=HIGH,last=HIGH; unsigned long changed=0;bool transitioned=false;
 void begin(uint8_t p){pin=p;pinMode(pin,INPUT_PULLUP);stable=last=digitalRead(pin);}
 void update(){transitioned=false;int v=digitalRead(pin);if(v!=last){changed=millis();last=v;}if(v!=stable&&millis()-changed>40){stable=v;transitioned=true;}}
};
struct MotionSensor {
 Adafruit_MPU6050 driver;bool available=false,calibrated=false,fault=false;float baseline[3]={0,0,0};sensors_event_t a,g,temp;
 void begin(){available=driver.begin();if(available){driver.setAccelerometerRange(MPU6050_RANGE_4_G);driver.setGyroRange(MPU6050_RANGE_500_DEG);driver.setFilterBandwidth(MPU6050_BAND_21_HZ);calibrate();}}
 void calibrate(){if(!available)return;for(int j=0;j<3;j++)baseline[j]=0;for(int i=0;i<50;i++){driver.getEvent(&a,&g,&temp);baseline[0]+=a.acceleration.x/50;baseline[1]+=a.acceleration.y/50;baseline[2]+=a.acceleration.z/50;delay(10);}calibrated=true;}
 bool update(){if(!available)return false;Wire.beginTransmission(0x68);if(Wire.endTransmission()!=0){available=false;calibrated=false;fault=true;return false;}driver.getEvent(&a,&g,&temp);float x=a.acceleration.x-baseline[0],y=a.acceleration.y-baseline[1],z=a.acceleration.z-baseline[2];return calibrated&&sqrtf(x*x+y*y+z*z)>MOTION_DELTA_MPS2;}
};
struct AnalogSensors {
 Adafruit_ADS1115 ads;bool available=false,fault=false;int16_t counts[4]={0};float volts[4]={0};
 void begin(){if(ENABLE_ADS){available=ads.begin();if(available)ads.setGain(GAIN_ONE);}}
 void update(){if(!available)return;Wire.beginTransmission(0x48);if(Wire.endTransmission()!=0){available=false;fault=true;return;}for(int i=0;i<4;i++){counts[i]=ads.readADC_SingleEnded(i);volts[i]=ads.computeVolts(counts[i]);}}
};
struct GPSModule {
 TinyGPSPlus parser;HardwareSerial uart{1};unsigned long lastByte=0;
 void begin(){if(ENABLE_GPS)uart.begin(9600,SERIAL_8N1,32,33);}
 void update(){if(ENABLE_GPS)while(uart.available()){lastByte=millis();parser.encode(uart.read());}}
 bool fix(){return ENABLE_GPS&&parser.location.isValid()&&parser.location.age()<30000;}
};
struct LTEProbe {
 HardwareSerial uart{2};String response="";unsigned long lastProbe=0;bool detected=false;
 void begin(){if(ENABLE_LTE_DIAGNOSTICS)uart.begin(115200,SERIAL_8N1,16,17);}
 void update(){if(!ENABLE_LTE_DIAGNOSTICS)return;while(uart.available()){char c=uart.read();if(response.length()<300)response+=c;}if(response.indexOf("OK")>=0)detected=true;if(millis()-lastProbe>10000){response="";uart.print("AT\r\n");lastProbe=millis();}}
 // AT response is detection only. Packet data/TLS transport requires verified carrier board integration.
};

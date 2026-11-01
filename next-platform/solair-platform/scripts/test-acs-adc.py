"""Software fixtures for the real ACS ADC driver; neither ESP32 nor voltages are simulated as physical evidence."""
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
stub = r'''
#pragma once
#include <stdint.h>
typedef int esp_err_t;
constexpr int ESP_OK=0, ADC_UNIT_1=0, ADC_CHANNEL_6=6, ADC1_CHANNEL_6=6;
constexpr int ADC_ATTEN_DB_12=3, ADC_ATTEN_DB_11=3, ADC_BITWIDTH_12=12, ADC_WIDTH_BIT_12=12;
typedef int adc_unit_t; typedef int adc_channel_t;
typedef void* adc_oneshot_unit_handle_t; typedef void* adc_cali_handle_t;
enum adc_cali_line_fitting_efuse_val_t {ADC_CALI_LINE_FITTING_EFUSE_VAL_EFUSE_VREF,ADC_CALI_LINE_FITTING_EFUSE_VAL_EFUSE_TP,ADC_CALI_LINE_FITTING_EFUSE_VAL_DEFAULT_VREF};
enum esp_adc_cal_value_t {ESP_ADC_CAL_VAL_EFUSE_VREF,ESP_ADC_CAL_VAL_EFUSE_TP,ESP_ADC_CAL_VAL_DEFAULT_VREF};
struct adc_oneshot_unit_init_cfg_t {int unit_id;};
struct adc_oneshot_chan_cfg_t {int bitwidth,atten;};
struct adc_cali_line_fitting_config_t {int unit_id,atten,bitwidth;unsigned default_vref;};
struct esp_adc_cal_characteristics_t {};
struct Fake {
 bool factory=true,init=true,channel=true,calibration=true;
 int raw=1302,mv=1170,readCalls=0,convertCalls=0,failRead=-1,failConvert=-1,units=0;
} fake;
inline int adc_cali_scheme_line_fitting_check_efuse(adc_cali_line_fitting_efuse_val_t* s){*s=fake.factory?ADC_CALI_LINE_FITTING_EFUSE_VAL_EFUSE_VREF:ADC_CALI_LINE_FITTING_EFUSE_VAL_DEFAULT_VREF;return ESP_OK;}
inline int adc_oneshot_new_unit(const adc_oneshot_unit_init_cfg_t* c,void** h){if(!fake.init)return -1;if(c->unit_id!=ADC_UNIT_1)return -1;*h=&fake;fake.units++;return ESP_OK;}
inline int adc_oneshot_io_to_channel(int pin,int* unit,int* channel){if(pin!=34)return -1;*unit=ADC_UNIT_1;*channel=6;return ESP_OK;}
inline int adc_oneshot_config_channel(void*,int channel,const adc_oneshot_chan_cfg_t* c){return fake.channel&&channel==6&&c->bitwidth==12&&c->atten==3?ESP_OK:-1;}
inline int adc_cali_create_scheme_line_fitting(const adc_cali_line_fitting_config_t* c,void** h){if(!fake.calibration||c->default_vref!=0)return -1;*h=&fake;return ESP_OK;}
inline int adc_cali_delete_scheme_line_fitting(void*){return ESP_OK;}
inline int adc_oneshot_del_unit(void*){fake.units--;return ESP_OK;}
inline int adc_oneshot_read(void*,int channel,int* raw){if(channel!=6)return -1;const int n=fake.readCalls++;if(n==fake.failRead)return -1;*raw=fake.raw;return ESP_OK;}
inline int adc_cali_raw_to_voltage(void*,int raw,int* mv){if(raw!=fake.raw)return -1;const int n=fake.convertCalls++;if(n==fake.failConvert)return -1;*mv=fake.mv;return ESP_OK;}
inline int esp_adc_cal_check_efuse(esp_adc_cal_value_t){return fake.factory?ESP_OK:-1;}
inline int adc1_config_width(int bits){return fake.init&&bits==12?ESP_OK:-1;}
inline int adc1_config_channel_atten(int channel,int atten){return fake.channel&&channel==6&&atten==3?ESP_OK:-1;}
inline esp_adc_cal_value_t esp_adc_cal_characterize(int,int,int,unsigned vref,esp_adc_cal_characteristics_t*){return fake.calibration&&vref==0?ESP_ADC_CAL_VAL_EFUSE_VREF:ESP_ADC_CAL_VAL_DEFAULT_VREF;}
inline int adc1_get_raw(int channel){if(channel!=6)return -1;const int n=fake.readCalls++;return n==fake.failRead?-1:fake.raw;}
inline unsigned esp_adc_cal_raw_to_voltage(unsigned raw,esp_adc_cal_characteristics_t*){fake.convertCalls++;return raw==unsigned(fake.raw)?unsigned(fake.mv):9999;}
'''
test = r'''
#include <cassert>
#include <cstring>
#include "acs_adc.h"
int main(){
 // Conversion belongs to the SDK: preserve its supplied result, never raw*3.3/4095 or an offset.
 {fake=Fake{};CpeAcsAdc adc;assert(adc.begin());assert(adc.sample());assert(adc.readingValid);assert(adc.rawMean==1302);assert(adc.millivolts==1170);assert(fake.readCalls==16&&fake.convertCalls==16);}
 // Missing factory information must not silently enable guessed reference calibration.
 {fake=Fake{};fake.factory=false;CpeAcsAdc adc;assert(!adc.begin());assert(!adc.sample());assert(!adc.readingValid);assert(!strcmp(adc.error,"factory_calibration_missing"));assert(fake.readCalls==0);}
 {fake=Fake{};fake.init=false;CpeAcsAdc adc;assert(!adc.begin());assert(!adc.sample());assert(fake.readCalls==0);}
 {fake=Fake{};fake.channel=false;CpeAcsAdc adc;assert(!adc.begin());assert(!adc.sample());assert(fake.units==0);}
 {fake=Fake{};fake.calibration=false;CpeAcsAdc adc;assert(!adc.begin());assert(!adc.sample());assert(fake.units==0);}
 // A failed new sample must clear the old voltage; subsequent successful samples recover.
 {fake=Fake{};CpeAcsAdc adc;assert(adc.begin());assert(adc.sample());fake.failRead=fake.readCalls+7;assert(!adc.sample());assert(!adc.readingValid&&adc.rawMean==-1&&adc.millivolts==0);assert(!strcmp(adc.error,"ADC1_read_failed")||!strcmp(adc.error,"ADC1_raw_out_of_range"));fake.failRead=-1;assert(adc.sample());assert(adc.millivolts==1170);}
#if ESP_ARDUINO_VERSION_MAJOR>=3
 {fake=Fake{};CpeAcsAdc adc;assert(adc.begin());fake.failConvert=4;assert(!adc.sample());assert(!adc.readingValid&&adc.millivolts==0);assert(!strcmp(adc.error,"ADC1_voltage_conversion_failed"));}
#endif
 {fake=Fake{};CpeAcsAdc adc;assert(adc.begin());fake.raw=4096;assert(!adc.sample());assert(!adc.readingValid);}
 {fake=Fake{};CpeAcsAdc adc;assert(adc.begin());fake.mv=3301;assert(!adc.sample());assert(!adc.readingValid);}
 // A raw zero result is not reinterpreted as a guessed physical zero voltage.
 {fake=Fake{};fake.raw=0;fake.mv=142;CpeAcsAdc adc;assert(adc.begin());assert(adc.sample());assert(adc.rawMean==0&&adc.millivolts==142);}
}
'''
with tempfile.TemporaryDirectory(prefix='solair-acs-adc-') as folder:
    path = Path(folder)
    (path/'stub.h').write_text(stub)
    for header in ['Arduino.h','esp_arduino_version.h','esp_adc/adc_oneshot.h','esp_adc/adc_cali.h','esp_adc/adc_cali_scheme.h','driver/adc.h','esp_adc_cal.h']:
        p=path/header
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text('#include "stub.h"\n')
    (path/'check.cpp').write_text(test)
    for major in [2,3]:
        binary=path/f'check{major}'
        subprocess.run(['g++','-std=c++11','-Wall','-Wextra','-Werror','-DCONFIG_IDF_TARGET_ESP32=1',f'-DESP_ARDUINO_VERSION_MAJOR={major}','-I',str(path),'-I',str(root/'firmware/solair-cpe'),str(path/'check.cpp'),'-o',str(binary)],check=True)
        subprocess.run([str(binary)],check=True)
print('PASS: TEST FIXTURE ACS native ADC branches 2/3: actual-sample conversion, factory-only calibration, init/read/conversion failure rejection, no stale voltage, recovery and bounded results; no hardware test')

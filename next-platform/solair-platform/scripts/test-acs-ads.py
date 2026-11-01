"""Host fixtures for ADC source freshness/failure handling; never physical evidence."""
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
source = r'''
#include <cassert>
#include <cmath>
#include <cstring>
#include "acs_ads_input.h"
int main() {
 CpeAcsAdsInput input;
 assert(!input.fresh(0,true));
 input.observe(9600,1.2f,0);
 assert(input.fresh(0,true)); // millis zero is a legitimate timestamp.
 assert(input.raw==9600 && fabs(input.millivolts-1200)<0.001);
 assert(input.fresh(500,true));
 assert(!input.fresh(501,true));
 assert(!strcmp(input.error,"ADS1115_A1_stale"));
 input.observe(9601,1.200125f,700);
 assert(input.fresh(700,true));
 assert(fabs(input.millivolts-1200.125)<0.001); // Preserve sub-mV detail.
 assert(!input.fresh(701,false));
 assert(!input.observed && input.millivolts==0);
 assert(!input.fresh(702,true)); // Presence returning cannot refresh old data.
 input.observe(9602,1.20025f,710);assert(input.fresh(710,true));
 input.observe(-1,-0.000125f,720);assert(!input.fresh(720,true));
 assert(!input.observed && !strcmp(input.error,"ADS1115_A1_out_of_range"));
 input.observe(1,NAN,730);assert(!input.fresh(730,true));
 input.observe(30000,3.31f,740);assert(!input.fresh(740,true));
 input.observe(9600,1.2f,0xfffffff0u);
 assert(input.fresh(0x20u,true)); // Correct through millis rollover.
 assert(!input.fresh(0x300u,true));
 input.observe(9600,1.2f,1000);
 input.invalidate("acquisition_paused");assert(!input.fresh(1001,true));
 assert(!input.observed && input.millivolts==0);
}
'''
with tempfile.TemporaryDirectory(prefix="solair-acs-ads-") as folder:
    path = Path(folder)
    (path / "test.cpp").write_text(source)
    binary = path / "check"
    subprocess.run(["g++", "-std=c++11", "-Wall", "-Wextra", "-Werror",
                    "-I", str(root / "firmware/solair-cpe"),
                    str(path / "test.cpp"), "-o", str(binary)], check=True)
    subprocess.run([str(binary)], check=True)
print("PASS: software ADS ACS fixtures: sub-mV counts, startup, stale, disconnect/recovery, invalid input, pause and rollover; no hardware PASS")

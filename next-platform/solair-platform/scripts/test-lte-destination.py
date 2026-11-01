"""Host fixtures only: same URL vectors as TypeScript; no device or NVS access."""
import json
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
vectors = json.loads((root / "tests/fixtures/lte-destinations.json").read_text())
vectors += [
    {"url": "https://" + "a" * 64 + ".example/api/ingest", "valid": False},
    {"url": "https://" + ("a" * 60 + ".") * 4 + "example/api/ingest", "valid": False},
]

def literal(value):
    data = value.encode("utf8")
    return 'std::string("' + ''.join('\\%03o' % b for b in data) + '",' + str(len(data)) + ')'

source = r'''
#include "lte_destination.h"
#include <cassert>
struct Store {
 std::string value="https://previous.example/api/ingest"; unsigned writes=0; bool fail=false;
 size_t putString(const char* key,const char* next){assert(std::string(key)=="lte_url");++writes;if(fail)return 0;value=next;return value.size();}
};
int main(){
'''
for v in vectors:
    source += 'assert(lteDestinationValid(' + literal(v["url"]) + ')=='+ str(v["valid"]).lower() + ');\n'
source += r'''
 Store store;
 assert(!lteSaveDestination(store,"http://bad.example/api/ingest"));assert(store.writes==0);
 assert(lteSaveDestination(store,"https://new.example/api/ingest"));assert(store.writes==1);
 assert(store.value=="https://new.example/api/ingest");
 store.fail=true;assert(!lteSaveDestination(store,"https://failed.example/api/ingest"));
 assert(store.value=="https://new.example/api/ingest");
}
'''
with tempfile.TemporaryDirectory(prefix="solair-destination-fixture-") as folder:
    p = Path(folder)
    (p / "test.cpp").write_text(source)
    subprocess.run(["g++", "-std=c++11", "-Wall", "-Wextra", "-Werror", "-I", str(root / "firmware/solair-cpe"), str(p / "test.cpp"), "-o", str(p / "test")], check=True)
    subprocess.run([str(p / "test")], check=True)
print("PASS: shared destination validation and save-failure fixtures; no physical persistence test")

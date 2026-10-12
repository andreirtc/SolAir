#include <assert.h>
#include <map>
#include <string>
#include <vector>
#include <iostream>
#include "../firmware/anti-tamper/durable-events.h"
#include "../firmware/anti-tamper/sender-clock.h"
#include "../firmware/anti-tamper/durable-ack.h"
struct FakeStore {
  std::map<std::string,std::vector<char>> blobs;
  bool failWrite=false, failDelete=false, tornWrite=false;
  size_t length(const char *key) { auto i=blobs.find(key); return i==blobs.end()?0:i->second.size(); }
  size_t read(const char *key,void *out,size_t size) { if(length(key)!=size) return 0; memcpy(out,blobs[key].data(),size); return size; }
  size_t write(const char *key,const void *data,size_t size) {
    if(failWrite) return 0;
    auto bytes=static_cast<const char *>(data); blobs[key]={bytes,bytes+(tornWrite?size/2:size)};
    return tornWrite?0:size;
  }
  bool remove(const char *key) { return !failDelete && blobs.erase(key)==1; }
};
int main() {
  using Queue=DurableEvents<FakeStore>;
  assert(Queue::checksum("123456789",9)==0xcbf43926);
  FakeStore store; Queue first(store);
  const char *event="{\"sessionId\":\"original-boot-fixture\",\"sequence\":0}";
  assert(first.append(event));
  Queue afterReset(store); char out[Queue::MAX_JSON]; unsigned slot;
  assert(afterReset.next(out,sizeof(out),slot) && strcmp(out,event)==0);
  assert(!afterReset.acknowledge(slot,"wrong identity"));
  store.failDelete=true; assert(!afterReset.acknowledge(slot,event));
  Queue afterLostAck(store); assert(afterLostAck.next(out,sizeof(out),slot) && strcmp(out,event)==0);
  store.failDelete=false; assert(afterLostAck.acknowledge(slot,event));
  assert(!afterLostAck.next(out,sizeof(out),slot));
  for(unsigned n=0;n<Queue::CAPACITY;++n) assert(first.append(("fixture-"+std::to_string(n)).c_str()));
  auto before=store.blobs; assert(!first.append("overflow")); assert(store.blobs==before);
  // Simulated interrupted blob writes remain occupied/quarantined across restart.
  FakeStore torn; torn.tornWrite=true; Queue tornQueue(torn); assert(!tornQueue.append(event));
  Queue recovered(torn); assert(recovered.corruptCount()==1); assert(!recovered.next(out,sizeof(out),slot));
  torn.tornWrite=false; assert(recovered.append("next fixture")); assert(torn.length("evt0")>0);
  assert(recovered.next(out,sizeof(out),slot) && strcmp(out,"next fixture")==0);
  // Detect CRC damage without overwriting the damaged record.
  torn.blobs["evt1"].back()^=1; assert(recovered.corruptCount()==2);
  FakeStore failed; failed.failWrite=true; Queue failedQueue(failed); assert(!failedQueue.append(event));
  assert(!first.append(std::string(Queue::MAX_JSON,'x').c_str()));
  assert(!senderClockValid(1800000000,false,100,0));
  assert(!senderClockValid(0,true,100,0));
  assert(senderClockValid(1800000000,true,100,0));
  assert(!senderClockValid(1800000000,true,86400000,0));
  assert(!senderClockValid(1800000000,true,10,20));
  assert(!senderClockValid(4102444800LL,true,100,0));
  assert(durableAcknowledgement(202,"{\"accepted\":true,\"durable\":true,\"duplicate\":false}"));
  assert(durableAcknowledgement(202,"{\"accepted\":true,\"durable\":true,\"duplicate\":true}"));
  assert(!durableAcknowledgement(202,"{\"accepted\":true}"));
  assert(!durableAcknowledgement(503,"{\"accepted\":true,\"durable\":true,\"duplicate\":true}"));
  assert(!durableAcknowledgement(202,nullptr));
  std::cout<<"PASS actual firmware C++ queue/clock logic: mock reset, lost ack/delete, capacity, torn/corrupt writes, CRC, clock gate. No physical flash/power-loss test.\n";
}

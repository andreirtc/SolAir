#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdio.h>

// Storage adapter implements length/read/write/remove using committed NVS blobs.
// No credentials; immutable event JSON and CRC only. Caller serializes access.
template<class Store> class DurableEvents {
 public:
  static constexpr unsigned CAPACITY = 8;
  static constexpr size_t MAX_JSON = 1024;
  struct Blob { uint32_t magic, crc, length; char json[MAX_JSON]; };
  explicit DurableEvents(Store &store) : store(store) {}
  static uint32_t checksum(const char *data, size_t size) {
    uint32_t crc = 0xffffffff;
    for (size_t i=0; i<size; ++i) {
      crc ^= static_cast<uint8_t>(data[i]);
      for (int bit=0; bit<8; ++bit) crc = (crc>>1) ^ (0xedb88320 & (0u-(crc&1)));
    }
    return ~crc;
  }
  bool append(const char *json) {
    size_t length = strnlen(json, MAX_JSON);
    if (!length || length >= MAX_JSON) return false;
    for (unsigned slot=0; slot<CAPACITY; ++slot) {
      char key[8]; name(slot,key);
      // Corrupt/unknown slots are quarantined, never overwritten automatically.
      if (store.length(key)) continue;
      Blob blob{}; blob.magic=0x534f4c32; blob.length=static_cast<uint32_t>(length+1);
      memcpy(blob.json,json,blob.length); blob.crc=checksum(blob.json,blob.length);
      const size_t bytes=offsetof(Blob,json)+blob.length;
      if (store.write(key,&blob,bytes)!=bytes) return false;
      Blob check{};
      return load(slot,check) && check.length==blob.length && memcmp(check.json,blob.json,blob.length)==0;
    }
    return false;
  }
  bool next(char *json, size_t capacity, unsigned &slot) {
    for (unsigned n=0; n<CAPACITY; ++n) {
      slot=cursor; cursor=(cursor+1)%CAPACITY;
      Blob blob{};
      if (load(slot,blob) && blob.length<=capacity) { memcpy(json,blob.json,blob.length); return true; }
    }
    return false;
  }
  bool acknowledge(unsigned slot, const char *json) {
    Blob blob{};
    if (!load(slot,blob) || strcmp(blob.json,json)!=0) return false;
    char key[8]; name(slot,key); return store.remove(key);
  }
  unsigned corruptCount() {
    unsigned count=0;
    for(unsigned slot=0;slot<CAPACITY;++slot) { char key[8]; name(slot,key); Blob blob{}; if(store.length(key) && !load(slot,blob)) ++count; }
    return count;
  }
 private:
  Store &store; unsigned cursor=0;
  static void name(unsigned slot,char *key) { snprintf(key,8,"evt%u",slot); }
  bool load(unsigned slot,Blob &blob) {
    char key[8]; name(slot,key); const size_t bytes=store.length(key);
    if(bytes<=offsetof(Blob,json) || bytes>sizeof(blob) || store.read(key,&blob,bytes)!=bytes) return false;
    return blob.magic==0x534f4c32 && blob.length>1 && blob.length<=MAX_JSON && bytes==offsetof(Blob,json)+blob.length && blob.json[blob.length-1]==0 && strnlen(blob.json,blob.length)==blob.length-1 && blob.crc==checksum(blob.json,blob.length);
  }
};

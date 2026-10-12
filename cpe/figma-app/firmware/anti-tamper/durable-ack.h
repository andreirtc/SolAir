#pragma once
#include <string.h>
// Fail closed: HTTP success alone does not mean the receiver committed storage.
inline bool durableAcknowledgement(int status,const char *body) {
  return status==202 && body && (strcmp(body,"{\"accepted\":true,\"durable\":true,\"duplicate\":false}")==0 || strcmp(body,"{\"accepted\":true,\"durable\":true,\"duplicate\":true}")==0);
}

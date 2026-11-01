#pragma once
// Preload the output latch before enabling its driver. Arduino 3 digitalWrite
// ignores a pin which has not yet been claimed by pinMode; write again after it.
template<class Io> inline void cpeInitializeOutput(Io& io,int pin,int off){
 io.preload(pin,off);io.output(pin);io.write(pin,off);
}

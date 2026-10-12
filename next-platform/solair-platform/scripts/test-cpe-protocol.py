"""Synthetic Modbus decoder checks; never physical evidence."""
import importlib.util
from pathlib import Path
import struct
path=Path(__file__).resolve().parents[1]/'firmware/solair-cpe/tests/09a_pzem_usb_modbus/pzem_usb.py'
spec=importlib.util.spec_from_file_location('pzem',path)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
payload=bytes((1,4,16))+struct.pack('>8H',1210,20,24,0,7,0,0,65535)
payload+=struct.pack('<H',m.crc16(payload))
r=m.decode(payload,1)
assert r['voltage_v']==12.1 and r['power_w']==2.4 and r['energy_wh']==7 and r['alarm_low']
for bad in (payload[:-1],bytes((2,))+payload[1:],payload[:-1]+bytes((payload[-1]^1,))):
    try:m.decode(bad,1)
    except ValueError:pass
    else:raise AssertionError('Corrupt frame accepted')
print('PASS: TEST FIXTURE Modbus scaling/address/length/CRC; no device opened')
def range_reply(code):
    b=bytes((1,3,2,0,code))
    return b+struct.pack('<H',m.crc16(b))
assert m.decode_range(range_reply(1),1)==50
assert m.decode_range(range_reply(0),1)==100
class FakePort:
    def __init__(self, replies): self.replies=list(replies);self.writes=[]
    def reset_input_buffer(self): pass
    def write(self,b): self.writes.append(b)
    def flush(self): pass
    def read(self,n): return self.replies.pop(0)
write=m.frame(1,6,3,1)
port=FakePort([write,range_reply(1)])
assert m.configure_50a(port,1)==50
assert port.writes==[write,m.frame(1,3,3,1)]
for replies, action in (([range_reply(0)],m.check_50a),([write,range_reply(0)],m.configure_50a),([b''],m.configure_50a),([range_reply(1)[:-1]],m.check_50a)):
    try: action(FakePort(replies),1)
    except ValueError: pass
    else: raise AssertionError('Invalid/mismatched range accepted')
print('PASS: TEST FIXTURE 50 A register/readback, mismatch, timeout and exact write echo; no device opened')

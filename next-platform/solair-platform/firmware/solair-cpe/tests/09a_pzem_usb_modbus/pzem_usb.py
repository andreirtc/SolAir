"""PZEM-017 poll; optional explicitly gated 50 A setup, never calibration/energy reset."""
import argparse
import json
import time
import struct

def crc16(data):
    crc = 0xffff
    for byte in data:
        crc ^= byte
        for _ in range(8):
            crc = (crc >> 1) ^ (0xa001 if crc & 1 else 0)
    return crc

def decode(data, address):
    if len(data) != 21 or data[:3] != bytes((address,4,16)) or crc16(data) != 0:
        raise ValueError('Wrong address/function/length/CRC; no valid measurement')
    r = struct.unpack('>8H',data[3:19])
    return {'voltage_v':r[0]/100,'current_a':r[1]/100,'power_w':(r[2]+(r[3]<<16))/10,'energy_wh':r[4]+(r[5]<<16),'alarm_high':r[6]==65535,'alarm_low':r[7]==65535,'load_mode':'bench_resistor'}

def frame(address, function, register, value):
    body = struct.pack('>BBHH', address, function, register, value)
    return body + struct.pack('<H', crc16(body))

def decode_range(data, address):
    if len(data) != 7 or data[:3] != bytes((address,3,2)) or crc16(data) != 0:
        raise ValueError('Invalid shunt-range response (address/function/length/CRC)')
    code = struct.unpack('>H', data[3:5])[0]
    if code not in (0,1,2,3):
        raise ValueError('Unknown shunt range code')
    return (100,50,200,300)[code]

def exchange(port, query, length):
    port.reset_input_buffer(); port.write(query); port.flush()
    return port.read(length)

def check_50a(port, address):
    actual = decode_range(exchange(port, frame(address,3,3,1),7), address)
    if actual != 50:
        raise ValueError(f'Shunt mismatch: meter configured {actual} A; expected 50 A. No valid measurements.')
    return actual

def configure_50a(port, address):
    query = frame(address,6,3,1)
    if exchange(port,query,8) != query:
        raise ValueError('50 A write not acknowledged exactly; verify wiring/manual and read back')
    time.sleep(0.1)
    return check_50a(port,address)

def main():
    import serial
    p=argparse.ArgumentParser()
    p.add_argument('--port',required=True)
    p.add_argument('--address',type=int,default=1,choices=range(1,248))
    p.add_argument('--confirmed-isolated-bench',action='store_true',required=True)
    p.add_argument('--set-50a',action='store_true',help='Write ONLY holding register 3=1, then verify; exits without polling')
    p.add_argument('--confirmed-family-register-map-and-50a-shunt',action='store_true')
    args=p.parse_args()
    if args.set_50a and not args.confirmed_family_register_map_and_50a_shunt:
        p.error('--set-50a requires delivered revision/manual and matched 50 A shunt confirmation')
    query=frame(args.address,4,0,8)
    with serial.Serial(args.port,9600,bytesize=8,parity='N',stopbits=2,timeout=0.5) as port:
        if args.set_50a:
            print(json.dumps({'configured_shunt_a':configure_50a(port,args.address),'readback_verified':True}),flush=True)
            return
        try:
            while True:
                try:
                    check_50a(port,args.address)
                    data=exchange(port,query,21)
                    print(json.dumps({'quality':'ok','shunt_a':50,**decode(data,args.address)}),flush=True)
                except ValueError as e: print(json.dumps({'quality':'fault','error':str(e)}),flush=True)
                time.sleep(2)
        except KeyboardInterrupt:
            pass
if __name__=='__main__':main()

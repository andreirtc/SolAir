"""Read-only carrier USB AT diagnostics. No PIN/APN/token arguments or automatic port choice."""
import argparse
import json
import time
import serial

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', required=True)
    parser.add_argument('--baud', type=int, default=115200)
    parser.add_argument('--confirmed-carrier-usb', action='store_true', required=True)
    args = parser.parse_args()
    with serial.Serial(args.port, args.baud, timeout=0.2) as port:
        for cmd in ('AT', 'ATI', 'AT+CPIN?', 'AT+CSQ', 'AT+CEREG?', 'AT+CGATT?', 'AT+COPS?'):
            port.reset_input_buffer()
            port.write((cmd+'\r\n').encode('ascii'))
            start, response = time.monotonic(), b''
            while time.monotonic()-start < 4:
                response += port.read(256)
                if b'\r\nOK\r\n' in response or b'ERROR' in response:
                    break
            text = response.decode('ascii', errors='replace')
            # Only emit the allowlisted status/model lines, never unsolicited identifiers/SMS.
            lines = [s.strip() for s in text.splitlines() if s.strip().startswith(('+CPIN:', '+CSQ:', '+CEREG:', '+CGATT:', '+COPS:', 'SIMCOM', 'Model:', 'Revision:')) or s.strip() in ('OK', 'ERROR')]
            print(json.dumps({'command':cmd,'status_lines':lines,'responded':bool(response)}))
if __name__ == '__main__':
    main()

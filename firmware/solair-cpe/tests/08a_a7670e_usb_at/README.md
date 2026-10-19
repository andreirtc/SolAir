# 08a — carrier USB AT

Needed: exact carrier manual/power, antenna, SIM and data USB; ESP UART disconnected. Prerequisite: confirmed carrier USB supply/interface, stable voltage and adequate peak current. Do not use an unknown white connector or power from ESP3V3. Identify the actual modem AT port, not the CP2102 ESP port or modem diagnostic/GNSS port.

From the centralized app root:

```powershell
.\.tools\cpe-python\Scripts\python.exe -m serial.tools.list_ports -v
.\.tools\cpe-python\Scripts\python.exe firmware\solair-cpe\tests\08a_a7670e_usb_at\usb_at.py --port COM_NUMBER --confirmed-carrier-usb
```

Script is real read-only AT, ATI, CPIN, CSQ, CEREG, CGATT, COPS with four-second deadlines and allowlisted status output. Baud115200 default. No secrets/PIN/APN commands. Illustrative only: `{"command":"AT","status_lines":["OK"],"responded":true}`.

PASS: actual model response, SIM READY and independently observed registration/attachment/CSQ; record operator/coverage and timestamps. AT alone only passes interface detection, not network or ingest. FAIL/BLOCKED: wrong port, power droop, UART voltage unknown, SIM/network unavailable; use main troubleshooting matrix. Save `08a-YYYYMMDD-usb-at.txt`, carrier-label photo and supply measurements. Remove modem power before08b translator wiring. This laptop stage is a Python script, not an ESP32 upload; stage08b is the separate compileable Arduino diagnostic.

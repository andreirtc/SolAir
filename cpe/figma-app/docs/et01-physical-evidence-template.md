# ET-01 physical test evidence — UNEXECUTED TEMPLATE

Copy this template for each actual team test. Do not replace missing results with expected output. Keep tokens, Wi-Fi credentials and operator passwords out of captures.

- Test ID/date/time/timezone:
- Tester/witness:
- Firmware source commit/config flags/build hash:
- Board/module labels and approved wiring revision:
- Receiver laptop address (private evidence only)/software commit:
- Boot/session UUID, device ET-01, message type/sequence/event ID:
- Sender UTC/synchronization or original uptime:
- Original server receipt UTC/database record ID:
- Local physical action and observed response:
- GPIO/siren measured duration and OFF/reset behavior:
- Dashboard observed values/status/browser viewport:
- Original serial capture/video/screenshot/CSV filenames and SHA256:
- PASS / FAIL / NOT RUN, actual result, failure/recovery notes:
- Disconnect/reconnect/restart conditions:
- Limitations (functional test versus calibration/research experiment):

Required observations: heartbeat, changing IMU vectors, secure/open state of each switch, DISARM no alarm, ARM trigger, GPIO27 cutoff/DISARM, rated siren OFF at reset, local alarm with Wi-Fi unavailable, delayed event receipt, receiver restart persistence and new ESP32 boot. Mark each individually; siren remains blocked until exact HW-548 review. Software TEST FIXTURE exports belong in a separate software-evidence directory and are not physical evidence.

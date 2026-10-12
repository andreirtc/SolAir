# SolAir serial diagnostic test

Standalone firmware for the reported ESP32-WROOM-32D, 38-pin DevKit, 4 MB flash.
Physical board identity, USB detection, upload and execution have NOT been verified.
No sensor/actuator GPIO configuration, networking, credentials or PWA integration.
Only UART serial diagnostics at 115200 baud; these are not sensor telemetry.

## Toolchain and build

Reused installed Arduino CLI **1.4.1** bundled with Arduino IDE at the path below.
No PlatformIO installation is needed. ESP32 core **2.0.17** is pinned in
`serial-test/sketch.yaml` (a conservative serial-test baseline, not a latest-version claim).
Its official package manifest pins the compiler, uploader and framework dependencies.
No third-party libraries. `esp_timer` is part of the ESP32 core/ESP-IDF.
Board: **ESP32 Dev Module**, FQBN:
`esp32:esp32:esp32:FlashSize=4M,PartitionScheme=default,UploadSpeed=115200`.
This generic classic-ESP32 configuration fits the reported module; it does not identify
an unknown USB bridge or physically verify the board.

In Windows PowerShell:

```powershell
Set-Location 'C:\Users\Anyang\SolAir\firmware'
$cli = 'C:\Users\Anyang\AppData\Local\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe'
& $cli version
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

The first build needs Internet access and downloads the pinned ESP32 platform and
its tools into `.arduino/`. Build output goes into `build/`; both are Git-ignored.
This is compilation only, with no connection to the board. No global ESP32 core
installation or changes to the PWA, databases, accounts or services are needed.
If the CLI executable is missing on another PC, install Arduino CLI 1.4.1 from the
official Arduino release and pass its path to `build.ps1 -Cli 'actual path'`.
The configuration contains this PC's absolute firmware path; adjust it if relocating.

Build result: PASSED with Arduino CLI 1.4.1 and ESP32 core 2.0.17. See BUILD-RESULT.md for sizes and dependency versions. Hardware test remains pending.

## Manual USB test (you perform these steps)

**Uploading replaces the board's current application firmware. Missing source files
on this PC do not prove the board is blank.** Continue only when you are ready to
replace that application. No automatic upload, erase or flash operation is provided.

1. Disconnect the board from all power. Remove external modules, wiring and external
   power supplies. Test the bare board powered only through a USB **data** cable.
2. Open Windows Device Manager (right-click Start > Device Manager). With the board
   unplugged, note entries under **Ports (COM & LPT)** and **Other devices**.
3. Connect USB and compare entries. The new COM entry is the candidate port.
   Unplug/replug once to confirm that the same entry disappears/reappears.
   Do not guess a COM number. If no port appears, follow troubleshooting below.
4. Open PowerShell and run the build commands above. Use the pinned `serial_test`
   profile; do not choose ESP32-S2/S3/C3. Only continue if compilation succeeds.
5. Close Arduino Serial Monitor, PlatformIO monitors and other programs using the port.
   In that same PowerShell terminal, enter the **actual detected** port when asked:

```powershell
$port = Read-Host 'Enter the COM port you verified in Device Manager'
if ($port -notmatch '^COM[0-9]+$') { throw 'Enter an actual detected COM port.' }
# MANUAL WRITE TO BOARD: run only when ready to replace its application.
& $cli --config-file .\arduino-cli.yaml upload --profile serial_test --port $port --input-dir .\build .\serial-test
```

6. Confirm the upload succeeds. Then open the monitor:

```powershell
& $cli --config-file .\arduino-cli.yaml monitor --port $port --config baudrate=115200
```

7. With the monitor open, press **EN/RESET** once to see the startup message.
   Opening a monitor may also reset some boards; the banner can be missed if it
   printed before the monitor opened. Do not hold BOOT during normal running.
8. Expect the banner below and increasing counters about once per second. Uptime
   is milliseconds since boot, not a sensor reading or UTC timestamp.
9. Stop the monitor with **Ctrl+C**. Close it before another upload.

Example expected output only, NOT observed hardware evidence:

```text
SOLAIR SERIAL TEST - DIAGNOSTIC ONLY (NOT SENSOR TELEMETRY)
DIAGNOSTIC counter=1 uptime_ms=1300
DIAGNOSTIC counter=2 uptime_ms=2300
DIAGNOSTIC counter=3 uptime_ms=3300
```

Actual timing varies. ESP32 ROM boot messages may precede the banner. Counter and
uptime restart after reset. Please report the detected USB interface/port, upload
result, and several actual serial lines before adding networking or sensors.

## Troubleshooting

- **No COM port:** try a known data cable and direct USB port; check Device Manager
  for an unknown device or warning icon. Inspect Properties > Details > Hardware Ids
  (VID/PID), or read the USB-interface chip marking on the board. Identify that
  interface before installing its matching manufacturer's official driver. The
  WROOM module label alone does not identify the USB bridge. Do not install an
  arbitrary CP210x/CH340/FTDI driver. If no USB device changes at all, check cable,
  connector and board power first.
- **Port in use:** Ctrl+C the monitor and close other serial tools. Confirm the port
  still belongs to this board, then retry. Do not stop the PWA/backend services.
- **Upload cannot connect:** check actual port, bare-board wiring and power. At the
  uploader's Connecting message, hold BOOT, briefly press/release EN, then release
  BOOT when writing begins. Retry at the configured 115200 upload speed. Do not
  erase flash as a first troubleshooting step. Press EN after a successful upload.
- **Garbled/absent output:** confirm monitor 115200 baud and correct COM port, close
  competing monitors, press EN to capture startup, and wait several seconds. Verify
  the upload really succeeded. Repeated startup banners suggest resets/power issues.

## Official references checked

- [Arduino CLI build profiles](https://docs.arduino.cc/arduino-cli/sketch-project-file/)
- [Espressif Arduino installation](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html)
- [Pinned core 2.0.17 release](https://github.com/espressif/arduino-esp32/releases/tag/2.0.17)
- [Pinned board definitions](https://github.com/espressif/arduino-esp32/blob/2.0.17/boards.txt)
- [Espressif board configuration guide](https://docs.espressif.com/projects/arduino-esp32/en/latest/guides/tools_menu.html)
- [Espressif upload troubleshooting](https://docs.espressif.com/projects/esptool/en/latest/esp32/troubleshooting.html)


## Separate MPU6050 diagnostic preparation

See [MPU6050-HANDOFF.md](MPU6050-HANDOFF.md) for the blocked-until-confirmed wiring configuration, pinned dependencies, compile-only command, proposed diagnostic mapping and planned physical checks. This preserves the serial-test milestone. Physical operation remains unverified.


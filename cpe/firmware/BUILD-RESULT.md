# Actual compilation result

Validated 2026-10-09. Build process exited **0**.

Working directory: `C:\Users\Anyang\SolAir\firmware`

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Actual compiler summary:

```text
Sketch uses 262377 bytes (20%) of program storage space. Maximum is 1310720 bytes.
Global variables use 21408 bytes (6%) of dynamic memory, leaving 306272 bytes for local variables. Maximum is 327680 bytes.
```

Arduino CLI: **1.4.1**, commit **e39419312** (reused from installed Arduino IDE).
Profile: `serial_test`; Arduino ESP32 core **2.0.17**, based on ESP-IDF **4.4.7**.
FQBN: `esp32:esp32:esp32:FlashSize=4M,PartitionScheme=default,UploadSpeed=115200`.
No third-party sketch libraries.

The core's official package manifest fixes these dependency versions (the installer
also downloads tools for other chips; this build targets only classic ESP32):

| Package tool | Version |
| --- | --- |
| xtensa-esp32-elf-gcc | esp-2021r2-patch5-8.4.0 |
| xtensa-esp32s2-elf-gcc | esp-2021r2-patch5-8.4.0 |
| xtensa-esp32s3-elf-gcc | esp-2021r2-patch5-8.4.0 |
| xtensa-esp-elf-gdb | 11.2_20220823 |
| riscv32-esp-elf-gcc | esp-2021r2-patch5-8.4.0 |
| riscv32-esp-elf-gdb | 11.2_20220823 |
| openocd-esp32 | v0.12.0-esp32-20230921 |
| esptool_py | 4.5.1 |
| mkspiffs | 0.2.3 |
| mklittlefs | 3.0.0-gnu12-dc7f933 |
| dfu-util | 0.11.0-arduino5 |

Arduino CLI support tools installed locally: ctags 5.8-arduino11,
serial-monitor 0.15.0, serial-discovery 1.5.2, mdns-discovery 1.1.0,
dfu-discovery 0.1.2. These helper versions are recorded, not pinned by sketch.yaml;
they are resolved by Arduino CLI's package index. The firmware uses no networking.

Built artifacts are in Git-ignored `build/`. Downloads are in Git-ignored `.arduino/`.
USB/COM detection, upload, board execution and serial output are **NOT VERIFIED**.
No upload, flash erase or serial monitor command was executed. The README serial
output is an example, not observed evidence. No PWA files, databases or accounts
were changed, and no PWA/backend service was started or stopped.

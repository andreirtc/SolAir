# SOLAIR on the local laptop

For wiring and independent step-by-step testing, open **[START_BENCH_HERE_LINUX.md](START_BENCH_HERE_LINUX.md)**. It includes the fixed pin map, Arduino upload procedure, per-stage wiring/settings/results and explicit unresolved-board gates.

The 15 October 2026 session runs on Orca's **local** host `penguin`, Debian 13 x86_64, with a ChromeOS shared-files mount. The repository is already cloned locally. Continue in this checkout; no cloud deployment is needed.

Active project directory:

```text
/home/ralphandreicastillo326/orca/workspaces/SolAir/mackerel
```

The home-folder shortcut **`~/SolAir`** points to this active checkout. Keep the Orca `mackerel` worktree and its parent repository; deleting them would remove the files or break the shortcut. The authoritative app is its `next-platform/solair-platform` directory. All tracked application source, BEMAC artwork, firmware, wiring guides, historical `cpe/` references and existing software evidence are present. Git cannot recover private configurations, old accounts/databases, unsaved changes or physical records that were never committed. Preserve any original computer's private files and transfer them privately if needed; do not upload them to GitHub.

## Start the application

From the repository root:

```bash
bash next-platform/solair-platform/scripts/start-local.sh
```

You can also run **`solair-start`** from any Linux terminal. Application-menu entries are **SOLAIR Start Local App**, **SOLAIR Dashboard**, **SOLAIR Project Files**, and **Arduino IDE (SOLAIR)**. Start the app once; do not launch a second server while its terminal is running.

Keep that terminal open and visit **http://localhost:3000**. Stop with Ctrl+C. The local SQLite database is `next-platform/solair-platform/data/solair.db`; migrations run at startup. Existing databases are retained. A fresh development database gets the development accounts listed in the application README. Sign in as `engineer@solair.local` with the documented local demonstration password and select **Real hardware bench** for actual device work. Demonstration data is separate and does not establish a hardware result.

Node 24 is installed under `~/.local/share/solair/` with `node`, `npm` and `npx` links in `~/.local/bin`. If an already-open terminal cannot find them:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

For software work:

```bash
cd next-platform/solair-platform
npm run typecheck
npm test
npm run lint
```

## ESP32 build and upload

PlatformIO 6.1.18 and pyserial 3.5 use the ignored `.tools/cpe-python` virtual environment. Firmware dependencies are pinned in `firmware/solair-cpe/platformio.ini`, including ESP32 Arduino 2.0.17. Linux uses `.tools/platformio` directly; the Windows junction and PowerShell wrapper are unnecessary.

Run from the application directory:

```bash
# Compile only; does not upload or activate hardware.
bash scripts/cpe-build.sh 00_esp32_boot_and_status_led
bash scripts/cpe-build.sh integrated

# List currently visible serial devices.
bash scripts/cpe-build.sh integrated ports
```

To upload, first disconnect external power and the siren branch, connect the ESP32 by a data-capable USB cable, and share that USB device with Linux in ChromeOS settings. Compare the port list before and after connection. If Linux denies access, inspect the device's actual permissions; reconnect after adding the user to the required serial group if necessary. Do not assume a COM number or device path.

After identifying the actual port, replace `/dev/OBSERVED_PORT` below:

```bash
bash scripts/cpe-build.sh 00_esp32_boot_and_status_led upload /dev/OBSERVED_PORT
bash scripts/cpe-build.sh 00_esp32_boot_and_status_led monitor /dev/OBSERVED_PORT
```

The monitor uses 115200 baud. Close it before uploading again. `compile_all_only` is compile coverage and the wrapper rejects uploading it.

Arduino IDE **2.3.10**, ESP32 core **2.0.17**, and all five pinned sensor/JSON libraries are installed on this laptop. TinyGPSPlus 1.1.0 was absent from the Arduino library index, so that exact PlatformIO-resolved library, EspSoftwareSerial 8.2.0 and its ghostl dependency were copied into `~/Arduino/libraries`. Do not replace them with a different Library Manager version during this test sequence. System `python3-serial` and `libsecret-1-0` are installed for the Arduino tools and desktop application.

At the readiness recheck on 15 October, Linux disk allocation was 50 GB with approximately **20 GB free**, expanded since the initial setup. No existing personal files were removed to make space.

Readiness recheck: Adafruit ADS1X15 is now **2.6.2**, differing from the original pinned 2.5.0. The installed version was preserved and the packaged Test05 successfully compiled with the current Arduino installation. This is compile compatibility, not ADC measurement acceptance; PlatformIO remains pinned to 2.5.0.

Later same-day GitHub-baseline restoration supersedes that installed-version snapshot: ESP32 core **2.0.17**, MPU6050 **2.2.6**, ADS1X15 **2.5.0** and ArduinoJson **7.3.1** are restored. Before replacing the three libraries, their newer installed copies were preserved under ignored `.tools/library-backups/20261015-152454/`. Test01 source remains identical to live GitHub main commit7db97a3. Keep these versions during physical troubleshooting; source/toolchain consistency does not establish that the sensor is working.

Arduino IDE users: open the matching `.ino` under `firmware/arduino-ide/`, select **ESP32 Dev Module**, core **2.0.17**, and the observed Linux port. Follow [Arduino IDE instructions](../firmware/arduino-ide/README.md); old Windows paths/COM examples are historical. Never paste the whole sketch into `modules.h`. Private `solair_config.h` belongs inside each specific sketch folder and is not copied between tests.

## Wiring and actual data

Use the [test-by-test wiring tables](CPE_TEST_BY_TEST_WIRING_TABLES.md), [Tests 05–08 continuation](CPE_CONTINUE_TESTS_05_TO_08.md), and [complete acceptance checklist](COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md). Keep unverified interfaces disabled. ADS1115 accuracy remains unresolved; do not subtract a guessed offset.

USB ingestion through the CPE Lab uses the browser's real Web Serial connection. ChromeOS USB ownership may require switching between Linux upload/monitor and the Chrome browser; close the competing serial connection first. This still needs a connected-board test.

For Wi-Fi ingestion, the ESP32 must reach the laptop's actual private LAN address on port 3002. ChromeOS Linux runs behind a VM network: forward TCP 3002 to Linux, allow access only on the private bench network, and set `SOLAIR_INGEST_HOST` to the Linux container's actual private IPv4 before starting. Configure the device's URL with the laptop address reachable by the ESP32, not localhost or an assumed container address. Provision the device token privately in CPE Lab. LAN reachability and accepted physical telemetry still require a bench test; local app startup alone does not establish them.

## Reinstall local tools if needed

Install the official Node 24 Linux x64 distribution and verify its published SHA256 checksum. Then, from the application directory:

```bash
npm ci
python3 -m venv .tools/cpe-python
.tools/cpe-python/bin/python -m pip install platformio==6.1.18 pyserial==3.5
```

Use the official [Node 24 downloads](https://nodejs.org/dist/latest-v24.x/), [PlatformIO installation documentation](https://docs.platformio.org/en/latest/core/installation/), and [Arduino IDE installation instructions](https://support.arduino.cc/hc/en-us/articles/360019833020-Download-and-install-Arduino-IDE). Setup results for this laptop are recorded separately in [current validation](CPE_VALIDATION.md).

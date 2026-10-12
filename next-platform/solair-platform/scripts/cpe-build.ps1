param(
 [string]$Target = 'integrated',
 [string]$Port = '',
 [switch]$Upload,
 [switch]$Monitor
)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskPython=Join-Path $taskRoot '.tools\cpe-python\Scripts\python.exe'
if(!(Test-Path -LiteralPath $taskPython)){throw 'Missing isolated PlatformIO Python; follow firmware/README.md.'}
$taskToolchain=Join-Path $taskRoot '.tools\platformio'
$taskShort=Join-Path (Split-Path (Split-Path $taskRoot -Parent) -Parent) '.cpe-tools'
if(!(Test-Path -LiteralPath $taskShort)){New-Item -ItemType Junction -Path $taskShort -Target $taskToolchain | Out-Null}
$env:PLATFORMIO_CORE_DIR=$taskShort
$taskFirmware=Join-Path $taskRoot 'firmware\solair-cpe'
$taskTargets=@('integrated','compile_all_only','00_esp32_boot_and_status_led','01_i2c_mpu6050','02_tamper_switches','03_mosfet_logic_led_first','04_12v_alarm_fused','05_ads1115','06_acs758','07_gps_neo6m','08b_a7670e_esp_uart','09b_pzem_esp32_max3485','10_wifi_authenticated_ingest','11_combined_all_sensors_soak')
if($Target -notin $taskTargets){throw 'Unknown target. Use firmware/README.md.'}
if($Upload -and ($Target -eq 'compile_all_only')){throw 'Compile coverage only; never upload this target.'}
if(($Upload -or $Monitor) -and $Port -notmatch '^COM[1-9][0-9]*$'){throw 'Supply the verified actual CP2102 COM port; no default port is selected.'}
if($Monitor){& $taskPython -m platformio device monitor --port $Port --baud 115200; exit $LASTEXITCODE}
$taskArguments=@('-m','platformio','run','--project-dir',$taskFirmware,'-e',$Target,'-j','2')
if($Upload){$taskArguments+=@('--target','upload','--upload-port',$Port)}
& $taskPython @taskArguments
if($LASTEXITCODE -ne 0){throw 'CPE build/upload failed; do not proceed to physical tests.'}

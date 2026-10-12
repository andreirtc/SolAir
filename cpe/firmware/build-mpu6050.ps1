param(
  [string]$Cli = 'C:\Users\Anyang\AppData\Local\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Cli)) { throw 'Arduino CLI not found. See README.md.' }
$version = & $Cli version
if ($LASTEXITCODE -ne 0 -or $version -notmatch 'Version: 1\.4\.1\b') { throw 'Arduino CLI 1.4.1 required.' }
# Compile only. Separate output preserves serial-test build artifacts.
& $Cli --config-file "$PSScriptRoot\arduino-cli.yaml" compile --profile mpu6050_diagnostic --build-path "$PSScriptRoot\build\mpu6050-diagnostic" "$PSScriptRoot\mpu6050-diagnostic"
if ($LASTEXITCODE -ne 0) { throw 'MPU6050 compilation failed; do not upload.' }

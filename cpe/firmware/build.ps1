param(
  [string]$Cli = 'C:\Users\Anyang\AppData\Local\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Cli)) { throw 'Arduino CLI not found. See README.md.' }
$version = & $Cli version
if ($LASTEXITCODE -ne 0 -or $version -notmatch 'Version: 1\.4\.1\b') {
  throw 'This project requires the documented Arduino CLI 1.4.1.'
}
# Compile only. Missing pinned packages are downloaded into .arduino.
& $Cli --config-file "$PSScriptRoot\arduino-cli.yaml" compile --profile serial_test --build-path "$PSScriptRoot\build" "$PSScriptRoot\serial-test"
if ($LASTEXITCODE -ne 0) { throw 'Compilation failed; do not upload.' }

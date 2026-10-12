$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
# Never print secrets or accept them as command arguments. Generated header is ignored.
function Read-Private([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
function C-String([string]$Value) {
  if ($Value.Contains("`n") -or $Value.Contains("`r")) { throw 'Single line required.' }
  return '"' + $Value.Replace('\','\\').Replace('"','\"') + '"'
}
$ssid = Read-Private 'Wi-Fi SSID (hidden)'
$password = Read-Private 'Wi-Fi password (hidden)'
$hostAddress = Read-Host 'This PC private LAN IPv4 address (ipconfig)'
if ($hostAddress -notmatch '^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$') { throw 'Private IPv4 required.' }
if (@($hostAddress.Split('.') | Where-Object { [int]$_ -gt 255 }).Count -gt 0) { throw 'Invalid IPv4 octet; configuration was not written.' }
New-Item -ItemType Directory -Force -Path data | Out-Null
$tokenPath = Join-Path (Get-Location) 'data/device-token.txt'
if (Test-Path -LiteralPath $tokenPath) { $token = [IO.File]::ReadAllText($tokenPath).Trim() }
else {
  $bytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  $token = ([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant()
  [IO.File]::WriteAllText($tokenPath, $token)
}
if ($token -notmatch '^[a-f0-9]{64}$') { throw 'Invalid token file; do not display its contents.' }
$header = "#pragma once`nconst char *WIFI_SSID = $(C-String $ssid);`nconst char *WIFI_PASSWORD = $(C-String $password);`nconst char *INGEST_URL = $(C-String "http://${hostAddress}:3002/ingest");`nconst char *DEVICE_TOKEN = $(C-String $token);`n"
[IO.File]::WriteAllText((Join-Path (Get-Location) 'firmware/anti-tamper/secrets.h'), $header)
$ssid = $password = $token = $header = $null
Write-Host 'Private configuration saved locally. Never share secrets.h, token file, or compiled firmware.'
Write-Host "For receiver startup in this terminal: `$env:SOLAIR_DEVICE_HOST = '$hostAddress'"

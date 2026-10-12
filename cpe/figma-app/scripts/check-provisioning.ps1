$ErrorActionPreference = 'Stop'
$originalLocation = Get-Location
$taskRoot = Join-Path ([IO.Path]::GetTempPath()) ('solair-provision-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path (Join-Path $taskRoot 'scripts') -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $taskRoot 'firmware/anti-tamper') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'provision-hardware.ps1') -Destination (Join-Path $taskRoot 'scripts/provision-hardware.ps1')
# Only disposable synthetic configuration; never reads working secrets/databases.
function Read-Host { param([string]$Prompt, [switch]$AsSecureString)
  if ($AsSecureString) { return ConvertTo-SecureString 'TEST "FIXTURE"\Wi-Fi' -AsPlainText -Force }
  return $global:solairProvisionFixtureAddress
}
try {
  foreach ($address in @('192.168.1.999', '127.0.0.1', '8.8.8.8')) {
    $global:solairProvisionFixtureAddress = $address
    $rejected = $false
    try { & (Join-Path $taskRoot 'scripts/provision-hardware.ps1') }
    catch { $rejected = $true }
    if (!$rejected -or (Test-Path -LiteralPath (Join-Path $taskRoot 'data/device-token.txt'))) { throw 'Invalid address was not rejected before writing configuration.' }
  }
  $global:solairProvisionFixtureAddress = '192.168.1.123'
  & (Join-Path $taskRoot 'scripts/provision-hardware.ps1') | Out-Null
  $tokenPath = Join-Path $taskRoot 'data/device-token.txt'
  $headerPath = Join-Path $taskRoot 'firmware/anti-tamper/secrets.h'
  $token = [IO.File]::ReadAllText($tokenPath)
  $header = [IO.File]::ReadAllText($headerPath)
  if ($token -notmatch '^[a-f0-9]{64}$' -or !$header.Contains('http://192.168.1.123:3002/ingest') -or !$header.Contains($token)) { throw 'Provisioned synthetic identity/URL mismatch.' }
  if (!$header.Contains('TEST \"FIXTURE\"\\Wi-Fi')) { throw 'Credential C-string escaping failed.' }
  & (Join-Path $taskRoot 'scripts/provision-hardware.ps1') | Out-Null
  if ([IO.File]::ReadAllText($tokenPath) -ne $token) { throw 'Existing device token was replaced.' }
  $token = $header = $null
  Write-Output 'PASS provisioning: invalid/private IPv4 gate before writes, matching header/token, credential escaping, stable token reuse; temporary TEST FIXTURE files only.'
} finally {
  Set-Location $originalLocation
  Remove-Variable -Name solairProvisionFixtureAddress -Scope Global -ErrorAction SilentlyContinue
  $resolvedTask = [IO.Path]::GetFullPath($taskRoot)
  $tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  if (!$resolvedTask.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -or !(Split-Path $resolvedTask -Leaf).StartsWith('solair-provision-')) { throw 'Unsafe cleanup path.' }
  Remove-Item -LiteralPath $resolvedTask -Recurse -Force
}

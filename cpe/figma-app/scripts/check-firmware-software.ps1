param([string]$VcVars = 'C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat')
$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath $VcVars)) { throw 'MSVC Build Tools required for the portable firmware logic check; pass -VcVars for another installation.' }
$taskDirectory = Join-Path ([IO.Path]::GetTempPath()) ('solair-firmware-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $taskDirectory | Out-Null
$source = Join-Path $PSScriptRoot 'check-firmware-software.cpp'
try {
  # Fixed compiler commands only; cleanup stays in PowerShell.
  $compile = 'call "' + $VcVars + '" >nul && cl /nologo /std:c++17 /EHsc /W4 "' + $source + '" /Fe:"' + $taskDirectory + '\check.exe" /Fo:"' + $taskDirectory + '\check.obj"'
  & cmd.exe /d /c $compile
  if ($LASTEXITCODE -ne 0) { throw 'Portable firmware test compilation failed.' }
  & (Join-Path $taskDirectory 'check.exe')
  if ($LASTEXITCODE -ne 0) { throw 'Portable firmware test failed.' }
} finally {
  $resolvedTask = [IO.Path]::GetFullPath($taskDirectory)
  $tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  if (!$resolvedTask.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -or !(Split-Path $resolvedTask -Leaf).StartsWith('solair-firmware-')) { throw 'Unsafe cleanup path.' }
  Remove-Item -LiteralPath $resolvedTask -Recurse -Force
}

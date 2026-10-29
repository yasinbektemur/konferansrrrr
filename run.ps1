$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (Test-Path ".runtime/node/node.exe") { $env:Path = "$PSScriptRoot/.runtime/node;" + $env:Path }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Önce install.ps1 çalıştırın." }
& node scripts/run.mjs @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

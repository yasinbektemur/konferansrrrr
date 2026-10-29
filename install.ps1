$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
function Step($Text) { Write-Host "`n[Konferans Radar] $Text" -ForegroundColor Cyan }
function Valid-Node {
 if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $false }
 & node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1);const db=new(require('node:sqlite').DatabaseSync)(':memory:');db.close()" 2>$null
 return ($LASTEXITCODE -eq 0 -and [bool](Get-Command npm.cmd -ErrorAction SilentlyContinue))
}
$temporary = $null
try {
 if (Test-Path ".runtime/node/node.exe") { $env:Path = "$PSScriptRoot/.runtime/node;" + $env:Path }
 if (-not (Valid-Node)) {
  Step "Node.js 24 proje klasörüne kuruluyor"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $architecture = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") { "arm64" } elseif ($env:PROCESSOR_ARCHITECTURE -eq "AMD64" -or $env:PROCESSOR_ARCHITEW6432 -eq "AMD64") { "x64" } else { throw "64 bit Windows gerekli." }
  $temporary = Join-Path ([IO.Path]::GetTempPath()) ("radar-node-" + [guid]::NewGuid())
  New-Item -ItemType Directory -Path $temporary | Out-Null
  $base = "https://nodejs.org/dist/latest-v24.x"
  $checksums = (Invoke-WebRequest "$base/SHASUMS256.txt" -UseBasicParsing).Content
  $match = [regex]::Match($checksums, "(?m)^([a-f0-9]{64})\s+(node-v24\.\d+\.\d+-win-$architecture\.zip)\s*$")
  if (-not $match.Success) { throw "Resmi Node.js paketi bulunamadı." }
  $archive = Join-Path $temporary $match.Groups[2].Value
  Invoke-WebRequest "$base/$($match.Groups[2].Value)" -OutFile $archive -UseBasicParsing
  if ((Get-FileHash $archive -Algorithm SHA256).Hash.ToLower() -ne $match.Groups[1].Value) { throw "SHA-256 doğrulaması başarısız." }
  Expand-Archive $archive -DestinationPath $temporary
  $extracted = Join-Path $temporary ([IO.Path]::GetFileNameWithoutExtension($archive))
  & (Join-Path $extracted "node.exe") -e "require('node:sqlite')"
  if ($LASTEXITCODE -ne 0) { throw "İndirilen Node.js çalıştırılamadı." }
  New-Item -ItemType Directory -Path ".runtime" -Force | Out-Null
  if (Test-Path ".runtime/node") { Move-Item ".runtime/node" (".runtime/node-previous-" + [guid]::NewGuid()) }
  Move-Item $extracted ".runtime/node"
  $env:Path = "$PSScriptRoot/.runtime/node;" + $env:Path
 }
 & node scripts/setup.mjs
 if ($LASTEXITCODE -ne 0) { throw "Kurulum başarısız. Üstteki hatayı giderip yeniden deneyin." }
} catch { Write-Error $_; exit 1 }
finally { if ($temporary -and (Test-Path $temporary)) { Remove-Item $temporary -Recurse -Force } }

# =====================================================================
# SchoolPro - Windows 10/11 MSIX Modern Package Builder
# =====================================================================

param (
    [string]$Version = "1.0.0.0"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path "$ScriptDir\.."
$DistDir = "$RootDir\dist"
$MsixStagingDir = "$DistDir\msix-staged"
$OutputDir = "$DistDir\installer"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SchoolPro Windows MSIX Modern Packaging Engine" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean and prepare staging
if (Test-Path $MsixStagingDir) { Remove-Item -Recurse -Force $MsixStagingDir }
New-Item -ItemType Directory -Force -Path $MsixStagingDir | Out-Null
if (!(Test-Path $OutputDir)) { New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null }

# 2. Stage AppxManifest.xml and Visual Assets
Write-Host "`n[1/4] Staging AppxManifest and Visual Assets..." -ForegroundColor Yellow
Copy-Item "$ScriptDir\msix\AppxManifest.xml" "$MsixStagingDir\AppxManifest.xml" -Force
Copy-Item -Recurse "$ScriptDir\msix\Assets" "$MsixStagingDir\Assets" -Force

# 3. Stage Application Binaries
Write-Host "`n[2/4] Staging Application Binaries from win-unpacked..." -ForegroundColor Yellow
$WinUnpacked = "$DistDir\win-unpacked"
if (Test-Path $WinUnpacked) {
    Copy-Item -Recurse "$WinUnpacked\*" "$MsixStagingDir\" -Force
    Write-Host "  -> Staged binaries from: $WinUnpacked" -ForegroundColor DarkCyan
} else {
    Write-Host "  -> [Warning] win-unpacked directory not found. Please run build-windows-installer.ps1 first." -ForegroundColor Yellow
}

# 4. Search for Windows SDK MakeAppx.exe
Write-Host "`n[3/4] Searching for Windows SDK MakeAppx.exe..." -ForegroundColor Yellow
$MakeAppxPaths = Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\MakeAppx.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName

$MakeAppx = $null
if ($MakeAppxPaths) {
    $MakeAppx = $MakeAppxPaths | Select-Object -Last 1
}

$OutputMsix = "$OutputDir\SchoolPro_v$Version.msix"

if ($MakeAppx -and (Test-Path $MakeAppx)) {
    Write-Host "  -> Found MakeAppx at: $MakeAppx" -ForegroundColor Green
    Write-Host "  -> Packaging MSIX container..." -ForegroundColor Yellow
    & $MakeAppx pack /d $MsixStagingDir /p $OutputMsix /nv /o
    
    if (Test-Path $OutputMsix) {
        $Hash = (Get-FileHash -Path $OutputMsix -Algorithm SHA256).Hash.ToUpper()
        Write-Host "`n[4/4] MSIX Package Generated Successfully!" -ForegroundColor Green
        Write-Host "  Package Path: $OutputMsix" -ForegroundColor White
        Write-Host "  SHA-256 Hash: $Hash" -ForegroundColor Green
    }
} else {
    Write-Host "  [Notice] Windows SDK MakeAppx.exe not detected on system." -ForegroundColor Yellow
    Write-Host "  MSIX staging layout is fully prepared at: $MsixStagingDir" -ForegroundColor White
    Write-Host "  You can package this folder using Windows SDK MakeAppx or MSIX Packaging Tool." -ForegroundColor White
}

Write-Host "`nMSIX packaging pipeline completed!" -ForegroundColor Green

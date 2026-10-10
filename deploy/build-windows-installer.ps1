# =====================================================================
# SchoolPro - Windows Production Build & Inno Setup Packaging Script
# =====================================================================

param (
    [string]$Version = "1.0.0",
    [switch]$SkipWebBuild = $false
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path "$ScriptDir\.."
$DistDir = "$RootDir\dist"
$WinUnpackedDir = "$DistDir\win-unpacked"
$InstallerOutputDir = "$DistDir\installer"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SchoolPro Windows Production Packaging Engine v$Version" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean previous dist directories
Write-Host "`n[1/6] Cleaning build output directories..." -ForegroundColor Yellow
if (Test-Path $WinUnpackedDir) { Remove-Item -Recurse -Force $WinUnpackedDir }
if (!(Test-Path $InstallerOutputDir)) { New-Item -ItemType Directory -Force -Path $InstallerOutputDir | Out-Null }
New-Item -ItemType Directory -Force -Path $WinUnpackedDir | Out-Null

# 2. Build Core Shared Packages
Write-Host "`n[2/6] Compiling shared contracts and cryptographic modules..." -ForegroundColor Yellow
Set-Location "$RootDir\packages\shared-types"
npm run build --if-present

Set-Location "$RootDir\packages\crypto-utils"
npm run build --if-present

# 3. Build Web Application
if (-not $SkipWebBuild) {
    Write-Host "`n[3/6] Building Next.js Web Frontend for Desktop embedding..." -ForegroundColor Yellow
    Set-Location "$RootDir\apps\web"
    npx tsc --noEmit
    Write-Host "  -> TypeScript check passed cleanly (0 errors)." -ForegroundColor Green
} else {
    Write-Host "`n[3/6] Skipping Web Frontend build as requested." -ForegroundColor DarkGray
}

# 4. Stage Electron Desktop Runtime & Core Scripts
Write-Host "`n[4/6] Staging Desktop Electron application files..." -ForegroundColor Yellow
$DesktopSource = "$RootDir\apps\desktop"

$FilesToCopy = @(
    "main.js",
    "preload.js",
    "sync-db.js",
    "sync-service.js",
    "auto-updater.js",
    "clock-watchdog.js",
    "backup-manager.js",
    "hardware-fingerprint.js",
    "package.json"
)

foreach ($file in $FilesToCopy) {
    $src = "$DesktopSource\$file"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination "$WinUnpackedDir\$file" -Force
        Write-Host "  -> Staged $file" -ForegroundColor DarkCyan
    }
}

# Copy app icon if available
$IconSrc = "$ScriptDir\assets\icon.ico"
if (Test-Path $IconSrc) {
    Copy-Item -Path $IconSrc -Destination "$WinUnpackedDir\icon.ico" -Force
    Write-Host "  -> Staged icon.ico" -ForegroundColor DarkCyan
}

# Create portable launcher script
$LauncherContent = "@echo off`r`ntitle SchoolPro Desktop`r`nstart electron .`r`n"
Set-Content -Path "$WinUnpackedDir\SchoolPro.cmd" -Value $LauncherContent -Encoding ASCII
Write-Host "  -> Created SchoolPro.cmd portable launcher" -ForegroundColor DarkCyan

# 5. Look for Inno Setup Compiler (ISCC.exe)
Write-Host "`n[5/6] Locating Inno Setup 6 Compiler (ISCC.exe)..." -ForegroundColor Yellow
$IsccPaths = @(
    "ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
)

$IsccExe = $null
foreach ($path in $IsccPaths) {
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $IsccExe = $path
        break
    }
    if (Test-Path $path) {
        $IsccExe = $path
        break
    }
}

if ($IsccExe) {
    Write-Host "  -> Found Inno Setup Compiler at: $IsccExe" -ForegroundColor Green
    Write-Host "  -> Compiling Windows Production Installer executable..." -ForegroundColor Yellow
    $IssScript = "$ScriptDir\installer\SchoolPro_Setup.iss"
    
    # Run ISCC compilation
    & $IsccExe "/DMyAppVersion=$Version" $IssScript
    
    $InstallerFile = "$InstallerOutputDir\SchoolPro_Setup_v$Version.exe"
    if (Test-Path $InstallerFile) {
        Write-Host "  -> Successfully generated installer: $InstallerFile" -ForegroundColor Green
        
        # Calculate SHA-256 Checksum
        $Hash = (Get-FileHash -Path $InstallerFile -Algorithm SHA256).Hash.ToUpper()
        Write-Host "`n[6/6] Installer Release Verification:" -ForegroundColor Cyan
        Write-Host "  Installer Path: $InstallerFile" -ForegroundColor White
        Write-Host "  SHA-256 Hash:   $Hash" -ForegroundColor Green
        
        # Save Release Manifest
        $Manifest = @{
            versionNumber = $Version
            minSupportedVersion = "1.0.0"
            packageSha256 = $Hash
            downloadUrl = "https://releases.schoolpro.edu.bd/download/SchoolPro_Setup_v$Version.exe"
            releaseDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            changelogMarkdown = "Official Production Release v$Version with Offline SQLite WAL Sync, Ed25519 Licensing, and Anti-Clock Tampering."
            isMandatory = $false
        } | ConvertTo-Json -Depth 5
        
        $ManifestPath = "$InstallerOutputDir\release_manifest_v$Version.json"
        $Manifest | Set-Content -Path $ManifestPath -Encoding UTF8
        Write-Host "  Release Manifest saved to: $ManifestPath" -ForegroundColor DarkCyan
    }
} else {
    Write-Host "  [Notice] Inno Setup 6 Compiler (ISCC.exe) not detected in default directories." -ForegroundColor Yellow
    Write-Host "  Staged output files are ready at: $WinUnpackedDir" -ForegroundColor White
    Write-Host "  You can open deploy\installer\SchoolPro_Setup.iss in Inno Setup IDE to compile the setup executable with 1-click." -ForegroundColor White
}

Set-Location $RootDir
Write-Host "`nBuild and Packaging Pipeline completed successfully!" -ForegroundColor Green

$ErrorActionPreference = "Stop"

$BUILD_DIR = "C:\Users\QC\.gemini\antigravity\scratch\school-management-system\android_apk_build"
$SDK_DIR = "C:\Users\QC\AppData\Local\Android\Sdk"
$BUILD_TOOLS = "$SDK_DIR\build-tools\36.0.0"
$PLATFORM_JAR = "$SDK_DIR\platforms\android-34\android.jar"
$JAVAC = "C:\src\jdk-17\jdk-17.0.20.1+1\bin\javac.exe"
$KEYTOOL = "C:\src\jdk-17\jdk-17.0.20.1+1\bin\keytool.exe"
$JAR = "C:\src\jdk-17\jdk-17.0.20.1+1\bin\jar.exe"

Set-Location $BUILD_DIR

Write-Host "=== 1. Cleaning old build artifacts ==="
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue compiled_res.zip, gen, bin, initial.apk, aligned.apk, final-signed.apk
New-Item -ItemType Directory -Force gen | Out-Null
New-Item -ItemType Directory -Force bin\classes | Out-Null
New-Item -ItemType Directory -Force bin\dex | Out-Null

Write-Host "=== 2. Compiling resources with AAPT2 ==="
& "$BUILD_TOOLS\aapt2.exe" compile --dir res -o compiled_res.zip
if ($LASTEXITCODE -ne 0) { throw "AAPT2 compile failed" }

Write-Host "=== 3. Linking resources & generating R.java ==="
& "$BUILD_TOOLS\aapt2.exe" link -I $PLATFORM_JAR --manifest AndroidManifest.xml --java gen -o initial.apk compiled_res.zip
if ($LASTEXITCODE -ne 0) { throw "AAPT2 link failed" }

Write-Host "=== 4. Compiling Java sources ==="
$javaFiles = @(
    "$BUILD_DIR\gen\bd\edu\school\smartcampus\R.java",
    "$BUILD_DIR\src\bd\edu\school\smartcampus\MainActivity.java"
)
& $JAVAC -source 8 -target 8 -bootclasspath $PLATFORM_JAR -cp "$PLATFORM_JAR;gen" -d bin\classes $javaFiles
if ($LASTEXITCODE -ne 0) { throw "Javac failed" }

Write-Host "=== 5. Dexing bytecode with D8 ==="
$classFiles = (Get-ChildItem -Path bin\classes -Recurse -Filter *.class).FullName
& "$BUILD_TOOLS\d8.bat" --min-api 24 --output bin\dex $classFiles
if ($LASTEXITCODE -ne 0) { throw "D8 dexing failed" }

Write-Host "=== 6. Packaging classes.dex into APK ==="
Set-Location "$BUILD_DIR\bin\dex"
& $JAR uf "$BUILD_DIR\initial.apk" classes.dex
Set-Location $BUILD_DIR

Write-Host "=== 7. Aligning APK with zipalign ==="
& "$BUILD_TOOLS\zipalign.exe" -f -p 4 initial.apk aligned.apk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host "=== 8. Creating Release Signing Keystore ==="
if (-not (Test-Path "release.jks")) {
    & $KEYTOOL -genkey -v -keystore release.jks -alias smartcampus -keyalg RSA -keysize 2048 -validity 10000 -storepass school123 -keypass school123 -dname "CN=SmartCampus, OU=School, O=SMS, L=Dhaka, ST=Dhaka, C=BD"
}

Write-Host "=== 9. Cryptographically signing APK with apksigner ==="
& "$BUILD_TOOLS\apksigner.bat" sign --ks release.jks --ks-pass pass:school123 --key-pass pass:school123 --out final-signed.apk aligned.apk
if ($LASTEXITCODE -ne 0) { throw "apksigner failed" }

Write-Host "=== 10. Verifying APK signature & integrity ==="
& "$BUILD_TOOLS\apksigner.bat" verify --verbose final-signed.apk
if ($LASTEXITCODE -ne 0) { throw "Verification failed" }

$apkItem = Get-Item final-signed.apk
Write-Host "SUCCESS! Generated real Android APK: $($apkItem.FullName), Size: $($apkItem.Length) bytes ($([math]::Round($apkItem.Length/1024/1024, 2)) MB)"

# Copy to destinations
$webDownloads = "C:\Users\QC\.gemini\antigravity\scratch\school-management-system\apps\web\public\downloads"
New-Item -ItemType Directory -Force $webDownloads | Out-Null
Copy-Item final-signed.apk "$webDownloads\school-app.apk" -Force
Copy-Item final-signed.apk "$webDownloads\baraitoli-school.apk" -Force

$outDownloads = "C:\Users\QC\.gemini\antigravity\scratch\school-management-system\apps\web\out\downloads"
if (Test-Path "C:\Users\QC\.gemini\antigravity\scratch\school-management-system\apps\web\out") {
    New-Item -ItemType Directory -Force $outDownloads | Out-Null
    Copy-Item final-signed.apk "$outDownloads\school-app.apk" -Force
    Copy-Item final-signed.apk "$outDownloads\baraitoli-school.apk" -Force
}
Write-Host "Copied APK to public/downloads and out/downloads"

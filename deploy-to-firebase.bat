@echo off
title School Management System - Firebase Hosting Deployer
color 0b
cd /d "%~dp0"
echo ========================================================
echo       Google Firebase Hosting Deployment
echo       Project: bhsedu-e0906
echo ========================================================
echo.
echo [1/2] Checking Firebase Authentication...
echo If a browser window opens, please sign in with your Google account.
echo.
call npx --yes firebase-tools@latest login
if errorlevel 1 (
    echo.
    echo [ERROR] Firebase login failed or cancelled.
    pause
    exit /b 1
)

echo.
echo [2/2] Deploying website to Google Firebase Hosting...
echo.
call npx --yes firebase-tools@latest deploy --only hosting --project bhsedu-e0906
if errorlevel 1 (
    echo.
    echo [ERROR] Deployment failed. Please check internet connection.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [SUCCESS] Your school website is LIVE on the internet!
echo.
echo URL 1: https://bhsedu-e0906.web.app
echo URL 2: https://bhsedu-e0906.firebaseapp.com
echo ========================================================
echo.
start https://bhsedu-e0906.web.app
pause

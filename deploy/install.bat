@echo off
setlocal enabledelayedexpansion

:: M.A.R.S Installation Script for Windows Server 2016 with Laragon
:: Run this script as Administrator after installing Laragon

echo ============================================
echo   M.A.R.S Installation Script
echo   Hospital IT Task Management System
echo ============================================
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run this script as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

:: Set variables
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "LARAGON_DIR=C:\laragon"
set "WWW_DIR=%LARAGON_DIR%\www\mars"

:: Check if Laragon is installed
if not exist "%LARAGON_DIR%\laragon.exe" (
    echo ERROR: Laragon not found at %LARAGON_DIR%
    echo Please install Laragon first from https://laragon.org/download/
    pause
    exit /b 1
)

echo [1/7] Checking Laragon installation... OK
echo.

:: Copy project files to Laragon www folder
echo [2/7] Copying project files to %WWW_DIR%...
if exist "%WWW_DIR%" (
    echo Removing existing installation...
    rmdir /s /q "%WWW_DIR%"
)
xcopy "%PROJECT_DIR%" "%WWW_DIR%\" /E /I /H /Y >nul
echo Done.
echo.

:: Copy production environment files
echo [3/7] Setting up production environment...
copy /Y "%WWW_DIR%\deploy\env\backend.env" "%WWW_DIR%\backend\.env" >nul
copy /Y "%WWW_DIR%\deploy\env\frontend.env" "%WWW_DIR%\frontend\.env" >nul

:: Generate Laravel app key
cd /d "%WWW_DIR%\backend"
call "%LARAGON_DIR%\bin\php\php-8.3.0-Win32-vs16-x64\php.exe" artisan key:generate --force
echo Done.
echo.

:: Install PHP dependencies
echo [4/7] Installing PHP dependencies (this may take a few minutes)...
cd /d "%WWW_DIR%\backend"
call "%LARAGON_DIR%\bin\composer\composer.bat" install --no-dev --optimize-autoloader
echo Done.
echo.

:: Run database migrations
echo [5/7] Setting up database...
cd /d "%WWW_DIR%\backend"

:: Create SQLite database file if it doesn't exist
if not exist "%WWW_DIR%\backend\database\database.sqlite" (
    echo Creating database file...
    type nul > "%WWW_DIR%\backend\database\database.sqlite"
)

call "%LARAGON_DIR%\bin\php\php-8.3.0-Win32-vs16-x64\php.exe" artisan migrate --force
call "%LARAGON_DIR%\bin\php\php-8.3.0-Win32-vs16-x64\php.exe" artisan db:seed --force
echo Done.
echo.

:: Build frontend
echo [6/7] Building frontend (this may take a few minutes)...
cd /d "%WWW_DIR%\frontend"
call "%LARAGON_DIR%\bin\nodejs\node-v18\npm.cmd" install
call "%LARAGON_DIR%\bin\nodejs\node-v18\npm.cmd" run build
echo Done.
echo.

:: Configure Windows Firewall
echo [7/7] Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="MARS Backend" >nul 2>&1
netsh advfirewall firewall delete rule name="MARS Frontend" >nul 2>&1
netsh advfirewall firewall add rule name="MARS Backend" dir=in action=allow protocol=tcp localport=8000
netsh advfirewall firewall add rule name="MARS Frontend" dir=in action=allow protocol=tcp localport=80
echo Done.
echo.

:: Create backups folder
if not exist "%WWW_DIR%\backups" mkdir "%WWW_DIR%\backups"

echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Start Laragon (it should auto-start Apache)
echo 2. Run 'start.bat' to start the backend server
echo 3. Access the system at: http://localhost
echo 4. For LAN access, use: http://YOUR_SERVER_IP
echo.
echo To enable auto-start on boot:
echo - Open Laragon ^> Menu ^> Preferences
echo - Check "Run Laragon when Windows starts"
echo.
pause

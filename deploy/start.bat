@echo off
:: M.A.R.S Service Starter
:: Starts the Laravel backend API server

echo ============================================
echo   Starting M.A.R.S Services
echo ============================================
echo.

set "LARAGON_DIR=C:\laragon"
set "WWW_DIR=%LARAGON_DIR%\www\mars"
set "PHP_PATH=%LARAGON_DIR%\bin\php\php-8.3.0-Win32-vs16-x64\php.exe"

:: Check if PHP exists
if not exist "%PHP_PATH%" (
    echo ERROR: PHP not found. Please check Laragon installation.
    pause
    exit /b 1
)

:: Get server IP for LAN access
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "SERVER_IP=%%a"
    goto :found_ip
)
:found_ip
set "SERVER_IP=%SERVER_IP: =%"

echo Starting Laravel backend server...
echo.
echo Access URLs:
echo   Local:   http://localhost:8000
echo   LAN:     http://%SERVER_IP%:8000
echo.
echo Frontend is served by Laragon's Apache at:
echo   Local:   http://localhost/mars
echo   LAN:     http://%SERVER_IP%/mars
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

cd /d "%WWW_DIR%\backend"
"%PHP_PATH%" artisan serve --host=0.0.0.0 --port=8000

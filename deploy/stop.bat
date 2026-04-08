@echo off
:: M.A.R.S Service Stopper
:: Stops the Laravel backend server

echo ============================================
echo   Stopping M.A.R.S Services
echo ============================================
echo.

:: Find and kill PHP artisan serve process
echo Stopping Laravel backend server...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq php.exe" /fo list ^| findstr "PID:"') do (
    taskkill /pid %%a /f >nul 2>&1
)

echo.
echo Services stopped.
echo.
pause

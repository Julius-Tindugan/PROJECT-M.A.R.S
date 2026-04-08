@echo off
:: M.A.R.S Database Backup Script
:: Creates a timestamped backup of the SQLite database

echo ============================================
echo   M.A.R.S Database Backup
echo ============================================
echo.

set "LARAGON_DIR=C:\laragon"
set "WWW_DIR=%LARAGON_DIR%\www\mars"
set "DB_FILE=%WWW_DIR%\backend\database\database.sqlite"
set "BACKUP_DIR=%WWW_DIR%\backups"

:: Create backup folder if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Generate timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"

:: Check if database exists
if not exist "%DB_FILE%" (
    echo ERROR: Database file not found at %DB_FILE%
    pause
    exit /b 1
)

:: Create backup
set "BACKUP_FILE=%BACKUP_DIR%\database_%TIMESTAMP%.sqlite"
echo Creating backup: %BACKUP_FILE%
copy /Y "%DB_FILE%" "%BACKUP_FILE%" >nul

if %errorlevel% equ 0 (
    echo.
    echo Backup created successfully!
    echo Location: %BACKUP_FILE%

    :: Show backup folder contents
    echo.
    echo Existing backups:
    dir /b "%BACKUP_DIR%\*.sqlite" 2>nul
) else (
    echo ERROR: Backup failed!
)

echo.
pause

@echo off
cd /d "C:\Users\Julius\Desktop\Personal Web Projects\web-app\frontend"
echo ===== RUNNING npm run typecheck =====
call npm run typecheck
echo.
echo ===== RUNNING npm run build =====
call npm run build
echo.
echo ===== RUNNING npm run test =====
call npm run test

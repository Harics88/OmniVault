@echo off
REM ==========================================
REM    MyTasker - View Logs
REM ==========================================

echo.
echo ==========================================
echo    MyTasker Logs
echo ==========================================
echo.
echo Press Ctrl+C to stop viewing logs
echo.

cd /d "%~dp0"

docker-compose logs -f --tail=100

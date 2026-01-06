@echo off
REM ==========================================
REM    MyTasker - Stop Script
REM ==========================================

echo.
echo Stopping MyTasker...
echo.

cd /d "%~dp0"

docker-compose down

echo.
echo MyTasker has been stopped.
echo.
pause

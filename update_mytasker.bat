@echo off
REM ==========================================
REM    MyTasker - Update Script
REM ==========================================

echo.
echo ==========================================
echo    MyTasker Update
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/5] Creating backup before update...
call backup_mytasker.bat

echo.
echo [2/5] Pulling latest changes from GitHub...
git pull origin main

if %errorlevel% neq 0 (
    echo [WARNING] Git pull failed. Continuing with rebuild...
)

echo.
echo [3/5] Stopping current containers...
docker-compose down

echo.
echo [4/5] Rebuilding containers with latest code...
docker-compose build --no-cache

echo.
echo [5/5] Starting updated MyTasker...
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo ==========================================
echo    Update Complete!
echo ==========================================
echo.
echo MyTasker has been updated to the latest version.
echo.
echo Opening MyTasker...
start http://localhost:3001

echo.
pause

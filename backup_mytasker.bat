@echo off
REM ==========================================
REM    MyTasker - Backup Script
REM ==========================================

echo.
echo ==========================================
echo    MyTasker Database Backup
echo ==========================================
echo.

cd /d "%~dp0"

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start MyTasker first.
    pause
    exit /b 1
)

echo Creating backup...
docker-compose exec -T backend python backup_db.py backup

echo.
echo Listing all backups:
docker-compose exec -T backend python backup_db.py list

echo.
echo Backup completed!
echo.
echo Backups are stored in: data\backups\
echo.
pause

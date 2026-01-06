@echo off
REM ==========================================
REM    MyTasker - Windows Desktop Launcher
REM    Docker-based deployment (Recommended)
REM ==========================================

echo.
echo ==========================================
echo    MyTasker - Local Productivity App
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running.
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    echo After installation, restart this script.
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker Desktop is not running.
    echo.
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (this may take 30-60 seconds)...
    timeout /t 30 /nobreak >nul
    
    REM Check again
    docker ps >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker failed to start. Please start Docker Desktop manually.
        pause
        exit /b 1
    )
)

echo [OK] Docker is running
echo.

REM Navigate to script directory
cd /d "%~dp0"

REM Check if docker-compose.yml exists
if not exist docker-compose.yml (
    echo [ERROR] docker-compose.yml not found!
    echo Please run this script from the MyTasker directory.
    pause
    exit /b 1
)

echo [1/4] Stopping any existing containers...
docker-compose down >nul 2>&1

echo [2/4] Building containers (this may take a few minutes on first run)...
docker-compose build

echo [3/4] Starting MyTasker services...
docker-compose up -d

echo [4/4] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check health status
echo.
echo Checking service health...
docker-compose ps

echo.
echo ==========================================
echo    MyTasker is now running!
echo ==========================================
echo.
echo Frontend: http://localhost:3001
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Health Check: http://localhost:8000/api/health
echo.
echo To stop MyTasker, run: docker-compose down
echo To view logs, run: docker-compose logs -f
echo.

REM Open browser
echo Opening MyTasker in your default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3001

echo.
echo Press any key to exit (MyTasker will continue running)...
pause >nul

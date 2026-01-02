@echo off
echo ==========================================
echo    MyTasker Native Launcher (Windows)
echo    Fixes Local File Opening Issues
echo ==========================================

REM Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python.
    pause
    exit /b
)

REM Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js.
    pause
    exit /b
)

echo [1/3] Setting up Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
pip install uvicorn aiosqlite

echo [2/3] Setting up Frontend...
cd ..\frontend
call npm install

echo [3/3] Starting Services...
echo.
echo - Backend will run at http://localhost:8000
echo - Frontend will run at http://localhost:3000
echo.

start "MyTasker Backend" cmd /k "cd ..\backend && venv\Scripts\activate && set DATABASE_URL=sqlite:///../data/mytasker.db && uvicorn app.main:app --host 0.0.0.0 --port 8000"
start "MyTasker Frontend" cmd /k "npm run dev"

echo Done! Services are starting in separate windows.
echo You can now close this window once the browsers are open.
pause

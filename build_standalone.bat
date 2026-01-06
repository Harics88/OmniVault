@echo off
REM ==========================================
REM    MyTasker Standalone Builder
REM    Creates single .exe with no dependencies
REM ==========================================

echo.
echo ==========================================
echo    MyTasker Standalone Builder
echo ==========================================
echo.
echo This will create a standalone MyTasker.exe
echo that requires NO installation!
echo.
echo Estimated time: 10-15 minutes
echo.
pause

cd /d "%~dp0"

echo.
echo [1/2] Checking Python...
python --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Python not found!
    echo Please install Python from: https://www.python.org/
    pause
    exit /b 1
)

echo.
echo [2/2] Starting build process...
echo.
python standalone\build_standalone.py

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo    BUILD COMPLETE!
    echo ==========================================
    echo.
    echo Your standalone MyTasker is ready!
    echo.
    echo Location: MyTasker-Standalone\
    echo.
    echo To run: Double-click MyTasker.exe
    echo.
) else (
    echo.
    echo ==========================================
    echo    BUILD FAILED
    echo ==========================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause

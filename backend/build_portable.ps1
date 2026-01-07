# Build Omni Vault Portable with PyWebView
# This script builds both the frontend and creates a portable executable

Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "Building Omni Vault - Portable Desktop Application"
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host ""

# Step 1: Build frontend
Write-Host "[1/4] Building React frontend..." -ForegroundColor Cyan
Set-Location ../frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm install
    }
    elseif (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "npm not found. Using Docker to install dependencies..." -ForegroundColor Cyan
        docker run --rm -v "$(Get-Location):/app" -w /app node:20-alpine npm install
    }
    else {
        Write-Host "Neither npm nor Docker found! Please install npm or Docker." -ForegroundColor Red
        Set-Location ../backend
        exit 1
    }
}

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow

if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm run build:nocheck
}
elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "npm not found. Using Docker to build frontend..." -ForegroundColor Cyan
    docker run --rm -v "$(Get-Location):/app" -w /app node:20-alpine npm run build:nocheck
}
else {
    Write-Host "Neither npm nor Docker found!" -ForegroundColor Red
    Set-Location ../backend
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    Set-Location ../backend
    exit 1
}

Write-Host "Frontend build complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Set up Python virtual environment
Set-Location ../backend
Write-Host "[2/4] Setting up Python environment..." -ForegroundColor Cyan

if (-not (Test-Path "../.venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv ../.venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ../.venv/Scripts/Activate.ps1

# Step 3: Install Python dependencies
Write-Host "[3/4] Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 4: Build executable with PyInstaller
Write-Host "[4/4] Building portable executable with PyInstaller..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

# Clean previous build
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}
if (Test-Path "build") {
    Remove-Item -Recurse -Force build
}

# Run PyInstaller
pyinstaller omni_vault.spec --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "" 
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "BUILD COMPLETE!" -ForegroundColor Green
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host ""
Write-Host "Portable application created:" -ForegroundColor Cyan
Write-Host "  Location: " -NoNewline
Write-Host "backend\dist\OmniVault\" -ForegroundColor Yellow
Write-Host ""
Write-Host "To run the application:" -ForegroundColor Cyan
Write-Host "  1. Navigate to: backend\dist\OmniVault\"
Write-Host "  2. Double-click: OmniVault.exe"
Write-Host ""
Write-Host "The application is fully portable - copy the entire folder anywhere!" -ForegroundColor Green
Write-Host ""

# Open the dist folder
$distPath = Resolve-Path "dist\OmniVault"
Write-Host "Opening build folder..." -ForegroundColor Cyan
explorer $distPath

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

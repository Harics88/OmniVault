# Omni Vault - Tauri Build Script (using Docker)
# This script builds the Tauri desktop app without requiring local Rust installation

Write-Host "🚀 Omni Vault - Docker-based Tauri Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build the Docker image
Write-Host "📦 Step 1: Building Tauri builder Docker image..." -ForegroundColor Yellow
docker-compose -f docker-compose.tauri.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Initialize Tauri (if not already done)
Write-Host "📝 Step 2: Checking Tauri initialization..." -ForegroundColor Yellow

if (-Not (Test-Path "frontend/src-tauri")) {
    Write-Host "Initializing Tauri..." -ForegroundColor Yellow
    docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npm install --save-dev @tauri-apps/cli
    
    Write-Host ""
    Write-Host "⚠️  Manual step required:" -ForegroundColor Yellow
    Write-Host "Run: docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npx tauri init" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "When prompted, use these values:" -ForegroundColor Yellow
    Write-Host "  - App name: Omni Vault"
    Write-Host "  - Window title: Omni Vault"
    Write-Host "  - Web assets: ../dist"
    Write-Host "  - Dev URL: http://localhost:3001"
    Write-Host "  - Dev command: npm run dev"
    Write-Host "  - Build command: npm run build"
    Write-Host ""
    Write-Host "After initialization, run this script again to build." -ForegroundColor Green
    exit 0
} else {
    Write-Host "✅ Tauri already initialized" -ForegroundColor Green
}

Write-Host ""

# Step 3: Build the frontend
Write-Host "🏗️  Step 3: Building frontend..." -ForegroundColor Yellow
docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Build Tauri app
Write-Host "🔨 Step 4: Building Tauri desktop app..." -ForegroundColor Yellow
Write-Host "⏳ This may take 10-15 minutes on first build..." -ForegroundColor Yellow
docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npm run tauri build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Tauri app" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Your executable should be in:" -ForegroundColor Cyan
Write-Host "   frontend/src-tauri/target/release/" -ForegroundColor White
Write-Host ""
Write-Host "Note: Since we're cross-compiling in Linux Docker, the Windows .exe" -ForegroundColor Yellow
Write-Host "      may need to be built natively. For production, consider using" -ForegroundColor Yellow
Write-Host "      GitHub Actions or a Windows build server." -ForegroundColor Yellow

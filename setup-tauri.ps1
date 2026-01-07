# Quick Tauri Setup Script
Write-Host "🚀 Omni Vault - Tauri Setup" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Tauri CLI
Write-Host "📦 Step 1: Installing Tauri CLI..." -ForegroundColor Yellow
Set-Location frontend
npm install --save-dev @tauri-apps/cli

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Tauri CLI" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tauri CLI installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate icons
Write-Host "🎨 Step 2: Generating app icons..." -ForegroundColor Yellow

if (Test-Path "../omnivault-logo.png") {
    npx @tauri-apps/cli icon ../omnivault-logo.png
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Icons generated successfully" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Icon generation failed. You may need to create icons manually." -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️  omnivault-logo.png not found. Skipping icon generation." -ForegroundColor Yellow
    Write-Host "   Please run: npx @tauri-apps/cli icon path/to/icon.png" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Commit and push changes to GitHub" -ForegroundColor White
Write-Host "  2. Create a version tag: git tag v1.0.0" -ForegroundColor White  
Write-Host "  3. Push the tag: git push origin v1.0.0" -ForegroundColor White
Write-Host "  4. Check GitHub Actions for your build!" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Or test locally:" -ForegroundColor Cyan
Write-Host "  npm run tauri:dev" -ForegroundColor White
Write-Host ""

Set-Location ..

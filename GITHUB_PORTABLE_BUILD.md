# Omni Vault - GitHub Actions Portable Build Guide

## ✅ Automated Build in Clean Environment

I've set up a GitHub Actions workflow that will build your PyWebView portable app in a **completely clean Windows environment** on GitHub's servers. This solves all the cascading dependency issues!

## 🚀 How to Build

### Option 1: Create a Version Tag (Recommended)
```powershell
git add .
git commit -m "Setup GitHub Actions portable build"
git push

# Create and push a version tag
git tag v1.0.1
git push origin v1.0.1
```

### Option 2: Manual Trigger
1. Go to your GitHub repository
2. Click **"Actions"** tab
3. Select **"Build Portable Desktop App"** workflow
4. Click **"Run workflow"**
5. Select `main` branch and click **"Run workflow"**

## 📥 Download Your App

### From GitHub Actions (Every Build):
1. Go to **Actions** → Select your workflow run
2. Scroll down to **"Artifacts"**
3. Download `omni-vault-windows-portable.zip`
4. Extract the ZIP
5. Inside you'll find the `OmniVault` folder with:
   - `OmniVault.exe`
   - `_internal/` (all dependencies)

### From GitHub Releases (Tagged Builds):
1. Go to **Releases** on your repo
2. Download `OmniVault_v1.0.1_Portable.zip`
3. Extract and run!

## ✨ Why This Works Better

✅ **Clean Environment**: Fresh Windows install every time  
✅ **All Dependencies Included**: GitHub Actions installs everything from scratch  
✅ **No Corrupt Caches**: No leftover files from failed local builds  
✅ **Reproducible**: Same result every time  
✅ **Free**: No cost to use GitHub Actions  

## 🎯 What's Next

1. **Commit and push** the new workflow file
2. **Create a tag** or manually trigger the workflow
3. **Wait ~10 minutes** for the build
4. **Download** your working portable app!

The build will handle all dependencies automatically, including `jaraco`, `platformdirs`, and everything else!

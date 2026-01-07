# 🚀 Omni Vault - GitHub Actions Tauri Build Guide

## ✅ Setup Complete!

I've created everything needed to build your Tauri desktop app using GitHub Actions. **Zero local installation required!**

## 📂 Files Created

1. **`.github/workflows/tauri-build.yml`** - GitHub Actions workflow
2. **`frontend/src-tauri/tauri.conf.json`** - Tauri configuration  
3. **`frontend/src-tauri/src/main.rs`** - Rust entry point
4. **`frontend/src-tauri/Cargo.toml`** - Rust dependencies
5. **`frontend/src-tauri/build.rs`** - Build script
6. **`frontend/package.json`** - Updated with Tauri scripts

## 🎯 How to Build Your App

### **Step 1: Install Tauri CLI locally (one-time)**

```powershell
cd frontend
npm install --save-dev @tauri-apps/cli
```

### **Step 2: Create icon files**

You need to create icon files from your `omnivault-logo.png`:

```powershell
# Install icon generator
cd frontend
npx @tauri-apps/cli icon ../omnivault-logo.png
```

This will create all required icon formats in `frontend/src-tauri/icons/`.

### **Step 3: Push to GitHub**

```powershell
git add .
git commit -m "Add Tauri configuration for desktop app"
git push
```

### **Step 4: Create a release tag**

```powershell
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

### **Step 5: Wait for GitHub Actions** ⏳

1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. Watch the build progress (~10-15 minutes)
4. Download your Windows installer from **"Artifacts"**

## 📦 What You'll Get

After the build completes, GitHub will provide:

### **Windows:**
- `Omni-Vault_1.0.0_x64_en-US.msi` - MSI installer
- `Omni-Vault_1.0.0_x64-setup.exe` - NSIS installer

### **Optionally (if you enable in workflow):**
- macOS `.dmg` file
- Linux `.deb` and `.AppImage` files

## 🔧 Manual Trigger (Alternative)

If you don't want to create a tag, you can manually trigger the build:

1. Go to GitHub → **Actions** tab
2. Select **"Build Tauri App"** workflow
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

## 📥 Download Your Built App

### **Option 1: From GitHub Actions (Every Build)**
1. Go to **Actions** → Select your workflow run
2. Scroll down to **"Artifacts"**
3. Download `omni-vault-windows-installer.zip`
4. Extract and install!

### **Option 2: From GitHub Releases (Tagged Builds)**
1. Go to **Releases** on your repo
2. Download the `.msi` or `.exe` installer
3. Double-click to install!

## 🎨 Customization

### **Change app version:**
Edit `frontend/src-tauri/Cargo.toml`:
```toml
[package]
version = "1.0.1"  # <-- Update here
```

And `frontend/src-tauri/tauri.conf.json`:
```json
{
  "package": {
    "version": "1.0.1"  // <-- Update here
  }
}
```

### **Add macOS/Linux builds:**
Edit `.github/workflows/tauri-build.yml`, line 12:
```yaml
platform: [windows-latest, macos-latest, ubuntu-20.04]
```

## 🔐 Updater (Optional - Advanced)

To enable auto-updates:
1. Generate signing keys
2. Add secrets to GitHub repository
3. Enable updater in `tauri.conf.json`

## ✨ Next Steps

1. **Install Tauri CLI**: `npm install --save-dev @tauri-apps/cli`
2. **Generate icons**: `npx @tauri-apps/cli icon ../omnivault-logo.png`
3. **Test locally** (optional): `npm run tauri:dev`
4. **Commit and push** to GitHub
5. **Create a tag**: `git tag v1.0.0 && git push origin v1.0.0`
6. **Download installer** from GitHub Actions!

## 🎉 That's It!

Your app will be built in the cloud with zero local setup. Just push and get your installer! 🚀

## 💡 Tips

- **First build takes 10-15 minutes** (subsequent builds are cached and faster)
- **No Rust or C++ tools needed** on your machine
- **Professional installers** automatically created
- **Works on any platform** (you can build Windows apps from a Mac!)

---

**Ready to build?** Run the steps above and watch GitHub Actions do the magic! ✨

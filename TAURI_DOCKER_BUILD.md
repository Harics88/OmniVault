# Omni Vault - Docker-Based Tauri Build Guide

## ✅ Advantages of This Approach
- ✅ **No local Rust installation needed**
- ✅ **No C++ Build Tools needed**
- ✅ **Consistent build environment**
- ✅ **Works on any machine with Docker**
- ✅ **Easy to reproduce builds**

## ⚠️ Important Note
Cross-compiling Windows executables from Linux Docker is **complex**. For the best results:
- **Option 1**: Use this Docker approach to build Linux/macOS versions
- **Option 2**: Use GitHub Actions for Windows builds (recommended)
- **Option 3**: Install Rust locally just for Windows builds (simplest for Windows)

## 🚀 Quick Start

### 1. Build the Tauri builder container
```powershell
docker-compose -f docker-compose.tauri.yml build
```

### 2. Initialize Tauri (first time only)
```powershell
# Install Tauri CLI
docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npm install --save-dev @tauri-apps/cli

# Initialize Tauri
docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npx tauri init
```

When prompted:
- **App name**: `Omni Vault`
- **Window title**: `Omni Vault`
- **Web assets location**: `../dist`
- **Dev server URL**: `http://localhost:3001`
- **Frontend dev command**: `npm run dev`
- **Frontend build command**: `npm run build`

### 3. Build the app
```powershell
# Run the automated build script
.\build-tauri.ps1
```

**OR** manually:
```powershell
# Build frontend
docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npm run build

# Build Tauri app
docker-compose -f docker-compose.tauri.yml run --rm tauri-builder npm run tauri build
```

## 📁 Output Location
After building, find your executable at:
- `frontend/src-tauri/target/release/`

## 🔧 Alternative: GitHub Actions (Recommended for Windows)

For production Windows builds, I can set up GitHub Actions that:
1. Build on Windows runners (native Windows compilation)
2. Create proper installers (.msi, .exe)
3. Automatic releases on GitHub
4. Cross-platform builds (Windows + macOS + Linux)

Would you like me to set up GitHub Actions instead?

## 🎯 Recommended Approach

**For Development/Testing:**
- Use Docker for Linux builds
- Use local Rust for Windows builds (if needed)

**For Production:**
- Use GitHub Actions for all platforms
- Gets you professional installers
- Automatic versioning and releases

## 📝 Next Steps

1. **Try Docker build** to see if it works for your needs
2. **If Windows .exe is needed**, I can set up GitHub Actions
3. **OR** install Rust locally just for final Windows builds

Let me know which approach you prefer! 🚀

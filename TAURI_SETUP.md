# Omni Vault - Tauri Setup Guide

## Current Status
- ✅ App renamed from "MyTasker" to "Omni Vault"
- ✅ Logo integrated (`omnivault-logo.png`)
- ✅ Frontend metadata updated (title, description, favicon)
- ✅ Package.json updated

## Next Steps for Tauri Desktop App

### 1. Install Tauri CLI
```bash
cd frontend
npm install --save-dev @tauri-apps/cli
```

### 2. Initialize Tauri
```bash
npm run tauri init
```

When prompted:
- **App name**: Omni Vault
- **Window title**: Omni Vault
- **Web assets location**: ../dist
- **Dev server URL**: http://localhost:3001
- **Frontend dev command**: npm run dev
- **Frontend build command**: npm run build

### 3. Update package.json scripts
Add to `frontend/package.json`:
```json
"scripts": {
  "tauri": "tauri",
  "tauri:dev": "tauri dev",
  "tauri:build": "tauri build"
}
```

### 4. Configure Tauri (src-tauri/tauri.conf.json)
Key settings to update:
- `productName`: "Omni Vault"
- `identifier`: "com.omnivault.app"
- `icon`: Use the omnivault-logo.png (converted to .ico for Windows)

### 5. Build the Desktop App
```bash
npm run build          # Build frontend
npm run tauri:build    # Package as desktop app
```

### 6. Output Location
The executable will be in:
- Windows: `src-tauri/target/release/omni-vault.exe`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/deb/` or `appimage/`

## Requirements
- Node.js (✅ already installed)
- Rust (need to install: https://rustup.rs/)
- System dependencies (Windows: Microsoft C++ Build Tools)

## Backend Integration
Since Omni Vault has a FastAPI backend, we need to:
1. Bundle the backend with Tauri as a sidecar
2. OR embed it into the Tauri app and start it programmatically
3. Update the SQLite database path for desktop mode

Would you like me to proceed with the Tauri setup now?

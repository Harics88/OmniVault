# 🖥️ Omni Vault - PyWebView Desktop Application

## 📦 Building the Portable Desktop App

This version uses **PyWebView** to create a truly portable desktop application that bundles both the FastAPI backend and React frontend into a single executable.

---

## ✨ What You Get

- ✅ **Single Folder Distribution** - No installation needed
- ✅ **Both Frontend & Backend Included** - Everything in one package
- ✅ **Native Desktop Window** - No browser needed
- ✅ **Fully Portable** - Run from USB, network drive, anywhere!
- ✅ **Local Data Storage** - All data stored beside the executable
- ✅ **~80-100 MB** - Reasonable size for everything included

---

## 🚀 Quick Build

### **Option 1: Automated Build Script** (Recommended)

```powershell
cd backend
.\build_portable.ps1
```

This script:
1. ✅ Builds the React frontend
2. ✅ Sets up Python environment
3. ✅ Installs dependencies
4. ✅ Creates the portable executable
5. ✅ Opens the build folder when done

**Build time:** ~5-10 minutes  
**Output:** `backend\dist\OmniVault\` folder

---

### **Option 2: Manual Build**

#### Step 1: Build Frontend
```powershell
cd frontend
npm install
npm run build:nocheck
```

#### Step 2: Install Python Dependencies
```powershell
cd ../backend
python -m venv ../.venv
../.venv/Scripts/activate
pip install -r requirements.txt
```

#### Step 3: Build with PyInstaller
```powershell
pyinstaller omni_vault.spec --clean
```

**Output:** `backend\dist\OmniVault\` folder

---

## 📁 What's Generated

After building, you'll have:

```
backend/dist/OmniVault/
├── OmniVault.exe          # Main executable (~80-100 MB)
├── Internal DLLs...       # Python runtime & dependencies
└── data/                  # Created on first run
    └── mytasker.db       # SQLite database
```

---

## 🎮 How to Use

### **Running the App:**
1. Navigate to `backend\dist\OmniVault\`
2. Double-click `OmniVault.exe`
3. The app opens in a native desktop window
4. Start organizing your tasks!

### **Data Location:**
All your data is stored in the `data/` folder next to the executable:
- Tasks, Notes, Snippets, Bookmarks
- SQLite database
- All settings

### **Making it Portable:**
Copy the entire `OmniVault\` folder anywhere:
- ✅ USB drive
- ✅ Network share
- ✅ Different computer
- ✅ Cloud storage (Dropbox, OneDrive, etc.)

---

## 🔧 How It Works

### **Architecture:**

```
OmniVault.exe
├── PyWebView Window (UI)
│   └── Displays React Frontend
│
└── Background Thread
    └── FastAPI Server (localhost:8765)
        ├── REST API Endpoints
        ├── SQLite Database
        └── Business Logic
```

### **Technology Stack:**
- **Desktop Framework:** PyWebView 4.4.1
- **Backend:** FastAPI + Uvicorn
- **Frontend:** React 18 + TypeScript
- **Database:** SQLite (aiosqlite)
- **Bundler:** PyInstaller 6.3.0

---

## 📊 Comparison: PyWebView vs Tauri

| Feature | PyWebView | Tauri |
|---------|-----------|-------|
| Backend Included | ✅ Yes | ❌ No |
| Single Process | ✅ Yes | ❌ No (needs sidecar) |
| Build Complexity | ✅ Simple | ⚠️ Complex |
| Bundle Size | ~80-100 MB | ~56 MB (frontend only) |
| Python Compatibility | ✅ Perfect | ❌ Needs workarounds |
| Startup Time | ~2-3 seconds | ~1-2 seconds |
| Memory Usage | ~150-200 MB | ~100-150 MB |
| Works on USB | ✅ Yes | ❌ No (backend missing) |

**For this app:** PyWebView is the better choice! ✅

---

## 🐛 Troubleshooting

### **Build Fails:**
```powershell
# Clean and rebuild
Remove-Item -Recurse dist, build
pyinstaller omni_vault.spec --clean
```

### **"Frontend not found" error:**
```powershell
# Rebuild frontend
cd ../frontend
npm run build:nocheck
cd ../backend
pyinstaller omni_vault.spec --clean
```

### **Port Already in Use:**
- The app uses port `8765` internally
- If that port is busy, edit `app_webview.py` line 16 to use a different port

### **Database Errors:**
```powershell
# Delete and recreate data folder
Remove-Item -Recurse data
# Restart the app - it will create a fresh database
```

---

## 🎨 Customization

### **Change Window Size:**
Edit `backend/app_webview.py`:
```python
WINDOW_WIDTH = 1400   # Change to your preferred width
WINDOW_HEIGHT = 800   # Change to your preferred height
```

### **Change Port:**
Edit `backend/app_webview.py`:
```python
BACKEND_PORT = 8765   # Change to different port
```

### **Add Icon:**
1. Create/obtain an `.ico` file
2. Update `backend/omni_vault.spec`:
```python
icon='path/to/your/icon.ico'
```

### **Enable Console (for debugging):**
Edit `backend/omni_vault.spec`:
```python
console=True  # Shows console window
```

---

## 📝 Development Mode

### **Run without building:**
```powershell
cd backend
../.venv/Scripts/activate
python app_webview.py
```

This runs the app directly from source:
- ✅ Faster iteration
- ✅ See console output
- ✅ Easy debugging
- ✅ No need to rebuild

---

## 🚀 Distribution

### **For End Users:**
1. Zip the `OmniVault` folder
2. Upload to GitHub Releases
3. Share the download link
4. Users extract and run!

### **No Installation Needed:**
- ❌ No Python required
- ❌ No Node.js required
- ❌ No Docker required
- ✅ Just extract and run!

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `app_webview.py` | Main entry point - creates window & starts backend |
| `omni_vault.spec` | PyInstaller build configuration |  
| `build_portable.ps1` | Automated build script |
| `requirements.txt` | Python dependencies (includes pywebview) |

---

## 🎉 Benefits

### **For Developers:**
- ✅ Simple build process
- ✅ Familiar Python stack
- ✅ Easy to debug
- ✅ Fast iteration

### **For Users:**
- ✅ No installation
- ✅ True portability
- ✅ Native window experience
- ✅ Works offline
- ✅ Private & secure (all data local)

---

## 🔗 Next Steps

1. **Build the app** - Run `build_portable.ps1`
2. **Test it** - Run `OmniVault.exe`
3. **Distribute** - Zip and share!

---

<div align="center">

**Built with ❤️ using PyWebView**

[Report Issue](https://github.com/Harics88/MyTasker/issues) • [Documentation](../README.md)

</div>

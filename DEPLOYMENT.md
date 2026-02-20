# 🚀 Omni Vault - Deployment Guide

## Two Deployment Options

Omni Vault comes in **two flavors** to suit different needs:

### 1. 💻 Desktop App (Recommended for Most Users)
**Best for**: Single-user desktop use, simplicity

**Download**: `OmniVault_Desktop_v1.1.0_Portable.zip`


**How to Use**:
1. Extract the ZIP file
2. Double-click `OmniVault.exe`
3. The app opens in a native window
4. Data stored in `data/` folder next to the .exe

**Features**:
- ✅ Native desktop window
- ✅ Starts instantly
- ✅ Clean UI without browser chrome
- ✅ Fully portable - no installation

---

### 2. 🌐 Server App (For Browser Access)
**Best for**: Remote access, multiple devices, existing web workflow

**Download**: `OmniVault_Server_v1.1.0_Portable.zip`


**How to Use**:
1. Extract the ZIP file
2. Double-click `OmniVault-Server.exe`
3. A console window shows the server URL (usually `http://localhost:8000`)
4. Open your web browser and go to that URL
5. Data stored in `data/` folder next to the .exe

**Features**:
- ✅ Access from any browser
- ✅ Can share on local network (advanced users)
- ✅ Lightweight - no GUI dependencies
- ✅ Runs in background

---

## 📥 Where to Download

### Latest Release
**GitHub Releases**: https://github.com/Harics88/MyTasker/releases/latest

Both versions are available as separate ZIP files in each release.

### Build From Source (Advanced)

#### Using GitHub Actions (Recommended):
```bash
# Create a new release tag
git tag v1.0.3
git push origin v1.0.3

# Wait ~10 minutes, then download from:
# https://github.com/Harics88/MyTasker/releases
```

#### Local Build:
```powershell
# Build Desktop version
cd backend
pyinstaller omni_vault.spec --clean --noconfirm

# Build Server version
pyinstaller omni_vault_server.spec --clean --noconfirm

# Output in: backend/dist/
```

---

## 🔧 System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 100MB for app + your data
- **No Python/Node.js required** - fully standalone!

---

## 🎯 Quick Comparison

| Feature | Desktop App | Server App |
|---------|------------|------------|
| **Access Method** | Native window | Web browser |
| **Startup** | Instant | ~2 seconds |
| **Network Access** | Local only | Can share* |
| **System Tray** | Possible | No |
| **Dependencies** | Larger | Smaller |
| **Best For** | Daily use | Remote/multi-device |

*Advanced: Edit `app_server.py` and change `BACKEND_HOST` to `0.0.0.0` to allow network access.

---

## 📚 Data Location

Both versions store data in:
```
<app-folder>/data/mytasker.db
```

You can:
- ✅ Back up this folder
- ✅ Sync it across devices (e.g., Dropbox)
- ✅ Move the entire app folder anywhere

---

## 🆘 Troubleshooting

### Desktop App Won't Start
- Check if Windows Defender is blocking it
- Run as Administrator
- Check `data/` folder permissions

### Server App - Can't Connect
- Check the console for the correct URL
- Try `http://127.0.0.1:8000` if localhost doesn't work
- Firewall may be blocking port 8000

### Both Versions - Database Errors
- Close all instances
- Delete `data/mytasker.db` (⚠️ deletes all data!)
- Restart the app

---

## 🔄 Updating

1. Download the new version
2. **Don't delete** your old `data/` folder!
3. Extract new version to a different folder
4. Copy your `data/` folder from old to new
5. Run the new version

---

## 📝 Release Notes

See [RELEASE_NOTES_v1.1.0.md](RELEASE_NOTES_v1.1.0.md) for version history and changes.


---

## 🛡️ Security Note

Both versions run **locally on your machine**. Your data never leaves your computer unless you explicitly choose to sync the `data/` folder via cloud storage.

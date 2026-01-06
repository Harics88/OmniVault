# MyTasker Windows Desktop Deployment Guide

## Overview

This guide provides multiple deployment options for running MyTasker on Windows 10/11 desktops as a local-first productivity app.

## Recommended: Docker Desktop (Easiest)

### Prerequisites
- Windows 10/11 (64-bit)
- At least 4GB RAM
- 10GB free disk space

### Step 1: Install Docker Desktop

1. **Download Docker Desktop**:
   - Visit: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows
   - Run the installer

2. **Enable WSL 2** (if prompted):
   - Docker Desktop will guide you through enabling WSL 2
   - Restart your computer if required

3. **Verify Installation**:
   ```powershell
   docker --version
   docker-compose --version
   ```

### Step 2: Deploy MyTasker

1. **Clone or Download the Repository**:
   ```powershell
   # If you have git installed
   git clone https://github.com/Harics88/MyTasker.git
   cd MyTasker

   # OR download ZIP from GitHub and extract
   ```

2. **Start the Application**:
   ```powershell
   # Using the provided batch script (RECOMMENDED)
   .\start_mytasker.bat

   # OR manually with docker-compose
   docker-compose up -d
   ```

3. **Access the Application**:
   - Open your browser and go to: **http://localhost:3001**
   - API Documentation: **http://localhost:8000/docs**

4. **Stop the Application**:
   ```powershell
   docker-compose down
   ```

### Step 3: Auto-Start on Windows Boot (Optional)

**Method 1: Task Scheduler (Recommended)**

1. Open Task Scheduler (`taskschd.msc`)
2. Create New Task:
   - **General Tab**:
     - Name: "MyTasker Auto-Start"
     - Run whether user is logged on or not
     - Run with highest privileges
   
   - **Triggers Tab**:
     - New Trigger → At startup
   
   - **Actions Tab**:
     - New Action → Start a program
     - Program: `C:\Program Files\Docker\Docker\Docker Desktop.exe`
   
   - **Conditions Tab**:
     - Uncheck "Start only if on AC power"

3. Create Second Task for MyTasker:
   - Name: "MyTasker Start Containers"
   - Trigger: At startup (delay 2 minutes)
   - Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-WindowStyle Hidden -Command "cd 'D:\Projects\Antigravity\MyTasker'; docker-compose up -d"`

**Method 2: Startup Folder**

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `start_mytasker.bat`
3. Right-click shortcut → Properties → Run: Minimized

### Step 4: Create Desktop Shortcut

1. **Create a `.bat` file** named `MyTasker.bat`:
   ```batch
   @echo off
   start http://localhost:3001
   ```

2. **Create shortcut**:
   - Right-click on desktop → New → Shortcut
   - Location: Path to `MyTasker.bat`
   - Name: "MyTasker"
   - Change icon (optional)

### Step 5: Database Backups

**Automated Daily Backups**:

1. **Create backup script** `backup_mytasker.bat`:
   ```batch
   @echo off
   cd /d D:\Projects\Antigravity\MyTasker
   docker-compose exec -T backend python backup_db.py backup
   echo Backup completed at %date% %time%
   ```

2. **Schedule with Task Scheduler**:
   - Create new task: "MyTasker Daily Backup"
   - Trigger: Daily at 2:00 AM
   - Action: Run `backup_mytasker.bat`

---

## Alternative: Native Windows Installation (Advanced)

For users who prefer not to use Docker.

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git (optional)

### Backend Setup

1. **Install Python Dependencies**:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Create Start Script** `start_backend.bat`:
   ```batch
   @echo off
   cd /d %~dp0backend
   call venv\Scripts\activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install Node Dependencies**:
   ```powershell
   cd frontend
   npm install
   ```

2. **Build for Production**:
   ```powershell
   npm run build
   ```

3. **Create Start Script** `start_frontend.bat`:
   ```batch
   @echo off
   cd /d %~dp0frontend
   npm run preview -- --port 3001 --host
   ```

### Combined Start Script

Create `start_mytasker_native.bat`:
```batch
@echo off
echo Starting MyTasker...

REM Start Backend
start "MyTasker Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Wait for backend to start
timeout /t 5 /nobreak

REM Start Frontend
start "MyTasker Frontend" cmd /k "cd /d %~dp0frontend && npm run preview -- --port 3001 --host"

REM Wait for frontend to start
timeout /t 5 /nobreak

REM Open browser
start http://localhost:3001

echo MyTasker is running!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3001
echo.
echo Press any key to stop MyTasker...
pause

REM Stop services
taskkill /FI "WINDOWTITLE eq MyTasker Backend*" /T /F
taskkill /FI "WINDOWTITLE eq MyTasker Frontend*" /T /F
```

---

## Alternative: Portable Executable (Future Enhancement)

For the most user-friendly deployment, consider packaging as a Windows executable:

### Option 1: Electron Wrapper
- Wrap the web app in Electron
- Single `.exe` installer
- System tray integration
- Auto-updates

### Option 2: PyInstaller + Webview
- Package Python backend with PyInstaller
- Use pywebview for frontend
- Single executable
- No browser required

**Note**: This requires additional development work. Let me know if you'd like me to implement this!

---

## Recommended Deployment Strategy

### For Personal Use (Single User):
✅ **Docker Desktop** - Easiest and most reliable

**Pros**:
- One-command setup
- Automatic updates with `git pull` + `docker-compose up --build`
- Isolated environment
- Easy backup and restore
- Health monitoring built-in

**Cons**:
- Requires Docker Desktop (uses ~2GB RAM)
- Slightly slower startup

### For Multiple Machines:
✅ **Docker Desktop** + Shared Data Folder

1. Install Docker Desktop on each machine
2. Store `data/` folder in OneDrive/Dropbox
3. Update `docker-compose.yml` to point to shared folder:
   ```yaml
   volumes:
     - C:\Users\YourName\OneDrive\MyTasker\data:/app/data
   ```

### For Offline/Air-Gapped Systems:
✅ **Native Installation**

- No internet required after initial setup
- Faster startup
- Lower resource usage

---

## Maintenance & Updates

### Docker Deployment

**Update to Latest Version**:
```powershell
cd MyTasker
git pull origin main
docker-compose down
docker-compose up --build -d
```

**Backup Before Update**:
```powershell
docker-compose exec backend python backup_db.py backup
```

**View Logs**:
```powershell
docker-compose logs -f
```

**Restart Services**:
```powershell
docker-compose restart
```

### Native Deployment

**Update Backend**:
```powershell
cd backend
git pull
.\venv\Scripts\activate
pip install -r requirements.txt --upgrade
```

**Update Frontend**:
```powershell
cd frontend
git pull
npm install
npm run build
```

---

## Troubleshooting

### Docker Desktop Issues

**Problem**: Docker Desktop won't start
- **Solution**: Enable Virtualization in BIOS
- Check: Task Manager → Performance → CPU → Virtualization: Enabled

**Problem**: Port already in use
- **Solution**: Change ports in `docker-compose.yml`
  ```yaml
  ports:
    - "3002:3001"  # Frontend
    - "8001:8000"  # Backend
  ```

**Problem**: Containers keep restarting
- **Solution**: Check logs: `docker-compose logs backend`
- Verify database: `docker-compose exec backend python backup_db.py verify`

### Native Installation Issues

**Problem**: Python not found
- **Solution**: Add Python to PATH during installation
- Or use full path: `C:\Python311\python.exe`

**Problem**: npm command not found
- **Solution**: Restart terminal after Node.js installation
- Or add to PATH: `C:\Program Files\nodejs`

**Problem**: Port 8000 already in use
- **Solution**: Find and kill process:
  ```powershell
  netstat -ano | findstr :8000
  taskkill /PID <PID> /F
  ```

---

## Performance Optimization

### For Low-End Systems

1. **Reduce Docker Memory**:
   - Docker Desktop → Settings → Resources
   - Set Memory to 2GB (minimum)

2. **Disable Auto-Start**:
   - Start manually when needed
   - Saves resources when not in use

3. **Use Native Installation**:
   - Lower overhead
   - Faster startup

### For High-End Systems

1. **Increase Docker Resources**:
   - Memory: 4GB+
   - CPUs: 4+
   - Faster performance

2. **Enable Auto-Start**:
   - Always available
   - Minimal impact on performance

---

## Security Considerations

### Local Network Access

By default, MyTasker is only accessible from localhost. To access from other devices on your network:

1. **Update docker-compose.yml**:
   ```yaml
   frontend:
     ports:
       - "0.0.0.0:3001:3001"
   backend:
     ports:
       - "0.0.0.0:8000:8000"
   ```

2. **Access from other devices**:
   - Find your IP: `ipconfig`
   - Access: `http://YOUR_IP:3001`

⚠️ **Warning**: Only do this on trusted networks!

### Data Protection

1. **Regular Backups**:
   - Automated daily backups (see Step 5)
   - Manual backups before updates

2. **Backup Location**:
   - Store in `data/backups/`
   - Copy to external drive weekly
   - Cloud backup (OneDrive/Dropbox)

3. **Database Encryption** (Optional):
   - Use Windows BitLocker for `data/` folder
   - Or use encrypted cloud storage

---

## Quick Start Checklist

- [ ] Install Docker Desktop
- [ ] Clone/Download MyTasker
- [ ] Run `start_mytasker.bat`
- [ ] Access http://localhost:3001
- [ ] Create desktop shortcut
- [ ] Set up auto-start (optional)
- [ ] Schedule daily backups
- [ ] Test backup/restore

---

## Support & Resources

- **Documentation**: See `README.md`
- **Stability Guide**: See `STABILITY_PLAN.md`
- **Quick Wins**: See `QUICK_WINS_SUMMARY.md`
- **Health Check**: http://localhost:8000/api/health
- **API Docs**: http://localhost:8000/docs

---

## Recommended Setup for Windows Desktop

**Best Configuration**:
1. ✅ Docker Desktop installation
2. ✅ Auto-start on boot (Task Scheduler)
3. ✅ Desktop shortcut for quick access
4. ✅ Daily automated backups (2 AM)
5. ✅ Weekly manual backup to external drive
6. ✅ Monthly update check

This provides the best balance of ease-of-use, reliability, and maintainability!

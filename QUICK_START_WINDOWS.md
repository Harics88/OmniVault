# MyTasker - Quick Setup Guide for Windows

## 🚀 5-Minute Setup

### Step 1: Install Docker Desktop (One-time)

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. Restart your computer if prompted
4. Start Docker Desktop

### Step 2: Get MyTasker

**Option A: Download ZIP (Easiest)**
1. Go to: https://github.com/Harics88/MyTasker
2. Click "Code" → "Download ZIP"
3. Extract to `D:\MyTasker` (or any location you prefer)

**Option B: Clone with Git**
```powershell
git clone https://github.com/Harics88/MyTasker.git
cd MyTasker
```

### Step 3: Start MyTasker

1. Double-click `start_mytasker.bat`
2. Wait for services to start (30-60 seconds on first run)
3. Browser will open automatically to http://localhost:3001

**That's it! You're ready to use MyTasker!** 🎉

---

## 📁 Included Scripts

All scripts are in the MyTasker folder:

| Script | Purpose |
|--------|---------|
| `start_mytasker.bat` | Start MyTasker |
| `stop_mytasker.bat` | Stop MyTasker |
| `backup_mytasker.bat` | Create database backup |
| `update_mytasker.bat` | Update to latest version |
| `view_logs.bat` | View application logs |

---

## 🔧 Daily Usage

### Starting MyTasker
- Double-click `start_mytasker.bat`
- Or set up auto-start (see below)

### Stopping MyTasker
- Double-click `stop_mytasker.bat`
- Or: `docker-compose down` in PowerShell

### Accessing MyTasker
- Open browser to: http://localhost:3001
- Or create a desktop shortcut (see below)

---

## 🎯 Optional Enhancements

### Create Desktop Shortcut

1. Right-click on Desktop → New → Shortcut
2. Location: `http://localhost:3001`
3. Name: "MyTasker"
4. Click Finish

### Auto-Start on Windows Boot

**Method 1: Startup Folder (Simple)**
1. Press `Win + R`, type `shell:startup`, press Enter
2. Create shortcut to `start_mytasker.bat`
3. Right-click shortcut → Properties → Run: Minimized

**Method 2: Task Scheduler (Advanced)**
See `WINDOWS_DEPLOYMENT.md` for detailed instructions

### Schedule Daily Backups

1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task
   - Name: "MyTasker Daily Backup"
   - Trigger: Daily at 2:00 AM
   - Action: Start a program
   - Program: `D:\MyTasker\backup_mytasker.bat`

---

## 🆘 Troubleshooting

### "Docker is not running"
- Start Docker Desktop manually
- Wait 30 seconds and try again

### "Port already in use"
- Stop other services using ports 3001 or 8000
- Or change ports in `docker-compose.yml`

### "Cannot connect to database"
- Run `backup_mytasker.bat` to verify database
- Check logs: `view_logs.bat`

### App won't start
1. Stop: `stop_mytasker.bat`
2. Restart Docker Desktop
3. Start: `start_mytasker.bat`

---

## 📊 Checking Status

### Is MyTasker Running?
```powershell
docker-compose ps
```
Should show "Up" and "healthy" for both services

### View Health Status
Open: http://localhost:8000/api/health

### View Logs
Double-click `view_logs.bat`

---

## 💾 Backup & Restore

### Create Backup
- Double-click `backup_mytasker.bat`
- Backups saved to: `data\backups\`

### Restore from Backup
```powershell
docker-compose exec backend python backup_db.py list
docker-compose exec backend python backup_db.py restore <backup_name>
```

### Backup to External Drive
- Copy entire `data\` folder to external drive
- Do this weekly for extra safety

---

## 🔄 Updating MyTasker

### Automatic Update
- Double-click `update_mytasker.bat`
- Creates backup automatically
- Updates to latest version

### Manual Update
```powershell
git pull origin main
docker-compose down
docker-compose up --build -d
```

---

## 📈 Performance Tips

### For Faster Startup
- Keep Docker Desktop running
- Set up auto-start

### For Lower Resource Usage
- Docker Desktop → Settings → Resources
- Set Memory to 2GB (minimum)
- Set CPUs to 2

### For Better Performance
- Use SSD for MyTasker folder
- Increase Docker memory to 4GB
- Close unnecessary applications

---

## 🔒 Security Tips

### Local Access Only (Default)
- MyTasker only accessible from your computer
- Safe for personal use

### Network Access (Optional)
- See `WINDOWS_DEPLOYMENT.md` for instructions
- ⚠️ Only on trusted networks!

### Data Protection
- Regular backups (automated recommended)
- Store backups on external drive
- Consider OneDrive/Dropbox for cloud backup

---

## 📚 Additional Resources

- **Full Deployment Guide**: `WINDOWS_DEPLOYMENT.md`
- **Stability Features**: `QUICK_WINS_SUMMARY.md`
- **Feature Documentation**: `README.md`
- **API Documentation**: http://localhost:8000/docs

---

## ✅ Post-Setup Checklist

- [ ] Docker Desktop installed and running
- [ ] MyTasker started successfully
- [ ] Can access http://localhost:3001
- [ ] Created desktop shortcut
- [ ] Set up auto-start (optional)
- [ ] Scheduled daily backups (optional)
- [ ] Created first manual backup

---

## 🎉 You're All Set!

MyTasker is now running on your Windows desktop!

**Quick Access**:
- App: http://localhost:3001
- API: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

**Need Help?**
- Check `WINDOWS_DEPLOYMENT.md` for detailed guides
- View logs: `view_logs.bat`
- Create backup: `backup_mytasker.bat`

Enjoy your local-first productivity app! 🚀

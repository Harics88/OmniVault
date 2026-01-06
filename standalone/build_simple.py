"""
Simplified PyInstaller Build Script (ASCII only)
Assumes frontend is already built in frontend/dist
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
STANDALONE_DIR = PROJECT_ROOT / "standalone"
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
BUILD_DIR = STANDALONE_DIR / "build"
DIST_DIR = STANDALONE_DIR / "dist"
OUTPUT_DIR = PROJECT_ROOT / "MyTasker-Standalone"

print("=" * 60)
print("  MyTasker Standalone Builder")
print("=" * 60)
print()

# Step 1: Verify frontend dist exists
print("[1/5] Checking frontend build...")
if not FRONTEND_DIST.exists():
    print(f"ERROR: Frontend dist not found at: {FRONTEND_DIST}")
    print("Please build frontend first:")
    print("  docker-compose exec frontend npm run build:nocheck")
    print("  docker cp mytasker-frontend-1:/app/dist ./frontend/dist")
    sys.exit(1)
print(f"OK: Frontend found: {FRONTEND_DIST}")

# Step 2: Clean build dirs
print("\n[2/5] Cleaning previous builds...")
for dir_path in [BUILD_DIR, DIST_DIR, OUTPUT_DIR]:
    if dir_path.exists():
        shutil.rmtree(dir_path)
print("OK: Build directories cleaned")

# Step 3: Create spec file
print("\n[3/5] Creating PyInstaller spec file...")

spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

# Paths
backend_dir = r'{str(BACKEND_DIR)}'
frontend_dist = r'{str(FRONTEND_DIST)}'
app_script = r'{str(STANDALONE_DIR / "mytasker_app.py")}'

# Collect all backend files
backend_files = [
    (backend_dir + '\\\\\\\\app', 'app'),
]

# Collect frontend dist files
frontend_files = [
    (frontend_dist, 'frontend/dist'),
]

a = Analysis(
    [str(app_script)],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=backend_files + frontend_files,
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'app.main',
        'app.database',
        'app.models',
        'app.schemas',
        'app.routers.daily_logs',
        'app.routers.tasks',
        'app.routers.notes',
        'app.routers.snippets',
        'app.routers.bookmarks',
        'app.routers.search',
        'app.routers.sections',
        'app.routers.system',
        'sqlalchemy.ext.asyncio',
        'aiosqlite',
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='MyTasker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''

spec_file = STANDALONE_DIR / "mytasker.spec"
spec_file.write_text(spec_content)
print(f"OK: Spec file created")

# Step 4: Build executable
print("\n[4/5] Building executable with PyInstaller...")
print("This may take 5-10 minutes...")

try:
    result = subprocess.run(
        ["pyinstaller", "--clean", str(spec_file)],
        cwd=STANDALONE_DIR,
        check=True,
        capture_output=True,
        text=True
    )
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"ERROR: Build failed: {e}")
    print(e.stderr)
    sys.exit(1)

exe_path = DIST_DIR / "MyTasker.exe"
if not exe_path.exists():
    print("ERROR: Build failed - executable not found")
    sys.exit(1)

print(f"OK: Executable built successfully")

# Step 5: Create distribution
print("\n[5/5] Creating distribution package...")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Copy executable
shutil.copy2(exe_path, OUTPUT_DIR / "MyTasker.exe")
print("OK: Copied MyTasker.exe")

# Create data directory
(OUTPUT_DIR / "data").mkdir(exist_ok=True)
print("OK: Created data/ folder")

# Create README
readme_content = '''# MyTasker Standalone Edition

## Quick Start

1. Double-click MyTasker.exe
2. Wait for browser to open automatically
3. Start being productive!

## What's Included

- MyTasker.exe - The complete application
- data/ - Your database and backups

## First Run

On first run, MyTasker will:
1. Create the database in the data/ folder
2. Start the backend server
3. Open your default browser
4. Show the MyTasker dashboard

## Usage

### Starting MyTasker
- Double-click MyTasker.exe
- Browser opens automatically to http://localhost:8000

### Stopping MyTasker
- Close the console window
- Or press Ctrl+C in the console

### Your Data
- All data is stored in the data/ folder
- Database: data/mytasker.db
- Backups: data/backups/

## Portable Usage

MyTasker is fully portable:
1. Copy entire folder to USB drive
2. Run from any Windows PC
3. All your data travels with you

## System Requirements

- Windows 10 or 11 (64-bit)
- 100MB free disk space
- Modern web browser (Chrome, Edge, Firefox)

## Features

- Daily Log - Journal your day
- Tasks - Manage your work
- Notes - Organize your thoughts
- Snippets - Save code snippets
- Bookmarks - Quick access to resources
- Search - Find anything instantly

## Version

MyTasker Standalone v1.0.0
Built: 2026-01-06

---

Enjoy your local-first productivity app!
'''

(OUTPUT_DIR / "README.txt").write_text(readme_content)
print("OK: Created README.txt")

# Calculate size
total_size = sum(f.stat().st_size for f in OUTPUT_DIR.rglob('*') if f.is_file())
size_mb = total_size / (1024 * 1024)

print("\n" + "=" * 60)
print("  BUILD SUCCESSFUL!")
print("=" * 60)
print(f"\nYour standalone MyTasker is ready!")
print(f"\nLocation: {OUTPUT_DIR}")
print(f"Size: {size_mb:.1f} MB")
print(f"\nTo run:")
print(f"   1. Go to: {OUTPUT_DIR}")
print(f"   2. Double-click: MyTasker.exe")
print(f"   3. Browser opens automatically!")
print("\nTip: Copy this entire folder to your enterprise laptop")
print("   No Docker, Python, or Node.js needed!")
print("\n" + "=" * 60)

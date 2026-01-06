"""
PyInstaller Build Script for MyTasker Standalone
Creates a single executable with all dependencies bundled
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
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BUILD_DIR = STANDALONE_DIR / "build"
DIST_DIR = STANDALONE_DIR / "dist"
OUTPUT_DIR = PROJECT_ROOT / "MyTasker-Standalone"

def print_step(step, message):
    """Print formatted step message"""
    print(f"\n{'='*60}")
    print(f"Step {step}: {message}")
    print('='*60)

def run_command(cmd, cwd=None, check=True):
    """Run command and handle errors"""
    print(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        raise

def clean_build_dirs():
    """Clean previous build directories"""
    print_step(1, "Cleaning previous builds")
    
    dirs_to_clean = [BUILD_DIR, DIST_DIR, OUTPUT_DIR]
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            print(f"Removing: {dir_path}")
            shutil.rmtree(dir_path)
    
    print("✅ Build directories cleaned")

def build_frontend():
    """Build frontend static files"""
    print_step(2, "Building frontend")
    
    # Check if node_modules exists
    if not (FRONTEND_DIR / "node_modules").exists():
        print("Installing frontend dependencies...")
        run_command(["npm", "install"], cwd=FRONTEND_DIR)
    
    # Build frontend
    print("Building frontend for production...")
    run_command(["npm", "run", "build"], cwd=FRONTEND_DIR)
    
    # Verify dist folder exists
    dist_folder = FRONTEND_DIR / "dist"
    if not dist_folder.exists():
        raise Exception("Frontend build failed - dist folder not found")
    
    print(f"✅ Frontend built successfully: {dist_folder}")

def install_pyinstaller():
    """Install PyInstaller if not already installed"""
    print_step(3, "Checking PyInstaller")
    
    try:
        import PyInstaller
        print(f"✅ PyInstaller already installed: {PyInstaller.__version__}")
    except ImportError:
        print("Installing PyInstaller...")
        run_command([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("✅ PyInstaller installed")

def create_spec_file():
    """Create PyInstaller spec file"""
    print_step(4, "Creating PyInstaller spec file")
    
    spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

# Paths
backend_dir = r'{BACKEND_DIR}'
frontend_dist = r'{FRONTEND_DIR / "dist"}'
app_script = r'{STANDALONE_DIR / "mytasker_app.py"}'

# Collect all backend files
backend_files = [
    (backend_dir / 'app', 'app'),
]

# Collect frontend dist files
frontend_files = [
    (frontend_dist, 'frontend/dist'),
]

a = Analysis(
    [app_script],
    pathex=[backend_dir],
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
    console=True,  # Show console for logs
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon path here if you have one
)
'''
    
    spec_file = STANDALONE_DIR / "mytasker.spec"
    spec_file.write_text(spec_content)
    print(f"✅ Spec file created: {spec_file}")
    return spec_file

def build_executable(spec_file):
    """Build executable with PyInstaller"""
    print_step(5, "Building executable with PyInstaller")
    
    print("This may take 5-10 minutes...")
    print("Building single-file executable...")
    
    run_command(
        ["pyinstaller", "--clean", str(spec_file)],
        cwd=STANDALONE_DIR
    )
    
    exe_path = DIST_DIR / "MyTasker.exe"
    if not exe_path.exists():
        raise Exception("Build failed - executable not found")
    
    print(f"✅ Executable built: {exe_path}")
    return exe_path

def create_distribution():
    """Create final distribution folder"""
    print_step(6, "Creating distribution package")
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Copy executable
    exe_source = DIST_DIR / "MyTasker.exe"
    exe_dest = OUTPUT_DIR / "MyTasker.exe"
    shutil.copy2(exe_source, exe_dest)
    print(f"✅ Copied: MyTasker.exe")
    
    # Create data directory
    data_dir = OUTPUT_DIR / "data"
    data_dir.mkdir(exist_ok=True)
    print(f"✅ Created: data/ folder")
    
    # Create README
    readme_content = '''# MyTasker Standalone Edition

## Quick Start

1. Double-click `MyTasker.exe`
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
- Double-click `MyTasker.exe`
- Browser opens automatically to http://localhost:8000

### Stopping MyTasker
- Close the console window
- Or press Ctrl+C in the console

### Your Data
- All data is stored in the `data/` folder
- Database: `data/mytasker.db`
- Backups: `data/backups/`

### Backups
MyTasker automatically keeps your data safe:
- Manual backup: Copy the entire `data/` folder
- Recommended: Copy `data/` folder to external drive weekly

## Portable Usage

MyTasker is fully portable:
1. Copy entire `MyTasker-Standalone` folder to USB drive
2. Run from any Windows PC
3. All your data travels with you

## System Requirements

- Windows 10 or 11 (64-bit)
- 100MB free disk space
- Modern web browser (Chrome, Edge, Firefox)

## Troubleshooting

### Port Already in Use
If port 8000 is busy, MyTasker will automatically find another port.

### Browser Doesn't Open
Manually open: http://localhost:8000

### Can't Start
- Check if another MyTasker instance is running
- Close it and try again

## Features

- ✅ Daily Log - Journal your day
- ✅ Tasks - Manage your work
- ✅ Notes - Organize your thoughts
- ✅ Snippets - Save code snippets
- ✅ Bookmarks - Quick access to resources
- ✅ Search - Find anything instantly

## Support

For help and documentation, visit:
https://github.com/Harics88/MyTasker

## Version

MyTasker Standalone v1.0.0
Built: 2026-01-06

---

Enjoy your local-first productivity app!
'''
    
    readme_path = OUTPUT_DIR / "README.txt"
    readme_path.write_text(readme_content)
    print(f"✅ Created: README.txt")
    
    # Calculate size
    total_size = sum(f.stat().st_size for f in OUTPUT_DIR.rglob('*') if f.is_file())
    size_mb = total_size / (1024 * 1024)
    
    print(f"\n✅ Distribution package created!")
    print(f"📁 Location: {OUTPUT_DIR}")
    print(f"📦 Size: {size_mb:.1f} MB")
    
    return OUTPUT_DIR

def main():
    """Main build process"""
    print("=" * 60)
    print("  MyTasker Standalone Builder")
    print("  Creating single executable with PyInstaller")
    print("=" * 60)
    
    try:
        # Build steps
        clean_build_dirs()
        build_frontend()
        install_pyinstaller()
        spec_file = create_spec_file()
        build_executable(spec_file)
        output_dir = create_distribution()
        
        # Success message
        print("\n" + "=" * 60)
        print("  ✅ BUILD SUCCESSFUL!")
        print("=" * 60)
        print(f"\nYour standalone MyTasker is ready!")
        print(f"\n📁 Location: {output_dir}")
        print(f"\n🚀 To run:")
        print(f"   1. Go to: {output_dir}")
        print(f"   2. Double-click: MyTasker.exe")
        print(f"   3. Browser opens automatically!")
        print("\n💡 Tip: You can copy this entire folder to a USB drive")
        print("   and run it on any Windows PC - no installation needed!")
        print("\n" + "=" * 60)
        
        return 0
        
    except Exception as e:
        print(f"\n❌ BUILD FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())

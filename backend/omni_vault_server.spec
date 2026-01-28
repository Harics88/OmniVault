# -*- mode: python ; coding: utf-8 -*-

import sys
from pathlib import Path

block_cipher = None

# Get the project root directory
backend_dir = Path(SPECPATH)
project_root = backend_dir.parent
frontend_dist = project_root / 'frontend' / 'dist'

# Data files to include
datas = [
    # Frontend build - bundle the entire directory at once
    (str(frontend_dist), 'frontend_dist'),
]

# Hidden imports for FastAPI and its dependencies
hiddenimports = [
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
    'sqlalchemy.ext.baked',
    'aiosqlite',
    'jinja2',
    'python-multipart',
    'jaraco.text',
    'jaraco.functools',
    'jaraco.context',
    'more_itertools',
    'autocommand',
]

from PyInstaller.utils.hooks import collect_all

# Collect all jaraco submodules and data
jaraco_datas, jaraco_binaries, jaraco_hiddenimports = collect_all('jaraco')

a = Analysis(
    ['app_server.py'],  # Web server entry point (no PyWebView)
    pathex=[str(backend_dir)],
    binaries=jaraco_binaries,
    datas=datas + jaraco_datas,
    hiddenimports=hiddenimports + jaraco_hiddenimports + ['pkg_resources'],
    hookspath=[],
    hooksconfig={},
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
    [],
    exclude_binaries=True,
    name='OmniVault-Server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,  # Console enabled for web server
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(backend_dir / 'icon.ico'),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='OmniVault-Server',
)

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
    'webview',
    'webview.platforms.edgechromium',  # Prefer EdgeChromium backend
    'jinja2',
    'python-multipart',
    'jaraco.text',
    'jaraco.functools',
    'jaraco.context',
    'more_itertools',
    'autocommand',
    'pkg_resources',
]

from PyInstaller.utils.hooks import collect_all

# Collect all jaraco submodules and data
jaraco_datas, jaraco_binaries, jaraco_hiddenimports = collect_all('jaraco')

# Collect webview for EdgeChromium support
webview_datas, webview_binaries, webview_hiddenimports = collect_all('webview')

# Note: We're NOT collecting pythonnet/clr_loader anymore as they cause
# compatibility issues on different Windows systems. The EdgeChromium backend
# (using Microsoft Edge WebView2) is more reliable and widely compatible.

a = Analysis(
    ['app_webview.py'],
    pathex=[str(backend_dir)],
    binaries=jaraco_binaries + webview_binaries,
    datas=datas + jaraco_datas + webview_datas,
    hiddenimports=hiddenimports + jaraco_hiddenimports + webview_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'pythonnet',  # Exclude problematic pythonnet
        'clr_loader',  # Exclude problematic clr_loader
        'clr',
    ],
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
    name='OmniVault',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,  # Enable console for debugging - change to False for production
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='OmniVault',
)


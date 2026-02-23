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
    'uvicorn.logging', 'uvicorn.loops', 'uvicorn.loops.auto',
    'uvicorn.protocols', 'uvicorn.protocols.http', 'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets', 'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan', 'uvicorn.lifespan.on',
    'sqlalchemy.ext.baked', 'aiosqlite', 'webview', 'jinja2',
    'python-multipart', 'jaraco.text', 'jaraco.functools',
    'jaraco.context', 'more_itertools', 'autocommand', 'clr', 'pythonnet'
]

from PyInstaller.utils.hooks import collect_all

# Standard collections
jaraco_datas, jaraco_binaries, jaraco_hiddenimports = collect_all('jaraco')
webview_datas, webview_binaries, webview_hiddenimports = collect_all('webview')

# 🛠️ INDUSTRIAL BUILD FIX (v2.6.8+)
# We AVOID collect_all for pythonnet/clr_loader to prevent capturing CoreCLR metadata/hints.
# Instead, we surgically include ONLY the required binaries.
import site
site_packages = site.getsitepackages()[0]
pythonnet_pkg = Path(site_packages) / 'pythonnet'

# Manual binaries selection
binaries = jaraco_binaries + webview_binaries
if (pythonnet_pkg / 'runtime' / 'Python.Runtime.dll').exists():
    # Bundle Python.Runtime.dll to BOTH root and subfolder to ensure resolution
    binaries += [
        (str(pythonnet_pkg / 'runtime' / 'Python.Runtime.dll'), '.'),
        (str(pythonnet_pkg / 'runtime' / 'Python.Runtime.dll'), 'pythonnet/runtime'),
    ]

a = Analysis(
    ['app_webview.py'],
    pathex=[str(backend_dir)],
    binaries=binaries,
    datas=datas + jaraco_datas + webview_datas,
    hiddenimports=hiddenimports + jaraco_hiddenimports + webview_hiddenimports + ['pkg_resources'],
    hookspath=[],
    runtime_hooks=['runtime_hook.py'], 
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# 🛑 DEEP SANITIZATION (v2.6.10): Global strip of all .json and .deps files
# This is the "Nuclear Option" to ensure nothing triggers a CoreCLR load.
a.datas = [d for d in a.datas if not (d[0].endswith('.json') or d[0].endswith('.deps'))]

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
    console=False, 
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
    name='OmniVault',
)

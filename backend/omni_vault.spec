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

# Collect webview data (for EdgeChromium backend)
webview_datas, webview_binaries, webview_hiddenimports = collect_all('webview')

# Collect pythonnet and clr_loader (required for EdgeChromium via pythonnet)
pythonnet_datas, pythonnet_binaries, pythonnet_hiddenimports = collect_all('pythonnet')
clr_loader_datas, clr_loader_binaries, clr_loader_hiddenimports = collect_all('clr_loader')

# Manually add Python.Runtime.dll to the root of the bundle
# This is a critical workaround for PyInstaller 6+ which moves everything to _internal/
import site
site_packages = site.getsitepackages()[0]
pythonnet_runtime = Path(site_packages) / 'pythonnet' / 'runtime'
if pythonnet_runtime.exists():
    datas += [
        (str(pythonnet_runtime / 'Python.Runtime.dll'), '.'),
    ]

a = Analysis(
    ['app_webview.py'],
    pathex=[str(backend_dir)],
    binaries=jaraco_binaries + webview_binaries + pythonnet_binaries + clr_loader_binaries,
    datas=datas + jaraco_datas + webview_datas + pythonnet_datas + clr_loader_datas,
    hiddenimports=hiddenimports + jaraco_hiddenimports + webview_hiddenimports + pythonnet_hiddenimports + clr_loader_hiddenimports + ['pkg_resources', 'clr', 'pythonnet', 'clr_loader', 'clr_loader.runtimes'],
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
    name='OmniVault',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False, # Final production build - console disabled
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

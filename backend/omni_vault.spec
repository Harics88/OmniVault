# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from pathlib import Path

block_cipher = None

# Get the project root directory
backend_dir = Path(SPECPATH)
project_root = backend_dir.parent
frontend_dist = project_root / 'frontend' / 'dist'

# Create a runtime hook to fix pythonnet initialization
runtime_hook_code = '''
import os
import sys

# Fix for pythonnet in frozen PyInstaller environment
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    
    # Add paths where pythonnet DLLs might be located to PATH
    # This helps Windows find the .NET runtime DLLs
    paths_to_add = [
        base_path,
        os.path.join(base_path, 'pythonnet'),
        os.path.join(base_path, 'pythonnet', 'runtime'),
        os.path.join(base_path, 'clr_loader'),
    ]
    
    current_path = os.environ.get('PATH', '')
    for p in paths_to_add:
        if os.path.exists(p) and p not in current_path:
            current_path = p + os.pathsep + current_path
    
    os.environ['PATH'] = current_path
    
    # Do NOT set PYTHONNET_RUNTIME - it expects a runtime TYPE name
    # like "netfx" or "coreclr", not a path. Let pythonnet auto-detect.
'''


# Write runtime hook to a file
runtime_hook_path = backend_dir / 'runtime_hook_pythonnet.py'
with open(runtime_hook_path, 'w') as f:
    f.write(runtime_hook_code)

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
    'webview.platforms.winforms',
    'webview.platforms.edgechromium',
    'jinja2',
    'python-multipart',
    'jaraco.text',
    'jaraco.functools',
    'jaraco.context',
    'more_itertools',
    'autocommand',
    'pkg_resources',
    # Pythonnet imports
    'clr',
    'clr_loader',
    'pythonnet',
    'System',
    'System.Windows.Forms',
    'System.Drawing',
    'System.Threading',
]

from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_dynamic_libs

# Collect all jaraco submodules and data
jaraco_datas, jaraco_binaries, jaraco_hiddenimports = collect_all('jaraco')

# Collect webview
webview_datas, webview_binaries, webview_hiddenimports = collect_all('webview')

# Collect pythonnet and clr_loader (required for PyWebView on Windows)
pythonnet_datas, pythonnet_binaries, pythonnet_hiddenimports = collect_all('pythonnet')
clr_datas, clr_binaries, clr_hiddenimports = collect_all('clr_loader')

# Also get any dynamic libraries
pythonnet_libs = collect_dynamic_libs('pythonnet')
clr_libs = collect_dynamic_libs('clr_loader')

a = Analysis(
    ['app_webview.py'],
    pathex=[str(backend_dir)],
    binaries=jaraco_binaries + webview_binaries + pythonnet_binaries + clr_binaries + pythonnet_libs + clr_libs,
    datas=datas + jaraco_datas + webview_datas + pythonnet_datas + clr_datas,
    hiddenimports=hiddenimports + jaraco_hiddenimports + webview_hiddenimports + pythonnet_hiddenimports + clr_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[str(runtime_hook_path)],
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
    console=False,  # Production build - no console window
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



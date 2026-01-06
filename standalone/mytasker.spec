# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

# Paths
backend_dir = r'D:\Projects\Antigravity\MyTasker\backend'
frontend_dist = r'D:\Projects\Antigravity\MyTasker\frontend\dist'
app_script = r'D:\Projects\Antigravity\MyTasker\standalone\mytasker_app.py'

# Collect all backend files
backend_files = [
    (backend_dir + '\\\\app', 'app'),
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

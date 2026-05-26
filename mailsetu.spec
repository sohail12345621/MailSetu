# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_all

block_cipher = None

# Collect all FastAPI/SQLAlchemy/APScheduler data
datas = []
binaries = []
hiddenimports = [
    'uvicorn.logging', 'uvicorn.loops', 'uvicorn.loops.auto',
    'uvicorn.protocols', 'uvicorn.protocols.http', 'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets', 'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan', 'uvicorn.lifespan.on',
    'aiosqlite', 'sqlalchemy.dialects.sqlite',
    'apscheduler', 'apscheduler.schedulers.asyncio',
    'apscheduler.triggers.date', 'apscheduler.triggers.cron',
    'passlib.handlers.bcrypt', 'bcrypt',
    'email.mime.multipart', 'email.mime.text', 'email.mime.base',
    'multipart',
]

for pkg in ['fastapi', 'pydantic', 'starlette']:
    d, b, h = collect_all(pkg)
    datas += d; binaries += b; hiddenimports += h

# Include frontend build output
frontend_dist = os.path.join('frontend', 'dist')
if os.path.exists(frontend_dist):
    datas.append((frontend_dist, 'frontend/dist'))

# Include .env and other assets
for extra in ['.env', 'database', 'logs', 'uploads', 'templates']:
    if os.path.exists(extra):
        datas.append((extra, extra))

a = Analysis(
    ['backend/main.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
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
    pyz, a.scripts,
    a.binaries, a.zipfiles, a.datas,
    [],
    name='MailSetu',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Set False for no console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

hiddenimports = (
    collect_submodules('engineio') +
    collect_submodules('socketio') +
    collect_submodules('flask_socketio') +
    collect_submodules('webview')
)

tabula_datas = collect_data_files('tabula', includes=['*.jar'])

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('dist', 'dist'),
        ('data', 'data'),
        ('config', 'config'),
        ('pyproject.toml', '.'),
    ] + tabula_datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='XY_TASK',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    icon='xy-logo.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name='XY_TASK',
)
# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules

# Só o necessário para webview/socketio + pdfplumber (texto/tabelas).
# Evitar collect_all em pdfplumber/pdfminer — puxa display/PIL e dados extras.
hiddenimports = (
    collect_submodules("engineio")
    + collect_submodules("socketio")
    + collect_submodules("flask_socketio")
    + collect_submodules("webview")
    + [
        "pdfplumber",
        "pdfplumber.pdf",
        "pdfplumber.page",
        "pdfplumber.container",
        "pdfplumber.utils",
        "pdfplumber.table",
        "pdfplumber.convert",
        "pdfplumber.structure",
        "pdfplumber.repair",
        "pdfminer",
        "pdfminer.high_level",
        "pdfminer.pdfpage",
        "pdfminer.pdfinterp",
        "pdfminer.converter",
        "pdfminer.layout",
        "pdfminer.pdfdocument",
        "pdfminer.pdfparser",
        "pdfminer.pdfdevice",
        "pdfminer.psparser",
        "pdfminer.cmapdb",
        "pdfminer.pdftypes",
        "pypdfium2",
    ]
)

# Pacotes de desenvolvimento / opcionais que o PyInstaller costuma
# seguir a partir do pandas/IPython e incham o instalador sem uso no app.
excludes = [
    "IPython",
    "ipykernel",
    "ipywidgets",
    "jupyter",
    "notebook",
    "jedi",
    "parso",
    "zmq",
    "tornado",
    "matplotlib",
    "scipy",
    "PyQt5",
    "PyQt6",
    "PySide2",
    "PySide6",
    "qtpy",
    "nbformat",
    "nbconvert",
    "sphinx",
    "pytest",
    "black",
    "PIL",
    "Pillow",
    "pdfplumber.display",
    "pdfplumber.cli",
    "pymupdf",
    "fitz",
    "pikepdf",
]

tabula_datas = collect_data_files("tabula", includes=["*.jar"])

# pypdfium2 precisa das DLLs nativas; collect_all só nele.
pypdfium2_datas, pypdfium2_binaries, pypdfium2_hiddenimports = collect_all("pypdfium2")

a = Analysis(
    ["main.py"],
    pathex=[],
    binaries=pypdfium2_binaries,
    datas=[
        ("dist", "dist"),
        ("data", "data"),
        ("config", "config"),
        ("pyproject.toml", "."),
    ]
    + tabula_datas
    + pypdfium2_datas,
    hiddenimports=hiddenimports + pypdfium2_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="XY_TASK",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    icon="xy-logo.ico",
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="XY_TASK",
)

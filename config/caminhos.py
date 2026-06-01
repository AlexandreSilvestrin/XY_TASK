import os
import shutil
import sys
from pathlib import Path

APP_NAME = "XY TASK"

SEED_FILES = (
    "BANCOCNPJ.db",
    "GUIANOMES.db",
)


def is_installed() -> bool:
    return getattr(sys, "frozen", False)


def get_base_dir() -> Path:
    if is_installed():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def get_seed_dir() -> Path:
    if is_installed():
        return Path(sys._MEIPASS) / "data" / "seed"
    return get_base_dir() / "data" / "seed"


def get_local_app_dir() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        local_app_data = Path.home() / "AppData" / "Local"
    return Path(local_app_data) / APP_NAME


def get_webview_storage_dir() -> Path:
    """Pasta persistente do WebView (localStorage, cookies, tema)."""
    path = get_local_app_dir() / "webview"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_data_dir() -> Path:
    if is_installed():
        path = get_local_app_dir() / "data"
    else:
        path = get_base_dir() / "data"

    path.mkdir(parents=True, exist_ok=True)
    return path


def init_user_data() -> None:
    """Copia arquivos iniciais do seed para o data do usuário, se ainda não existirem."""
    data_dir = get_data_dir()
    seed_dir = get_seed_dir()

    for filename in SEED_FILES:
        destination = data_dir / filename
        if destination.exists():
            continue

        source = seed_dir / filename
        if source.exists():
            shutil.copy2(source, destination)


class Caminhos:
    CAMINHO_BANCO_CNPJ: Path
    CAMINHO_BANCO_CNPJ_XLSX: Path
    CAMINHO_GUIA_NOMES: Path


def refresh_paths() -> None:
    data_dir = get_data_dir()
    Caminhos.CAMINHO_BANCO_CNPJ = data_dir / "BANCOCNPJ.db"
    Caminhos.CAMINHO_GUIA_NOMES = data_dir / "GUIANOMES.db"


def setup() -> None:
    init_user_data()
    refresh_paths()


setup()

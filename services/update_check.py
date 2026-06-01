import ctypes
import json
import os
import sys
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from threading import Thread

from config.caminhos import get_local_app_dir

GITHUB_RELEASES_URL = (
    "https://api.github.com/repos/AlexandreSilvestrin/XY_TASK/releases/latest"
)
SETUP_ASSET_NAME = "XY-task-setup.exe"
_REQUEST_HEADERS = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "XY-TASK",
}

_MB_OKCANCEL = 0x00000001
_MB_ICONINFORMATION = 0x00000040
_IDOK = 1


@dataclass(frozen=True)
class UpdateInfo:
    version: str
    download_url: str


def get_installer_dir() -> Path:
    """Pasta onde o instalador é salvo: %LOCALAPPDATA%\\XY TASK\\updates\\"""
    path = get_local_app_dir() / "updates"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_installer_path(version: str) -> Path:
    return get_installer_dir() / f"XY-task-{version}-setup.exe"


def _cleanup_old_installers(keep: Path) -> None:
    keep_resolved = keep.resolve()
    for installer in get_installer_dir().glob("XY-task-*-setup.exe"):
        if installer.resolve() == keep_resolved:
            continue
        try:
            installer.unlink()
        except OSError:
            pass


def _parse_version(version: str) -> tuple[int, ...]:
    normalized = version.strip().lstrip("vV")
    parts: list[int] = []

    for segment in normalized.split("."):
        number = ""
        for char in segment:
            if char.isdigit():
                number += char
            else:
                break
        if number:
            parts.append(int(number))

    return tuple(parts) if parts else (0,)


def is_newer_version(latest: str, current: str) -> bool:
    return _parse_version(latest) > _parse_version(current)


def fetch_latest_release() -> UpdateInfo | None:
    request = urllib.request.Request(
        GITHUB_RELEASES_URL,
        headers=_REQUEST_HEADERS,
    )

    with urllib.request.urlopen(request, timeout=15) as response:
        data = json.loads(response.read().decode())

    version = str(data.get("tag_name", "")).lstrip("vV")
    download_url = None

    for asset in data.get("assets", []):
        if asset.get("name") == SETUP_ASSET_NAME:
            download_url = asset.get("browser_download_url")
            break

    if not version or not download_url:
        return None

    return UpdateInfo(version=version, download_url=download_url)


def _download_installer(download_url: str, destination: Path) -> None:
    request = urllib.request.Request(download_url, headers=_REQUEST_HEADERS)
    with urllib.request.urlopen(request, timeout=300) as response:
        destination.write_bytes(response.read())


def _prompt_update_available(update: UpdateInfo, current: str) -> bool:
    message = (
        f"Uma nova versão ({update.version}) está disponível.\n\n"
        f"Versão atual: {current}\n\n"
        "O instalador já foi baixado. Ao clicar em OK, o programa "
        "será encerrado e a instalação será iniciada."
    )

    if sys.platform == "win32":
        result = ctypes.windll.user32.MessageBoxW(
            0,
            message,
            "Atualização disponível",
            _MB_OKCANCEL | _MB_ICONINFORMATION,
        )
        return result == _IDOK

    from tkinter import Tk, messagebox

    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    accepted = messagebox.askokcancel(
        "Atualização disponível",
        message,
        icon="info",
    )
    root.destroy()
    return accepted


def _run_installer(installer_path: Path) -> None:
    if sys.platform == "win32":
        os.startfile(installer_path)
    else:
        os.chmod(installer_path, 0o755)
        os.execv(installer_path, [str(installer_path)])


def _update_worker(
    current_version: str,
    on_before_exit: Callable[[], None] | None,
) -> None:
    try:
        update = fetch_latest_release()
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
        return

    if update is None or not is_newer_version(update.version, current_version):
        return

    installer_path = get_installer_path(update.version)

    if not installer_path.exists():
        try:
            _download_installer(update.download_url, installer_path)
        except (urllib.error.URLError, TimeoutError, OSError):
            return

    _cleanup_old_installers(installer_path)

    if not _prompt_update_available(update, current_version):
        return

    try:
        _run_installer(installer_path)
    except OSError:
        return

    if on_before_exit is not None:
        on_before_exit()
    os._exit(0)


def start_update_check(
    current_version: str,
    on_before_exit: Callable[[], None] | None = None,
) -> None:
    """Verifica e baixa atualização em background, sem bloquear a abertura do app."""
    thread = Thread(
        target=_update_worker,
        args=(current_version, on_before_exit),
        daemon=True,
        name="update-check",
    )
    thread.start()

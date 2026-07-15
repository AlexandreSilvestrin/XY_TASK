import json
import shutil
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from tkinter import Tk, filedialog

from config.caminhos import get_backups_dir, get_data_dir, init_user_data, refresh_paths
from config.version import __version__

BACKUP_EXTENSION = ".xybackup"
MANIFEST_NAME = "manifest.json"
# Pasta de templates do repositório; não é dado do usuário.
_EXCLUDED_DIR_NAMES = frozenset({"seed"})


def _ask_save_backup_path(default_name: str) -> str | None:
    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.asksaveasfilename(
        title="Salvar backup XY Task",
        defaultextension=BACKUP_EXTENSION,
        filetypes=[
            ("Backup XY Task", f"*{BACKUP_EXTENSION}"),
            ("Todos os arquivos", "*.*"),
        ],
        initialfile=default_name,
    )
    root.destroy()
    return path or None


def _ask_open_backup_path() -> str | None:
    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.askopenfilename(
        title="Importar backup XY Task",
        filetypes=[
            ("Backup XY Task", f"*{BACKUP_EXTENSION}"),
            ("Todos os arquivos", "*.*"),
        ],
    )
    root.destroy()
    return path or None


def _default_backup_filename() -> str:
    stamp = datetime.now().strftime("%Y-%m-%d")
    return f"XYTask_Backup_{stamp}{BACKUP_EXTENSION}"


def _ensure_xybackup_suffix(path: Path) -> Path:
    if path.suffix.lower() != BACKUP_EXTENSION:
        return path.with_suffix(BACKUP_EXTENSION)
    return path


def _iter_data_files(data_dir: Path):
    for item in data_dir.rglob("*"):
        if not item.is_file():
            continue
        relative = item.relative_to(data_dir)
        if any(part in _EXCLUDED_DIR_NAMES for part in relative.parts):
            continue
        yield item, relative.as_posix()


def _build_manifest() -> dict:
    now = datetime.now()
    return {
        "app": "XY Task",
        "version": __version__,
        "created_at": now.isoformat(timespec="seconds"),
        "created_at_display": now.strftime("%d/%m/%Y %H:%M"),
    }


def _write_backup_archive(destination: Path) -> dict:
    data_dir = get_data_dir()
    manifest = _build_manifest()

    destination.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            MANIFEST_NAME,
            json.dumps(manifest, ensure_ascii=False, indent=2),
        )
        for file_path, arcname in _iter_data_files(data_dir):
            archive.write(file_path, arcname)

    return manifest


def _read_manifest(archive: zipfile.ZipFile) -> dict:
    try:
        raw = archive.read(MANIFEST_NAME)
    except KeyError as exc:
        raise ValueError(
            "Arquivo de backup inválido: manifest.json não encontrado."
        ) from exc

    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Arquivo de backup inválido: manifesto corrompido.") from exc

    if not isinstance(data, dict):
        raise ValueError("Arquivo de backup inválido: manifesto malformado.")

    return data


def _clear_user_data(data_dir: Path) -> None:
    for child in list(data_dir.iterdir()):
        if child.name in _EXCLUDED_DIR_NAMES:
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink(missing_ok=True)


def _restore_from_archive(archive_path: Path) -> dict:
    data_dir = get_data_dir()

    with zipfile.ZipFile(archive_path, "r") as archive:
        if archive.testzip() is not None:
            raise ValueError("Arquivo de backup corrompido.")

        manifest = _read_manifest(archive)
        members = [
            info
            for info in archive.infolist()
            if info.filename
            and not info.filename.endswith("/")
            and info.filename != MANIFEST_NAME
            and ".." not in Path(info.filename).parts
        ]

        if not members:
            raise ValueError("Arquivo de backup não contém dados para restaurar.")

        with tempfile.TemporaryDirectory(prefix="xy_backup_restore_") as temp_dir:
            temp_path = Path(temp_dir)
            for info in members:
                archive.extract(info, temp_path)

            _clear_user_data(data_dir)

            for extracted in temp_path.rglob("*"):
                if not extracted.is_file():
                    continue
                relative = extracted.relative_to(temp_path)
                target = data_dir / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(extracted, target)

    init_user_data()
    refresh_paths()
    return manifest


def criar_backup():
    default_name = _default_backup_filename()
    chosen = _ask_save_backup_path(default_name)
    if not chosen:
        return {
            "success": False,
            "cancelled": True,
            "message": "Nenhum local selecionado para salvar o backup.",
        }

    try:
        user_path = _ensure_xybackup_suffix(Path(chosen))
        local_path = get_backups_dir() / user_path.name

        manifest = _write_backup_archive(user_path)
        shutil.copy2(user_path, local_path)

        return {
            "success": True,
            "message": (
                f"Backup criado com sucesso.\n"
                f"Salvo em: {user_path}"
            ),
            "path": str(user_path),
            "local_path": str(local_path),
            "version": manifest.get("version"),
            "created_at": manifest.get("created_at_display"),
        }
    except Exception as exc:
        return {
            "success": False,
            "message": str(exc),
        }


def importar_backup():
    chosen = _ask_open_backup_path()
    if not chosen:
        return {
            "success": False,
            "cancelled": True,
            "message": "Nenhum arquivo de backup selecionado.",
        }

    archive_path = Path(chosen)
    if archive_path.suffix.lower() != BACKUP_EXTENSION:
        return {
            "success": False,
            "message": f"Selecione um arquivo com extensão {BACKUP_EXTENSION}.",
        }

    if not zipfile.is_zipfile(archive_path):
        return {
            "success": False,
            "message": "Arquivo de backup inválido ou corrompido.",
        }

    try:
        manifest = _restore_from_archive(archive_path)
        backup_version = str(manifest.get("version") or "desconhecida")
        version_mismatch = backup_version != __version__

        message = "Backup importado com sucesso. Os dados atuais foram substituídos."
        if version_mismatch:
            message += (
                f" Atenção: o backup é da versão {backup_version} "
                f"e este programa está na versão {__version__}."
            )

        return {
            "success": True,
            "message": message,
            "path": str(archive_path),
            "backup_version": backup_version,
            "app_version": __version__,
            "version_mismatch": version_mismatch,
            "created_at": manifest.get("created_at_display"),
        }
    except Exception as exc:
        return {
            "success": False,
            "message": str(exc),
        }

import ctypes
import os
import sys
from pathlib import Path

from config.caminhos import APP_NAME, get_local_app_dir

_MUTEX_NAME = r"Local\XY_TASK_SingleInstance"
_MB_OK = 0x00000000
_MB_ICONINFORMATION = 0x00000040
_ERROR_ALREADY_EXISTS = 183

_instance_lock = None


def _notify_already_running() -> None:
    message = f"{APP_NAME} já está em execução."
    if sys.platform == "win32":
        ctypes.windll.user32.MessageBoxW(
            0,
            message,
            APP_NAME,
            _MB_OK | _MB_ICONINFORMATION,
        )
        return

    print(message, file=sys.stderr)


def _try_acquire_windows() -> bool:
    global _instance_lock

    handle = ctypes.windll.kernel32.CreateMutexW(None, True, _MUTEX_NAME)
    if ctypes.windll.kernel32.GetLastError() == _ERROR_ALREADY_EXISTS:
        ctypes.windll.kernel32.CloseHandle(handle)
        return False

    _instance_lock = handle
    return True


def _try_acquire_file_lock() -> bool:
    global _instance_lock

    lock_path = get_local_app_dir() / "instance.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)

    handle = lock_path.open("w")
    try:
        if sys.platform == "win32":
            import msvcrt

            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl

            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (OSError, BlockingIOError):
        handle.close()
        return False

    handle.write(str(os.getpid()))
    handle.flush()
    _instance_lock = handle
    return True


def ensure_single_instance() -> bool:
    """Retorna False se outra instância do app já estiver aberta."""
    acquired = (
        _try_acquire_windows()
        if sys.platform == "win32"
        else _try_acquire_file_lock()
    )
    if acquired:
        return True

    _notify_already_running()
    return False

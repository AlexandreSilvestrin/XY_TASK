import tomllib
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_PYPROJECT = _PROJECT_ROOT / "pyproject.toml"


def _load_version() -> str:
    try:
        with _PYPROJECT.open("rb") as file:
            data = tomllib.load(file)
        return str(data["project"]["version"])
    except Exception:
        return "0.0.0"


__version__ = _load_version()

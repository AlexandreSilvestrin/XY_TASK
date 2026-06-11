import json
import os
from pathlib import Path
from typing import Any

from config.caminhos import get_data_dir

FIELD_B = "B"
FIELD_B_BAIXA = "B BAIXA"
FIELD_C = "C"
FIELD_C_BAIXA = "C BAIXA"

CODIGO_FIELDS = (FIELD_B, FIELD_B_BAIXA, FIELD_C, FIELD_C_BAIXA)
CODIGO_LIST_SIZE = 6


class CodigosModel:
    """Modelo dos códigos contábeis por consórcio (provisões). Persistência em JSON."""

    @staticmethod
    def filepath() -> Path:
        return get_data_dir() / "codigos.json"

    @staticmethod
    def exists() -> bool:
        return CodigosModel.filepath().exists()

    @staticmethod
    def _validate_codigo(codigo: str) -> str:
        normalized = str(codigo).strip()
        if not normalized:
            raise ValueError("Código do consórcio é obrigatório.")
        return normalized

    @staticmethod
    def _normalize_int_list(values: Any, field_name: str) -> list[int]:
        if not isinstance(values, list):
            raise ValueError(f"O campo '{field_name}' deve ser uma lista.")

        if len(values) != CODIGO_LIST_SIZE:
            raise ValueError(
                f"O campo '{field_name}' deve conter exatamente {CODIGO_LIST_SIZE} valores."
            )

        result: list[int] = []
        for index, value in enumerate(values):
            try:
                number = int(value)
            except (TypeError, ValueError) as exc:
                raise ValueError(
                    f"Valor inválido em '{field_name}' (posição {index + 1})."
                ) from exc
            result.append(number)
        return result

    @classmethod
    def _validate_entry(cls, entry: dict) -> dict[str, list[int]]:
        if not isinstance(entry, dict):
            raise ValueError("Os dados do consórcio devem ser um objeto.")

        normalized: dict[str, list[int]] = {}
        for field in CODIGO_FIELDS:
            if field not in entry:
                raise ValueError(f"O campo '{field}' é obrigatório.")
            normalized[field] = cls._normalize_int_list(entry[field], field)

        return normalized

    @staticmethod
    def load_all() -> dict[str, dict[str, list[int]]]:
        path = CodigosModel.filepath()
        if not path.exists():
            return {}

        with path.open("r", encoding="utf-8") as file:
            raw = json.load(file)

        if not isinstance(raw, dict):
            raise ValueError("codigos.json deve conter um objeto JSON.")

        return {
            CodigosModel._validate_codigo(codigo): CodigosModel._validate_entry(entry)
            for codigo, entry in raw.items()
        }

    @staticmethod
    def save_all(data: dict[str, dict[str, list[int]]]) -> None:
        path = CodigosModel.filepath()
        path.parent.mkdir(parents=True, exist_ok=True)

        normalized = {
            CodigosModel._validate_codigo(codigo): CodigosModel._validate_entry(entry)
            for codigo, entry in sorted(data.items())
        }

        temp_path = path.with_suffix(".json.tmp")
        with temp_path.open("w", encoding="utf-8") as file:
            json.dump(normalized, file, ensure_ascii=False, indent=4)
            file.write("\n")

        os.replace(temp_path, path)

    @staticmethod
    def list_codigos() -> list[str]:
        return sorted(CodigosModel.load_all().keys())

    @staticmethod
    def get(codigo: str) -> dict[str, list[int]] | None:
        key = CodigosModel._validate_codigo(codigo)
        return CodigosModel.load_all().get(key)

    @staticmethod
    def add(codigo: str, entry: dict) -> dict[str, list[int]]:
        key = CodigosModel._validate_codigo(codigo)
        data = CodigosModel.load_all()

        if key in data:
            raise ValueError(f"O consórcio '{key}' já existe.")

        normalized = CodigosModel._validate_entry(entry)
        data[key] = normalized
        CodigosModel.save_all(data)
        return normalized

    @staticmethod
    def update(codigo: str, entry: dict) -> dict[str, list[int]]:
        key = CodigosModel._validate_codigo(codigo)
        data = CodigosModel.load_all()

        if key not in data:
            raise ValueError(f"O consórcio '{key}' não foi encontrado.")

        normalized = CodigosModel._validate_entry(entry)
        data[key] = normalized
        CodigosModel.save_all(data)
        return normalized

    @staticmethod
    def upsert(codigo: str, entry: dict) -> dict[str, list[int]]:
        key = CodigosModel._validate_codigo(codigo)
        data = CodigosModel.load_all()
        normalized = CodigosModel._validate_entry(entry)
        data[key] = normalized
        CodigosModel.save_all(data)
        return normalized

    @staticmethod
    def patch(codigo: str, partial: dict) -> dict[str, list[int]]:
        key = CodigosModel._validate_codigo(codigo)
        data = CodigosModel.load_all()

        if key not in data:
            raise ValueError(f"O consórcio '{key}' não foi encontrado.")

        if not isinstance(partial, dict):
            raise ValueError("Os dados parciais devem ser um objeto.")

        merged = dict(data[key])
        for field, values in partial.items():
            if field not in CODIGO_FIELDS:
                raise ValueError(f"Campo desconhecido: '{field}'.")
            merged[field] = CodigosModel._normalize_int_list(values, field)

        data[key] = merged
        CodigosModel.save_all(data)
        return merged

    @staticmethod
    def remove(codigo: str) -> None:
        key = CodigosModel._validate_codigo(codigo)
        data = CodigosModel.load_all()

        if key not in data:
            raise ValueError(f"O consórcio '{key}' não foi encontrado.")

        del data[key]
        CodigosModel.save_all(data)

    @staticmethod
    def to_dict() -> dict[str, dict[str, list[int]]]:
        """Compatível com o uso em core/PROVISAO.py."""
        return CodigosModel.load_all()

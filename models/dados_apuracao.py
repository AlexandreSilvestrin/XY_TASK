import json
import os
import re
import unicodedata
from pathlib import Path
from typing import Any

from config.caminhos import get_data_dir

EMPRESAS_APURACAO = ("LBR", "SONDOTECNICA", "PLANSERVI")
CODIGO_FIELDS = ("PIS_B", "PIS_C", "COFINS_B", "COFINS_C")


class DadosApuracaoModel:
    """Códigos PIS/COFINS por empresa, consórcio e empresa consorciada (ordem importa)."""

    @staticmethod
    def filepath() -> Path:
        return get_data_dir() / "DADOS_APURACAO.json"

    @staticmethod
    def normalize_key(texto: str) -> str:
        normalized = "".join(
            char
            for char in unicodedata.normalize("NFD", str(texto))
            if unicodedata.category(char) != "Mn"
        )
        normalized = normalized.upper()
        normalized = normalized.replace("-", " ")
        normalized = normalized.replace("/", " ")
        normalized = re.sub(r"\s+", " ", normalized)
        normalized = normalized.replace("CONSORCIO", "")
        return normalized.strip()

    @staticmethod
    def _validate_empresa(empresa: str) -> str:
        key = str(empresa).strip().upper()
        if key not in EMPRESAS_APURACAO:
            raise ValueError(
                f"Empresa inválida. Use uma destas: {', '.join(EMPRESAS_APURACAO)}."
            )
        return key

    @staticmethod
    def _validate_consorcio(consorcio: str) -> str:
        key = str(consorcio).strip().upper()
        if not key:
            raise ValueError("O nome do consórcio é obrigatório.")
        return key

    @staticmethod
    def _validate_empresa_nome(nome: str) -> str:
        key = str(nome).strip().upper()
        if not key:
            raise ValueError("O nome da empresa consorciada é obrigatório.")
        return key

    @classmethod
    def _validate_codigos(cls, codigos: Any) -> dict[str, int]:
        if not isinstance(codigos, dict):
            raise ValueError("Os códigos devem ser um objeto.")

        normalized: dict[str, int] = {}
        for field in CODIGO_FIELDS:
            if field not in codigos:
                raise ValueError(f"O campo '{field}' é obrigatório.")
            try:
                normalized[field] = int(codigos[field])
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Valor inválido em '{field}'.") from exc

        return normalized

    @classmethod
    def _validate_empresas_list(cls, empresas: Any) -> list[tuple[str, dict[str, int]]]:
        if not isinstance(empresas, list) or not empresas:
            raise ValueError("Informe ao menos uma empresa consorciada na ordem correta.")

        seen: set[str] = set()
        result: list[tuple[str, dict[str, int]]] = []

        for index, item in enumerate(empresas, start=1):
            if not isinstance(item, dict):
                raise ValueError(f"Empresa na posição {index} é inválida.")

            nome = cls._validate_empresa_nome(item.get("nome", ""))
            if nome in seen:
                raise ValueError(f"A empresa '{nome}' está duplicada.")
            seen.add(nome)

            codigos = item.get("codigos")
            if codigos is None and all(field in item for field in CODIGO_FIELDS):
                codigos = {field: item[field] for field in CODIGO_FIELDS}

            result.append((nome, cls._validate_codigos(codigos)))

        return result

    @classmethod
    def _empresas_dict_from_list(
        cls, empresas: list[tuple[str, dict[str, int]]]
    ) -> dict[str, dict[str, int]]:
        return {nome: codigos for nome, codigos in empresas}

    @staticmethod
    def load_all() -> dict[str, dict[str, dict[str, dict[str, int]]]]:
        path = DadosApuracaoModel.filepath()
        if not path.exists():
            return {}

        with path.open("r", encoding="utf-8") as file:
            raw = json.load(file)

        if not isinstance(raw, dict):
            raise ValueError("DADOS_APURACAO.json deve conter um objeto JSON.")

        return raw

    @staticmethod
    def save_all(data: dict) -> None:
        path = DadosApuracaoModel.filepath()
        path.parent.mkdir(parents=True, exist_ok=True)

        temp_path = path.with_suffix(".json.tmp")
        with temp_path.open("w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=4)
            file.write("\n")

        os.replace(temp_path, path)

    @classmethod
    def list_empresas(cls) -> list[str]:
        return list(EMPRESAS_APURACAO)

    @classmethod
    def list_consorcios(cls, empresa: str) -> list[str]:
        key = cls._validate_empresa(empresa)
        empresa_data = cls.load_all().get(key, {})
        if not isinstance(empresa_data, dict):
            return []
        return list(empresa_data.keys())

    @classmethod
    def _resolve_consorcio_key(cls, empresa_data: dict, consorcio: str) -> str | None:
        if consorcio in empresa_data:
            return consorcio

        target = cls.normalize_key(consorcio)
        for key in empresa_data:
            if cls.normalize_key(key) == target:
                return key
        return None

    @classmethod
    def find_consorcio_key(cls, empresa: str, consorcio: str) -> str | None:
        empresa_key = cls._validate_empresa(empresa)
        empresa_data = cls.load_all().get(empresa_key, {})
        if not isinstance(empresa_data, dict):
            return None
        return cls._resolve_consorcio_key(empresa_data, consorcio)

    @classmethod
    def get(cls, empresa: str, consorcio: str) -> dict[str, dict[str, int]] | None:
        empresa_key = cls._validate_empresa(empresa)
        consorcio_key = cls._validate_consorcio(consorcio)
        empresa_data = cls.load_all().get(empresa_key, {})
        if not isinstance(empresa_data, dict):
            return None

        resolved = cls._resolve_consorcio_key(empresa_data, consorcio_key)
        if not resolved:
            return None

        entry = empresa_data[resolved]
        if not isinstance(entry, dict):
            return None

        return dict(entry)

    @classmethod
    def get_for_processing(cls, empresa: str) -> dict[str, dict[str, dict[str, int]]]:
        empresa_key = cls._validate_empresa(empresa)
        empresa_data = cls.load_all().get(empresa_key, {})
        if not isinstance(empresa_data, dict):
            return {}
        return empresa_data

    @classmethod
    def upsert(
        cls,
        empresa: str,
        consorcio: str,
        empresas: list[dict],
    ) -> tuple[str, str, list[dict[str, Any]]]:
        empresa_key = cls._validate_empresa(empresa)
        consorcio_key = cls._validate_consorcio(consorcio)
        empresas_list = cls._validate_empresas_list(empresas)

        data = cls.load_all()
        empresa_data = data.setdefault(empresa_key, {})
        if not isinstance(empresa_data, dict):
            empresa_data = {}
            data[empresa_key] = empresa_data

        resolved = cls._resolve_consorcio_key(empresa_data, consorcio_key)
        final_consorcio = resolved or consorcio_key

        empresa_data[final_consorcio] = cls._empresas_dict_from_list(empresas_list)
        cls.save_all(data)

        serialized = [
            {"nome": nome, "codigos": codigos} for nome, codigos in empresas_list
        ]
        return empresa_key, final_consorcio, serialized

    @classmethod
    def remove(cls, empresa: str, consorcio: str) -> None:
        empresa_key = cls._validate_empresa(empresa)
        consorcio_key = cls._validate_consorcio(consorcio)
        data = cls.load_all()

        empresa_data = data.get(empresa_key)
        if not isinstance(empresa_data, dict):
            raise ValueError("Consórcio não encontrado.")

        resolved = cls._resolve_consorcio_key(empresa_data, consorcio_key)
        if not resolved:
            raise ValueError("Consórcio não encontrado.")

        del empresa_data[resolved]
        cls.save_all(data)

    @classmethod
    def serialize_entry(
        cls,
        empresa: str,
        consorcio: str,
        entry: dict[str, dict[str, int]],
    ) -> dict[str, Any]:
        empresas = [
            {"nome": nome, "codigos": codigos} for nome, codigos in entry.items()
        ]
        return {
            "empresa": empresa,
            "consorcio": consorcio,
            "empresas": empresas,
        }

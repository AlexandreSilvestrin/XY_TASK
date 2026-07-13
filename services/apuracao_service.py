from pathlib import Path

from core.APURACAO_PIS_COFINS import ApuracaoPisCofinsWeb
from models.dados_apuracao import DadosApuracaoModel, EMPRESAS_APURACAO

from websocket.emitter import emit_log

LOG_MODULE = "apuracao-pis-cofins"


def _validar_entrada(entrada: str) -> str | None:
    path = Path(entrada)

    if not path.exists() or not path.is_dir():
        return "O caminho de entrada deve ser uma pasta válida."

    tem_excel = any(
        item.suffix.lower() in {".xlsx", ".xls"}
        for item in path.iterdir()
        if item.is_file()
    )
    if not tem_excel:
        return "Nenhum arquivo Excel encontrado na pasta de entrada."

    return None


def _validar_saida(saida: str) -> str | None:
    path = Path(saida)

    if path.exists() and not path.is_dir():
        return "O local para salvar deve ser uma pasta."

    if not path.exists():
        try:
            path.mkdir(parents=True, exist_ok=True)
        except OSError:
            return "Não foi possível criar a pasta de saída."

    return None


def _validar_data(data: str) -> str | None:
    value = str(data).strip()
    if not value:
        return "Informe a data de referência (ex.: 31/05/2026)."
    return None


def executar_apuracao(payload):
    entrada = str(payload.get("entrada", "")).strip()
    saida = str(payload.get("saida", "")).strip()
    empresa = str(payload.get("empresa", "")).strip().upper()
    data = str(payload.get("data", "")).strip()

    if not entrada or not saida:
        return {
            "success": False,
            "message": "Os campos 'entrada' e 'saida' são obrigatórios.",
        }

    if empresa not in EMPRESAS_APURACAO:
        return {
            "success": False,
            "message": (
                f"Selecione uma empresa válida: {', '.join(EMPRESAS_APURACAO)}."
            ),
        }

    erro_entrada = _validar_entrada(entrada)
    if erro_entrada:
        return {"success": False, "message": erro_entrada}

    erro_saida = _validar_saida(saida)
    if erro_saida:
        return {"success": False, "message": erro_saida}

    erro_data = _validar_data(data)
    if erro_data:
        return {"success": False, "message": erro_data}

    try:
        worker = ApuracaoPisCofinsWeb(
            entrada,
            saida,
            empresa,
            data,
            emit_log,
            log_module=LOG_MODULE,
        )
        resultado = worker.executar()

        if not resultado:
            return {
                "success": False,
                "message": "Nenhuma apuração foi gerada. Verifique os logs.",
            }

        return {
            "success": True,
            "message": "Processamento de apuração concluído. Verifique os logs.",
        }

    except Exception as exc:
        return {
            "success": False,
            "message": str(exc),
        }


def listar_empresas_apuracao():
    return {
        "success": True,
        "data": DadosApuracaoModel.list_empresas(),
    }


def listar_consorcios_apuracao(payload):
    empresa = str(payload.get("empresa", "")).strip()

    if not empresa:
        return {
            "success": False,
            "message": "Selecione a empresa para listar os consórcios.",
        }

    try:
        consorcios = DadosApuracaoModel.list_consorcios(empresa)
        return {
            "success": True,
            "data": consorcios,
        }
    except ValueError as exc:
        return {
            "success": False,
            "message": str(exc),
        }


def buscar_codigos_apuracao(payload):
    empresa = str(payload.get("empresa", "")).strip()
    consorcio = str(payload.get("consorcio", "")).strip()

    if not empresa:
        return {
            "success": False,
            "message": "Selecione a empresa para pesquisar.",
        }

    if not consorcio:
        return {
            "success": False,
            "message": "Informe o nome do consórcio para pesquisar.",
        }

    try:
        entry = DadosApuracaoModel.get(empresa, consorcio)
        if not entry:
            return {
                "success": False,
                "message": "Consórcio não encontrado.",
            }

        resolved_key = DadosApuracaoModel.find_consorcio_key(empresa, consorcio)
        return {
            "success": True,
            "data": DadosApuracaoModel.serialize_entry(
                DadosApuracaoModel._validate_empresa(empresa),
                resolved_key or consorcio.upper(),
                entry,
            ),
        }

    except ValueError as exc:
        return {
            "success": False,
            "message": str(exc),
        }

    except Exception as exc:
        emit_log(
            module=LOG_MODULE,
            status="error",
            file=consorcio,
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }


def salvar_codigos_apuracao(payload):
    empresa = str(payload.get("empresa", "")).strip()
    consorcio = str(payload.get("consorcio", "")).strip()
    empresas = payload.get("empresas")

    if not empresa:
        return {
            "success": False,
            "message": "Selecione a empresa para salvar.",
        }

    if not consorcio:
        return {
            "success": False,
            "message": "Informe o nome do consórcio para salvar.",
        }

    if not isinstance(empresas, list):
        return {
            "success": False,
            "message": "Informe as empresas consorciadas na ordem correta.",
        }

    try:
        existed = DadosApuracaoModel.get(empresa, consorcio) is not None
        empresa_key, consorcio_key, serialized = DadosApuracaoModel.upsert(
            empresa,
            consorcio,
            empresas,
        )
        message = (
            "Códigos do consórcio atualizados."
            if existed
            else "Códigos do consórcio adicionados."
        )
        emit_log(
            module=LOG_MODULE,
            status="success",
            file=f"{empresa_key} / {consorcio_key}",
            message=message,
        )
        return {
            "success": True,
            "message": message,
            "data": {
                "empresa": empresa_key,
                "consorcio": consorcio_key,
                "empresas": serialized,
            },
        }

    except ValueError as exc:
        return {
            "success": False,
            "message": str(exc),
        }

    except Exception as exc:
        emit_log(
            module=LOG_MODULE,
            status="error",
            file=consorcio,
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

from pathlib import Path

from core.PRN_T import PRNweb

from websocket.emitter import emit_log

LOG_MODULE = "excel-prn"


def _validar_entrada(entrada: str) -> str | None:
    path = Path(entrada)

    if not path.exists():
        return "O caminho de entrada não existe."

    if path.is_file():
        if path.suffix.lower() != ".xlsx":
            return "O arquivo de entrada deve ser uma planilha .xlsx."
        return None

    if path.is_dir():
        tem_excel = any(
            item.suffix.lower() == ".xlsx" for item in path.iterdir() if item.is_file()
        )
        if not tem_excel:
            return "Nenhum arquivo .xlsx encontrado na pasta de entrada."
        return None

    return "O caminho de entrada não é um arquivo ou pasta válido."


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


def executar_prn(payload):
    entrada = str(payload.get("entrada", "")).strip()
    saida = str(payload.get("saida", "")).strip()

    if not entrada or not saida:
        return {
            "success": False,
            "message": "Os campos 'entrada' e 'saida' são obrigatórios.",
        }

    erro_entrada = _validar_entrada(entrada)
    if erro_entrada:
        return {"success": False, "message": erro_entrada}

    erro_saida = _validar_saida(saida)
    if erro_saida:
        return {"success": False, "message": erro_saida}

    try:
        prn = PRNweb(entrada, saida, emit_log, log_module=LOG_MODULE)
        resultado = prn.executar()

        if resultado is False:
            return {
                "success": False,
                "message": "Nenhum arquivo foi processado ou ocorreu falha na conversão.",
            }

        return {
            "success": True,
            "message": "Processamento PRN concluído com sucesso.",
        }

    except Exception as exc:
        emit_log(
            module=LOG_MODULE,
            status="error",
            file=entrada,
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

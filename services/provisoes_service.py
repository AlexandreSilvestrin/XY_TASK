from pathlib import Path

from core.PROVISAO import ProvisoesWeb

from websocket.emitter import emit_log

LOG_MODULE = "provisoes"


def _validar_entrada(entrada: str) -> str | None:
    path = Path(entrada)

    if not path.exists() or not path.is_dir():
        return "O caminho de entrada deve ser uma pasta válida."

    tem_excel = any(
        item.suffix.lower() == ".xlsx" for item in path.iterdir() if item.is_file()
    )
    if not tem_excel:
        return "Nenhum arquivo .xlsx encontrado na pasta de entrada."

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


def executar_provisoes(payload):
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
        worker = ProvisoesWeb(entrada, saida, emit_log, log_module=LOG_MODULE)
        resultado = worker.executar()

        if not resultado:
            return {
                "success": False,
                "message": "Nenhuma provisão foi gerada. Verifique os logs.",
            }

        return {
            "success": True,
            "message": "Processamento de provisões concluído. Verifique os logs.",
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

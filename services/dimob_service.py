from core.DIMOB import DimobWeb

from websocket.emitter import emit_log


def executar_dimob(payload):
    entrada = str(payload.get("entrada", "")).strip()
    saida = str(payload.get("saida", "")).strip()

    if not entrada or not saida:
        return {
            "success": False,
            "message": "Os campos 'entrada' e 'saida' são obrigatórios.",
        }

    try:
        success, message, output_file = DimobWeb(entrada, saida, emit_log)

        if not success:
            return {
                "success": False,
                "message": message or "Falha na conversão DIMOB.",
            }

        return {
            "success": True,
            "message": message or "Conversão DIMOB concluída com sucesso.",
            "file": output_file,
        }

    except Exception as exc:
        emit_log(
            module="importacao-dimob",
            status="error",
            file=entrada,
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

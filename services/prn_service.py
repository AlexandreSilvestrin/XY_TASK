from core.PRN_T import PRNweb

from websocket.emitter import emit_log


def executar_prn(payload):
    entrada = payload.get("entrada")
    saida = payload.get("saida")

    if not entrada or not saida:
        return {
            "success": False,
            "message": "Os campos 'entrada' e 'saida' são obrigatórios.",
        }

    try:
        prn = PRNweb(entrada, saida, emit_log)
        resultado = prn.verificar()

        if resultado is False or resultado is None:
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
            module="prn",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

from core.RAZAO_DFC import RazaoDfcWeb
from core.RAZAO_resumo import RazaoWeb

from websocket.emitter import emit_log


def _normalizar_contras(raw) -> list:
    if not isinstance(raw, list):
        return []

    result = []
    for item in raw:
        if isinstance(item, bool):
            continue
        if isinstance(item, (int, float)):
            result.append(int(item) if float(item).is_integer() else float(item))
            continue
        if isinstance(item, str):
            text = item.strip().replace(",", ".")
            if not text:
                continue
            try:
                num = float(text)
                result.append(int(num) if num.is_integer() else num)
            except ValueError:
                continue
    return result


def executar_razao(payload):
    entrada = str(payload.get("entrada", "")).strip()
    saida = str(payload.get("saida", "")).strip()
    modo = str(payload.get("modo", "resumo")).strip().lower()

    if not entrada or not saida:
        return {
            "success": False,
            "message": "Os campos 'entrada' e 'saida' são obrigatórios.",
        }

    if modo not in ("resumo", "dfc"):
        return {
            "success": False,
            "message": "Modo inválido. Use 'resumo' ou 'dfc'.",
        }

    contras = _normalizar_contras(payload.get("contras"))

    if modo == "dfc" and not contras:
        return {
            "success": False,
            "message": "Informe pelo menos uma contrapartida numérica para o modo DFC.",
        }

    try:
        if modo == "dfc":
            worker = RazaoDfcWeb(entrada, saida, contras, emit_log)
        else:
            worker = RazaoWeb(entrada, saida, emit_log)

        resultado = worker.resumir()

        if resultado is False or resultado is None:
            return {
                "success": False,
                "message": "Nenhum arquivo foi processado ou ocorreu falha na transformação.",
            }

        label = "RESUMO" if modo == "resumo" else "DFC"
        return {
            "success": True,
            "message": f"Transformação RAZÃO ({label}) concluída com sucesso.",
        }

    except Exception as exc:
        emit_log(
            module="razao",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

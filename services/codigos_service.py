from models.codigos import CodigosModel

from websocket.emitter import emit_log

LOG_MODULE = "provisoes"


def _entry_from_payload(payload: dict) -> dict:
    return {
        "B": payload.get("B"),
        "B BAIXA": payload.get("B BAIXA"),
        "C": payload.get("C"),
        "C BAIXA": payload.get("C BAIXA"),
    }


def _serialize_entry(codigo: str, entry: dict) -> dict:
    return {
        "codigo": codigo,
        "B": entry["B"],
        "B BAIXA": entry["B BAIXA"],
        "C": entry["C"],
        "C BAIXA": entry["C BAIXA"],
    }


def buscar_codigos_consorcio(payload):
    codigo = str(payload.get("codigo", "")).strip()
    if not codigo:
        return {
            "success": False,
            "message": "Informe o código do consórcio para pesquisar.",
        }

    try:
        entry = CodigosModel.get(codigo)
        if not entry:
            return {
                "success": False,
                "message": "Consórcio não encontrado.",
            }

        return {
            "success": True,
            "data": _serialize_entry(codigo, entry),
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
            file=codigo,
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }


def salvar_codigos_consorcio(payload):
    codigo = str(payload.get("codigo", "")).strip()
    entry_payload = payload.get("entry")

    if not codigo:
        return {
            "success": False,
            "message": "Informe o código do consórcio para salvar.",
        }

    if not isinstance(entry_payload, dict):
        return {
            "success": False,
            "message": "Os códigos do consórcio são obrigatórios.",
        }

    try:
        existed = CodigosModel.get(codigo) is not None
        entry = CodigosModel.upsert(codigo, _entry_from_payload(entry_payload))
        message = (
            "Códigos do consórcio atualizados."
            if existed
            else "Códigos do consórcio adicionados."
        )
        emit_log(
            module=LOG_MODULE,
            status="success",
            file=codigo,
            message=message,
        )
        return {
            "success": True,
            "message": message,
            "data": _serialize_entry(codigo, entry),
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
            file=codigo,
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

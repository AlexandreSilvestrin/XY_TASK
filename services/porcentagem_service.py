from models.banco_fat import FATModel

from websocket.emitter import emit_log


def _normalizar_porcentagens(valor):
    if isinstance(valor, dict):
        resultado = {}
        for nome, percentual in valor.items():
            chave = str(nome).strip()
            if not chave:
                continue
            try:
                resultado[chave] = float(percentual)
            except (TypeError, ValueError):
                resultado[chave] = 0.0
        return resultado

    resultado = {}
    for item in valor or []:
        if not isinstance(item, dict):
            continue
        nome = str(item.get("nome", "")).strip()
        if not nome:
            continue
        try:
            resultado[nome] = float(item.get("percentual", 0))
        except (TypeError, ValueError):
            resultado[nome] = 0.0
    return resultado


def _registro_para_resposta(linha):
    porcentagem = linha.get("porcentagens", {})
    if not isinstance(porcentagem, dict):
        porcentagem = {}

    retencoes = linha.get("retencoes", [])
    if not isinstance(retencoes, list):
        retencoes = []

    return {
        "contrato": linha["contrato"],
        "razao_social": linha["razao_social"],
        "cnpj": linha["cnpj"],
        "porcentagens": [
            {"nome": nome, "percentual": percentual}
            for nome, percentual in porcentagem.items()
        ],
        "retencoes": [str(item).strip() for item in retencoes if str(item).strip()],
    }


def pesquisar_guia_porcentagem(payload):
    cnpj = str(payload.get("cnpj", "")).strip()
    if not cnpj:
        return {"success": False, "message": "Informe o CNPJ para pesquisar."}

    try:
        linha = FATModel.get_guia_por_cnpj(cnpj)
        if not linha:
            return {"success": False, "message": "CNPJ não encontrado no banco."}

        return {
            "success": True,
            "data": _registro_para_resposta(linha),
        }
    except Exception as exc:
        emit_log(module="notas", status="error", file="", message=str(exc))
        return {"success": False, "message": str(exc)}


def salvar_guia_porcentagem(payload):
    contrato = str(payload.get("contrato", "")).strip()
    razao_social = str(payload.get("razao_social", "")).strip()
    cnpj = str(payload.get("cnpj", "")).strip()

    if not cnpj:
        return {"success": False, "message": "CNPJ é obrigatório para salvar."}

    porcentagens = _normalizar_porcentagens(payload.get("porcentagens"))
    retencoes = [
        str(item).strip().upper()
        for item in (payload.get("retencoes") or [])
        if str(item).strip()
    ]

    try:
        FATModel.salvar_guia(
            contrato,
            razao_social,
            cnpj,
            porcentagens,
            retencoes,
        )
        emit_log(
            module="notas",
            status="success",
            file=cnpj,
            message="Guia de porcentagens salva com sucesso.",
        )
        return {"success": True, "message": "Registro salvo com sucesso."}
    except Exception as exc:
        emit_log(module="notas", status="error", file=cnpj, message=str(exc))
        return {"success": False, "message": str(exc)}

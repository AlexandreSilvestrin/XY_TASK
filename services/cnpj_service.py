import threading

import pandas as pd

from core.CNPJ_API import executar_pesquisa_cnpj
from core.NOTAS import Notasweb
from models.banco_cnpj import CNPJModel
from websocket.emitter import emit_cnpj_progress, emit_log

stop_event = threading.Event()
_search_thread = None
_thread_lock = threading.Lock()


def _aguardar_thread_finalizar(timeout=5):
    global _search_thread

    thread = _search_thread
    if thread is not None and thread.is_alive():
        thread.join(timeout=timeout)
    _search_thread = None


def encerrar_pesquisa_cnpj(timeout=5):
    """Sinaliza parada e aguarda a thread de pesquisa finalizar."""
    stop_event.set()
    with _thread_lock:
        _aguardar_thread_finalizar(timeout)


def _run_pesquisa(data):
    try:
        executar_pesquisa_cnpj(data, stop_event, emit_cnpj_progress)
    except Exception as exc:
        if not stop_event.is_set():
            emit_log(
                module="cnpj",
                status="error",
                file="",
                message=str(exc),
            )


def listar_cnpjs_sem_nome(payload):
    entrada = payload.get("entrada")
    saida = payload.get("saida")
    mes = payload.get("mes")
    ano = payload.get("ano")

    if not entrada or not saida:
        return {
            "success": False,
            "message": "Os campos 'entrada' e 'saida' são obrigatórios.",
        }

    if mes is None or ano is None:
        return {
            "success": False,
            "message": "Os campos 'mes' e 'ano' são obrigatórios.",
        }

    mes_str = str(mes).zfill(2)
    ano_str = str(ano)

    try:
        notas = Notasweb(entrada, saida, mes_str, ano_str, emit_log)
        df = notas.pegarCNPJS()

        if df.empty:
            return {"success": True, "data": []}

        df = df.rename(columns={"CNPJ": "cnpj", "Nome": "nome"})
        df["cnpj"] = df["cnpj"].apply(lambda x: str(x).zfill(14))
        df["nome"] = df["nome"].fillna("").astype(str)

        return {
            "success": True,
            "data": df.to_dict(orient="records"),
        }

    except Exception as exc:
        emit_log(
            module="cnpj",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }


def iniciar_pesquisa(payload):
    global _search_thread

    data = payload.get("data")
    if not isinstance(data, list):
        return {
            "success": False,
            "message": "O campo 'data' deve ser uma lista.",
        }

    with _thread_lock:
        if _search_thread is not None and _search_thread.is_alive():
            stop_event.set()
            _aguardar_thread_finalizar(timeout=5)

        stop_event.clear()
        _search_thread = threading.Thread(
            target=_run_pesquisa,
            args=(data,),
            daemon=True,
        )
        _search_thread.start()

    return {"success": True}


def parar_pesquisa():
    encerrar_pesquisa_cnpj()
    return {"success": True}


def salvar_cnpjs(payload):
    data = payload.get("data")
    if not isinstance(data, list):
        return {
            "success": False,
            "message": "O campo 'data' deve ser uma lista.",
        }

    rows = []
    for item in data:
        if not isinstance(item, dict):
            continue
        cnpj = str(item.get("cnpj", "")).strip()
        nome = str(item.get("nome", "")).strip()
        if (
            cnpj
            and nome
            and nome.upper() != CNPJModel.NOME_NAO_ENCONTRADO
        ):
            rows.append({"CNPJ": cnpj.zfill(14), "Nome": nome})

    try:
        if rows:
            df = pd.DataFrame(rows)
            CNPJModel.add_new_data(df)
            emit_log(
                module="cnpj",
                status="success",
                file="",
                message=f"{len(rows)} CNPJ(s) salvos no banco",
            )

        return {"success": True}

    except Exception as exc:
        emit_log(
            module="cnpj",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

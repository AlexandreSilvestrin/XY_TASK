import time

import requests

from websocket.emitter import emit_log

REQUEST_TIMEOUT = 10
RETRY_WAIT_SECONDS = 30


def _aguardar_interrompivel(segundos: int, stop_event) -> bool:
    """Aguarda em intervalos de 1s. Retorna True se stop_event foi acionado."""
    for _ in range(segundos):
        if stop_event is not None and stop_event.is_set():
            return True
        time.sleep(1)
    return stop_event is not None and stop_event.is_set()


def consultar_cnpj_api(cnpj: str, stop_event=None) -> str:
    max_tentativas = 3
    tentativas = 0

    while tentativas < max_tentativas:
        if stop_event is not None and stop_event.is_set():
            return "NAO ENCONTRADO"

        teste = requests.get(
            f"https://receitaws.com.br/v1/cnpj/{cnpj}",
            timeout=REQUEST_TIMEOUT,
        )
        if stop_event is not None and stop_event.is_set():
            return "NAO ENCONTRADO"

        if teste.status_code == 200:
            try:
                dados_json = teste.json()
                return dados_json["nome"]
            except (KeyError, TypeError, ValueError):
                return "NAO ENCONTRADO"

        teste2 = requests.get(
            f"https://brasilapi.com.br/api/cnpj/v1/{cnpj}",
            timeout=REQUEST_TIMEOUT,
        )
        if stop_event is not None and stop_event.is_set():
            return "NAO ENCONTRADO"

        if teste2.status_code == 200:
            try:
                dados_json = teste2.json()
                return dados_json["razao_social"]
            except (KeyError, TypeError, ValueError):
                return "NAO ENCONTRADO"

        emit_log(
            module="cnpj",
            status="info",
            file=cnpj,
            message="Tentando novamente em 30 segundos",
        )
        if _aguardar_interrompivel(RETRY_WAIT_SECONDS, stop_event):
            return "NAO ENCONTRADO"
        tentativas += 1

    emit_log(
        module="cnpj",
        status="error",
        file=cnpj,
        message="Execução parada ou encerrada após tentativas",
    )
    return "NAO ENCONTRADO"


def executar_pesquisa_cnpj(data, stop_event, emit_progress):
    total = len(data)

    for i, item in enumerate(data):
        if stop_event.is_set():
            emit_log(
                module="cnpj",
                status="info",
                file="",
                message="Pesquisa interrompida pelo usuário",
            )
            return

        cnpj = str(item.get("cnpj", "")).strip()

        if not cnpj:
            emit_progress(i, cnpj, "")
            continue

        if stop_event.is_set():
            return

        nome = consultar_cnpj_api(cnpj, stop_event)
        emit_progress(i, cnpj, nome)

        if nome != "NAO ENCONTRADO":
            emit_log(
                module="cnpj",
                status="sucesso",
                file=cnpj,
                message="CNPJ pesquisado",
            )

        if stop_event.is_set():
            emit_log(
                module="cnpj",
                status="info",
                file="",
                message="Pesquisa interrompida pelo usuário",
            )
            return

    if not stop_event.is_set():
        emit_log(
            module="cnpj",
            status="success",
            file="",
            message="Pesquisa de CNPJs concluída",
        )

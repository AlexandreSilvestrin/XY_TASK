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

        response_opencnpj = requests.get(
            f"https://api.opencnpj.org/{cnpj}?dataset=receita",
            timeout=REQUEST_TIMEOUT,
        )
        if stop_event is not None and stop_event.is_set():
            return "NAO ENCONTRADO"

        if response_opencnpj.status_code == 200:
            try:
                dados_json = response_opencnpj.json()
                return dados_json["razao_social"]
            except (KeyError, TypeError, ValueError):
                return "NAO ENCONTRADO"

        if response_opencnpj.status_code == 404:
                return "NAO ENCONTRADO"

        #Faz a consulta no Brasil API
        response_aws = requests.get(
            f"https://api.opencnpj.org/{cnpj}?dataset=receita",
        )

        if response_aws.status_code == 200:
            try:
                dados_json = response_aws.json()
                return dados_json["razao_social"]
            except (KeyError, TypeError, ValueError):
                return "NAO ENCONTRADO"

        if response_aws.status_code == 404:
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

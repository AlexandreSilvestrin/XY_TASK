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

    for tentativa in range(max_tentativas):

        if stop_event is not None and stop_event.is_set():
            return "NAO ENCONTRADO"

        # OpenCNPJ
        try:
            response = requests.get(
                f"https://api.opencnpj.org/{cnpj}?dataset=receita",
                timeout=REQUEST_TIMEOUT,
            )

            if response.status_code == 200:
                dados = response.json()
                return dados.get("razao_social", "NAO ENCONTRADO")

        except requests.RequestException as e:
            emit_log(
                module="cnpj",
                status="warning",
                file=cnpj,
                message=f"Erro OpenCNPJ: {e}"
            )

        if stop_event is not None and stop_event.is_set():
            return "NAO ENCONTRADO"

        # ReceitaWS
        try:
            response = requests.get(
                f"https://receitaws.com.br/v1/cnpj/{cnpj}",
                timeout=REQUEST_TIMEOUT,
            )

            if response.status_code == 200:
                dados = response.json()
                return dados.get("nome", "NAO ENCONTRADO")

        except requests.RequestException as e:
            emit_log(
                module="cnpj",
                status="warning",
                file=cnpj,
                message=f"Erro ReceitaWS: {e}"
            )

        emit_log(
            module="cnpj",
            status="info",
            file=cnpj,
            message=f"Tentativa {tentativa + 1}/{max_tentativas} falhou"
        )

        if tentativa < max_tentativas - 1:
            if _aguardar_interrompivel(RETRY_WAIT_SECONDS, stop_event):
                return "NAO ENCONTRADO"

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

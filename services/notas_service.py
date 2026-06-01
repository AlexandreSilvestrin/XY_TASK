from pathlib import Path
from tkinter import Tk, filedialog

from core.FATURAMENTO import Faturamentoweb
from core.NOTAS import Notasweb
from models.banco_cnpj import CNPJModel

from websocket.emitter import emit_log


def _ask_folder():
    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.askdirectory()
    root.destroy()
    return path or None


def _ask_xlsx_file():
    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.askopenfilename(
        filetypes=[("Excel", "*.xlsx"), ("Todos os arquivos", "*.*")],
    )
    root.destroy()
    return path or None


def executar_notas(payload):
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
        notas.gerarNotas()

        return {
            "success": True,
            "message": "Processamento de notas concluído com sucesso.",
        }

    except Exception as exc:
        emit_log(
            module="notas",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }


def executar_faturamento(payload):
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
        faturamento = Faturamentoweb(entrada, saida, mes_str, ano_str, emit_log)
        faturamento.gerarFat()

        return {
            "success": True,
            "message": "Faturamento gerado com sucesso.",
        }

    except Exception as exc:
        emit_log(
            module="faturamento",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }


def exportar_banco_cnpj():
    pasta = _ask_folder()
    if not pasta:
        return {
            "success": False,
            "message": "Nenhuma pasta selecionada.",
        }

    try:
        destino = CNPJModel.exportar_db(pasta)
        emit_log(
            module="notas",
            status="success",
            file=destino.name,
            message=f"Banco exportado para {destino}",
        )
        return {
            "success": True,
            "message": "Banco CNPJ exportado com sucesso.",
            "path": str(destino),
        }

    except Exception as exc:
        emit_log(
            module="notas",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }


def importar_banco_cnpj():
    arquivo = _ask_xlsx_file()
    if not arquivo:
        return {
            "success": False,
            "message": "Nenhum arquivo selecionado.",
        }

    try:
        total = CNPJModel.importar_db(arquivo)
        emit_log(
            module="notas",
            status="success",
            file=Path(arquivo).name,
            message=f"{total} registro(s) importados do Excel",
        )
        return {
            "success": True,
            "message": "Banco CNPJ importado com sucesso.",
            "path": arquivo,
        }

    except Exception as exc:
        emit_log(
            module="notas",
            status="error",
            file="",
            message=str(exc),
        )
        return {
            "success": False,
            "message": str(exc),
        }

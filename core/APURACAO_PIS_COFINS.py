import os
import re
import unicodedata

import numpy as np
import pandas as pd
from collections import defaultdict
from openpyxl import load_workbook

from models.dados_apuracao import DadosApuracaoModel

LOG_MODULE = "apuracao-pis-cofins"


def extrarir_cnpj(texto):
    match = re.search(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}", texto)
    if not match:
        raise ValueError("CNPJ não encontrado no arquivo.")
    return re.sub(r"\D", "", match.group())


def extrair_nome(df):
    nome = df.iloc[0, 0]
    nome = "".join(
        char
        for char in unicodedata.normalize("NFD", nome)
        if unicodedata.category(char) != "Mn"
    )
    nome = nome.upper()
    nome = nome.replace("-", " ")
    nome = nome.replace(".", " ")
    nome = nome.replace("/", " ")
    nome = re.sub(r"\s+", " ", nome)
    nome = nome.replace("CONSORCIO", "")
    return nome.strip()


def listar_pasta(pasta):
    return [
        nome
        for nome in os.listdir(pasta)
        if os.path.isfile(os.path.join(pasta, nome))
        and nome.lower().endswith((".xlsx", ".xls"))
    ]


def ver_linha_coluna(tabela):
    wb = load_workbook(tabela, data_only=True)
    ws = wb.active

    texto_busca = "APROPRIAÇÃO DOS CRÉDITOS POR CONSORCIADAS"

    for row in ws.iter_rows():
        for cell in row:
            if cell.value == texto_busca:
                return cell.row - 1, cell.column - 1

    raise ValueError(
        f"Texto '{texto_busca}' não encontrado em {os.path.basename(tabela)}."
    )


def processar_df(df, linha, coluna):
    bloco = df.iloc[linha:, coluna:].copy().reset_index(drop=True)
    df = bloco.drop(0)
    df = df.loc[:, df.iloc[0] != "BASE CALCULO"]
    contador = defaultdict(int)
    novas_colunas = []

    for nome in df.iloc[0]:
        contador[nome] += 1
        novas_colunas.append(f"{nome}_{contador[nome]}")

    df.columns = novas_colunas
    df = df.iloc[1:].reset_index(drop=True)
    df = df.replace(r"^\s*$", np.nan, regex=True)
    df = df.dropna(axis=1, how="all")
    df = df.dropna(axis=0, how="all")

    return df.iloc[-1].to_dict()


def gerar_df(nome, lista, data):
    linhas = []
    tipos_ordem = ["PIS", "COFINS"]
    nome_arquivo = f"CONSORCIO {nome} -- CREDITO PIS E COFINS"

    for tipo in tipos_ordem:
        for empresa in lista:
            codigos = empresa["codigos"]
            valor = empresa[f"{tipo}_valor"]
            valor_e = str(int(round(float(valor) * 100)))
            linhas.append(
                {
                    "A": "",
                    "B": codigos[f"{tipo}_B"],
                    "C": codigos[f"{tipo}_C"],
                    "D": 1,
                    "E": valor_e,
                    "F": data,
                    "G": "",
                    "H": (
                        f"CREDITO DO {tipo} REF. NOTAS DE FORNECEDORES DO "
                        f'CONSORCIO NO PERIODO - {empresa["empresa"]}'
                    ),
                }
            )

        linhas.append(
            {
                "A": "",
                "B": "",
                "C": "",
                "D": "",
                "E": "",
                "F": "",
                "G": "",
                "H": "",
            }
        )

    return pd.DataFrame(linhas), nome_arquivo


def organizar_dados(arquivos, pasta):
    lista_dict = []

    for arq in arquivos:
        caminho = os.path.join(pasta, arq)
        linha, coluna = ver_linha_coluna(caminho)
        df = pd.read_excel(caminho)
        nome = extrair_nome(df)
        dict_pis_cofins = processar_df(df, linha, coluna)
        lista_dict.append((nome, dict_pis_cofins))

    return lista_dict


def _resolver_consorcio(codigos, consorcio):
    if consorcio in codigos:
        return consorcio

    target = DadosApuracaoModel.normalize_key(consorcio)
    for key in codigos:
        if DadosApuracaoModel.normalize_key(key) == target:
            return key
    return None


def organizar_arquivo_final(lista_dict, codigos):
    listafinal = []

    for consorcio, pis_cofins in lista_dict:
        consorcio_key = _resolver_consorcio(codigos, consorcio)
        if not consorcio_key:
            raise ValueError(
                f"Códigos não encontrados para o consórcio '{consorcio}'."
            )

        codigos_consorcio = codigos[consorcio_key]
        lista_consorcio = []

        for index, empresa in enumerate(codigos_consorcio, start=1):
            lista_consorcio.append(
                {
                    "empresa": empresa,
                    "codigos": codigos_consorcio[empresa],
                    "PIS_valor": pis_cofins[f"PIS_{index}"],
                    "COFINS_valor": pis_cofins[f"COFINS_{index}"],
                }
            )

        listafinal.append((consorcio, lista_consorcio))

    return listafinal


class ApuracaoPisCofinsWeb:
    def __init__(
        self,
        entrada,
        saida,
        empresa,
        data,
        emit_log,
        log_module=LOG_MODULE,
    ):
        self.entrada = entrada
        self.saida = saida
        self.empresa = empresa
        self.data = data
        self.emit_log = emit_log
        self.log_module = log_module

    def executar(self):
        arquivos = listar_pasta(self.entrada)
        if not arquivos:
            self.emit_log(
                module=self.log_module,
                status="error",
                file=self.entrada,
                message="Nenhum arquivo Excel encontrado na pasta de entrada.",
            )
            return False

        os.makedirs(self.saida, exist_ok=True)

        try:
            codigos = DadosApuracaoModel.get_for_processing(self.empresa)
            if not codigos:
                raise ValueError(
                    f"Nenhum código cadastrado para a empresa '{self.empresa}'."
                )

            lista_dict = organizar_dados(arquivos, self.entrada)
            listafinal = organizar_arquivo_final(lista_dict, codigos)
            gerados = 0

            for consorcio, lista in listafinal:
                df, nome = gerar_df(consorcio, lista, self.data)
                caminho = os.path.join(self.saida, f"{nome}.xlsx")
                df.to_excel(caminho, index=False, header=None)
                gerados += 1
                self.emit_log(
                    module=self.log_module,
                    status="success",
                    file=os.path.basename(caminho),
                    message=f"Apuração gerada para {consorcio}.",
                )

            self.emit_log(
                module=self.log_module,
                status="success",
                file=self.entrada,
                message=(
                    f"Apuração PIS/COFINS concluída ({gerados} arquivo(s)) "
                    f"para {self.empresa}."
                ),
            )
            return gerados > 0

        except Exception as exc:
            self.emit_log(
                module=self.log_module,
                status="error",
                file=self.entrada,
                message=str(exc),
            )
            raise

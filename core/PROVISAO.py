import calendar
import json
import os
from datetime import datetime
from decimal import Decimal, ROUND_CEILING
from pathlib import Path

import pandas as pd

from config.caminhos import get_data_dir

LOG_MODULE = "provisoes"


def _get_codigos_path() -> Path:
    return get_data_dir() / "codigos.json"


def ultimo_dia_mes(mes):
    ano = datetime.now().year
    ultimo_dia = calendar.monthrange(ano, mes)[1]
    return ultimo_dia, ano


def filtrar_arquivos(arquivos):
    lista_nomes_mes = []

    for arquivo in arquivos:
        if "13º" not in arquivo or not arquivo.lower().endswith(".xlsx"):
            continue

        nome = arquivo.split("13º")[1].replace(" - ", " ").split(".")[0].strip()
        codigo, data = nome[:-7].strip(), nome[-7:].strip()
        mes, ano = data.split(" ")
        lista_nomes_mes.append((codigo, int(mes), arquivo))

    if not lista_nomes_mes:
        return []

    meses = sorted({mes for _, mes, _ in lista_nomes_mes})
    mes_menor = meses[0]
    mes_maior = meses[-1]

    arquivos_mes_menor = []
    arquivos_mes_maior = []

    for codigo, mes, arquivo in lista_nomes_mes:
        if mes == mes_menor:
            arquivos_mes_menor.append((codigo, arquivo))
        elif mes == mes_maior:
            arquivos_mes_maior.append((codigo, arquivo))

    menor = dict(arquivos_mes_menor)
    maior = dict(arquivos_mes_maior)

    lista_final = []
    for codigo in menor:
        if codigo in maior:
            arq_antigo = menor[codigo]
            arq_novo = maior[codigo]
            lista_final.append((codigo, arq_antigo, arq_novo, mes_maior))

    return lista_final


def extrair_valores(df, df2):
    for i, linha in df.iterrows():
        if linha.astype(str).str.contains("VALPROVFER").any() and linha.astype(str).str.contains("NOME").any():
            df.columns = linha
            df = df.iloc[i + 1 :].reset_index(drop=True)
            break

    for i, linha in df2.iterrows():
        if linha.astype(str).str.contains("VALPROVFER").any() and linha.astype(str).str.contains("NOME").any():
            df2.columns = linha
            df2 = df2.iloc[i + 1 :].reset_index(drop=True)
            break

    mes_anterior = df.iloc[-1].to_dict()
    mes_seguinte = df2.iloc[-1].to_dict()
    return mes_anterior, mes_seguinte


def converter_para_decimal(mes_anterior, mes_seguinte):
    comparacao = {}

    campos = [
        "VALPROVFER",
        "INSS_FERIAS",
        "FGTS_FERIAS",
        "VALPROV13",
        "INSS_13",
        "FGTS_13",
    ]
    for campo in campos:
        diferenca = Decimal(str(mes_seguinte[campo])) - Decimal(str(mes_anterior[campo]))
        comparacao[campo] = str(diferenca.quantize(Decimal("0.01"), rounding=ROUND_CEILING))
    return comparacao


def criar_df_final(comparacao, data, mes, ano, codigo, dicionario_codigos):
    dict_codigo = dicionario_codigos.get(codigo, {})

    codigoB = list(zip(dict_codigo.get("B", ""), dict_codigo.get("B BAIXA", "")))
    codigoC = list(zip(dict_codigo.get("C", ""), dict_codigo.get("C BAIXA", "")))

    mes = str(mes).zfill(2)
    linha_provisao = [codigoB[0], codigoC[0], data, comparacao["VALPROVFER"], f"PROVISAO DE FERIAS REF. {mes}/{ano}"]
    linha_fgts = [codigoB[1], codigoC[1], data, comparacao["FGTS_FERIAS"], f"FGTS S/ PROVISAO DE FERIAS REF. {mes}/{ano}"]
    linha_INSS = [codigoB[2], codigoC[2], data, comparacao["INSS_FERIAS"], f"INSS S/ PROVISAO DE FERIAS REF. {mes}/{ano}"]
    linha_prov13 = [codigoB[3], codigoC[3], data, comparacao["VALPROV13"], f"PROVISAO DE 13 SALARIO REF. {mes}/{ano}"]
    linha_fgts13 = [codigoB[4], codigoC[4], data, comparacao["FGTS_13"], f"FGTS S/ PROVISAO DE 13 SALARIO REF. {mes}/{ano}"]
    linha_INSS13 = [codigoB[5], codigoC[5], data, comparacao["INSS_13"], f"INSS S/ PROVISAO DE 13 SALARIO REF. {mes}/{ano}"]

    df = pd.DataFrame()

    for linha in [linha_provisao, linha_fgts, linha_INSS, linha_prov13, linha_fgts13, linha_INSS13]:
        codigoB_item, codigoC_item, data_linha, valor, descricao = linha
        if "-" not in valor:
            valorr = valor.replace("-", "").strip().replace(".", "").strip()
            df = pd.concat(
                [
                    df,
                    pd.DataFrame(
                        {
                            "A": [""],
                            "B": [codigoB_item[0]],
                            "C": [codigoC_item[0]],
                            "D": [1],
                            "E": [valorr],
                            "F": [data_linha],
                            "G": [""],
                            "H": [descricao],
                        }
                    ),
                ],
                ignore_index=True,
            )
        else:
            df = pd.concat(
                [
                    df,
                    pd.DataFrame(
                        {
                            "A": [""],
                            "B": [codigoB_item[0]],
                            "C": [codigoC_item[0]],
                            "D": [1],
                            "E": [""],
                            "F": [data_linha],
                            "G": [""],
                            "H": [descricao],
                        }
                    ),
                ],
                ignore_index=True,
            )

    df = pd.concat(
        [
            df,
            pd.DataFrame(
                {
                    "A": [""],
                    "B": [""],
                    "C": [""],
                    "D": [""],
                    "E": [""],
                    "F": [""],
                    "G": [""],
                    "H": [""],
                }
            ),
        ],
        ignore_index=True,
    )

    for linha in [linha_provisao, linha_fgts, linha_INSS, linha_prov13, linha_fgts13, linha_INSS13]:
        codigoB_item, codigoC_item, data_linha, valor, descricao = linha
        if "-" in valor:
            valorr = valor.replace("-", "").strip().replace(".", "").strip()
            df = pd.concat(
                [
                    df,
                    pd.DataFrame(
                        {
                            "A": [""],
                            "B": [codigoB_item[1]],
                            "C": [codigoC_item[1]],
                            "D": [""],
                            "E": [valorr],
                            "F": [data_linha],
                            "G": [""],
                            "H": [f"BAIXA {descricao}"],
                        }
                    ),
                ],
                ignore_index=True,
            )
        else:
            df = pd.concat(
                [
                    df,
                    pd.DataFrame(
                        {
                            "A": [""],
                            "B": [codigoB_item[1]],
                            "C": [codigoC_item[1]],
                            "D": [""],
                            "E": [""],
                            "F": [data_linha],
                            "G": [""],
                            "H": [f"BAIXA {descricao}"],
                        }
                    ),
                ],
                ignore_index=True,
            )

    return df


def _gerar_provisao_par(
    local_arquivos,
    local_salvar,
    codigo,
    arquivo1,
    arquivo2,
    mes_maior,
    dicionario_codigos,
):
    caminho1 = os.path.join(local_arquivos, arquivo1)
    caminho2 = os.path.join(local_arquivos, arquivo2)

    df = pd.read_excel(caminho1, header=None)
    df2 = pd.read_excel(caminho2, header=None)

    mes_anterior, mes_seguinte = extrair_valores(df, df2)
    comparacao = converter_para_decimal(mes_anterior, mes_seguinte)

    mes = mes_maior
    ultimo_dia, ano = ultimo_dia_mes(mes)
    data = f"{ultimo_dia:02d}/{mes:02d}/{ano}"

    df_final = criar_df_final(comparacao, data, mes, ano, codigo, dicionario_codigos)

    nome_saida = (
        f"PROVISAO DE FERIAS E 13º SALARIO - {codigo} - SAIDA - {mes}_{ano}.xlsx"
    )
    destino = os.path.join(local_salvar, nome_saida)
    df_final.to_excel(destino, index=False, header=False)
    return destino


def criar_provisao(local_arquivos, local_salvar, dicionario_codigos):
    arquivos = os.listdir(local_arquivos)
    lista_arquivos_filtrados = filtrar_arquivos(arquivos)
    gerados = []

    for codigo, arquivo1, arquivo2, mes_maior in lista_arquivos_filtrados:
        destino = _gerar_provisao_par(
            local_arquivos,
            local_salvar,
            codigo,
            arquivo1,
            arquivo2,
            mes_maior,
            dicionario_codigos,
        )
        gerados.append(destino)

    return gerados


class ProvisoesWeb:
    def __init__(self, entrada, saida, emit_log, log_module=LOG_MODULE):
        self.entrada = entrada
        self.saida = saida
        self.emit_log = emit_log
        self.log_module = log_module

    def executar(self):
        codigos_path = _get_codigos_path()
        if not codigos_path.exists():
            self.emit_log(
                module=self.log_module,
                status="error",
                file=str(codigos_path),
                message="Arquivo codigos.json não encontrado em data/codigos.json.",
            )
            return False

        with codigos_path.open("r", encoding="utf-8") as file:
            dicionario_codigos = json.load(file)

        os.makedirs(self.saida, exist_ok=True)

        arquivos = [
            nome
            for nome in os.listdir(self.entrada)
            if nome.lower().endswith(".xlsx")
        ]
        if not arquivos:
            self.emit_log(
                module=self.log_module,
                status="error",
                file=self.entrada,
                message="Nenhum arquivo .xlsx encontrado na pasta de entrada.",
            )
            return False

        lista_arquivos_filtrados = filtrar_arquivos(arquivos)
        if not lista_arquivos_filtrados:
            self.emit_log(
                module=self.log_module,
                status="error",
                file=self.entrada,
                message=(
                    "Nenhum par de arquivos válido encontrado. "
                    "Verifique o padrão de nome e se há arquivos dos dois meses."
                ),
            )
            return False

        processados = 0

        try:
            for codigo, arquivo1, arquivo2, mes_maior in lista_arquivos_filtrados:
                destino = _gerar_provisao_par(
                    self.entrada,
                    self.saida,
                    codigo,
                    arquivo1,
                    arquivo2,
                    mes_maior,
                    dicionario_codigos,
                )
                processados += 1
                self.emit_log(
                    module=self.log_module,
                    status="success",
                    file=codigo,
                    message=(
                        f"Arquivo gerado: {os.path.basename(destino)} "
                        f"({arquivo1} + {arquivo2})"
                    ),
                )

            self.emit_log(
                module=self.log_module,
                status="success",
                file=self.entrada,
                message=f"Provisões transformadas com sucesso ({processados} arquivo(s)).",
            )
            return True
        except Exception as exc:
            self.emit_log(
                module=self.log_module,
                status="error",
                file=self.entrada,
                message=str(exc),
            )
            raise


if __name__ == "__main__":
    caminho = r"C:\Users\Alexandre\Downloads\Nova pasta"
    salvar = r"C:\Users\Alexandre\Desktop\Saida\prnn"
    with _get_codigos_path().open("r", encoding="utf-8") as file:
        codigos = json.load(file)
    criar_provisao(caminho, salvar, codigos)

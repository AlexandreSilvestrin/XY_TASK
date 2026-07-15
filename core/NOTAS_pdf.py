import tabula
import pandas as pd
import traceback
import PyPDF2
import pdfplumber
import re

def verifica_tipo_pdf(caminho):
    with open(caminho, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page_num in range(len(reader.pages)):
            text += reader.pages[page_num].extract_text()
    if 'S E M     M O V I M E N T O' in text:
        return 'Tipo 3'
    elif 'Notas Fiscais de Serviços' in text:
        return 'Tipo 2'
    elif 'Notas de Entradas de Serviços' in text:
        return 'Tipo 1'
    else:
        return 'Tipo não identificado'

def extrair_notas(caminho_pdf: str) -> pd.DataFrame:
    # Padrão de uma linha de dado (nota fiscal). Os grupos nomeados viram as colunas.
    # Alguns campos ficam colados no PDF (ex: valor+data, valor+código) - o regex
    # já lida com isso porque cada campo tem um formato fixo (X,XX ou dd/mm/yyyy).
    PATTERN = re.compile(
        r'^(?P<data>\d{2}/\d{2}/\d{4})\s+'
        r'(?P<serie>[A-Z])\s+'
        r'(?P<numero>\d+)\s+'
        r'(?P<cnpj>\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})\s+'
        r'(?P<vlr_total>[\d.]+,\d{2})\s*'
        r'(?P<data_pagamento>\d{2}/\d{2}/\d{4})\s+'
        r'(?P<base_calculo>[\d.]+,\d{2})\s+'
        r'(?P<pis>[\d.]+,\d{2})\s*(?P<cod_pis>\d{4})\s+'
        r'(?P<cofins>[\d.]+,\d{2})\s*(?P<cod_cofins>\d{4})\s+'
        r'(?P<csll>[\d.]+,\d{2})\s*(?P<cod_csll>\d{4})\s+'
        r'(?P<data_cred>\d{2}/\d{2}/\d{4})\s+'
        r'(?P<irrf>[\d.]+,\d{2})\s*(?P<cod_irrf>\d{4})?\s+'
        r'(?P<seg_social>[\d.]+,\d{2})$'
    )
    """Extrai apenas as linhas de nota fiscal (ignora cabeçalho, 'Total' e rodapé)."""
    rows = []
    linhas_ignoradas = []

    with pdfplumber.open(caminho_pdf) as pdf:
        for page in pdf.pages:
            texto = page.extract_text()
            if not texto:
                continue
            for linha in texto.split("\n"):
                linha = linha.strip()
                if not linha:
                    continue
                m = PATTERN.match(linha)
                if m:
                    rows.append(m.groupdict())
                else:
                    # Aqui caem: cabeçalhos, linhas "Total ..." e rodapé.
                    # Guardamos só pra permitir conferência se quiser.
                    linhas_ignoradas.append(linha)

    df = pd.DataFrame(rows)

    # Conversões numéricas (formato brasileiro -> float)
    colunas_valor = [
        "vlr_total", "base_calculo", "pis", "cofins",
        "csll", "irrf", "seg_social"
    ]
    for col in colunas_valor:
        df[col] = (
            df[col]
            .str.replace(".", "", regex=False)
            .str.replace(",", ".", regex=False)
            .astype(float)
        )

    # Datas
    for col in ["data", "data_pagamento", "data_cred"]:
        df[col] = pd.to_datetime(df[col], format="%d/%m/%Y")

    # Identifica se o documento é CNPJ (14 dígitos) ou CPF (11 dígitos)
    digitos = df["cnpj"].str.replace(r"\D", "", regex=True)
    df["tipo_documento"] = digitos.apply(lambda d: "CNPJ" if len(d) == 14 else "CPF")

    return df

def gerarpdf(caminho):
    try:
        tipo = verifica_tipo_pdf(caminho)
        print(tipo)
        if 'Tipo 3' == tipo:
            dfFINAL = pd.DataFrame(columns=['Data',	'Número', 'CNPJ', 'Tipo', 'Valor'])
            return {"df": dfFINAL}
        elif tipo == 'Tipo 1':
            df = extrair_notas(caminho)
            df = df[['data', 'numero', 'cnpj', 'pis',  'cofins', 'csll', 'irrf', 'seg_social']]
            df.columns = ('Data', 'Número', 'CNPJ/CPF', 'PIS Retido', 'COFINS Retida', 'CSLL retida', 'IRRF', 'ValorSS')
            tabelaF = df.copy()
            tabelaF.rename(columns={'CNPJ/CPF': "CNPJ"}, inplace=True)
            tabelaF[['PIS Retido', 'COFINS Retida', 'CSLL retida']] =tabelaF[['PIS Retido', 'COFINS Retida', 'CSLL retida']].apply(lambda x: pd.to_numeric(x))
            tabelaF['Valor'] = tabelaF[['PIS Retido', 'COFINS Retida', 'CSLL retida']].sum(axis=1)
            tabelaF['IRRF'] = tabelaF['IRRF'].astype(float)
            tabelaF['ValorSS'] = tabelaF['ValorSS'].astype(float)
            tabelaF['Data'] = pd.to_datetime(tabelaF['Data'], format='%d/%m/%Y')
            tabelaF['Data'] = tabelaF['Data'].dt.day.astype(str)
            dadosIRRF = tabelaF[tabelaF['IRRF']>0].copy()
            dadosIRRF['Tipo'] = 'IRRF'
            dadosIRRF = dadosIRRF[['Data', 'Número', 'CNPJ', 'Tipo', 'IRRF',]].reset_index(drop=True)
            dadosIRRF.rename(columns={'IRRF': 'Valor'}, inplace=True)
            dadosRS = tabelaF.copy()
            dadosRS['Tipo'] = 'Retencao Social'
            dadosRS = dadosRS[['Data', 'Número', 'CNPJ', 'Tipo', 'Valor',]].reset_index(drop=True)
            dadosINSS = tabelaF[tabelaF['ValorSS']>0].copy()
            dadosINSS['Tipo'] = 'INSS'
            dadosINSS = dadosINSS[['Data', 'Número', 'CNPJ', 'Tipo', 'ValorSS']].reset_index(drop=True)
            dadosINSS.rename(columns={'ValorSS': 'Valor'}, inplace=True)
            dfFINAL = pd.concat([dadosRS, dadosIRRF, dadosINSS], ignore_index=True)
            dfFINAL['Valor'] = dfFINAL['Valor'].astype(str).str.replace('.', '', regex=False).astype(int)
            dfFINAL['CNPJ'] = dfFINAL['CNPJ'].str.replace(r'[-./]', '', regex=True)
            dfFINAL['Número'] = dfFINAL['Número'].astype(str).str.zfill(10)
        elif tipo == 'Tipo 2':
            area = [123.672,31.476,562.523,779.733]

            df_list = tabula.read_pdf(caminho, pages=1, area=area,lattice=True)

            tabela = pd.concat(df_list, ignore_index=True)
            tabela.columns = ['Data', 'nada', 'Número', 'CNPJ', 'nada', 'nadaa', 'asdf', 'PIS', 'COFINS', 'CSLL' ,'IRRF', 'INSS']
            tabela = tabela[['Data', 'Número', 'CNPJ', 'PIS', 'COFINS', 'CSLL' ,'IRRF', 'INSS']]
            tabela = tabela.replace(r'\r', ' ', regex=True)
            tabela = tabela.replace(r',', '', regex=True)
            tabela = tabela.replace(r'.', '')

            tabela[['PIS', 'COFINS', 'CSLL', 'IRRF', 'INSS']] = tabela[['PIS', 'COFINS', 'CSLL', 'IRRF', 'INSS']].apply(lambda x: x.str.split())
            tabela['PIS'] = tabela['PIS'].apply(lambda x: x[0])
            tabela['COFINS'] = tabela['COFINS'].apply(lambda x: x[0])
            tabela['CSLL'] = tabela['CSLL'].apply(lambda x: x[0])
            tabela['IRRF'] = tabela['IRRF'].apply(lambda x: x[0])
            tabela['INSS'] = tabela['INSS'].apply(lambda x: x[0])
            tabela[['PIS', 'COFINS', 'CSLL', 'IRRF', 'INSS']] = tabela[['PIS', 'COFINS', 'CSLL', 'IRRF', 'INSS']].apply(lambda x: pd.to_numeric(x))
            tabela['SOCIAL'] = tabela[['PIS', 'COFINS', 'CSLL']].sum(axis=1)
            tabela.drop(columns=['PIS', 'COFINS', 'CSLL'], inplace=True)
            tabelaINSS = tabela[tabela['INSS']> 0 ].copy()
            tabelaINSS.rename(columns={'INSS': 'Valor'}, inplace=True)
            if not tabelaINSS.empty:
                tabelaINSS['Tipo'] = 'INSS'
            tabelaIRRF = tabela[tabela['IRRF']> 0 ].copy()
            tabelaIRRF.rename(columns={'IRRF': 'Valor'}, inplace=True)
            if not tabelaIRRF.empty:
                tabelaIRRF['Tipo'] = 'IRRF'
            tabelaSOCIAL = tabela[tabela['SOCIAL'] > 0 ].copy()
            tabelaSOCIAL.rename(columns={'SOCIAL': 'Valor'}, inplace=True)
            if not tabelaSOCIAL.empty:
                tabelaSOCIAL['Tipo'] = 'Retencao Social'
            dfFINAL = pd.concat([tabelaIRRF, tabelaSOCIAL, tabelaINSS])
            dfFINAL.drop(columns=['IRRF', 'INSS', 'SOCIAL'], inplace=True)
            dfFINAL['CNPJ'] = dfFINAL['CNPJ'].str.replace(r'[-./]', '', regex=True)
            dfFINAL['Número'] = dfFINAL['Número'].astype(str).str.zfill(10)
        else:
            return 'faill'
        
        return {
            "df": dfFINAL
            }
    except Exception as e:
        erro = str(e)
        trace = traceback.format_exc()
        info = f'''INFO: HOUVE UM ERRO AO GERAR PDF\nErro: {erro}'''
        return {
            "df": None,
            "info" : info,
            "erro": str(e),  # Mensagem da exceção
            "erroF": traceback.format_exc(),  # Detalhes completos do traceback
            "arquivo": "PDF retencao"
            }
    
if __name__ == "__main__": 
    caminho = r"C:\Users\Alexandre\Downloads\NOVO LBR\NOVO LBR\Serviços tomados\Relatório retenção Serviços Tomados 06-2026.pdf"
    print(gerarpdf(caminho))
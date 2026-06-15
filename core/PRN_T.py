import pandas as pd
import os
import unicodedata

def _entrada_e_arquivo(caminho):
    return os.path.isfile(caminho)


def listar_arquivos_excel(caminho):
    arquivos_excel = []
    for item in os.listdir(caminho):
        if item.endswith('.xlsx'):
            arquivos_excel.append(os.path.join(caminho, item))
    return arquivos_excel

def campo(tipo='numerico', tamanho=0, valor='', alinhamento='esquerda'):
    if tipo == 'numerico':
        valor_str = str(valor).replace('.', '').replace(',', '').strip()

        if alinhamento == 'direita':
            return valor_str.rjust(tamanho, '0')
        else:
            return valor_str.ljust(tamanho, '0')[:tamanho]

    elif tipo == 'texto':
        valor_str = str(valor).strip()

        if alinhamento == 'direita':
            return valor_str.rjust(tamanho)
        else:
            return valor_str.ljust(tamanho)[:tamanho]

    else:
        return ' ' * tamanho

def gerar_prn(df):
    linhas_finais =[]
    for indice, linha in df.iterrows():
        lista_linha = linha.values.tolist()
        lista_linha += [''] * (17 - len(lista_linha))
        print(lista_linha)
        linha = [
        campo('texto', 5, ''),  #campo 01
        campo('texto', 18, lista_linha[1], 'direita'),  #campo 02 Codigo conta debito
        campo('texto', 18, lista_linha[2], 'direita'),  #campo 03 Codigo conta credito
        campo('texto', 5, lista_linha[3].strip(), 'direita'),  #campo 04 codigo historico
        campo('texto', 12, lista_linha[4], 'direita'),  #campo 06 valor
        campo('texto', 10, lista_linha[5], 'direita'),  #campo 07 data
        campo('texto', 6, ''),  #campo 08
        campo('texto', 143, lista_linha[7]),  #campo 09  NOME (complemento do historico)
        campo('texto', 20, lista_linha[8]),  #campo 10
        campo('texto', 20, lista_linha[9]),  #campo 11
        campo('texto', 20, lista_linha[10]),  #campo 12
        campo('texto', 15, lista_linha[11]),  #campo 13
        campo('texto', 20, lista_linha[12]),  #campo 14
        campo('texto', 15, lista_linha[13]),  #campo 15
        campo('texto', 1, lista_linha[14]),  #campo 16
        campo('texto', 4, lista_linha[15]),  #campo 17
        campo('texto', 10, lista_linha[16]),  #campo 18
    ]   
        
        linha_formatada = ''.join(linha).rstrip()
        linhas_finais.append(linha_formatada)

    texto = '\n'.join(linhas_finais)

    return texto

def remover_acentos(texto):
    return ''.join(
        c for c in unicodedata.normalize('NFKD', texto)
        if not unicodedata.combining(c)
    )

def ler_arquivo(caminho):
    df = pd.read_excel(caminho, header=None, dtype=str)
    df.dropna(subset=[4], inplace=True)
    df.fillna('', inplace=True)
    df[7] = df[7].apply(lambda x: x.replace('°', ''))
    df[5] = pd.to_datetime(df[5], errors='coerce')
    mes = df[5].dt.month.astype(str).str.zfill(2)
    df[5] = df[5].dt.strftime('%d/%m/%Y').fillna('')
    mes = mes.iloc[0] if not mes.empty else '00'
    return df, mes


def _resolver_arquivos(caminho):
    if _entrada_e_arquivo(caminho):
        return [caminho]
    if os.path.isdir(caminho):
        return listar_arquivos_excel(caminho)
    return []


def _nome_saida_do_arquivo(caminho_arquivo: str) -> str:
    return os.path.splitext(os.path.basename(caminho_arquivo))[0]


def _processar_arquivo(caminho_arquivo, salvar, tipo='sem CC'):
    df, _mes = ler_arquivo(caminho_arquivo)
    texto = gerar_prn(df)
    texto = remover_acentos(texto)
    nome_base = _nome_saida_do_arquivo(caminho_arquivo)
    destino = os.path.join(salvar, f'{nome_base}.prn')

    with open(destino, 'w', encoding='UTF-8') as arq:
        arq.write(texto)

    return destino


def gerar_arquivo(caminho, salvar, tipo='sem CC'):
    arquivos = _resolver_arquivos(caminho)
    if not arquivos:
        return False

    os.makedirs(salvar, exist_ok=True)

    for caminho_arquivo in arquivos:
        _processar_arquivo(caminho_arquivo, salvar, tipo)

    return True


class PRNweb:
    def __init__(
        self,
        entrada,
        saida,
        emit_log,
        tipo='sem CC',
        log_module='excel-prn',
    ):
        self.entrada = entrada
        self.saida = saida
        self.emit_log = emit_log
        self.tipo = tipo
        self.log_module = log_module

    def executar(self):
        arquivos = _resolver_arquivos(self.entrada)
        if not arquivos:
            self.emit_log(
                module=self.log_module,
                status="error",
                file=self.entrada,
                message="Nenhum arquivo Excel encontrado para processar.",
            )
            return False

        os.makedirs(self.saida, exist_ok=True)
        processados = 0

        try:
            for caminho_arquivo in arquivos:
                nome_entrada = os.path.basename(caminho_arquivo)
                destino = _processar_arquivo(
                    caminho_arquivo,
                    self.saida,
                    self.tipo,
                )
                processados += 1
                self.emit_log(
                    module=self.log_module,
                    status="success",
                    file=nome_entrada,
                    message=f"PRN gerado: {os.path.basename(destino)}",
                )

            self.emit_log(
                module=self.log_module,
                status="success",
                file=self.entrada,
                message=f"Processamento PRN concluído ({processados} arquivo(s)).",
            )
            return True
        except Exception as exc:
            self.emit_log(
                module=self.log_module,
                status="error",
                file=os.path.basename(arquivos[processados])
                if processados < len(arquivos)
                else self.entrada,
                message=str(exc),
            )
            raise


if __name__ == "__main__":
    caminho = r"C:\Users\Alexandre\Downloads\Nova pasta"
    salvar = r"C:\Users\Alexandre\Desktop\Saida\prnn"
    gerar_arquivo(caminho, salvar)
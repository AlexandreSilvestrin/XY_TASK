import re
import pandas as pd
import openpyxl
import os
import traceback
from models.banco_fat import COL_PORCENTAGEM, COL_RAZAO, COL_RETENCOES, FATModel


def _parse_valor_monetario(valor):
    if pd.isna(valor):
        return 0
    if isinstance(valor, (int, float)):
        return int(valor)
    texto = str(valor).strip()
    if not texto or texto.lower() == "nan":
        return 0
    return int(texto.replace(".", "").replace(",", ""))


class Faturamento:
    def __init__(self, caminho, caminhoSalvar, mes, ano):
        self.caminho = caminho
        self.caminhoS = caminhoSalvar
        self.txtP = f'I51{mes}{ano}.txt'
        self.caminhosFat, self.pastaP = self.encontrar_arquivo(caminho, self.txtP)
        self.data =  mes, ano

    def criar_pasta(self):
        ultimo_diretorio = os.path.basename(self.caminho)
        os.makedirs(f'{self.caminhoS}/{ultimo_diretorio}/FATURAMENTO', exist_ok=True)
        self.caminhoS = f'{self.caminhoS}/{ultimo_diretorio}/FATURAMENTO'

    def printarInformacoes(self, conteudo, nomearq="", status="", mensagem=""):
        print(conteudo)

    def encontrar_arquivo(self, caminho, txtPrestados):
        caminhosFat = []
        for dirpath, dirnames, filenames in os.walk(caminho):
            if txtPrestados in filenames:
                caminhosFat.append(os.path.join(dirpath, txtPrestados)) 
        return caminhosFat, os.path.basename(os.path.normpath(caminho))

    def faturamento(self, caminho):
        try:
            mes, ano = self.data

            caminhosalvar = self.caminhoS
            pastaP = self.pastaP

            with open(caminho, 'r') as arq:
                dados = arq.read()

            padrao_cnpj = r'CGC/CNPJ: \d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}'
            cnpj_encontrado = re.search(padrao_cnpj, dados).group().replace('CGC/CNPJ: ', '')
            cnpj = cnpj_encontrado
            dados = dados.replace('\n                                                            ', '')
            dados = dados.replace('\n|   |     |                 |              |                |      |              |              |          I', 'I')
            dados = dados.replace('\n|   |     |                   |                 |      |                |          I', 'I')

            lista = dados.split('\n')

            listafiltrada= []
            for i in lista:
                padrao = r'\|\d{2}\s\|'
                if re.search(padrao, i):
                    listafiltrada.append(i)

            novalista = []
            for e, linha in enumerate(listafiltrada):
                if 'Cancelada' not in linha.strip() and 'Canc.' not in linha.strip():
                    novalista.append(linha)

            if not novalista:
                return 'vazio'

            from io import StringIO
            novalista = '\n'.join(novalista)


            lista_io = StringIO(novalista)
            df = pd.read_csv(lista_io, sep = '|', header=None)
            try:
                df.columns = ('nada', 'data', 'nada2', 'NF', 'cnpj', 'valorTotal', 'nada3', 'iss pagar', 'iss retido/pagar', 'valorTotal2', 'nada6', 'iss ret', 'nada', 'valorirrf', 'nada7', 'nada8')
                df['NF'] = pd.to_numeric(df['NF'], errors='coerce')
                df['valorirrf'] = df['valorirrf'].astype(str)
                df['valorirrf'] = df['valorirrf'].replace('nan', '0')
                df = df.sort_values(by='NF')
            except ValueError as e:
                if "Length mismatch" in str(e):
                    df.columns = ('nada', 'data', 'nada2', 'NF', 'valorTotal', 'nada3', 'nada4', 'valorTotal2', 'nada5', 'nadaa', 'irrf', 'valorirrf', 'nada8', 'nad')
                    df['NF'] = pd.to_numeric(df['NF'], errors='coerce')
                    df['valorirrf'] = df['valorirrf'].astype(str)
                    df['valorirrf'] = df['valorirrf'].replace('nan', '0')
                    df = df.sort_values(by='NF')
                else:
                    raise
            
            df = df[["data", "NF", "valorTotal", "valorTotal2", "valorirrf"]].copy()

            for coluna in ("valorTotal", "valorTotal2", "valorirrf"):
                df[coluna] = df[coluna].map(_parse_valor_monetario)


            linhaG = FATModel.get_by_cnpj(cnpj.strip())

            if not linhaG:
                print('cnpj nao encontrado')
                with open(f"{self.caminhoS}/CNPJ-NAO-ENCONTRADO_{cnpj.replace('/', '').replace('.', '')}.txt", "w") as arq:
                    arq.write(f'A empresa do CNPJS {cnpj} nao possui no banco de faturamento')
                return

            listaP = [[nome, int(valor)] for nome, valor in linhaG[COL_PORCENTAGEM].items()]
            retencao = [str(x).strip() for x in linhaG[COL_RETENCOES]]


            listadf = []
            for e, linha in df.iterrows():
                dia , numero, valortotal, valortotal2, irrf = linha
                if valortotal > 0:
                    valor_total = valortotal
                else:
                    valor_total = valortotal2
                dia = str(dia).zfill(2)
                linha_total = { 'numero': 1, 'valor': valor_total, 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {linhaG['CONTRATO']}"}
                listadf.append(linha_total)
                for nome, porcent in listaP:
                    linha_total_porcent = {'numero': 1, 'valor': round(int(valor_total)*(porcent/100)), 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {nome}"}
                    listadf.append(linha_total_porcent)
                
                pis = round(valor_total*(0.65/100))
                cofins = round(valor_total*(3/100))
                csll = round(valor_total*(1/100))

                for ret in retencao:
                    if ret == 'IR':
                        linha_irrf = {'numero': 1, 'valor': irrf, 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"IR RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {linhaG['CONTRATO']}"}
                        listadf.append(linha_irrf)
                        for nome, porcent in listaP:
                            linha_total_porcent = {'numero': 1, 'valor': round(int(irrf)*(porcent/100)), 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"IR RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {nome}"}
                            listadf.append(linha_total_porcent)

                    elif ret == 'PIS':
                        linha_pis = {'numero': 1, 'valor': pis, 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"PIS RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {linhaG['CONTRATO']}"}
                        listadf.append(linha_pis)
                        for nome, porcent in listaP:
                            linha_total_porcent = {'numero': 1, 'valor': round(int(pis)*(porcent/100)), 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"PIS RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {nome}"}
                            listadf.append(linha_total_porcent)
                    
                    elif ret == 'COFINS':
                        linha_cofins = {'numero': 1, 'valor': cofins, 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"COFINS RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {linhaG['CONTRATO']}"}
                        listadf.append(linha_cofins)
                        for nome, porcent in listaP:
                            linha_total_porcent = {'numero': 1, 'valor': round(int(cofins)*(porcent/100)), 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"COFINS RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {nome}"}
                            listadf.append(linha_total_porcent)
                    
                    elif ret == 'CSLL':
                        linha_csll = {'numero': 1, 'valor': csll, 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"CSLL RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {linhaG['CONTRATO']}"}
                        listadf.append(linha_csll)
                        for nome, porcent in listaP:
                            linha_total_porcent = {'numero': 1, 'valor': round(int(csll)*(porcent/100)), 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"CSLL RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {nome}"}
                            listadf.append(linha_total_porcent)

                linha_iss_retido_pagar = {'numero': 1, 'valor': '', 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"ISS RETIDO CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {linhaG['CONTRATO']}"}
                listadf.append(linha_iss_retido_pagar)
                linha_iss = {'numero': 1, 'valor': '', 'data': f'{dia}/{mes}/{ano}', 'vazio': '', 'nome': f"ISS A PAGAR CF. NF {numero} PRESTAÇÃO DE SERVIÇO {linhaG[COL_RAZAO]}- {linhaG['CONTRATO']}"}
                listadf.append(linha_iss)
                    
                linha_vazia = {'numero': '', 'valor': '', 'data': '', 'vazio': '', 'nome': ''}
                listadf.append(linha_vazia)
                
            dffinal = pd.DataFrame(listadf)

            dffinal[['a', 'b', 'c']] = ''

            dffinal = dffinal[['a', 'b', 'c', 'numero', 'valor', 'data', 'vazio', 'nome']]

            dffinal.to_excel(f'{caminhosalvar}/{pastaP} FATURAMENTO {mes}.{ano} {linhaG["CONTRATO"]}.xlsx', index=False, header=None)

            self.printarInformacoes("FATURAMENTO SALVO", nomearq=f'FATURAMENTO {mes}.{ano} {linhaG["CONTRATO"]}.xlsx', status='success', mensagem=f'FATURAMENTO SALVO')

            workbook = openpyxl.load_workbook(f'{caminhosalvar}/{pastaP} FATURAMENTO {mes}.{ano} {linhaG["CONTRATO"]}.xlsx')

            # Selecionar a planilha desejada (substitua 'Sheet1' pelo nome da sua planilha)
            sheet = workbook['Sheet1']

            # Definir o tamanho da coluna A para 20 (substitua 'A' pelo identificador da sua coluna)
            sheet.column_dimensions['A'].width = 5
            sheet.column_dimensions['B'].width = 18
            sheet.column_dimensions['C'].width = 18
            sheet.column_dimensions['D'].width = 5
            sheet.column_dimensions['E'].width = 12
            sheet.column_dimensions['F'].width = 11.14
            sheet.column_dimensions['G'].width = 6
            sheet.column_dimensions['H'].width = 85

            #Salvar as alterações no arquivo
            workbook.save(f'{caminhosalvar}/{pastaP} FATURAMENTO {mes}.{ano} {linhaG["CONTRATO"]}.xlsx')

        except Exception as e:
            print('erro no faturamento.py linha 200')
            erro = str(e)
            erroF = traceback.format_exc()
            print(erroF)
            info = f'''INFO: ERRO AO GERAR FATURAMENTO\n Empresa: {cnpj}\nErro: {erro}'''
            with open(f"{self.caminhoS}/ERRO_{cnpj.replace('/', '').replace('.', '')}.txt", "w") as arq:
                arq.write(f'{info}\n\n TRACEBACK:\n{erroF}')
            self.printarInformacoes(info, nomearq=f'ERRO_{cnpj.replace('/', '').replace('.', '')}.txt', status='error', mensagem=info)

    def gerarFat(self):
        self.criar_pasta()
        for caminho in self.caminhosFat:
            self.faturamento(caminho)
        self.printarInformacoes("COMPLETOU FATURAMENTO", status='success', mensagem='COMPLETOU FATURAMENTO')


class Faturamentoweb(Faturamento):
    def __init__(self, caminho, caminhoSalvar, mes, ano, emit_log):
        super().__init__(caminho, caminhoSalvar, mes, ano)
        self.emit_log = emit_log

    def printarInformacoes(self, conteudo, nomearq="", status="", mensagem=""):
        self.emit_log(
            module="faturamento",
            status=status,
            file=nomearq,
            message=conteudo
        )

if __name__ == "__main__": 
    base_directory = r"C:\Users\Alexandre\Downloads\LBR-20260514T130823Z-3-001\LBR"
    saida = r"C:/Users/Alexandre/Desktop/saida lbr"
    txttomados = 'I51042026.txt'

    notas = Faturamento(base_directory,  saida, txttomados)
    notas.gerarFat()
    #preciso terminas de colocar no UI agora , ele precisa das mesma coisa o local de salvar o local dos arquivos e os dois nomes dos arquivos
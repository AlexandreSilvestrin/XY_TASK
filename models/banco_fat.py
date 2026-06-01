import json
import sqlite3
from pathlib import Path

import pandas as pd

from config.caminhos import Caminhos

COL_PORCENTAGEM = "PORCENTAGEM POR CONSORCIADA"
COL_RETENCOES = "RETENÇÕES"
COL_RAZAO = "RAZÃO SOCIAL"


def _porcentagem_para_dict(valor):
    if isinstance(valor, dict):
        return {str(nome): float(percentual) for nome, percentual in valor.items()}

    if isinstance(valor, str):
        texto = valor.strip()
        if not texto:
            return {}
        if texto.startswith("{"):
            dados = json.loads(texto)
            return {str(nome): float(percentual) for nome, percentual in dados.items()}

        partes = texto.replace("%", "").replace(",", ".").split()
        return {
            partes[i]: float(partes[i + 1])
            for i in range(0, len(partes) - 1, 2)
        }

    return {}


def _retencoes_para_lista(valor):
    if isinstance(valor, list):
        return [str(item).strip() for item in valor]

    if isinstance(valor, str):
        texto = valor.strip()
        if not texto:
            return []
        if texto.startswith("["):
            return [str(item).strip() for item in json.loads(texto)]
        return [item.strip() for item in texto.split(",") if item.strip()]

    return []


def _porcentagem_para_texto_excel(valor):
    porcentagem = _porcentagem_para_dict(valor)
    partes = []
    for nome, percentual in porcentagem.items():
        numero = float(percentual)
        if numero == int(numero):
            numero = int(numero)
        partes.append(f"{nome} {numero}%")
    return " ".join(partes)


def _retencoes_para_texto_excel(valor):
    return ", ".join(_retencoes_para_lista(valor))


class FATModel:
    filepath = Caminhos.CAMINHO_GUIA_NOMES
    _TABLE = "guia_nomes"

    @staticmethod
    def _db_path():
        return Path(FATModel.filepath)

    @staticmethod
    def _connect():
        path = FATModel._db_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path)
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {FATModel._TABLE} (
                CONTRATO TEXT,
                "{COL_RAZAO}" TEXT,
                CNPJ TEXT,
                "{COL_PORCENTAGEM}" TEXT,
                "{COL_RETENCOES}" TEXT
            )
            """
        )
        return conn

    @staticmethod
    def _parse_json_columns(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        df = df.copy()
        df[COL_PORCENTAGEM] = df[COL_PORCENTAGEM].map(_porcentagem_para_dict)
        df[COL_RETENCOES] = df[COL_RETENCOES].map(_retencoes_para_lista)
        return df

    @staticmethod
    def _to_storage_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df[COL_PORCENTAGEM] = df[COL_PORCENTAGEM].map(
            lambda valor: json.dumps(_porcentagem_para_dict(valor), ensure_ascii=False)
        )
        df[COL_RETENCOES] = df[COL_RETENCOES].map(
            lambda valor: json.dumps(_retencoes_para_lista(valor), ensure_ascii=False)
        )
        return df

    @staticmethod
    def load_data():
        """Lê o SQLite e retorna DataFrame com porcentagem (dict) e retenções (list)."""
        conn = FATModel._connect()
        try:
            df = pd.read_sql_query(
                f"""
                SELECT CONTRATO, "{COL_RAZAO}", CNPJ,
                       "{COL_PORCENTAGEM}", "{COL_RETENCOES}"
                FROM {FATModel._TABLE}
                ORDER BY rowid
                """,
                conn,
            )
            return FATModel._parse_json_columns(df)
        except (pd.errors.DatabaseError, sqlite3.OperationalError):
            return pd.DataFrame(
                columns=["CONTRATO", COL_RAZAO, "CNPJ", COL_PORCENTAGEM, COL_RETENCOES]
            )
        finally:
            conn.close()

    @staticmethod
    def get_guia_por_cnpj(cnpj: str):
        """Retorna registro bruto do banco para API (sem normalizar contrato)."""
        df = FATModel.load_data()
        if df.empty:
            return None

        match = df[df["CNPJ"].astype(str).str.strip() == str(cnpj).strip()]
        if match.empty:
            return None

        row = match.iloc[0]
        return {
            "contrato": str(row["CONTRATO"]).strip(),
            "razao_social": str(row[COL_RAZAO]).strip(),
            "cnpj": str(row["CNPJ"]).strip(),
            "porcentagens": row[COL_PORCENTAGEM],
            "retencoes": row[COL_RETENCOES],
        }

    @staticmethod
    def get_by_cnpj(cnpj: str):
        df = FATModel.load_data()
        if df.empty:
            return None

        match = df[df["CNPJ"].astype(str).str.strip() == cnpj.strip()]
        if match.empty:
            return None

        row = match.iloc[0]
        return {
            "CONTRATO": (
                str(row["CONTRATO"])
                .replace(" ", "")
                .replace("-", "")
                .replace(".", "")
                .strip()
                .upper()
            ),
            COL_RAZAO: str(row[COL_RAZAO]).upper(),
            "CNPJ": str(row["CNPJ"]).strip(),
            COL_PORCENTAGEM: row[COL_PORCENTAGEM],
            COL_RETENCOES: row[COL_RETENCOES],
        }

    @staticmethod
    def save_data(df):
        conn = FATModel._connect()
        try:
            df = FATModel._to_storage_dataframe(df)
            conn.execute(f"DELETE FROM {FATModel._TABLE}")
            df.to_sql(FATModel._TABLE, conn, if_exists="append", index=False)
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def salvar_guia(contrato, razao_social, cnpj, porcentagens, retencoes):
        df = FATModel.load_data()
        cnpj = str(cnpj).strip()

        nova_linha = {
            "CONTRATO": str(contrato).strip(),
            COL_RAZAO: str(razao_social).strip(),
            "CNPJ": cnpj,
            COL_PORCENTAGEM: _porcentagem_para_dict(porcentagens),
            COL_RETENCOES: _retencoes_para_lista(retencoes),
        }

        if df.empty:
            FATModel.save_data(pd.DataFrame([nova_linha]))
            return

        df["CNPJ"] = df["CNPJ"].astype(str).str.strip()
        indice = df.index[df["CNPJ"] == cnpj]

        if len(indice):
            idx = indice[0]
            for coluna, valor in nova_linha.items():
                df.at[idx, coluna] = valor
        else:
            df = pd.concat([df, pd.DataFrame([nova_linha])], ignore_index=True)

        FATModel.save_data(df)

    @staticmethod
    def add_new_data(lista):
        FATModel.salvar_guia(
            lista[0],
            lista[1],
            lista[2],
            lista[3],
            lista[4],
        )

    @staticmethod
    def info_data():
        existing_df = FATModel.load_data()
        print(existing_df.shape)

    @staticmethod
    def pesquisar_cnpj(cnpj):
        linha = FATModel.get_by_cnpj(cnpj)
        if not linha:
            return False

        return [
            linha["CONTRATO"],
            linha[COL_RAZAO],
            linha["CNPJ"],
            linha[COL_PORCENTAGEM],
            linha[COL_RETENCOES],
        ]

    @staticmethod
    def exportar_db(folder_path):
        dfbanco = FATModel.load_data()
        export_df = dfbanco.copy()
        export_df[COL_PORCENTAGEM] = export_df[COL_PORCENTAGEM].map(
            _porcentagem_para_texto_excel
        )
        export_df[COL_RETENCOES] = export_df[COL_RETENCOES].map(_retencoes_para_texto_excel)
        destino = Path(folder_path) / "GUIA NOME.xlsx"
        export_df.to_excel(destino, index=False)
        return destino

    @staticmethod
    def importar_db(file_path):
        dfbanco = pd.read_excel(file_path, dtype=str)
        dfbanco = dfbanco[
            ["CONTRATO", COL_RAZAO, "CNPJ", COL_PORCENTAGEM, COL_RETENCOES]
        ]
        dfbanco["CNPJ"] = dfbanco["CNPJ"].astype(str).str.strip()
        dfbanco[COL_PORCENTAGEM] = dfbanco[COL_PORCENTAGEM].map(_porcentagem_para_dict)
        dfbanco[COL_RETENCOES] = dfbanco[COL_RETENCOES].map(_retencoes_para_lista)

        df = FATModel.load_data()
        df["CNPJ"] = df["CNPJ"].astype(str).str.strip()

        df_final = pd.concat([dfbanco, df]).drop_duplicates(subset=["CNPJ"], keep="first")
        FATModel.save_data(df_final)
        return len(dfbanco)


if __name__ == "__main__":
    linha = FATModel.get_by_cnpj("31.599.507/0001-37")
    print(linha)

import sqlite3
from pathlib import Path

import pandas as pd

from config.caminhos import Caminhos


class CNPJModel:
    filepath = Caminhos.CAMINHO_BANCO_CNPJ
    _TABLE = "banco_cnpj"
    NOME_NAO_ENCONTRADO = "NAO ENCONTRADO"

    @staticmethod
    def _nome_invalido(nome) -> bool:
        if pd.isna(nome):
            return False
        return str(nome).strip().upper() == CNPJModel.NOME_NAO_ENCONTRADO

    @staticmethod
    def _filtrar_validos(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        filtrado = df.copy()
        filtrado["CNPJ"] = filtrado["CNPJ"].astype(str).str.strip()
        filtrado["Nome"] = filtrado["Nome"].apply(
            lambda x: str(x).strip() if pd.notna(x) else ""
        )
        return filtrado[
            (filtrado["CNPJ"] != "")
            & (~filtrado["Nome"].apply(CNPJModel._nome_invalido))
        ].reset_index(drop=True)

    @staticmethod
    def _db_path():
        return Path(CNPJModel.filepath)

    @staticmethod
    def _connect():
        path = CNPJModel._db_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path)
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {CNPJModel._TABLE} (
                ordem INTEGER PRIMARY KEY,
                CNPJ TEXT NOT NULL UNIQUE,
                Nome TEXT NOT NULL
            )
            """
        )
        return conn

    @staticmethod
    def load_data():
        """Lê o banco de dados e retorna o DataFrame na ordem original."""
        conn = CNPJModel._connect()
        try:
            return pd.read_sql_query(
                f"SELECT CNPJ, Nome FROM {CNPJModel._TABLE} ORDER BY ordem",
                conn,
            )
        except (pd.errors.DatabaseError, sqlite3.OperationalError):
            return pd.DataFrame(columns=["CNPJ", "Nome"])
        finally:
            conn.close()

    @staticmethod
    def save_data(df):
        """Salva o DataFrame no SQLite preservando a ordem das linhas."""
        df = CNPJModel._filtrar_validos(df[["CNPJ", "Nome"]])
        conn = CNPJModel._connect()
        try:
            conn.execute(f"DELETE FROM {CNPJModel._TABLE}")
            records = []
            for ordem, row in df.reset_index(drop=True).iterrows():
                cnpj = str(row["CNPJ"]).zfill(14)
                nome = str(row["Nome"]).strip() if pd.notna(row["Nome"]) else ""
                records.append((ordem, cnpj, nome))
            conn.executemany(
                f"INSERT INTO {CNPJModel._TABLE} (ordem, CNPJ, Nome) VALUES (?, ?, ?)",
                records,
            )
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def banco_to_dict():
        """Retorna todo o banco de dados como um dicionário (ordem preservada)."""
        df = CNPJModel._filtrar_validos(CNPJModel.load_data())
        if df.empty:
            return {}
        df["CNPJ"] = df["CNPJ"].apply(lambda x: str(x).zfill(14))
        df["Nome"] = df["Nome"].apply(lambda x: str(x).strip())
        return dict(zip(df["CNPJ"], df["Nome"], strict=False))

    @staticmethod
    def _normalize_cnpj(cnpj) -> str:
        digits = "".join(char for char in str(cnpj) if char.isdigit())
        return digits.zfill(14) if digits else ""

    @staticmethod
    def get_by_cnpj(cnpj: str):
        cnpj_digits = CNPJModel._normalize_cnpj(cnpj)
        if len(cnpj_digits) != 14:
            return None

        df = CNPJModel._filtrar_validos(CNPJModel.load_data())
        if df.empty:
            return None

        df = df.copy()
        df["CNPJ"] = df["CNPJ"].apply(CNPJModel._normalize_cnpj)
        match = df[df["CNPJ"] == cnpj_digits]
        if match.empty:
            return None

        row = match.iloc[0]
        return {
            "cnpj": row["CNPJ"],
            "nome": str(row["Nome"]).strip(),
        }

    @staticmethod
    def upsert_registro(cnpj: str, nome: str) -> str:
        cnpj_digits = CNPJModel._normalize_cnpj(cnpj)
        nome = str(nome).strip()

        if len(cnpj_digits) != 14:
            raise ValueError("Informe um CNPJ válido com 14 dígitos.")

        if not nome:
            raise ValueError("Informe o nome para salvar.")

        df = CNPJModel.load_data()
        if df.empty:
            CNPJModel.save_data(pd.DataFrame([{"CNPJ": cnpj_digits, "Nome": nome}]))
            return "created"

        df = df.copy()
        df["CNPJ"] = df["CNPJ"].apply(CNPJModel._normalize_cnpj)
        match = df.index[df["CNPJ"] == cnpj_digits]

        if len(match) > 0:
            df.loc[match[0], "Nome"] = nome
            CNPJModel.save_data(CNPJModel._filtrar_validos(df))
            return "updated"

        CNPJModel.add_new_data(pd.DataFrame([{"CNPJ": cnpj_digits, "Nome": nome}]))
        return "created"

    @staticmethod
    def add_new_data(df):
        """Adiciona apenas linhas com CNPJ que ainda não existem no banco."""
        df = CNPJModel._filtrar_validos(df[["CNPJ", "Nome"]])
        existing_raw = CNPJModel.load_data()
        existing_df = CNPJModel._filtrar_validos(existing_raw)

        if df.empty:
            if len(existing_df) < len(existing_raw):
                CNPJModel.save_data(existing_df)
            return

        if existing_df.empty:
            CNPJModel.save_data(df)
            return

        new_data = df[~df["CNPJ"].isin(existing_df["CNPJ"])]
        precisa_limpar = len(existing_df) < len(existing_raw)

        if new_data.empty and not precisa_limpar:
            return

        updated_df = pd.concat([existing_df, new_data], ignore_index=True)
        updated_df = updated_df.drop_duplicates(subset="CNPJ", keep="first")
        CNPJModel.save_data(updated_df)

    @staticmethod
    def info_data():
        existing_df = CNPJModel.load_data()
        print(existing_df.shape)

    @staticmethod
    def exportar_db(folder_path):
        dfbanco = CNPJModel._filtrar_validos(CNPJModel.load_data())
        dfbanco = dfbanco[["CNPJ", "Nome"]]
        dfbanco["CNPJ"] = dfbanco["CNPJ"].apply(lambda x: str(x).zfill(14))
        destino = Path(folder_path) / "BANCOCNPJ.xlsx"
        dfbanco.to_excel(destino, index=False)
        return destino

    @staticmethod
    def importar_db(file_path):
        dfbanco = pd.read_excel(file_path, dtype=str)
        dfbanco = dfbanco[["CNPJ", "Nome"]]
        dfbanco["CNPJ"] = dfbanco["CNPJ"].apply(lambda x: str(x).zfill(14))
        validos = CNPJModel._filtrar_validos(dfbanco)
        CNPJModel.add_new_data(validos)
        return len(validos)


if __name__ == "__main__":
    df = pd.read_excel(Caminhos.CAMINHO_BANCO_CNPJ_XLSX)
    df["CNPJ"] = df["CNPJ"].apply(lambda x: str(x).zfill(14))
    CNPJModel.save_data(df)

import sqlite3
from pathlib import Path

import pandas as pd

from config.caminhos import Caminhos


class CNPJModel:
    filepath = Caminhos.CAMINHO_BANCO_CNPJ
    _TABLE = "banco_cnpj"

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
        df = CNPJModel.load_data()
        if df.empty:
            return {}
        df["CNPJ"] = df["CNPJ"].apply(lambda x: str(x).zfill(14))
        df["Nome"] = df["Nome"].apply(lambda x: str(x).strip())
        return dict(zip(df["CNPJ"], df["Nome"], strict=False))

    @staticmethod
    def add_new_data(df):
        """Adiciona apenas linhas com CNPJ que ainda não existem no banco."""
        existing_df = CNPJModel.load_data()

        if existing_df.empty:
            CNPJModel.save_data(df[["CNPJ", "Nome"]])
            return

        new_data = df[~df["CNPJ"].isin(existing_df["CNPJ"])]

        if not new_data.empty:
            updated_df = pd.concat([existing_df, new_data], ignore_index=True)
            updated_df = updated_df.drop_duplicates(subset="CNPJ", keep="first")
            CNPJModel.save_data(updated_df)

    @staticmethod
    def info_data():
        existing_df = CNPJModel.load_data()
        print(existing_df.shape)

    @staticmethod
    def exportar_db(folder_path):
        dfbanco = CNPJModel.load_data()
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
        CNPJModel.add_new_data(dfbanco)
        return len(dfbanco)


if __name__ == "__main__":
    df = pd.read_excel(Caminhos.CAMINHO_BANCO_CNPJ_XLSX)
    df["CNPJ"] = df["CNPJ"].apply(lambda x: str(x).zfill(14))
    CNPJModel.save_data(df)

import os
import shutil
import sqlite3

BASE = os.path.dirname(os.path.abspath(__file__))
BANCO = os.path.join(BASE, "dados.db")
PASTA_FOTOS = os.path.join(BASE, "fotos")

resposta = input("Isso apaga TODAS as pessoas, presenças e fotos. Digite SIM para continuar: ")
if resposta.strip().upper() != "SIM":
    print("Cancelado. Nada foi apagado.")
    raise SystemExit

# recria as tabelas do zero
con = sqlite3.connect(BANCO)
con.executescript("""
    DROP TABLE IF EXISTS presencas;
    DROP TABLE IF EXISTS pessoas;

    CREATE TABLE pessoas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE,
        foto_caminho TEXT,
        embedding BLOB,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE presencas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pessoa_id INTEGER NOT NULL,
        data_hora TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pessoa_id) REFERENCES pessoas(id)
    );
""")
con.commit()
con.close()

# apaga as fotos e recria a pasta vazia
if os.path.isdir(PASTA_FOTOS):
    shutil.rmtree(PASTA_FOTOS)
os.makedirs(PASTA_FOTOS, exist_ok=True)

print("Banco reiniciado do zero.")
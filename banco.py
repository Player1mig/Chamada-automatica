import sqlite3

def conectar():
    return sqlite3.connect("dados.db")

def criar_tabelas():
    con = conectar()
    con.executescript("""
        CREATE TABLE IF NOT EXISTS pessoas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE,
            foto_caminho TEXT,
            embedding BLOB,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS presencas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pessoa_id INTEGER NOT NULL,
            data_hora TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pessoa_id) REFERENCES pessoas(id)
        );
    """)
    con.commit()
    con.close()

print("Começando...")
criar_tabelas()
print("Banco criado!")
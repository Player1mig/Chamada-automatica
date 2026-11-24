import os
import re
import sqlite3
import time
import numpy as np
from flask import Flask, request, jsonify, send_from_directory

from reconhecimento import gerar_embedding, semelhanca, LIMITE

BASE = os.path.dirname(os.path.abspath(__file__))
PASTA_FOTOS = os.path.join(BASE, "fotos")
BANCO = os.path.join(BASE, "dados.db")
os.makedirs(PASTA_FOTOS, exist_ok=True)

app = Flask(__name__, static_folder=None)


def url_foto(caminho):
    if not caminho:
        return ""
    return "/foto/" + os.path.basename(caminho)


# Separa o nome da sala: "Miguel Alves 3° b" -> ("Miguel Alves", "3°B")
PADRAO_SALA = re.compile(
    r"^(.+?)[\s,\-]*(\d{1,2})\s*[°º˚ªo]?\s*([A-Za-z])\s*$", re.IGNORECASE
)


def separar_sala(nome_completo):
    achou = PADRAO_SALA.match(nome_completo.strip())
    if not achou:
        return nome_completo.strip(), "Sem sala"
    nome, serie, letra = achou.groups()
    return nome.strip(), f"{int(serie)}°{letra.upper()}"


# ---------- Páginas e arquivos liberados ----------
@app.route("/")
def pagina_login():
    return send_from_directory(BASE, "login.html")


@app.route("/<pagina>.html")
def paginas(pagina):
    return send_from_directory(BASE, f"{pagina}.html")


@app.route("/css/<path:arquivo>")
def arquivos_css(arquivo):
    return send_from_directory(os.path.join(BASE, "css"), arquivo)


@app.route("/js/<path:arquivo>")
def arquivos_js(arquivo):
    return send_from_directory(os.path.join(BASE, "js"), arquivo)


@app.route("/img/<path:arquivo>")
def arquivos_img(arquivo):
    return send_from_directory(os.path.join(BASE, "img"), arquivo)


@app.route("/foto/<nome>")
def fotos(nome):
    return send_from_directory(PASTA_FOTOS, nome)


# ---------- Registrar ----------
@app.route("/registrar", methods=["POST"])
def registrar():
    nome = request.form.get("nome", "").strip()
    foto = request.files.get("foto")

    if not nome or not foto:
        return jsonify({"ok": False, "erro": "Envie o nome e a foto."}), 400

    dados = foto.read()
    embedding, erro = gerar_embedding(dados)
    if erro:
        return jsonify({"ok": False, "erro": erro}), 400

    nome_arquivo = f"pessoa_{int(time.time())}.png"
    with open(os.path.join(PASTA_FOTOS, nome_arquivo), "wb") as arquivo:
        arquivo.write(dados)

    con = sqlite3.connect(BANCO)
    cursor = con.execute(
        "INSERT INTO pessoas (nome, foto_caminho, embedding) VALUES (?, ?, ?)",
        (nome, os.path.join("fotos", nome_arquivo), embedding.tobytes()),
    )
    novo_id = cursor.lastrowid
    con.commit()
    con.close()

    return jsonify({
        "ok": True,
        "id": novo_id,
        "mensagem": f"{nome} registrado! ID: {novo_id}",
    })


# ---------- Reconhecimento ----------
@app.route("/reconhecer", methods=["POST"])
def reconhecer():
    foto = request.files.get("foto")
    if not foto:
        return jsonify({"ok": False, "erro": "Envie a foto."}), 400

    embedding, erro = gerar_embedding(foto.read())
    if erro:
        return jsonify({"ok": False, "erro": erro}), 400

    con = sqlite3.connect(BANCO)
    pessoas = con.execute(
        "SELECT id, nome, foto_caminho, embedding FROM pessoas WHERE embedding IS NOT NULL"
    ).fetchall()

    melhor = None
    melhor_nota = -1
    for pessoa in pessoas:
        guardado = np.frombuffer(pessoa[3], dtype=np.float32).reshape(1, -1)
        nota = semelhanca(embedding, guardado)
        if nota > melhor_nota:
            melhor, melhor_nota = pessoa, nota

    if melhor is None or melhor_nota < LIMITE:
        con.close()
        return jsonify({"ok": False, "erro": "Rosto não reconhecido."})

    pessoa_id, nome, caminho, _ = melhor

    ja_presente = con.execute(
        "SELECT 1 FROM presencas WHERE pessoa_id = ? "
        "AND date(data_hora, 'localtime') = date('now', 'localtime')",
        (pessoa_id,),
    ).fetchone()

    if not ja_presente:
        con.execute("INSERT INTO presencas (pessoa_id) VALUES (?)", (pessoa_id,))
        con.commit()
    con.close()

    nome_limpo, sala = separar_sala(nome)
    mensagem = "Já estava presente hoje." if ja_presente else "Presença confirmada!"
    return jsonify({
        "ok": True,
        "id": pessoa_id,
        "nome": nome_limpo,
        "sala": sala,
        "foto": url_foto(caminho),
        "mensagem": mensagem,
    })


# ---------- Lista de presentes de hoje (presentes.html) ----------
@app.route("/api/presentes")
def api_presentes():
    con = sqlite3.connect(BANCO)
    linhas = con.execute(
        "SELECT p.id, p.nome, p.foto_caminho, time(pr.data_hora, 'localtime') "
        "FROM presencas pr JOIN pessoas p ON p.id = pr.pessoa_id "
        "WHERE date(pr.data_hora, 'localtime') = date('now', 'localtime') "
        "ORDER BY pr.data_hora"
    ).fetchall()
    con.close()

    resultado = []
    for pessoa_id, nome, caminho, hora in linhas:
        nome_limpo, sala = separar_sala(nome)
        resultado.append({
            "id": pessoa_id,
            "nome": nome_limpo,
            "sala": sala,
            "foto": url_foto(caminho),
            "hora": hora[:5],
        })
    return jsonify(resultado)


# ---------- Histórico (historico.html) ----------
@app.route("/api/historico")
def api_historico():
    con = sqlite3.connect(BANCO)
    linhas = con.execute(
        "SELECT p.id, p.nome, p.foto_caminho, "
        "date(pr.data_hora, 'localtime'), time(pr.data_hora, 'localtime') "
        "FROM presencas pr JOIN pessoas p ON p.id = pr.pessoa_id "
        "ORDER BY pr.data_hora DESC LIMIT 5000"
    ).fetchall()
    con.close()

    resultado = []
    for pessoa_id, nome, caminho, data, hora in linhas:
        nome_limpo, sala = separar_sala(nome)
        resultado.append({
            "id": pessoa_id,
            "nome": nome_limpo,
            "sala": sala,
            "foto": url_foto(caminho),
            "data": data,
            "hora": hora[:5],
        })
    return jsonify(resultado)


# O servidor só liga aqui: nenhuma rota pode ficar abaixo destas linhas
if __name__ == "__main__":
    app.run(debug=True)
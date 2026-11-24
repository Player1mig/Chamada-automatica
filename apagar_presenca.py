import os
import sqlite3

BASE = os.path.dirname(os.path.abspath(__file__))
con = sqlite3.connect(os.path.join(BASE, "dados.db"))

print("1 - Apagar as presenças de hoje")
print("2 - Apagar todas as presenças")
print("3 - Apagar as presenças de uma pessoa")
opcao = input("Escolha: ").strip()

if opcao == "1":
    cur = con.execute(
        "DELETE FROM presencas "
        "WHERE date(data_hora, 'localtime') = date('now', 'localtime')"
    )
elif opcao == "2":
    cur = con.execute("DELETE FROM presencas")
elif opcao == "3":
    nome = input("Nome da pessoa (igual ao cadastro): ").strip()
    cur = con.execute(
        "DELETE FROM presencas WHERE pessoa_id IN "
        "(SELECT id FROM pessoas WHERE nome = ?)",
        (nome,),
    )
else:
    print("Opção inválida.")
    con.close()
    raise SystemExit

con.commit()
print(f"{cur.rowcount} presença(s) apagada(s).")
con.close()
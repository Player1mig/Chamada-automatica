const lista = document.getElementById("lista");
const vazio = document.getElementById("vazio");
const contador = document.getElementById("contador");
const buscaNome = document.getElementById("busca-nome");
const filtroSala = document.getElementById("filtro-sala");
const filtroPeriodo = document.getElementById("filtro-periodo");
const filtroData = document.getElementById("filtro-data");
const btnLimpar = document.getElementById("limpar");

let registros = [];

// tira acentos e maiúsculas: "José" e "jose" ficam iguais na busca
function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// 2026-11-23 -> 23/11/2026
function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// data de hoje (ou de alguns dias atrás) no formato 2026-11-23
function dataLocal(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// ordena as salas: 1°A, 1°B, 2°A... e "Sem sala" por último
function chaveSala(sala) {
  if (sala === "Sem sala") return [999, ""];
  const [serie, letra] = sala.split("°");
  return [parseInt(serie, 10), letra];
}

function compararSalas(a, b) {
  const [serieA, letraA] = chaveSala(a);
  const [serieB, letraB] = chaveSala(b);
  return serieA - serieB || letraA.localeCompare(letraB);
}

// texto onde a busca procura: nome + série ("3°b" e "3b")
function textoDeBusca(registro) {
  const sala = normalizar(registro.sala);
  return `${normalizar(registro.nome)} ${sala} ${sala.replace("°", "")}`;
}

function passaNoPeriodo(registro) {
  // se escolheu uma data específica, ela vale no lugar do período
  if (filtroData.value) return registro.data === filtroData.value;

  switch (filtroPeriodo.value) {
    case "hoje":
      return registro.data === dataLocal(0);
    case "7":
      return registro.data >= dataLocal(6);
    case "30":
      return registro.data >= dataLocal(29);
    default:
      return true;
  }
}

function criarCartao(registro) {
  const item = document.createElement("li");
  item.className = "cartao";

  const foto = document.createElement("img");
  foto.src = registro.foto;
  foto.alt = registro.nome;

  const id = document.createElement("span");
  id.className = "id";
  id.textContent = `#${registro.id}`;

  const nome = document.createElement("span");
  nome.className = "nome";
  nome.textContent = registro.nome;

  const sala = document.createElement("span");
  sala.className = "sala";
  sala.textContent = registro.sala;

  const hora = document.createElement("span");
  hora.className = "hora";
  hora.textContent = registro.hora;

  item.append(foto, id, nome, sala, hora);
  return item;
}

function montarFiltroSalas() {
  const salas = [...new Set(registros.map((r) => r.sala))].sort(compararSalas);
  salas.forEach((sala) => {
    const opcao = document.createElement("option");
    opcao.value = sala;
    opcao.textContent = sala;
    filtroSala.appendChild(opcao);
  });
}

function desenhar() {
  // cada palavra digitada precisa aparecer no nome ou na série
  const palavras = normalizar(buscaNome.value)
    .replace(/[°º]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const visiveis = registros.filter((r) => {
    const texto = textoDeBusca(r);
    if (!palavras.every((p) => texto.includes(p))) return false;
    if (filtroSala.value !== "todas" && r.sala !== filtroSala.value) return false;
    return passaNoPeriodo(r);
  });

  lista.innerHTML = "";
  vazio.classList.toggle("oculto", visiveis.length > 0);
  contador.textContent = `${visiveis.length} registro(s)`;

  // agrupa por dia (os registros já vêm do mais novo para o mais antigo)
  let dataAtual = null;
  let ul = null;

  visiveis.forEach((r) => {
    if (r.data !== dataAtual) {
      dataAtual = r.data;

      const titulo = document.createElement("h2");
      titulo.className = "titulo-data";
      titulo.textContent = formatarData(r.data);

      ul = document.createElement("ul");
      lista.append(titulo, ul);
    }
    ul.appendChild(criarCartao(r));
  });
}

async function carregarHistorico() {
  try {
    const resposta = await fetch("/api/historico");
    registros = await resposta.json();
    montarFiltroSalas();
    desenhar();
  } catch (erro) {
    console.error(erro);
    vazio.textContent = "Não foi possível carregar o histórico.";
    vazio.classList.remove("oculto");
  }
}

buscaNome.addEventListener("input", desenhar);
filtroSala.addEventListener("change", desenhar);
filtroPeriodo.addEventListener("change", desenhar);
filtroData.addEventListener("change", desenhar);

btnLimpar.addEventListener("click", () => {
  buscaNome.value = "";
  filtroSala.value = "todas";
  filtroPeriodo.value = "todos";
  filtroData.value = "";
  desenhar();
});

carregarHistorico();
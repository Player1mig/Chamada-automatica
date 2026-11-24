const lista = document.getElementById("lista");
const vazio = document.getElementById("vazio");
const filtro = document.getElementById("filtro-sala");

let pessoas = [];

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

function criarCartao(pessoa) {
  const item = document.createElement("li");
  item.className = "cartao";

  const foto = document.createElement("img");
  foto.src = pessoa.foto;
  foto.alt = pessoa.nome;

  const id = document.createElement("span");
  id.className = "id";
  id.textContent = `#${pessoa.id}`;

  const nome = document.createElement("span");
  nome.className = "nome";
  nome.textContent = pessoa.nome;

  const hora = document.createElement("span");
  hora.className = "hora";
  hora.textContent = pessoa.hora;

  item.append(foto, id, nome, hora);
  return item;
}

// monta as opções do filtro com as salas que existem, mantendo a escolhida
function atualizarFiltro() {
  const escolhida = filtro.value;
  const salas = [...new Set(pessoas.map((p) => p.sala))].sort(compararSalas);

  filtro.innerHTML = "";
  const todas = document.createElement("option");
  todas.value = "todas";
  todas.textContent = "Todas as salas";
  filtro.appendChild(todas);

  salas.forEach((sala) => {
    const opcao = document.createElement("option");
    opcao.value = sala;
    opcao.textContent = sala;
    filtro.appendChild(opcao);
  });

  filtro.value = salas.includes(escolhida) ? escolhida : "todas";
}

function desenhar() {
  lista.innerHTML = "";

  const visiveis = pessoas.filter(
    (p) => filtro.value === "todas" || p.sala === filtro.value
  );
  vazio.classList.toggle("oculto", visiveis.length > 0);

  // agrupa por sala
  const grupos = {};
  visiveis.forEach((p) => {
    if (!grupos[p.sala]) grupos[p.sala] = [];
    grupos[p.sala].push(p);
  });

  Object.keys(grupos).sort(compararSalas).forEach((sala) => {
    // nomes em ordem alfabética dentro de cada sala
    grupos[sala].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    const titulo = document.createElement("h2");
    titulo.className = "titulo-sala";
    titulo.textContent = `${sala} (${grupos[sala].length})`;

    const ul = document.createElement("ul");
    grupos[sala].forEach((p) => ul.appendChild(criarCartao(p)));

    lista.append(titulo, ul);
  });
}

async function carregarPresentes() {
  try {
    const resposta = await fetch("/api/presentes");
    pessoas = await resposta.json();
    atualizarFiltro();
    desenhar();
  } catch (erro) {
    console.error(erro);
    vazio.textContent = "Não foi possível carregar a lista.";
    vazio.classList.remove("oculto");
  }
}

filtro.addEventListener("change", desenhar);
carregarPresentes();
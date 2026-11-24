const video = document.getElementById("camera");
const mensagem = document.getElementById("mensagem");
const btnRegistrar = document.getElementById("registrar");
const btnReconhecimento = document.getElementById("reconhecimento");
const btnPresentes = document.getElementById("presentes");
const campoNome = document.getElementById("nome");

const fotoReconhecido = document.getElementById("foto-reconhecido");
const nomeReconhecido = document.getElementById("nome-reconhecido");
const idReconhecido = document.getElementById("id-reconhecido");
const statusReconhecido = document.getElementById("status-reconhecido");

function mostrar(texto, ok) {
  mensagem.style.color = ok ? "lightgreen" : "#ff6b6b";
  mensagem.textContent = texto;
}

function mostrarReconhecido(resultado) {
  if (resultado.ok && resultado.nome) {
    fotoReconhecido.src = resultado.foto;
    fotoReconhecido.classList.remove("oculto");
    nomeReconhecido.textContent = resultado.nome;
    idReconhecido.textContent = `ID: ${resultado.id}`;
    statusReconhecido.textContent = `${resultado.sala} - ${resultado.mensagem}`;
  } else {
    fotoReconhecido.classList.add("oculto");
    nomeReconhecido.textContent = "Ninguém reconhecido";
    idReconhecido.textContent = "";
    statusReconhecido.textContent = "";
  }
}

async function iniciarCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (erro) {
    mostrar("Não foi possível acessar a câmera. Verifique a permissão.", false);
    console.error(erro);
  }
}

// tira uma foto e devolve como arquivo
function capturarFoto() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function enviarFoto(rota, camposExtras) {
  if (!video.srcObject) {
    mostrar("A câmera não está ligada.", false);
    return null;
  }

  const dados = new FormData();
  dados.append("foto", await capturarFoto(), "foto.png");
  for (const [chave, valor] of Object.entries(camposExtras || {})) {
    dados.append(chave, valor);
  }

  try {
    const resposta = await fetch(rota, { method: "POST", body: dados });
    return await resposta.json();
  } catch (erro) {
    mostrar("Não foi possível falar com o servidor.", false);
    console.error(erro);
    return null;
  }
}

btnRegistrar.addEventListener("click", async () => {
  const nome = campoNome.value.trim();
  if (!nome) {
    mostrar("Digite o nome e a sala.", false);
    return;
  }

  const resultado = await enviarFoto("/registrar", { nome });
  if (!resultado) return;

  mostrar(resultado.mensagem || resultado.erro, resultado.ok);
  if (resultado.ok) campoNome.value = "";
});

btnReconhecimento.addEventListener("click", async () => {
  mostrar("Reconhecendo...", true);
  const resultado = await enviarFoto("/reconhecer");
  if (!resultado) return;

  mostrar(resultado.mensagem || resultado.erro, resultado.ok);
  mostrarReconhecido(resultado);
});

btnPresentes.addEventListener("click", () => {
  window.location.href = "/presentes.html";
});


document.getElementById("historico").addEventListener("click", () => {
  window.location.href = "/historico.html";
});
iniciarCamera();
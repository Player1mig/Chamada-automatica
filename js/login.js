document.getElementById("formLogin").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const senha = document.getElementById("senha").value;

  if (email === "teste@gmail.com" && senha === "1234") {
    window.location.href = "inicial.html";
  } else {
    document.getElementById("erro").textContent = "Email ou senha incorretos.";
  }
});
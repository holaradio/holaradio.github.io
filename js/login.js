document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const statusText = document.getElementById("login-status");

  const username = document.getElementById("username");
  const password = document.getElementById("password");

  username.addEventListener("invalid", function () {
    this.setCustomValidity("Du måste skriva in ett användarnamn!");
  });
  username.addEventListener("input", function () {
    this.setCustomValidity("");
  });

  password.addEventListener("invalid", function () {
    this.setCustomValidity("Lösenordet får inte vara tomt!");
  });
  password.addEventListener("input", function () {
    this.setCustomValidity("");
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault(); 

    const errors = [
      "Fel: Ogiltigt användarnamn eller lösenord (kod 4004).",
      "Fel: Väldigt ogiltigt. (kod 9009).",
    ];

    const randomError = errors[Math.floor(Math.random() * errors.length)];
    statusText.textContent = randomError;
    statusText.style.color = "red";
  });
});

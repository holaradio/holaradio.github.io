document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const status = document.getElementById("login-status");

  const felmeddelanden = [
    "Fel 3401: Databasen svarade inte. Försök igen senare.",
    "Fel 3487: Ogiltig sessionstoken.",
    "Fel 3520: Användarnamn hittades ej i katalogen.",
    "Fel 3629: Lösenordet kunde inte valideras.",
    "Fel 3711: Systemet är upptaget (för många användare inloggade)."
  ];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const slump = felmeddelanden[Math.floor(Math.random() * felmeddelanden.length)];
    status.textContent = slump;
    status.style.color = "red";
  });
});

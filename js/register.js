document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const feedback = document.getElementById("username-feedback");

  const felmeddelanden = [
    "Röjgen har redan valt det här användarnamnet. Testa ett annat.",
    "Tyvärr, Röjgen hann före med just det här namnet.",
    "Upptaget... av Röjgen.",
    "Det här namnet är tyvärr redan reserverat av Röjgen."
  ];

  usernameInput.addEventListener("input", () => {
    if (usernameInput.value.trim() !== "") {
      const randomMsg = felmeddelanden[Math.floor(Math.random() * felmeddelanden.length)];
      feedback.textContent = randomMsg;
    } else {
      feedback.textContent = "";
    }
  });
});

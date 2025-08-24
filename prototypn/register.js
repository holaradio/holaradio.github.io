document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const status = document.getElementById("register-status");

  const felmeddelanden = [
    "Fel 4102: Lösenordet upptaget... av Röjgen.",
    "Fel 4238: Ogiltig skostorlek.",
    "Fel 4377: Röjgen har redan valt den här skostorleken. ",
    "Fel 4490: Röjgen har redan valt det här efternamnet.",
    "Fel 4521: En annan användare (Röjgen) skapade just ett konto med det här användarnamnet.",
    "Fel 4659: Okänt fel inträffade. Vänligen försök igen senare."
  ];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const slump = felmeddelanden[Math.floor(Math.random() * felmeddelanden.length)];
    status.textContent = slump;
    status.style.color = "red";
  });
});

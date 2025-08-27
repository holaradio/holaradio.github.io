document.addEventListener("DOMContentLoaded", () => {
  const knappar = document.querySelectorAll(".kalender-knapp");

  knappar.forEach((knapp, index) => {
    const sparadStatus = localStorage.getItem("kalenderKnapp_" + index);
    if (sparadStatus === "tillagd") {
      knapp.textContent = "Ta bort från min kalender";
      knapp.classList.add("tabort");
    }

    knapp.addEventListener("click", () => {
      if (knapp.textContent === "Lägg till i min kalender") {
        knapp.textContent = "Ta bort från min kalender";
        knapp.classList.add("tabort");
        localStorage.setItem("kalenderKnapp_" + index, "tillagd");
      } else {
        knapp.textContent = "Lägg till i min kalender";
        knapp.classList.remove("tabort");
        localStorage.setItem("kalenderKnapp_" + index, "borttagen");
      }
    });
  });
});


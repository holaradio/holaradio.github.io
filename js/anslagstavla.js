document.addEventListener("DOMContentLoaded", () => {
  const tavla = document.getElementById("anslagstavla");

  // Förifyllda meddelanden
  const meddelanden = [
    {
      rubrik: "Stopp i toaletten i källaren",
      innehall: "...är det. Man behöver inte spola ner en hel toarulle varje gång.",
      avsandare: "Erfaren Vaktmästare"
    },
    {
      rubrik: "Nytt intranät lanserat!",
      innehall: "Om något verkar konstigt, rapportera till Rootmar.",
      avsandare: "Rootmar"
    },
    {
      rubrik: "Lösenord sökes",
      innehall: "14 tecken, varav inga bokstäver.",
      avsandare: "Röjgen"
    },
    {
      rubrik: "Borttappad nyckel",
      innehall: "Hemnyckeln",
      avsandare: "Röjgen"
    },
    {
      rubrik: "Nej, jag hittade den.",
      innehall: "Den var i fickan.",
      avsandare: "Röjgen"
    },
    {
      rubrik: "Vi saknar XLR-kablar",
      innehall: "Igen",
      avsandare: "Ljudd"
    }
  ];

  // Möjliga färger för lappar
  const lapColors = ["#fff8d6", "#ffe4e1", "#d8f8e1", "#e5f1ff", "#fffacd"];

  function visaMeddelanden() {
    tavla.innerHTML = "";
    meddelanden.forEach(medd => {
      const el = document.createElement("div");
      el.classList.add("meddelande");
      el.style.setProperty("--rotation", (Math.random() * 10 - 5) + "deg");
      el.style.setProperty("--lapcolor", lapColors[Math.floor(Math.random() * lapColors.length)]);

      el.innerHTML = `
        <h4>${medd.rubrik}</h4>
        <p>${medd.innehall}</p>
        <div class="avsandare">– ${medd.avsandare}</div>
      `;
      tavla.appendChild(el);
    });
  }

  visaMeddelanden();
});

document.addEventListener("DOMContentLoaded", () => {
  const styrelse = [
    {
      namn: "Bengt Yrvelström",
      roll: "Ordförande",
      telefon: "078-111 22 33",
      email: ""
    },
    {
      namn: "Eva Bálánbéna",
      roll: "Vice ordförande",
      telefon: "078-222 33 44, +976-11 22 33 590 (hem)",
      email: ""
    },
    {
      namn: "Röjgen",
      roll: "Kassör",
      telefon: "070-555 66 77",
      email: ""
    }
  ];

  const anstallda = [
    {
      namn: "Ljudd",
      roll: "Ljudtekniker",
      telefon: "079-333 44 55",
      email: ""
    },
    {
      namn: "Rootmar",
      roll: "IT-Tekniker",
      telefon: "079-444 55 66",
      email: ""
    },
    {
      namn: "Vaktmästarn",
      roll: "Vaktmästarn",
      telefon: "078-999 00 11",
      email: ""
    }
  ];

  const ovriga = [
    {
      namn: "Avloppsjouren",
      roll: "Vid stopp i avlopp",
      telefon: "071-12 22 11",
      email: ""
    },
    {
      namn: "Hôla bygg",
      roll: "Efter inbrytning",
      telefon: "074-88 88 88",
      email: ""
    }
  ];

  function skapaKort(person) {
    const kort = document.createElement("div");
    kort.classList.add("kontaktkort");
    kort.innerHTML = `
      <div>
        <h4>${person.namn}</h4>
        <div class="roll">${person.roll}</div>
        <p>📞 ${person.telefon}</p>
      </div>
    `;
    return kort;
  }

  const styrelseContainer = document.getElementById("styrelse-lista");
  const anstalldaContainer = document.getElementById("anstallda-lista");
  const ovrigaContainer = document.getElementById("ovriga-lista");


  styrelse.forEach(p => styrelseContainer.appendChild(skapaKort(p)));
  anstallda.forEach(p => anstalldaContainer.appendChild(skapaKort(p)));
  ovriga.forEach(p => ovrigaContainer.appendChild(skapaKort(p)));
});

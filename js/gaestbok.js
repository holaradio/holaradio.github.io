document.addEventListener("DOMContentLoaded", () => {
  const entriesContainer = document.getElementById("entries");
  const dataUrl = "/data/gaestbok.json"; 

  // === Hämta inlägg från JSON ===
  fetch(dataUrl)
    .then(response => {
      if (!response.ok) throw new Error("Kunde inte läsa gästboken.");
      return response.json();
    })
    .then(entries => {
      renderEntries(entries);
    })
    .catch(error => {
      entriesContainer.innerHTML = `<p class="error">Fel vid hämtning av inlägg: ${error.message}</p>`;
    });

  // === Funktion för att rendera inlägg ===
  function renderEntries(entries) {
    entriesContainer.innerHTML = ""; // töm gammalt innehåll

    entries.forEach(entry => {
      const div = document.createElement("div");
      div.classList.add("entry");
      div.innerHTML = `
        <div class="entry-header">
          <span class="entry-name">${entry.namn}</span>
          <span class="entry-date">${entry.datum}</span>
        </div>
        <p class="entry-text">${entry.text}</p>
      `;
      entriesContainer.appendChild(div);
    });
  }

  // === Fejkad "Skicka"-funktion ===
  const knapp = document.getElementById("skicka");
  knapp.addEventListener("click", () => {
    alert("Tack! Ditt inlägg har skickats för granskning av moderator Röjgen.");
  });
});

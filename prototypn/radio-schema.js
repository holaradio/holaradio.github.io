// radio-schema.js

// 🎙️ Programtablå
const programSchema = [
  // Måndag (1)
  { titel: 'Morgon med Majsan', dag: 1, tid: "06:00", duration: "60:00" },
  { titel: '"Laser i Lagårn" – Disko-Kurt', dag: 1, tid: "07:15", duration: "3:40" },
  { titel: 'Lokala Nyheter', dag: 1, tid: "08:00", duration: "10:00" },
  { titel: 'Eftermiddag i etern med Gun & Guran', dag: 1, tid: "16:30", duration: "60:00" },

  // Tisdag (2)
  { titel: 'Tisdagstango', dag: 2, tid: "07:00", duration: "30:00" },
  { titel: 'Kommunfullmäktige – Direkt', dag: 2, tid: "18:00", duration: "90:00" },
  
  // Onsdag (3)
  { titel: 'Hôla-nyset', dag: 3, tid: "15:37", duration: "5:43" },

  // Fredag (5)
  { titel: 'Fredagsfika i etern', dag: 5, tid: "10:00", duration: "45:00" },
  { titel: 'Nattmix med DJ Halm', dag: 5, tid: "22:00", duration: "120:00" },

  // Lördag (6)
  { titel: 'Lördagslugnt med Rune', dag: 6, tid: "09:00", duration: "60:00" },
  { titel: 'Dansbandsnatt', dag: 6, tid: "21:00", duration: "180:00" },
];

// 🎵 Slumpbara låtar vid mellanspel
const låtbibliotek = [
  { titel: '"Fjälltechno" – DJ Jämtbiten', duration: "4:10" },
  { titel: '"Folksynt" – Karin & Kretskortet', duration: "3:25" },
  { titel: '"Traktorrave i Grönköping" – DJ Glesbygd', duration: "5:00" },
  { titel: '"Bälg och Beats" – Dragspelarna 3000', duration: "3:55" },
  { titel: '"Hölasshouse" – DJ Halm', duration: "4:05" },
  { titel: '"Raggarragg på Rågbröd" – Majsan & Maskinparken', duration: "4:00" },
  { titel: '"Knätofs Dubstep" – ZätaZork', duration: "3:50" },
  { titel: '"Skörd och Skank" – LantReggae', duration: "4:20" },
  { titel: '"Disco i Duggregn" – Neondaggen', duration: "4:00" },
  { titel: '"VHS Visioner" – Retro-Rut', duration: "3:30" }
];

// ⏱ Hjälpfunktioner
function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function parseDuration(str) {
  const [m, s] = str.split(":").map(Number);
  return m + s / 60;
}

function formatSekunder(s) {
  const min = Math.floor(s / 60);
  const sek = Math.floor(s % 60).toString().padStart(2, "0");
  return `${min}:${sek}`;
}

// 🎧 Visar nuvarande spelning
function visaNuSpelas() {
  const nu = new Date();
  const dag = nu.getDay(); // 0 = Söndag
  const timmar = nu.getHours();
  const minuter = nu.getMinutes();
  const nuMin = timmar * 60 + minuter;
  const nuTid = nu.getTime();

  const element = document.getElementById("nu-spelas");

  const ärFredag = dag === 5;
  const ärLördag = dag === 6;
  const maxTid = (ärFredag || ärLördag) ? 1440 : 1440; // Fredag/lördag sändning dygnet runt
  const sändningPågår = nuMin >= 360 && nuMin < maxTid;

  if (!sändningPågår) {
    element.textContent = "🔇 Tystnad i etern – sändningen återupptas kl 06:00";
    localStorage.removeItem("aktuellLåt");
    return;
  }

  // 🎙️ Kontrollera om program pågår
  const aktivtProgram = programSchema.find(item => {
    if (item.dag !== dag) return false;
    const start = parseTime(item.tid);
    const slut = start + parseDuration(item.duration);
    return nuMin >= start && nuMin <= slut;
  });

  if (aktivtProgram) {
    element.textContent = `🎙️ Nu sänds: ${aktivtProgram.titel}`;
    localStorage.removeItem("aktuellLåt");
    return;
  }

  // 🎵 Hantera låtspelning
  const sparad = localStorage.getItem("aktuellLåt");
  if (sparad) {
    const { titel, startTid, duration } = JSON.parse(sparad);
    const tidSkillnad = (nuTid - startTid) / 1000; // sekunder
    const durationSek = parseDuration(duration) * 60;

    if (tidSkillnad < durationSek) {
      const återstår = formatSekunder(durationSek - tidSkillnad);
      element.textContent = `🎵 Nu spelas: ${titel} (${återstår} kvar)`;
      return;
    }
  }

  // 🎵 Slumpa ny låt
  const nyLåt = låtbibliotek[Math.floor(Math.random() * låtbibliotek.length)];
  const lagra = {
    titel: nyLåt.titel,
    startTid: nuTid,
    duration: nyLåt.duration
  };
  localStorage.setItem("aktuellLåt", JSON.stringify(lagra));
  element.textContent = `🎵 Nu spelas: ${nyLåt.titel} (${nyLåt.duration} kvar)`;
}

// 🔁 Uppdatera var 10:e sekund
setInterval(visaNuSpelas, 10000);
window.onload = visaNuSpelas;

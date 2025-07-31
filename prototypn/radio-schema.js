// radio-schema.js

// 🎙️ Programtablå
const programSchema = [
  // Måndag (1)
  { titel: 'Såga med Torbjernt', dag: 1, tid: "06:00", duration: "60:00" },
  
  // Tisdag (2)
  { titel: 'Fråga folket', dag: 2, tid: "14:07", duration: "10:00" },
   
  // Onsdag (3)
  { titel: 'Hôla-nyset', dag: 3, tid: "15:37", duration: "5:43" },

  // Fredag (5)
  { titel: 'Hôlas hemligheter', dag: 5, tid: "10:00", duration: "45:00" },

  // Lördag (6)
  { titel: 'Survivor', dag: 6, tid: "09:00", duration: "20:00" },
];

// 🎵 Slumpbara låtar vid mellanspel
const låtbibliotek = [
    { titel: '"Here I was" – Hairsmoke', duration: "4:10" },
	  { titel: '"Why was I here?" – Hairsmoke', duration: "3:25" },
	  { titel: '"Here I wasn\'t" – Hairsmoke', duration: "5:00" },
	  { titel: '"Why wasn\'t I here?" – Hairsmoke', duration: "3:55" },
	  { titel: '"Why?" – Hairsmoke', duration: "4:05" },
	  { titel: '"Where is my hair?" – Hairsmoke', duration: "3:15" },
	  { titel: '"My hair is where?" – Hairsmoke', duration: "6:10" },
	  { titel: '"Where wasn\'t my hair" – Hairsmoke', duration: "3:10" },
	  { titel: '"Why is my hair" – Hairsmoke', duration: "5:25" },
	  { titel: '"Hej, alla glada människor i staden" – Roy Nilsson', duration: "15:00" },
	  { titel: '"Hej, alla människor i staden (DJ Rexxmak Remix)" - DJ Rexxmak och Roy Nilsson', duration: "3:50" },
	  { titel: '"Hej, alla glada människor i Baden-Baden" – Roy Nilsson', duration: "4:20" },
	  { titel: '"Number Eight" – Pink Blue', duration: "3:15" },
	  { titel: '"Drop the beat" – DJ Rexxmak', duration: "4:12" },
	  { titel: '"Drop the bassdrum" – DJ Rexxmak', duration: "2:45" },
	  { titel: '"Drop the drop" – DJ Rexxmak', duration: "5:15" },
	  { titel: '"Dance" – DJ Rexxmak', duration: "4:11" },
	  { titel: '"It&#39;s lit" – DJ Rexxmak', duration: "3:00" },
	  { titel: '"Môbbar\'n bakom ICA" – Stig-Rolfbertz', duration: "20:00" },
	  { titel: '"Ryska karelen" – Curt III', duration: "4:20" },
	  { titel: '"Brus" – Curt III', duration: "3:00" },
	  { titel: '"Karelen, här är alla felen" – Curt III', duration: "1:00" },
	  { titel: '"Blipp" – Curt III', duration: "5:00" },
	  { titel: '"Whatch out for the animals" – DJ.ur', duration: "3:03" },
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
  const maxTid = (ärFredag || ärLördag) ? 1440 : 1260; // Fredag/lördag sändning dygnet runt
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

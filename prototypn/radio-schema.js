// radio-schema.js

// 🎙️ Programtablå
const programSchema = [
  // Söndag (0)
  { titel: 'Mjôla i Hôla (repris)', dag: 0, tid: "10:00", duration: "80:00" },
  { titel: 'En dag med (repris)', dag: 0, tid: "11:30", duration: "45:00" },
  { titel: 'Musikquizz med Uno Bogg (repris)', dag: 0, tid: "12:15", duration: "90:00" },
  { titel: 'Hôlas hemligheter (repris)', dag: 0, tid: "13:45", duration: "45:00" },
  { titel: 'Hôlas historia (repris)', dag: 0, tid: "14:30", duration: "90:00" },
  { titel: 'Intresseklubben (repris)', dag: 0, tid: "16:00", duration: "45:00" },
  { titel: 'Filosofiska rummet (repris)', dag: 0, tid: "16:45", duration: "45:00" },
	
  // Måndag (1)
  { titel: 'Såga med Torbjert', dag: 1, tid: "06:00", duration: "1:00" },
  { titel: 'Hôlamorgon', dag: 1, tid: "07:00", duration: "180:00" },
  { titel: 'Hôlanyset', dag: 1, tid: "10:00", duration: "5:00" },
  { titel: 'Evenemangstips', dag: 1, tid: "10:05", duration: "5:00" },
  { titel: 'Fråga folket', dag: 1, tid: "11:00", duration: "30:00" },
  { titel: 'Dagens citat', dag: 1, tid: "12:00", duration: "2:00" },
  { titel: 'En dag med', dag: 1, tid: "13:00", duration: "45:00" },
  { titel: 'Hôlatrafiken', dag: 1, tid: "14:30", duration: "3:00" },
  { titel: 'Hôlanyset', dag: 1, tid: "15:00", duration: "5:00" },
  { titel: 'Filmtips med Rogert Roggmeister', dag: 1, tid: "15:30", duration: "90:00" },
  { titel: 'Avslappning med Bengt', dag: 1, tid: "17:45", duration: "10:00" },
  { titel: 'Bypuls', dag: 1, tid: "18:15", duration: "3:00" },
  { titel: 'Mjôla i Hôla', dag: 1, tid: "18:18", duration: "40:00" },
  { titel: 'Hôlanyset', dag: 1, tid: "19:00", duration: "5:00" },
  { titel: 'Kvällsmackan med Stutbjörn', dag: 1, tid: "19:15", duration: "90:00" },
	
  // Tisdag (2)
  { titel: 'Såga med Torbjert', dag: 2, tid: "06:00", duration: "1:00" },
  { titel: 'Hôlamorgon', dag: 2, tid: "07:00", duration: "180:00" },
  { titel: 'Hôlanyset', dag: 2, tid: "10:00", duration: "5:00" },
  { titel: 'Kommunkvarten', dag: 2, tid: "10:05", duration: "10:00" },
  { titel: 'Filosofiska rummet', dag: 2, tid: "11:00", duration: "30:00" },
  { titel: 'Dagens citat', dag: 2, tid: "12:00", duration: "2:00" },
  { titel: 'Intresseklubben', dag: 2, tid: "13:00", duration: "45:00" },
  { titel: 'Hôlatrafiken', dag: 2, tid: "14:30", duration: "3:00" },
  { titel: 'Hôlanyset', dag: 2, tid: "15:00", duration: "5:00" },
  { titel: 'Hôlas historia', dag: 2, tid: "15:30", duration: "90:00" },
  { titel: 'Avslappning med Bengt', dag: 2, tid: "17:45", duration: "10:00" },
  { titel: 'Bypuls', dag: 2, tid: "18:15", duration: "3:00" },
  { titel: 'Quizza med Qvartluss', dag: 2, tid: "18:18", duration: "40:00" },
  { titel: 'Hôlanyset', dag: 2, tid: "19:00", duration: "5:00" },
  { titel: 'Kvällsmackan med Stutbjörn', dag: 2, tid: "19:15", duration: "90:00" },
   
  // Onsdag (3)
  { titel: 'Såga med Torbjert', dag: 3, tid: "06:00", duration: "1:00" },
  { titel: 'Hôlamorgon', dag: 3, tid: "07:00", duration: "180:00" },
  { titel: 'Hôlanyset', dag: 3, tid: "10:00", duration: "5:00" },
  { titel: 'Hur gör djur', dag: 3, tid: "10:05", duration: "10:00" },
  { titel: 'Fråga folket', dag: 3, tid: "11:00", duration: "30:00" },
  { titel: 'Dagens citat', dag: 3, tid: "12:00", duration: "2:00" },
  { titel: 'Hôlas hemligheter', dag: 3, tid: "13:00", duration: "45:00" },
  { titel: 'Hôlatrafiken', dag: 3, tid: "14:30", duration: "3:00" },
  { titel: 'Hôlanyset', dag: 3, tid: "15:00", duration: "5:00" },
  { titel: 'Bobbe och Bultens jobbdagbok', dag: 3, tid: "15:30", duration: "90:00" },
  { titel: 'Avslappning med Bengt', dag: 3, tid: "17:45", duration: "10:00" },
  { titel: 'Bypuls', dag: 3, tid: "18:15", duration: "3:00" },
  { titel: 'Antikviteter med Göran', dag: 3, tid: "18:18", duration: "42:00" },
  { titel: 'Hôlanyset', dag: 3, tid: "19:00", duration: "5:00" },
  { titel: 'Kvällsmackan med Stutbjörn', dag: 3, tid: "19:15", duration: "90:00" },

  // Torsdag (4)
  { titel: 'Såga med Torbjert', dag: 4, tid: "06:00", duration: "1:00" },
  { titel: 'Hôlamorgon', dag: 4, tid: "07:00", duration: "180:00" },
  { titel: 'Hôlanyset', dag: 4, tid: "10:00", duration: "5:00" },
  { titel: 'Listan med Grob Bakaxel', dag: 4, tid: "10:05", duration: "10:00" },
  { titel: 'Filosofiska rummet', dag: 4, tid: "11:00", duration: "30:00" },
  { titel: 'Dagens citat', dag: 4, tid: "12:00", duration: "2:00" },
  { titel: 'Vandring med Gregon till den andra sidan', dag: 4, tid: "13:00", duration: "45:00" },
  { titel: 'Hôlatrafiken', dag: 4, tid: "14:30", duration: "3:00" },
  { titel: 'Hôlanyset', dag: 4, tid: "15:00", duration: "5:00" },
  { titel: 'Survivor Hôla', dag: 4, tid: "15:30", duration: "90:00" },
  { titel: 'Avslappning med Bengt', dag: 4, tid: "17:45", duration: "10:00" },
  { titel: 'Bypuls', dag: 4, tid: "18:15", duration: "3:00" },
  { titel: 'Quizza med Qvartluss', dag: 4, tid: "18:18", duration: "40:00" },
  { titel: 'Hôlanyset', dag: 4, tid: "19:00", duration: "5:00" },
  { titel: 'Kvällsmackan med Stutbjörn', dag: 4, tid: "19:15", duration: "90:00" },

  // Fredag (5)
  { titel: 'Såga med Torbjert', dag: 5, tid: "06:00", duration: "1:00" },
  { titel: 'Hôlamorgon', dag: 5, tid: "07:00", duration: "180:00" },
  { titel: 'Hôlanyset', dag: 5, tid: "10:00", duration: "5:00" },
  { titel: 'Hur gör djur', dag: 5, tid: "10:05", duration: "10:00" },
  { titel: 'Fråga folket', dag: 5, tid: "11:00", duration: "30:00" },
  { titel: 'Dagens citat', dag: 5, tid: "12:00", duration: "2:00" },
  { titel: 'Orvban på vift', dag: 5, tid: "13:00", duration: "45:00" },
  { titel: 'Hôlatrafiken', dag: 5, tid: "14:30", duration: "3:00" },
  { titel: 'Hôlanyset', dag: 5, tid: "15:00", duration: "5:00" },
  { titel: 'Musikquiz med Uno Bogg', dag: 5, tid: "15:30", duration: "90:00" },
  { titel: 'Avslappning med Bengt', dag: 5, tid: "17:45", duration: "10:00" },
  { titel: 'Bypuls', dag: 5, tid: "18:15", duration: "3:00" },
  { titel: 'Mjôla i Hôla', dag: 5, tid: "18:18", duration: "40:00" },
  { titel: 'Veckan i backspegeln', dag: 5, tid: "19:00", duration: "10:00" },
  { titel: 'Kvällsmackan med Stutbjörn', dag: 5, tid: "19:15", duration: "90:00" },
  { titel: 'Surr på Sunkens', dag: 5, tid: "21:30", duration: "150:00" },

  // Lördag (6)
  { titel: 'Lördagskaffe med Karotus och gäster', dag: 6, tid: "09:00", duration: "180:00" },
  { titel: 'Fråga folket (repris)', dag: 6, tid: "15:00", duration: "90:00" },
  { titel: 'Survivor Hôla (repris)', dag: 6, tid: "17:00", duration: "90:00" },
  { titel: 'Bobbe och Bultens jobbdagbok (repris)', dag: 6, tid: "18:45", duration: "90:00" },
  { titel: 'Lördagsvinylen i vinkylen med Uno Bogg och gäster', dag: 6, tid: "21:00", duration: "180:00" },
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

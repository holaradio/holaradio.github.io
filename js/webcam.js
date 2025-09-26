document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("webcam-canvas");
  const ctx = canvas.getContext("2d");
  const statusDiv = document.getElementById("webcam-status");

  const baseImage = new Image();
  baseImage.src = "images/skog.jpeg"; 
  const updateInterval = 20000; 
  const fps = 2000;

  let weather = null; // aktivt väder just nu (null, "rain", "snow")
  let weatherDuration = 0;

  baseImage.onload = () => {
    updateWebcam(); 
    setInterval(updateWebcam, updateInterval);
  };

  function updateWebcam() {
    // Rita basbild
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // Ljussättning efter tid
    applyDaylight();

    // Eventuellt väder
    updateWeather();

    // Stream overlay
    drawOverlay();

    // Statusfält
    const now = new Date();
    const timestamp = now.toLocaleTimeString("sv-SE");
    const viewers = 10 + Math.floor(Math.random() * 50); // slumpade tittare

    statusDiv.textContent =
      `Senast uppdaterad: ${timestamp} | Uppdateringsintervall: ${updateInterval/1000}s | FPS: ${fps} | Tittare: ${viewers}`;
  }

  function applyDaylight() {
    const now = new Date();
    const hour = now.getHours();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let brightness = 1;
    let tint = [0,0,0];

    if (hour >= 22 || hour < 6) {
      brightness = 0.4; // natt
      tint = [20, 30, 60]; // blåton
    } else if (hour >= 6 && hour < 9) {
      brightness = 0.8;
      tint = [80, 70, 40]; // varm morgonton
    } else if (hour >= 18 && hour < 22) {
      brightness = 0.7;
      tint = [60, 50, 80]; // skymning
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = Math.min(255, data[i] * brightness + tint[0]);
      data[i + 1] = Math.min(255, data[i + 1] * brightness + tint[1]);
      data[i + 2] = Math.min(255, data[i + 2] * brightness + tint[2]);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function updateWeather() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1–12

    // Starta nytt väder slumpmässigt
    if (!weather && Math.random() < 0.1) {
      if (month >= 11 || month <= 2) {
        weather = "snow"; // vinter
      } else if (month >= 4 && month <= 9) {
        weather = "rain"; // vår–sommar–tidig höst
      }
      if (weather) weatherDuration = 3 + Math.floor(Math.random() * 5); // varar 3–7 uppdateringar
    }

    // Rita väder om aktivt
    if (weather === "rain") drawRain();
    if (weather === "snow") drawSnow();

    // Minska duration
    if (weather) {
      weatherDuration--;
      if (weatherDuration <= 0) weather = null;
    }
  }

  function drawRain() {
    ctx.strokeStyle = "rgba(200,200,255,0.6)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y + 10);
      ctx.stroke();
    }
  }

  function drawSnow() {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawOverlay() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(5, canvas.height - 25, 120, 20);

    ctx.fillStyle = "#0f0";
    ctx.font = "12px Courier New";
    ctx.fillText("HôlaCam-2003", 10, canvas.height - 10);
  }
});

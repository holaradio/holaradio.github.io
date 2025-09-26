document.addEventListener("DOMContentLoaded", () => {
  const images = ["images/skog.jpg"];

  const webcamImage = document.getElementById("webcam-image");
  const statusDiv = document.getElementById("webcam-status");

  let index = 0;
  const updateInterval = 5000; // ms (5 sekunder)
  const fps = 1; // fejkad FPS

  function updateWebcam() {
    index = (index + 1) % images.length;
    webcamImage.src = images[index] + "?t=" + new Date().getTime(); 
    // cache-busting för att tvinga omladdning

    const now = new Date();
    const timestamp = now.toLocaleTimeString("sv-SE");

    statusDiv.textContent =
      `Senast uppdaterad: ${timestamp} | Uppdateringsintervall: ${updateInterval/1000}s | FPS: ${fps}`;
  }

  // Första uppdateringen direkt
  updateWebcam();
  // Sedan varje x sekunder
  setInterval(updateWebcam, updateInterval);
});

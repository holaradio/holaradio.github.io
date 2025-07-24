document.addEventListener("DOMContentLoaded", function () {
  const statusText = document.querySelector(".radio-player .status-text");
  const playButton = document.querySelector(".radio-player .play");
  const pauseButton = document.querySelector(".radio-player .pause");
  const backButton = document.querySelector(".radio-player .back");
  const stopButton = document.querySelector(".radio-player .stop");
  const volumeButton = document.querySelector(".radio-player .volume");


  if (playButton) {
    playButton.addEventListener("click", () => {
      statusText.textContent = "Fel: Strömmen kunde inte initieras (kod 0x9737). Försök igen senare.";
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      statusText.textContent = "Fel: Du kan inte pausa tystnad (kod 5719). Du måste starta strömmen först.";
    });
  }
  
  if (backButton) {
    backButton.addEventListener("click", () => {
      statusText.textContent = "Fel: Tillbaka till? (kod 2385)";
    });
  }
  
   if (stopButton) {
    stopButton.addEventListener("click", () => {
      statusText.textContent = "Fel: Du kan inte hindra den ström som inte rinner (kod 8869). Du måste starta strömmen först.";
    });
   }
    
   if (volumeButton) {
    volumeButton.addEventListener("click", () => {
      statusText.textContent = "Volym finns (4000/10000)";
    });
   }


});
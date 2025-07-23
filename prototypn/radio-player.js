document.addEventListener("DOMContentLoaded", function () {
  const playButton = document.querySelector(".radio-player .play");
  const statusText = document.querySelector(".radio-player .status-text");

  playButton.addEventListener("click", () => {
    statusText.textContent = "Fel: Strömmen kunde inte initieras (kod 0x9737). Försök igen senare.";
  });
});
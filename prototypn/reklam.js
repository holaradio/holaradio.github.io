document.addEventListener("DOMContentLoaded", () => {
  const banners = [
    "/images/murres_reklam.png",
    "/images/dustmanns_reklam.png",
    "/images/ewerts_reklam.png"
  ];

  const bannerImg = document.getElementById("banner-img");
  let index = 0;

  setInterval(() => {
    index = (index + 1) % banners.length; // loopa runt
    bannerImg.src = banners[index];
  }, 10000); // 30 sekunder
});
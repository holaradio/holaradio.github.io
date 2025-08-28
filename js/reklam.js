document.addEventListener("DOMContentLoaded", () => {
  const banners = [
    "/images/murres_reklam2.jpg",
    "/images/dustmanns_reklam.png",
    "/images/bullens_reklam.jpg",
    "/images/ewerts_reklam.png"
  ];

  const bannerImg = document.getElementById("banner-img");
  let index = 0;

  setInterval(() => {
    index = (index + 1) % banners.length; // loopa runt
    bannerImg.src = banners[index];
  }, 10000); // 30 sekunder
});
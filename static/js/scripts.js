document.addEventListener("DOMContentLoaded", function () {
  const carousels = document.querySelectorAll(".carousel-container");

  carousels.forEach((carousel) => {
    let isDown = false;
    let startX;
    let scrollLeft;

    // 📌 Quand on appuie pour scroller
    carousel.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener("mouseleave", () => {
      isDown = false;
    });

    carousel.addEventListener("mouseup", () => {
      isDown = false;
    });

    carousel.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 2; // Vitesse du scroll
      carousel.scrollLeft = scrollLeft - walk;
    });

    // 📌 Activation du swipe sur mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      let diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        // Si on swipe à gauche/droite, on déplace le scroll
        carousel.scrollLeft += diff * 2;
      }
    });
  });
});

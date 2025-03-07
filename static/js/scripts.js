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

document.addEventListener("DOMContentLoaded", function () {
  const plantIcons = document.querySelectorAll(".plant-icon");
  const infoBox = document.getElementById("info-box");
  const infoTitle = document.getElementById("info-title");
  const infoScientific = document.getElementById("info-scientifique");
  const closeBtn = document.getElementById("close-info");

  plantIcons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const plantId = this.dataset.id;

      infoTitle.textContent = "Chargement...";
      infoScientific.textContent = "";

      fetch(`/plante_info/${plantId}`)
        .then((response) => response.json())
        .then((data) => {
          infoTitle.textContent = data.nom;
          infoScientific.textContent =
            data.nom_scientifique || "Nom scientifique inconnu";

          // 🔄 Mise à jour du calendrier
          updateCalendar(data.cueillette, data.plantation);
        })
        .catch((error) => {
          console.error("Erreur :", error);
        });

      // Afficher la section d'information
      infoBox.classList.add("visible");
    });
  });

  document.addEventListener("click", function (event) {
    if (
      !infoBox.contains(event.target) &&
      !event.target.classList.contains("plant-icon")
    ) {
      infoBox.classList.remove("visible");
    }
  });

  // Fonction pour mettre à jour le calendrier
  function updateCalendar(cueillette, plantation) {
    // 🔹 Sélectionne toutes les cellules de calendrier (deux lignes)
    const rows = document.querySelectorAll(".calendar-row");

    // 🔹 Sélectionne la première ligne (plantation) et la deuxième (cueillette)
    const plantationCells = rows[0].querySelectorAll(".month");
    const cueilletteCells = rows[1].querySelectorAll(".month");

    // 🔹 Nettoie les classes précédentes
    plantationCells.forEach((cell, index) => {
      cell.classList.remove("plantation", "cueillette");
      if (plantation.includes(index + 1)) {
        cell.classList.add("plantation");
      }
    });

    cueilletteCells.forEach((cell, index) => {
      cell.classList.remove("plantation", "cueillette");
      if (cueillette.includes(index + 1)) {
        cell.classList.add("cueillette");
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".plant-icon").forEach((icon) => {
    let posX = icon.getAttribute("data-x");
    let posY = icon.getAttribute("data-y");

    icon.style.left = `${posX}px`;
    icon.style.top = `${posY}px`;
  });
});

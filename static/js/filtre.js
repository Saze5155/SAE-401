document.addEventListener("DOMContentLoaded", function () {
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const closeFiltersBtn = document.getElementById("close-filters");
  const cancelFiltersBtn = document.getElementById("cancel-filters");
  const filtersPanel = document.getElementById("filters-panel");
  const activeFiltersContainer = document.getElementById("active-filters");

  let selectedFilters = {
    type: "",
    exposition: "",
    entretien: "",
  };

  // ✅ Ouvrir et fermer la fenêtre des filtres
  document
    .getElementById("toggle-filters")
    .addEventListener("click", function () {
      filtersPanel.style.display = "block";
    });

  closeFiltersBtn.addEventListener("click", function () {
    filtersPanel.style.display = "none";
  });

  cancelFiltersBtn.addEventListener("click", function () {
    filtersPanel.style.display = "none";
  });

  // ✅ Gérer la sélection/désélection des filtres
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const filterType = this.dataset.type
        ? "type"
        : this.dataset.exposition
        ? "exposition"
        : "entretien";

      if (selectedFilters[filterType] === this.dataset[filterType]) {
        selectedFilters[filterType] = ""; // Désélectionner si déjà actif
        this.classList.remove("active");
      } else {
        filterButtons.forEach((btn) => {
          if (btn.dataset[filterType]) btn.classList.remove("active");
        });

        selectedFilters[filterType] = this.dataset[filterType]; // Sélectionner
        this.classList.add("active");
      }
    });
  });

  // ✅ Appliquer les filtres et mettre à jour la liste des plantes
  applyFiltersBtn.addEventListener("click", function () {
    updatePlants();
    updateActiveFilters(); // Met à jour l'affichage des filtres actifs
    filtersPanel.style.display = "none"; // Ferme la fenêtre des filtres
  });

  // ✅ Mise à jour des plantes avec les filtres actifs
  function updatePlants() {
    const searchValue = searchInput.value.trim();
    const { type, exposition, entretien } = selectedFilters;

    fetch(
      `/flore?search=${encodeURIComponent(
        searchValue
      )}&type=${encodeURIComponent(type)}&exposition=${encodeURIComponent(
        exposition
      )}&entretien=${encodeURIComponent(entretien)}`,
      {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const plantContainer = document.querySelector(".plantes-container");

        if (!plantContainer) {
          console.error("Erreur : Élément .plantes-container non trouvé.");
          return;
        }

        plantContainer.innerHTML = "";

        if (data.length === 0) {
          plantContainer.innerHTML = "<p>Aucune plante trouvée.</p>";
          return;
        }

        let groupedPlants = {};
        data.forEach((plante) => {
          if (!groupedPlants[plante.type]) {
            groupedPlants[plante.type] = [];
          }
          groupedPlants[plante.type].push(plante);
        });

        for (const [type, plantes] of Object.entries(groupedPlants)) {
          const section = document.createElement("div");
          section.innerHTML = `<h2>${type}</h2><div class="plante-grid"></div>`;
          const grid = section.querySelector(".plante-grid");

          plantes.forEach((plante) => {
            const plantCard = document.createElement("a");
            plantCard.href = `/plante/${plante.id}`;
            plantCard.classList.add("plante-card");
            plantCard.innerHTML = `
                <img src="/static/${plante.image_url}" alt="${plante.nom}">
                <h3>${plante.nom}</h3>
            `;
            grid.appendChild(plantCard);
          });

          plantContainer.appendChild(section);
        }
      })
      .catch((error) =>
        console.error("Erreur lors du chargement des plantes :", error)
      );
  }

  // ✅ Mettre à jour l'affichage des filtres actifs sous la barre de recherche
  function updateActiveFilters() {
    activeFiltersContainer.innerHTML = ""; // Nettoyer avant d'ajouter les filtres

    Object.keys(selectedFilters).forEach((key) => {
      if (selectedFilters[key]) {
        const filterTag = document.createElement("div");
        filterTag.classList.add("active-filter");
        filterTag.innerHTML = `
            ${selectedFilters[key]} 
            <button class="remove-filter" data-filter="${key}">❌</button>
        `;
        activeFiltersContainer.appendChild(filterTag);
      }
    });

    // ✅ Gérer la suppression d'un filtre individuel
    document.querySelectorAll(".remove-filter").forEach((button) => {
      button.addEventListener("click", function () {
        const filterType = this.dataset.filter;
        selectedFilters[filterType] = ""; // Réinitialiser le filtre
        updateActiveFilters(); // Mettre à jour l'affichage des filtres actifs
        updatePlants(); // Rafraîchir les résultats
      });
    });
  }

  // ✅ Recherche avec le bouton loupe
  searchBtn.addEventListener("click", updatePlants);
  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      updatePlants();
    }
  });
});

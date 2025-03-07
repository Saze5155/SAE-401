document.addEventListener("DOMContentLoaded", function () {
  const plantSlots = document.querySelectorAll(".plant-slot");
  const plantSelection = document.getElementById("plant-selection");
  const plantOptions = document.querySelectorAll(".plant-option");
  const validateVoteBtn = document.getElementById("validate-vote");
  const imgVoteResult = document.getElementById("vote-result-img");
  let selectedSlot = null;
  let selectedPlants = {};

  // Ouvre la sélection de plantes lorsqu'on clique sur un slot
  plantSlots.forEach((slot) => {
    slot.addEventListener("click", function (event) {
      selectedSlot = this;
      plantSelection.classList.add("visible");
      event.stopPropagation(); // Empêche la fermeture immédiate
    });
  });

  // Remplace complètement le bouton + par l'image de la plante sélectionnée
  plantOptions.forEach((option) => {
    option.addEventListener("click", function () {
      const plantId = this.dataset.plantId;
      const plantImgSrc = this.querySelector("img").src;
      const slotId = selectedSlot.dataset.slot;

      // Crée une nouvelle image qui va remplacer le bouton +
      const plantImage = document.createElement("img");
      plantImage.src = plantImgSrc;
      plantImage.alt = "Plante sélectionnée";
      plantImage.style.width = "40px";
      plantImage.style.height = "40px";
      plantImage.style.borderRadius = "50%";
      plantImage.style.position = "absolute";
      plantImage.style.left = selectedSlot.style.left;
      plantImage.style.top = selectedSlot.style.top;

      // Remplace complètement le bouton + en supprimant l'ancien élément
      selectedSlot.parentNode.replaceChild(plantImage, selectedSlot);
      selectedSlot.dataset.selectedPlant = plantId;
      selectedPlants[slotId] = plantId;
      console.log(selectedPlants);
      // Cache la fenêtre de sélection
      plantSelection.classList.remove("visible");
    });
  });

  validateVoteBtn.addEventListener("click", function () {
    fetch("/vote-register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ votes: selectedPlants }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          imgVoteResult.classList.add("visible");
        } else {
          alert("Erreur : " + data.error);
        }
      });
  });

  // Ferme la sélection si on clique en dehors
  document.addEventListener("click", function (event) {
    if (
      !plantSelection.contains(event.target) &&
      !event.target.classList.contains("plant-slot")
    ) {
      plantSelection.classList.remove("visible");
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const voteForm = document.getElementById("vote-form");
  const voteStatus = document.getElementById("vote-status");
  const finVoteBtn = document.getElementById("finaliser-vote");

  if (voteForm) {
    // Lancer un vote
    voteForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const jardin = document.getElementById("jardin").value;
      const duree = document.getElementById("duree").value;

      fetch("/admin/start_vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jardin, duree }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message);
          loadVotes();
        });
    });

    // Charger les votes en temps réel
    function loadVotes() {
      fetch("/admin/get_votes")
        .then((response) => response.json())
        .then((data) => {
          voteStatus.innerHTML = "";
          data.forEach((vote) => {
            voteStatus.innerHTML += `<p>🟢 Emplacement ${vote.slot}: ${vote.nom} (${vote.votes} votes)</p>`;
          });
        });
    }

    loadVotes(); // Charger les votes dès l'ouverture de la page
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const countdownElement = document.getElementById("countdown");

  function updateCountdown() {
    fetch("/temps_restant")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          countdownElement.textContent = "Aucun vote en cours";
          return;
        }

        const finVote = new Date(data.fin_vote);
        const interval = setInterval(() => {
          const now = new Date();
          const timeLeft = finVote - now;

          if (timeLeft <= 0) {
            clearInterval(interval);
            countdownElement.textContent = "Vote terminé !";
          } else {
            const heures = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor(
              (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
            );
            const secondes = Math.floor((timeLeft % (1000 * 60)) / 1000);

            countdownElement.textContent = `Temps restant : ${heures}h ${minutes}m ${secondes}s`;
          }
        }, 1000);
      })
      .catch((error) =>
        console.error(
          "Erreur lors de la récupération du temps restant :",
          error
        )
      );
  }

  updateCountdown(); // Lancer immédiatement
});

document.addEventListener("DOMContentLoaded", function () {
  fetch("/check-vote")
    .then((response) => response.json())
    .then((data) => {
      if (data.active) {
        console.log(data.active);
        document.getElementById("validate-vote").style.visibility = "visible";
      } else {
        document.getElementById("validate-vote").style.visibility = "hidden";
      }
    })
    .catch((error) =>
      console.error("Erreur lors de la vérification du vote :", error)
    );
});

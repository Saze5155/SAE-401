// 📷 Accéder à la caméra
const camera = document.getElementById("camera");
const canvas = document.getElementById("photo-canvas");
const capturedPhoto = document.getElementById("captured-photo");
const captureBtn = document.getElementById("capture-btn");
const retryBtn = document.getElementById("retry-btn");
const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");
const closePopup = document.getElementById("close-popup");
const resultContainer = document.getElementById("result");
const detailsBtn = document.getElementById("details-btn");

let videoStream = null;

// 📸 Activer la caméra
async function startCamera() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    camera.srcObject = videoStream;
  } catch (error) {
    console.error("Erreur lors de l'accès à la caméra :", error);
  }
}

// 🎯 Capturer l’image et l'envoyer pour analyse
captureBtn.addEventListener("click", () => {
  const context = canvas.getContext("2d");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  // Convertir l'image en blob
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("photo", blob, "photo.png");

    try {
      // 📤 Envoyer l’image à Flask
      const response = await fetch("/identify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // 🖼️ Afficher la photo capturée
      capturedPhoto.src = URL.createObjectURL(blob);
      capturedPhoto.style.display = "block";
      camera.style.display = "none";
      captureBtn.style.display = "none";
      retryBtn.style.display = "block";

      // 🎉 Afficher le pop-up avec les résultats
      if (data.success) {
        resultContainer.innerHTML = `<strong>${data.nom_fr}</strong> (${data.nom_scientifique})`;
        detailsBtn.style.display = data.in_database ? "block" : "none";
        detailsBtn.onclick = () =>
          (window.location.href = `/plante/${data.plante_id}`);
      } else {
        resultContainer.innerHTML = "Aucune plante reconnue.";
        detailsBtn.style.display = "none";
      }

      popup.style.display = "flex";
    } catch (error) {
      console.error("Erreur d'analyse :", error);
    }
  }, "image/png");
});

// 🔄 Reprendre une photo
retryBtn.addEventListener("click", () => {
  capturedPhoto.style.display = "none";
  camera.style.display = "block";
  captureBtn.style.display = "block";
  retryBtn.style.display = "none";
});

// ❌ Fermer le pop-up
closePopup.addEventListener("click", () => {
  popup.style.display = "none";
});

// 📹 Démarrer la caméra
startCamera();

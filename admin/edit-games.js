let games = [];
let editingIndex = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements with null checks
  const slowDayOnly = document.getElementById("slowDayOnly");
  const trustedOnly = document.getElementById("trustedOnly");
  const maxTableSize = document.getElementById("maxTableSize");
  const conditionRating = document.getElementById("conditionRatingValue");
  const staffPicks = document.getElementById("staffPicks");
  const gameList = document.getElementById("gameList");
  const searchBar = document.getElementById("searchBar");
  const gameModal = document.getElementById("gameModal");
  const gameForm = document.getElementById("gameForm");
  const addGameButton = document.getElementById("addGameButton");
  const closeModalButton = document.getElementById("closeModal");
  
  // Check if addGameButton exists before adding event listener
  if (addGameButton) {
    addGameButton.addEventListener('click', function() {
      openModal(); // Open modal for new game
    });
  }
  
  // Close modal functionality
  if (closeModalButton) {
    closeModalButton.addEventListener('click', function() {
      if (gameModal) gameModal.style.display = "none";
    });
  }
  
  // Close modal when clicking outside
  if (gameModal) {
    gameModal.addEventListener('click', function(e) {
      if (e.target === gameModal) {
        gameModal.style.display = "none";
      }
    });
  }

const API_BASE = "https://bradspelsmeny-backend-production.up.railway.app";

  function deleteGame(index) {
    const gameId = games[index].id;
    fetch(`${API_BASE}/games/${gameId}`, {
      method: "DELETE"
    })
    .then(res => {
      return res.json();
    })
    .then(() => {
      fetchGames(); // refresh list
    })
    .catch(err => {
      alert("Något gick fel vid radering.");
      console.error(err);
    });
  }

  function updateStars(rating) {
    document.querySelectorAll("#conditionRating .star").forEach(star => {
      const val = parseInt(star.dataset.value);
      star.classList.toggle("filled", val <= rating);
    });
  }

  // Add star rating event listeners with null check
  const starElements = document.querySelectorAll("#conditionRating .star");
  if (starElements.length > 0) {
    starElements.forEach(star => {
      star.addEventListener("click", () => {
        const rating = parseInt(star.dataset.value);
        const conditionRatingValue = document.getElementById("conditionRatingValue");
        if (conditionRatingValue) {
          conditionRatingValue.value = rating;
          updateStars(rating);
        }
      });
    });
  }

  function openModal(index = null) {
    if (!gameModal) return;
    
    editingIndex = index;
    const isNew = index === null;
    
    // Set form title
    const formTitle = document.getElementById("formTitle");
    if (formTitle) {
      formTitle.textContent = isNew ? "Lägg till nytt spel" : "Redigera spel";
    }
    
    if (isNew) {
      // Clear form for new game
      if (gameForm) gameForm.reset();
      const editingIndexField = document.getElementById("editingIndex");
      if (editingIndexField) editingIndexField.value = "";
      updateStars(0);
    } else {
      // Populate form with existing game data
      const game = games[index];
      const editingIndexField = document.getElementById("editingIndex");
      if (editingIndexField) editingIndexField.value = game.id;
      
      // Map the correct field IDs from your HTML
      const titleField = document.getElementById("title");
      if (titleField) titleField.value = game.title || "";
      
      const descSvField = document.getElementById("descSv");
      if (descSvField) descSvField.value = game.desc_sv || "";
      
      const descEnField = document.getElementById("descEn");
      if (descEnField) descEnField.value = game.desc_en || "";
      
      const playersField = document.getElementById("players");
      if (playersField) playersField.value = game.players || "";
      
      const timeField = document.getElementById("time");
      if (timeField) timeField.value = game.time || "";
      
      const ageField = document.getElementById("age");
      if (ageField) ageField.value = game.age || "";
      
      const tagsField = document.getElementById("tags");
      if (tagsField) tagsField.value = (game.tags || []).join(", ");
      
      const imgField = document.getElementById("img");
      if (imgField) imgField.value = game.img || "";
      
      const rulesField = document.getElementById("rules");
      if (rulesField) rulesField.value = game.rules || "";
      
      if (slowDayOnly) slowDayOnly.checked = !!game.slow_day_only;
      if (trustedOnly) trustedOnly.checked = !!game.trusted_only;
      if (maxTableSize) maxTableSize.value = game.max_table_size || "";
      
      const conditionRatingValue = document.getElementById("conditionRatingValue");
      if (conditionRatingValue) conditionRatingValue.value = game.condition_rating || "";
      updateStars(game.condition_rating || 0);
      
      if (staffPicks) staffPicks.value = (game.staff_picks || []).join(", ");
    }
    
    // Clear file inputs
    const imgFileField = document.getElementById("imgFile");
    const rulesFileField = document.getElementById("rulesFile");
    if (imgFileField) imgFileField.value = "";
    if (rulesFileField) rulesFileField.value = "";
    
    gameModal.style.display = "flex";
  }

  if (gameForm) {
    gameForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const formData = new FormData();
      const imgFileField = document.getElementById("imgFile");
      const rulesFileField = document.getElementById("rulesFile");
      const imgFile = imgFileField ? imgFileField.files[0] : null;
      const rulesFile = rulesFileField ? rulesFileField.files[0] : null;
      
      // Add form fields to FormData using correct field IDs
      const titleField = document.getElementById("title");
      const descSvField = document.getElementById("descSv");
      const descEnField = document.getElementById("descEn");
      const playersField = document.getElementById("players");
      const timeField = document.getElementById("time");
      const ageField = document.getElementById("age");
      const tagsField = document.getElementById("tags");
      const imgUrlField = document.getElementById("img");
      const rulesUrlField = document.getElementById("rules");
      
      if (titleField) formData.append("title", titleField.value);
      if (descSvField) formData.append("desc_sv", descSvField.value);
      if (descEnField) formData.append("desc_en", descEnField.value);
      if (playersField) formData.append("players", playersField.value);
      if (timeField) formData.append("time", timeField.value);
      if (ageField) formData.append("age", ageField.value);
      if (tagsField) formData.append("tags", tagsField.value);
      if (imgUrlField) formData.append("img", imgUrlField.value);
      if (rulesUrlField) formData.append("rules", rulesUrlField.value);
      
      if (imgFile) formData.append("imgFile", imgFile);
      if (rulesFile) formData.append("rulesFile", rulesFile);
      
      if (slowDayOnly) formData.append("slow_day_only", slowDayOnly.checked ? 1 : 0);
      if (trustedOnly) formData.append("trusted_only", trustedOnly.checked ? 1 : 0);
      if (maxTableSize) formData.append("max_table_size", maxTableSize.value);
      if (conditionRating) formData.append("condition_rating", conditionRating.value);
      if (staffPicks) formData.append("staff_picks", staffPicks.value);
      
      const editingIndexField = document.getElementById("editingIndex");
      const gameId = editingIndexField ? editingIndexField.value : "";
      const isNew = gameId === "";
      const method = isNew ? "POST" : "PUT";
      const url = isNew
        ? `${API_BASE}/games`
        : `${API_BASE}/games/${gameId}`;
      
      try {
        const res = await fetch(url, {
          method,
          body: formData
        });
        
        if (res.ok) {
          if (gameModal) gameModal.style.display = "none";
          if (typeof fetchGames === 'function') fetchGames(); // refresh list
        } else {
          alert("Något gick fel vid sparande.");
        }
      } catch (err) {
        alert("Något gick fel vid sparande.");
        console.error(err);
      }
    };
  }

  // Make functions globally accessible
  window.openModal = openModal;
  window.deleteGame = deleteGame;
  window.updateStars = updateStars;
});

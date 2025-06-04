let games = [];
let editingIndex = null;
const slowDayOnly = document.getElementById("slowDayOnly");
const trustedOnly = document.getElementById("trustedOnly");
const maxTableSize = document.getElementById("maxTableSize");
const conditionRating = document.getElementById("conditionRatingValue");
const staffPicks = document.getElementById("staffPicks");
const API_BASE = "https://bradspelsmeny-backend-production.up.railway.app";
const gameList = document.getElementById("gameList");
const searchBar = document.getElementById("searchBar");
const gameModal = document.getElementById("gameModal");
const gameForm = document.getElementById("gameForm");

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
  document.querySelectorAll(".star-rating .star").forEach(star => {
    const val = parseInt(star.dataset.value);
    star.classList.toggle("filled", val <= rating);
  });
}

document.querySelectorAll(".star-rating .star").forEach(star => {
  star.addEventListener("click", () => {
    const rating = parseInt(star.dataset.value);
    conditionRating.value = rating;
    updateStars(rating);
  });
});

function openModal(index = null) {
  editingIndex = index;
  const isNew = index === null;
  
  if (isNew) {
    // Clear form for new game
    document.getElementById("gameForm").reset();
    document.getElementById("editingIndex").value = "";
    updateStars(0);
  } else {
    // Populate form with existing game data
    const game = games[index];
    document.getElementById("editingIndex").value = game.id;
    document.getElementById("gameName").value = game.name || "";
    document.getElementById("gameDescription").value = game.description || "";
    slowDayOnly.checked = !!game.slow_day_only;
    trustedOnly.checked = !!game.trusted_only;
    maxTableSize.value = game.max_table_size || "";
    conditionRating.value = game.condition_rating || "";
    updateStars(game.condition_rating || 0);
    staffPicks.value = (game.staff_picks || []).join(", ");
  }
  
  // Clear file inputs
  document.getElementById("imgFile").value = "";
  document.getElementById("rulesFile").value = "";
  
  gameModal.style.display = "flex";
}

gameForm.onsubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  const imgFile = document.getElementById("imgFile").files[0];
  const rulesFile = document.getElementById("rulesFile").files[0];
  
  // Add form fields to FormData
  formData.append("name", document.getElementById("gameName").value);
  formData.append("description", document.getElementById("gameDescription").value);
  
  if (imgFile) formData.append("imgFile", imgFile);
  if (rulesFile) formData.append("rulesFile", rulesFile);
  
  formData.append("slow_day_only", slowDayOnly.checked ? 1 : 0);
  formData.append("trusted_only", trustedOnly.checked ? 1 : 0);
  formData.append("max_table_size", maxTableSize.value);
  formData.append("condition_rating", conditionRating.value);
  formData.append("staff_picks", staffPicks.value);
  
  const gameId = document.getElementById("editingIndex").value;
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
      gameModal.style.display = "none";
      fetchGames(); // refresh list
    } else {
      alert("Något gick fel vid sparande.");
    }
  } catch (err) {
    alert("Något gick fel vid sparande.");
    console.error(err);
  }
};


let games = [];
let editingIndex = null;

const API_BASE = "https://bradspelsmeny-backend-production.up.railway.app";
const gameList = document.getElementById("gameList");
const searchBar = document.getElementById("searchBar");
const gameModal = document.getElementById("gameModal");
const gameForm = document.getElementById("gameForm");
const loadingSpinner = document.getElementById("loadingSpinner");
const addGameButton = document.getElementById("addGameButton");
const closeModalButton = document.getElementById("closeModal");

async function fetchGames() {
  loadingSpinner.style.display = "block";
  const res = await fetch(`${API_BASE}/games`);
  games = await res.json();
  loadingSpinner.style.display = "none";
  renderGames();
}

function renderGames() {
  const search = searchBar.value.toLowerCase();
  gameList.innerHTML = "";

  games
    .filter(game => (game.title_en || game.title || "").toLowerCase().includes(search))
    .forEach((game, index) => {
      const card = document.createElement("div");
      card.className = "game-card";

      const header = document.createElement("div");
      header.className = "game-header";

      const title = document.createElement("div");
      title.className = "game-title";
      title.textContent = game.title_en || game.title || "(No Title)";

      const buttons = document.createElement("div");
      buttons.className = "button-group";
      
      const editBtn = document.createElement("button");
      editBtn.className = "edit-button";
      editBtn.textContent = "✏️";
      editBtn.onclick = () => openModal(index);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-button";
      deleteBtn.textContent = "🗑️";
      deleteBtn.onclick = () => deleteGame(index);

      buttons.appendChild(editBtn);
      buttons.appendChild(deleteBtn);
      header.appendChild(title);
      header.appendChild(buttons);
      card.appendChild(header);
      gameList.appendChild(card);
    });
}

function deleteGame(index) {
  const game = games[index];
  if (!game || !game.id) return;

  const confirmed = confirm(`Är du säker på att du vill radera spelet "${game.title_en || game.title || "(no title)"}"?`);
  if (!confirmed) return;

  fetch(`https://bradspelsmeny-backend-production.up.railway.app/games/${game.id}`, {
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Delete failed");
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

function openModal(index = null) {
  editingIndex = index;
  const isNew = index === null;
  document.getElementById("formTitle").textContent = isNew ? "Lägg till spel" : "Redigera spel";

  const game = isNew ? {} : games[index];

  gameForm.reset();
  document.getElementById("title").value = game.title_en || game.title || "";
  document.getElementById("editingIndex").value = isNew ? "" : games[index].id;
  document.getElementById("descSv").value = game.description_sv || "";
  document.getElementById("descEn").value = game.description_en || "";
  document.getElementById("players").value = game.players || "";
  document.getElementById("time").value = game.time || "";
  document.getElementById("age").value = game.age || "";
  document.getElementById("tags").value = game.tags || "";
  document.getElementById("img").value = game.img || "";
  document.getElementById("rules").value = game.rules || "";
  document.getElementById("imgFile").value = "";
  document.getElementById("rulesFile").value = "";

  gameModal.style.display = "flex";
}

closeModalButton.onclick = () => {
  gameModal.style.display = "none";
};

gameForm.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();

  formData.append("title_en", document.getElementById("title").value);
  formData.append("description_sv", document.getElementById("descSv").value);
  formData.append("description_en", document.getElementById("descEn").value);
  formData.append("players", document.getElementById("players").value);
  formData.append("time", document.getElementById("time").value);
  formData.append("age", document.getElementById("age").value);
  formData.append("tags", document.getElementById("tags").value);
  formData.append("img", document.getElementById("img").value);
  formData.append("rules", document.getElementById("rules").value);

  const imgFile = document.getElementById("imgFile").files[0];
  const rulesFile = document.getElementById("rulesFile").files[0];

  if (imgFile) formData.append("imgFile", imgFile);
  if (rulesFile) formData.append("rulesFile", rulesFile);

  const gameId = document.getElementById("editingIndex").value;
  const isNew = gameId === "";
  const method = isNew ? "POST" : "PUT";
  const url = isNew
  ? "https://bradspelsmeny-backend-production.up.railway.app/games"
  : `https://bradspelsmeny-backend-production.up.railway.app/games/${gameId}`;
  const res = await fetch(url, {
    method,
    body: formData
  });

  if (res.ok) {
    await fetchGames();
    gameModal.style.display = "none";
  } else {
    alert("Något gick fel vid sparandet.");
  }
};

addGameButton.onclick = () => openModal();
searchBar.addEventListener("input", renderGames);
document.addEventListener("DOMContentLoaded", fetchGames);

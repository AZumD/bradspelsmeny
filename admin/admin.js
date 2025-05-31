// admin.js

let games = [];
let editingIndex = null;

const gameList = document.getElementById("gameList");
const searchBar = document.getElementById("searchBar");
const gameModal = document.getElementById("gameModal");
const gameForm = document.getElementById("gameForm");
const loadingSpinner = document.getElementById("loadingSpinner");
const addGameButton = document.getElementById("addGameButton");

async function fetchGames() {
  loadingSpinner.style.display = "block";
  const res = await fetch("https://bradspelsmeny-backend.onrender.com/games");
  games = await res.json();
  loadingSpinner.style.display = "none";
  renderGames();
}

function renderGames() {
  const search = searchBar.value.toLowerCase();
  gameList.innerHTML = "";
  games.filter(game => (game.title || game.title_en || "").toLowerCase().includes(search)).forEach((game, index) => {    const card = document.createElement("div");
    card.className = "game-card";

    const header = document.createElement("div");
    header.className = "game-header";

    const title = document.createElement("div");
    title.className = "game-title";
    title.textContent = game.title || game.title_en || "(No Title)";

    const buttons = document.createElement("div");
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

    const lentInfo = document.createElement("div");
    lentInfo.className = "lent-info";
    lentInfo.textContent = game.lent ? "Lent out" : "Available";

    card.appendChild(header);
    card.appendChild(lentInfo);
    gameList.appendChild(card);
  });
}

function openModal(index = null) {
  editingIndex = index;
  const isNew = index === null;
  document.getElementById("formTitle").textContent = isNew ? "Lägg till spel" : "Redigera spel";

  const game = isNew ? {} : games[index];

  gameForm.reset();
  document.getElementById("editingIndex").value = index ?? "";
  document.getElementById("titleEn").value = game.title || "";
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

document.getElementById("closeModal").onclick = () => {
  gameModal.style.display = "none";
};

gameForm.onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append("title_en", document.getElementById("titleEn").value);
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

  const index = document.getElementById("editingIndex").value;
  const method = index === "" ? "POST" : "PUT";
  const url = index === ""
    ? "https://bradspelsmeny-backend.onrender.com/games"
    : `https://bradspelsmeny-backend.onrender.com/games/${index}`;

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

document.getElementById("addGameButton").onclick = () => openModal();

searchBar.addEventListener("input", renderGames);

document.addEventListener("DOMContentLoaded", fetchGames);

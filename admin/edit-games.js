// edit-games.js

let games = [];
let editingIndex = null;

const API_BASE = "https://bradspelsmeny-backend-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {
  const gameModal = document.getElementById("gameModal");
  const gameForm = document.getElementById("gameForm");
  const addGameButton = document.getElementById("addGameButton");
  const searchBar = document.getElementById("searchBar");
  const gameList = document.getElementById("gameList");

  const slowDayOnly = document.getElementById("slowDayOnly");
  const trustedOnly = document.getElementById("trustedOnly");
  const maxTableSize = document.getElementById("maxTableSize");
  const conditionRatingValue = document.getElementById("conditionRatingValue");
  const staffPicks = document.getElementById("staffPicks");

  addGameButton?.addEventListener("click", () => openModal());
  gameModal?.addEventListener("click", (e) => { if (e.target === gameModal) gameModal.style.display = "none" });
  document.getElementById("closeModal")?.addEventListener("click", () => { gameModal.style.display = "none" });

  function updateStars(rating) {
    document.querySelectorAll("#conditionRating .star").forEach(star => {
      const val = parseInt(star.dataset.value);
      star.classList.toggle("filled", val <= rating);
    });
  }

  document.querySelectorAll("#conditionRating .star").forEach(star => {
    star.addEventListener("click", () => {
      const rating = parseInt(star.dataset.value);
      conditionRatingValue.value = rating;
      updateStars(rating);
    });
  });

  async function fetchGames() {
    try {
      gameList.innerHTML = "Laddar...";
      const res = await fetch(`${API_BASE}/games`);
      if (!res.ok) throw new Error("Failed to fetch games");
      games = await res.json();
      displayGames(games);
    } catch (err) {
      gameList.innerHTML = "<p style='color:red;'>Fel vid laddning av spel.</p>";
      console.error(err);
    }
  }

  function displayGames(gamesToShow) {
    gameList.innerHTML = "";
    gamesToShow.forEach((game, index) => {
      const card = document.createElement("div");
      card.className = "game-card";

      const header = document.createElement("div");
      header.className = "game-header";

      const title = document.createElement("div");
      title.className = "game-title";
      title.textContent = game.title_sv || game.title_en || "(namnlös)";

      const buttons = document.createElement("div");
      buttons.className = "button-group";

      const editBtn = document.createElement("button");
      editBtn.className = "edit-button";
      editBtn.textContent = "✏️ Redigera";
      editBtn.onclick = () => openModal(index);

      const delBtn = document.createElement("button");
      delBtn.className = "delete-button";
      delBtn.textContent = "🗑️ Ta bort";
      delBtn.onclick = () => deleteGame(index);

      buttons.appendChild(editBtn);
      buttons.appendChild(delBtn);
      header.appendChild(title);
      header.appendChild(buttons);
      card.appendChild(header);
      gameList.appendChild(card);
    });
  }

  async function deleteGame(index) {
    const id = games[index].id;
    if (!confirm("Vill du verkligen ta bort spelet?")) return;
    try {
      await fetch(`${API_BASE}/games/${id}`, { method: "DELETE" });
      fetchGames();
    } catch (err) {
      alert("Kunde inte ta bort spel.");
    }
  }

  function openModal(index = null) {
    editingIndex = index;
    const isNew = index === null;
    const game = isNew ? {} : games[index];

    gameForm.reset();
    document.getElementById("formTitle").textContent = isNew ? "Lägg till spel" : "Redigera spel";
    document.getElementById("editingIndex").value = isNew ? "" : game.id;
    document.getElementById("title").value = game.title_sv || "";
    document.getElementById("descSv").value = game.description_sv || "";
    document.getElementById("descEn").value = game.description_en || "";
    document.getElementById("players").value = game.players || "";
    document.getElementById("time").value = game.time || "";
    document.getElementById("age").value = game.age || "";
    document.getElementById("tags").value = game.tags || "";
    document.getElementById("img").value = game.img || "";
    document.getElementById("rules").value = game.rules || "";
    slowDayOnly.checked = !!game.slow_day_only;
    trustedOnly.checked = !!game.trusted_only;
    maxTableSize.value = game.max_table_size || "";
    conditionRatingValue.value = game.condition_rating || 0;

    let picks = game.staff_picks;
    if (typeof picks === "string") {
      try {
        picks = JSON.parse(picks);
      } catch {
        picks = [];
      }
    }
    staffPicks.value = (picks || []).join(", ");

    updateStars(parseInt(conditionRatingValue.value));
    document.getElementById("imgFile").value = "";
    document.getElementById("rulesFile").value = "";
    gameModal.style.display = "flex";
  }

  if (gameForm) {
    gameForm.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(gameForm);
      formData.append("slow_day_only", slowDayOnly.checked ? 1 : 0);
      formData.append("trusted_only", trustedOnly.checked ? 1 : 0);
      formData.append("condition_rating", conditionRatingValue.value);
      formData.append("staff_picks", staffPicks.value);

      const id = document.getElementById("editingIndex").value;
      const url = id ? `${API_BASE}/games/${id}` : `${API_BASE}/games`;
      const method = id ? "PUT" : "POST";

      try {
        const res = await fetch(url, { method, body: formData });
        if (!res.ok) throw new Error("Failed to save game");
        gameModal.style.display = "none";
        fetchGames();
      } catch (err) {
        alert("Kunde inte spara spel.");
        console.error(err);
      }
    };
  }

  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = games.filter(g => (g.title_sv || "").toLowerCase().includes(term));
      displayGames(filtered);
    });
  }

  fetchGames();

  window.openModal = openModal;
  window.deleteGame = deleteGame;
  window.updateStars = updateStars;
});

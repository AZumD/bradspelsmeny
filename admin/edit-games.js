(() => {
  let games = [];
  let editingIndex = null;

  const API_BASE = "https://bradspelsmeny-backend-production.up.railway.app";
  let USER_TOKEN = null;

  async function refreshUserToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/admin/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("userToken", data.token);
        USER_TOKEN = data.token;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function guardAdminSession() {
    const token = localStorage.getItem("userToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token && !refreshToken) {
      window.location.href = "/pages/login.html";
      return false;
    }

    if (!token && refreshToken) {
      const refreshed = await refreshUserToken();
      if (!refreshed) {
        window.location.href = "/pages/login.html";
        return false;
      }
    } else {
      USER_TOKEN = token;
    }

    return true;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const sessionOk = await guardAdminSession();
    if (!sessionOk) return;

    const gameModal = document.getElementById("gameModal");
    const gameForm = document.getElementById("gameForm");
    const addGameButton = document.getElementById("addGameButton");
    const searchBar = document.getElementById("searchBar");
    const gameList = document.getElementById("gameList");
    const loadingSpinner = document.getElementById("loadingSpinner");

    const slowDayOnly = document.getElementById("slowDayOnly");
    const trustedOnly = document.getElementById("trustedOnly");
    const membersOnly = document.getElementById("membersOnly");
    const staffPicks = document.getElementById("staffPicks");
    const minTableSize = document.getElementById("minTableSize");
    const conditionRatingValue = document.getElementById("conditionRatingValue");

    const minPlayers = document.getElementById("minPlayers");
    const maxPlayers = document.getElementById("maxPlayers");

    const titleInput = document.getElementById("title");
    const descSvInput = document.getElementById("descSv");
    const descEnInput = document.getElementById("descEn");

    addGameButton?.addEventListener("click", () => openModal());
    gameModal?.addEventListener("click", (e) => {
      if (e.target === gameModal) gameModal.style.display = "none";
    });
    document.getElementById("closeModal")?.addEventListener("click", () => {
      gameModal.style.display = "none";
    });

    function updateStars(rating) {
      document.querySelectorAll("#conditionRating .star").forEach((star) => {
        const val = parseInt(star.dataset.value);
        star.classList.toggle("filled", val <= rating);
      });
    }

    function openModal(index = null) {
      editingIndex = index;
      const game = index !== null ? games[index] : {};

      gameModal.style.display = "block";
      gameForm.reset();

      titleInput.value = game.title_sv || game.title_en || "";
      descSvInput.value = game.description || "";
      descEnInput.value = game.description_en || "";
      minPlayers.value = game.min_players || "";
      maxPlayers.value = game.max_players || "";
      document.getElementById("time").value = game.playtime || "";
      document.getElementById("age").value = game.age || "";
      document.getElementById("tags").value = Array.isArray(game.tags)
      ? game.tags.join(", ")
      : (game.tags || "");

      document.getElementById("img").value = game.image_url || "";
      document.getElementById("rules").value = game.rules_url || "";
      slowDayOnly.checked = !!game.slow_day_only;
      trustedOnly.checked = !!game.trusted_only;
      membersOnly.checked = !!game.members_only;
      staffPicks.value = (game.staff_picks || []).join(", ");
      minTableSize.value = game.min_table_size || "";
      conditionRatingValue.value = game.condition_rating || 0;

      updateStars(game.condition_rating || 0);
    }

    document.querySelectorAll("#conditionRating .star").forEach((star) => {
      star.addEventListener("click", () => {
        const rating = parseInt(star.dataset.value);
        conditionRatingValue.value = rating;
        updateStars(rating);
      });
    });

    async function fetchGames() {
      try {
        gameList.innerHTML = "";
        if (loadingSpinner) loadingSpinner.style.display = "block";

        const res = await fetch(`${API_BASE}/games`, {
          headers: {
            Authorization: `Bearer ${USER_TOKEN}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch games");

        games = await res.json();
        displayGames(games);
      } catch (err) {
        gameList.innerHTML = "<p style='color:red;'>Fel vid laddning av spel.</p>";
        console.error(err);
      } finally {
        if (loadingSpinner) loadingSpinner.style.display = "none";
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
        const res = await fetch(`${API_BASE}/games/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${USER_TOKEN}`,
          },
        });
        if (!res.ok) throw new Error("Delete failed");
        await fetchGames();
      } catch (err) {
        alert("Kunde inte ta bort spel.");
        console.error(err);
      }
    }

    if (searchBar) {
      searchBar.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = games.filter((g) =>
          (g.title_sv || "").toLowerCase().includes(term)
        );
        displayGames(filtered);
      });
    }

    await fetchGames();
  });
})();

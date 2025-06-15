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

  function setupPixelNav() {
    const nav = document.createElement("div");
    nav.id = "pixelNav";
    nav.innerHTML = `
      <a href="/admin/dashboard.html"><img src="../img/nav-home.png" alt="Home" /></a>
      <a href="/admin/edit-games.html"><img src="../img/nav-boardgame.png" alt="Games" /></a>
      <a href="#" onclick="logout()"><img src="../img/nav-logout.png" alt="Logout" /></a>
    `;
    document.body.appendChild(nav);
  }

  function logout() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/pages/login.html";
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const sessionOk = await guardAdminSession();
    if (!sessionOk) return;

    setupPixelNav();

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
      document.getElementById("tags").value = game.tags || "";

      document.getElementById("img").value = game.image_url || "";
      document.getElementById("rules").value = game.rules_url || "";
      slowDayOnly.checked = !!game.slow_day_only;
      trustedOnly.checked = !!game.trusted_only;
      membersOnly.checked = !!game.members_only;
      staffPicks.value = Array.isArray(game.staff_picks) ? game.staff_picks.join(", ") : (game.staff_picks || "");
      minTableSize.value = game.min_table_size || "";
      conditionRatingValue.value = game.condition_rating || 0;

      updateStars(game.condition_rating || 0);
    }

    gameForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        title_sv: titleInput.value,
        description: descSvInput.value,
        description_en: descEnInput.value,
        min_players: parseInt(minPlayers.value) || null,
        max_players: parseInt(maxPlayers.value) || null,
        playtime: document.getElementById("time").value,
        age: document.getElementById("age").value,
        tags: document.getElementById("tags").value,
        image_url: document.getElementById("img").value,
        rules_url: document.getElementById("rules").value,
        slow_day_only: slowDayOnly.checked,
        trusted_only: trustedOnly.checked,
        members_only: membersOnly.checked,
        staff_picks: staffPicks.value.split(",").map(s => s.trim()).filter(Boolean),
        min_table_size: minTableSize.value,
        condition_rating: parseInt(conditionRatingValue.value) || 0,
      };

      try {
        const method = editingIndex !== null ? "PUT" : "POST";
        const endpoint = editingIndex !== null ? `${API_BASE}/games/${games[editingIndex].id}` : `${API_BASE}/games`;

        const res = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${USER_TOKEN}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to save game");

        gameModal.style.display = "none";
        await fetchGames();
      } catch (err) {
        alert("Kunde inte spara spelet.");
        console.error(err);
      }
    });

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

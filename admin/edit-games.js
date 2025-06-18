import {
  getAccessToken,
  getRefreshToken,
  getUserIdFromToken,
  refreshToken,
  fetchWithAuth
} from '../js/modules/auth.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

(() => {
  let games = [];
  let editingIndex = null;

  async function guardAdminSession() {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!token && !refreshToken) {
      window.location.href = "login.html";
      return false;
    }

    if (!token && refreshToken) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        window.location.href = "login.html";
        return false;
      }
    }

    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    initPixelNav(); // 🧩 From shared-ui.js
    updateNotificationIcon(); // 🔔 Just update icon on load
    setInterval(updateNotificationIcon, 60000); // 🔁 Refresh every minute
    const myId = getUserIdFromToken();
    const viewedId = getUserIdFromUrl() || myId;
    const profileUserId = viewedId;
    
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
    window.addEventListener('click', (e) => {
      document.querySelectorAll('.modal').forEach((modal) => {
        if (e.target === modal && getComputedStyle(modal).display !== 'none') {
          modal.style.display = 'none';
        }
      });
    });

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

        const res = await fetchWithAuth(`${API_BASE}/games`);

        if (!res || !res.ok) throw new Error("Failed to fetch games");

        games = await res.json();
        displayGames(games);
      } catch (err) {
        gameList.innerHTML = "<p style='color:red;'>Fel vid laddning av spel.</p>";
        console.error(err);
      } finally {
        if (loadingSpinner) loadingSpinner.style.display = "none";
      }
    }

    function getUserIdFromUrl() {
      return new URLSearchParams(window.location.search).get('id');
    }

    function displayGames(gamesToShow) {
      gameList.innerHTML = "";
      gamesToShow.forEach((game, index) => {
        const card = document.createElement("div");
        card.className = "section-title";

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
        const res = await fetchWithAuth(`${API_BASE}/games/${id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Delete failed");
        await fetchGames();
      } catch (err) {
        alert("Kunde inte ta bort spel.");
        console.error(err);
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
      document.getElementById("minPlayers").value = game.min_players || "";
      document.getElementById("maxPlayers").value = game.max_players || "";
      document.getElementById("time").value = game.play_time || "";
      document.getElementById("age").value = game.age || "";
      document.getElementById("tags").value = typeof game.tags === "string" ? game.tags : (game.tags || []).join(", ");
      document.getElementById("img").value = game.img || "";
      document.getElementById("rules").value = game.rules || "";
      slowDayOnly.checked = !!game.slow_day_only;
      trustedOnly.checked = !!game.trusted_only;
      membersOnly.checked = !!game.members_only;
      minTableSize.value = game.min_table_size || "";
      conditionRatingValue.value = game.condition_rating || 0;

      try {
        const picks = typeof game.staff_picks === "string" ? JSON.parse(game.staff_picks) : game.staff_picks;
        staffPicks.value = Array.isArray(picks) ? picks.join(", ") : "";
      } catch {
        staffPicks.value = "";
      }

      updateStars(parseInt(conditionRatingValue.value));
      document.getElementById("imgFile").value = "";
      document.getElementById("rulesFile").value = "";
      gameModal.style.display = "flex";
    }

    if (gameForm) {
      gameForm.onsubmit = async (e) => {
        e.preventDefault();

        const title_sv = document.getElementById("title").value.trim();
        const title_en = title_sv;
        const description_sv = document.getElementById("descSv").value.trim();
        const description_en = document.getElementById("descEn").value.trim();
        const min_players = parseInt(document.getElementById("minPlayers").value.trim());
        const max_players = parseInt(document.getElementById("maxPlayers").value.trim());
        const play_time = parseInt(document.getElementById("time").value.trim());
        const age = parseInt(document.getElementById("age").value.trim());
        const tags = document.getElementById("tags").value.trim();
        const img = document.getElementById("img").value.trim();
        const slow_day_only = slowDayOnly.checked;
        const trusted_only = trustedOnly.checked;
        const members_only = membersOnly.checked;
        const staff_picks = staffPicks.value.split(",").map((s) => s.trim()).filter(Boolean);

        if (!title_sv || !description_sv || !description_en || !min_players || !play_time || !age || !tags || !img) {
          alert("Vänligen fyll i alla obligatoriska fält.");
          return;
        }

        const formData = new URLSearchParams();
        formData.append("title_sv", title_sv);
        formData.append("title_en", title_en);
        formData.append("description_sv", description_sv);
        formData.append("description_en", description_en);
        formData.append("min_players", min_players);
        formData.append("max_players", max_players);
        formData.append("play_time", play_time);
        formData.append("age", age);
        formData.append("tags", tags);
        formData.append("img", img);
        formData.append("slow_day_only", slow_day_only);
        formData.append("trusted_only", trusted_only);
        formData.append("members_only", members_only);
        formData.append("staff_picks", JSON.stringify(staff_picks));

        const condition_rating_val = conditionRatingValue.value;
        if (condition_rating_val !== "" && !isNaN(condition_rating_val)) {
          formData.append("condition_rating", parseInt(condition_rating_val));
        }

        const min_table_size_val = minTableSize.value;
        if (min_table_size_val !== "" && !isNaN(min_table_size_val)) {
          formData.append("min_table_size", parseInt(min_table_size_val));
        }

        const editingId = document.getElementById("editingIndex").value;
        const url = editingId ? `${API_BASE}/games/${editingId}` : `${API_BASE}/games`;
        const method = editingId ? "PUT" : "POST";

        try {
          const res = await fetchWithAuth(url, {
            method,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
          });

          if (!res.ok) throw new Error("Failed to save game");

          await fetchGames();
          gameModal.style.display = "none";
        } catch (err) {
          alert("Kunde inte spara spelet.");
          console.error(err);
        }
      };
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

    guardAdminSession().then(ok => {
      if (ok) fetchGames();
    });
  });
})();


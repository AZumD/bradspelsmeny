document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const availableContainer = document.getElementById("availableGames");
  const lentContainer = document.getElementById("lentGames");

  let allGames = [];

  // Toggle collapsible sections
  window.toggleSection = (id) => {
    const el = document.getElementById(id);
    el.style.display = el.style.display === "flex" ? "none" : "flex";
  };

  // Fetch games from backend
  async function loadGames() {
    try {
      const res = await fetch("https://bradspelsmeny-backend.onrender.com/games");
      const games = await res.json();
      allGames = games;
      renderGames(games);
    } catch (err) {
      console.error("❌ Failed to load games:", err);
    }
  }

  // Render cards into available/lent sections
  function renderGames(games) {
    availableContainer.innerHTML = "";
    lentContainer.innerHTML = "";

    games
      .filter(game => !searchInput.value || (game.title_sv || "").toLowerCase().includes(searchInput.value.toLowerCase()))
      .forEach(game => {
        const card = document.createElement("div");
        card.className = "user-card";

        card.innerHTML = `
          <div class="user-header">
            <div class="user-title">${game.title_sv || "Namnlöst spel"}</div>
            <div>
              <button class="edit-button" onclick="openPreview(${game.id})">👁</button>
              <button class="edit-button" onclick="openHistory(${game.id})">📝</button>
              <button class="edit-button" onclick="${game.lent_out ? `returnGame(${game.id})` : `openLend(${game.id})`}">
                ${game.lent_out ? "↩️" : "📤"}
              </button>
            </div>
          </div>
        `;

        if (game.lent_out) {
          lentContainer.appendChild(card);
        } else {
          availableContainer.appendChild(card);
        }
      });
  }

  // Search functionality
  searchInput.addEventListener("input", () => renderGames(allGames));

  // Modals
  function openModal(id) {
    document.getElementById(id).style.display = "flex";
  }

  function closeModal(id) {
    document.getElementById(id).style.display = "none";
  }

  // Preview Modal
  window.openPreview = (gameId) => {
    const game = allGames.find(g => g.id === gameId);
    const content = `
      <h2>${game.title_sv}</h2>
      <img src="${game.img}" alt="${game.title_sv}" style="max-width: 100%" />
      <button onclick="closeModal('previewModal')">❌ Stäng</button>
    `;
    document.getElementById("previewContent").innerHTML = content;
    openModal("previewModal");
  };

  // History Modal
  window.openHistory = (gameId) => {
    // Placeholder for now
    const content = `
      <h2>🕰 Historik för spel #${gameId}</h2>
      <p>(Här visas historik, t.ex. vem som lånat det och när)</p>
      <button onclick="closeModal('historyModal')">❌ Stäng</button>
    `;
    document.getElementById("historyContent").innerHTML = content;
    openModal("historyModal");
  };

  // Lend Out Modal
  window.openLend = (gameId) => {
    const content = `
      <h2>📤 Låna ut spel #${gameId}</h2>
      <p>Välj användare eller skapa ny:</p>
      <input type="text" placeholder="Förnamn" />
      <input type="text" placeholder="Efternamn" />
      <input type="tel" placeholder="Telefonnummer" />
      <button onclick="confirmLend(${gameId})">✅ Låna ut</button>
      <button onclick="closeModal('lendModal')">❌ Avbryt</button>
    `;
    document.getElementById("lendContent").innerHTML = content;
    openModal("lendModal");
  };

  // Mark game as lent out
  window.confirmLend = async (gameId) => {
    try {
      await fetch(`https://bradspelsmeny-backend.onrender.com/lend/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ /* Add user info later */ })
      });
      closeModal("lendModal");
      loadGames();
    } catch (err) {
      console.error("❌ Failed to lend game:", err);
    }
  };

  // Mark game as returned
  window.returnGame = async (gameId) => {
    try {
      await fetch(`https://bradspelsmeny-backend.onrender.com/return/${gameId}`, {
        method: "POST"
      });
      loadGames();
    } catch (err) {
      console.error("❌ Failed to return game:", err);
    }
  };

  loadGames();
});

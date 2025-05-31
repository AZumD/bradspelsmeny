// admin.js

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('languageToggle');
  const html = document.documentElement;

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isSwedish = html.lang === 'sv';
      html.lang = isSwedish ? 'en' : 'sv';
      toggle.textContent = isSwedish ? '🇬🇧 English' : '🇸🇪 Svenska';
      location.reload();
    });
  }

  const spinner = document.getElementById('loadingSpinner');
  const searchBar = document.getElementById('searchBar');
  const gameList = document.getElementById('gameList');
  const resetButton = document.getElementById('resetButton');
  const exportButton = document.getElementById('exportButton');
  const addGameButton = document.getElementById('addGameButton');

  const modal = document.getElementById('gameModal');
  const closeModalButton = document.getElementById('closeModal');
  const form = document.getElementById('gameForm');
  const formTitle = document.getElementById('formTitle');
  const editingIdInput = document.getElementById('editingIndex');
  const titleSv = document.getElementById('titleSv');
  const titleEn = document.getElementById('titleEn');
  const descSv = document.getElementById('descSv');
  const descEn = document.getElementById('descEn');
  const players = document.getElementById('players');
  const time = document.getElementById('time');
  const age = document.getElementById('age');
  const tags = document.getElementById('tags');
  const img = document.getElementById('img');
  const rules = document.getElementById('rules');

  let games = [];

  async function fetchGames() {
    if (spinner) spinner.style.display = 'block';
    try {
      const res = await fetch('https://bradspelsmeny-backend.onrender.com/games');
      games = await res.json();
      if (searchBar && gameList) await renderGameList();
    } catch (err) {
      console.error('Failed to fetch games:', err);
      if (gameList) {
        gameList.innerHTML = `<p style="color:red;">⚠️ Failed to load games.</p>`;
      }
    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  }

  async function renderGameList() {
    const query = searchBar.value.toLowerCase();
    gameList.innerHTML = '';

    games.forEach((game, index) => {
      if (
        game.title_sv.toLowerCase().includes(query) ||
        game.title_en.toLowerCase().includes(query)
      ) {
        const card = document.createElement('div');
        card.className = 'game-card';

        const header = document.createElement('div');
        header.className = 'game-header';
        header.innerHTML = `
          <span class="game-title">${game.title_sv} / ${game.title_en}</span>
          <div>
            <button class="edit-button" onclick="editGame(${game.id})">✏️ Edit</button>
            <button class="delete-button" onclick="deleteGame(${game.id})">🗑️ Delete</button>
          </div>
        `;

        const info = document.createElement('div');
        info.className = 'lent-info';
        let lentInfoText = `${game.players || ''} ・ ${game.time || ''} ・ ${game.age || ''}`;

        info.textContent = lentInfoText;
        card.appendChild(header);
        card.appendChild(info);

        gameList.appendChild(card);
      }
    });

    if (spinner) spinner.style.display = 'none';
  }

  window.editGame = (id) => {
    const game = games.find(g => g.id === id);
    if (!game) {
      alert("⚠️ Could not find a game with ID " + id);
      return;
    }

    openForm();
    formTitle.textContent = 'Edit Game';
    editingIdInput.value = id;
    titleSv.value = game.title_sv;
    titleEn.value = game.title_en;
    descSv.value = game.description_sv;
    descEn.value = game.description_en;
    players.value = game.players;
    time.value = game.time;
    age.value = game.age;
    tags.value = game.tags;
    img.value = game.img;
    rules.value = game.rules || '';
  };

  window.deleteGame = async (id) => {
    if (!confirm("❗ Are you sure you want to delete this game?")) return;
    try {
      const res = await fetch(`https://bradspelsmeny-backend.onrender.com/games/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        await fetchGames();
      } else {
        alert(`⚠️ Failed to delete: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ Error deleting game:", err);
      alert("Unexpected error occurred while deleting.");
    }
  };

  function openForm() {
    form.reset();
    modal.style.display = 'flex';
  }

  function closeForm() {
    modal.style.display = 'none';
  }

  if (addGameButton) {
    addGameButton.onclick = () => {
      openForm();
      formTitle.textContent = 'Add New Game';
      editingIdInput.value = '';
    };
  }

  if (closeModalButton) {
    closeModalButton.onclick = closeForm;
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const gameData = {
        title_sv: titleSv.value,
        title_en: titleEn.value,
        description_sv: descSv.value,
        description_en: descEn.value,
        players: players.value,
        time: time.value,
        age: age.value,
        tags: tags.value.split(',').map(tag => tag.trim()),
        img: img.value,
        rules: rules.value || ''
      };
      const id = editingIdInput.value;
      if (id) {
        await fetch(`https://bradspelsmeny-backend.onrender.com/games/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData)
        });
      } else {
        await fetch('https://bradspelsmeny-backend.onrender.com/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData)
        });
      }
      closeForm();
      await fetchGames();
    };
  }

  if (resetButton) {
    resetButton.onclick = () => {
      if (confirm("Reset all lent out data?")) {
        localStorage.clear();
        location.reload();
      }
    };
  }

  if (exportButton) {
    exportButton.onclick = () => {
      const blob = new Blob([
        'const games = ' + JSON.stringify(games, null, 2) + ';'
      ], { type: 'application/javascript' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'games-data.js';
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  if (searchBar) {
    searchBar.oninput = renderGameList;
  }

  fetchGames();
});

let searchBar = document.getElementById('searchBar');
let gameList = document.getElementById('gameList');
let resetButton = document.getElementById('resetButton');
let exportButton = document.getElementById('exportButton');
let addGameButton = document.getElementById('addGameButton');

let modal = document.getElementById('gameModal');
let closeModalButton = document.getElementById('closeModal');
let form = document.getElementById('gameForm');
let formTitle = document.getElementById('formTitle');
let editingIdInput = document.getElementById('editingIndex');
let titleSv = document.getElementById('titleSv');
let titleEn = document.getElementById('titleEn');
let descSv = document.getElementById('descSv');
let descEn = document.getElementById('descEn');
let players = document.getElementById('players');
let time = document.getElementById('time');
let age = document.getElementById('age');
let tags = document.getElementById('tags');
let img = document.getElementById('img');
let rules = document.getElementById('rules');

let games = [];

async function fetchGames() {
  const res = await fetch('https://bradspelsmeny-backend.onrender.com/games');
  games = await res.json();
  renderGameList();
}

async function loadLentStatus() {
  try {
    const res = await fetch('../lent-status.json');
    if (!res.ok) throw new Error("Failed to load lent-status.json");
    lentStatus = await res.json();
  } catch (err) {
    console.warn("Could not load lent-status.json", err);
    lentStatus = {};
  }
}

async function renderGameList() {
  await loadLentStatus();
  const query = searchBar.value.toLowerCase();
  gameList.innerHTML = '';

  games.forEach((game) => {
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
        </div>
      `;

      const info = document.createElement('div');
      info.className = 'lent-info';
      let lentInfoText = `${game.players || ''} ・ ${game.time || ''} ・ ${game.age || ''}`;

      const lentEntry = lentStatus[game.title_en] || lentStatus[game.title_sv];
      if (lentEntry) {
        lentInfoText += `\n🔒 Lent out by ${lentEntry.by} at ${lentEntry.time}`;
        card.style.opacity = 0.5;
        card.style.filter = 'grayscale(1)';
      }

      info.textContent = lentInfoText;
      card.appendChild(header);
      card.appendChild(info);
      gameList.appendChild(card);
    }
  });
}

window.editGame = (id) => {
  const game = games.find(g => g.id === id);
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

function openForm() {
  form.reset();
  modal.style.display = 'flex';
}

function closeForm() {
  modal.style.display = 'none';
}

addGameButton.onclick = () => {
  openForm();
  formTitle.textContent = 'Add New Game';
  editingIdInput.value = '';
};

closeModalButton.onclick = closeForm;

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
    tags: tags.value,
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

resetButton.onclick = () => {
  if (confirm("Reset all lent out data?")) {
    localStorage.clear();
    location.reload();
  }
};

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

searchBar.oninput = renderGameList;
window.onload = fetchGames;

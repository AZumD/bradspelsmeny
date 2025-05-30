// admin.js
console.log('Games array:', games);

let searchBar = document.getElementById('searchBar');
let gameList = document.getElementById('gameList');
let resetButton = document.getElementById('resetButton');
let exportButton = document.getElementById('exportButton');
let addGameButton = document.getElementById('addGameButton');

let modal = document.getElementById('gameModal');
let closeModalButton = document.getElementById('closeModal');
let form = document.getElementById('gameForm');
let formTitle = document.getElementById('formTitle');
let editingIndexInput = document.getElementById('editingIndex');
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

let lentStatus = {};

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

  games.forEach((game, index) => {
    if (
      game.title.sv.toLowerCase().includes(query) ||
      game.title.en.toLowerCase().includes(query)
    ) {
      const card = document.createElement('div');
      card.className = 'game-card';

      const header = document.createElement('div');
      header.className = 'game-header';
      header.innerHTML = `
        <span class="game-title">${game.title.sv} / ${game.title.en}</span>
        <div>
          <button class="edit-button" onclick="editGame(${index})">✏️ Edit</button>
        </div>
      `;

      const info = document.createElement('div');
      info.className = 'lent-info';
      let lentInfoText = `${game.players || ''} ・ ${game.time || ''} ・ ${game.age || ''}`;

      const lentEntry = lentStatus[game.title.en] || lentStatus[game.title.sv];
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

function editGame(index) {
  const game = games[index];
  openForm();
  formTitle.textContent = 'Edit Game';
  editingIndexInput.value = index;
  titleSv.value = game.title.sv;
  titleEn.value = game.title.en;
  descSv.value = game.description.sv;
  descEn.value = game.description.en;
  players.value = game.players;
  time.value = game.time;
  age.value = game.age;
  tags.value = game.tags.join(', ');
  img.value = game.img;
  rules.value = game.rules || '';
}

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
  editingIndexInput.value = '';
};

closeModalButton.onclick = closeForm;

form.onsubmit = (e) => {
  e.preventDefault();

  const newGame = {
    title: {
      sv: titleSv.value,
      en: titleEn.value,
    },
    description: {
      sv: descSv.value,
      en: descEn.value,
    },
    players: players.value,
    time: time.value,
    age: age.value,
    tags: tags.value.split(',').map(t => t.trim()),
    img: img.value,
    rules: rules.value || ''
  };

  const index = editingIndexInput.value;
  if (index) {
    games[parseInt(index)] = newGame;
  } else {
    games.push(newGame);
  }
  closeForm();
  renderGameList();
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

window.onload = renderGameList;


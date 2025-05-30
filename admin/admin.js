// admin/admin.js

let lentStatus = JSON.parse(localStorage.getItem('lentStatus') || '{}');

function renderGameList() {
  const container = document.getElementById('gameList');
  const search = document.getElementById('searchBar').value.toLowerCase();
  container.innerHTML = '';

  const filtered = games.filter(game =>
    game.title.en.toLowerCase().includes(search) ||
    game.title.sv.toLowerCase().includes(search)
  );

  filtered.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';

    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = game.title.en;

    const toggle = document.createElement('button');
    toggle.className = 'toggle-button';
    if (lentStatus[game.title.en]) {
      toggle.textContent = 'Lent Out';
      toggle.classList.add('lent');
    } else {
      toggle.textContent = 'Available';
    }

    toggle.onclick = () => {
      lentStatus[game.title.en] = !lentStatus[game.title.en];
      localStorage.setItem('lentStatus', JSON.stringify(lentStatus));
      renderGameList();
    };

    card.appendChild(title);
    card.appendChild(toggle);
    container.appendChild(card);
  });
}

document.getElementById('searchBar').addEventListener('input', renderGameList);

// Initialize
renderGameList();

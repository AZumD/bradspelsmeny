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

    const header = document.createElement('div');
    header.className = 'game-header';

    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = game.title.en;

    const toggle = document.createElement('button');
    toggle.className = 'toggle-button';
    const isLent = lentStatus[game.title.en];

    if (isLent) {
      toggle.textContent = 'Lent Out';
      toggle.classList.add('lent');
    } else {
      toggle.textContent = 'Available';
    }

    toggle.onclick = () => {
      if (!isLent) {
        const who = prompt("Who is borrowing this game?");
        lentStatus[game.title.en] = {
          by: who || "Unknown",
          time: new Date().toLocaleString()
        };
      } else {
        delete lentStatus[game.title.en];
      }
      localStorage.setItem('lentStatus', JSON.stringify(lentStatus));
      renderGameList();
    };

    header.appendChild(title);
    header.appendChild(toggle);
    card.appendChild(header);

    if (isLent) {
      const info = document.createElement('div');
      info.className = 'lent-info';
      info.textContent = `Borrowed by: ${isLent.by} at ${isLent.time}`;
      card.appendChild(info);
    }

    container.appendChild(card);
  });
}

document.getElementById('searchBar').addEventListener('input', renderGameList);
document.getElementById('resetButton').addEventListener('click', () => {
  if (confirm("Are you sure you want to reset all lent-out statuses?")) {
    lentStatus = {};
    localStorage.setItem('lentStatus', '{}');
    renderGameList();
  }
});

// Initialize
renderGameList();

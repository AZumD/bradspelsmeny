let lentStatus = {};

async function loadLentStatus() {
  try {
    const res = await fetch('lent-status.json');
    if (!res.ok) throw new Error("File not found or error fetching lent-status.json");
    lentStatus = await res.json();
  } catch (err) {
    console.warn("Could not load lent-status.json — falling back to empty status", err);
    lentStatus = {};
  }
}

async function renderGames() {
  await loadLentStatus(); // 👈 Load lent status before rendering

  const container = document.getElementById('gameList');
  const search = document.getElementById('searchBar').value.toLowerCase();
  const heading = document.getElementById('categoryHeading');

  heading.textContent = translations[currentLang].categories[currentCategory];

  let filtered = currentCategory === 'all'
    ? games
    : games.filter(g => g.tags.includes(currentCategory));

  filtered = filtered.filter(game =>
    game.title[currentLang].toLowerCase().includes(search)
  );

  filtered.sort((a, b) =>
    a.title[currentLang].toLowerCase().localeCompare(b.title[currentLang].toLowerCase())
  );

  container.innerHTML = '';
  filtered.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';

    const title = game.title[currentLang];
    const isLent = lentStatus[title];

    card.innerHTML = `
      <h3>${title}${isLent ? ' <span style="color:#999;">(Lent out)</span>' : ''}</h3>
      <img src="${game.img}" alt="${title}" style="${isLent ? 'filter: grayscale(1); opacity: 0.5;' : ''}" />
      <div class="game-info">
        <p>${game.description[currentLang]}</p>
        ${game.rules ? `<p><a href="${game.rules}" target="_blank">📄 Rules</a></p>` : ''}
        <div class="tags">
          👥 ${translations[currentLang].ui.players}: ${game.players} ・
          ⏱ ${translations[currentLang].ui.time}: ${game.time} ・
          👶 ${translations[currentLang].ui.age}: ${game.age}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

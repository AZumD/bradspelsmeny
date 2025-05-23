let currentCategory = 'all';
let currentLang = navigator.language.startsWith('sv') ? 'sv' : 'en';

function renderCategories() {
  const badgeContainer = document.getElementById('categoryBadges');
  badgeContainer.innerHTML = '';

  for (const tag in translations[currentLang].categories) {
    const badge = document.createElement('div');
    badge.className = 'category-badge';
    if (tag === currentCategory) badge.classList.add('active');
    badge.textContent = translations[currentLang].categories[tag];
    badge.onclick = () => {
      currentCategory = tag;
      renderCategories();
      renderGames();
    };
    badgeContainer.appendChild(badge);
  }
}

function renderIntro() {
  document.getElementById('intro').textContent = translations[currentLang].intro;
}

function setLanguage(lang) {
  currentLang = lang;
  renderCategories();
  renderIntro();
  currentCategory = 'all';
  renderGames();
}

function renderGames() {
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
    card.innerHTML = `
      <img src="${game.img}" alt="${game.title[currentLang]}" />
      <div class="game-info">
        <h3>${game.title[currentLang]}</h3>
        <p>
          ${game.description[currentLang]}
          ${game.rules ? `<br><a href="${game.rules}" target="_blank">📄 Rules</a>` : ''}
        </p>
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

window.onload = () => {
  setLanguage(currentLang);
};

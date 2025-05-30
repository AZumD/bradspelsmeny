let currentCategory = 'all';
let currentLang = navigator.language.startsWith('sv') ? 'sv' : 'en';
let lentStatus = {};

async function loadLentStatus() {
  try {
    const res = await fetch('lent-status.json');
    if (!res.ok) throw new Error("Could not fetch lent-status.json");
    lentStatus = await res.json();
  } catch (err) {
    console.warn("Falling back to empty lent status", err);
    lentStatus = {};
  }
}
const tableSelect = document.getElementById("tableSelect");
function getSelectedTables() {
  return JSON.parse(sessionStorage.getItem("selectedTables") || "[]");
}
if (tableSelect) {
  tableSelect.addEventListener("change", () => {
    const selected = Array.from(tableSelect.selectedOptions).map(opt => opt.value);
    sessionStorage.setItem("selectedTables", JSON.stringify(selected));
    console.log("Selected tables:", selected);
  });
}

function renderCategories() {
  const badgeContainer = document.getElementById('categoryBadges');
  badgeContainer.innerHTML = '';

  for (const tag in translations[currentLang].categories) {
    const badge = document.createElement('div');
    badge.className = 'category-badge';
    if (tag === currentCategory) badge.classList.add('active');
    badge.textContent = translations[currentLang].categories[tag];
    badge.onclick = async () => {
      currentCategory = tag;
      renderCategories();
      await renderGames();
    };
    badgeContainer.appendChild(badge);
  }
}

function renderIntro() {
  document.getElementById('intro').textContent = translations[currentLang].intro;
}

async function setLanguage(lang) {
  currentLang = lang;
  currentCategory = 'all';
  renderCategories();
  renderIntro();
  await renderGames();
}

async function renderGames() {
  await loadLentStatus();

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
    const title = game.title[currentLang];
    const isLent = lentStatus[title];

    const card = document.createElement('div');
    card.className = 'game-card';
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

document.addEventListener("DOMContentLoaded", async () => {
  const spinner = document.getElementById("loadingSpinner");
  const gameList = document.getElementById("gameList");

  try {
    spinner.style.display = "flex";
    gameList.style.display = "none";

    await setLanguage(currentLang);
  } catch (err) {
    console.error("Unexpected loading error:", err);
    const errorBox = document.createElement('div');
    errorBox.innerHTML = `<p style="color:red; text-align:center;">⚠️ Error loading games.</p>`;
    document.body.appendChild(errorBox);
  } finally {
    spinner.style.display = "none";
    gameList.style.display = "grid";
  }
});

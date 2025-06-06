const translations = {
  sv: {
    intro:
      "Vi har ett brett utbud av sällskapsspel här på Pinchos Linnégatan (eller vi aspirerar i alla fall att ha det). Om du ser något du gillar, prata med vår personal så tar vi fram det åt dig! (Det är 16+ som gäller för alla spelutlåningar då vi är väldigt rädda om dem, och vi behöver ett ID i pant)",
    ui: {
      players: "Spelare",
      play_time: "Tid",
      age: "Ålder"
    },
    categories: {
      all: "Alla",
      strategy: "Strategi",
      family: "Familj",
      party: "Party",
      social: "Socialt",
      humor: "Humor",
      card: "Kortspel",
      "2p": "2 spelare"
    }
  },
  en: {
    intro:
      "We have a wide range of board games here at Pinchos Linnégatan (or at least we aspire to). If you see something you like, talk to our staff and we'll bring it to you! (A 16+ age limit applies to all board games and we require an ID as a deposit during the play time)",
    ui: {
      players: "Players",
      play_time: "Time",
      age: "Age"
    },
    categories: {
      all: "All",
      strategy: "Strategy",
      family: "Family",
      party: "Party",
      social: "Social",
      humor: "Humor",
      card: "Card game",
      "2p": "2 players"
    }
  }
};

let games = [];
let currentCategory = 'all';
let currentLang = navigator.language.startsWith('sv') ? 'sv' : 'en';

const tableSelect = document.getElementById("tableSelect");
const selectedDisplay = document.getElementById("selectedTablesDisplay");

function updateSelectedTablesDisplay() {
  const selected = Array.from(tableSelect.selectedOptions).map(opt => opt.textContent);
  selectedDisplay.textContent = selected.length
    ? `Du har valt: ${selected.join(', ')}`
    : '';
}

if (tableSelect) {
  tableSelect.addEventListener("change", () => {
    const selected = Array.from(tableSelect.selectedOptions).map(opt => opt.value);
    sessionStorage.setItem("selectedTables", JSON.stringify(selected));
    updateSelectedTablesDisplay();
  });

  const preSelected = JSON.parse(sessionStorage.getItem("selectedTables") || "[]");
  Array.from(tableSelect.options).forEach(opt => {
    if (preSelected.includes(opt.value)) opt.selected = true;
  });
  updateSelectedTablesDisplay();
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
  const container = document.getElementById('gameList');
  const search = document.getElementById('searchBar').value.toLowerCase();
  const heading = document.getElementById('categoryHeading');
  heading.textContent = translations[currentLang].categories[currentCategory];

  const res = await fetch('https://bradspelsmeny-backend-production.up.railway.app/games');
  games = await res.json();

  let filtered = currentCategory === 'all'
    ? games
    : games.filter(g => g.tags.split(',').includes(currentCategory));

  filtered = filtered.filter(game => {
    const title = game.title_en;
    return title?.toLowerCase().includes(search);
  });

  filtered.sort((a, b) => {
    const aTitle = a.title_en;
    const bTitle = b.title_en;
    return aTitle?.toLowerCase().localeCompare(bTitle?.toLowerCase());
  });

  container.innerHTML = '';
  filtered.forEach(game => {
    const title = game.title_en;
    const description = currentLang === 'sv' ? game.description_sv : game.description_en;
    const isLent = game.lent_out;

    const playerText = game.min_players
      ? game.max_players && game.max_players !== game.min_players
        ? `${game.min_players}–${game.max_players}`
        : `${game.min_players}`
      : '–';

    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gameId = game.id;
    card.innerHTML = `
      <h3>${title}${isLent ? ' <span style="color:#999;">(Lent out)</span>' : ''}</h3>
      <img src="${game.img}" alt="${title}" style="${isLent ? 'filter: grayscale(1); opacity: 0.5;' : ''}" />
      <div class="game-info">
        <p>${description}</p>
        ${game.rules ? `<p><a href="${game.rules}" target="_blank">📄 Rules</a></p>` : ''}
        <div class="tags">
          👥 ${translations[currentLang].ui.players}: ${playerText} ・
          ⏱ ${translations[currentLang].ui.play_time}: ${game.play_time} ・
          👶 ${translations[currentLang].ui.age}: ${game.age}
        </div>
        <button class="order-button">🎲 Order to Table</button>
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

// 🎯 Click handler for order buttons
document.addEventListener("click", (event) => {
  const button = event.target.closest(".order-button");
  if (button) {
    const card = button.closest(".game-card");
    const gameId = card?.dataset?.gameId;
    if (gameId) startGameOrderFlow(gameId);
  }
});

function startGameOrderFlow(gameId) {
  // 🌐 Placeholder — will include geolocation in Step 2
  alert(`🎲 You’re trying to order game ID: ${gameId}`);
}

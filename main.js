// 🌍 Location settings
const RESTAURANT_LAT = 57.693624;
const RESTAURANT_LNG = 11.951328;
const ALLOWED_RADIUS_METERS = 300;

const translations = {
  sv: {
    intro:
      "Vi har ett brett utbud av sällskapsspel här på Pinchos Linnégatan (eller vi aspirerar i alla fall att ha det). Om du ser något du gillar så beställ det till bordet i appen eller prata med vår personal så tar vi fram det åt dig!",
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
      "We have a wide range of board games here at Pinchos Linnégatan (or at least we aspire to). If you see something you like, order it to the table in the app or talk to our staff and we'll bring it to you!",
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

function bindOrderButtons() {
  const buttons = document.querySelectorAll(".order-button");
  buttons.forEach(button => {
    button.addEventListener("click", (e) => {
      const gameCard = e.target.closest(".game-card");
      const gameId = gameCard.dataset.gameId;

      // Set game ID on modal or hidden input if needed
      const modal = document.getElementById("orderModal");
      modal.dataset.gameId = gameId;

      // Show the modal
      modal.style.display = "flex";
    });
  });
}

function continueAsGuest() {
  localStorage.setItem("guestUser", "true");
  const welcomeModal = document.getElementById("welcomeModal");
  welcomeModal?.classList.remove("show");
  updateTopBar();
}
window.continueAsGuest = continueAsGuest;

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

window.setLanguage = setLanguage;

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
      <button class="order-button">🎲 Order to Table</button> 
      <div class="game-info">
        <p>${description}</p>
        ${game.rules ? `<p><a href="${game.rules}" target="_blank">📄 Rules</a></p>` : ''}
        <div class="tags">
          👥 ${translations[currentLang].ui.players}: ${playerText} ・
          ⏱ ${translations[currentLang].ui.play_time}: ${game.play_time} ・
          👶 ${translations[currentLang].ui.age}: ${game.age}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
bindOrderButtons();
}

function updateTopBar() {
  const userStatus = document.getElementById("userStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const userData = localStorage.getItem("userData");
  const guestUser = localStorage.getItem("guestUser");

  if (userData) {
    const user = JSON.parse(userData);
    const name = (user.first_name || user.last_name)
  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
  : user.phone;
    userStatus.textContent = `👤 Logged in as ${name}`;
  } else if (guestUser) {
    userStatus.textContent = `👤 Logged in as guest`;
  } else {
    userStatus.textContent = "";
  }

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("guestUser");
    location.reload();
  });
}
document.addEventListener("DOMContentLoaded", async () => {
  const spinner = document.getElementById("loadingSpinner");
  const gameList = document.getElementById("gameList");
  const welcomeModal = document.getElementById("welcomeModal");
  const guestBtn = document.getElementById("guestButton");
  const token = localStorage.getItem("userToken") || localStorage.getItem("guestUser");

  if (token) {
    welcomeModal?.classList.remove("show");
  }

  
  updateTopBar(); // ← Add this

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
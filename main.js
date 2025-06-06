// 🌍 Location settings
const RESTAURANT_LAT = 57.693624;
const RESTAURANT_LNG = 11.951328;
const ALLOWED_RADIUS_METERS = 300;

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

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const countryCodes = {
  "🇸🇪 Sweden": "+46",
  "🇳🇴 Norway": "+47",
  "🇫🇮 Finland": "+358",
  "🇩🇰 Denmark": "+45",
  "🇩🇪 Germany": "+49",
  "🇬🇧 UK": "+44",
  "🇺🇸 USA": "+1"
};

document.addEventListener("click", (event) => {
  const button = event.target.closest(".order-button");
  if (button) {
    const card = button.closest(".game-card");
    const gameId = card?.dataset?.gameId;
    if (gameId) startGameOrderFlow(gameId);
  }
});

function startGameOrderFlow(gameId) {
  const game = games.find(g => g.id === Number(gameId));
  const title = game?.title_en || "this game";

  if (!navigator.geolocation) {
    alert(`Your device doesn't support location. Please ask staff to help you get "${title}".`);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const distance = getDistanceMeters(latitude, longitude, RESTAURANT_LAT, RESTAURANT_LNG);

      if (distance > ALLOWED_RADIUS_METERS) {
        alert(`🚫 You're too far away (${Math.round(distance)}m). Please ask our staff to help you get "${title}".`);
        return;
      }

      const first_name = prompt("First name:");
      if (!first_name) return;

      const last_name = prompt("Last name:");
      if (!last_name) return;

      const country = prompt(`Country?\n\n${Object.keys(countryCodes).join('\n')}`);
      if (!country || !countryCodes[country]) {
        alert("❌ Invalid country selected.");
        return;
      }

      let localNumber = prompt("Phone number (without leading 0 or +):");
      if (!localNumber || /[^0-9]/.test(localNumber)) {
        alert("❌ Please enter a valid number.");
        return;
      }

      const phone = `${countryCodes[country]}${localNumber}`;

      const table_id = prompt("Table number:");
      if (!table_id) return;

      if (/^\d{4}$/.test(table_id)) {
        alert("❌ Invalid table number — you probably entered your table *code*. Please enter your actual table number.");
        return;
      }

      try {
        const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/order-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: game.id,
            game_title: title,
            first_name,
            last_name,
            phone,
            table_id
          })
        });

        if (res.ok) {
          alert(`✅ "${title}" has been ordered to your table!`);
        } else {
          alert("❌ Failed to place order. Please ask staff.");
        }
      } catch (err) {
        console.error("Order error:", err);
        alert("❌ Something went wrong. Please ask staff.");
      }
    },
    (error) => {
      console.warn("Geolocation error:", error);
      alert(`📍 To order "${title}" to the table, you need to enable location permissions. Otherwise, just ask our staff and they’ll help you.`);
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

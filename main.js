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
      "2p": "2 spelare",
      quick: "Medan du väntar på maten"
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
      "2p": "2 players",
      quick: "While you wait for your food"
    }
  }
};

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // If something goes wrong, treat as expired
  }
}

function isMemberUser() {
  try {
    const userData = JSON.parse(localStorage.getItem("userData"));
    return userData && userData.membership_status === "active";
  } catch {
    return false;
  }
}

// (rest of code remains unchanged until renderGames)

async function renderGames() {
  const container = document.getElementById('gameList');
  const search = document.getElementById('searchBar').value.toLowerCase();
  const heading = document.getElementById('categoryHeading');
  heading.textContent = translations[currentLang].categories[currentCategory];

  const res = await fetchWithAuth(`${API_BASE}/games`);
  const dataText = await res.text();
  let dataJson;
  try {
    dataJson = JSON.parse(dataText);
  } catch (e) {
    console.error('Failed to parse /games response as JSON:', dataText);
    throw new Error('Invalid JSON from server');
  }
  games = dataJson;

  const isMember = isMemberUser();

  let filtered = currentCategory === 'all'
    ? games
    : games.filter(g => g.tags.split(',').includes(currentCategory));

  filtered = filtered.filter(game => {
    const title = game.title_en;
    return title?.toLowerCase().includes(search);
  });

  filtered = filtered.filter(game => {
    return !game.members_only || isMember;
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
  <div class="order-button">🎲 Order to Table</div>
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
} // end of renderGames

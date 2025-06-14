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
let currentLang = 'en';
let currentCategory = 'all';
let userFavorites = [];
let userWishlist = [];


function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function getUserToken() {
  return localStorage.getItem('userToken');
}
function setUserToken(token) {
  localStorage.setItem('userToken', token);
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
function removeTokens() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
}

function logoutUser() {
  removeTokens();
  window.location.href = 'login.html';
}

async function refreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    if (data.token) {
      setUserToken(data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function fetchWithAuth(url, options = {}, retry = true) {
  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = `Bearer ${getUserToken()}`;

  let res = await fetch(url, options);
  if (res.status === 401 && retry) {
    const refreshed = await refreshToken();
    if (refreshed) {
      options.headers['Authorization'] = `Bearer ${getUserToken()}`;
      res = await fetch(url, options);
    } else {
      logoutUser();
      throw new Error('Unauthorized, please login again.');
    }
  }
  return res;
}
    function goTo(path) {
      const base = window.location.origin + (window.location.hostname === 'localhost' ? '' : '/bradspelsmeny');
      window.location.href = base + path;
    }
    function logout() {
      localStorage.removeItem('userToken');
      localStorage.removeItem('refreshToken');
      goTo('/');
    }
async function fetchUserLists() {
  const userId = JSON.parse(localStorage.getItem("userData"))?.id;
  if (!userId) return;

  const headers = { Authorization: `Bearer ${getUserToken()}` };

  const [favRes, wishRes] = await Promise.all([
    fetch(`${API_BASE}/users/${userId}/favorites`, { headers }),
    fetch(`${API_BASE}/users/${userId}/wishlist`, { headers })
  ]);

  const favData = await favRes.json();
  const wishData = await wishRes.json();

  userFavorites = favData.map(g => g.id);
  userWishlist = wishData.map(g => g.id);
}
async function toggleFavorite(gameId) {
  const btn = document.querySelector(`[data-game-id="${gameId}"] .favorite`);
  const isActive = btn.classList.contains('active');
  const method = isActive ? 'DELETE' : 'POST';

  await fetchWithAuth(`${API_BASE}/favorite`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: JSON.parse(localStorage.getItem("userData")).id, game_id: gameId })
  });

  btn.classList.toggle('active');
  btn.classList.toggle('icon-fav-on');
  btn.classList.toggle('icon-fav-off');

}

async function toggleWishlist(gameId) {
  const btn = document.querySelector(`[data-game-id="${gameId}"] .wishlist`);
  const isActive = btn.classList.contains('active');
  const method = isActive ? 'DELETE' : 'POST';

  await fetchWithAuth(`${API_BASE}/wishlist`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: JSON.parse(localStorage.getItem("userData")).id, game_id: gameId })
  });

  btn.classList.toggle('active');
  btn.classList.toggle('icon-wish-on');
  btn.classList.toggle('icon-wish-off');

}


const profileBtn = document.getElementById('profileBtn');
const userStatus = document.getElementById('userStatus');

function updateUserStatus(user) {
  userStatus.textContent = `Hi, ${user.first_name}!`;
  profileBtn.style.display = 'inline-block';
}

profileBtn.onclick = () => {
  window.location.href = './pages/profile.html';
}

function isMemberUser() {
  try {
    const userData = JSON.parse(localStorage.getItem("userData"));
    return userData && userData.membership_status === "active";
  } catch {
    return false;
  }
}

function getGameApiUrl() {
  const token = localStorage.getItem("userToken");
  return token ? `${API_BASE}/games` : `${API_BASE}/games/public`;
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
      const userData = localStorage.getItem("userData");
      const gameCard = e.target.closest(".game-card");
      const gameId = gameCard.dataset.gameId;

      const modal = document.getElementById("orderModal");
      const userFields = document.getElementById("userFields");
      const notice = document.getElementById("loggedInNotice");
      const orderForm = document.getElementById("orderForm");

      orderForm.reset();
      modal.dataset.gameId = gameId;

      if (userData) {
        if (userFields) {
          userFields.style.display = "none";
          // disable all inputs and selects inside userFields
          const inputs = userFields.querySelectorAll("input, select");
          inputs.forEach(input => input.disabled = true);
        }
        if (notice) notice.style.display = "block";
      } else {
        if (userFields) {
          userFields.style.display = "block";
          // enable all inputs and selects inside userFields
          const inputs = userFields.querySelectorAll("input, select");
          inputs.forEach(input => input.disabled = false);
        }
        if (notice) notice.style.display = "none";
      }

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


async function setLanguage(lang) {
  currentLang = lang;
  currentCategory = 'all';
  renderCategories();
  renderIntro();
  await renderGames();
}

function renderIntro() {
  document.getElementById('intro').textContent = translations[currentLang].intro;
}


window.setLanguage = setLanguage;


async function renderGames() {
  const container = document.getElementById('gameList');
  const search = document.getElementById('searchBar').value.toLowerCase();
  const heading = document.getElementById('categoryHeading');
  heading.textContent = translations[currentLang].categories[currentCategory];

  const res = await fetchWithAuth(getGameApiUrl());
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
  <div class="game-thumbnail-wrapper">
    <img src="${game.img}" alt="${title}" style="${isLent ? 'filter: grayscale(1); opacity: 0.5;' : ''}" />
    <div class="game-card-icons">
      <button class="icon-btn favorite ${userFavorites.includes(game.id) ? 'icon-fav-on' : 'icon-fav-off'}" onclick="toggleFavorite(${game.id})"></button>

      <button class="icon-btn wishlist ${userWishlist.includes(game.id) ? 'icon-wish-on' : 'icon-wish-off'}" onclick="toggleWishlist(${game.id})"></button>

    </div>
  </div>

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
}

function updateTopBar() {
  const userStatus = document.getElementById("userStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const userData = localStorage.getItem("userData");
  const guestUser = localStorage.getItem("guestUser");

  if (userData) {
    const user = JSON.parse(userData);
    const name = user.username && user.username.trim() !== ''
      ? user.username
      : `${user.first_name} ${user.last_name}`.trim() || user.phone;

    userStatus.textContent = `${name}`;
    profileBtn.style.display = 'inline-block';
  } else {
    userStatus.textContent = guestUser ? `Logged in as guest` : '';
    profileBtn.style.display = 'none';
  }

  logoutBtn.addEventListener("click", () => {
  removeTokens();
  localStorage.removeItem("userData");
  localStorage.removeItem("guestUser");

  // Show welcome modal again
  const welcomeModal = document.getElementById("welcomeModal");
  if (welcomeModal) {
    welcomeModal.classList.add("show");
  }

  // Clear userStatus and hide profile button
  document.getElementById("userStatus").textContent = "";
  if (profileBtn) profileBtn.style.display = "none";

  // Clear game list to prevent errors
  document.getElementById("gameList").innerHTML = "";

  // Reset search bar
  const searchBar = document.getElementById('searchBar');
  if (searchBar) searchBar.value = '';

  // Reset category to 'all' and rerender categories to update badges
  currentCategory = 'all';
  renderCategories();

  // Optionally, focus a button in the welcome modal here
});


}


// Distance helper for geolocation
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  function deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  const R = 6371000; // Earth radius in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

document.addEventListener("DOMContentLoaded", async () => {
  const userToken = localStorage.getItem('userToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const isGuest = localStorage.getItem("guestUser");

  // Refresh token if expired
  if (userToken && isTokenExpired(userToken)) {
    if (refreshToken) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        logoutUser();
        return;
      }
    } else {
      logoutUser();
      return;
    }
  }

  const spinner = document.getElementById("loadingSpinner");
  const gameList = document.getElementById("gameList");
  const welcomeModal = document.getElementById("welcomeModal");

  // Hide welcome modal if logged in or guest
  if (userToken || isGuest) {
    welcomeModal?.classList.remove("show");
  }

  try {
    spinner.style.display = "flex";
    gameList.style.display = "none";

    // 🆕 Fetch favorites/wishlist if user is logged in
    if (userToken && !isGuest) {
      await fetchUserLists();
    }

    await setLanguage(currentLang);
    updateTopBar();
  } catch (err) {
    console.error("Unexpected loading error:", err);
    const errorBox = document.createElement('div');
    errorBox.innerHTML = `<p style="color:red; text-align:center;">⚠️ Error loading games.</p>`;
    document.body.appendChild(errorBox);
  } finally {
    spinner.style.display = "none";
    gameList.style.display = "grid";
  }

  // Order modal logic
  const orderForm = document.getElementById("orderForm");
  const orderModal = document.getElementById("orderModal");
  const closeModal = document.getElementById("closeModal");

  closeModal.addEventListener("click", () => {
    orderModal.style.display = "none";
  });

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userData = localStorage.getItem("userData");
    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    const tableInput = orderForm.querySelector('input[name="table_id"]');
    const tableValue = tableInput.value.trim();

    if (/^\d{4}$/.test(tableValue)) {
      alert("🚫 Table number cannot be four digits. You've probably entered your table code instead of your table number.");
      submitButton.disabled = false;
      return;
    }

    const getCurrentPosition = () =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

    try {
      const position = await getCurrentPosition();
      const distance = getDistanceFromLatLonInMeters(
        RESTAURANT_LAT,
        RESTAURANT_LNG,
        position.coords.latitude,
        position.coords.longitude
      );
      if (distance > ALLOWED_RADIUS_METERS) {
        alert("🚫 You are too far from the restaurant to place an order.");
        submitButton.disabled = false;
        return;
      }
    } catch (error) {
      alert("🚫 Unable to verify your location. Please allow location access and try again.");
      submitButton.disabled = false;
      return;
    }

    const gameId = orderModal.dataset.gameId;
    const game = games.find(g => g.id == gameId);
    const formData = new FormData(orderForm);

    let firstName, lastName, phone;

    if (userData) {
      const user = JSON.parse(userData);
      firstName = user.first_name;
      lastName = user.last_name;
      phone = user.phone;
    } else {
      firstName = formData.get("first_name");
      lastName = formData.get("last_name");
      phone = `${formData.get("country_code")}${formData.get("phone")}`;
    }

    const payload = {
      game_id: gameId,
      game_title: game?.title_en || "Unknown",
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      table_id: formData.get("table_id")
    };

    try {
      const res = await fetchWithAuth(`${API_BASE}/order-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to order game");

      alert("🎉 Your game order was placed successfully! Have patience and we'll come out to you with it as soon as we can!");

      orderModal.style.display = "none";
      orderForm.reset();
    } catch (err) {
      console.error("❌ Order submission failed:", err);
      alert("❌ Something went wrong placing your order. Try again!");
    } finally {
      submitButton.disabled = false;
    }
  });
});


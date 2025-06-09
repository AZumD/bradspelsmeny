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
    return true;
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

async function refreshUserToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("userToken", data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function logoutUser() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("guestUser");

  const welcomeModal = document.getElementById("welcomeModal");
  if (welcomeModal) welcomeModal.classList.add("show");

  document.getElementById("userStatus").textContent = "";
  if (window.profileBtn) window.profileBtn.style.display = "none";

  const gameList = document.getElementById("gameList");
  if (gameList) gameList.innerHTML = "";
}

function renderIntro() {
  const introBox = document.getElementById("introBox");
  if (!introBox) return;
  introBox.innerHTML = `<p>${translations[currentLang].intro}</p>`;
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
    logoutUser();
    currentCategory = 'all';
    renderCategories();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const userToken = localStorage.getItem('userToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const isGuest = localStorage.getItem("guestUser");

  if (userToken && isTokenExpired(userToken)) {
    if (refreshToken) {
      const refreshed = await refreshUserToken();
      if (!refreshed) {
        logoutUser();
        return;
      }
    } else {
      logoutUser();
      return;
    }
  }

  const welcomeModal = document.getElementById("welcomeModal");
  if (userToken || isGuest) {
    welcomeModal?.classList.remove("show");
  }

  const spinner = document.getElementById("loadingSpinner");
  const gameList = document.getElementById("gameList");

  try {
    spinner.style.display = "flex";
    gameList.style.display = "none";
    await setLanguage(currentLang);
    renderIntro();
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
});

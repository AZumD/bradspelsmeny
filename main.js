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

function updateTopBar() {
  const topBar = document.getElementById("topBar");
  const userData = localStorage.getItem("userData");
  const guestUser = localStorage.getItem("guestUser");

  let displayName = "";
  if (userData) {
    const user = JSON.parse(userData);
    displayName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.phone;
    topBar.innerHTML = `👤 Logged in as ${displayName} <button id="logoutButton">Logout</button>`;
  } else if (guestUser) {
    topBar.innerHTML = `👤 Logged in as guest <button id="logoutButton">Logout</button>`;
  } else {
    topBar.innerHTML = "";
  }

  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("guestUser");
      location.reload();
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const spinner = document.getElementById("loadingSpinner");
  const gameList = document.getElementById("gameList");
  const welcomeModal = document.getElementById("welcomeModal");
  const guestBtn = document.getElementById("guestButton");
  const token = localStorage.getItem("userToken") || localStorage.getItem("guestUser");

  if (token && welcomeModal) welcomeModal.classList.remove("show");

  if (guestBtn) {
    guestBtn.addEventListener("click", () => {
      localStorage.setItem("guestUser", "true");
      welcomeModal?.classList.remove("show");
      updateTopBar();
    });
  }

  updateTopBar();

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

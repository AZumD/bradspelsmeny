import { fetchUserLists, isFavorite, isWishlisted } from './modules/user-lists.js';
import { renderCategories, renderIntro, renderGames } from './modules/game-list.js';
import { getCurrentLang, setCurrentLang, getCurrentCategory, setCurrentCategory } from './modules/i18n.js';
import { getCurrentLocation, setCurrentLocation } from './modules/location.js';
import { showError, showLoading, hideLoading } from './modules/ui.js';
import { GAME_CATEGORIES, API_BASE } from './modules/config.js';
import { isTokenExpired, getAccessToken, refreshToken, logout } from './modules/auth.js';
import { initPixelNav, initNotificationModal } from './shared/shared-ui.js';

// Make language functions available globally
window.setLanguage = (lang) => {
  setCurrentLang(lang);
  localStorage.setItem('language', lang);
  renderCategories();
  renderIntro();
  renderGames();
};

// Initialize the page
async function initialize() {
  const loading = showLoading();
  
  try {
    // Set up language and category
    const lang = localStorage.getItem('language') || 'sv';
    setCurrentLang(lang);
    setCurrentCategory(GAME_CATEGORIES.ALL);

    // Set up location
    const location = localStorage.getItem('location') || 'bradspelsmeny';
    setCurrentLocation(location);

    // Check authentication
    const userToken = getAccessToken();
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const isGuest = localStorage.getItem("guestUser");

    // Initialize pixel navigation only if logged in
    if (userToken || isGuest) {
      initPixelNav();
    } else {
      const pixelNav = document.getElementById('pixelNav');
      if (pixelNav) {
        pixelNav.style.display = 'none';
      }
    }

    // Refresh token if expired
    if (userToken && isTokenExpired(userToken)) {
      if (storedRefreshToken) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          logout();
          return;
        }
      } else {
        logout();
        return;
      }
    }

    // Hide welcome modal if logged in or guest
    const welcomeModal = document.getElementById("welcomeModal");
    if (userToken || isGuest) {
      welcomeModal?.classList.remove("show");
    }

    // Fetch user lists if logged in
    if (userToken && !isGuest) {
      await fetchUserLists();
    }

    // Render initial content
    renderCategories();
    renderIntro();
    await renderGames();
    bindOrderButtons();

    // Set up event listeners
    setupEventListeners();

    // Initialize notification modal
    initNotificationModal();
  } catch (err) {
    console.error('Failed to initialize:', err);
    showError('Failed to load page content');
  } finally {
    hideLoading(loading);
  }
}

function setupEventListeners() {
  // Language toggle buttons are handled by onclick in HTML
  // Location toggle is not implemented in HTML yet

  // Search input
  const searchInput = document.getElementById('searchBar');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      renderGames();
    }, 300));
  }

  // Order modal
  const orderForm = document.getElementById("orderForm");
  const orderModal = document.getElementById("orderModal");
  const closeModal = document.getElementById("closeModal");

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      orderModal.style.display = "none";
    });
  }

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

    // Add party_id to payload if selected
    const partyId = formData.get("party_id");
    if (partyId) {
      payload.party_id = partyId;
    }

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
}

function bindOrderButtons() {
  const buttons = document.querySelectorAll(".order-button");
  buttons.forEach(button => {
    button.addEventListener("click", async (e) => {
      const userData = localStorage.getItem("userData");
      const gameCard = e.target.closest(".game-card");
      const gameId = gameCard.dataset.gameId;

      const modal = document.getElementById("orderModal");
      const userFields = document.getElementById("userFields");
      const notice = document.getElementById("loggedInNotice");
      const orderForm = document.getElementById("orderForm");
      const partySelection = document.getElementById("partySelection");
      const partySelect = document.getElementById("partySelect");

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
        
        // Show party selection and fetch parties for logged-in users
        if (partySelection) {
          partySelection.style.display = "block";
          try {
            const res = await fetch(`${API_BASE}/my-parties`, {
              headers: { Authorization: `Bearer ${getAccessToken()}` }
            });
            if (!res.ok) throw new Error("Failed to fetch parties");
            
            const parties = await res.json();
            partySelect.innerHTML = '<option value="">--</option>' + 
              parties.map(party => `<option value="${party.id}">${party.name}</option>`).join('');
          } catch (err) {
            console.error("Failed to fetch parties:", err);
            partySelection.style.display = "none";
          }
        }
      } else {
        if (userFields) {
          userFields.style.display = "block";
          // enable all inputs and selects inside userFields
          const inputs = userFields.querySelectorAll("input, select");
          inputs.forEach(input => input.disabled = false);
        }
        if (notice) notice.style.display = "none";
        if (partySelection) partySelection.style.display = "none";
      }

      modal.style.display = "flex";
    });
  });
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize); 
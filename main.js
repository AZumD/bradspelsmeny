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

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

// --- Your existing auth/token/helper functions here ---

// Helper: Calculate distance between two lat/lon points (meters)
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

// ... all your previous functions (getUserToken, refreshToken, etc.) remain unchanged ...

document.addEventListener("DOMContentLoaded", async () => {
  // ... your existing DOMContentLoaded code, rendering, loading, etc. ...

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

    // Check 4-digit table number — disallow
    const tableInput = orderForm.querySelector('input[name="table_id"]');
    if (/^\d{4}$/.test(tableInput.value)) {
      alert("🚫 Table number cannot be four digits.");
      submitButton.disabled = false;
      return;
    }

    // Geolocation check before order
    if (!navigator.geolocation) {
      alert("🚫 Geolocation is not supported by your browser. Unable to place order.");
      submitButton.disabled = false;
      return;
    }

    // Wrap geolocation in a Promise so we can await it
    const getCurrentPosition = () =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
        });
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

      // Show confirmation message
      alert("🎉 Your game order was placed successfully!");

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

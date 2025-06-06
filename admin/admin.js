// 🔒 Check for valid admin token
(function () {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("Du måste vara inloggad för att se denna sida.");
    window.location.href = "login.html";
  } else {
    fetchStats(token);
  }
})();

// ✅ Admin dashboard loaded
console.log("✅ Admin dashboard loaded.");

async function fetchStats(token) {
  try {
    const [totalGamesRes, lentOutRes, mostLentRes] = await Promise.all([
      fetch("https://bradspelsmeny-backend-production.up.railway.app/stats/total-games", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("https://bradspelsmeny-backend-production.up.railway.app/stats/lent-out", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("https://bradspelsmeny-backend-production.up.railway.app/stats/most-lent-this-month", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!totalGamesRes.ok || !lentOutRes.ok || !mostLentRes.ok) {
      throw new Error("Failed to fetch stats");
    }

    const totalGamesData = await totalGamesRes.json();
    const lentOutData = await lentOutRes.json();
    const mostLentData = await mostLentRes.json();

    document.getElementById("totalGamesCount").textContent = totalGamesData.total;
    document.getElementById("lentOutCount").textContent = lentOutData.lentOut;

    const mostPlayedTitle = document.querySelector(".tile.large h2");
    const mostPlayedValue = document.querySelector(".tile.large .value");
    if (mostPlayedTitle && mostPlayedValue) {
      mostPlayedTitle.textContent = "Mest spelade denna månad";
      mostPlayedValue.textContent = mostLentData.title || "–";
    }

  } catch (err) {
    console.error("❌ Failed to fetch stats:", err);
  }
}

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

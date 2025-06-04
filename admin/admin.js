// admin.js

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
    const [totalGamesRes, lentOutRes] = await Promise.all([
      fetch("https://bradspelsmeny-backend-production.up.railway.app/stats/total-games", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("https://bradspelsmeny-backend-production.up.railway.app/stats/lent-out", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!totalGamesRes.ok || !lentOutRes.ok) {
      throw new Error("Failed to fetch stats");
    }

    const totalGamesData = await totalGamesRes.json();
    const lentOutData = await lentOutRes.json();

    document.getElementById("totalGamesCount").textContent = totalGamesData.total;
    document.getElementById("lentOutCount").textContent = lentOutData.lentOut;
  } catch (err) {
    console.error("❌ Failed to fetch stats:", err);
  }
}

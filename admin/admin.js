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
async function fetchOrders() {
  try {
    const token = localStorage.getItem("adminToken");
    const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/order-game/latest", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const orders = await res.json();

    const container = document.getElementById("orderFeed");
    if (!orders.length) {
      container.innerHTML = "<h3>📦 Latest Game Orders:</h3><p style='opacity:0.5'>No orders yet</p>";
      return;
    }

    container.innerHTML = "<h3>📦 Latest Game Orders:</h3>" + orders.map(order => `
      <div style="margin:10px 0; border-bottom:1px dashed #999; padding-bottom:8px;">
        <strong>${order.game_title}</strong> ➜ Table <strong>${order.table_id}</strong>
        <span style="opacity:0.6;">by ${order.first_name}</span><br>
        <small>${new Date(order.created_at).toLocaleString()}</small><br>
        <button onclick="completeOrder(${order.id}, ${order.game_id}, '${order.first_name}', '${order.last_name}', '${order.phone}', '${order.table_id}')">
          ✅ Complete Order
        </button>
      </div>
    `).join("") + `
      <button onclick="clearAllOrders()" style="margin-top:15px;">🧹 Clear All Orders</button>
    `;
  } catch (err) {
    console.error("Failed to fetch game orders:", err);
  }
}


setInterval(fetchOrders, 5000); // refresh every 5 seconds
document.addEventListener("DOMContentLoaded", fetchOrders);

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

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
      container.innerHTML = "<p style='padding:20px; font-style:italic;'>📭 No current game orders.</p>";
      return;
    }

    container.innerHTML = "<h3>📦 Latest Game Orders:</h3>" + orders.map(order => `
      <div style="margin:10px 0; border-bottom:1px dashed #999;">
        <strong>${order.game_title}</strong> ➜ Table <strong>${order.table_id}</strong> by <strong>${order.first_name}</strong><br>
        <small>${new Date(order.created_at).toLocaleString()}</small><br>
        <button onclick="completeOrder(${order.id})">✅ Complete Order</button>
      </div>
    `).join("");

    // Show "Clear All Orders" button if orders exist
    const clearBtnId = "clearAllOrdersButton";
    if (!document.getElementById(clearBtnId)) {
      const btn = document.createElement("button");
      btn.id = clearBtnId;
      btn.textContent = "🧹 Clear All Orders";
      btn.onclick = clearAllOrders;
      container.appendChild(btn);
    }

  } catch (err) {
    console.error("Failed to fetch game orders:", err);
  }
}
async function completeOrder(orderId) {
  const token = localStorage.getItem("adminToken");

  if (!confirm("Are you sure you want to complete this order and lend out the game?")) return;

  try {
    const res = await fetch(`https://bradspelsmeny-backend-production.up.railway.app/order-game/${orderId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to complete order");

    alert("✅ Order completed and game lent out.");
    fetchOrders(); // refresh orders
  } catch (err) {
    console.error("❌ Failed to complete order:", err);
    alert("⚠️ Something went wrong completing the order.");
  }
}

async function clearAllOrders() {
  const token = localStorage.getItem("adminToken");
  if (!confirm("This will clear all pending orders. Are you sure?")) return;

  try {
    const res = await fetch(`https://bradspelsmeny-backend-production.up.railway.app/order-game`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to clear all orders");

    alert("🧹 All orders cleared.");
    fetchOrders();
  } catch (err) {
    console.error("❌ Failed to clear orders:", err);
    alert("⚠️ Could not clear orders.");
  }
}


async function completeOrder(orderId, gameId, firstName, lastName, phone, tableId) {
  const token = localStorage.getItem("adminToken");

  try {
    // 1. Create user
    const userRes = await fetch("https://bradspelsmeny-backend-production.up.railway.app/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, phone })
    });

    const user = await userRes.json();
    const userId = user.id;

    // 2. Lend game
    await fetch(`https://bradspelsmeny-backend-production.up.railway.app/lend/${gameId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, note: `Table ${tableId}` })
    });

    // 3. Remove order from queue
    await fetch(`https://bradspelsmeny-backend-production.up.railway.app/order-game/${orderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchOrders(); // Refresh view
  } catch (err) {
    console.error("❌ Failed to complete order:", err);
    alert("Something went wrong when completing the order.");
  }
}
async function clearAllOrders() {
  const token = localStorage.getItem("adminToken");

  try {
    await fetch("https://bradspelsmeny-backend-production.up.railway.app/order-game", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchOrders();
  } catch (err) {
    console.error("❌ Failed to clear orders:", err);
  }
}



setInterval(fetchOrders, 5000); // refresh every 5 seconds
document.addEventListener("DOMContentLoaded", fetchOrders);

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

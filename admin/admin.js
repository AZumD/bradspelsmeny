// 🔒 Check for valid admin token immediately
(async function () {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("Du måste vara inloggad för att se denna sida.");
    window.location.href = "login.html";
  } else {
    try {
      await fetchStats();
      await fetchOrders();
    } catch {
      // If fetching fails due to auth, handled in fetchWithAdminAuth
    }
  }
})();

// ✅ Admin dashboard loaded
console.log("✅ Admin dashboard loaded.");

// Refresh admin token using stored refresh token
async function refreshAdminToken() {
  const refreshToken = localStorage.getItem("adminRefreshToken");
  if (!refreshToken) return false;

  try {
    const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/admin/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRefreshToken");
      return false;
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("adminToken", data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Wrapper fetch that automatically refreshes token if expired
async function fetchWithAdminAuth(url, options = {}, retry = true) {
  if (!options.headers) options.headers = {};
  const token = localStorage.getItem("adminToken");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, options);

  if (res.status === 401 && retry) {
    const refreshed = await refreshAdminToken();
    if (refreshed) {
      options.headers["Authorization"] = `Bearer ${localStorage.getItem("adminToken")}`;
      res = await fetch(url, options);
    } else {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRefreshToken");
      alert("Din session har gått ut. Vänligen logga in igen.");
      window.location.href = "login.html";
      throw new Error("Unauthorized, please login again.");
    }
  }
  return res;
}

async function fetchStats() {
  try {
    const [totalGamesRes, lentOutRes, mostLentRes] = await Promise.all([
      fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/stats/total-games"),
      fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/stats/lent-out"),
      fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/stats/most-lent-this-month"),
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
    const res = await fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/order-game/latest");
    if (!res.ok) throw new Error("Failed to fetch orders");

    const orders = await res.json();

    const container = document.getElementById("orderFeed");
    if (!orders.length) {
      container.innerHTML = "<p style='padding:20px; font-style:italic;'>📭 No current game orders.</p>";
      return;
    }

    container.innerHTML = "<h3>📦 Latest Game Orders:</h3>" + orders.map(order => `
      <div style="margin:10px 0; border-bottom:1px dashed #999;">
        <strong>${order.game_title}</strong> ➔ Table <strong>${order.table_id}</strong> by <strong>${order.first_name}</strong><br>
        <small>${new Date(order.created_at).toLocaleString()}</small><br>
        <button onclick="completeOrder(${order.id}, ${order.game_id}, '${order.first_name}', '${order.last_name}', '${order.phone}', '${order.table_id}')">✅ Complete Order</button>
      </div>
    `).join("");

    const clearBtnId = "clearAllOrdersButton";
    if (!document.getElementById(clearBtnId)) {
      const btn = document.createElement("button");
      btn.id = clearBtnId;
      btn.textContent = "🪩 Clear All Orders";
      btn.onclick = clearAllOrders;
      container.appendChild(btn);
    }

  } catch (err) {
    console.error("Failed to fetch game orders:", err);
  }
}

async function completeOrder(orderId, gameId, firstName, lastName, phone, tableId) {
  try {
    const usersRes = await fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/users");
    if (!usersRes.ok) {
      alert("❌ Failed to fetch users.");
      return;
    }
    const users = await usersRes.json();

    let user = users.find(u => u.phone === phone);

    if (!user) {
      const userRes = await fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone })
      });

      if (!userRes.ok) {
        alert("❌ Failed to create user.");
        return;
      }

      user = await userRes.json();
    }

    const lendRes = await fetchWithAdminAuth(`https://bradspelsmeny-backend-production.up.railway.app/lend/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, note: `Table ${tableId}` })
    });

    if (!lendRes.ok) {
      alert("❌ Failed to lend out game.");
      return;
    }

    const deleteOrderRes = await fetchWithAdminAuth(`https://bradspelsmeny-backend-production.up.railway.app/order-game/${orderId}`, {
      method: "DELETE"
    });

    if (!deleteOrderRes.ok) {
      alert("❌ Failed to delete order.");
      return;
    }

    alert("✅ Order completed and game lent out.");
    fetchOrders();

  } catch (err) {
    console.error("❌ Failed to complete order:", err);
    alert("Something went wrong when completing the order.");
  }
}

async function clearAllOrders() {
  try {
    const res = await fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/order-game", {
      method: "DELETE"
    });

    if (!res.ok) {
      alert("❌ Failed to clear orders.");
      return;
    }

    fetchOrders();
  } catch (err) {
    console.error("❌ Failed to clear orders:", err);
  }
}

setInterval(fetchOrders, 5000);

function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminRefreshToken");
  window.location.href = "login.html";
}

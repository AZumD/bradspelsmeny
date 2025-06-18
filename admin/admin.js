import {
  getAccessToken,
  getUserRole,
  refreshToken,
  fetchWithAuth
} from '../js/modules/auth.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

// 🔍 Helper: parse JWT
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// 🔄 Refresh token
async function refreshToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("refreshToken");
      return false;
    }

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

// 📦 Auth wrapper
async function fetchWithAuth(url, options = {}, retry = true) {
  if (!options.headers) options.headers = {};
  const token = localStorage.getItem("userToken");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, options);

  if (res.status === 401 && retry) {
    const refreshed = await refreshToken();
    if (refreshed) {
      options.headers["Authorization"] = `Bearer ${localStorage.getItem("userToken")}`;
      res = await fetch(url, options);
    } else {
      localStorage.removeItem("userToken");
      localStorage.removeItem("refreshToken");
      alert("Din session har gått ut. Vänligen logga in igen.");
      window.location.href = "/bradspelsmeny/pages/login.html";
      throw new Error("Unauthorized, please login again.");
    }
  }

  return res;
}

function goTo(path) {
  const base = window.location.origin + (window.location.hostname === 'localhost' ? '' : '/bradspelsmeny');
  window.location.href = base + path;
}

// 📊 Fetch stats
async function fetchStats() {
  console.log("📊 Fetching stats...");
  try {
    const [totalGamesRes, lentOutRes, mostLentRes] = await Promise.all([
      fetchWithAuth("https://bradspelsmeny-backend-production.up.railway.app/stats/total-games"),
      fetchWithAuth("https://bradspelsmeny-backend-production.up.railway.app/stats/lent-out"),
      fetchWithAuth("https://bradspelsmeny-backend-production.up.railway.app/stats/most-lent-this-month"),
    ]);

    if (!totalGamesRes.ok || !lentOutRes.ok || !mostLentRes.ok) {
      throw new Error("Failed to fetch stats");
    }

    const totalGamesData = await totalGamesRes.json();
    const lentOutData = await lentOutRes.json();
    const mostLentData = await mostLentRes.json();

    console.log("📈 Stats fetched:", { totalGames: totalGamesData, lentOut: lentOutData, mostLent: mostLentData });

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

// 🧾 Fetch orders
async function fetchOrders() {
  console.log("📥 Fetching latest orders...");
  try {
    const res = await fetchWithAuth("https://bradspelsmeny-backend-production.up.railway.app/order-game/latest");
    if (!res.ok) throw new Error("Failed to fetch orders");

    const orders = await res.json();
    console.log("✅ Orders fetched:", orders);

    const container = document.getElementById("orderFeed");

    if (!orders.length) {
      console.log("📭 No game orders found");
      container.innerHTML = "<p style='padding:20px; font-style:italic;'>📭 No current game orders.</p>";
      return;
    }

    container.innerHTML = "<h3>📦 Latest Game Orders:</h3>" + orders.map(order => `
      <div style="margin:10px 0; border-bottom:1px dashed #999;">
        <strong>${order.game_title}</strong> ➔ Table <strong>${order.table_id}</strong> by <strong>${order.first_name}</strong><br>
        <small>${new Date(order.created_at).toLocaleString()}</small><br>
        <button onclick="completeOrder(${order.id}, '${order.first_name}', '${order.last_name}', '${order.phone}', '${order.table_id}')">✅ Complete Order</button>
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
    console.error("❌ Failed to fetch game orders:", err);
  }
}

// ✅ Complete order
async function completeOrder(orderId, firstName, lastName, phone, tableId) {
  console.log(`⚙️ Starting order completion for ID: ${orderId}`);
  try {
    const orderRes = await fetchWithAuth(`${API_BASE}/order-game/${orderId}`);
    if (!orderRes.ok) {
      alert("❌ Failed to fetch order details.");
      return;
    }
    const order = await orderRes.json();
    console.log("📦 Fetched order details:", order);

    console.log(`🎯 Lending out game ID: ${order.game_id} to user ID: ${order.user_id}`);
    const lendRes = await fetchWithAuth(`${API_BASE}/lend/${order.game_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: order.user_id,
        note: `Table ${order.table_id}`,
        partyId: order.party_id || null
      })
    });

    if (!lendRes.ok) {
      console.error("❌ Failed to lend out game:", await lendRes.text());
      alert("❌ Failed to lend out game.");
      return;
    }
    console.log("✅ Game successfully lent out");

    console.log(`🧹 Attempting to delete order ID: ${orderId}`);
    const deleteOrderRes = await fetchWithAuth(`${API_BASE}/order-game/${orderId}`, {
      method: "DELETE"
    });

    if (!deleteOrderRes.ok) {
      console.error("❌ Failed to delete order:", await deleteOrderRes.text());
      alert("❌ Failed to delete order.");
      return;
    }
    console.log("🧼 Order deleted successfully");

    alert("✅ Order completed and game lent out.");
    setTimeout(fetchOrders, 300);
    

  } catch (err) {
    console.error("❌ Detailed error in completeOrder:", err);
    alert("Something went wrong when completing the order.");
  }
}

// 🧼 Clear orders
async function clearAllOrders() {
  console.log("🧹 Clearing all orders...");
  try {
    const res = await fetchWithAuth("https://bradspelsmeny-backend-production.up.railway.app/order-game", {
      method: "DELETE"
    });

    if (!res.ok) {
      console.error("❌ Failed to clear orders:", await res.text());
      alert("❌ Failed to clear orders.");
      return;
    }

    console.log("🧼 All orders cleared successfully");
    fetchOrders();
  } catch (err) {
    console.error("❌ Failed to clear orders:", err);
  }
}

// 🔒 Immediately check token and role
(async function () {
  const token = getAccessToken();
  
  if (!token) {
    console.log("🔒 No token found, redirecting to login");
    window.location.href = "/bradspelsmeny/pages/login.html";
    return;
  }
  
  const role = getUserRole();
  console.log("🔑 Token parsed:", { role });
  
  if (!role || role !== "admin") {
    console.log("🚫 Invalid or non-admin token, redirecting to login");
    window.location.href = "/bradspelsmeny/pages/login.html";
    return;
  }
  
  // Optional: Check token expiration
  const decoded = parseJwt(token);
  if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
    console.log("⏰ Token expired, redirecting to login");
    localStorage.removeItem("userToken");
    window.location.href = "/bradspelsmeny/pages/login.html";
    return;
  }
})();

// Continue only if valid admin
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 Admin dashboard loading...");
  
  initPixelNav(); // 🧩 From shared-ui.js
  console.log("🧩 Navigation initialized");
  
  updateNotificationIcon(); // 🔔 Just update icon on load  
  console.log("🔔 Notification icon updated");
  setInterval(updateNotificationIcon, 60000); // 🔁 Refresh every minute
  
  fetchStats();
  fetchOrders();
  setInterval(fetchOrders, 5000);
  console.log("✅ Admin dashboard loaded.");
  
  const adminToggle = document.getElementById("adminMenuToggle");
  const adminDropdown = document.getElementById("adminMenuDropdown");
  const logoutIcon = document.getElementById("logoutIcon");
  
  // Modal click-to-close functionality
  window.addEventListener('click', (e) => {
    document.querySelectorAll('.modal').forEach((modal) => {
      if (e.target === modal && getComputedStyle(modal).display !== 'none') {
        modal.style.display = 'none';
      }
    });
  });
});


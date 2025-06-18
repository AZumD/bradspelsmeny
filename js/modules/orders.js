import { API_ENDPOINTS } from './config.js';
import { fetchWithAuth } from './api.js';


let cachedGames = [];

export async function fetchOrders() {
  try {
    // 🔁 Fetch and cache all games once
    if (!cachedGames.length) {
      const gameRes = await fetchWithAuth(API_ENDPOINTS.GAMES);
      if (!gameRes.ok) throw new Error("Failed to fetch games");
      cachedGames = await gameRes.json();
    }

    const res = await fetchWithAuth(API_ENDPOINTS.ORDERS.LATEST);
    if (!res.ok) throw new Error("Failed to fetch orders");

    const orders = await res.json();
    console.log('📦 Orders from backend:', orders);  // Debug log

    const container = document.getElementById("orderFeed");

    if (!orders.length) {
      container.innerHTML = "<p style='padding:20px; font-style:italic;'>📭 No current game orders.</p>";
      return;
    }

    container.innerHTML = "<h3>📦 Latest Game Orders:</h3>" + orders.map(order => {
      const game = cachedGames.find(g => g.id == order.game_id);
      const title = game?.title_sv || game?.title_en || `Game #${order.game_id}`;

      console.log('🎲 Order details:', {
        id: order.id,
        game_id: order.game_id,
        resolved_title: title,
        first_name: order.first_name,
        last_name: order.last_name,
        table_id: order.table_id
      });

      return `
        <div style="margin:10px 0; border-bottom:1px dashed #999;">
          <strong>${title}</strong> ➔ Table <strong>${order.table_id}</strong> by <strong>${order.first_name}</strong><br>
          <small>${new Date(order.created_at).toLocaleString()}</small><br>
          <button onclick="completeOrder(${order.id}, ${order.game_id}, '${order.first_name}', '${order.last_name}', '${order.phone}', '${order.table_id}')">✅ Complete Order</button>
        </div>
      `;
    }).join("");

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


export async function completeOrder(orderId, gameId, firstName, lastName, phone, tableId) {
    try {
        const usersRes = await fetchWithAuth(API_ENDPOINTS.USERS);
        if (!usersRes.ok) {
            alert("❌ Failed to fetch users.");
            return;
        }
        const users = await usersRes.json();
        let user = users.find(u => u.phone === phone);

        if (!user) {
            const userRes = await fetchWithAuth(API_ENDPOINTS.USERS, {
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

        const lendRes = await fetchWithAuth(API_ENDPOINTS.LEND(gameId), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, note: `Table ${tableId}` })
        });

        if (!lendRes.ok) {
            alert("❌ Failed to lend out game.");
            return;
        }

        const deleteOrderRes = await fetchWithAuth(`${API_ENDPOINTS.ORDERS.DELETE}/${orderId}`, {
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

export async function clearAllOrders() {
    try {
        const res = await fetchWithAuth(API_ENDPOINTS.ORDERS.DELETE, {
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
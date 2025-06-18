import { API_ENDPOINTS } from './config.js';
import { fetchWithAuth } from './api.js';


let cachedGames = [];

export async function fetchOrders() {
    try {
      if (!cachedGames.length) {
        const gameRes = await fetchWithAuth(API_ENDPOINTS.GAMES);
        if (!gameRes.ok) throw new Error("Failed to fetch games");
        cachedGames = await gameRes.json();
      }
  
      const res = await fetchWithAuth(API_ENDPOINTS.ORDERS.LATEST);
      if (!res.ok) throw new Error("Failed to fetch orders");
  
      const orders = await res.json();
      const container = document.getElementById("orderFeed");
  
      if (!orders.length) {
        container.innerHTML = "<p style='padding:20px; font-style:italic;'>📭 No current game orders.</p>";
        return;
      }
  
      container.innerHTML = "<h3>📦 Latest Game Orders:</h3>" + orders.map(order => {
        const game = cachedGames.find(g => g.id == order.game_id);
        const title = game?.title_sv || game?.title_en || `Game #${order.game_id}`;
  
        return `
          <div style="margin:10px 0; border-bottom:1px dashed #999;">
            <strong>${title}</strong> ➔ Table <strong>${order.table_id}</strong> by <strong>${order.first_name}</strong><br>
            <small>${new Date(order.created_at).toLocaleString()}</small><br>
            <button class="complete-order-btn"
                    data-id="${order.id}"
                    data-game-id="${order.game_id}"
                    data-first-name="${order.first_name}"
                    data-last-name="${order.last_name}"
                    data-phone="${order.phone}"
                    data-table-id="${order.table_id}">
              ✅ Complete Order
            </button>
          </div>
        `;
      }).join("");
  
      // ✅ Attach click handler
      document.querySelectorAll(".complete-order-btn").forEach(button => {
        button.addEventListener("click", () => {
          completeOrder(
            button.dataset.id,
            button.dataset["gameId"],
            button.dataset["firstName"],
            button.dataset["lastName"],
            button.dataset["phone"],
            button.dataset["tableId"]
          );
        });
      });
  
      // Add clear all orders button
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
  


  export async function completeOrder(orderId) {
    try {
      const res = await fetchWithAuth(`${API_ENDPOINTS.ORDERS.COMPLETE(orderId)}`, {
        method: "POST"
      });
  
      if (!res.ok) {
        alert("❌ Failed to complete order.");
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
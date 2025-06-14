// 🔒 Check for valid admin access
(async function () {
  const token = localStorage.getItem("userToken");
  if (!token) {
    alert("Du måste vara inloggad för att se denna sida.");
    window.location.href = "/bradspelsmeny/pages/login.html";
    return;
  }

  const decoded = parseJwt(token);
  if (!decoded || decoded.role !== "admin") {
    alert("Endast administratörer har åtkomst till denna sida.");
    window.location.href = "/bradspelsmeny/pages/login.html";
    return;
  }

  try {
    await fetchStats();
    await fetchOrders();
  } catch {
    // Fail silently
  }
})();

console.log("✅ Admin dashboard loaded.");

// Helper: parse JWT
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// Refresh token using stored refreshToken
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

// Wrapper fetch that refreshes token if expired
async function fetchWithAuth(url, option

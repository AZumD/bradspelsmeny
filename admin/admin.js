// admin.js

// 🔒 Check for valid admin token
(function () {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("Du måste vara inloggad för att se denna sida.");
    window.location.href = "login.html";
  }
})();

// ✅ Admin dashboard loaded
console.log("✅ Admin dashboard loaded.");

// This script is now minimal and only responsible for initializing dashboard stats or lightweight UI
// logic on the admin landing page. All edit functionality has been moved to edit-games.js.

// If you need to add dashboard functionality like usage stats, chart rendering, or tile updates,
// this is the place to do it.

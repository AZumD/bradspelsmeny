// login.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed.");
        return;
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userName", `${data.user.first_name} ${data.user.last_name}`);

      alert(`🎉 Welcome, ${data.user.first_name}!`);
      window.location.href = "index.html"; // or your guest homepage
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});

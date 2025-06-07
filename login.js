document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const phoneInput = document.getElementById("phone").value;
    const countryCode = document.getElementById("country_code").value;
    const password = document.getElementById("password").value;

    const fullPhone = `${countryCode}${phoneInput.replace(/\D/g, "")}`; // Clean digits

    try {
      const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed.");
        return;
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      // 🚪 Redirect to table selection or main app
      window.location.href = "index.html"; // Change this if needed
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const country_code = document.getElementById("country_code").value;
    const rawPhone = document.getElementById("phone").value.replace(/\D/g, "");
    const password = document.getElementById("password").value;

    const phone = `${country_code}${rawPhone}`;

    try {
      const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed.");
        return;
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userName", `${data.user.first_name} ${data.user.last_name}`);

      alert(`👋 Welcome back, ${data.user.first_name}!`);
      window.location.href = "index.html"; // or wherever your app lands
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});

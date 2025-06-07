document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const first_name = document.getElementById("first_name").value.trim();
    const last_name = document.getElementById("last_name").value.trim();
    const country_code = document.getElementById("country_code").value;
    const rawPhone = document.getElementById("phone").value.replace(/\D/g, "");
    const password = document.getElementById("password").value;

    const phone = `${country_code}${rawPhone}`;

    try {
      const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, phone, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Registration failed.");
        return;
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userName", `${data.user.first_name} ${data.user.last_name}`);

      alert(`👋 Welcome, ${data.user.first_name}!`);
      window.location.href = "index.html"; // Or guest homepage
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});

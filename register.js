document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const first_name = document.getElementById("first_name").value.trim();
    const last_name = document.getElementById("last_name").value.trim();
    const country_code = document.getElementById("country_code").value;
    const rawPhone = document.getElementById("phone").value.replace(/\D/g, "");
    const password = document.getElementById("password").value;

    const phone = `${country_code}${rawPhone}`;

    if (!username) {
      alert("Please enter a username.");
      return;
    }

    try {
      const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          first_name,
          last_name,
          phone,
          password,
          membership_status: "active"  // 👈 Make them active members
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Registration failed.");
        return;
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userName", `${data.user.first_name} ${data.user.last_name}`);
      localStorage.setItem("userData", JSON.stringify(data.user)); // 👈 Make sure to save full user data

      alert(`🎉 Welcome, ${data.user.first_name}! Your account is ready.`);
      window.location.href = "index.html";
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});

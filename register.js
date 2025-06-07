document.getElementById("registerForm").onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("userToken", data.token);
    alert("🎉 Registered successfully!");
    window.location.href = "index.html"; // or wherever logged-in users should go
  } else {
    alert(`⚠️ ${data.error}`);
  }
};

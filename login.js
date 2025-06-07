document.getElementById("loginForm").onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("userToken", data.token);
    alert(`👋 Welcome back, ${data.user.first_name}!`);
    window.location.href = "index.html";
  } else {
    alert(`❌ ${data.error}`);
  }
};

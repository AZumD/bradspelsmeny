const API_URL = "https://bradspelsmeny-backend-production.up.railway.app/users";

async function refreshAdminToken() {
  const refreshToken = localStorage.getItem("adminRefreshToken");
  if (!refreshToken) return false;

  try {
    const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/admin/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("adminToken", data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function fetchWithAdminAuth(url, options = {}, retry = true) {
  if (!options.headers) options.headers = {};
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  options.headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url, options);
  if (res.status === 401 && retry) {
    const refreshed = await refreshAdminToken();
    if (refreshed) {
      options.headers['Authorization'] = `Bearer ${localStorage.getItem("adminToken")}`;
      res = await fetch(url, options);
    } else {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRefreshToken");
      window.location.href = "login.html";
      return;
    }
  }
  return res;
}

document.addEventListener("DOMContentLoaded", () => {
  const addUserButton = document.getElementById("addUserButton");
  const userModal = document.getElementById("userModal");
  const userForm = document.getElementById("userForm");
  const userList = document.getElementById("userList");

  const badgeModal = document.getElementById("badgeModal");
  const badgeForm = document.getElementById("badgeForm");
  const badgeSelect = document.getElementById("badgeSelect");

  if (!localStorage.getItem("adminToken")) {
    window.location.href = "login.html";
    return;
  }

  addUserButton.onclick = () => {
    userForm.reset();
    userForm.dataset.editingId = "";
    userModal.style.display = "flex";
  };

  userModal.addEventListener("click", (e) => {
    if (e.target === userModal) userModal.style.display = "none";
  });

  badgeModal.addEventListener("click", (e) => {
    if (e.target === badgeModal) badgeModal.style.display = "none";
  });

  userForm.onsubmit = async (e) => {
    e.preventDefault();

    const editingId = userForm.dataset.editingId;
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? "PUT" : "POST";

    const formData = new URLSearchParams();
    formData.append("username", userForm.username.value);
    formData.append("password", userForm.password.value);
    formData.append("first_name", userForm.firstName.value);
    formData.append("last_name", userForm.lastName.value);
    formData.append("phone", userForm.phone.value);
    formData.append("email", userForm.email.value);
    formData.append("id_number", userForm.idNumber.value);

    try {
      const res = await fetchWithAdminAuth(url, {
        method,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });

      if (res.ok) {
        loadUsers();
        userModal.style.display = "none";
      } else {
        alert("Något gick fel vid sparandet av användare.");
      }
    } catch (err) {
      console.error("Failed to save user:", err);
      alert("Något gick fel vid sparandet av användare.");
    }
  };

  async function openBadgeModal(userId) {
    document.getElementById("badgeUserId").value = userId;

    try {
      const res = await fetchWithAdminAuth("https://bradspelsmeny-backend-production.up.railway.app/badges");
      if (!res.ok) throw new Error("Could not fetch badges");
      const badges = await res.json();

      badgeSelect.innerHTML = "";
      badges.forEach(badge => {
        const opt = document.createElement("option");
        opt.value = badge.id;
        opt.textContent = `${badge.name} – ${badge.description}`;
        badgeSelect.appendChild(opt);
      });

      badgeModal.style.display = "flex";
    } catch (err) {
      console.error("❌ Failed to open badge modal:", err);
      alert("Kunde inte hämta badges.");
    }
  }

  badgeForm.onsubmit = async (e) => {
    e.preventDefault();
    const userId = document.getElementById("badgeUserId").value;
    const badgeId = badgeSelect.value;

    try {
      const res = await fetchWithAdminAuth(`https://bradspelsmeny-backend-production.up.railway.app/users/${userId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_id: badgeId })
      });

      if (res.ok) {
        alert("✅ Badge awarded!");
        badgeModal.style.display = "none";
      } else {
        const err = await res.json();
        alert("❌ Misslyckades: " + (err.error || "Något gick fel."));
      }
    } catch (err) {
      console.error("❌ Error awarding badge:", err);
      alert("Något gick fel när badge skulle tilldelas.");
    }
  };

  loadUsers();
});


  async function deleteUser(id) {
    if (!confirm("Är du säker på att du vill radera den här användaren?")) return;

    try {
      const res = await fetchWithAdminAuth(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        loadUsers();
      } else {
        const data = await res.json();
        if (confirm(`${data.error || "Kunde inte radera användaren."} Vill du arkivera istället?`)) {
          const archiveRes = await fetchWithAdminAuth(`${API_URL}/${id}`, {
            method: "DELETE"
          });
          if (archiveRes.ok) {
            alert("✅ Användare arkiverad.");
            loadUsers();
          } else {
            alert("❌ Misslyckades att arkivera användaren.");
          }
        }
      }
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      alert("❌ Misslyckades att ta bort användare.");
    }
  }

async function loadUsers() {
  try {
    const res = await fetchWithAdminAuth(API_URL);
    if (!res.ok) throw new Error("Failed to fetch");

    const users = await res.json();
    users.sort((a, b) => a.last_name.localeCompare(b.last_name));
    userList.innerHTML = "";

    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "user-card";

      const header = document.createElement("div");
      header.className = "user-header";

      const title = document.createElement("div");
      title.className = "user-title";
      title.textContent = `${user.first_name} ${user.last_name}`;

      const buttons = document.createElement("div");

      const editBtn = document.createElement("button");
      editBtn.className = "edit-button";
      editBtn.textContent = "✏️";
      editBtn.onclick = () => {
        userForm.reset();
        userForm.dataset.editingId = user.id;
        userForm.username.value = user.username || "";
        userForm.password.value = "";
        userForm.firstName.value = user.first_name;
        userForm.lastName.value = user.last_name;
        userForm.phone.value = user.phone;
        userForm.email.value = user.email || "";
        userForm.idNumber.value = user.id_number || "";
        userModal.style.display = "flex";
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-button";
      deleteBtn.textContent = "🗑️";
      deleteBtn.onclick = () => deleteUser(user.id);

      // 🎖️ Badge Button
      const badgeBtn = document.createElement("button");
      badgeBtn.className = "edit-button";
      badgeBtn.textContent = "🎖️";
      badgeBtn.onclick = () => openBadgeModal(user.id);

      buttons.appendChild(editBtn);
      buttons.appendChild(deleteBtn);
      buttons.appendChild(badgeBtn); // 👈 Inserted here

      header.appendChild(title);
      header.appendChild(buttons);
      card.appendChild(header);
      userList.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}


  loadUsers();
});

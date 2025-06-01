// user-db.js

const addUserButton = document.getElementById("addUserButton");
const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");
const userList = document.getElementById("userList");

addUserButton.onclick = () => {
  userForm.reset();
  userModal.style.display = "flex";
};

userModal.addEventListener("click", (e) => {
  if (e.target === userModal) userModal.style.display = "none";
});

userForm.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(userForm);

  const res = await fetch("https://bradspelsmeny-backend.onrender.com/users", {
    method: "POST",
    body: formData
  });

  if (res.ok) {
    loadUsers();
    userModal.style.display = "none";
  } else {
    alert("Något gick fel vid sparandet av användare.");
  }
};

async function loadUsers() {
  const res = await fetch("https://bradspelsmeny-backend.onrender.com/users");
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

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.textContent = "🗑️";

    // TODO: Wire up edit and delete functionality

    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);
    header.appendChild(title);
    header.appendChild(buttons);
    card.appendChild(header);
    userList.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadUsers);

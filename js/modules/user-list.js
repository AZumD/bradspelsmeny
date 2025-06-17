import { deleteUser, archiveUser } from './users.js';

export function initUserList(token, onEdit, onBadge) {
    const userList = document.getElementById("userList");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const searchBar = document.getElementById("searchBar");
    let allUsers = [];

    function showError(message) {
        const errorMessage = document.createElement("div");
        errorMessage.className = "error-message";
        errorMessage.textContent = message;
        userList.appendChild(errorMessage);
    }

    function hideError() {
        const errorMessage = userList.querySelector(".error-message");
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    async function handleDelete(id) {
        if (!confirm("Är du säker på att du vill radera den här användaren?")) return;

        try {
            await deleteUser(id, token);
            await displayUsers();
        } catch (err) {
            if (confirm(`${err.message || "Kunde inte radera användaren."} Vill du arkivera istället?`)) {
                try {
                    await archiveUser(id, token);
                    alert("✅ Användare arkiverad.");
                    await displayUsers();
                } catch (archiveErr) {
                    alert("❌ Misslyckades att arkivera användaren.");
                }
            }
        }
    }

    function createUserCard(user) {
        const card = document.createElement("div");
        card.className = "user-card";

        const header = document.createElement("div");
        header.className = "user-header";
        header.onclick = () => toggleUserContent(card);

        const title = document.createElement("div");
        title.className = "user-title";
        title.textContent = `${user.first_name} ${user.last_name}`;

        header.appendChild(title);
        card.appendChild(header);

        const content = document.createElement("div");
        content.className = "user-content";

        const details = document.createElement("div");
        details.className = "user-details";

        // Add user details
        const detailsList = [
            { label: "Telefon", value: user.phone },
            { label: "E-post", value: user.email || "Ej angiven" },
            { label: "Personnummer", value: user.id_number || "Ej angivet" },
            { label: "Användarnamn", value: user.username || "Ej angivet" }
        ];

        detailsList.forEach(({ label, value }) => {
            const detail = document.createElement("div");
            detail.className = "user-detail";
            detail.innerHTML = `<strong>${label}:</strong> ${value}`;
            details.appendChild(detail);
        });

        content.appendChild(details);

        const actions = document.createElement("div");
        actions.className = "user-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "edit-button";
        editBtn.textContent = "Redigera";
        editBtn.onclick = (e) => {
            e.stopPropagation();
            onEdit(user);
        };

        const badgeBtn = document.createElement("button");
        badgeBtn.className = "award-badge-button";
        badgeBtn.textContent = "Tilldela märke";
        badgeBtn.onclick = (e) => {
            e.stopPropagation();
            onBadge(user.id);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-button";
        deleteBtn.textContent = "Radera";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            handleDelete(user.id);
        };

        actions.appendChild(editBtn);
        actions.appendChild(badgeBtn);
        actions.appendChild(deleteBtn);
        content.appendChild(actions);

        card.appendChild(content);
        return card;
    }

    function toggleUserContent(card) {
        const content = card.querySelector(".user-content");
        const header = card.querySelector(".user-header");
        content.classList.toggle("expanded");
        header.classList.toggle("expanded");
    }

    function filterUsers(searchTerm) {
        const filteredUsers = allUsers.filter(user => {
            const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return fullName.includes(searchLower);
        });
        displayUsers(filteredUsers);
    }

    async function displayUsers(users) {
        if (loadingSpinner) loadingSpinner.style.display = "block";
        hideError();

        try {
            userList.innerHTML = "";
            users.forEach(user => {
                userList.appendChild(createUserCard(user));
            });
        } catch (err) {
            console.error("Failed to display users:", err);
            showError("Kunde inte ladda användare.");
        } finally {
            if (loadingSpinner) loadingSpinner.style.display = "none";
        }
    }

    // Initialize search functionality
    if (searchBar) {
        searchBar.addEventListener("input", (e) => {
            filterUsers(e.target.value);
        });
    }

    return {
        displayUsers: (users) => {
            allUsers = users;
            displayUsers(users);
        }
    };
} 
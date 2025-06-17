import { saveUser } from './users.js';

export function initUserForm(token, onSuccess) {
    const userModal = document.getElementById("userModal");
    const userForm = document.getElementById("userForm");
    const closeUserModal = document.getElementById("closeUserModal");

    // Initialize modal close functionality
    userModal.addEventListener("click", (e) => {
        if (e.target === userModal) userModal.style.display = "none";
    });

    if (closeUserModal) {
        closeUserModal.addEventListener("click", () => {
            userModal.style.display = "none";
        });
    }

    // Initialize form submission
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const editingId = userForm.dataset.editingId;
        const userData = {
            username: userForm.username.value,
            password: userForm.password.value,
            firstName: userForm.firstName.value,
            lastName: userForm.lastName.value,
            phone: userForm.phone.value,
            email: userForm.email.value,
            idNumber: userForm.idNumber.value
        };

        try {
            await saveUser(userData, token, editingId);
            userModal.style.display = "none";
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Failed to save user:", err);
            alert("Något gick fel vid sparandet av användare.");
        }
    });

    return {
        openModal: (user = null) => {
            userForm.reset();
            if (user) {
                userForm.dataset.editingId = user.id;
                userForm.username.value = user.username || "";
                userForm.password.value = "";
                userForm.firstName.value = user.first_name;
                userForm.lastName.value = user.last_name;
                userForm.phone.value = user.phone;
                userForm.email.value = user.email || "";
                userForm.idNumber.value = user.id_number || "";
            } else {
                userForm.dataset.editingId = "";
            }
            userModal.style.display = "flex";
        }
    };
} 
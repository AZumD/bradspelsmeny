import { initPixelNav, updateNotificationIcon } from '../js/shared/shared-ui.js';
import { fetchUsers } from '../js/modules/users.js';
import { initUserForm } from '../js/modules/user-form.js';
import { initUserList } from '../js/modules/user-list.js';
import { initBadgeForm } from '../js/modules/badge-form.js';
import { checkAuth } from '../js/modules/auth.js';

// Initialize the user database page
document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication first
    if (!await checkAuth()) return;

    // Initialize shared UI components
    initPixelNav();
    updateNotificationIcon();
    setInterval(updateNotificationIcon, 60000);

    // Get user token
    const token = localStorage.getItem("userToken");

    // Initialize user form
    const userForm = initUserForm(token, async () => {
        const users = await fetchUsers(token);
        userList.displayUsers(users);
    });

    // Initialize badge form
    const badgeForm = initBadgeForm(token);

    // Initialize user list
    const userList = initUserList(token, 
        (user) => userForm.openModal(user),
        (userId) => badgeForm.openModal(userId)
    );

    // Expose openModal function to global scope
    window.openModal = () => userForm.openModal();

    // Fetch and display users
    try {
        const users = await fetchUsers(token);
        userList.displayUsers(users);
    } catch (err) {
        console.error("Failed to load users:", err);
    }
}); 
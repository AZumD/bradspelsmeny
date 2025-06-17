import { initPixelNav, updateNotificationIcon, goTo } from '../js/shared/shared-ui.js';
import { fetchGames } from '../js/modules/games.js';
import { initGameForm } from '../js/modules/game-form.js';
import { initGameList } from '../js/modules/game-list.js';
import { checkAuth } from '../js/modules/auth.js';

// Initialize the edit games page
document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication first
    if (!await checkAuth()) return;

    // Initialize shared UI components
    initPixelNav();
    updateNotificationIcon();
    setInterval(updateNotificationIcon, 60000);

    // Initialize game form
    const gameForm = initGameForm();

    // Initialize game list
    const gameList = initGameList();

    // Initialize modal close functionality
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach((modal) => {
            if (e.target === modal && getComputedStyle(modal).display !== 'none') {
                modal.style.display = 'none';
            }
        });
    });

    // Initialize add game button
    const addGameButton = document.getElementById("addGameButton");
    if (addGameButton) {
        addGameButton.addEventListener("click", () => gameForm.openModal());
    }

    // Initialize modal close button
    const closeModalBtn = document.getElementById("closeModal");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            document.getElementById("gameModal").style.display = "none";
        });
    }

    // Fetch and display games
    try {
        if (loadingSpinner) loadingSpinner.style.display = "block";
        const token = localStorage.getItem('userToken');
        if (!token) throw new Error('No authentication token');
        const games = await fetchGames(token);
        renderGames(games);
    } catch (err) {
        if (gameList) {
            gameList.innerHTML = "<p style='color:red;'>Fel vid laddning av spel.</p>";
        }
        console.error(err);
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = "none";
    }
});

// Make functions available globally for onclick handlers
window.goTo = goTo;
window.logout = logout;


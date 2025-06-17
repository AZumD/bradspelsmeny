import { initPixelNav, updateNotificationIcon, goTo } from '/bradspelsmeny/js/shared/shared-ui.js';
import { fetchGames } from '/bradspelsmeny/js/modules/games.js';
import { initGameForm } from '/bradspelsmeny/js/modules/game-form.js';
import { renderCategories, renderIntro, renderGames } from '/bradspelsmeny/js/modules/game-list.js';
import { checkAuth } from '/bradspelsmeny/js/modules/auth.js';

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

    // Initialize game list components
    renderCategories();
    renderIntro();

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

    // Initialize search functionality
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const gameHeaders = document.querySelectorAll('.game-header');
            gameHeaders.forEach(header => {
                const title = header.querySelector('.game-title').textContent.toLowerCase();
                header.style.display = title.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    }

    // Fetch and display games
    try {
        const loadingSpinner = document.getElementById("loadingSpinner");
        if (loadingSpinner) loadingSpinner.style.display = "block";
        const token = localStorage.getItem('userToken');
        if (!token) throw new Error('No authentication token');
        await renderAdminGames();
    } catch (err) {
        const gameList = document.getElementById("gameList");
        if (gameList) {
            gameList.innerHTML = "<p style='color:red;'>Fel vid laddning av spel.</p>";
        }
        console.error(err);
    } finally {
        const loadingSpinner = document.getElementById("loadingSpinner");
        if (loadingSpinner) loadingSpinner.style.display = "none";
    }
});

async function renderAdminGames() {
    const gameList = document.getElementById("gameList");
    if (!gameList) return;

    const games = await fetchGames();
    gameList.innerHTML = games.map((game, index) => `
        <div class="game-item">
            <div class="game-header" onclick="toggleGameContent(${index})">
                <span class="game-title">${game.title_sv}</span>
            </div>
            <div class="game-content" id="game-content-${index}">
                <div class="game-details">
                    <div class="game-detail">
                        <strong>Beskrivning (SV):</strong>
                        <p>${game.description_sv}</p>
                    </div>
                    <div class="game-detail">
                        <strong>Beskrivning (EN):</strong>
                        <p>${game.description_en}</p>
                    </div>
                    <div class="game-detail">
                        <strong>Spelare:</strong>
                        <p>${game.min_players}-${game.max_players}</p>
                    </div>
                    <div class="game-detail">
                        <strong>Speltid:</strong>
                        <p>${game.play_time} min</p>
                    </div>
                    <div class="game-detail">
                        <strong>Ålder:</strong>
                        <p>${game.age}+</p>
                    </div>
                    <div class="game-detail">
                        <strong>Taggar:</strong>
                        <p>${game.tags ? game.tags.split(',').map(tag => tag.trim()).join(', ') : 'Inga taggar'}</p>
                    </div>
                </div>
                <div class="game-actions">
                    <button onclick="deleteGame(${game.id})" class="delete-button">Ta bort</button>
                </div>
                <form id="edit-form-${game.id}" class="edit-form" onsubmit="handleEditSubmit(event, ${game.id})">
                    <div class="form-group">
                        <label for="title_sv-${game.id}">Titel (SV):</label>
                        <input type="text" id="title_sv-${game.id}" name="title_sv" value="${game.title_sv}" required>
                    </div>
                    <div class="form-group">
                        <label for="title_en-${game.id}">Titel (EN):</label>
                        <input type="text" id="title_en-${game.id}" name="title_en" value="${game.title_en}" required>
                    </div>
                    <div class="form-group">
                        <label for="description_sv-${game.id}">Beskrivning (SV):</label>
                        <textarea id="description_sv-${game.id}" name="description_sv" required>${game.description_sv}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="description_en-${game.id}">Beskrivning (EN):</label>
                        <textarea id="description_en-${game.id}" name="description_en" required>${game.description_en}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="min_players-${game.id}">Min spelare:</label>
                        <input type="number" id="min_players-${game.id}" name="min_players" value="${game.min_players}" required>
                    </div>
                    <div class="form-group">
                        <label for="max_players-${game.id}">Max spelare:</label>
                        <input type="number" id="max_players-${game.id}" name="max_players" value="${game.max_players}" required>
                    </div>
                    <div class="form-group">
                        <label for="play_time-${game.id}">Speltid (min):</label>
                        <input type="number" id="play_time-${game.id}" name="play_time" value="${game.play_time}" required>
                    </div>
                    <div class="form-group">
                        <label for="age-${game.id}">Ålder:</label>
                        <input type="number" id="age-${game.id}" name="age" value="${game.age}" required>
                    </div>
                    <div class="form-group">
                        <label for="tags-${game.id}">Taggar (kommaseparerade):</label>
                        <input type="text" id="tags-${game.id}" name="tags" value="${game.tags || ''}">
                    </div>
                    <div class="form-group">
                        <label for="image_url-${game.id}">Bild URL:</label>
                        <input type="text" id="image_url-${game.id}" name="image_url" value="${game.image_url || ''}">
                    </div>
                    <button type="submit" class="save-button">Spara ändringar</button>
                </form>
            </div>
        </div>
    `).join('');
}

// Make functions available globally for onclick handlers
window.goTo = goTo;
window.toggleGameContent = (index) => {
    const content = document.getElementById(`game-content-${index}`);
    const header = content.previousElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
    header.classList.toggle('expanded');
};

window.handleEditSubmit = async (event, gameId) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const gameData = Object.fromEntries(formData.entries());
    
    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`/bradspelsmeny/api/games/${gameId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(gameData)
        });

        if (!response.ok) throw new Error('Failed to update game');
        
        window.location.reload();
    } catch (err) {
        console.error('Error updating game:', err);
        alert('Kunde inte uppdatera spelet. Försök igen.');
    }
};

window.deleteGame = async (gameId) => {
    if (!confirm('Är du säker på att du vill ta bort detta spel?')) return;
    
    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`/bradspelsmeny/api/games/${gameId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete game');
        
        window.location.reload();
    } catch (err) {
        console.error('Error deleting game:', err);
        alert('Kunde inte ta bort spelet. Försök igen.');
    }
};


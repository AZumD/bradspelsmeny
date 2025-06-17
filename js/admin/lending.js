import { initPixelNav, updateNotificationIcon } from '../js/shared/shared-ui.js';
import { fetchGames } from '../js/modules/games.js';
import { initLendForm } from '../js/modules/lend-form.js';
import { checkAuth } from '../js/modules/auth.js';
import { renderGameLists, returnGame, toggleSection } from '../js/modules/games.js';
import { initHistoryModal } from '../js/modules/history.js';
import { initImageModal } from '../js/modules/image-modal.js';

// Initialize the lending page
document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication first
    if (!await checkAuth()) return;

    // Initialize shared UI components
    initPixelNav();
    updateNotificationIcon();
    setInterval(updateNotificationIcon, 60000);

    // Initialize lend form
    const lendForm = initLendForm();

    // Initialize game list
    const gameList = document.getElementById('gameList');
    const loadingSpinner = document.getElementById('loadingSpinner');

    try {
        loadingSpinner.style.display = 'block';
        const games = await fetchGames();
        
        if (!games.length) {
            gameList.innerHTML = '<p class="no-games">No games available</p>';
            return;
        }

        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <img src="${game.image_url || game.img || '../img/placeholder.webp'}" alt="${game.name || game.title_en || 'Game'}">
                <h3>${game.name || game.title_en || 'Untitled Game'}</h3>
                <button class="lend-button" data-game-id="${game.id}">Lend Game</button>
            `;
            gameList.appendChild(card);
        });

        // Bind lend buttons
        document.querySelectorAll('.lend-button').forEach(button => {
            button.addEventListener('click', () => {
                const gameId = button.dataset.gameId;
                lendForm.openModal(gameId);
            });
        });
    } catch (err) {
        console.error('Failed to load games:', err);
        gameList.innerHTML = '<p class="error">Failed to load games</p>';
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const token = await checkAuth();
  if (!token) return;

  // Initialize UI components
  initPixelNav();
  updateNotificationIcon();
  setInterval(updateNotificationIcon, 60000);

  // Initialize modals
  const lendForm = initLendForm(token, () => fetchGames(token).then(() => renderGameLists('', availableContainer, lentOutContainer, token)));
  const historyModal = initHistoryModal(token);
  const imageModal = initImageModal();

  // Get DOM elements
  const searchInput = document.getElementById('searchInput');
  const availableContainer = document.getElementById('availableGames');
  const lentOutContainer = document.getElementById('lentOutGames');

  // Set up event listeners
  searchInput.addEventListener('input', () => renderGameLists(searchInput.value, availableContainer, lentOutContainer, token));

  // Handle collapsible sections
  document.querySelectorAll('.game-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.collapsible-section');
      if (section) {
        toggleSection(section);
      }
    });
  });

  // Handle game card actions
  document.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const gameId = button.dataset.gameId;
    const imageUrl = button.dataset.image;

    switch (action) {
      case 'lend':
        lendForm.openModal(gameId);
        break;
      case 'return':
        try {
          await returnGame(gameId, token);
          await fetchGames(token);
          renderGameLists(searchInput.value, availableContainer, lentOutContainer, token);
        } catch (err) {
          console.error('Error returning game:', err);
          alert('Failed to return game. Please try again.');
        }
        break;
      case 'image':
        imageModal.openModal(imageUrl);
        break;
      case 'history':
        historyModal.openModal(gameId);
        break;
    }
  });

  // Initialize sections
  document.getElementById('availableGames').style.display = 'flex';
  document.getElementById('lentOutGames').style.display = 'flex';
  document.querySelectorAll('.game-header .caret').forEach(c => c.textContent = '▲');

  // Load initial data
  try {
    await fetchGames(token);
    renderGameLists('', availableContainer, lentOutContainer, token);
  } catch (err) {
    console.error('Error initializing page:', err);
    alert('Failed to load games. Please refresh the page.');
  }
}); 
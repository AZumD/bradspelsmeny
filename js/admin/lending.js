import { initPixelNav, updateNotificationIcon } from '/bradspelsmeny/js/shared/shared-ui.js';
import { fetchGames } from '/bradspelsmeny/js/modules/games.js';
import { initLendForm } from '/bradspelsmeny/js/modules/lend-form.js';
import { checkAuth } from '/bradspelsmeny/js/modules/auth.js';
import { renderGameLists, returnGame, toggleSection } from '/bradspelsmeny/js/modules/games.js';
import { initHistoryModal } from '/bradspelsmeny/js/modules/history.js';
import { initImageModal } from '/bradspelsmeny/js/modules/image-modal.js';

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
  const lendForm = initLendForm(token, async () => {
    await fetchGames();
    renderGameLists(searchInput.value, availableContainer, lentOutContainer);
  });
  const historyModal = initHistoryModal(token);
  const imageModal = initImageModal();

  // Get DOM elements
  const searchInput = document.getElementById('searchInput');
  const availableContainer = document.getElementById('availableGames');
  const lentOutContainer = document.getElementById('lentOutGames');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Set up event listeners
  searchInput.addEventListener('input', () => renderGameLists(searchInput.value, availableContainer, lentOutContainer));

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
          await returnGame(gameId);
          renderGameLists(searchInput.value, availableContainer, lentOutContainer);
        } catch (err) {
          console.error('Error returning game:', err);
          alert('Kunde inte återlämna spelet. Försök igen.');
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
    loadingSpinner.style.display = 'block';
    await fetchGames();
    renderGameLists('', availableContainer, lentOutContainer);
  } catch (err) {
    console.error('Error initializing page:', err);
    alert('Kunde inte ladda spelen. Ladda om sidan.');
  } finally {
    loadingSpinner.style.display = 'none';
  }
}); 
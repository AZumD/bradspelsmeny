import { initPixelNav, updateNotificationIcon, goTo } from '/bradspelsmeny/js/shared/shared-ui.js';
import { fetchGames, updateGame, deleteGame } from '/bradspelsmeny/js/modules/games.js';
import { renderGameList } from '/bradspelsmeny/js/modules/game-list.js';
import { checkAuth } from '/bradspelsmeny/js/modules/auth.js';

document.addEventListener("DOMContentLoaded", async () => {
  if (!await checkAuth()) return;

  initPixelNav();
  updateNotificationIcon();
  setInterval(updateNotificationIcon, 60000);

  const searchBar = document.getElementById('searchBar');
  const gameListContainer = document.getElementById('gameList');
  const loadingSpinner = document.getElementById('loadingSpinner');

  let allGames = [];

  const refreshGames = async () => {
    loadingSpinner.style.display = 'block';
    try {
      allGames = await fetchGames();
      renderGameList(allGames, async (updatedGame) => {
        await updateGame(updatedGame.id, updatedGame);
        allGames = await fetchGames(); // re-fetch to ensure data is synced
        renderGameList(allGames, async (g) => await updateGame(g.id, g)); // recursive callback
      }, async (gameId) => {
        if (confirm("Är du säker på att du vill ta bort detta spel?")) {
          await deleteGame(gameId);
          allGames = await fetchGames();
          renderGameList(allGames, async (g) => await updateGame(g.id, g));
        }
      });
    } catch (err) {
      console.error("❌ Failed to fetch or render games:", err);
      gameListContainer.innerHTML = "<p style='color:red;'>Fel vid laddning av spel.</p>";
    } finally {
      loadingSpinner.style.display = 'none';
    }
  };

  // Search filter
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const gameItems = document.querySelectorAll('.game-item');
      gameItems.forEach(item => {
        const title = item.querySelector('.game-header')?.textContent?.toLowerCase() || '';
        item.style.display = title.includes(searchTerm) ? 'block' : 'none';
      });
    });
  }

  await refreshGames();
});

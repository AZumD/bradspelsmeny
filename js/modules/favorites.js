import { fetchWithAuth } from './api.js';
import { openGameModal } from './image-modal.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

export async function fetchFavoritesAndWishlist(userId) {
  await Promise.all([
    fetchFavorites(userId),
    fetchWishlist(userId)
  ]);
}

async function fetchFavorites(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/favorites`);
    if (!res.ok) throw new Error();
    const favorites = await res.json();
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (!favoritesGrid) return;

    favoritesGrid.innerHTML = '';
    if (favorites.length === 0) {
      favoritesGrid.innerHTML = '<div class="placeholder-box">No favorite games yet.</div>';
      return;
    }

    favorites.forEach(game => {
      const gameCard = createGameCard(game);
      favoritesGrid.appendChild(gameCard);
    });
  } catch (err) {
    console.error('Failed to fetch favorites:', err);
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (favoritesGrid) {
      favoritesGrid.innerHTML = '<div class="placeholder-box">Could not load favorites.</div>';
    }
  }
}

async function fetchWishlist(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/wishlist`);
    if (!res.ok) throw new Error();
    const wishlist = await res.json();
    const wishlistGrid = document.getElementById('wishlistGrid');
    if (!wishlistGrid) return;

    wishlistGrid.innerHTML = '';
    if (wishlist.length === 0) {
      wishlistGrid.innerHTML = '<div class="placeholder-box">No wishlist games yet.</div>';
      return;
    }

    wishlist.forEach(game => {
      const gameCard = createGameCard(game);
      wishlistGrid.appendChild(gameCard);
    });
  } catch (err) {
    console.error('Failed to fetch wishlist:', err);
    const wishlistGrid = document.getElementById('wishlistGrid');
    if (wishlistGrid) {
      wishlistGrid.innerHTML = '<div class="placeholder-box">Could not load wishlist.</div>';
    }
  }
}

function createGameCard(game, minimal = false) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:120px;margin:10px;';

  const img = document.createElement('img');
  img.className = 'game-thumbnail';
  img.src = game.thumbnail_url || `${FRONTEND_BASE}/img/game-placeholder.webp`;
  img.alt = game.title;
  img.onerror = () => { img.src = `${FRONTEND_BASE}/img/game-placeholder.webp`; };
  img.onclick = () => openGameModal('gameModal', game);

  const title = document.createElement('div');
  title.className = 'game-title';
  title.textContent = game.title;
  title.style.cssText = 'text-align:center;margin-top:5px;font-size:0.8rem;';

  card.appendChild(img);
  if (!minimal) card.appendChild(title);
  return card;
} 
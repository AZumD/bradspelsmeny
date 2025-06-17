import { fetchWithAuth } from './api.js';
import { openGameModal } from './image-modal.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

export function createGameCard(game, minimal = false) {
  const card = document.createElement('div');
  card.className = 'game-entry';
  const gameTitle = game.title_en || game.name || 'Untitled';
  const imageUrl = /^https?:/.test(game.img || game.thumbnail_url)
    ? game.img || game.thumbnail_url
    : `../${game.img || game.thumbnail_url || ''}`;
  if (minimal) {
    const img = document.createElement('img');
    img.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    img.alt = gameTitle;
    img.title = gameTitle;
    img.style.cssText = 'width:48px;height:48px;border-radius:8px;border:2px solid #c9a04e;object-fit:cover;margin:2px;cursor:pointer';
    img.onerror = () => { img.src = `${FRONTEND_BASE}/img/default-thumb.webp`; };
    card.appendChild(img);
  } else {
    card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px;margin-bottom:10px;background:#f9f6f2;border-radius:8px;cursor:pointer';
    const thumb = document.createElement('img');
    thumb.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    thumb.alt = gameTitle;
    thumb.style.cssText = 'width:60px;height:60px;border-radius:8px;border:2px solid #c9a04e;object-fit:cover;';
    thumb.onerror = () => { thumb.src = `${FRONTEND_BASE}/img/default-thumb.webp`; };
    const titleEl = document.createElement('div');
    titleEl.className = 'game-entry-title';
    titleEl.textContent = gameTitle;
    card.append(thumb, titleEl);
  }
  card.onclick = () => openGameModal(minimal ? 'favoriteGameModal' : 'wishlistGameModal', game);
  return card;
}

export async function fetchFavoritesAndWishlist(userId) {
  const favContainer = document.getElementById('favoritesList');
  const wishContainer = document.getElementById('wishlistList');
  if (!favContainer || !wishContainer) return;
  try {
    // Get user's favorites and wishlist
    const [favRes, wishRes] = await Promise.all([
      fetchWithAuth(`${API_BASE}/users/${userId}/favorites`).catch(() => null),
      fetchWithAuth(`${API_BASE}/users/${userId}/wishlist`).catch(() => null)
    ]);

    let favorites = [], wishlist = [];
    if (favRes && favRes.ok) {
      favorites = await favRes.json();
    } else {
      favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    }

    if (wishRes && wishRes.ok) {
      wishlist = await wishRes.json();
    } else {
      wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';
    }

    if (favorites.length) {
      favContainer.innerHTML = '';
      favorites.forEach(g => favContainer.appendChild(createGameCard(g, true)));
    } else if (favRes && favRes.ok) {
      favContainer.innerHTML = '<div class="placeholder-box">No favorites yet.</div>';
    }

    if (wishlist.length) {
      wishContainer.innerHTML = '';
      wishlist.forEach(g => wishContainer.appendChild(createGameCard(g)));
    } else if (wishRes && wishRes.ok) {
      wishContainer.innerHTML = '<div class="placeholder-box">No wishlist entries yet.</div>';
    }
  } catch (err) {
    console.error('Error fetching favorites and wishlist:', err);
    favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';
  }
} 
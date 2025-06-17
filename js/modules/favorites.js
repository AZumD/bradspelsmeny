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
  console.log('Fetching favorites and wishlist for user:', userId);
  
  const favContainer = document.getElementById('favoritesGrid');
  const wishContainer = document.getElementById('wishlistGrid');
  
  const containers = {
    favoritesList: !!favContainer,
    wishlistList: !!wishContainer
  };
  
  console.log('Containers found:', containers);
  
  if (!favContainer || !wishContainer) {
    console.error('Missing containers:', containers);
    return;
  }

  try {
    console.log('Fetching from endpoints:', {
      favorites: `${API_BASE}/users/${userId}/favorites`,
      wishlist: `${API_BASE}/users/${userId}/wishlist`
    });

    // Get user's favorites and wishlist
    const [favRes, wishRes] = await Promise.all([
      fetchWithAuth(`${API_BASE}/users/${userId}/favorites`).catch(err => {
        console.error('Error fetching favorites:', err);
        return null;
      }),
      fetchWithAuth(`${API_BASE}/users/${userId}/wishlist`).catch(err => {
        console.error('Error fetching wishlist:', err);
        return null;
      })
    ]);

    console.log('API responses:', {
      favorites: favRes?.status,
      wishlist: wishRes?.status
    });

    let favorites = [], wishlist = [];
    if (favRes && favRes.ok) {
      favorites = await favRes.json();
      console.log('Favorites data:', favorites);
    } else {
      console.error('Failed to load favorites:', favRes?.status);
      favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    }

    if (wishRes && wishRes.ok) {
      wishlist = await wishRes.json();
      console.log('Wishlist data:', wishlist);
    } else {
      console.error('Failed to load wishlist:', wishRes?.status);
      wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';
    }

    if (favorites.length) {
      console.log('Rendering favorites:', favorites.length);
      favContainer.innerHTML = '';
      favorites.forEach(g => favContainer.appendChild(createGameCard(g, true)));
    } else if (favRes && favRes.ok) {
      console.log('No favorites found');
      favContainer.innerHTML = '<div class="placeholder-box">No favorites yet.</div>';
    }

    if (wishlist.length) {
      console.log('Rendering wishlist:', wishlist.length);
      wishContainer.innerHTML = '';
      wishlist.forEach(g => wishContainer.appendChild(createGameCard(g)));
    } else if (wishRes && wishRes.ok) {
      console.log('No wishlist items found');
      wishContainer.innerHTML = '<div class="placeholder-box">No wishlist entries yet.</div>';
    }
  } catch (err) {
    console.error('Error in fetchFavoritesAndWishlist:', err);
    favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';
  }
} 
import { fetchWithAuth } from './api.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

export async function fetchBadges(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/badges`);
    if (!res.ok) throw new Error();
    const badges = await res.json();
    const badgesGrid = document.getElementById('badgesGrid');
    if (!badgesGrid) return;

    badgesGrid.innerHTML = '';
    if (badges.length === 0) {
      badgesGrid.innerHTML = '<div class="placeholder-box">No badges yet.</div>';
      return;
    }

    badges.forEach(badge => {
      const badgeElem = document.createElement('div');
      badgeElem.className = 'badge';
      badgeElem.title = badge.description;
      
      const img = document.createElement('img');
      img.src = badge.image_url || `${FRONTEND_BASE}/img/badge-placeholder.webp`;
      img.alt = badge.name;
      img.onerror = () => { img.src = `${FRONTEND_BASE}/img/badge-placeholder.webp`; };
      
      badgeElem.appendChild(img);
      badgeElem.onclick = () => openBadgeInfoModal(badge);
      badgesGrid.appendChild(badgeElem);
    });
  } catch (err) {
    console.error('Failed to fetch badges:', err);
    const badgesGrid = document.getElementById('badgesGrid');
    if (badgesGrid) {
      badgesGrid.innerHTML = '<div class="placeholder-box">Could not load badges.</div>';
    }
  }
}

export function openBadgeInfoModal(badge) {
  const modal = document.getElementById('badgeInfoModal');
  if (!modal) return;

  const titleElem = modal.querySelector('.modal-title');
  const descElem = modal.querySelector('.modal-description');
  const imgElem = modal.querySelector('.modal-image');

  if (titleElem) titleElem.textContent = badge.name;
  if (descElem) descElem.textContent = badge.description;
  if (imgElem) {
    imgElem.src = badge.image_url || `${FRONTEND_BASE}/img/badge-placeholder.webp`;
    imgElem.alt = badge.name;
  }

  modal.style.display = 'flex';
}

// Initialize badge-related event listeners
document.addEventListener('DOMContentLoaded', () => {
  const badgeInfoModal = document.getElementById('badgeInfoModal');
  if (badgeInfoModal) {
    const closeBtn = badgeInfoModal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => badgeInfoModal.style.display = 'none';
    }
  }
}); 
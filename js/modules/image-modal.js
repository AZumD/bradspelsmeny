import { API_ENDPOINTS } from './config.js';

export function initImageModal() {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  return {
    openModal: (imgUrl) => {
      modalImage.src = `${API_ENDPOINTS}${imgUrl}`;
      modal.style.display = 'block';
    }
  };
}

function closeModal() {
  document.getElementById('imageModal').style.display = 'none';
}

export function openGameModal(modalId, game) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const img = document.getElementById(`${modalId}Img`);
  const title = document.getElementById(`${modalId}Title`);
  const desc = document.getElementById(`${modalId}Description`);
  const details = document.getElementById(`${modalId}Details`);
  const disclaimer = document.getElementById(`${modalId}Disclaimer`);

  const gameTitle = game.title || game.title_en || game.title_sv || game.name || 'Untitled';
  let imageUrl = game.img || game.thumbnail_url || '/bradspelsmeny/img/default-thumb.webp';
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = `../${imageUrl}`;
  }

  if (img) {
    img.src = imageUrl;
    img.alt = gameTitle;
  }
  if (title) title.textContent = gameTitle;
  if (desc) desc.textContent = game.description || game.description_en || game.description_sv || game.desc || 'No description available.';

  // Playtime, player count
  const playtime = game.play_time ? `${game.play_time} min` : null;
  const players = game.min_players && game.max_players
    ? `Players: ${game.min_players}–${game.max_players}`
    : null;

  if (details) {
    details.textContent = [players, playtime].filter(Boolean).join(' · ');
  }

  // Trusted only disclaimer
  if (disclaimer) {
    disclaimer.textContent = game.trusted_only ? '⚠️ This game can only be borrowed by trusted members.' : '';
  }

  modal.style.display = 'flex';
} 
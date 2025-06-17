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

  const titleElem = modal.querySelector('.modal-title');
  const descElem = modal.querySelector('.modal-description');
  const imgElem = modal.querySelector('.modal-image');

  if (titleElem) titleElem.textContent = game.title || game.name || 'Untitled';
  if (descElem) descElem.textContent = game.description || 'No description available.';
  if (imgElem) {
    imgElem.src = game.thumbnail_url || game.img || '/bradspelsmeny/img/game-placeholder.webp';
    imgElem.alt = game.title || game.name || 'Game';
  }

  modal.style.display = 'flex';
} 
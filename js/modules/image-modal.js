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
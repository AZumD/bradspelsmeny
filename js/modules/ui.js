import { getTranslation } from './i18n.js';

export function showModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'block';

  const closeBtn = modal.querySelector('.close-button');
  closeBtn.onclick = () => {
    modal.remove();
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  };
}

export function showError(message) {
  showModal(getTranslation('error'), message);
}

export function showSuccess(message) {
  showModal(getTranslation('success'), message);
}

export function showLoading() {
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = `
    <div class="loading-spinner"></div>
    <p>${getTranslation('loading')}</p>
  `;
  document.body.appendChild(loading);
  return loading;
}

export function hideLoading(loading) {
  if (loading) {
    loading.remove();
  }
}

export function updateBadgeCount(count) {
  const badge = document.querySelector('.badge-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'block' : 'none';
  }
} 
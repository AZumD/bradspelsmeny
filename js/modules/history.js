import { API_ENDPOINTS } from './config.js';

export function initHistoryModal(token) {
  const modal = document.getElementById('historyModal');
  const historyList = document.getElementById('historyList');

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  return {
    openModal: async (gameId) => {
      try {
        const res = await fetch(`${API_ENDPOINTS}/history/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }

        const logs = await res.json();
        historyList.innerHTML = logs.map(log =>
          `<li><b>${log.action.toUpperCase()}</b> – ${log.first_name || 'Unknown'} ${log.last_name || ''} @ ${log.timestamp} <i>${log.note || ''}</i></li>`
        ).join('');

        modal.style.display = 'block';
      } catch (err) {
        console.error('Error opening history modal:', err);
        alert('Failed to load game history. Please try again.');
      }
    }
  };
}

function closeModal() {
  document.getElementById('historyModal').style.display = 'none';
} 
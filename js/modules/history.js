import { API_ENDPOINTS } from './config.js';

export function initHistoryModal(token) {
  const modal = document.getElementById('historyModal');
  const historyList = document.getElementById('historyList');

  if (!modal || !historyList) {
    console.error('Required modal elements not found');
    return {
      openModal: () => console.error('Modal not initialized')
    };
  }

  // Close modal when clicking outside or on close buttons
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Add event listeners for close buttons
  const closeButtons = modal.querySelectorAll('[data-action="close"]');
  closeButtons.forEach(button => {
    button.addEventListener('click', closeModal);
  });

  return {
    openModal: async (gameId) => {
      try {
        const res = await fetch(`${API_ENDPOINTS.GAMES}/${gameId}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }

        const logs = await res.json();
        if (!Array.isArray(logs)) {
          throw new Error('Invalid history data received');
        }

        historyList.innerHTML = logs.length > 0 
          ? logs.map(log => `
              <li>
                <b>${log.action.toUpperCase()}</b> – 
                ${log.first_name || 'Unknown'} ${log.last_name || ''} 
                @ ${new Date(log.timestamp).toLocaleString('sv-SE')} 
                <i>${log.note || ''}</i>
              </li>
            `).join('')
          : '<li>Ingen historik tillgänglig</li>';

        modal.style.display = 'block';
      } catch (err) {
        console.error('Error opening history modal:', err);
        historyList.innerHTML = '<li>Kunde inte ladda historiken. Försök igen.</li>';
        modal.style.display = 'block';
      }
    }
  };
}

function closeModal() {
  const modal = document.getElementById('historyModal');
  if (modal) {
    modal.style.display = 'none';
  }
} 
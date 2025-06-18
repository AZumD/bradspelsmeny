import { API_ENDPOINTS } from './config.js';

export function initLendForm(token, onLendSuccess) {
  const modal = document.getElementById('lendModal');
  const userSelect = document.getElementById('userSelect');
  const tableStep = document.getElementById('tableStep');
  const form = document.getElementById('lendForm');

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

  // Handle user selection
  userSelect.addEventListener('change', () => {
    tableStep.style.display = userSelect.value ? 'block' : 'none';
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gameId = document.getElementById('lendGameId').value;
    const userId = userSelect.value;
    const tableNumber = document.getElementById('tableNumber').value.trim();

    if (!userId || !tableNumber) {
      alert("Please select a user and enter a table number.");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.LEND(gameId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, note: `Table ${tableNumber}` })
      });

      if (!res.ok) {
        throw new Error('Failed to lend game');
      }

      closeModal();
      
      // Call the success callback
      if (onLendSuccess) {
        await onLendSuccess();
      }
      
      // Re-render the game lists
      const availableContainer = document.getElementById('availableGames');
      const lentOutContainer = document.getElementById('lentOutGames');
      if (availableContainer && lentOutContainer) {
        const { renderGameLists } = await import('./games.js');
        await renderGameLists('', availableContainer, lentOutContainer);
      }
    } catch (err) {
      console.error('Error lending game:', err);
      alert('Failed to lend game. Please try again.');
    }
  });

  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
      .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
      }
      .modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
      }
      .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
      }
      .modal-header h2 {
          margin: 0;
          color: #333;
      }
      .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
      }
      .close-button:hover {
          color: #333;
      }
      .form-group {
          margin-bottom: 15px;
      }
      .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #333;
      }
      .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
      }
      .submit-button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
      }
      .submit-button:hover {
          background-color: #45a049;
      }
  `;

  return {
    openModal: async (gameId) => {
      try {
        const res = await fetch(API_ENDPOINTS.USERS.BASE, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const users = await res.json();

        if (!Array.isArray(users)) {
          throw new Error('Failed to load users');
        }

        userSelect.innerHTML = '<option value="">-- Select User --</option>' +
          users.map(u => `<option value="${u.id}">${u.last_name}, ${u.first_name}, ${u.phone || 'No phone'}</option>`).join('');

        document.getElementById('lendGameId').value = gameId;
        document.getElementById('tableNumber').value = '';
        tableStep.style.display = 'none';
        modal.style.display = 'block';
      } catch (err) {
        console.error('Error opening lend modal:', err);
        alert('Failed to load users. Please try again.');
      }
    }
  };
}

function closeModal() {
  const modal = document.getElementById('lendModal');
  if (modal) {
    modal.style.display = 'none';
  }
} 
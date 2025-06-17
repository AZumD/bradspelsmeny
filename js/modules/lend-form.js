import { API_ENDPOINTS } from './config.js';

export function initLendForm(token, onLendSuccess) {
  const modal = document.getElementById('lendModal');
  const userSelect = document.getElementById('userSelect');
  const tableStep = document.getElementById('tableStep');
  const form = document.getElementById('lendForm');

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
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
      const res = await fetch(`${API_ENDPOINTS}/lend/${gameId}`, {
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
      onLendSuccess();
    } catch (err) {
      console.error('Error lending game:', err);
      alert('Failed to lend game. Please try again.');
    }
  });

  return {
    openModal: async (gameId) => {
      try {
        const res = await fetch(`${API_ENDPOINTS}/users`, {
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
  document.getElementById('lendModal').style.display = 'none';
} 
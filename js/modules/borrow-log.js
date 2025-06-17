import { fetchWithAuth } from './api.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

export async function fetchGameLog(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/borrow-log`);
    const tbody = document.querySelector('#borrowLogTable tbody');
    
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem; color:#999;">
          Game log is private or unavailable.
         </td></tr>`;
      return;
    }
    
    const logs = await res.json();

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem;">
          No game history yet.
         </td></tr>`;
      return;
    }

    const rowsHtml = logs.map(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      return `<tr>
                <td>${date}</td>
                <td>${log.game_title}</td>
              </tr>`;
    }).join('');

    tbody.innerHTML = rowsHtml;

  } catch (err) {
    console.error('Failed to fetch game log:', err);
    document.querySelector('#borrowLogTable tbody').innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem; color:red;">
        Failed to load game log.
      </td></tr>`;
  }
} 
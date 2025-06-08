const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app'; // Your backend URL
const token = localStorage.getItem('userToken');

if (!token) {
  alert('You must be logged in to view your profile.');
  window.location.href = '/login.html';
}

function getUserIdFromToken() {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

async function fetchProfile() {
  const userId = getUserIdFromToken();
  if (!userId) {
    alert('Invalid token, please log in again.');
    localStorage.removeItem('userToken');
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load profile');

    const data = await res.json();

    document.getElementById('fullName').textContent = `${data.first_name} ${data.last_name}`;
    document.getElementById('email').textContent = data.email || '';
    document.getElementById('bio').textContent = data.bio || '';
    document.getElementById('avatar').src = data.avatar_url ? `${API_BASE}${data.avatar_url}` : 'placeholder-avatar.png';
    document.getElementById('avatar').alt = `Avatar of ${data.first_name}`;

  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
}
async function fetchBorrowLog() {
  const userId = getUserIdFromToken();
  if (!userId) return;

  try {
    const res = await fetch(`${API_BASE}/users/${userId}/borrow-log`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load borrow log');

    const data = await res.json();
    const tbody = document.querySelector('#borrowLogTable tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem;">No borrow history found.</td></tr>';
      return;
    }

    for (const record of data) {
      const tr = document.createElement('tr');

      const tdDate = document.createElement('td');
      tdDate.textContent = new Date(record.timestamp).toLocaleString();
      tdDate.style.padding = '0.5rem';
      tdDate.style.borderBottom = '1px solid #eee';
      tr.appendChild(tdDate);

      const tdGame = document.createElement('td');
      tdGame.textContent = record.game_title;
      tdGame.style.padding = '0.5rem';
      tdGame.style.borderBottom = '1px solid #eee';
      tr.appendChild(tdGame);

      const tdAction = document.createElement('td');
      tdAction.textContent = record.action === 'lend' ? 'Lent Out' : 'Returned';
      tdAction.style.padding = '0.5rem';
      tdAction.style.borderBottom = '1px solid #eee';
      tdAction.style.color = record.action === 'lend' ? 'green' : '#555';
      tdAction.style.fontStyle = record.action === 'lend' ? 'normal' : 'italic';
      tr.appendChild(tdAction);

      const tdNote = document.createElement('td');
      tdNote.textContent = record.note || '';
      tdNote.style.padding = '0.5rem';
      tdNote.style.borderBottom = '1px solid #eee';
      tdNote.style.color = '#999';
      tr.appendChild(tdNote);

      tbody.appendChild(tr);
    }
  } catch (err) {
    const tbody = document.querySelector('#borrowLogTable tbody');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1rem; color:red;">Error loading borrow log: ${err.message}</td></tr>`;
  }
}

fetchProfile();

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const token = localStorage.getItem('userToken');

function getUserIdFromToken() {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('user');
}

async function fetchProfile() {
  if (!token) {
    alert('You must be logged in to view profiles.');
    window.location.href = '/login.html';
    return;
  }

  const urlUserId = getUserIdFromUrl();
  const userId = urlUserId || getUserIdFromToken();

  if (!userId) {
    alert('No user specified and you are not logged in.');
    window.location.href = '/login.html';
    return;
  }

  try {
    // Fetch profile data
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

    // Show/hide Edit Profile button
    const loggedInUserId = String(getUserIdFromToken());
    const editBtn = document.getElementById('editProfileBtn');
    if (String(userId) === loggedInUserId) {
      editBtn.style.display = 'block';
    } else {
      editBtn.style.display = 'none';
    }

    // Fetch borrow log if owner/admin or friend (backend enforced)
    fetchBorrowLog(userId);

  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
}

async function fetchBorrowLog(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/borrow-log`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      // Borrow log might be private, show message
      document.querySelector('#borrowLogTable tbody').innerHTML = 
        `<tr><td colspan="4" style="text-align:center; padding:1rem; color:#999;">
           Borrow log is private or unavailable.
         </td></tr>`;
      return;
    }
    const logs = await res.json();

    if (logs.length === 0) {
      document.querySelector('#borrowLogTable tbody').innerHTML = 
        `<tr><td colspan="4" style="text-align:center; padding:1rem;">No borrow history yet.</td></tr>`;
      return;
    }

    const rowsHtml = logs.map(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      const action = log.action.charAt(0).toUpperCase() + log.action.slice(1);
      const note = log.note || '';
      return `<tr>
                <td>${date}</td>
                <td>${log.game_title}</td>
                <td>${action}</td>
                <td>${note}</td>
              </tr>`;
    }).join('');

    document.querySelector('#borrowLogTable tbody').innerHTML = rowsHtml;

  } catch (err) {
    console.error('Failed to fetch borrow log:', err);
    document.querySelector('#borrowLogTable tbody').innerHTML = 
      `<tr><td colspan="4" style="text-align:center; padding:1rem; color:red;">
         Failed to load borrow log.
       </td></tr>`;
  }
}

// Initialize page
fetchProfile();


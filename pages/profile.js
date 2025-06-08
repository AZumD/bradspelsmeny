const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app'; 
const token = localStorage.getItem('userToken'); // ensure you use 'userToken'

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
  const urlUserId = getUserIdFromUrl();
  const userId = urlUserId || getUserIdFromToken();

  if (!userId) {
    alert('Invalid token or no user specified, please log in.');
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

    // Show/hide Edit Profile button
    const editBtn = document.getElementById('editProfileBtn');
    if (urlUserId && urlUserId !== getUserIdFromToken()) {
      editBtn.style.display = 'none';
    } else {
      editBtn.style.display = 'block';
    }
  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
}

// On page load
fetchProfile();
// Initialize page

fetchBorrowLog();

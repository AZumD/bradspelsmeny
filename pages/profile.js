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

fetchProfile();

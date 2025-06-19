const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app'; // Your backend URL

import { 
  getAccessToken, 
  getRefreshToken, 
  getUserIdFromToken,
  refreshToken,
  fetchWithAuth,
  clearTokens,
  logout
} from '../js/modules/auth.js';


const token = getAccessToken();
const form = document.getElementById('profileForm');
const messageDiv = document.getElementById('message');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');

if (!token) {
  alert('You must be logged in to view your profile.');
  window.location.href = '/login.html'; // Redirect to login if no token
}

let currentAvatarUrl = null;

async function fetchProfile() {
  const userId = getUserIdFromToken();
  if (!userId) {
    alert('Invalid token, please log in again.');
    clearTokens();
    window.location.href = '/login.html'; // Use absolute path here too
    return;
  }

  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}`);
    if (!res.ok) throw new Error('Failed to load profile');

    const data = await res.json();
    form.first_name.value = data.first_name || '';
    form.last_name.value = data.last_name || '';
    form.email.value = data.email || '';
    form.bio.value = data.bio || '';

    if (data.avatar_url) {
      currentAvatarUrl = `${API_BASE}${data.avatar_url}`;
      avatarPreview.src = currentAvatarUrl;
    } else {
      avatarPreview.src = '';
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

function showMessage(msg, isError = false) {
  messageDiv.textContent = msg;
  messageDiv.style.color = isError ? 'red' : 'green';
}

avatarInput.addEventListener('change', () => {
  const file = avatarInput.files[0];
  if (file) {
    avatarPreview.src = URL.createObjectURL(file);
  } else {
    avatarPreview.src = currentAvatarUrl || '';
  }
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  showMessage('');

  const userId = getUserIdFromToken();
  if (!userId) return;

  try {
    // Upload avatar if changed
    if (avatarInput.files.length > 0) {
      const formData = new FormData();
      formData.append('avatar', avatarInput.files[0]);
      const res = await fetchWithAuth(`${API_BASE}/users/${userId}/avatar`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload avatar');
      await res.json();
    }

    // Update profile info
    const payload = {
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      email: form.email.value.trim(),
      bio: form.bio.value.trim()
    };

    const res = await fetchWithAuth(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }

    showMessage('Profile updated successfully!');
  } catch (err) {
    showMessage(err.message, true);
  }
});

// Initialize page
fetchProfile();

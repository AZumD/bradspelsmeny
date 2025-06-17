import { fetchWithAuth } from './api.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

export async function loadFriends(viewUserId = null) {
  const targetUserId = viewUserId || getUserIdFromToken();
  const isOwn = String(targetUserId) === String(getUserIdFromToken());
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${targetUserId}/friends`);
    if (!res.ok) throw new Error();
    const friends = await res.json();
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';
    if (!friends.length && !isOwn) {
      friendsList.innerHTML = '<div class="placeholder-box">No friends to display… yet.</div>';
      return;
    }
    friends.forEach(f => {
      const img = document.createElement('img');
      img.className = 'friend-avatar';
      img.src = f.avatar_url && f.avatar_url.startsWith('http')
        ? f.avatar_url
        : API_BASE + f.avatar_url;
      img.onerror = () => { img.src = `${FRONTEND_BASE}/img/avatar-placeholder.webp`; };
      img.title = `${f.first_name} ${f.last_name}`;
      img.onclick = () => window.location.href = `profile.html?id=${f.id}`;
      friendsList.appendChild(img);
    });
    if (isOwn) {
      const plusBtn = document.createElement('div');
      plusBtn.className = 'add-friend-circle';
      plusBtn.textContent = '+';
      plusBtn.title = 'Add Friend';
      plusBtn.onclick = () => { document.getElementById('addFriendModal').style.display = 'flex'; };
      friendsList.appendChild(plusBtn);
    }
  } catch {
    document.getElementById('friendsList').innerHTML = '<div class="placeholder-box">Could not load friends.</div>';
  }
}

export async function maybeShowAddFriendButton(currentUserId, profileId) {
  if (!currentUserId || !profileId || String(currentUserId) === String(profileId)) return;
  
  try {
    const status = await checkFriendStatus(profileId);
    const addFriendBtn = document.getElementById('addFriendBtn');
    if (!addFriendBtn) return;
    
    if (status === 'none') {
      addFriendBtn.style.display = 'block';
      addFriendBtn.onclick = () => sendFriendRequest(profileId);
    } else if (status === 'pending') {
      addFriendBtn.style.display = 'block';
      addFriendBtn.textContent = 'Request Sent';
      addFriendBtn.disabled = true;
    } else {
      addFriendBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('Failed to check friend status:', err);
  }
}

async function checkFriendStatus(viewedUserId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/friends/status/${viewedUserId}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.status;
  } catch {
    return 'none';
  }
}

async function sendFriendRequest(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/friends/request/${userId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error();
    const addFriendBtn = document.getElementById('addFriendBtn');
    if (addFriendBtn) {
      addFriendBtn.textContent = 'Request Sent';
      addFriendBtn.disabled = true;
    }
  } catch (err) {
    alert('Failed to send friend request: ' + err.message);
  }
}

// Initialize friend-related event listeners
document.addEventListener('DOMContentLoaded', () => {
  const addFriendModal = document.getElementById('addFriendModal');
  if (addFriendModal) {
    const closeBtn = addFriendModal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => addFriendModal.style.display = 'none';
    }
  }
}); 
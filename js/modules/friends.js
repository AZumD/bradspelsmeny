import { fetchWithAuth, getUserIdFromToken } from './api.js';

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
  if (!currentUserId || !profileId || currentUserId === profileId) return;
  const addFriendBtn = document.getElementById('addFriendBtn');
  if (!addFriendBtn) return;
  try {
    const res = await fetchWithAuth(`${API_BASE}/friends`);
    if (!res.ok) return;
    const friends = await res.json();
    if (!friends.some(f => f.id === parseInt(profileId))) {
      addFriendBtn.style.display = 'inline-block';
      addFriendBtn.addEventListener('click', async () => {
        try {
          const r = await fetchWithAuth(`${API_BASE}/friends/${profileId}`, { method: 'POST' });
          if (r.ok) { addFriendBtn.disabled = true; addFriendBtn.textContent = '✅ Friend Added'; }
          else { const err = await r.json(); alert('Failed to add friend: ' + err.error); }
        } catch {}
      });
    }
  } catch {}
}

export async function checkFriendStatus(viewedUserId) {
  const myId = getUserIdFromToken();
  if (!viewedUserId || !myId || viewedUserId === myId) return;
  try {
    const res = await fetchWithAuth(`${API_BASE}/friends`);
    if (!res.ok) return;
    const friends = await res.json();
    if (friends.some(f => f.id === parseInt(viewedUserId, 10))) {
      const removeFriendBtn = document.getElementById('removeFriendBtn');
      if (removeFriendBtn) {
        removeFriendBtn.style.display = 'block';
      }
    }
  } catch (err) {
    console.error('❌ Error in checkFriendStatus:', err);
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
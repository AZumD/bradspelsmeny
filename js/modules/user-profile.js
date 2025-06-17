import { getUserIdFromToken, fetchWithAuth } from './api.js';
import { loadFriends, maybeShowAddFriendButton } from './friends.js';
import { fetchGameLog } from './borrow-log.js';
import { fetchFavoritesAndWishlist } from './favorites.js';
import { fetchBadges } from './badges.js';
import { fetchUserParties } from './parties.js';
import { openGameModal } from './image-modal.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderPartyList(parties) {
  const partyList = document.getElementById('partyList');
  if (!partyList) return;

  if (parties.length) {
    partyList.innerHTML = '';
    parties.forEach(party => {
      const partyEl = document.createElement('div');
      partyEl.className = 'party-avatar';
      partyEl.style.cursor = 'pointer';
      partyEl.onclick = () => window.location.href = `/bradspelsmeny/pages/party.html?id=${party.id}`;
      
      const img = document.createElement('img');
      img.src = party.avatar || `${FRONTEND_BASE}/img/avatar-party-placeholder.webp`;
      img.alt = party.name;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      
      partyEl.appendChild(img);
      partyList.appendChild(partyEl);
    });
  } else {
    partyList.innerHTML = '<div class="placeholder-box">No parties yet.</div>';
  }

  // Only show create button on own profile
  const createBtn = document.getElementById('createPartyBtn');
  if (createBtn) {
    const myId = getUserIdFromToken();
    const viewedId = getUserIdFromUrl() || myId;
    createBtn.style.display = String(myId) === String(viewedId) ? 'block' : 'none';
  }
}

async function fetchPartiesForProfile(userId) {
  const res = await fetchWithAuth(`${API_BASE}/users/${userId}/parties`);
  if (!res.ok) throw new Error('Failed to fetch parties');
  return await res.json();
}

export async function fetchProfile() {
  const token = localStorage.getItem('userToken');
  if (!token) {
    alert('You must be logged in to view profiles.');
    window.location.href = '/login.html';
    return;
  }
  const urlUserId = getUserIdFromUrl();
  const loggedInUserId = getUserIdFromToken();
  const userIdToFetch = urlUserId && urlUserId !== String(loggedInUserId)
    ? urlUserId
    : loggedInUserId;
  if (!userIdToFetch) {
    alert('No user specified and you are not logged in.');
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userIdToFetch}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    document.getElementById('username').textContent = data.username || 'Unknown user';
    document.getElementById('bio').textContent = data.bio || '';
    let avatarUrl = data.avatar_url || `${FRONTEND_BASE}/img/avatar-placeholder.webp`;
    if (avatarUrl && !avatarUrl.startsWith('http')) avatarUrl = API_BASE + avatarUrl;
    const avatarElem = document.getElementById('avatar');
    avatarElem.src = avatarUrl;
    avatarElem.alt = `Avatar of ${data.username}`;

    const editBtn = document.getElementById('editProfileBtn');
    if (String(userIdToFetch) === String(loggedInUserId)) {
      editBtn.style.display = 'block';
      loadFriends();
    } else {
      editBtn.style.display = 'none';
      loadFriends(userIdToFetch);
      maybeShowAddFriendButton(loggedInUserId, userIdToFetch);
    }

    fetchGameLog(userIdToFetch);
    fetchFavoritesAndWishlist(userIdToFetch);
    fetchBadges(userIdToFetch);
    fetchUserParties(userIdToFetch);

    await fetchPartiesForProfile(userIdToFetch).then(renderPartyList);
  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', fetchProfile); 
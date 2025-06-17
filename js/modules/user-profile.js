import { getUserIdFromToken, fetchWithAuth } from './api.js';
import { loadFriends, maybeShowAddFriendButton } from './friends.js';
import { fetchGameLog } from './borrow-log.js';
import { fetchFavoritesAndWishlist } from './favorites.js';
import { fetchBadges } from './badges.js';
import { fetchUserParties } from './parties.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

function getUserIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
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
  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', fetchProfile); 
import { getUserIdFromToken, fetchWithAuth } from '../js/modules/api.js';
import { fetchProfile } from '../js/modules/user-profile.js';
import { loadFriends, maybeShowAddFriendButton, checkFriendStatus } from '../js/modules/friends.js';
import { fetchGameLog } from '../js/modules/borrow-log.js';
import { fetchFavoritesAndWishlist, createGameCard, } from '../js/modules/favorites.js';
import { fetchBadges } from '../js/modules/badges.js';
import { fetchUserParties, openCreatePartyModal, closeCreatePartyModal, submitCreateParty } from '../js/modules/parties.js';
import { initPixelNav, updateNotificationIcon, initNotificationModal } from '../js/shared/shared-ui.js';
import { getUserRole } from '../js/modules/auth.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

// ------------ AUTH & TOKENS ------------

const isAdmin = getUserRole() === 'admin';

function getUserIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

// ------------ INITIAL LOAD ------------

document.addEventListener('DOMContentLoaded', async () => {
  initPixelNav(); // 🧩 From shared-ui.js
  initNotificationModal();
  updateNotificationIcon(); // 🔔 Just update icon on load
  setInterval(updateNotificationIcon, 60000); // 🔁 Refresh every minute

  try {
    await fetchProfile(); // Page-specific
  } catch (err) {
    console.error('❌ Error during initial load:', err);
  }

  const myId = getUserIdFromToken();
  const viewedId = getUserIdFromUrl() || myId;
  const profileUserId = viewedId;

  // Badge popup close
  document.getElementById('closeBadgePopup')?.addEventListener('click', () => {
    document.getElementById('badgePopup').style.display = 'none';
  });

  // Badge info close
  document.getElementById('closeBadgeInfoBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('badgeInfoModal');
    if (modal) modal.style.display = 'none';
  });

  // Friend status
  checkFriendStatus(profileUserId);

  // Remove friend
  const removeBtn = document.getElementById('removeFriendBtn');
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to remove this friend?')) return;
      try {
        const res = await fetchWithAuth(`${API_BASE}/friends/remove/${profileUserId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          alert('Friend removed');
          location.reload();
        } else {
          const err = await res.json();
          alert('Failed: ' + err.error);
        }
      } catch (err) {
        console.error('❌ Error removing friend:', err);
        alert('Something went wrong.');
      }
    });
  }

  // Manual friend request (for own profile)
  if (String(myId) === String(profileUserId)) {
    const modal = document.getElementById('addFriendModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const submitBtn = document.getElementById('submitFriendRequest');

    closeBtn?.addEventListener('click', () => modal.style.display = 'none');

    submitBtn?.addEventListener('click', async () => {
      const input = document.getElementById('manualFriendId');
      const friendId = input.value.trim();
      if (!friendId || isNaN(friendId) || friendId === String(myId)) {
        alert('Please enter a valid user ID.');
        return;
      }
      try {
        const res = await fetchWithAuth(`${API_BASE}/friends/${friendId}`, { method: 'POST' });
        if (res.ok) {
          alert('✅ Friend added!');
          modal.style.display = 'none';
          input.value = '';
          loadFriends();
        } else {
          const err = await res.json();
          alert('❌ Failed: ' + err.error);
        }
      } catch (err) {
        console.error('❌ Failed to send manual friend request:', err);
        alert('Something went wrong.');
      }
    });
  }

  // Close modals on background click
  window.addEventListener('click', (e) => {
    document.querySelectorAll('.modal').forEach((modal) => {
      if (e.target === modal && getComputedStyle(modal).display !== 'none') {
        modal.style.display = 'none';
      }
    });
  });

  // Party modal controls
  document.getElementById('createPartyBtn')?.addEventListener('click', openCreatePartyModal);
  document.getElementById('closeCreatePartyModal')?.addEventListener('click', closeCreatePartyModal);
  document.getElementById('submitCreatePartyBtn')?.addEventListener('click', submitCreateParty);
});

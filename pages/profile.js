const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

// ------------ AUTH & TOKENS ------------

function getUserRole() {
  const token = localStorage.getItem('userToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}
const isAdmin = getUserRole() === 'admin';

function getAccessToken() {
  return localStorage.getItem('userToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function setAccessToken(token) {
  localStorage.setItem('userToken', token);
}

function clearTokens() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('refreshToken');
}

async function fetchWithAuth(url, options = {}) {
  let accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) {
    throw new Error('User not authenticated');
  }

  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`
  };

  let response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    const refreshResponse = await fetch(`${API_BASE}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!refreshResponse.ok) {
      clearTokens();
      window.location.href = `${FRONTEND_BASE}/pages/login.html`;
      throw new Error('Session expired. Please log in again.');
    }
    const data = await refreshResponse.json();
    const newToken = data.token || data.accessToken;
    setAccessToken(newToken);
    options.headers.Authorization = `Bearer ${newToken}`;
    response = await fetch(url, options);
  }
  return response;
}

function getUserIdFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

// ------------ GAMELOG ------------


async function fetchGameLog(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/borrow-log`);
    const tbody = document.querySelector('#borrowLogTable tbody');
    
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem; color:#999;">
          Game log is private or unavailable.
         </td></tr>`;
      return;
    }
    
    const logs = await res.json();

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem;">
          No game history yet.
         </td></tr>`;
      return;
    }

    const rowsHtml = logs.map(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      return `<tr>
                <td>${date}</td>
                <td>${log.game_title}</td>
              </tr>`;
    }).join('');

    tbody.innerHTML = rowsHtml;

  } catch (err) {
    console.error('Failed to fetch game log:', err);
    document.querySelector('#borrowLogTable tbody').innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem; color:red;">
        Failed to load game log.
      </td></tr>`;
  }
}


// ------------ NOTIFICATIONS ------------

async function fetchNotifications() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const notifications = await res.json();
    const list = document.getElementById('notificationList');
    list.innerHTML = '';

    const hasUnread = notifications.some(n => !n.read);
    const icon = document.getElementById('notificationIcon');
    if (icon) {
      icon.src = hasUnread
        ? `${FRONTEND_BASE}/img/icons/icon-notif-on.webp`
        : `${FRONTEND_BASE}/img/icons/icon-notif-off.webp`;
    }

    if (notifications.length === 0) {
      list.innerHTML = '<div class="placeholder-box">No notifications yet.</div>';
      return;
    }

    notifications.forEach(n => {
      const div = document.createElement('div');
      div.className = `notification-item ${n.read ? '' : 'unread'}`;
      div.innerHTML = formatNotificationText(n);
      const time = new Date(n.created_at).toLocaleString();

      if (n.type === 'friend_request') {
        const btnWrapper = document.createElement('div');
        btnWrapper.style.marginTop = '0.5rem';

        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Accept';
        acceptBtn.className = 'btn-accept';
        acceptBtn.onclick = async e => {
          e.stopPropagation();
          const requestId = n.data?.request_id;
          if (!requestId) {
            alert('Missing request ID. Cannot accept this request.');
            return;
          }
          try {
            const res = await fetchWithAuth(
              `${API_BASE}/friend-requests/${requestId}/accept`,
              { method: 'POST' }
            );
            if (res.ok) {
              div.innerHTML = `✅ Friend request accepted<br><small>${new Date().toLocaleString()}</small>`;
              if (icon) icon.src = `${FRONTEND_BASE}/img/icons/icon-notif-off.webp`;
            } else {
              let errorMsg = 'Failed to accept friend request';
              try {
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                  const err = await res.json();
                  errorMsg += ': ' + (err.error || JSON.stringify(err));
                } else {
                  errorMsg += ': ' + await res.text();
                }
              } catch {}
              alert(errorMsg);
            }
          } catch (err) {
            console.error('❌ Accept failed:', err);
            alert('Error accepting request.');
          }
        };

        const declineBtn = document.createElement('button');
        declineBtn.textContent = 'Decline';
        declineBtn.className = 'btn-decline';
        declineBtn.onclick = async e => {
          e.stopPropagation();
          try {
            const res = await fetchWithAuth(
              `${API_BASE}/friend-requests/${n.id}/decline`,
              { method: 'POST' }
            );
            if (res.ok) {
              div.innerHTML = `❌ Friend request declined<br><small>${new Date().toLocaleString()}</small>`;
            } else {
              const err = await res.json();
              alert(`Failed: ${err.error}`);
            }
          } catch (err) {
            console.error('❌ Decline failed:', err);
            alert('Error declining request.');
          }
        };

        btnWrapper.append(acceptBtn, declineBtn);
        div.appendChild(btnWrapper);
      }

      div.onclick = async () => {
        if (!n.read) {
          await fetchWithAuth(`${API_BASE}/notifications/${n.id}/read`, { method: 'POST' });
          div.classList.remove('unread');
          const unreadLeft = document.querySelectorAll('.notification-item.unread');
          if (unreadLeft.length === 0 && icon) {
            icon.src = `${FRONTEND_BASE}/img/icons/icon-notif-off.webp`;
          }
          if (n.type === 'badge_awarded' && n.data?.name && n.data.icon_url) {
            showBadgePopup(n.data.name, n.data.icon_url, time);
          }
        }
        if (n.type === 'friend_accept' && n.data?.receiver_id) {
          window.location.href = `profile.html?id=${n.data.receiver_id}`;
        }
      };

      list.appendChild(div);
    });
  } catch (err) {
    console.error('❌ Failed to fetch notifications:', err);
    document.getElementById('notificationList').innerHTML =
      '<div class="placeholder-box">Could not load notifications.</div>';
  }
}

function formatNotificationText(n) {
  switch (n.type) {
    case 'friend_request':
      return `👤 <strong>${n.sender_name || 'Someone'}</strong> sent you a friend request.`;
    case 'friend_accept':
      return `✅ <strong>${n.sender_name || 'Someone'}</strong> accepted your friend request.`;
    case 'badge_awarded':
      return `🏅 You earned a new badge: <strong>${n.data?.name || 'Unnamed Badge'}</strong>`;
    default:
      return `<strong>New notification:</strong> ${n.message || 'Something happened.'}`;
  }
}

function showBadgePopup(name, iconUrl, time) {
  document.getElementById('badgePopupImage').src = iconUrl;
  document.getElementById('badgePopupImage').alt = name;
  document.getElementById('badgePopupName').textContent = name;
  document.getElementById('badgePopupTime').textContent = time;
  const popup = document.getElementById('badgePopup');
  popup.style.display = 'flex';
  setTimeout(() => { popup.style.display = 'none'; }, 6000);
}

async function updateNotificationIcon() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error();
    const notifications = await res.json();
    const icon = document.getElementById('notificationIcon');
    if (icon) {
      icon.src = notifications.some(n => !n.read)
        ? `${FRONTEND_BASE}/img/icons/icon-notif-on.webp`
        : `${FRONTEND_BASE}/img/icons/icon-notif-off.webp`;
    }
  } catch (err) {
    console.error('❌ Failed to update notification icon:', err);
  }
}

// ------------ PARTIES & PROFILE ------------

async function fetchUserParties(viewedUserId = null) {
  const loggedInUserId = getUserIdFromToken();
  const isOwnProfile = !viewedUserId || String(viewedUserId) === String(loggedInUserId);
  const endpoint = isOwnProfile
    ? `${API_BASE}/my-parties`
    : `${API_BASE}/users/${viewedUserId}/parties`;

  const partyList = document.getElementById('partyList');
  if (!partyList) return;

  try {
    const res = await fetchWithAuth(endpoint);
    if (!res.ok) throw new Error();
    const parties = await res.json();
    partyList.innerHTML = '';
    if (parties.length === 0) {
      partyList.innerHTML = '<div class="placeholder-box">No parties yet.</div>';
      return;
    }
    parties.forEach(party => {
      const card = document.createElement('div');
      card.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:60px';
      const img = document.createElement('img');
      img.className = 'party-avatar';
      img.src = party.avatar && party.avatar.startsWith('http')
        ? party.avatar
        : `${party.avatar ? API_BASE + party.avatar : FRONTEND_BASE + '/img/avatar-party-placeholder.webp'}`;
      img.onerror = () => { img.src = `${FRONTEND_BASE}/img/avatar-party-placeholder.webp`; };
      img.alt = `${party.emoji || ''} ${party.name}`;
      img.title = img.alt;
      img.onclick = () => window.location.href = `party.html?id=${party.id}`;
      card.appendChild(img);
      partyList.appendChild(card);
    });
  } catch {
    partyList.innerHTML = '';
  }
}

function getUserIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

async function fetchProfile() {
  const token = getAccessToken();
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

async function loadFriends(viewUserId = null) {
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

async function fetchFavoritesAndWishlist(userId) {
  const favContainer = document.getElementById('favoritesList');
  const wishContainer = document.getElementById('wishlistList');
  if (!favContainer || !wishContainer) return;
  try {
    const [favRes, wishRes] = await Promise.all([
      fetchWithAuth(`${API_BASE}/users/${userId}/favorites`).catch(() => null),
      fetchWithAuth(`${API_BASE}/users/${userId}/wishlist`).catch(() => null)
    ]);
    let favorites = [], wishlist = [];
    if (favRes && favRes.ok) favorites = await favRes.json(); else favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    if (wishRes && wishRes.ok) wishlist = await wishRes.json(); else wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';

    if (favorites.length) {
      favContainer.innerHTML = '';
      favorites.forEach(g => favContainer.appendChild(createGameCard(g, true)));
    } else if (favRes && favRes.ok) favContainer.innerHTML = '<div class="placeholder-box">No favorites yet.</div>';

    if (wishlist.length) {
      wishContainer.innerHTML = '';
      wishlist.forEach(g => wishContainer.appendChild(createGameCard(g)));
    } else if (wishRes && wishRes.ok) wishContainer.innerHTML = '<div class="placeholder-box">No wishlist entries yet.</div>';
  } catch {
    favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';
  }
}

function openGameModal(modalId, game) {
  const img = document.getElementById(`${modalId}Img`);
  const title = document.getElementById(`${modalId}Title`);
  const desc = document.getElementById(`${modalId}Description`);
  const gameTitle = game.title_en || game.name || 'Untitled';
  let imageUrl = game.img || game.thumbnail_url || '';
  if (imageUrl && !/^https?:/.test(imageUrl)) imageUrl = `../${imageUrl}`;
  img.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
  img.alt = gameTitle;
  title.textContent = gameTitle;
  desc.textContent = game.description_en || 'No description available.';
  document.getElementById(modalId).style.display = 'flex';
}

function closeGameModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function createGameCard(game, minimal = false) {
  const card = document.createElement('div');
  card.className = 'game-entry';
  const gameTitle = game.title_en || game.name || 'Untitled';
  const imageUrl = /^https?:/.test(game.img || game.thumbnail_url)
    ? game.img || game.thumbnail_url
    : `../${game.img || game.thumbnail_url || ''}`;
  if (minimal) {
    const img = document.createElement('img');
    img.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    img.alt = gameTitle;
    img.title = gameTitle;
    img.style.cssText = 'width:48px;height:48px;border-radius:8px;border:2px solid #c9a04e;object-fit:cover;margin:2px;cursor:pointer';
    img.onerror = () => { img.src = `${FRONTEND_BASE}/img/default-thumb.webp`; };
    card.appendChild(img);
  } else {
    card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px;margin-bottom:10px;background:#f9f6f2;border-radius:8px;cursor:pointer';
    const thumb = document.createElement('img');
    thumb.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    thumb.alt = gameTitle;
    thumb.style.cssText = 'width:60px;height:60px;border-radius:8px;border:2px solid #c9a04e;object-fit:cover;';
    thumb.onerror = () => { thumb.src = `${FRONTEND_BASE}/img/default-thumb.webp`; };
    const titleEl = document.createElement('div');
    titleEl.className = 'game-entry-title';
    titleEl.textContent = gameTitle;
    card.append(thumb, titleEl);
  }
  card.onclick = () => openGameModal(minimal ? 'favoriteGameModal' : 'wishlistGameModal', game);
  return card;
}

async function fetchBadges(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/badges`);
    if (!res.ok) throw new Error();
    const badges = await res.json();
    const container = document.getElementById('badgesList');
    if (badges.length === 0) {
      container.innerHTML = '<div class="placeholder-box">No badges earned yet.</div>';
      return;
    }
    container.innerHTML = '';
    badges.forEach(badge => {
      const img = document.createElement('img');
      img.src = badge.icon_url;
      img.alt = badge.name;
      img.title = `${badge.name} – ${badge.description}`;
      img.style.cssText = 'width:48px;height:48px;border-radius:8px;border:2px solid #c9a04e;object-fit:cover;background:#fff;cursor:pointer';
      img.onclick = () => openBadgeInfoModal(badge);
      container.appendChild(img);
    });
  } catch {
    document.getElementById('badgesList').innerHTML = '<div class="placeholder-box">Failed to load badges.</div>';
  }
}

function openBadgeInfoModal(badge) {
  document.getElementById('badgeIcon').src = badge.icon_url;
  document.getElementById('badgeName').textContent = badge.name;
  document.getElementById('badgeDescription').textContent = badge.description;
  document.getElementById('badgeInfoModal').style.display = 'flex';
}

async function maybeShowAddFriendButton(currentUserId, profileId) {
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


async function checkFriendStatus(viewedUserId) {
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

// ------------ PARTY CREATION MODALS & HANDLERS ------------

function openCreatePartyModal() {
  const modal = document.getElementById('createPartyModal');
  if (modal) modal.style.display = 'flex';
}

function closeCreatePartyModal() {
  const modal = document.getElementById('createPartyModal');
  if (modal) modal.style.display = 'none';
}

async function submitCreateParty() {
  const nameInput = document.getElementById('partyNameInput');
  const emojiInput = document.getElementById('partyEmojiInput');
  const name = nameInput?.value.trim();
  const emoji = emojiInput?.value.trim() || '🎲';
  if (!name) {
    alert('Please enter a party name.');
    return;
  }
  try {
    const res = await fetchWithAuth(`${API_BASE}/party`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji })
    });
    if (!res.ok) {
      const err = await res.json();
      alert(`Failed to create party: ${err.error || res.statusText}`);
      return;
    }
    const data = await res.json();
    alert(`Party created! Invite code: ${data.inviteCode}`);
    closeCreatePartyModal();
    fetchUserParties(getUserIdFromToken());
  } catch (err) {
    console.error('Error creating party:', err);
    alert('Error creating party. See console for details.');
  }
}


// ------------ INITIAL LOAD ------------

document.addEventListener('DOMContentLoaded', async () => {
  initPixelNav(); // 🧩 From shared-ui.js
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

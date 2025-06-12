const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

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

  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${accessToken}`;

  let response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    const refreshResponse = await fetch(`${API_BASE}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      clearTokens();
      window.location.href = '/login.html';
      throw new Error('Session expired. Please log in again.');
    }

    const data = await refreshResponse.json();
    const newAccessToken = data.token || data.accessToken;
    setAccessToken(newAccessToken);

    options.headers['Authorization'] = `Bearer ${newAccessToken}`;
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


async function fetchNotifications() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');

    const notifications = await res.json();
    const list = document.getElementById('notificationList');
    list.innerHTML = '';

    if (!notifications.length) {
      list.innerHTML = '<div class="placeholder-box">No notifications yet.</div>';
      return;
    }

    for (const n of notifications) {
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
        acceptBtn.onclick = async (e) => {
          e.stopPropagation();
          const requestId = n.data?.request_id;
          if (!requestId) {
            alert("Missing request ID. Cannot accept this request.");
            return;
          }
          try {
            const res = await fetchWithAuth(`${API_BASE}/friend-requests/${requestId}/accept`, {
              method: 'POST',
            });
            if (res.ok) {
              div.innerHTML = `✅ Friend request accepted<br><small>${new Date().toLocaleString()}</small>`;
            } else {
              let errorMsg = 'Failed to accept friend request';
              try {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  const err = await res.json();
                  errorMsg += ': ' + (err.error || JSON.stringify(err));
                } else {
                  const text = await res.text();
                  errorMsg += ': ' + text;
                }
              } catch (parseErr) {
                console.error('Failed to parse error response:', parseErr);
              }
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
        declineBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const res = await fetchWithAuth(`${API_BASE}/friend-requests/${n.id}/decline`, {
              method: 'POST',
            });
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

        btnWrapper.appendChild(acceptBtn);
        btnWrapper.appendChild(declineBtn);
        div.appendChild(btnWrapper);
      }

      div.onclick = async () => {
        if (!n.read) {
          await fetchWithAuth(`${API_BASE}/notifications/${n.id}/read`, { method: 'POST' });
          div.classList.remove('unread');

          if (n.type === 'badge_awarded' && n.data?.name && n.data?.icon_url) {
            showBadgePopup(n.data.name, n.data.icon_url, time);
          }
        }

        if (n.type === 'friend_accept' && n.data.receiver_id) {
          window.location.href = `profile.html?id=${n.data.receiver_id}`;
        }
      };

      list.appendChild(div);
    }

    if (notifications.some(n => !n.read)) {
      const icon = document.getElementById("notificationIcon");
      if (icon && !document.getElementById("notificationDot")) {
        const dot = document.createElement("span");
        dot.id = "notificationDot";
        icon.appendChild(dot);
      }
    }
  } catch (err) {
    console.error('❌ Failed to fetch notifications:', err);
    document.getElementById('notificationList').innerHTML =
      `<div class="placeholder-box">Could not load notifications.</div>`;
  }
}
function formatNotificationText(n) {
  const time = new Date(n.created_at).toLocaleString();

  switch (n.type) {
    case 'friend_request':
      return `👤 Friend request from user ID ${n.data.sender_id} <br><small>${time}</small>`;

    case 'friend_accept':
      return `
        ✅ <strong>${n.data.username}</strong> accepted your friend request!<br>
        <img src="${n.data.avatar_url ? (n.data.avatar_url.startsWith('http') ? n.data.avatar_url : API_BASE + n.data.avatar_url) : FRONTEND_BASE + '/img/avatar-placeholder.webp'}"
             alt="${n.data.username}" 
             style="width:32px;height:32px;border-radius:50%;margin-top:4px;">
        <br><small>${time}</small>
      `;

    case 'badge_awarded':
      return `
        🏅 You earned a new badge!<br>
        <strong>${n.data.name}</strong><br>
        <img src="${n.data.icon_url}" alt="${n.data.name}" style="width:48px;height:48px;border-radius:8px;border:2px solid #c9a04e;margin-top:4px;"><br>
        <small>${time}</small>
      `;

    default:
      return `${n.type} <br><small>${time}</small>`;
  }
}

function showBadgePopup(name, iconUrl, time) {
  document.getElementById('badgePopupImage').src = iconUrl;
  document.getElementById('badgePopupImage').alt = name;
  document.getElementById('badgePopupName').textContent = name;
  document.getElementById('badgePopupTime').textContent = time;

  const popup = document.getElementById('badgePopup');
  popup.style.display = 'flex';

  // Optional: auto-close after 6 seconds
  setTimeout(() => {
    popup.style.display = 'none';
  }, 6000);
}



function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
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
    if (!res.ok) throw new Error('Failed to load profile');

    const data = await res.json();

    document.getElementById('username').textContent = data.username || 'Unknown user';

    const emailElem = document.getElementById('email');
    if (emailElem) emailElem.style.display = 'none';

    document.getElementById('bio').textContent = data.bio || '';

    let avatarUrl = data.avatar_url || `${FRONTEND_BASE}/img/avatar-placeholder.webp`;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = API_BASE + avatarUrl;
    }

    const avatarElem = document.getElementById('avatar');
    avatarElem.src = avatarUrl;
    avatarElem.alt = `Avatar of ${data.username || 'user'}`;

    const editBtn = document.getElementById('editProfileBtn');
    if (String(userIdToFetch) === String(loggedInUserId)) {
      editBtn.style.display = 'block';
      loadFriends(); // own profile → load your own friends
    } else {
      editBtn.style.display = 'none';
      loadFriends(userIdToFetch); // not your own → load target user's friends
      maybeShowAddFriendButton(loggedInUserId, userIdToFetch);
    }

        fetchGameLog(userIdToFetch);
        fetchFavoritesAndWishlist(userIdToFetch); // 👈 ADD THIS
        fetchBadges(userIdToFetch);



  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
}


async function loadFriends(viewUserId = null) {
  const targetUserId = viewUserId || getUserIdFromToken();
  const isOwnProfile = String(targetUserId) === String(getUserIdFromToken());
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${targetUserId}/friends`);
    const friends = await res.json();
    const friendsList = document.getElementById("friendsList");
    friendsList.innerHTML = "";
    
    if (!friends.length && !isOwnProfile) {
      friendsList.innerHTML = '<div class="placeholder-box">No friends to display… yet.</div>';
      return;
    }
    
    for (const friend of friends) {
      const img = document.createElement("img");
      img.className = "friend-avatar"; // 👈 Added the CSS class for proper styling
      img.src = friend.avatar_url
        ? (friend.avatar_url.startsWith('http') ? friend.avatar_url : API_BASE + friend.avatar_url)
        : `${FRONTEND_BASE}/img/avatar-placeholder.webp`;
      img.title = `${friend.first_name} ${friend.last_name}`;
      img.onclick = () => window.location.href = `profile.html?id=${friend.id}`;
      
      friendsList.appendChild(img);
    }
    
    // 👇 Add the "+" button if you're viewing your own profile
    if (isOwnProfile) {
      const plusBtn = document.createElement("div");
      plusBtn.className = "add-friend-circle";
      plusBtn.innerHTML = "+";
      plusBtn.title = "Add Friend";
      plusBtn.onclick = () => {
        document.getElementById("addFriendModal").style.display = "flex";
      };
      friendsList.appendChild(plusBtn);
    }
  } catch (err) {
    console.error("❌ Failed to load friends:", err);
    document.getElementById("friendsList").innerHTML = '<div class="placeholder-box">Could not load friends.</div>';
  }
}


// Call this in fetchProfile() after loading basic user data:
// fetchFavoritesAndWishlist(userIdToFetch);

async function fetchFavoritesAndWishlist(userId) {
  console.log('🔍 fetchFavoritesAndWishlist called with userId:', userId);
  
  try {
    // Check if containers exist
    const favContainer = document.getElementById('favoritesList');
    const wishContainer = document.getElementById('wishlistList');
    
    if (!favContainer || !wishContainer) {
      console.error('❌ Container elements not found:', {
        favContainer: !!favContainer,
        wishContainer: !!wishContainer
      });
      return;
    }

    console.log('📡 Making API requests...');
    
    // Make the API calls with better error handling
    const [favoritesRes, wishlistRes] = await Promise.all([
      fetchWithAuth(`${API_BASE}/users/${userId}/favorites`).catch(err => {
        console.error('❌ Favorites request failed:', err);
        return null;
      }),
      fetchWithAuth(`${API_BASE}/users/${userId}/wishlist`).catch(err => {
        console.error('❌ Wishlist request failed:', err);
        return null;
      })
    ]);

    console.log('📡 API responses:', {
      favoritesRes: favoritesRes?.status,
      wishlistRes: wishlistRes?.status
    });

    // Handle favorites
    let favorites = [];
    if (favoritesRes && favoritesRes.ok) {
      try {
        favorites = await favoritesRes.json();
        console.log('✅ Favorites loaded:', favorites);
      } catch (err) {
        console.error('❌ Failed to parse favorites JSON:', err);
        favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites (JSON error).</div>';
      }
    } else if (favoritesRes) {
      console.error('❌ Favorites request failed with status:', favoritesRes.status);
      // Try to get error message
      try {
        const errorText = await favoritesRes.text();
        console.error('Error response:', errorText);
      } catch (e) {
        console.error('Could not read error response');
      }
      favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    } else {
      favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites (network error).</div>';
    }

    // Handle wishlist
    let wishlist = [];
    if (wishlistRes && wishlistRes.ok) {
      try {
        wishlist = await wishlistRes.json();
        console.log('✅ Wishlist loaded:', wishlist);
      } catch (err) {
        console.error('❌ Failed to parse wishlist JSON:', err);
        wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist (JSON error).</div>';
      }
    } else if (wishlistRes) {
      console.error('❌ Wishlist request failed with status:', wishlistRes.status);
      // Try to get error message
      try {
        const errorText = await wishlistRes.text();
        console.error('Error response:', errorText);
      } catch (e) {
        console.error('Could not read error response');
      }
      wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';
    } else {
      wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist (network error).</div>';
    }

    // Update UI with successful data
    if (favorites.length > 0 || wishlist.length > 0) {
      // Clear containers before adding content
      if (favorites.length > 0) {
        favContainer.innerHTML = '';
        favorites.forEach(game => {
          console.log('🎮 Adding favorite game:', game.title);
          favContainer.appendChild(createGameCard(game, true));
        });
      } else if (favoritesRes && favoritesRes.ok) {
  const isOwnProfile = String(userId) === String(getUserIdFromToken());
  favContainer.innerHTML = isOwnProfile
    ? '<div class="placeholder-box">No favorites yet.</div>'
    : '';
}


      if (wishlist.length > 0) {
        wishContainer.innerHTML = '';
        wishlist.forEach(game => {
          console.log('🎮 Adding wishlist game:', game.title);
          wishContainer.appendChild(createGameCard(game));
        });
      } else if (wishlistRes && wishlistRes.ok) {
  const isOwnProfile = String(userId) === String(getUserIdFromToken());
  wishContainer.innerHTML = isOwnProfile
    ? '<div class="placeholder-box">No wishlist entries yet.</div>'
    : '';
}

    }

  } catch (err) {
    console.error('❌ Failed to fetch favorites/wishlist:', err);
    const favContainer = document.getElementById('favoritesList');
    const wishContainer = document.getElementById('wishlistList');
    
    if (favContainer) {
      favContainer.innerHTML = '<div class="placeholder-box">Failed to load favorites.</div>';
    }
    if (wishContainer) {
      wishContainer.innerHTML = '<div class="placeholder-box">Failed to load wishlist.</div>';
    }
  }
}

function openGameModal(modalId, game) {
  const img = document.getElementById(`${modalId}Img`);
  const title = document.getElementById(`${modalId}Title`);
  const desc = document.getElementById(`${modalId}Description`);

  img.src = game.img || game.thumbnail_url || `${FRONTEND_BASE}/img/default-thumb.webp`;
  img.alt = game.title || 'Untitled';
  title.textContent = game.title || 'Untitled';
  desc.textContent = game.description || 'No description available.';

  document.getElementById(modalId).style.display = 'flex';
}

function closeGameModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function createGameCard(game, minimal = false) {
  const card = document.createElement('div');
  card.className = 'game-entry';

  const gameTitle =
    game.title ||
    game.title_en ||
    game.title_sv ||
    game.name ||
    'Untitled';

  const imageUrl = game.img || game.thumbnail_url || `${FRONTEND_BASE}/img/default-thumb.webp`;

  if (minimal) {
    card.style.all = 'unset';
    card.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = gameTitle;
    img.title = gameTitle;
    img.onerror = () => {
      img.src = `${FRONTEND_BASE}/img/default-thumb.webp`;
    };

    img.style.width = '48px';
    img.style.height = '48px';
    img.style.borderRadius = '8px';
    img.style.border = '2px solid #c9a04e';
    img.style.objectFit = 'cover';
    img.style.margin = '2px';

    card.appendChild(img);
    card.onclick = () => openGameModal('favoriteGameModal', game);
  } else {
    card.style.border = 'none';
    card.style.borderRadius = '8px';
    card.style.padding = '10px';
    card.style.marginBottom = '10px';
    card.style.backgroundColor = '#f9f6f2';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.cursor = 'pointer';

    const thumb = document.createElement('img');
    thumb.src = imageUrl;
    thumb.alt = gameTitle;
    thumb.onerror = () => {
      thumb.src = `${FRONTEND_BASE}/img/default-thumb.webp`;
    };
    thumb.style.width = '60px';
    thumb.style.height = '60px';
    thumb.style.borderRadius = '8px';
    thumb.style.border = '2px solid #c9a04e';
    thumb.style.objectFit = 'cover';

    const title = document.createElement('div');
    title.className = 'game-entry-title';
    title.textContent = gameTitle;

    card.appendChild(thumb);
    card.appendChild(title);
    card.onclick = () => openGameModal('wishlistGameModal', game);
  }

  return card;
}


// Also add some debugging to createGameCard function
function createGameCard(game, minimal = false) {
  const card = document.createElement('div');
  card.className = 'game-entry';

  const gameTitle =
    game.title ||
    game.title_en ||
    game.title_sv ||
    game.name ||
    'Untitled';

  if (minimal) {
    // Minimal version for favorites grid
    card.style.all = 'unset';
    card.style.cursor = 'pointer';

    const img = document.createElement('img');
    let imageUrl = game.img || game.thumbnail_url;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = `../${imageUrl}`;
    }

    img.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    img.alt = gameTitle;
    img.title = gameTitle; // tooltip on hover
    img.onerror = () => {
      img.src = `${FRONTEND_BASE}/img/default-thumb.webp`;
    };

    img.style.width = '48px';
    img.style.height = '48px';
    img.style.borderRadius = '8px';
    img.style.border = '2px solid #c9a04e';
    img.style.objectFit = 'cover';
    img.style.margin = '2px';

    card.appendChild(img);
  } else {
    // Full version for wishlist
    card.style.border = 'none';
    card.style.borderRadius = '8px';
    card.style.padding = '10px';
    card.style.marginBottom = '10px';
    card.style.backgroundColor = '#f9f6f2';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.cursor = 'pointer';

    let imageUrl = game.img || game.thumbnail_url;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = `../${imageUrl}`;
    }

    const thumb = document.createElement('img');
    thumb.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    thumb.alt = gameTitle;
    thumb.onerror = () => {
      thumb.src = `${FRONTEND_BASE}/img/default-thumb.webp`;
    };
    thumb.style.width = '60px';
    thumb.style.height = '60px';
    thumb.style.borderRadius = '8px';
    thumb.style.border = '2px solid #c9a04e';
    thumb.style.objectFit = 'cover';

    const title = document.createElement('div');
    title.className = 'game-entry-title';
    title.textContent = gameTitle;

    card.appendChild(thumb);
    card.appendChild(title);
  }

  card.onclick = () => {
    window.location.href = `game.html?id=${game.id}`;
  };

  return card;
}


async function fetchBadges(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/badges`);
    const badges = await res.json();
    const container = document.getElementById('badgesList');

    if (!badges.length) {
      container.innerHTML = '<div class="placeholder-box">No badges earned yet.</div>';
      return;
    }

    container.innerHTML = '';
    badges.forEach(badge => {
      const img = document.createElement('img');
      img.src = badge.icon_url;
      img.alt = badge.name;
      img.title = `${badge.name} – ${badge.description}`;
      img.style.width = '48px';
      img.style.height = '48px';
      img.style.borderRadius = '8px';
      img.style.border = '2px solid #c9a04e';
      img.style.objectFit = 'cover';
      img.style.background = '#fff';
      img.style.cursor = 'pointer';

      img.onclick = () => openBadgeInfoModal(badge);
      container.appendChild(img);
    });
  } catch (err) {
    console.error('❌ Failed to fetch badges:', err);
    const container = document.getElementById('badgesList');
    container.innerHTML = '<div class="placeholder-box">Failed to load badges.</div>';
  }
}

function openBadgeInfoModal(badge) {
  document.getElementById("badgeIcon").src = badge.icon_url;
  document.getElementById("badgeName").textContent = badge.name;
  document.getElementById("badgeDescription").textContent = badge.description;
  document.getElementById("badgeInfoModal").style.display = "flex";
}

async function maybeShowAddFriendButton(currentUserId, profileId) {
  if (!currentUserId || !profileId || currentUserId === profileId) return;

  const addFriendBtn = document.getElementById("addFriendBtn");
  if (!addFriendBtn) return;

  try {
    const res = await fetchWithAuth(`${API_BASE}/friends`);
    const friends = await res.json();

    const alreadyFriend = friends.some(f => f.id == profileId);
    if (!alreadyFriend) {
      addFriendBtn.style.display = "inline-block";
      addFriendBtn.addEventListener("click", async () => {
        try {
          const res = await fetchWithAuth(`${API_BASE}/friends/${profileId}`, {
            method: 'POST'
          });

          if (res.ok) {
            addFriendBtn.disabled = true;
            addFriendBtn.textContent = "✅ Friend Added";
          } else {
            const err = await res.json();
            alert("Failed to add friend: " + err.error);
          }
        } catch (err) {
          console.error('❌ Friend add failed:', err);
        }
      });
    }
  } catch (err) {
    console.error('❌ Error checking friends:', err);
  }
}

async function checkFriendStatus(viewedUserId) {
  const myId = getUserIdFromToken();
  if (!viewedUserId || !myId || viewedUserId === myId) return;

  try {
    const res = await fetchWithAuth(`${API_BASE}/friends`);
    if (!res.ok) return;

    const friends = await res.json();
    const isFriend = friends.some(f => f.id === parseInt(viewedUserId));

    if (isFriend) {
      document.getElementById('removeFriendBtn').style.display = 'block';
    }
  } catch (err) {
    console.error('❌ Error in checkFriendStatus:', err);
  }
}

async function fetchGameLog(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/borrow-log`);
    if (!res.ok) {
      document.querySelector('#borrowLogTable tbody').innerHTML =
        `<tr><td colspan="2" style="text-align:center; padding:1rem; color:#999;">
          Game log is private or unavailable.
         </td></tr>`;
      return;
    }
    const logs = await res.json();

    if (logs.length === 0) {
      document.querySelector('#borrowLogTable tbody').innerHTML =
        `<tr><td colspan="2" style="text-align:center; padding:1rem;">No game history yet.</td></tr>`;
      return;
    }

    const rowsHtml = logs.map(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      return `<tr>
                <td>${date}</td>
                <td>${log.game_title}</td>
              </tr>`;
    }).join('');

    document.querySelector('#borrowLogTable tbody').innerHTML = rowsHtml;

  } catch (err) {
    console.error('Failed to fetch game log:', err);
    document.querySelector('#borrowLogTable tbody').innerHTML =
      `<tr><td colspan="2" style="text-align:center; padding:1rem; color:red;">
         Failed to load game log.
       </td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchProfile();

  const myId = getUserIdFromToken();
  const viewedId = getUserIdFromUrl() || myId;
  const profileUserId = viewedId;

  const closeBadgePopupBtn = document.getElementById("closeBadgePopup");
  if (closeBadgePopupBtn) {
    closeBadgePopupBtn.onclick = () => {
      document.getElementById("badgePopup").style.display = "none";
    };
  }

  const badgeCloseBtn = document.getElementById("closeBadgeInfoBtn");
  if (badgeCloseBtn) {
    badgeCloseBtn.onclick = () => {
      const modal = document.getElementById("badgeInfoModal");
      if (modal) modal.style.display = "none";
    };
  }

  checkFriendStatus(profileUserId);

  const removeBtn = document.getElementById('removeFriendBtn');
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to remove this friend?');
      if (!confirmed) return;

      try {
        const res = await fetchWithAuth(`${API_BASE}/friends/remove/${profileUserId}`, {
          method: 'DELETE'
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

  if (String(myId) === String(profileUserId)) {
    const modal = document.getElementById("addFriendModal");
    const closeBtn = document.getElementById("closeModalBtn");
    const submitBtn = document.getElementById("submitFriendRequest");

    closeBtn.onclick = () => modal.style.display = "none";

    window.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };

    submitBtn.onclick = async () => {
      const input = document.getElementById("manualFriendId");
      const friendId = input.value.trim();

      if (!friendId || isNaN(friendId) || friendId === String(myId)) {
        alert("Please enter a valid user ID.");
        return;
      }

      try {
        const res = await fetchWithAuth(`${API_BASE}/friends/${friendId}`, { method: 'POST' });

        if (res.ok) {
          alert("✅ Friend added!");
          modal.style.display = "none";
          input.value = "";
          loadFriends();
        } else {
          const err = await res.json();
          alert("❌ Failed: " + err.error);
        }
      } catch (err) {
        console.error('❌ Failed to send manual friend request:', err);
        alert("Something went wrong.");
      }
    };
  }

  const notifBtn = document.getElementById("notificationIcon");
  const notifModal = document.getElementById("notificationModal");
  const closeNotifBtn = document.getElementById("closeNotificationBtn");

  if (notifBtn && notifModal && closeNotifBtn) {
    notifBtn.onclick = () => {
      notifModal.style.display = 'flex';
      fetchNotifications();
    };

    closeNotifBtn.onclick = () => notifModal.style.display = 'none';

    window.onclick = (e) => {
      if (e.target === notifModal) notifModal.style.display = 'none';
    };
  }
});



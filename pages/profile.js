const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

//CHECKADMIN=======================================================================

function getUserRole() {
  const token = localStorage.getItem("userToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

const isAdmin = getUserRole() === "admin";

//TOKENHANDLING====================================================================

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
      window.location.href = '/pages/login.html';
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

//PIXELNAV=========================================================================

function goTo(path) {
  const base = window.location.origin + (window.location.hostname === 'localhost' ? '' : '/bradspelsmeny');
  window.location.href = base + path;
}

function logout() {
  clearTokens();
  window.location.href = '/bradspelsmeny/pages/login.html';
}
const adminToggle = document.getElementById("adminMenuToggle");
  const adminDropdown = document.getElementById("adminMenuDropdown");
  const logoutIcon = document.getElementById("logoutIcon");

  if (isAdmin) {
    adminToggle.style.display = "inline-block";
    logoutIcon.style.display = "none";

    adminToggle.addEventListener("click", () => {
      adminDropdown.style.display = adminDropdown.style.display === "none" ? "block" : "none";
    });

    // Optional: close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!adminToggle.contains(e.target) && !adminDropdown.contains(e.target)) {
        adminDropdown.style.display = "none";
      }
    });
  }

//NOTIFICATIONS====================================================================

async function fetchNotifications() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');

    const notifications = await res.json();
    const list = document.getElementById('notificationList');
    list.innerHTML = '';

    const hasUnread = notifications.some(n => !n.read);

    // Swap bell icon
    const icon = document.getElementById("notificationIcon");
    if (icon) {
      icon.src = hasUnread
        ? "img/icons/icon-notif-on.webp"
        : "img/icons/icon-notif-off.webp";
    }

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
              icon.src = "img/icons/icon-notif-off.webp"; // Optimistically reset icon
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

          // Update icon again just in case all are now read
          const updatedNotifications = list.querySelectorAll('.notification-item.unread');
          if (updatedNotifications.length === 0) {
            icon.src = "img/icons/icon-notif-off.webp";
          }

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

  } catch (err) {
    console.error('❌ Failed to fetch notifications:', err);
    document.getElementById('notificationList').innerHTML =
      `<div class="placeholder-box">Could not load notifications.</div>`;
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

  setTimeout(() => {
    popup.style.display = 'none';
  }, 6000);
}

//PARTIES==========================================================================

async function fetchUserParties(viewedUserId = null) {
  const loggedInUserId = getUserIdFromToken();
  const isOwnProfile = !viewedUserId || String(viewedUserId) === String(loggedInUserId);
  const endpoint = isOwnProfile ? `${API_BASE}/my-parties` : `${API_BASE}/users/${viewedUserId}/parties`;

  const partyList = document.getElementById('partyList');
  if (!partyList) {
    console.warn('⚠️ #partyList element not found in DOM.');
    return;
  }

  try {
    const res = await fetchWithAuth(endpoint);
    console.log('📡 Parties response status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Failed to fetch parties:', text);
      throw new Error('Failed to fetch parties');
    }

    const parties = await res.json();
    console.log('✅ Parties loaded:', parties);

    partyList.innerHTML = '';

    if (parties.length === 0) {
      partyList.innerHTML = '<div class="placeholder-box">No parties yet.</div>';
      return;
    }

    for (const party of parties) {
      const card = document.createElement("div");
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
      card.style.width = "60px";

      const img = document.createElement("img");
      img.className = "party-avatar";
      img.src = party.avatar
        ? (party.avatar.startsWith('http') ? party.avatar : `${API_BASE}${party.avatar}`)
        : `${FRONTEND_BASE}/img/avatar-party-placeholder.webp`;
      img.onerror = () => {
        img.src = `${FRONTEND_BASE}/img/avatar-party-placeholder.webp`;
      };
      img.alt = `${party.emoji || ''} ${party.name}`;
      img.title = `${party.emoji || ''} ${party.name}`;
      img.onclick = () => window.location.href = `party.html?id=${party.id}`;

      card.appendChild(img);
      partyList.appendChild(card);
    }

  } catch (err) {
    console.error('❌ Failed to load parties:', err);
    partyList.innerHTML = ' ';
  }
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
        fetchUserParties(userIdToFetch);


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

  const gameTitle =
    game.title ||
    game.title_en ||
    game.title_sv ||
    game.name ||
    'Untitled';

  let imageUrl = game.img || game.thumbnail_url;
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = `../${imageUrl}`;
  }
  if (!imageUrl) {
    imageUrl = `${FRONTEND_BASE}/img/default-thumb.webp`;
  }

  img.src = imageUrl;
  img.alt = gameTitle;

  title.textContent = gameTitle;
  desc.textContent = game.description || game.description_en || game.description_sv || game.desc || 'No description available.';


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
  if (minimal) {
    openGameModal('favoriteGameModal', game);
  } else {
    openGameModal('wishlistGameModal', game);
  }
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

function getPartyIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function fetchPartyProfile() {
  const id = getPartyIdFromUrl();
  if (!id) {
    alert('Missing party ID');
    return;
  }

  try {
    // Fetch party info, members, and sessions in parallel
    const [partyRes, membersRes, sessionsRes] = await Promise.all([
      fetchWithAuth(`${API_BASE}/party/${id}`),
      fetchWithAuth(`${API_BASE}/party/${id}/avatar`),
      fetchWithAuth(`${API_BASE}/party/${id}/members`),
      fetchWithAuth(`${API_BASE}/party/${id}/sessions`)
    ]);

    // Check all responses
    if (!partyRes.ok) throw new Error('Failed to load party info');
    if (!membersRes.ok) throw new Error('Failed to load party members');
    if (!sessionsRes.ok) throw new Error('Failed to load party sessions');

    // Parse JSON
    const partyData = await partyRes.json();
    const avatarElem = document.getElementById('partyAvatar');
if (avatarElem) {
  avatarElem.src = partyData.avatar?.startsWith('http')
  ? partyData.avatar
  : `../${partyData.avatar || 'img/avatar-party-placeholder.webp'}`;

  avatarElem.onerror = () => {
    avatarElem.src = `${FRONTEND_BASE}/img/avatar-party-placeholder.webp`;
  };
}

    const members = await membersRes.json();
    const sessions = await sessionsRes.json();

    // Update party basic info
    document.getElementById('partyName').textContent = partyData.name || 'Unnamed Party';

    // If you have a description field in DB/backend, use it, else skip or add later
    if (document.getElementById('partyDesc')) {
      document.getElementById('partyDesc').textContent = partyData.description || '';
    }

    // Placeholder for active session (can be replaced later)
    const activeSessionBox = document.getElementById('activeSessionBox');
    if (activeSessionBox) {
      activeSessionBox.innerHTML = `
        <div class="session-box">
          <strong>Active Session:</strong><br>
          <span style="opacity: 0.6;">Coming soon…</span>
        </div>
      `;
    }

    // Render party members
    const membersList = document.getElementById('partyMembersList');
    if (membersList) {
      membersList.innerHTML = '';
      for (const m of members) {
        const el = document.createElement('div');
        el.className = 'party-member';

        const img = document.createElement('img');
        img.src = m.avatar_url?.startsWith('http') ? m.avatar_url : `${API_BASE}${m.avatar_url || ''}`;
        img.alt = `${m.first_name} ${m.last_name}`;
        img.className = 'party-avatar';

        const name = document.createElement('span');
        name.textContent = `${m.first_name} ${m.last_name}`;
        name.className = 'party-name';

        el.appendChild(img);
        el.appendChild(name);
        membersList.appendChild(el);
      }
    }

    // Render party sessions
    const sessionsList = document.getElementById('partySessionLog');
    if (sessionsList) {
      sessionsList.innerHTML = '';
      if (sessions.length === 0) {
        const noSessionsRow = document.createElement('tr');
        noSessionsRow.innerHTML = `<td colspan="2" style="text-align:center; font-style: italic; color: #a07d3b;">No sessions recorded yet.</td>`;
        sessionsList.appendChild(noSessionsRow);
      } else {
        for (const s of sessions) {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${new Date(s.started_at).toLocaleDateString()}</td>
            <td>${s.game_title || 'Unknown'}</td>
          `;
          sessionsList.appendChild(row);
        }
      }
    }

  } catch (err) {
    console.error('❌ Failed to load party profile:', err);
    alert('Could not load party profile.');
  }
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
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name, emoji }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Failed to create party: ${err.error || res.statusText}`);
      return;
    }

    const data = await res.json();
    alert(`Party created! Invite code: ${data.inviteCode}`);

    // Optionally refresh party list or redirect
    fetchUserParties(userIdToFetch);
    closeCreatePartyModal();

  } catch (err) {
    console.error('Error creating party:', err);
    alert('Error creating party. See console for details.');
  }
}

function openCreatePartyModal() {
  const modal = document.getElementById("createPartyModal");
  if (modal) modal.style.display = "flex";
}
  document.addEventListener('DOMContentLoaded', async () => {
  try {
    await fetchProfile(); // Ensure token is valid and user data is loaded
  } catch (err) {
    console.error("❌ Error during initial load:", err);
  }

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
  }

  // ✅ Unified click-outside-to-close for all modals
  window.addEventListener('click', (e) => {
    document.querySelectorAll('.modal').forEach(modal => {
      if (
        e.target === modal &&
        getComputedStyle(modal).display !== 'none'
      ) {
        modal.style.display = 'none';
      }
    });
  });

  const createPartyBtn = document.getElementById("createPartyBtn");
if (createPartyBtn) {
  createPartyBtn.onclick = openCreatePartyModal;
}

const closeCreatePartyModalBtn = document.getElementById("closeCreatePartyModal");

if (closeCreatePartyModalBtn) {
  closeCreatePartyModalBtn.onclick = closeCreatePartyModal;
}

const submitCreatePartyBtn = document.getElementById("submitCreatePartyBtn");
if (submitCreatePartyBtn) {
  submitCreatePartyBtn.onclick = submitCreateParty;
}
});



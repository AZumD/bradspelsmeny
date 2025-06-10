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

      if (n.type === 'friend_request') {
        const btnWrapper = document.createElement('div');
        btnWrapper.style.marginTop = '0.5rem';

        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Accept';
        acceptBtn.className = 'btn-accept';
        acceptBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const res = await fetchWithAuth(`${API_BASE}/friend-requests/${n.id}/accept`, {
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
        }
        if (n.type === 'friend_accept' && n.data.receiver_id) {
          window.location.href = `profile.html?id=${n.data.receiver_id}`;
        }
      };

      list.appendChild(div);
    }

    if (notifications.some(n => !n.read)) {
  document.getElementById("notificationIcon").appendChild(document.createElement("span")).id = "notificationDot";
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

    default:
      return `${n.type} <br><small>${time}</small>`;
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
      friendsList.innerHTML = `<div class="placeholder-box">No friends to display… yet.</div>`;
      return;
    }

    for (const friend of friends) {
      const img = document.createElement("img");
      img.src = friend.avatar_url
        ? (friend.avatar_url.startsWith('http') ? friend.avatar_url : API_BASE + friend.avatar_url)
        : `${FRONTEND_BASE}/img/avatar-placeholder.webp`;
      img.classList.add("friend-avatar");
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
    document.getElementById("friendsList").innerHTML = `<div class="placeholder-box">Could not load friends.</div>`;
  }
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
  const myId = getUserIdFromToken(); // ✅ FIXED
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
  const profileUserId = viewedId; // 🔧 needed in both checkFriendStatus and remove handler

  checkFriendStatus(profileUserId); // ✅ This sets up the Remove Friend button if applicable

  // ✅ Attach remove friend handler if button is present
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

  // 📩 Manual Add Friend Modal (only on your own profile)
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

  // 🔔 Notifications
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




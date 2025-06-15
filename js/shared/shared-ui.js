// Utility
function getUserRole() {
  const token = localStorage.getItem("userToken");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).role || null;
  } catch {
    return null;
  }
}
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
function getAccessToken() {
  return localStorage.getItem('userToken');
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
function clearTokens() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('refreshToken');
}
function goTo(path) {
  const base = window.location.hostname === 'localhost'
    ? ''
    : '/bradspelsmeny';
  window.location.href = window.location.origin + base + path;
}
function logout() {
  clearTokens();
  window.location.href = '/bradspelsmeny/pages/login.html';
}
async function fetchWithAuth(url, options = {}) {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) throw new Error('User not authenticated');

  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${accessToken}`;

  let response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    const refreshResponse = await fetch(`${API_BASE}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      if (data.token) {
        localStorage.setItem('userToken', data.token);
        options.headers['Authorization'] = `Bearer ${data.token}`;
        return fetch(url, options);
      }
    }
  }
  return response;
}

// PixelNav Setup
function initPixelNav() {
  const nav = document.getElementById('pixelNav');
  if (nav && getAccessToken() && !isTokenExpired(getAccessToken())) {
    nav.style.display = 'flex';
  }

  const adminToggle = document.getElementById("adminMenuToggle");
  const adminDropdown = document.getElementById("adminMenuDropdown");
  const logoutIcon = document.getElementById("logoutIcon");

  if (getUserRole() === "admin" && adminToggle && adminDropdown) {
    adminToggle.style.display = "inline-block";
    if (logoutIcon) logoutIcon.style.display = "none";

    adminToggle.addEventListener("click", () => {
      adminDropdown.style.display =
        adminDropdown.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", (e) => {
      if (!adminToggle.contains(e.target) && !adminDropdown.contains(e.target)) {
        adminDropdown.style.display = "none";
      }
    });
  }
}

// Notifications
async function fetchNotifications() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');

    const notifications = await res.json();
    const list = document.getElementById('notificationList');
    if (!list) return;

    list.innerHTML = '';
    const hasUnread = notifications.some(n => !n.read);

    const icon = document.getElementById("notificationIcon");
    if (icon) {
      icon.src = hasUnread
        ? "../img/icons/icon-notif-on.webp"
        : "../img/icons/icon-notif-off.webp";
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
          const res = await fetchWithAuth(`${API_BASE}/friend-requests/${n.data?.request_id}/accept`, {
            method: 'POST',
          });
          if (res.ok) {
            div.innerHTML = `✅ Friend request accepted<br><small>${new Date().toLocaleString()}</small>`;
            icon.src = "../img/icons/icon-notif-off.webp";
          }
        };

        const declineBtn = document.createElement('button');
        declineBtn.textContent = 'Decline';
        declineBtn.className = 'btn-decline';
        declineBtn.onclick = async (e) => {
          e.stopPropagation();
          await fetchWithAuth(`${API_BASE}/friend-requests/${n.id}/decline`, { method: 'POST' });
          div.innerHTML = `❌ Friend request declined<br><small>${new Date().toLocaleString()}</small>`;
        };

        btnWrapper.appendChild(acceptBtn);
        btnWrapper.appendChild(declineBtn);
        div.appendChild(btnWrapper);
      }

      div.onclick = async () => {
        if (!n.read) {
          await fetchWithAuth(`${API_BASE}/notifications/${n.id}/read`, { method: 'POST' });
          div.classList.remove('unread');
          const updated = list.querySelectorAll('.notification-item.unread');
          if (updated.length === 0) icon.src = "../img/icons/icon-notif-off.webp";

          if (n.type === 'badge_awarded' && n.data?.name && n.data?.icon_url) {
            showBadgePopup(n.data.name, n.data.icon_url, time);
          }
        }
        if (n.type === 'friend_accept' && n.data?.receiver_id) {
          window.location.href = `profile.html?id=${n.data.receiver_id}`;
        }
      };

      list.appendChild(div);
    }
  } catch (err) {
    console.error('❌ Notification error:', err);
    const list = document.getElementById('notificationList');
    if (list) list.innerHTML = '<div class="placeholder-box">Could not load notifications.</div>';
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
  const popup = document.getElementById('badgePopup');
  if (!popup) return;

  document.getElementById('badgePopupImage').src = iconUrl;
  document.getElementById('badgePopupImage').alt = name;
  document.getElementById('badgePopupName').textContent = name;
  document.getElementById('badgePopupTime').textContent = time;
  popup.style.display = 'flex';

  setTimeout(() => {
    popup.style.display = 'none';
  }, 6000);
}

async function updateNotificationIcon() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const notifications = await res.json();
    const hasUnread = notifications.some(n => !n.read);

    const icon = document.getElementById("notificationIcon");
    if (icon) {
      icon.src = hasUnread
        ? "../img/icons/icon-notif-on.webp"
        : "../img/icons/icon-notif-off.webp";
    }
  } catch (err) {
    console.error('❌ Failed to update notification icon:', err);
  }
}

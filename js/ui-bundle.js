// ui-bundle.js

const API_BASE = "https://bradspelsmeny-backend-production.up.railway.app";
const css = `

#pixelNav {
  position:fixed;
  bottom:0;
  left:0;
  width:100%;
  background-color:#fffdf7;
  border-top:2px dashed #d9b370;
  display:flex;
  justify-content:space-around;
  padding:8px 0;
  box-shadow:0 -2px 6px rgba(90,42,12,0.2);
  z-index:999;
}
#pixelNav button {
  background:none;
  border:none;
  padding:0;
  cursor:pointer;
}
.notifModal {
  position:fixed;
  z-index:1000;
  left:0;
  top:0;
  width:100%;
  height:100%;
  background-color:rgba(0,0,0,0.5);
  display:flex;
  align-items:center;
  justify-content:center;
}


.nav-icon {
  width:32px;
  height:32px;
  image-rendering: pixelated;
  transition:transform 0.2s ease;
}
.nav-icon:hover {
  transform:scale(1.2);
}
.admin-popup-menu {
  position:fixed;
  top:0;
  left:0;
  background:#fffdf7;
  border:2px dashed #c9a04e;
  padding:0.8rem;
  display:flex;
  flex-direction:column;
  font-family:'Press Start 2P',monospace;
  font-size:0.55rem;
  z-index:9999;
}
.admin-popup-menu a,.admin-popup-menu button {
  margin-bottom:0.5rem;
  text-align:left;
  background:none;
  border:none;
  color:#3c2415;
  text-decoration:none;
  cursor:pointer;
}
.notification-list {
  max-height:300px;
  overflow-y:auto;
  margin-top:10px;
}
.notification-item {
  border-bottom:1px solid #d9b370;
  padding:10px;
  font-size:0.9rem;
  color:#5a2a0c;
  background-color:#f9f6f2;
}
.notification-item.unread {
  background-color:#fff3d6;
  font-weight:bold;
  border-left:4px solid #d9b370;
}
.notification-item:last-child {
  border-bottom:none;
}
#notificationDot {
  position:absolute;
  top:-4px;
  right:-4px;
  width:10px;
  height:10px;
  background-color:red;
  border-radius:50%;
  box-shadow:0 0 4px rgba(0,0,0,0.3);
  display:none;
}
.btn-accept {
  background-color:#85c17e;
  color:white;
}
.btn-decline {
  background-color:#e06d6d;
  color:white;
}
.btn-accept:hover {
  background-color:#6fae65;
}
.btn-decline:hover {
  background-color:#c65555;
}
#notificationIcon {
  position:fixed;
  top:20px;
  right:20px;
  font-size:1.5rem;
  color:white;
  padding:10px;
  border-radius:50%;
  background:transparent;
  cursor:pointer;
  z-index:1000;
  transition:background-color 0.3s ease,transform 0.2s ease;
}
#notificationIcon:hover {
  background:transparent;
  transform:scale(1.05);
}
.notification-item button {
  margin-right:8px;
  padding:4px 10px;
  font-size:0.8rem;
  cursor:pointer;
  border-radius:5px;
  border:none;
  font-family:'Segoe UFI',Tahoma,sans-serif;
}
`;
const styleTag = document.createElement('style');
styleTag.textContent = css;
document.head.appendChild(styleTag);

const navHTML = `
  <nav id="pixelNav">
    <img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-home.webp" alt="Home" class="nav-icon" onclick="goTo('/')">
    <img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-profile.webp" alt="Profile" class="nav-icon" onclick="goTo('/pages/profile.html')">
    <img id="logoutIcon" src="https://azumd.github.io/bradspelsmeny/img/icons/icon-logout.webp" alt="Logout" class="nav-icon">
    <button id="adminMenuToggle" class="nav-icon" style="display: none;">
      <img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-admintools.webp" alt="Admin Menu" width="32" height="32" />
    </button>
  </nav>

 <ul id="adminMenuDropdown" class="admin-popup-menu" style="display:none;">

    <li><a href="/bradspelsmeny/admin/index.html"><img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-admin.webp" alt="Admin Dash" width="48" height="48" /></a></li>
    <li><a href="/bradspelsmeny/admin/edit-games.html"><img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-editgames.webp" alt="Edit Games" width="48" height="48" /></a></li>
    <li><a href="/bradspelsmeny/admin/user-db.html"><img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-friends.webp" alt="User DB" width="48" height="48" /></a></li>
    <li><a href="/bradspelsmeny/admin/lending.html"><img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-lending.webp" alt="Lending" width="48" height="48" /></a></li>
    <li><a href="#" id="adminLogout"><img src="https://azumd.github.io/bradspelsmeny/img/icons/icon-logout.webp" alt="Logout" width="48" height="48" /></a></li>
  </ul>

  <img id="notificationIcon" src="https://azumd.github.io/bradspelsmeny/img/icons/icon-notif-off.webp" alt="Notifications" title="Notifications" width="58" height="58" />
  <span id="notificationDot"></span>

  <div id="badgeInfoModal" class="modal" style="display:none;"><div class="modal-content"><span class="close-btn" id="closeBadgeInfoBtn">&times;</span><img id="badgeIcon" src="" alt="Badge Icon" style="width:64px;height:64px;margin-bottom:1rem;"><h3 id="badgeName" style="margin-bottom:0.5rem;"></h3><p id="badgeDescription" style="font-size:0.9rem;"></p></div></div>
  <div id="badgePopup" class="modal" style="display:none;"><div class="modal-content"><span class="close-btn" id="closeBadgePopup">&times;</span><h3 style="margin-bottom:8px;">🏅 Badge Unlocked!</h3><img id="badgePopupImage" src="" alt="Badge" style="width:64px;height:64px;border:2px solid #c9a04e;border-radius:8px;margin-bottom:10px;"><div id="badgePopupName" style="font-weight:bold;font-size:1rem;margin-bottom:4px;"></div><div id="badgePopupTime" style="font-size:0.75rem;color:#a07d3b;"></div></div></div>
<div id="notificationModal" class="notifModal" style="display: none;">
  <div class="modal-content">
    <span class="close-btn" id="closeNotificationBtn">&times;</span>
    <div id="notificationList" class="notification-list"></div>
  </div>
</div>`;

document.body.insertAdjacentHTML('beforeend', navHTML);
initPixelNav();

function getAccessToken() {
  return localStorage.getItem('userToken');
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getUserRole() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("No token");

  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, options);
}

function goTo(path) {
  const base = window.location.hostname === 'localhost'
    ? ''
    : '/bradspelsmeny';
  window.location.href = window.location.origin + base + path;
}
window.goTo = goTo;

function clearTokens() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("refreshToken");
}

function logout() {
  clearTokens();
  window.location.href = '/bradspelsmeny/pages/login.html';
}

function toggleAdminMenu() {
  const dropdown = document.getElementById("adminMenuDropdown");
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

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
        ? "https://azumd.github.io/bradspelsmeny/img/icons/icon-notif-on.webp"
        : "https://azumd.github.io/bradspelsmeny/img/icons/icon-notif-off.webp";
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
            icon.src = "https://azumd.github.io/bradspelsmeny/img/icons/icon-notif-off.webp";
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
          if (updated.length === 0) icon.src = "https://azumd.github.io/bradspelsmeny/img/icons/icon-notif-off.webp";

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
        ? "https://azumd.github.io/bradspelsmeny/img/icons/icon-notif-on.webp"
        : "https://azumd.github.io/bradspelsmeny/img/icons/icon-notif-off.webp";
    }
  } catch (err) {
    console.error('❌ Failed to update notification icon:', err);
  }
}

function initPixelNav() {
    const nav = document.getElementById('pixelNav');
    if (nav && getAccessToken() && !isTokenExpired(getAccessToken())) {
      nav.style.display = 'flex';
    }
  
    const adminToggle = document.getElementById("adminMenuToggle");
    const adminDropdown = document.getElementById("adminMenuDropdown");
    const logoutIcon = document.getElementById("logoutIcon");
  
    // ✅ Show/hide elements based on role
    if (getUserRole() === "admin") {
      if (adminToggle) adminToggle.style.display = "inline-block";
      if (logoutIcon) logoutIcon.style.display = "none";
    }
  
    // ✅ Always bind toggle logic if elements exist
    if (adminToggle && adminDropdown) {
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
  

// Notification modal toggle
const notifBtn = document.getElementById('notificationIcon');
const notifModal = document.getElementById('notificationModal');
const closeNotifBtn = document.getElementById('closeNotificationBtn');

if (notifBtn && notifModal && closeNotifBtn) {
  notifBtn.addEventListener('click', () => {
    notifModal.style.display = notifModal.style.display === 'flex' ? 'none' : 'flex';
    fetchNotifications();
  });
  closeNotifBtn.addEventListener('click', () => {
    notifModal.style.display = 'none';
  });
}

// 🧷 Final bindings for modals & logout
const notifIcon = document.getElementById("notificationIcon");
if (notifIcon) {
  notifIcon.addEventListener("click", () => {
    document.getElementById("badgePopup").style.display = "none";
    document.getElementById("badgeInfoModal").style.display = "none";
  });
}

document.getElementById("logoutIcon")?.addEventListener("click", logout);
document.getElementById("adminLogout")?.addEventListener("click", logout);

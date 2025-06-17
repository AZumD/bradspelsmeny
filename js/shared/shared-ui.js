import { API_ENDPOINTS } from '../modules/config.js';
import { getAccessToken, isTokenExpired, getUserRole } from '../modules/auth.js';

// Navigation
export function goTo(path) {
  const base = window.location.hostname === 'localhost'
    ? ''
    : '/bradspelsmeny';

  // Special handling for profile page
  if (path === '/pages/profile.html') {
    const token = getAccessToken();
    if (token) {
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      path = `/pages/profile.html?id=${userId}`;
    }
  }

  window.location.href = window.location.origin + base + path;
}

// Notification modal toggle
function initNotificationModal() {
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
}

// PixelNav Setup
export function initPixelNav() {
  const nav = document.getElementById('pixelNav');
  if (!nav) return;

  const token = getAccessToken();
  if (token && !isTokenExpired(token)) {
    nav.style.display = 'flex';
  }

  const adminToggle = document.getElementById("adminMenuToggle");
  const adminDropdown = document.getElementById("adminMenuDropdown");
  const logoutIcon = document.getElementById("logoutIcon");

  if (getUserRole() === "admin" && adminToggle && adminDropdown) {
    adminToggle.style.display = "inline-block";
    if (logoutIcon) logoutIcon.style.display = "none";
    
    // Explicitly set initial state
    adminDropdown.style.display = "none";
    adminToggle.setAttribute("aria-expanded", "false");

    // Toggle menu on click
    adminToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      const isVisible = adminDropdown.style.display === "block";
      adminDropdown.style.display = isVisible ? "none" : "block";
      adminToggle.setAttribute("aria-expanded", !isVisible);
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!adminToggle.contains(e.target) && !adminDropdown.contains(e.target)) {
        adminDropdown.style.display = "none";
        adminToggle.setAttribute("aria-expanded", "false");
      }
    });
  } else if (logoutIcon) {
    logoutIcon.style.display = "inline-block";
  }

  // Initialize notification modal
  initNotificationModal();
}

// Notifications
export async function fetchNotifications() {
  try {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
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
          const res = await fetch(`${API_ENDPOINTS}/friend-requests/${n.data?.request_id}/accept`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
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
          await fetch(`${API_ENDPOINTS}/friend-requests/${n.id}/decline`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          });
          div.innerHTML = `❌ Friend request declined<br><small>${new Date().toLocaleString()}</small>`;
        };

        btnWrapper.appendChild(acceptBtn);
        btnWrapper.appendChild(declineBtn);
        div.appendChild(btnWrapper);
      }

      div.onclick = async () => {
        if (!n.read) {
          await fetch(`${API_ENDPOINTS}/notifications/${n.id}/read`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          });
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

export async function updateNotificationIcon() {
  try {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
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

// Make functions available globally for onclick handlers
window.goTo = goTo;

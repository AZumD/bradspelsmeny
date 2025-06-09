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
    // Try refreshing access token
    const refreshResponse = await fetch(`${API_BASE}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      // Refresh token invalid or expired → force logout
      clearTokens();
      window.location.href = '/login.html';
      throw new Error('Session expired. Please log in again.');
    }

    const data = await refreshResponse.json();
    const newAccessToken = data.token || data.accessToken; // Support either naming
    setAccessToken(newAccessToken);

    // Retry original request with new access token
    options.headers['Authorization'] = `Bearer ${newAccessToken}`;
    response = await fetch(url, options);
  }

  return response;
}

// Extract user ID from JWT token payload
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
const userId = localStorage.getItem("userId"); // current logged in user
const profileId = new URLSearchParams(window.location.search).get("id"); // viewing someone else's profile

const addFriendBtn = document.getElementById("addFriendBtn");

if (userId && profileId && userId !== profileId) {
  addFriendBtn.style.display = "inline-block";

  addFriendBtn.addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_BASE}/friends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId: profileId }),
      });

      if (res.ok) {
        alert("Friend request sent!");
        addFriendBtn.disabled = true;
        addFriendBtn.textContent = "Request Sent";
      } else {
        alert("Failed to add friend.");
      }
    } catch (err) {
      console.error(err);
    }
  });
}

// Load friend avatars (fake data for now)
function loadFriends(friends) {
  const friendsList = document.getElementById("friendsList");
  friendsList.innerHTML = ""; // clear

  if (!friends.length) {
    friendsList.innerHTML = `<div class="placeholder-box">No friends to display… yet.</div>`;
    return;
  }

  for (const friend of friends) {
    const img = document.createElement("img");
    img.src = friend.avatarUrl || "../img/avatar-placeholder.webp";
    img.classList.add("friend-avatar");
    img.title = friend.name;
    img.onclick = () => window.location.href = `profile.html?id=${friend.id}`;
    friendsList.appendChild(img);
  }
}

// Example dummy usage:
loadFriends([
  { id: 2, name: "Klara", avatarUrl: "../img/klara-avatar.png" },
  { id: 3, name: "Jonathan", avatarUrl: "../img/jonathan-avatar.png" },
]);

// Get "id" param from URL query string
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

  // Determine which user ID to fetch: URL param or logged-in user
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

    // Show username instead of full name and email
    document.getElementById('username').textContent = data.username || 'Unknown user';

    // Hide fullName and email elements if they exist
    const fullNameElem = document.getElementById('fullName');
    if(fullNameElem) fullNameElem.style.display = 'none';

    const emailElem = document.getElementById('email');
    if(emailElem) emailElem.style.display = 'none';

    document.getElementById('bio').textContent = data.bio || '';

    // If avatar_url is relative path, prepend API_BASE
    let avatarUrl = data.avatar_url || `${FRONTEND_BASE}/img/avatar-placeholder.webp`;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = API_BASE + avatarUrl;
    }
    
    const avatarElem = document.getElementById('avatar');
    avatarElem.src = avatarUrl;
    avatarElem.alt = `Avatar of ${data.username || 'user'}`;

    // Show "Edit Profile" button only if viewing own profile
    const editBtn = document.getElementById('editProfileBtn');
    if (String(userIdToFetch) === String(loggedInUserId)) {
      editBtn.style.display = 'block';
    } else {
      editBtn.style.display = 'none';
    }

    // Fetch game log (backend will handle permission)
    fetchGameLog(userIdToFetch);

  } catch (err) {
    alert('Error loading profile: ' + err.message);
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

document.addEventListener('DOMContentLoaded', fetchProfile);

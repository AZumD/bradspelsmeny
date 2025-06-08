const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

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

    document.getElementById('fullName').textContent = `${data.first_name} ${data.last_name}`;
    document.getElementById('email').textContent = data.email || '';
    document.getElementById('bio').textContent = data.bio || '';

    // If avatar_url is relative path, prepend API_BASE
    let avatarUrl = data.avatar_url || '/bradspelsmeny/img/anthon-avatar.png';
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = API_BASE + avatarUrl;
    }
    const avatarElem = document.getElementById('avatar');
    avatarElem.src = avatarUrl;
    avatarElem.alt = `Avatar of ${data.first_name}`;

    // Show "Edit Profile" button only if viewing own profile
    const editBtn = document.getElementById('editProfileBtn');
    if (String(userIdToFetch) === String(loggedInUserId)) {
      editBtn.style.display = 'block';
    } else {
      editBtn.style.display = 'none';
    }

    // Fetch borrow log (backend will handle permission)
    fetchBorrowLog(userIdToFetch);

  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
}

async function fetchBorrowLog(userId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/borrow-log`);
    if (!res.ok) {
      document.querySelector('#borrowLogTable tbody').innerHTML =
        `<tr><td colspan="4" style="text-align:center; padding:1rem; color:#999;">
          Borrow log is private or unavailable.
         </td></tr>`;
      return;
    }
    const logs = await res.json();

    if (logs.length === 0) {
      document.querySelector('#borrowLogTable tbody').innerHTML =
        `<tr><td colspan="4" style="text-align:center; padding:1rem;">No borrow history yet.</td></tr>`;
      return;
    }

    const rowsHtml = logs.map(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      const action = log.action.charAt(0).toUpperCase() + log.action.slice(1);
      const note = log.note || '';
      return `<tr>
                <td>${date}</td>
                <td>${log.game_title}</td>
                <td>${action}</td>
                <td>${note}</td>
              </tr>`;
    }).join('');

    document.querySelector('#borrowLogTable tbody').innerHTML = rowsHtml;

  } catch (err) {
    console.error('Failed to fetch borrow log:', err);
    document.querySelector('#borrowLogTable tbody').innerHTML =
      `<tr><td colspan="4" style="text-align:center; padding:1rem; color:red;">
         Failed to load borrow log.
       </td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', fetchProfile);

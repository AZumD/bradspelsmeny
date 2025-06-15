export const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
export const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

//Check if Admin.==============================================================================

export function getUserRole() {
  const token = localStorage.getItem("userToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export const isAdmin = getUserRole() === "admin";

//Token.=======================================================================================

export function getAccessToken() {
  return localStorage.getItem('userToken');
}
export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
export function clearTokens() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('refreshToken');
}
export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
export async function fetchWithAuth(url, options = {}) {
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


export function getUserIdFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

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
  const token = getAccessToken();
  const refresh = getRefreshToken();
  if (!token || !refresh) throw new Error('Not authenticated');

  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    const refreshRes = await fetch(`${API_BASE}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem('userToken', data.token);
      options.headers['Authorization'] = `Bearer ${data.token}`;
      return fetch(url, options);
    }
  }

  return res;
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

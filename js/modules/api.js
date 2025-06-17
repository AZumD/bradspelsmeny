import { refreshToken } from './auth.js';

export function getUserIdFromToken() {
  const token = localStorage.getItem('userToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
}

export async function fetchWithAuth(url, options = {}, retry = true) {
    if (!options.headers) options.headers = {};
    const token = localStorage.getItem("userToken");
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await fetch(url, options);

    if (res.status === 401 && retry) {
        const refreshed = await refreshToken();
        if (refreshed) {
            options.headers["Authorization"] = `Bearer ${localStorage.getItem("userToken")}`;
            res = await fetch(url, options);
        } else {
            localStorage.removeItem("userToken");
            localStorage.removeItem("refreshToken");
            alert("Din session har gått ut. Vänligen logga in igen.");
            window.location.href = "/bradspelsmeny/pages/login.html";
            throw new Error("Unauthorized, please login again.");
        }
    }

    return res;
} 
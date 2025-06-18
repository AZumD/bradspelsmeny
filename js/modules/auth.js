// auth.js — Shared authentication and token utility module

export function getAccessToken() {
    return localStorage.getItem("userToken");
  }
  
  export function getRefreshToken() {
    return localStorage.getItem("refreshToken");
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
  
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
  
  export function getUserRole() {
    const token = getAccessToken();
    if (!token) return null;
    const payload = parseJwt(token);
    return payload?.role || null;
  }
  
  export async function refreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
  
    try {
      const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
  
      if (!res.ok) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("refreshToken");
        return false;
      }
  
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("userToken", data.token);
        return true;
      }
  
      return false;
    } catch {
      return false;
    }
  }
  
  export async function fetchWithAuth(url, options = {}, retry = true) {
    if (!options.headers) options.headers = {};
    const token = getAccessToken();
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }
  
    let res = await fetch(url, options);
  
    if (res.status === 401 && retry) {
      const refreshed = await refreshToken();
      if (refreshed) {
        options.headers["Authorization"] = `Bearer ${getAccessToken()}`;
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
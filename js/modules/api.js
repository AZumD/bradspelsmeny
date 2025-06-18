import { fetchWithAuth } from './auth.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

export async function fetchOrders() {
  const res = await fetchWithAuth(`${API_BASE}/order-game/latest`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Failed to fetchOrders");
  return res.json();
}

export async function deleteOrder(id) {
  const res = await fetchWithAuth(`${API_BASE}/order-game/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to deleteOrder");
  return res.json();
}

export async function lendGame(gameId) {
  const res = await fetchWithAuth(`${API_BASE}/lend/${gameId}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to lendGame");
  return res.json();
}

export async function returnGame(gameId) {
  const res = await fetchWithAuth(`${API_BASE}/return/${gameId}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to returnGame");
  return res.json();
}

export async function getGameById(id) {
  const res = await fetchWithAuth(`${API_BASE}/games/${id}`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Failed to getGameById");
  return res.json();
}

export async function fetchPublicGames() {
  const res = await fetchWithAuth(`${API_BASE}/games/public`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Failed to fetchPublicGames");
  return res.json();
}

export async function fetchAllGames() {
  const res = await fetchWithAuth(`${API_BASE}/games`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Failed to fetchAllGames");
  return res.json();
}

export async function getUserProfile(id) {
  const res = await fetchWithAuth(`${API_BASE}/users/${id}`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Failed to getUserProfile");
  return res.json();
}

export async function getNotifications() {
  const res = await fetchWithAuth(`${API_BASE}/notifications`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Failed to getNotifications");
  return res.json();
}

export async function markNotificationAsRead(id) {
  const res = await fetchWithAuth(`${API_BASE}/notifications/${id}/read`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to markNotificationAsRead");
  return res.json();
}

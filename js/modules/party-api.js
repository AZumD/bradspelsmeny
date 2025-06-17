import { getAccessToken } from '../shared/shared-ui.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

export async function fetchPartyData(partyId) {
  const res = await fetch(`${API_BASE}/party/${partyId}`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });

  let data;
  try {
    data = await res.json();
  } catch (parseError) {
    throw new Error('Failed to parse server response');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch party');
  }

  if (!data.name) {
    throw new Error('Malformed party data');
  }

  return data;
}

export async function fetchPartyMembers(partyId) {
  const res = await fetch(`${API_BASE}/party/${partyId}/members`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  return res.json();
}

export async function fetchPartyInviteCode(partyId) {
  const res = await fetch(`${API_BASE}/party/${partyId}/invite-code`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  return res.json();
}

export async function fetchPartySessions(partyId) {
  const res = await fetch(`${API_BASE}/party/${partyId}/sessions`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  return res.json();
}

export async function fetchActiveSession(partyId) {
  const res = await fetch(`${API_BASE}/party/${partyId}/active-session`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  return res.json();
}

export async function fetchMessages(partyId) {
  const res = await fetch(`${API_BASE}/party/${partyId}/messages`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  return res.json();
}

export async function sendMessage(partyId, text) {
  const res = await fetch(`${API_BASE}/party/${partyId}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  return res.json();
}

export async function inviteUser(partyId, userId) {
  const res = await fetch(`${API_BASE}/party/${partyId}/invite`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: userId })
  });
  return res.json();
}

export async function loadAllGames() {
  try {
    const res = await fetch(`${API_BASE}/games`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
    if (!res.ok) throw new Error('Failed to load games');
    return await res.json();
  } catch (err) {
    console.error('Error loading games:', err);
    return [];
  }
} 
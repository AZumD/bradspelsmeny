import { fetchWithAuth } from './api.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

export async function fetchUserParties(viewedUserId = null) {
  const loggedInUserId = getUserIdFromToken();
  const isOwnProfile = !viewedUserId || String(viewedUserId) === String(loggedInUserId);
  const endpoint = isOwnProfile
    ? `${API_BASE}/my-parties`
    : `${API_BASE}/users/${viewedUserId}/parties`;

  const partyList = document.getElementById('partyList');
  if (!partyList) return;

  try {
    const res = await fetchWithAuth(endpoint);
    if (!res.ok) throw new Error();
    const parties = await res.json();
    partyList.innerHTML = '';
    if (parties.length === 0) {
      partyList.innerHTML = '<div class="placeholder-box">No parties yet.</div>';
      return;
    }
    parties.forEach(party => {
      const card = document.createElement('div');
      card.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:60px';
      const img = document.createElement('img');
      img.className = 'party-avatar';
      img.src = party.avatar && party.avatar.startsWith('http')
        ? party.avatar
        : `${party.avatar ? API_BASE + party.avatar : FRONTEND_BASE + '/img/avatar-party-placeholder.webp'}`;
      img.onerror = () => { img.src = `${FRONTEND_BASE}/img/avatar-party-placeholder.webp`; };
      img.alt = `${party.emoji || ''} ${party.name}`;
      img.title = img.alt;
      img.onclick = () => window.location.href = `party.html?id=${party.id}`;
      card.appendChild(img);
      partyList.appendChild(card);
    });

    if (isOwnProfile) {
      const addPartyBtn = document.createElement('div');
      addPartyBtn.className = 'add-party-circle';
      addPartyBtn.textContent = '+';
      addPartyBtn.title = 'Create Party';
      addPartyBtn.onclick = openCreatePartyModal;
      partyList.appendChild(addPartyBtn);
    }
  } catch {
    partyList.innerHTML = '<div class="placeholder-box">Could not load parties.</div>';
  }
}

export function openCreatePartyModal() {
  const modal = document.getElementById('createPartyModal');
  if (modal) modal.style.display = 'flex';
}

export function closeCreatePartyModal() {
  const modal = document.getElementById('createPartyModal');
  if (modal) modal.style.display = 'none';
}

export async function submitCreateParty() {
  const nameInput = document.getElementById('partyName');
  const emojiInput = document.getElementById('partyEmoji');
  if (!nameInput || !emojiInput) return;

  const name = nameInput.value.trim();
  const emoji = emojiInput.value.trim();
  if (!name) {
    alert('Please enter a party name');
    return;
  }

  try {
    const res = await fetchWithAuth(`${API_BASE}/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    window.location.href = `party.html?id=${data.id}`;
  } catch (err) {
    alert('Failed to create party: ' + err.message);
  }
}

// Initialize party-related event listeners
document.addEventListener('DOMContentLoaded', () => {
  const createPartyModal = document.getElementById('createPartyModal');
  if (createPartyModal) {
    const closeBtn = createPartyModal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.onclick = closeCreatePartyModal;
    }
    const submitBtn = createPartyModal.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.onclick = submitCreateParty;
    }
  }
}); 
import { fetchWithAuth, getUserIdFromToken } from './api.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

export async function fetchUserParties(viewedUserId) {
  const partyList = document.getElementById('partyList');
  if (!partyList) return;

  try {
    // Only fetch parties if viewing own profile
    const loggedInUserId = getUserIdFromToken();
    const isOwnProfile = String(viewedUserId) === String(loggedInUserId);
    
    if (!isOwnProfile) {
      partyList.innerHTML = '<div class="placeholder-box">Parties are only visible to the owner.</div>';
      return;
    }

    const res = await fetchWithAuth(`${API_BASE}/my-parties`);
    if (!res.ok) throw new Error('Failed to fetch parties');
    const parties = await res.json();

    if (parties.length) {
      partyList.innerHTML = '';
      parties.forEach(party => {
        const partyEl = document.createElement('div');
        partyEl.className = 'party-entry';
        partyEl.innerHTML = `
          <img src="${party.avatar || `${FRONTEND_BASE}/img/avatar-party-default.webp`}" alt="${party.name}" class="party-avatar">
          <div class="party-info">
            <h3>${party.emoji || '🎲'} ${party.name}</h3>
            <p>Invite code: ${party.invite_code}</p>
          </div>
        `;
        partyList.appendChild(partyEl);
      });
    } else {
      partyList.innerHTML = '<div class="placeholder-box">No parties yet.</div>';
    }

    // Only show create button on own profile
    const createBtn = document.getElementById('createPartyBtn');
    if (createBtn) {
      createBtn.style.display = isOwnProfile ? 'block' : 'none';
    }
  } catch (err) {
    console.error('Error fetching parties:', err);
    partyList.innerHTML = '<div class="placeholder-box">Failed to load parties.</div>';
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
  const nameInput = document.getElementById('partyNameInput');
  const emojiInput = document.getElementById('partyEmojiInput');
  const name = nameInput?.value.trim();
  const emoji = emojiInput?.value.trim() || '🎲';
  if (!name) {
    alert('Please enter a party name.');
    return;
  }
  try {
    const res = await fetchWithAuth(`${API_BASE}/party`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji })
    });
    if (!res.ok) {
      const err = await res.json();
      alert(`Failed to create party: ${err.error || res.statusText}`);
      return;
    }
    const data = await res.json();
    alert(`Party created! Invite code: ${data.inviteCode}`);
    closeCreatePartyModal();
    fetchUserParties(getUserIdFromToken());
  } catch (err) {
    console.error('Error creating party:', err);
    alert('Error creating party. See console for details.');
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
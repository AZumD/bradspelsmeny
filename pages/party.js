// party.js
const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

function getAccessToken() {
  return localStorage.getItem('userToken');
}

function getPartyIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function fetchPartyData() {
  const partyId = getPartyIdFromURL();
  if (!partyId) return;

  try {
    const res = await fetch(`${API_BASE}/party/${partyId}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch party');
    }

    const data = await res.json(); // ✅ only once!

    if (!data.name) throw new Error('Party not found');

    document.getElementById('partyName').textContent = `${data.emoji} ${data.name}`;
    document.getElementById('partyMeta').textContent = `Created by ${data.creator_first_name} ${data.creator_last_name}`;
    document.getElementById('inviteCodeBox').textContent = `Invite Code: ${data.invite_code}`;

    // Set party avatar
    const avatar = document.getElementById('partyAvatar');
    if (avatar) {
      avatar.src = data.avatar || '../img/avatar-party-placeholder.webp';
    }

    // Load members
    const memberRes = await fetch(`${API_BASE}/party/${partyId}/members`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
    const members = await memberRes.json();
    renderMemberList(members);

    // Placeholder session logic
    const sessionList = document.getElementById('sessionList');
    sessionList.innerHTML = '<div class="placeholder-box">No sessions yet</div>';
  } catch (err) {
    console.error('Error loading party:', err);
    document.getElementById('partyName').textContent = 'Party not found';
    document.getElementById('memberList').innerHTML = '<div class="placeholder-box">Could not load members</div>';
     document.getElementById('inviteCodeBox').textContent = '---';
  }
}

function renderMemberList(members) {
  const container = document.getElementById('memberList');
  container.innerHTML = '';
  if (!members.length) {
    container.innerHTML = '<div class="placeholder-box">No members in this party</div>';
    return;
  }

  members.forEach(m => {
    const img = document.createElement('img');
    img.src = m.avatar || '../img/avatar-placeholder.webp';
    img.alt = `${m.first_name}'s avatar`;
    img.title = `${m.first_name} ${m.last_name}${m.is_leader ? ' ⭐' : ''}`;
    img.className = 'friend-avatar';
    container.appendChild(img);
  });
}

// Invite to Party Modal Logic
function setupInviteModal() {
  const openBtn = document.getElementById('inviteToPartyBtn');
  const closeBtn = document.getElementById('closeInviteToPartyModal');
  const modal = document.getElementById('inviteToPartyModal');
  const submitBtn = document.getElementById('submitPartyInvite');

  if (!openBtn || !closeBtn || !modal || !submitBtn) return;

  openBtn.onclick = () => modal.style.display = 'flex';
  closeBtn.onclick = () => modal.style.display = 'none';

  submitBtn.onclick = async () => {
    const userId = document.getElementById('inviteUserId').value;
    const partyId = getPartyIdFromURL();
    if (!userId || isNaN(userId)) {
      alert('Please enter a valid user ID.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/party/${partyId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ user_id: parseInt(userId) })
      });

      if (res.ok) {
        alert('Invite sent!');
        modal.style.display = 'none';
      } else {
        const err = await res.json();
        alert('Invite failed: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Invite failed');
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  fetchPartyData();
  setupInviteModal();
});

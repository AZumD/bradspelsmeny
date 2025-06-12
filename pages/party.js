// party.js
const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

function getAccessToken() {
  return localStorage.getItem('userToken');
}

async function fetchPartyData() {
  const params = new URLSearchParams(window.location.search);
  const partyId = params.get('id');
  if (!partyId) return;

  try {
    const res = await fetch(`${API_BASE}/party/${partyId}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
    const data = await res.json();

    if (!data.name) throw new Error('Party not found');

    document.getElementById('partyName').textContent = `${data.emoji} ${data.name}`;
    document.getElementById('partyMeta').textContent = `Created by ${data.creator_first_name} ${data.creator_last_name}`;
    document.getElementById('inviteCodeBox').textContent = `Invite Code: ${data.invite_code}`;

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
    const div = document.createElement('div');
    div.className = 'session-card';
    div.textContent = `${m.first_name} ${m.last_name}${m.is_leader ? ' ⭐' : ''}`;
    container.appendChild(div);
  });
}

fetchPartyData();

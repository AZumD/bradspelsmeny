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

  document.getElementById('partyName').textContent = `${data.emoji} ${data.name}`;
  //document.getElementById('partyMeta').textContent = `Created by ${data.creator_first_name} ${data.creator_last_name}`;
  document.getElementById('inviteCodeBox').textContent = `Invite Code: ${data.invite_code}`;

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

  document.getElementById('sessionList').innerHTML = '<div class="placeholder-box">No sessions yet</div>';
} catch (err) {
  console.error('Error loading party:', err);

  const nameEl = document.getElementById('partyName');
  const memberListEl = document.getElementById('memberList');
  const codeBoxEl = document.getElementById('inviteCodeBox');
  const avatarEl = document.getElementById('partyAvatar');

  console.log({ name: nameEl, members: memberListEl, code: codeBoxEl, avatar: avatarEl });

  if (nameEl) nameEl.textContent = 'Party not found';
  if (memberListEl) memberListEl.innerHTML = '<div class="placeholder-box">Could not load members</div>';
  if (codeBoxEl) codeBoxEl.textContent = '---';
  if (avatarEl) avatarEl.src = '../img/avatar-party-placeholder.webp';
}



}

function renderMemberList(members) {
  const container = document.getElementById('memberList');
  container.innerHTML = '';

  if (!members.length) {
    container.innerHTML = '<div class="placeholder-box">No members in this party</div>';
    return;
  }

  // Add member avatars
  members.forEach(m => {
    const img = document.createElement('img');
    img.src = m.avatar_url || '../img/avatar-placeholder.webp';
    img.alt = `${m.first_name}'s avatar`;
    img.title = `${m.first_name} ${m.last_name}${m.is_leader ? ' ⭐' : ''}`;
    img.className = 'friend-avatar';
    container.appendChild(img);
  });

  // Add "+" button
  const addBtn = document.createElement('div');
  addBtn.id = 'inviteToPartyBtn';
  addBtn.className = 'add-friend-circle';
  addBtn.textContent = '+';
  container.appendChild(addBtn);

  // Ensure modal behavior is hooked up
  setupInviteModal();
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

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendMessageBtn = document.getElementById("sendMessage");
const currentPartyId = getPartyIdFromURL();
async function loadMessages() {
  const res = await fetch(`${API_BASE}/party/${currentPartyId}/messages`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` }
  });
  const messages = await res.json();
  chatBox.innerHTML = '';

  messages.forEach(msg => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.marginBottom = '8px';
    wrapper.style.gap = '10px';

    const avatar = document.createElement('img');
    avatar.src = msg.avatar_url || '../img/avatar-placeholder.webp';
    avatar.alt = `${msg.username}'s avatar`;
    avatar.className = 'friend-avatar'; // already styled in your CSS
    avatar.style.width = '32px';
    avatar.style.height = '32px';

    const content = document.createElement('div');
    content.style.flex = '1';
    content.innerHTML = `
      <div style="font-size: 0.65rem; font-weight: bold; color: #a07d3b;">${msg.username}</div>
      <div style="font-size: 0.8rem;">${msg.content}</div>
    `;

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);
    chatBox.appendChild(wrapper);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}


async function sendMessage() {
  const content = chatInput.value.trim();
  if (!content) return;
  await fetch(`${API_BASE}/party/${currentPartyId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify({ content })
  });
  chatInput.value = "";
  await loadMessages();
}

sendMessageBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});


document.addEventListener('DOMContentLoaded', () => {
  fetchPartyData();
  loadMessages();
  setInterval(loadMessages, 5000); // Refresh every 5 seconds
});

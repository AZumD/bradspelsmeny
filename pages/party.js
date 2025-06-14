// party.js
const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
let loadedMessageIds = new Set();

function getAccessToken() {
  return localStorage.getItem('userToken');
}

function getPartyIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function parseGameMentions(text) {
  return text.replace(/@([\w\-]+)/g, (match, gameSlug) => {
    return `<span class="game-mention" data-game="${gameSlug}">@${gameSlug}</span>`;
  });
}

function openGameModal(modalId, game) {
  const img = document.getElementById(`${modalId}Img`);
  const title = document.getElementById(`${modalId}Title`);
  const desc = document.getElementById(`${modalId}Description`);
  const details = document.getElementById(`${modalId}Details`);
  const disclaimer = document.getElementById(`${modalId}Disclaimer`);

  const gameTitle =
    game.title || game.title_en || game.title_sv || game.name || 'Untitled';

  let imageUrl = game.img || game.thumbnail_url || `${FRONTEND_BASE}/img/default-thumb.webp`;
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = `../${imageUrl}`;
  }

  img.src = imageUrl;
  img.alt = gameTitle;
  title.textContent = gameTitle;
  desc.textContent =
    game.description || game.description_en || game.description_sv || game.desc || 'No description available.';

  // Playtime, player count
  const playtime = game.play_time ? `${game.playtime} min` : null;
  const players = game.min_players && game.max_players
    ? `Players: ${game.min_players}–${game.max_players}`
    : null;

 // const titleEn = game.title_en ? `English Title: ${game.title_en}` : null;

  details.textContent = [players, playtime].filter(Boolean).join(' · ');

  // Trusted only disclaimer
  if (game.trusted_only) {
    disclaimer.textContent = '⚠️ This game can only be borrowed by trusted members.';
  } else {
    disclaimer.textContent = '';
  }

  document.getElementById(modalId).style.display = 'flex';
}



function closeGameModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function createGameCard(game, minimal = false) {
  const card = document.createElement('div');
  card.className = 'game-entry';

  const gameTitle =
    game.title ||
    game.title_en ||
    game.title_sv ||
    game.name ||
    'Untitled';

  if (minimal) {
    // Minimal version for favorites grid
    card.style.all = 'unset';
    card.style.cursor = 'pointer';

    const img = document.createElement('img');
    let imageUrl = game.img || game.thumbnail_url;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = `../${imageUrl}`;
    }

    img.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    img.alt = gameTitle;
    img.title = gameTitle; // tooltip on hover
    img.onerror = () => {
      img.src = `${FRONTEND_BASE}/img/default-thumb.webp`;
    };

    img.style.width = '48px';
    img.style.height = '48px';
    img.style.borderRadius = '8px';
    img.style.border = '2px solid #c9a04e';
    img.style.objectFit = 'cover';
    img.style.margin = '2px';

    card.appendChild(img);
  } else {
    // Full version for wishlist
    card.style.border = 'none';
    card.style.borderRadius = '8px';
    card.style.padding = '10px';
    card.style.marginBottom = '10px';
    card.style.backgroundColor = '#f9f6f2';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.cursor = 'pointer';

    let imageUrl = game.img || game.thumbnail_url;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = `../${imageUrl}`;
    }

    const thumb = document.createElement('img');
    thumb.src = imageUrl || `${FRONTEND_BASE}/img/default-thumb.webp`;
    thumb.alt = gameTitle;
    thumb.onerror = () => {
      thumb.src = `${FRONTEND_BASE}/img/default-thumb.webp`;
    };
    thumb.style.width = '60px';
    thumb.style.height = '60px';
    thumb.style.borderRadius = '8px';
    thumb.style.border = '2px solid #c9a04e';
    thumb.style.objectFit = 'cover';

    const title = document.createElement('div');
    title.className = 'game-entry-title';
    title.textContent = gameTitle;

    card.appendChild(thumb);
    card.appendChild(title);
  }

 card.onclick = () => {
  if (minimal) {
    openGameModal('favoriteGameModal', game);
  } else {
    openGameModal('wishlistGameModal', game);
  }
};


  return card;
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

  const currentUserId = parseInt(localStorage.getItem('userId'));
  const lastSeen = localStorage.getItem(`partyLastSeen_${currentPartyId}`);
  let newDividerInserted = false;
  let lastSenderId = null;

  const isAtTop = chatBox.scrollTop <= 100;

  messages.reverse().forEach((msg, index) => {
  if (loadedMessageIds.has(msg.id)) return;
  loadedMessageIds.add(msg.id);

  const isSameSender = msg.user_id === lastSenderId;
  lastSenderId = msg.user_id;

  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', 'fade-in');
  wrapper.style.marginTop = isSameSender ? '4px' : '12px';
  wrapper.style.marginBottom = isSameSender ? '4px' : '12px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'row';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.gap = '8px';

  if (!isSameSender) {
    const leftCol = document.createElement('div');
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';
    leftCol.style.alignItems = 'center';
    leftCol.style.width = '48px';
    leftCol.style.marginRight = '10px';

    const avatar = document.createElement('img');
    avatar.src = msg.avatar_url || '../img/avatar-placeholder.webp';
    avatar.alt = `${msg.username}'s avatar`;
    avatar.className = 'friend-avatar';
    avatar.style.width = '36px';
    avatar.style.height = '36px';

    const username = document.createElement('div');
    username.textContent = msg.username;
    username.style.fontSize = '0.65rem';
    username.style.textAlign = 'center';
    username.style.marginTop = '2px';
    username.style.color = '#a07d3b';

    leftCol.appendChild(avatar);
    leftCol.appendChild(username);
    wrapper.appendChild(leftCol);
  } else {
    const spacer = document.createElement('div');
    spacer.style.width = '48px';
    spacer.style.marginRight = '10px';
    wrapper.appendChild(spacer);
  }

  const messageBubble = document.createElement('div');
  messageBubble.style.backgroundColor = index % 2 === 0 ? '#f9f6f2' : '#f3ece3';
  messageBubble.style.border = '1px dashed #d9b370';
  messageBubble.style.borderRadius = '8px';
  messageBubble.style.marginTop = '2px';
  messageBubble.style.padding = '8px 12px';
  messageBubble.style.width = '100%';
  messageBubble.style.flex = '1';
  messageBubble.style.position = 'relative';

  const content = document.createElement('div');
  content.innerHTML = parseGameMentions(msg.content);
  content.style.fontSize = '0.8rem';

  const timestamp = document.createElement('div');
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  timestamp.textContent = time;
  timestamp.style.fontSize = '0.65rem';
  timestamp.style.color = '#a07d3b';
  timestamp.style.marginTop = '4px';

  messageBubble.appendChild(content);
  messageBubble.appendChild(timestamp);

  if (new Date(msg.created_at) > new Date(lastSeen)) {
    messageBubble.classList.add('new-glow');
    if (!newDividerInserted) {
      const divider = document.createElement('div');
      divider.textContent = '── New Messages ──';
      divider.style.textAlign = 'center';
      divider.style.fontSize = '0.7rem';
      divider.style.color = '#a07d3b';
      divider.style.margin = '8px 0';
      divider.style.position = 'sticky';
      divider.style.top = '0';
      divider.style.background = '#fffdf7';
      divider.style.zIndex = '1';

      chatBox.prepend(divider);
      newDividerInserted = true;
    }
  }

  if (msg.user_id === currentUserId) {
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = '❌';
    deleteBtn.title = 'Delete message';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '4px';
    deleteBtn.style.right = '8px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.fontSize = '0.8rem';
    deleteBtn.onclick = async () => {
      const confirmed = confirm('Delete this message?');
      if (confirmed) {
        await fetch(`${API_BASE}/party/${currentPartyId}/messages/${msg.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getAccessToken()}`
          }
        });
        loadedMessageIds.clear();
        chatBox.innerHTML = '';
        loadMessages();
      }
    };
    messageBubble.appendChild(deleteBtn);
  }

  wrapper.appendChild(messageBubble);
  chatBox.prepend(wrapper);
});



  if (isAtTop) {
    chatBox.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (messages.length > 0) {
    const newestTimestamp = messages[0].created_at;
    localStorage.setItem(`partyLastSeen_${currentPartyId}`, newestTimestamp);
    window.latestMessageTimestamp = newestTimestamp;
  }

  // Game mention handlers
  document.querySelectorAll('.game-mention').forEach(el => {
    el.addEventListener('click', async () => {
      const slug = el.dataset.game;
      try {
        const res = await fetch(`${API_BASE}/games/slug/${slug}`);
        if (!res.ok) throw new Error('Game not found');
        const game = await res.json();
        let imageUrl = game.img || game.thumbnail_url || `${FRONTEND_BASE}/img/default-thumb.webp`;
if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
  imageUrl = `../${imageUrl}`;
}
        openGameModal('favoriteGameModal', game);

      } catch (err) {
        alert("Couldn't load game info for @" + slug);
        console.error(err);
      }
    });
  });
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
});

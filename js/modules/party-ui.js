const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

export function updatePartyUI(data) {
  document.getElementById('partyName').textContent = `${data.emoji} ${data.name}`;
  document.getElementById('inviteCodeBox').textContent = `${data.invite_code}`;

  const avatar = document.getElementById('partyAvatar');
  if (avatar) {
    avatar.src = data.avatar || '../img/avatar-party-placeholder.webp';
  }
}

export function renderMemberList(members) {
  const memberList = document.getElementById('memberList');
  memberList.innerHTML = '';

  members.forEach(member => {
    const memberEl = document.createElement('div');
    memberEl.className = 'member-entry';
    memberEl.style.display = 'flex';
    memberEl.style.alignItems = 'center';
    memberEl.style.gap = '8px';
    memberEl.style.padding = '8px';
    memberEl.style.borderRadius = '8px';
    memberEl.style.backgroundColor = '#f9f6f2';

    const avatar = document.createElement('img');
    avatar.src = member.avatar || '../img/avatar-placeholder.webp';
    avatar.alt = `${member.first_name} ${member.last_name}`;
    avatar.style.width = '32px';
    avatar.style.height = '32px';
    avatar.style.borderRadius = '50%';
    avatar.style.border = '2px solid #c9a04e';

    const name = document.createElement('span');
    name.textContent = `${member.first_name} ${member.last_name}`;
    name.style.fontSize = '0.9rem';
    name.style.color = '#3c2415';

    memberEl.appendChild(avatar);
    memberEl.appendChild(name);
    memberList.appendChild(memberEl);
  });
}

export function openGameModal(modalId, game) {
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
  const playtime = game.play_time ? `${game.play_time} min` : null;
  const players = game.min_players && game.max_players
    ? `Players: ${game.min_players}–${game.max_players}`
    : null;

  const titleEn = game.title_en ? `English Title: ${game.title_en}` : null;

  details.textContent = [players, playtime].filter(Boolean).join(' · ');

  // Trusted only disclaimer
  if (game.trusted_only) {
    disclaimer.textContent = '⚠️ This game can only be borrowed by trusted members.';
  } else {
    disclaimer.textContent = '';
  }

  document.getElementById(modalId).style.display = 'flex';
}

export function closeGameModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

export function createGameCard(game, minimal = false) {
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

  return card;
} 
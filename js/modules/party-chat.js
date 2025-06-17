let loadedMessageIds = new Set();
let allGames = [];

export function setAllGames(games) {
  allGames = games;
}

export function parseGameMentions(text) {
  if (!allGames.length) return text;

  const titles = allGames
    .map(g => g.title_en)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length); // longest titles first

  for (const title of titles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex characters
    const regex = new RegExp(`@${escaped}\\b`, 'gi');
    text = text.replace(regex, match => {
      return `<span class="game-mention" data-title-en="${title}">${title}</span>`;
    });
  }

  return text;
}

export function renderMessage(message) {
  if (loadedMessageIds.has(message.id)) return;
  loadedMessageIds.add(message.id);

  console.log('Rendering message:', message);

  const chatBox = document.getElementById('chatBox');
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message';
  messageEl.style.opacity = '0';
  messageEl.style.transform = 'translateY(10px)';
  messageEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const header = document.createElement('div');
  header.className = 'message-header';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '8px';
  header.style.marginBottom = '4px';

  const user = message.user || {};
  const firstName = user.first_name || 'Unknown';
  const lastName = user.last_name || 'User';
  const avatar = user.avatar || '../img/avatar-placeholder.webp';

  const avatarEl = document.createElement('img');
  avatarEl.src = avatar;
  avatarEl.alt = `${firstName} ${lastName}`;
  avatarEl.style.width = '24px';
  avatarEl.style.height = '24px';
  avatarEl.style.borderRadius = '50%';
  avatarEl.style.border = '2px solid #c9a04e';

  const name = document.createElement('span');
  name.textContent = `${firstName} ${lastName}`;
  name.style.fontWeight = 'bold';
  name.style.color = '#3c2415';

  const timeEl = document.createElement('span');
  timeEl.textContent = time;
  timeEl.style.fontSize = '0.8rem';
  timeEl.style.color = '#666';

  header.appendChild(avatarEl);
  header.appendChild(name);
  header.appendChild(timeEl);

  const content = document.createElement('div');
  content.className = 'message-content';
  content.style.backgroundColor = '#f9f6f2';
  content.style.padding = '8px 12px';
  content.style.borderRadius = '8px';
  content.style.marginBottom = '8px';
  content.innerHTML = parseGameMentions(message.text);

  messageEl.appendChild(header);
  messageEl.appendChild(content);
  chatBox.appendChild(messageEl);

  // Trigger animation
  requestAnimationFrame(() => {
    messageEl.style.opacity = '1';
    messageEl.style.transform = 'translateY(0)';
  });

  // Scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}

export function clearChat() {
  const chatBox = document.getElementById('chatBox');
  chatBox.innerHTML = '';
  loadedMessageIds.clear();
}

export function scrollToBottom() {
  const chatBox = document.getElementById('chatBox');
  chatBox.scrollTop = chatBox.scrollHeight;
} 
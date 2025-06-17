import { sendMessage, inviteUser } from './party-api.js';
import { closeGameModal } from './party-ui.js';
import { scrollToBottom } from './party-chat.js';

export function setupMessageInput(partyId) {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  messageInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSendMessage(partyId);
    }
  });

  sendButton.addEventListener('click', async () => {
    await handleSendMessage(partyId);
  });
}

async function handleSendMessage(partyId) {
  const messageInput = document.getElementById('messageInput');
  const text = messageInput.value.trim();
  
  if (!text) return;

  try {
    await sendMessage(partyId, text);
    messageInput.value = '';
    scrollToBottom();
  } catch (err) {
    console.error('Error sending message:', err);
  }
}

export function setupInviteModal(partyId) {
  const inviteModal = document.getElementById('inviteModal');
  const inviteButton = document.getElementById('inviteButton');
  const closeInviteModal = document.getElementById('closeInviteModal');
  const inviteForm = document.getElementById('inviteForm');

  inviteButton.addEventListener('click', () => {
    inviteModal.style.display = 'flex';
  });

  closeInviteModal.addEventListener('click', () => {
    inviteModal.style.display = 'none';
  });

  inviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('inviteUserId').value;
    
    try {
      await inviteUser(partyId, userId);
      inviteModal.style.display = 'none';
      inviteForm.reset();
    } catch (err) {
      console.error('Error inviting user:', err);
    }
  });
}

export function setupGameModals() {
  // Close buttons for game modals
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.closest('.modal').id;
      closeGameModal(modalId);
    });
  });

  // Click outside to close
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeGameModal(e.target.id);
    }
  });
}

export function setupAutocomplete() {
  const messageInput = document.getElementById('messageInput');
  const autocompleteBox = document.getElementById('autocompleteBox');
  let selectedIndex = -1;

  messageInput.addEventListener('input', () => {
    const text = messageInput.value;
    const lastWord = text.split(' ').pop();
    
    if (lastWord.startsWith('@')) {
      const search = lastWord.slice(1).toLowerCase();
      const matches = allGames
        .filter(g => g.title_en?.toLowerCase().includes(search))
        .slice(0, 5);
      
      if (matches.length) {
        autocompleteBox.innerHTML = '';
        matches.forEach((game, i) => {
          const div = document.createElement('div');
          div.textContent = game.title_en;
          div.className = 'autocomplete-item';
          div.onclick = () => insertAutocomplete(i);
          autocompleteBox.appendChild(div);
        });
        autocompleteBox.style.display = 'block';
        selectedIndex = -1;
      } else {
        autocompleteBox.style.display = 'none';
      }
    } else {
      autocompleteBox.style.display = 'none';
    }
  });

  messageInput.addEventListener('keydown', (e) => {
    if (autocompleteBox.style.display === 'none') return;

    const items = autocompleteBox.children;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelectedIndex();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelectedIndex();
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          insertAutocomplete(selectedIndex);
        }
        break;
      case 'Escape':
        autocompleteBox.style.display = 'none';
        break;
    }
  });
}

function updateSelectedIndex() {
  const items = autocompleteBox.children;
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle('selected', i === selectedIndex);
  }
}

function insertAutocomplete(index) {
  const messageInput = document.getElementById('messageInput');
  const items = autocompleteBox.children;
  const selected = items[index].textContent;
  
  const text = messageInput.value;
  const lastWord = text.split(' ').pop();
  const newText = text.slice(0, -lastWord.length) + `@${selected} `;
  
  messageInput.value = newText;
  autocompleteBox.style.display = 'none';
  messageInput.focus();
} 
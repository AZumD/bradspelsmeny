import {
  getAccessToken,
  getRefreshToken,
  getUserIdFromToken,
  refreshToken,
  fetchWithAuth,
  clearTokens,
  logout
} from '../js/modules/auth.js';
import { 
  fetchAllGames,
  getGameById,
  lendGame,
  returnGame
} from '../js/modules/api.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const availableContainer = document.getElementById('availableGames');
const lentOutContainer = document.getElementById('lentOutGames');
const addUserButton = document.getElementById('addUserButton');
const newUserModal = document.getElementById('newUserModal');
const newUserForm = document.getElementById('newUserForm');

// Modal elements
const imageModal = document.getElementById('imageModal');
const historyModal = document.getElementById('historyModal');
const lendModal = document.getElementById('lendModal');
const modalImage = document.getElementById('modalImage');
const historyList = document.getElementById('historyList');
const userSelect = document.getElementById('userSelect');
const tableStep = document.getElementById('tableStep');
const lendGameId = document.getElementById('lendGameId');
const tableNumber = document.getElementById('tableNumber');

// Close button elements
const closeImageModalBtn = document.getElementById('closeImageModalBtn');
const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
const closeLendModalBtn = document.getElementById('closeLendModalBtn');
const closeNewUserModalBtn = document.getElementById('closeNewUserModalBtn');
const confirmLendBtn = document.getElementById('confirmLendBtn');

let allGames = [];

async function guardAdminSession() {
  const token = getAccessToken();
  const storedRefreshToken = getRefreshToken();

  if (!token && !storedRefreshToken) {
    window.location.href = "login.html";
    return false;
  }

  if (!token && storedRefreshToken) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      window.location.href = "login.html";
      return false;
    }
  }

  return true;
}

function getUserIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

// Modal functions
function showModal(modal) {
  modal.classList.add('show');
}

function hideModal(modal) {
  modal.classList.remove('show');
}

function openImageModal(imgUrl) {
  modalImage.src = `${API_BASE}${imgUrl}`;
  showModal(imageModal);
}

function closeImageModal() {
  hideModal(imageModal);
}

async function openHistoryModal(gameId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/history/${gameId}`);
    const logs = await res.json();

    historyList.innerHTML = logs.map(log =>
      `<li><b>${log.action.toUpperCase()}</b> – ${log.first_name || 'Unknown'} ${log.last_name || ''} @ ${log.timestamp} <i>${log.note || ''}</i></li>`
    ).join('');

    showModal(historyModal);
  } catch (err) {
    console.error('Failed to load history:', err);
    alert('❌ Failed to load game history.');
  }
}

function closeHistoryModal() {
  hideModal(historyModal);
}

async function openLendModal(gameId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users`);
    const users = await res.json();

    if (!Array.isArray(users)) {
      alert('❌ Failed to load users.');
      window.location.href = 'login.html';
      return;
    }

    userSelect.innerHTML = '<option value="">-- Select User --</option>' +
      users.map(u => `<option value="${u.id}">${u.last_name}, ${u.first_name}, ${u.phone || 'No phone'}</option>`).join('');

    lendGameId.value = gameId;
    tableNumber.value = '';
    tableStep.style.display = 'none';
    showModal(lendModal);
  } catch (err) {
    console.error('Failed to load users:', err);
    alert('❌ Failed to load users.');
  }
}

function closeLendModal() {
  hideModal(lendModal);
}

function closeNewUserModal() {
  hideModal(newUserModal);
}

// Collapsible section functions
function toggleSection(id, button) {
  const section = document.getElementById(id);
  const caret = button.querySelector('.caret');
  const isOpen = section.style.display === 'flex';

  section.style.display = isOpen ? 'none' : 'flex';
  caret.textContent = isOpen ? '▼' : '▲';
}

// Game functions
async function fetchGames() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/games`);
    if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`);
    allGames = await res.json();
    await renderGameLists();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch games.");
  }
}

async function renderGameLists() {
  const searchTerm = searchInput.value.toLowerCase();
  const available = allGames.filter(g => !g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm));
  const lentOut = allGames.filter(g => g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm));

  availableContainer.innerHTML = '<p>Laddar spel...</p>';
  lentOutContainer.innerHTML = '<p>Laddar spel...</p>';

  const availableCards = await Promise.all(available.map(createGameCard));
  const lentOutCards = await Promise.all(lentOut.map(createGameCard));

  availableContainer.innerHTML = '';
  lentOutContainer.innerHTML = '';

  for (const card of availableCards) availableContainer.appendChild(card);
  for (const card of lentOutCards) lentOutContainer.appendChild(card);
}

async function createGameCard(game) {
  const card = document.createElement('div');
  let extra = '';

  if (game.lent_out) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/games/${game.id}/current-lend`);
      if (res.ok) {
        const data = await res.json();
        extra = `<br><small style="font-size: 0.5rem;">
          Lånad ut till ${data.first_name || 'Okänd'} ${data.last_name || ''} (${data.note || 'okänt bord'}) – ${new Date(data.timestamp).toLocaleString('sv-SE')}
        </small>`;
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch current lending info:', err);
    }
  }

  card.className = 'section-title';
  card.innerHTML = `
    <h3>${game.title_sv}${extra}</h3>
    <div class="buttons">
      <button class="btn-action" data-action="${game.lent_out ? 'return' : 'lend'}" data-game-id="${game.id}">
        ${game.lent_out ? 'Return' : 'Lend Out'}
      </button>
      <button class="btn-image" data-image="${game.img}">🖼️</button>
      <button class="btn-history" data-game-id="${game.id}">📜</button>
    </div>
  `;

  // Add event listeners to the buttons
  const actionBtn = card.querySelector('.btn-action');
  const imageBtn = card.querySelector('.btn-image');
  const historyBtn = card.querySelector('.btn-history');

  actionBtn.addEventListener('click', async () => {
    const gameId = parseInt(actionBtn.dataset.gameId);
    if (actionBtn.dataset.action === 'return') {
      await handleReturn(gameId);
    } else {
      await openLendModal(gameId);
    }
  });

  imageBtn.addEventListener('click', () => {
    openImageModal(imageBtn.dataset.image);
  });

  historyBtn.addEventListener('click', async () => {
    const gameId = parseInt(historyBtn.dataset.gameId);
    await openHistoryModal(gameId);
  });

  return card;
}

async function handleReturn(gameId) {
  try {
    await fetchWithAuth(`${API_BASE}/return/${gameId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    await fetchGames();
  } catch (err) {
    console.error('Failed to return game:', err);
    alert('❌ Failed to return game.');
  }
}

async function confirmLend() {
  const gameId = lendGameId.value;
  const userId = userSelect.value;
  const tableNum = tableNumber.value.trim();

  if (!userId || !tableNum) {
    alert("Please select a user and enter a table number.");
    return;
  }

  try {
    await fetchWithAuth(`${API_BASE}/lend/${gameId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, note: `Table ${tableNum}` })
    });

    closeLendModal();
    await fetchGames();
  } catch (err) {
    console.error('Failed to lend game:', err);
    alert('❌ Failed to lend game.');
  }
}

// Event Listeners
function bindEventListeners() {
  // Search input
  searchInput.addEventListener('input', renderGameLists);

  // Collapsible sections
  document.querySelectorAll('.collapsible-header').forEach(button => {
    button.addEventListener('click', () => {
      const sectionId = button.dataset.section;
      toggleSection(sectionId, button);
    });
  });

  // Modal close buttons
  closeImageModalBtn.addEventListener('click', closeImageModal);
  closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
  closeLendModalBtn.addEventListener('click', closeLendModal);
  closeNewUserModalBtn.addEventListener('click', closeNewUserModal);

  // Confirm lend button
  confirmLendBtn.addEventListener('click', confirmLend);

  // Add user button
  addUserButton.addEventListener('click', () => {
    showModal(newUserModal);
  });

  // New user form
  newUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('newFirstName').value;
    const lastName = document.getElementById('newLastName').value;
    const phone = document.getElementById('newPhone').value;

    try {
      const res = await fetchWithAuth(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone })
      });

      const data = await res.json();
      const newUserId = data.user?.id;
      closeNewUserModal();

      if (newUserId) {
        userSelect.innerHTML += `<option value="${newUserId}" selected>${lastName}, ${firstName}, ${phone || 'No phone'}</option>`;
        userSelect.value = newUserId;
        tableStep.style.display = 'block';
      } else {
        alert('❌ Failed to create user.');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('❌ Failed to create user.');
    }
  });

  // User select change
  userSelect.addEventListener('change', () => {
    tableStep.style.display = userSelect.value ? 'block' : 'none';
  });

  // Close modals when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal);
      }
    });
  });
}

// Initialize
async function init() {
  if (await guardAdminSession()) {
    bindEventListeners();
    await fetchGames();
    
    // Set initial state
    document.getElementById('availableGames').style.display = 'flex';
    document.getElementById('lentOutGames').style.display = 'flex';
    
    // Set caret to open (▲) on load
    document.querySelectorAll('.collapsible-header .caret').forEach(c => c.textContent = '▲');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}



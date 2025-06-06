const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const TOKEN = localStorage.getItem("adminToken");

if (!TOKEN) {
  window.location.href = "login.html";
}

const searchInput = document.getElementById('searchInput');
const availableContainer = document.getElementById('availableGames');
const lentOutContainer = document.getElementById('lentOutGames');
const addUserButton = document.getElementById('addUserButton');
const newUserModal = document.getElementById('newUserModal');
const newUserForm = document.getElementById('newUserForm');

let allGames = [];

async function fetchGames() {
  const res = await fetch(`${API_BASE}/games`);
  const games = await res.json();
  allGames = games;
  await renderGameLists();

}

async function renderGameLists() {
  const searchTerm = searchInput.value.toLowerCase();
  const available = allGames.filter(g => !g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm));
  const lentOut = allGames.filter(g => g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm));

  availableContainer.innerHTML = '';
  lentOutContainer.innerHTML = '';

  for (const g of available) {
    const card = await createGameCard(g);
    availableContainer.appendChild(card);
  }

  for (const g of lentOut) {
    const card = await createGameCard(g);
    lentOutContainer.appendChild(card);
  }
}


async function createGameCard(game) {
  const card = document.createElement('div');
  let extra = '';

  if (game.lent_out) {
    try {
      const res = await fetch(`${API_BASE}/games/${game.id}/current-lend`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      const data = await res.json();
      extra = `<br><small style="font-size: 0.5rem;">
        Lånad ut till ${data.first_name || 'Okänd'} ${data.last_name || ''} (${data.note || 'okänt bord'}) – ${new Date(data.timestamp).toLocaleString('sv-SE')}
      </small>`;
    } catch (err) {
      console.warn('⚠️ Could not fetch current lending info:', err);
    }
  }

  card.className = 'game-card';
  card.innerHTML = `
    <h3>${game.title_sv}${extra}</h3>
    <div class="buttons">
      <button class="btn-action" onclick="${game.lent_out ? `returnGame(${game.id})` : `openLendModal(${game.id})`}">
        ${game.lent_out ? 'Return' : 'Lend Out'}
      </button>
      <button onclick="openImageModal('${game.img}')">🖼️</button>
      <button onclick="openHistoryModal(${game.id})">📜</button>
    </div>
  `;
  return card;
}

async function openLendModal(gameId) {
  const res = await fetch(`${API_BASE}/users`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });

  const users = await res.json();

  if (!Array.isArray(users)) {
    alert('❌ Failed to load users. You might be logged out.');
    window.location.href = 'login.html';
    return;
  }

  const modal = document.getElementById('lendModal');
  const userSelect = document.getElementById('userSelect');
  const tableStep = document.getElementById('tableStep');

  userSelect.innerHTML = '<option value="">-- Select User --</option>' +
    users.map(u => `<option value="${u.id}">${u.last_name}, ${u.first_name}, ${u.phone || 'No phone'}</option>`).join('');

  document.getElementById('lendGameId').value = gameId;
  document.getElementById('tableNumber').value = '';
  tableStep.style.display = 'none';
  modal.style.display = 'block';

  userSelect.addEventListener('change', () => {
    tableStep.style.display = userSelect.value ? 'block' : 'none';
  });
}


function closeLendModal() {
  document.getElementById('lendModal').style.display = 'none';
}

async function confirmLend() {
  const gameId = document.getElementById('lendGameId').value;
  const userId = document.getElementById('userSelect').value;
  const tableNumber = document.getElementById('tableNumber').value.trim();

  if (!userId || !tableNumber) {
    alert("Please select a user and enter a table number.");
    return;
  }

  await fetch(`${API_BASE}/lend/${gameId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    },
    body: JSON.stringify({ userId, note: `Table ${tableNumber}` })
  });

  closeLendModal();
  fetchGames();
}

async function returnGame(gameId) {
  await fetch(`${API_BASE}/return/${gameId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    },
    body: JSON.stringify({})
  });

  fetchGames();
}

function openImageModal(imgUrl) {
  const modal = document.getElementById('imageModal');
  document.getElementById('modalImage').src = `${API_BASE}${imgUrl}`;
  modal.style.display = 'block';
}

function closeImageModal() {
  document.getElementById('imageModal').style.display = 'none';
}

async function openHistoryModal(gameId) {
  const modal = document.getElementById('historyModal');
  const historyList = document.getElementById('historyList');
  const res = await fetch(`${API_BASE}/history/${gameId}`);
  const logs = await res.json();

  historyList.innerHTML = logs.map(log =>
    `<li><b>${log.action.toUpperCase()}</b> – ${log.first_name || 'Unknown'} ${log.last_name || ''} @ ${log.timestamp} <i>${log.note || ''}</i></li>`
  ).join('');

  modal.style.display = 'block';
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

if (addUserButton) {
  addUserButton.addEventListener('click', () => {
    newUserModal.style.display = 'block';
  });
}

if (newUserForm) {
  newUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('newFirstName').value;
    const lastName = document.getElementById('newLastName').value;
    const phone = document.getElementById('newPhone').value;

    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, phone })
    });

    const data = await res.json();
    const newUserId = data.user?.id;
    newUserModal.style.display = 'none';

    if (newUserId) {
      const userSelect = document.getElementById('userSelect');
      const tableStep = document.getElementById('tableStep');

      userSelect.innerHTML += `<option value="${newUserId}" selected>${lastName}, ${firstName}, ${phone || 'No phone'}</option>`;
      userSelect.value = newUserId;
      tableStep.style.display = 'block';
    } else {
      alert('❌ Failed to create user.');
    }
  });
}

function closeNewUserModal() {
  newUserModal.style.display = 'none';
}

searchInput.addEventListener('input', renderGameLists);
window.onload = fetchGames;

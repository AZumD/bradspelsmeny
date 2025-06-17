import { API_ENDPOINTS } from './config.js';

let allGames = [];

export function getGames() {
    return allGames;
}

export async function fetchGames(token) {
  try {
    const res = await fetch(API_ENDPOINTS.GAMES, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`);
    allGames = await res.json();
    return allGames;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch games.");
  }
}

export async function saveGame(gameData) {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token');

    const url = gameData.id 
        ? `${API_ENDPOINTS}/games/${gameData.id}`
        : `${API_ENDPOINTS}/games`;

    const res = await fetch(url, {
        method: gameData.id ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
    });

    if (!res.ok) {
        throw new Error('Failed to save game');
    }

    return res.json();
}

export async function deleteGame(gameId) {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${API_ENDPOINTS}/games/${gameId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error('Failed to delete game');
    }
}

export async function renderGameLists(searchTerm, availableContainer, lentOutContainer, token) {
  const filteredAvailable = allGames.filter(g => !g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLentOut = allGames.filter(g => g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm.toLowerCase()));

  availableContainer.innerHTML = '<p>Laddar spel...</p>';
  lentOutContainer.innerHTML = '<p>Laddar spel...</p>';

  const availableCards = await Promise.all(filteredAvailable.map(game => createGameCard(game, token)));
  const lentOutCards = await Promise.all(filteredLentOut.map(game => createGameCard(game, token)));

  availableContainer.innerHTML = '';
  lentOutContainer.innerHTML = '';

  for (const card of availableCards) availableContainer.appendChild(card);
  for (const card of lentOutCards) lentOutContainer.appendChild(card);
}

async function createGameCard(game, token) {
  const card = document.createElement('div');
  let extra = '';

  if (game.lent_out) {
    try {
      const res = await fetch(`${API_ENDPOINTS}/games/${game.id}/current-lend`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        ${game.lent_out ? '↩️ Återlämna' : '🎲 Låna ut'}
      </button>
      <div class="utility-buttons">
        <button data-action="image" data-image="${game.img}" title="Visa bild">🖼️</button>
        <button data-action="history" data-game-id="${game.id}" title="Visa historik">📜</button>
      </div>
    </div>
  `;
  return card;
}

export async function returnGame(gameId, token) {
  const res = await fetch(`${API_ENDPOINTS}/return/${gameId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
  
  if (!res.ok) {
    throw new Error('Failed to return game');
  }
  
  return res.json();
}

export function toggleSection(section) {
  const header = section.querySelector('.game-header');
  const content = section.querySelector('.game-content');
  const caret = header.querySelector('.caret');
  const isOpen = content.style.display === 'flex';

  content.style.display = isOpen ? 'none' : 'flex';
  caret.textContent = isOpen ? '▼' : '▲';
} 
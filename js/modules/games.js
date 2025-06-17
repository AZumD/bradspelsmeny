import { API_ENDPOINTS } from './config.js';

let allGames = [];

export function getGames() {
    return allGames;
}

export async function fetchGames() {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token');

    const res = await fetch(API_ENDPOINTS.GAMES, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`);
    allGames = await res.json();
    return allGames;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch games.");
  }
}

export async function updateGame(id, gameData) {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${API_ENDPOINTS.GAMES}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
    });

    if (!res.ok) {
        throw new Error('Failed to update game');
    }

    return res.json();
}

export async function saveGame(gameData) {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token');

    const url = gameData.id 
        ? `${API_ENDPOINTS.GAMES}/${gameData.id}`
        : API_ENDPOINTS.GAMES;

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

    const res = await fetch(`${API_ENDPOINTS.GAMES}/${gameId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error('Failed to delete game');
    }
}

export async function renderGameLists(searchTerm, availableContainer, lentOutContainer) {
  if (!availableContainer || !lentOutContainer) {
    console.error('Container elements not found');
    return;
  }

  const filteredAvailable = allGames.filter(g => !g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLentOut = allGames.filter(g => g.lent_out && (g.title_sv || '').toLowerCase().includes(searchTerm.toLowerCase()));

  availableContainer.innerHTML = '<p>Laddar spel...</p>';
  lentOutContainer.innerHTML = '<p>Laddar spel...</p>';

  try {
    const availableCards = await Promise.all(filteredAvailable.map(game => createGameCard(game)));
    const lentOutCards = await Promise.all(filteredLentOut.map(game => createGameCard(game)));

    availableContainer.innerHTML = '';
    lentOutContainer.innerHTML = '';

    for (const card of availableCards) availableContainer.appendChild(card);
    for (const card of lentOutCards) lentOutContainer.appendChild(card);
  } catch (err) {
    console.error('Error rendering game lists:', err);
    availableContainer.innerHTML = '<p>Ett fel uppstod när spelen skulle laddas.</p>';
    lentOutContainer.innerHTML = '<p>Ett fel uppstod när spelen skulle laddas.</p>';
  }
}

async function createGameCard(game) {
  const card = document.createElement('div');
  let extra = '';

  if (game.lent_out) {
    extra = `<br><small style="font-size: 0.5rem;">
      Lånad ut till ${game.lent_to_name || 'Okänd'} (${game.lent_to_table || 'okänt bord'}) – ${new Date(game.lent_at).toLocaleString('sv-SE')}
    </small>`;
  }

  card.className = 'section-title';
  card.innerHTML = `
    <h3>${game.title_sv}${extra}</h3>
    <div class="buttons">
      <button class="btn-action" data-action="${game.lent_out ? 'return' : 'lend'}" data-game-id="${game.id}">
        ${game.lent_out ? '↩️ Återlämna' : '🎲 Låna ut'}
      </button>
      <div class="utility-buttons">
        <button data-action="history" data-game-id="${game.id}" title="Visa historik">📜</button>
      </div>
    </div>
  `;
  return card;
}

export async function returnGame(gameId) {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token');

    const res = await fetch(`${API_ENDPOINTS.GAMES}/return/${gameId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      throw new Error('Failed to return game');
    }
    
    // Refresh the games list
    await fetchGames();
    return res.json();
  } catch (err) {
    console.error('Error returning game:', err);
    throw new Error('Failed to return game. Please try again.');
  }
}

export function toggleSection(section) {
  if (!section) return;
  
  const header = section.querySelector('.game-header');
  const content = section.querySelector('.game-content');
  const caret = header?.querySelector('.caret');
  
  if (!header || !content || !caret) return;

  const isOpen = content.style.display === 'flex';
  content.style.display = isOpen ? 'none' : 'flex';
  caret.textContent = isOpen ? '▼' : '▲';
} 
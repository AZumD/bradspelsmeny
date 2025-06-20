import { 
    getAccessToken,
    getUserIdFromToken,
    getUserRole,
    fetchWithAuth
} from '../js/modules/auth.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

let currentSession = null;
let sessionPlayers = [];
let currentUserId = null;

function getSessionIdFromURL() {
    return new URLSearchParams(window.location.search).get('id');
}

async function loadSessionData() {
    const sessionId = getSessionIdFromURL();
    if (!sessionId) {
        document.body.innerHTML = "<p style='padding:2rem;'>❌ This session doesn't exist or you don't have access.</p>";
        return;
    }

    try {
        // Load session details
        const sessionRes = await fetchWithAuth(`${API_BASE}/party-sessions/${sessionId}`);
        if (!sessionRes.ok) {
            document.body.innerHTML = "<p style='padding:2rem;'>❌ This session doesn't exist or you don't have access.</p>";
            return;
        }
        currentSession = await sessionRes.json();

        // Update UI with game info
        const thumb = document.getElementById('gameThumbnail');
        thumb.src = currentSession.img?.includes("http")
            ? currentSession.img
            : `../${currentSession.img || "img/default-thumb.webp"}`;
        thumb.alt = currentSession.game_title || 'Game thumbnail';
        thumb.onerror = () => { thumb.src = '../img/default-thumb.webp'; };

        const titleEl = document.getElementById('gameTitle');
        titleEl.textContent = currentSession.game_title || 'Untitled Game';
        titleEl.style.overflow = 'hidden';
        titleEl.style.textOverflow = 'ellipsis';
        titleEl.style.whiteSpace = 'nowrap';
        titleEl.style.maxWidth = '100%';

        // Load and render rounds, which also gives us the players
        await loadSessionRounds();

        // Authorize the "Add Round" button
        const currentUserId = getUserIdFromToken();
        const currentUserRole = getUserRole();
        const isParticipant = sessionPlayers.some(p => p.id === currentUserId) || currentUserRole === 'admin';

        if (isParticipant) {
            document.getElementById('addRoundBtn').style.display = "inline-block";
        }

        console.log("✨ Session view loaded successfully with game:", currentSession.game_title);
    } catch (err) {
        console.error('Failed to load session:', err);
        document.body.innerHTML = "<p style='padding:2rem;'>❌ This session doesn't exist or you don't have access.</p>";
    }
}

async function loadSessionRounds() {
    const sessionId = getSessionIdFromURL();
    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/rounds/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load rounds');
        
        const data = await res.json();
        const { rounds, members } = data;

        // Update global sessionPlayers variable and create a lookup map
        sessionPlayers = members || [];
        const memberMap = new Map(sessionPlayers.map(m => [m.id, m]));

        const roundsContainer = document.getElementById('roundsList');
        roundsContainer.innerHTML = '';

        // Render player list
        const playerListContainer = document.getElementById('playerList');
        playerListContainer.innerHTML = '';
        if (sessionPlayers.length > 0) {
            sessionPlayers.forEach((player, index) => {
                const playerAvatar = document.createElement('div');
                playerAvatar.className = 'friend-avatar fade-in';
                playerAvatar.title = `${player.first_name} ${player.last_name.charAt(0)}.`;
                playerAvatar.style.animationDelay = `${index * 50}ms`;

                const img = document.createElement('img');
                img.src = player.avatar_url || player.avatar || '../img/avatar-placeholder.webp';
                img.className = 'avatar';
                
                playerAvatar.appendChild(img);
                playerListContainer.appendChild(playerAvatar);
            });
        } else {
            playerListContainer.innerHTML = '<div class="placeholder-box">No players found in this session.</div>';
        }

        // Add the "Add Player" button
        const addPlayerButton = document.createElement('div');
        addPlayerButton.className = 'add-friend-circle';
        addPlayerButton.title = 'Add non-party member';
        addPlayerButton.innerHTML = '+';
        addPlayerButton.onclick = () => {
            document.getElementById('addPlayerModal').style.display = 'flex';
        };
        playerListContainer.appendChild(addPlayerButton);

        if (!rounds || !rounds.length) {
            roundsContainer.innerHTML = '<div class="placeholder-box">No rounds played yet</div>';
            return;
        }

        rounds.forEach((round, index) => {
            const card = document.createElement('div');
            card.className = 'session-card fade-in';
            card.style.fontFamily = "'VT323', monospace";
            card.style.padding = '12px';
            card.style.marginBottom = '8px';
            card.style.backgroundColor = '#f9f6f2';
            card.style.borderRadius = '8px';
            card.style.border = '1px dashed #d9b370';
            card.style.opacity = '0';
            card.style.animation = `fadeIn 0.3s ease-in forwards ${index * 0.1}s`;

            const winnerNames = round.winners && round.winners.length
                ? round.winners.map(w => `${w.first_name} ${w.last_name}`).join(', ')
                : 'No winners';

            const loserNames = round.losers && round.losers.length
                ? round.losers.map(l => `${l.first_name} ${l.last_name}`).join(', ')
                : '';

            const text = `🎲 Round ${round.round_number} — Winner: ${winnerNames}`;
            const p = document.createElement("p");
            p.textContent = text;
            card.appendChild(p);

            let titleText = '';
            if (loserNames) {
                titleText += `Losers: ${loserNames}`;
            }
            if (round.notes) {
                if (titleText) titleText += ' | ';
                titleText += `Notes: ${round.notes}`;
            }
            if (titleText) {
                card.title = titleText;
            }

            roundsContainer.appendChild(card);
        });

        // Add keyframe animation if not already present
        if (!document.querySelector('#fadeInKeyframes')) {
            const style = document.createElement('style');
            style.id = 'fadeInKeyframes';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

    } catch (err) {
        console.error('Failed to load rounds:', err);
        document.getElementById('roundsList').innerHTML = 
            '<div class="placeholder-box">Could not load rounds</div>';
    }
}

function toggleStatus(el) {
    const current = el.dataset.status;
    const next = current === 'none' ? 'winner' : current === 'winner' ? 'loser' : 'none';
    el.dataset.status = next;
  
    const statusIcon = el.querySelector('.status-icon');
    if (next === 'winner') {
        statusIcon.textContent = '👑';
        el.style.borderColor = '#d4af37';
    } else if (next === 'loser') {
        statusIcon.textContent = '🗑️';
        el.style.borderColor = '#c0c0c0';
    } else {
        statusIcon.textContent = '';
        el.style.borderColor = '#d9b370';
    }
}

// Modal handling for adding players
document.getElementById('addRoundBtn').onclick = () => {
    const modal = document.getElementById('addRoundModal');
    const playerSelectionList = document.getElementById('playerSelectionList');
    playerSelectionList.innerHTML = '';

    const lastRound = document.getElementById('roundsList').children.length;
    document.getElementById('roundNumber').textContent = `Adding Round ${lastRound + 1}`;

    sessionPlayers.forEach((player, index) => {
        const playerEntry = document.createElement('div');
        playerEntry.className = 'player-selection-entry fade-in';
        playerEntry.dataset.status = 'none';
        playerEntry.dataset.playerId = player.id;
        playerEntry.style.display = 'flex';
        playerEntry.style.alignItems = 'center';
        playerEntry.style.padding = '8px';
        playerEntry.style.border = '2px solid #d9b370';
        playerEntry.style.borderRadius = '8px';
        playerEntry.style.cursor = 'pointer';
        playerEntry.style.animationDelay = `${index * 50}ms`;
        playerEntry.title = `${player.first_name} ${player.last_name}`;

        const img = document.createElement('img');
        img.src = player.avatar_url || player.avatar || "../img/avatar-placeholder.webp";
        img.className = 'avatar';
        img.style.marginRight = '10px';

        const name = document.createElement('span');
        name.textContent = `${player.first_name} ${player.last_name}`;
        name.style.flexGrow = '1';

        const statusIcon = document.createElement('span');
        statusIcon.className = 'status-icon';
        statusIcon.style.fontSize = '1.5rem';

        playerEntry.append(img, name, statusIcon);
        playerEntry.onclick = () => toggleStatus(playerEntry);
        playerSelectionList.appendChild(playerEntry);
    });

    modal.style.display = 'flex';
};

// Handle round submission
document.getElementById('submitRound').onclick = async () => {
    const winners = Array.from(document.querySelectorAll('.player-selection-entry[data-status="winner"]'))
        .map(el => parseInt(el.dataset.playerId));
    const losers = Array.from(document.querySelectorAll('.player-selection-entry[data-status="loser"]'))
        .map(el => parseInt(el.dataset.playerId));

    if (winners.length === 0) {
        alert('Please select at least one winner.');
        return;
    }

    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/round`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: getSessionIdFromURL(),
                winners,
                losers
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to save round');
        }

        document.getElementById('addRoundModal').style.display = 'none';
        await loadSessionRounds();
    } catch (err) {
        console.error('Failed to save round:', err);
        alert(`Could not save round results: ${err.message}`);
    }
};

// Handle adding new players
document.getElementById('submitAddPlayer').onclick = async () => {
    const select = document.getElementById('playerSelect');
    const userId = parseInt(select.value);
    
    if (!userId) {
        alert('Please select a player to add');
        return;
    }

    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/add-player`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: getSessionIdFromURL(),
                user_id: userId,
                added_by: currentUserId
            })
        });

        if (!res.ok) throw new Error('Failed to add player');

        document.getElementById('addPlayerModal').style.display = 'none';
        await loadSessionRounds();
    } catch (err) {
        console.error('Failed to add player:', err);
        alert('Could not add player to session');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadSessionData);

// Close modals when clicking outside
window.onclick = (event) => {
    const modals = document.getElementsByClassName('modal');
    for (const modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}; 
import { 
    getAccessToken,
    getUserIdFromToken,
    getUserRole,
    fetchWithAuth
} from '../js/modules/auth.js';

const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';

let currentSession = null;
let sessionMembers = [];
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

        // Load members, then rounds
        await loadSessionMembers();
        await loadSessionRounds();

        // Authorize the "Add Round" button
        const currentUserId = getUserIdFromToken();
        const currentUserRole = getUserRole();
        const isParticipant = sessionMembers.some(p => p.user_id === currentUserId) || currentUserRole === 'admin';

        if (isParticipant) {
            document.getElementById('addRoundBtn').style.display = "inline-block";
        }

        console.log("✨ Session view loaded successfully with game:", currentSession.game_title);
    } catch (err) {
        console.error('Failed to load session:', err);
        document.body.innerHTML = "<p style='padding:2rem;'>❌ This session doesn't exist or you don't have access.</p>";
    }
}

async function loadSessionMembers() {
    const sessionId = getSessionIdFromURL();
    const playerListContainer = document.getElementById('sessionPlayerList');
    playerListContainer.innerHTML = '';

    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/${sessionId}/members`);
        if (!res.ok) throw new Error('Failed to load session members');
        
        sessionMembers = await res.json();

        if (sessionMembers.length > 0) {
            playerListContainer.style.opacity = 0;
            sessionMembers.forEach((player, index) => {
                const playerAvatar = document.createElement('div');
                playerAvatar.className = 'friend-avatar fade-in';
                playerAvatar.title = `${player.first_name} ${player.last_name}`;
                playerAvatar.style.animationDelay = `${index * 50}ms`;

                const img = document.createElement('img');
                img.src = player.avatar_url || '../img/avatar-placeholder.webp';
                img.alt = `${player.first_name} ${player.last_name}`;
                img.className = 'avatar';
                
                playerAvatar.appendChild(img);
                playerListContainer.appendChild(playerAvatar);
            });
            playerListContainer.style.animation = 'fadeIn 0.5s forwards';
        } else {
            playerListContainer.innerHTML = '<div class="placeholder-box">No players in this session.</div>';
        }
    } catch (err) {
        console.error('Failed to load session members:', err);
        playerListContainer.innerHTML = '<div class="placeholder-box">Could not load players in this session.</div>';
    }
}

async function loadSessionRounds() {
    const sessionId = getSessionIdFromURL();
    const roundsContainer = document.getElementById('roundsList');
    roundsContainer.innerHTML = '';

    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/rounds/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load rounds');
        
        const data = await res.json();
        const { rounds } = data;

        if (!rounds || !rounds.length) {
            roundsContainer.innerHTML = '<div class="placeholder-box">No rounds yet</div>';
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
                ? round.winners.map(w => w.first_name ? `${w.first_name} ${w.last_name}` : `User #${w.user_id}`).join(', ')
                : 'N/A';

            const loserNames = round.losers && round.losers.length
                ? round.losers.map(l => l.first_name ? `${l.first_name} ${l.last_name}` : `User #${l.user_id}`).join(', ')
                : 'N/A';

            const roundNumberEl = document.createElement('p');
            roundNumberEl.textContent = `🎲 Round ${round.round_number}`;
            roundNumberEl.style.fontWeight = 'bold';

            const winnersEl = document.createElement('p');
            winnersEl.innerHTML = `👑 <span style="font-weight:bold;">Winners:</span> ${winnerNames}`;
            
            const losersEl = document.createElement('p');
            losersEl.innerHTML = `🗑️ <span style="font-weight:bold;">Losers:</span> ${loserNames}`;

            card.append(roundNumberEl, winnersEl, losersEl);
            
            if (round.notes) {
                card.title = `Notes: ${round.notes}`;
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
        roundsContainer.innerHTML = 
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

    sessionMembers.forEach((player, index) => {
        const playerEntry = document.createElement('div');
        playerEntry.className = 'player-selection-entry fade-in';
        playerEntry.dataset.status = 'none';
        playerEntry.dataset.playerId = player.user_id;
        playerEntry.style.display = 'flex';
        playerEntry.style.alignItems = 'center';
        playerEntry.style.padding = '8px';
        playerEntry.style.border = '2px solid #d9b370';
        playerEntry.style.borderRadius = '8px';
        playerEntry.style.cursor = 'pointer';
        playerEntry.style.animationDelay = `${index * 50}ms`;
        playerEntry.title = `${player.first_name} ${player.last_name}`;

        const img = document.createElement('img');
        img.src = player.avatar_url || "../img/avatar-placeholder.webp";
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

document.getElementById('submitRound').onclick = async () => {
    const sessionId = getSessionIdFromURL();
    const playerEntries = document.querySelectorAll('.player-selection-entry');
    
    const winners = [];
    const losers = [];

    playerEntries.forEach(entry => {
        if (entry.dataset.status === 'winner') {
            winners.push(entry.dataset.playerId);
        } else if (entry.dataset.status === 'loser') {
            losers.push(entry.dataset.playerId);
        }
    });

    if (winners.length === 0 && losers.length === 0) {
        alert("Please select at least one winner or loser.");
        return;
    }

    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/${sessionId}/round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winners, losers })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to submit round.');
        }

        document.getElementById('addRoundModal').style.display = 'none';
        await loadSessionRounds(); // Refresh the rounds list
        console.log("✅ Round submitted successfully!");

    } catch (err) {
        console.error('Error submitting round:', err);
        alert(`Error: ${err.message}`);
    }
};

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    // A little delay for assets to load, plus a nice fade-in for the whole view
    document.body.style.opacity = 0;
    loadSessionData().then(() => {
        document.body.style.transition = 'opacity 0.5s';
        document.body.style.opacity = 1;
    });
});

// Close modals when clicking outside
window.onclick = (event) => {
    const modals = document.getElementsByClassName('modal');
    for (const modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}; 
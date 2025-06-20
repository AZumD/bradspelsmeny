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

        // Update global sessionPlayers variable for the modal
        sessionPlayers = members || [];

        const roundsContainer = document.getElementById('roundsList');
        roundsContainer.innerHTML = '';

        // Render player list
        const playerListContainer = document.getElementById('playerList');
        playerListContainer.innerHTML = '';
        if (sessionPlayers.length > 0) {
            sessionPlayers.forEach(player => {
                const playerAvatar = document.createElement('div');
                playerAvatar.className = 'friend-avatar';
                playerAvatar.title = `${player.first_name} ${player.last_name}`;

                const img = document.createElement('img');
                img.src = player.avatar_url || player.avatar || '../img/avatar-placeholder.webp';
                img.className = 'avatar';

                playerAvatar.appendChild(img);
                playerListContainer.appendChild(playerAvatar);
            });
        } else {
            playerListContainer.innerHTML = '<div class="placeholder-box">No players found in this session.</div>';
        }

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

            card.innerHTML = `<p>🎲 Round ${round.round_number} — Winner: ${round.first_name} ${round.last_name}</p>`;

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

// Modal handling for adding players
document.getElementById('addRoundBtn').onclick = () => {
    const modal = document.getElementById('addRoundModal');
    
    // Populate player checkboxes
    const winnersDiv = document.getElementById('winnersList');
    const losersDiv = document.getElementById('losersList');
    winnersDiv.innerHTML = '';
    losersDiv.innerHTML = '';

    const lastRound = document.getElementById('roundsList').children.length;
    document.getElementById('roundNumber').textContent = `Adding Round ${lastRound + 1}`;

    sessionPlayers.forEach(player => {
        const createPlayerCheckbox = (player, list) => {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.marginBottom = '8px';
            label.style.cursor = 'pointer';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = player.id;
            checkbox.name = list === 'winners' ? 'winner' : 'loser';
            checkbox.style.marginRight = '8px';

            const img = document.createElement('img');
            img.src = player.avatar_url || player.avatar || "../img/avatar-placeholder.webp";
            img.className = 'avatar friend-avatar';
            img.style.width = '32px';
            img.style.height = '32px';

            const name = document.createTextNode(` ${player.first_name} ${player.last_name.charAt(0)}.`);
            
            label.appendChild(checkbox);
            label.appendChild(img);
            label.appendChild(name);

            return label;
        };
        
        winnersDiv.appendChild(createPlayerCheckbox(player, 'winners'));
        losersDiv.appendChild(createPlayerCheckbox(player, 'losers'));
    });

    modal.style.display = 'flex';
};

// Handle round submission
document.getElementById('submitRound').onclick = async () => {
    const winners = Array.from(document.querySelectorAll('input[name="winner"]:checked'))
        .map(cb => parseInt(cb.value));
    const losers = Array.from(document.querySelectorAll('input[name="loser"]:checked'))
        .map(cb => parseInt(cb.value));

    if (winners.length === 0) {
        alert('Please select at least one winner.');
        return;
    }

    // Ensure players are not in both lists
    const intersection = winners.filter(id => losers.includes(id));
    if (intersection.length > 0) {
        alert("A player can't be both a winner and a loser.");
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

        if (!res.ok) throw new Error('Failed to save round');

        document.getElementById('addRoundModal').style.display = 'none';
        await loadSessionRounds();
    } catch (err) {
        console.error('Failed to save round:', err);
        alert('Could not save round results');
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
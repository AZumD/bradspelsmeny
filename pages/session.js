import { 
    getAccessToken,
    getUserIdFromToken,
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
        thumb.src = currentSession.img || '../img/default-thumb.webp';
        thumb.alt = currentSession.title || 'Game thumbnail';
        thumb.onerror = () => { thumb.src = '../img/default-thumb.webp'; };

        const titleEl = document.getElementById('gameTitle');
        titleEl.textContent = currentSession.title;
        titleEl.style.overflow = 'hidden';
        titleEl.style.textOverflow = 'ellipsis';
        titleEl.style.whiteSpace = 'nowrap';
        titleEl.style.maxWidth = '100%';

        // Load and render players
        await loadSessionPlayers();

        // Load and render rounds
        await loadSessionRounds();

        console.log("✨ Session view loaded successfully");
    } catch (err) {
        console.error('Failed to load session:', err);
        document.body.innerHTML = "<p style='padding:2rem;'>❌ This session doesn't exist or you don't have access.</p>";
    }
}

async function loadSessionPlayers() {
    const sessionId = getSessionIdFromURL();
    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/players/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load players');
        sessionPlayers = await res.json();

        const container = document.getElementById('playerList');
        container.innerHTML = '';

        sessionPlayers.forEach(player => {
            const avatar = document.createElement('a');
            avatar.href = `${FRONTEND_BASE}/pages/profile.html?id=${player.user_id}`;
            avatar.title = player.username;

            const img = document.createElement('img');
            img.src = player.avatar_url || '../img/avatar-placeholder.webp';
            img.alt = player.username;
            img.className = 'friend-avatar';
            img.style.width = '48px';
            img.style.height = '48px';

            avatar.appendChild(img);
            container.appendChild(avatar);
        });

        // Add the + button if user is in session
        currentUserId = getUserIdFromToken();
        const userInSession = sessionPlayers.some(p => p.user_id === currentUserId);
        
        if (userInSession) {
            const addBtn = document.createElement('div');
            addBtn.className = 'add-friend-circle';
            addBtn.textContent = '+';
            addBtn.onclick = () => document.getElementById('addPlayerModal').style.display = 'flex';
            container.appendChild(addBtn);

            // Show Add Round button
            document.getElementById('addRoundBtn').style.display = 'block';
        }

    } catch (err) {
        console.error('Failed to load players:', err);
    }
}

async function loadSessionRounds() {
    const sessionId = getSessionIdFromURL();
    try {
        const res = await fetchWithAuth(`${API_BASE}/party-sessions/rounds/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load rounds');
        const rounds = await res.json();

        const container = document.getElementById('roundsList');
        container.innerHTML = '';

        if (!rounds.length) {
            container.innerHTML = '<div class="placeholder-box">No rounds played yet</div>';
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

            const winners = round.winners.map(w => w.username).join(', ');
            const losers = round.losers.map(l => l.username).join(', ');

            card.innerHTML = `
                <div style="font-size:1.2rem;margin-bottom:4px;">Round ${index + 1}</div>
                <div style="color:#2e7d32;margin-bottom:2px;">🏆 Winners: ${winners}</div>
                <div style="color:#c62828;">💀 Losers: ${losers}</div>
            `;

            container.appendChild(card);
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

    sessionPlayers.forEach(player => {
        const winnerLabel = document.createElement('label');
        winnerLabel.style.display = 'block';
        winnerLabel.style.marginBottom = '4px';
        winnerLabel.innerHTML = `
            <input type="checkbox" name="winner" value="${player.user_id}">
            ${player.username}
        `;
        winnersDiv.appendChild(winnerLabel);

        const loserLabel = document.createElement('label');
        loserLabel.style.display = 'block';
        loserLabel.style.marginBottom = '4px';
        loserLabel.innerHTML = `
            <input type="checkbox" name="loser" value="${player.user_id}">
            ${player.username}
        `;
        losersDiv.appendChild(loserLabel);
    });

    modal.style.display = 'flex';
};

// Handle round submission
document.getElementById('submitRound').onclick = async () => {
    const winners = Array.from(document.querySelectorAll('input[name="winner"]:checked'))
        .map(cb => parseInt(cb.value));
    const losers = Array.from(document.querySelectorAll('input[name="loser"]:checked'))
        .map(cb => parseInt(cb.value));

    if (!winners.length || !losers.length) {
        alert('Please select at least one winner and one loser');
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
        await loadSessionPlayers();
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
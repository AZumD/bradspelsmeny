// API Configuration
export const API_BASE = 'https://bradspelsmeny-backend-production.up.railway.app';
export const API_URL = API_BASE; // Alias for backward compatibility

// Frontend configuration
export const FRONTEND_BASE = 'https://azumd.github.io/bradspelsmeny';

// API Endpoints
export const API_ENDPOINTS = {
    API_BASE,
    LOGIN: `${API_BASE}/login`,
    REGISTER: `${API_BASE}/register`,
    REFRESH_TOKEN: `${API_BASE}/refresh-token`,
    GAMES: `${API_BASE}/games`,
    GAMES_PUBLIC: `${API_BASE}/games/public`,
    STATS: {
        TOTAL_GAMES: `${API_BASE}/stats/total-games`,
        LENT_OUT: `${API_BASE}/stats/lent-out`,
        MOST_LENT: `${API_BASE}/stats/most-lent-this-month`
    },
    ORDERS: {
        CREATE: `${API_BASE}/order-game`,
        LATEST: `${API_BASE}/order-game/latest`,
        DELETE: `${API_BASE}/order-game` 
        COMPLETE: (id) => `${API_BASE}/order-game/${id}/complete`, // 👈 ADD THIS
    },
    USERS: {
        BASE: `${API_BASE}/users`,
        PROFILE: (id) => `${API_BASE}/users/${id}`,
        AVATAR: (id) => `${API_BASE}/users/${id}/avatar`,
        BORROW_LOG: (id) => `${API_BASE}/users/${id}/borrow-log`,
        FRIENDS: (id) => `${API_BASE}/users/${id}/friends`,
        BADGES: (id) => `${API_BASE}/users/${id}/badges`
    },
    FRIENDS: {
        BASE: `${API_BASE}/friends`,
        REMOVE: (id) => `${API_BASE}/friends/remove/${id}`,
        REQUESTS: `${API_BASE}/friend-requests`
    },
    PARTY: {
        BASE: `${API_BASE}/party`,
        MEMBERS: (id) => `${API_BASE}/party/${id}/members`,
        MESSAGES: (id) => `${API_BASE}/party/${id}/messages`,
        SESSIONS: (id) => `${API_BASE}/party/${id}/sessions`
    },
    NOTIFICATIONS: {
        BASE: `${API_BASE}/notifications`,
        MARK_READ: (id) => `${API_BASE}/notifications/${id}/read`
    },
    LEND: (gameId) => `${API_BASE}/lend/${gameId}`,
    RETURN: (gameId) => `${API_BASE}/return/${gameId}`,
    FAVORITES: (userId) => `${API_BASE}/users/${userId}/favorites`,
    WISHLIST: (userId) => `${API_BASE}/users/${userId}/wishlist`
};

// Game Categories
export const GAME_CATEGORIES = {
    ALL: 'all',
    NEW: 'new',
    POPULAR: 'popular',
    STAFF_PICKS: 'staff-picks',
    FAMILY: 'family',
    PARTY: 'party',
    STRATEGY: 'strategy',
    COOPERATIVE: 'cooperative',
    DEXTERITY: 'dexterity',
    DEDUCTION: 'deduction',
    WORD: 'word',
    CARD: 'card',
    DICE: 'dice',
    TRAVEL: 'travel',
    CHILDREN: 'children'
};

// Member Categories
export const MEMBER_CATEGORIES = {
    ALL: 'all',
    ACTIVE: 'active',
    INACTIVE: 'inactive'
}; 
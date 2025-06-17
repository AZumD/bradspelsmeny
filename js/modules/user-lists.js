import { API_ENDPOINTS } from './config.js';
import { getCurrentUser } from './auth.js';
import { showError } from './ui.js';

let userFavorites = [];
let userWishlist = [];

export async function fetchUserLists() {
    try {
        const user = getCurrentUser();
        if (!user || !user.id) {
            console.warn('No user logged in or invalid user data');
            userFavorites = [];
            userWishlist = [];
            return { favorites: [], wishlist: [] };
        }

        const token = localStorage.getItem('userToken');
        const [favoritesRes, wishlistRes] = await Promise.all([
            fetch(API_ENDPOINTS.FAVORITES(user.id), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch(API_ENDPOINTS.WISHLIST(user.id), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);

        if (!favoritesRes.ok || !wishlistRes.ok) {
            throw new Error('Failed to fetch user lists');
        }

        const [favorites, wishlist] = await Promise.all([
            favoritesRes.json(),
            wishlistRes.json()
        ]);

        // Update module-level variables
        userFavorites = favorites;
        userWishlist = wishlist;

        return { favorites, wishlist };
    } catch (error) {
        console.error('Error fetching user lists:', error);
        showError('Failed to load your lists');
        userFavorites = [];
        userWishlist = [];
        return { favorites: [], wishlist: [] };
    }
}

export function isFavorite(gameId) {
    return userFavorites.some(game => game.id === gameId);
}

export function isWishlisted(gameId) {
    return userWishlist.some(game => game.id === gameId);
}

export async function toggleFavorite(gameId, isFavorite) {
    try {
        const user = getCurrentUser();
        if (!user || !user.id) {
            throw new Error('No user logged in or invalid user data');
        }

        if (!gameId) {
            throw new Error('No game ID provided');
        }

        const method = isFavorite ? 'DELETE' : 'POST';
        const token = localStorage.getItem('userToken');
        const payload = { 
            user_id: user.id,
            game_id: gameId 
        };

        console.log('Toggle Favorite Debug Info:', {
            method,
            url: `${API_ENDPOINTS.API_BASE}/favorite`,
            payload,
            token: token ? token.substring(0, 20) + '...' : 'No token found',
            user: {
                id: user.id,
                role: user.role
            }
        });

        const response = await fetch(`${API_ENDPOINTS.API_BASE}/favorite`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Toggle Favorite Error Details:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                url: response.url
            });
            throw new Error(errorData.message || 'Failed to update favorite status');
        }

        // Update local state
        if (isFavorite) {
            userFavorites = userFavorites.filter(game => game.id !== gameId);
        } else {
            // Fetch the full game details
            const gameResponse = await fetch(`${API_ENDPOINTS.API_BASE}/games/${gameId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (gameResponse.ok) {
                const game = await gameResponse.json();
                userFavorites.push(game);
            }
        }

        return true;
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showError('Failed to update favorites');
        return false;
    }
}

export async function toggleWishlist(gameId, isWishlisted) {
    try {
        const user = getCurrentUser();
        if (!user || !user.id) {
            throw new Error('No user logged in or invalid user data');
        }

        if (!gameId) {
            throw new Error('No game ID provided');
        }

        const method = isWishlisted ? 'DELETE' : 'POST';
        const token = localStorage.getItem('userToken');
        const payload = { 
            user_id: user.id,
            game_id: gameId 
        };

        console.log('Toggle Wishlist Debug Info:', {
            method,
            url: `${API_ENDPOINTS.API_BASE}/wishlist`,
            payload,
            token: token ? token.substring(0, 20) + '...' : 'No token found',
            user: {
                id: user.id,
                role: user.role
            }
        });

        const response = await fetch(`${API_ENDPOINTS.API_BASE}/wishlist`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Toggle Wishlist Error Details:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                url: response.url
            });
            throw new Error(errorData.message || 'Failed to update wishlist status');
        }

        // Update local state
        if (isWishlisted) {
            userWishlist = userWishlist.filter(game => game.id !== gameId);
        } else {
            // Fetch the full game details
            const gameResponse = await fetch(`${API_ENDPOINTS.API_BASE}/games/${gameId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (gameResponse.ok) {
                const game = await gameResponse.json();
                userWishlist.push(game);
            }
        }

        return true;
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        showError('Failed to update wishlist');
        return false;
    }
}
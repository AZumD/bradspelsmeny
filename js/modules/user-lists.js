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

        const [favoritesRes, wishlistRes] = await Promise.all([
            fetch(`${API_ENDPOINTS.FAVORITES}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            }),
            fetch(`${API_ENDPOINTS.WISHLIST}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
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

        const method = isFavorite ? 'DELETE' : 'POST';
        const response = await fetch(`${API_ENDPOINTS.FAVORITES}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify({ user_id: user.id, game_id: gameId })
        });

        if (!response.ok) {
            throw new Error('Failed to update favorite status');
        }

        // Update local state
        if (isFavorite) {
            userFavorites = userFavorites.filter(game => game.id !== gameId);
        } else {
            // Add the game to favorites (you might need to fetch the game details first)
            const gameResponse = await fetch(`${API_ENDPOINTS.GAMES}/${gameId}`);
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

        const method = isWishlisted ? 'DELETE' : 'POST';
        const response = await fetch(`${API_ENDPOINTS.WISHLIST}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify({ user_id: user.id, game_id: gameId })
        });

        if (!response.ok) {
            throw new Error('Failed to update wishlist status');
        }

        // Update local state
        if (isWishlisted) {
            userWishlist = userWishlist.filter(game => game.id !== gameId);
        } else {
            // Add the game to wishlist (you might need to fetch the game details first)
            const gameResponse = await fetch(`${API_ENDPOINTS.GAMES}/${gameId}`);
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
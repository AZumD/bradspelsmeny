import { API_ENDPOINTS } from './config.js';

export function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
}

export function getAccessToken() {
    return localStorage.getItem('userToken');
}

export function setAccessToken(token) {
    localStorage.setItem('userToken', token);
}

export function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

export function setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
}

export function clearTokens() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
}

export function getUserRole() {
    const token = getAccessToken();
    if (!token) return null;
    try {
        return parseJwt(token)?.role || null;
    } catch {
        return null;
    }
}

export function logout() {
    clearTokens();
    window.location.href = '/bradspelsmeny/pages/login.html';
}

export async function refreshToken() {
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) return false;

    try {
        const res = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken: storedRefreshToken })
        });

        if (!res.ok) return false;

        const data = await res.json();
        setAccessToken(data.token);
        setRefreshToken(data.refreshToken);
        return true;
    } catch {
        return false;
    }
}

export async function fetchWithAuth(url, options = {}, retry = true) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${getAccessToken()}`;

    let res = await fetch(url, options);
    if (res.status === 401 && retry) {
        const refreshed = await refreshToken();
        if (refreshed) {
            options.headers['Authorization'] = `Bearer ${getAccessToken()}`;
            res = await fetch(url, options);
        } else {
            logout();
            throw new Error('Unauthorized, please login again.');
        }
    }
    return res;
}

export function isMemberUser() {
    try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        return userData && userData.membership_status === "active";
    } catch {
        return false;
    }
}

export async function checkAuth() {
    const token = getAccessToken();
    
    if (!token) {
        window.location.href = "/bradspelsmeny/pages/login.html";
        return null;
    }
    
    const decoded = parseJwt(token);
    if (!decoded || decoded.role !== "admin") {
        window.location.href = "/bradspelsmeny/pages/login.html";
        return null;
    }
    
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        clearTokens();
        window.location.href = "/bradspelsmeny/pages/login.html";
        return null;
    }

    return token;
}

export function getCurrentUser() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        return userData || null;
    } catch {
        return null;
    }
}

// Make auth functions available globally for onclick handlers
window.logout = logout; 
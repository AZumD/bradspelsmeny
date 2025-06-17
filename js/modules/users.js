import { API_ENDPOINTS } from './config.js';

const API_ENDPOINT = API_ENDPOINTS.USERS.BASE;

export async function fetchUsers(token) {
    const res = await fetch(API_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to fetch users");
    const users = await res.json();
    return users.sort((a, b) => a.last_name.localeCompare(b.last_name));
}

export async function saveUser(userData, token, editingId = null) {
    const url = editingId ? `${API_ENDPOINT}/${editingId}` : API_ENDPOINT;
    const method = editingId ? "PUT" : "POST";

    const payload = {
        username: userData.username || null,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        email: userData.email || null,
        bio: userData.bio || null,
        membership_status: userData.membership_status || null
    };

    try {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to save user: ${res.status} ${res.statusText}`);
        }
        return res.json();
    } catch (error) {
        console.error('Save user error details:', error);
        throw error;
    }
}

export async function deleteUser(id, token) {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
    }
    return true;
}

export async function archiveUser(id, token) {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to archive user");
    return true;
}

export async function awardBadge(userId, badgeId, token) {
    const res = await fetch(`${API_ENDPOINTS}/users/${userId}/badges`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ badge_id: badgeId })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to award badge");
    }
    return res.json();
} 
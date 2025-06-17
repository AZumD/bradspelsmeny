import { API_ENDPOINTS } from './config.js';
import { fetchWithAuth } from './api.js';

export async function fetchStats() {
    try {
        const [totalGamesRes, lentOutRes, mostLentRes] = await Promise.all([
            fetchWithAuth(API_ENDPOINTS.STATS.TOTAL_GAMES),
            fetchWithAuth(API_ENDPOINTS.STATS.LENT_OUT),
            fetchWithAuth(API_ENDPOINTS.STATS.MOST_LENT)
        ]);

        if (!totalGamesRes.ok || !lentOutRes.ok || !mostLentRes.ok) {
            throw new Error("Failed to fetch stats");
        }

        const totalGamesData = await totalGamesRes.json();
        const lentOutData = await lentOutRes.json();
        const mostLentData = await mostLentRes.json();

        document.getElementById("totalGamesCount").textContent = totalGamesData.total;
        document.getElementById("lentOutCount").textContent = lentOutData.lentOut;

        const mostPlayedTitle = document.querySelector(".tile.large h2");
        const mostPlayedValue = document.querySelector(".tile.large .value");
        if (mostPlayedTitle && mostPlayedValue) {
            mostPlayedTitle.textContent = "Mest spelade denna månad";
            mostPlayedValue.textContent = mostLentData.title || "–";
        }

    } catch (err) {
        console.error("❌ Failed to fetch stats:", err);
    }
} 
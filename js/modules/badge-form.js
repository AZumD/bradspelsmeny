import { awardBadge } from './users.js';

export function initBadgeForm(token) {
    const badgeModal = document.getElementById("badgeModal");
    const badgeForm = document.getElementById("badgeForm");
    const badgeSelect = document.getElementById("badgeSelect");
    const closeBadgeModal = document.getElementById("closeBadgeModal");

    // Initialize modal close functionality
    badgeModal.addEventListener("click", (e) => {
        if (e.target === badgeModal) badgeModal.style.display = "none";
    });

    if (closeBadgeModal) {
        closeBadgeModal.addEventListener("click", () => {
            badgeModal.style.display = "none";
        });
    }

    // Initialize form submission
    badgeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userId = document.getElementById("badgeUserId").value;
        const badgeId = badgeSelect.value;

        try {
            const data = await awardBadge(userId, badgeId, token);
            if (data.success) {
                alert("✅ " + (data.message || "Badge tilldelad!"));
            } else {
                alert("ℹ️ " + (data.message || "Användaren hade redan den här badgen."));
            }
            badgeModal.style.display = "none";
        } catch (err) {
            console.error("❌ Error awarding badge:", err);
            alert("Något gick fel när badge skulle tilldelas.");
        }
    });

    return {
        openModal: async (userId) => {
            document.getElementById("badgeUserId").value = userId;
            badgeModal.style.display = "flex";

            // Load available badges
            try {
                const res = await fetch("https://bradspelsmeny-backend-production.up.railway.app/badges", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch badges");
                
                const badges = await res.json();
                badgeSelect.innerHTML = badges.map(badge => 
                    `<option value="${badge.id}">${badge.name}</option>`
                ).join("");
            } catch (err) {
                console.error("Failed to load badges:", err);
                alert("Kunde inte ladda tillgängliga märken.");
            }
        }
    };
} 
import { saveGame, getGames } from './games.js';

let editingIndex = null;

export function initGameForm() {
    const gameForm = document.getElementById("gameForm");
    const conditionRating = document.getElementById("conditionRating");
    
    if (gameForm) {
        gameForm.onsubmit = handleFormSubmit;
    }

    if (conditionRating) {
        initConditionRating();
    }
}

function initConditionRating() {
    const stars = document.querySelectorAll("#conditionRating .star");
    const conditionRatingValue = document.getElementById("conditionRatingValue");

    stars.forEach((star) => {
        star.addEventListener("click", () => {
            const rating = parseInt(star.dataset.value);
            conditionRatingValue.value = rating;
            updateStars(rating);
        });
    });
}

export function updateStars(rating) {
    document.querySelectorAll("#conditionRating .star").forEach((star) => {
        const val = parseInt(star.dataset.value);
        star.classList.toggle("filled", val <= rating);
    });
}

export function openModal(index = null) {
    const modal = document.getElementById("gameModal");
    const form = document.getElementById("gameForm");
    const title = document.getElementById("formTitle");
    const editingIndex = document.getElementById("editingIndex");

    if (index !== null) {
        // Editing existing game
        const game = getGames()[index];
        if (!game) return;

        title.textContent = "Redigera spel";
        editingIndex.value = index;
        
        // Fill form with game data
        form.title.value = game.title_sv || "";
        form.descSv.value = game.description_sv || "";
        form.descEn.value = game.description_en || "";
        form.minPlayers.value = game.min_players || "";
        form.maxPlayers.value = game.max_players || "";
        form.time.value = game.play_time || "";
        form.age.value = game.age || "";
        form.tags.value = Array.isArray(game.tags) ? game.tags.join(", ") : (game.tags || "");
        form.img.value = game.img || "";
        form.rules.value = game.rules || "";
        form.slowDayOnly.checked = game.slow_day_only || false;
        form.trustedOnly.checked = game.trusted_only || false;
        form.membersOnly.checked = game.members_only || false;
        
        // Set condition rating
        const rating = game.condition_rating || 0;
        document.querySelectorAll('.star').forEach(star => {
            star.classList.toggle('filled', parseInt(star.dataset.value) <= rating);
        });
        document.getElementById('conditionRatingValue').value = rating;
    } else {
        // Adding new game
        title.textContent = "Lägg till nytt spel";
        form.reset();
        editingIndex.value = "";
        document.querySelectorAll('.star').forEach(star => star.classList.remove('filled'));
        document.getElementById('conditionRatingValue').value = "0";
    }

    modal.style.display = "flex";
}

// Make openModal available globally
window.openModal = openModal;

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        title_sv: document.getElementById("title").value.trim(),
        title_en: document.getElementById("title").value.trim(),
        description_sv: document.getElementById("descSv").value.trim(),
        description_en: document.getElementById("descEn").value.trim(),
        min_players: parseInt(document.getElementById("minPlayers").value.trim()),
        max_players: parseInt(document.getElementById("maxPlayers").value.trim()),
        play_time: parseInt(document.getElementById("time").value.trim()),
        age: parseInt(document.getElementById("age").value.trim()),
        tags: document.getElementById("tags").value.trim().split(",").map(tag => tag.trim()),
        img: document.getElementById("img").value.trim(),
        rules: document.getElementById("rules").value.trim(),
        slow_day_only: document.getElementById("slowDayOnly").checked,
        trusted_only: document.getElementById("trustedOnly").checked,
        members_only: document.getElementById("membersOnly").checked,
        min_table_size: parseInt(document.getElementById("minTableSize").value.trim()),
        condition_rating: parseInt(document.getElementById("conditionRatingValue").value),
        staff_picks: document.getElementById("staffPicks").value.trim().split(",").map(pick => pick.trim())
    };

    if (editingIndex !== null) {
        formData.id = document.getElementById("editingIndex").value;
    }

    try {
        await saveGame(formData);
        document.getElementById("gameModal").style.display = "none";
        window.location.reload(); // Refresh to show updated data
    } catch (err) {
        alert("Kunde inte spara spelet. Försök igen.");
        console.error(err);
    }
} 
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

export function createEditableGameForm(gameData, onSave, onCancel, onDelete) {
    const form = document.createElement("form");
    form.classList.add("edit-form");
  
    form.innerHTML = `
      <div class="form-group">
        <label for="title_sv">Titel (SV):</label>
        <input type="text" id="title_sv" name="title_sv" value="${gameData.title_sv || ''}" required>
      </div>
      <div class="form-group">
        <label for="title_en">Titel (EN):</label>
        <input type="text" id="title_en" name="title_en" value="${gameData.title_en || ''}" required>
      </div>
      <div class="form-group">
        <label for="description_sv">Beskrivning (SV):</label>
        <textarea id="description_sv" name="description_sv" required>${gameData.description_sv || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="description_en">Beskrivning (EN):</label>
        <textarea id="description_en" name="description_en" required>${gameData.description_en || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="min_players">Min spelare:</label>
        <input type="number" id="min_players" name="min_players" value="${gameData.min_players || ''}" required>
      </div>
      <div class="form-group">
        <label for="max_players">Max spelare:</label>
        <input type="number" id="max_players" name="max_players" value="${gameData.max_players || ''}" required>
      </div>
      <div class="form-group">
        <label for="play_time">Speltid (min):</label>
        <input type="number" id="play_time" name="play_time" value="${gameData.play_time || ''}" required>
      </div>
      <div class="form-group">
        <label for="age">Ålder:</label>
        <input type="number" id="age" name="age" value="${gameData.age || ''}" required>
      </div>
      <div class="form-group">
        <label for="tags">Taggar (kommaseparerade):</label>
        <input type="text" id="tags" name="tags" value="${gameData.tags || ''}">
      </div>
      <div class="form-group">
        <label for="img">Bild URL:</label>
        <input type="text" id="img" name="img" value="${gameData.img || ''}">
      </div>
      <div class="form-group">
        <label for="rules">Regellänk:</label>
        <input type="text" id="rules" name="rules" value="${gameData.rules || ''}">
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" id="slow_day_only" name="slow_day_only" ${gameData.slow_day_only ? 'checked' : ''}>
          Endast för lugna dagar
        </label>
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" id="trusted_only" name="trusted_only" ${gameData.trusted_only ? 'checked' : ''}>
          Endast för betrodda gäster
        </label>
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" id="members_only" name="members_only" ${gameData.members_only ? 'checked' : ''}>
          Endast för medlemmar
        </label>
      </div>
      <div class="form-group">
        <label>Skick (1–5):</label>
        <div class="star-rating" role="radiogroup">
          <span class="star" data-value="1" role="radio" aria-label="1 stjärna">★</span>
          <span class="star" data-value="2" role="radio" aria-label="2 stjärnor">★</span>
          <span class="star" data-value="3" role="radio" aria-label="3 stjärnor">★</span>
          <span class="star" data-value="4" role="radio" aria-label="4 stjärnor">★</span>
          <span class="star" data-value="5" role="radio" aria-label="5 stjärnor">★</span>
        </div>
        <input type="hidden" id="condition_rating" name="condition_rating" value="${gameData.condition_rating || 0}">
      </div>
      <div class="form-actions">
        <button type="submit" class="save-button">Spara ändringar</button>
        <button type="button" class="cancel-button">Avbryt</button>
        ${onDelete ? `<button type="button" class="delete-button">Ta bort spel</button>` : ''}
      </div>
    `;
  
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const updated = Object.fromEntries(formData.entries());
      updated.id = gameData.id;
      
      // Convert checkbox values to boolean
      updated.slow_day_only = formData.get('slow_day_only') === 'on';
      updated.trusted_only = formData.get('trusted_only') === 'on';
      updated.members_only = formData.get('members_only') === 'on';
      
      // Convert numeric values
      updated.min_players = parseInt(updated.min_players);
      updated.max_players = parseInt(updated.max_players);
      updated.play_time = parseInt(updated.play_time);
      updated.age = parseInt(updated.age);
      updated.condition_rating = parseInt(updated.condition_rating);
      
      await onSave(updated);
    };
  
    // Initialize star rating
    const stars = form.querySelectorAll('.star');
    const ratingInput = form.querySelector('#condition_rating');
    
    stars.forEach(star => {
      star.classList.toggle('filled', parseInt(star.dataset.value) <= parseInt(ratingInput.value));
      
      star.onclick = () => {
        const rating = parseInt(star.dataset.value);
        ratingInput.value = rating;
        stars.forEach(s => s.classList.toggle('filled', parseInt(s.dataset.value) <= rating));
      };
    });
  
    // Set up cancel button
    form.querySelector('.cancel-button').onclick = () => {
      onCancel();
    };

    // Set up delete button if provided
    if (onDelete) {
      form.querySelector('.delete-button').onclick = () => {
        onDelete();
      };
    }
  
    return form;
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
        form.title_sv.value = game.title_sv || "";
        form.description_sv.value = game.description_sv || "";
        form.description_en.value = game.description_en || "";
        form.min_players.value = game.min_players || "";
        form.max_players.value = game.max_players || "";
        form.play_time.value = game.play_time || "";
        form.age.value = game.age || "";
        form.tags.value = Array.isArray(game.tags) ? game.tags.join(", ") : (game.tags || "");
        form.img.value = game.img || "";
        form.rules.value = game.rules || "";
        form.slow_day_only.checked = game.slow_day_only || false;
        form.trusted_only.checked = game.trusted_only || false;
        form.members_only.checked = game.members_only || false;
        
        // Set condition rating
        const rating = game.condition_rating || 0;
        document.querySelectorAll('.star').forEach(star => {
            star.classList.toggle('filled', parseInt(star.dataset.value) <= rating);
        });
        document.getElementById('condition_rating').value = rating;
    } else {
        // Adding new game
        title.textContent = "Lägg till nytt spel";
        form.reset();
        editingIndex.value = "";
        document.querySelectorAll('.star').forEach(star => star.classList.remove('filled'));
        document.getElementById('condition_rating').value = "0";
    }

    modal.style.display = "flex";
}

// Make openModal available globally
window.openModal = openModal;

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        title_sv: document.getElementById("title_sv").value.trim(),
        title_en: document.getElementById("title_en").value.trim(),
        description_sv: document.getElementById("description_sv").value.trim(),
        description_en: document.getElementById("description_en").value.trim(),
        min_players: parseInt(document.getElementById("min_players").value.trim()),
        max_players: parseInt(document.getElementById("max_players").value.trim()),
        play_time: parseInt(document.getElementById("play_time").value.trim()),
        age: parseInt(document.getElementById("age").value.trim()),
        tags: document.getElementById("tags").value.trim().split(",").map(tag => tag.trim()),
        img: document.getElementById("img").value.trim(),
        rules: document.getElementById("rules").value.trim(),
        slow_day_only: document.getElementById("slow_day_only").checked,
        trusted_only: document.getElementById("trusted_only").checked,
        members_only: document.getElementById("members_only").checked,
        condition_rating: parseInt(document.getElementById("condition_rating").value),
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
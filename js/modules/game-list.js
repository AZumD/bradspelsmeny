import { getCurrentLang, getCurrentCategory, getTranslation, setCurrentCategory } from './i18n.js';
import { getCurrentLocation } from './location.js';
import { isFavorite, isWishlisted, toggleFavorite, toggleWishlist } from './user-lists.js';
import { showError } from './ui.js';
import { API_ENDPOINTS } from './config.js';
import { fetchWithAuth } from './auth.js';
import { createEditableGameForm } from './game-form.js';


export function renderCategories() {
    const categoryBadges = document.getElementById('categoryBadges');
    if (!categoryBadges) return;

    categoryBadges.innerHTML = '';
    const categories = Object.entries(getTranslation('categories'));
    
    categories.forEach(([key, label]) => {
        const badge = document.createElement('button');
        badge.className = 'category-badge';
        if (key === getCurrentCategory()) {
            badge.classList.add('active');
        }
        badge.textContent = label;
        badge.onclick = () => {
            document.querySelectorAll('.category-badge').forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            setCurrentCategory(key);
            renderGames();
        };
        categoryBadges.appendChild(badge);
    });
}

export function renderIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return;
    intro.textContent = getTranslation('intro');
}


export function renderGameList(games, onSave, onDelete) {
  const container = document.getElementById('gameList');
  if (!container) return;
  
  container.innerHTML = '';

  games.forEach(game => {
    const wrapper = document.createElement('div');
    wrapper.className = 'game-item';

    const header = document.createElement('div');
    header.className = 'game-header';
    header.textContent = game.title_sv || game.title_en || 'Untitled Game';
    wrapper.appendChild(header);

    const content = document.createElement('div');
    content.className = 'game-content';
    wrapper.appendChild(content);

    let isExpanded = false;

    header.onclick = () => {
      if (isExpanded) {
        content.innerHTML = '';
        content.style.display = 'none';
        isExpanded = false;
      } else {
        const form = createEditableGameForm(game, async (updatedGame) => {
          await onSave(updatedGame);
          header.textContent = updatedGame.title_sv || updatedGame.title_en || 'Untitled Game';
          content.innerHTML = '';
          content.style.display = 'none';
          isExpanded = false;
        }, () => {
          content.innerHTML = '';
          content.style.display = 'none';
          isExpanded = false;
        }, async () => {
          if (onDelete && confirm("Är du säker på att du vill ta bort detta spel?")) {
            await onDelete(game.id);
            wrapper.remove();
          }
        });

        content.appendChild(form);
        content.style.display = 'block';
        isExpanded = true;
      }
    };

    container.appendChild(wrapper);
  });
}


export async function renderGames() {
    const gameList = document.getElementById('gameList');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchBar = document.getElementById('searchBar');
    const categoryHeading = document.getElementById('categoryHeading');

    if (!gameList || !loadingSpinner) {
        console.error('Required DOM elements not found');
        return;
    }

    try {
        loadingSpinner.style.display = 'block';
        gameList.innerHTML = '';

        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const category = getCurrentCategory();
        const location = getCurrentLocation();

        // Use public endpoint for non-logged-in users
        const userToken = localStorage.getItem('accessToken');
        const endpoint = userToken ? API_ENDPOINTS.GAMES : API_ENDPOINTS.GAMES_PUBLIC;
        const response = await fetch(`${endpoint}?location=${location}`);
        if (!response.ok) throw new Error('Failed to fetch games');

        const games = await response.json();
        if (!Array.isArray(games)) {
            throw new Error('Invalid games data received');
        }
        
        // Filter games based on search and category
        const filteredGames = games.filter(game => {
            if (!game || typeof game !== 'object') return false;
            
            const name = game.name || game.title_en || '';
            const tags = game.tags ? game.tags.split(',').map(tag => tag.trim()) : [];
            
            const matchesSearch = name.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || tags.includes(category);
            return matchesSearch && matchesCategory;
        });

        // Update category heading
        if (categoryHeading) {
            categoryHeading.textContent = getTranslation(`categories.${category}`);
        }

        // Render filtered games
        filteredGames.forEach(game => {
            const gameCard = createGameCard(game);
            gameList.appendChild(gameCard);
        });

        // Bind order buttons after games are rendered
        bindOrderButtons();
    } catch (error) {
        console.error('Error rendering games:', error);
        showError('Failed to load games');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function createGameCard(game) {
    if (!game || typeof game !== 'object') {
        throw new Error('Invalid game data');
    }

    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gameId = game.id;

    const thumbnailWrapper = document.createElement('div');
    thumbnailWrapper.className = 'game-thumbnail-wrapper';

    const img = document.createElement('img');
    img.src = game.img || 'img/placeholder.webp';
    img.alt = game.title_sv || game.title_en || 'Game';
    thumbnailWrapper.appendChild(img);

    const icons = document.createElement('div');
    icons.className = 'game-card-icons';

    const favBtn = document.createElement('button');
    favBtn.className = `icon-btn ${isFavorite(game.id) ? 'icon-fav-on' : 'icon-fav-off'}`;
    favBtn.onclick = async (e) => {
        e.stopPropagation();
        const currentState = isFavorite(game.id);
        const success = await toggleFavorite(game.id, currentState);
        if (success) {
            favBtn.className = `icon-btn ${!currentState ? 'icon-fav-on' : 'icon-fav-off'}`;
        }
    };

    const wishBtn = document.createElement('button');
    wishBtn.className = `icon-btn ${isWishlisted(game.id) ? 'icon-wish-on' : 'icon-wish-off'}`;
    wishBtn.onclick = async (e) => {
        e.stopPropagation();
        const currentState = isWishlisted(game.id);
        const success = await toggleWishlist(game.id, currentState);
        if (success) {
            wishBtn.className = `icon-btn ${!currentState ? 'icon-wish-on' : 'icon-wish-off'}`;
        }
    };

    icons.appendChild(favBtn);
    icons.appendChild(wishBtn);
    thumbnailWrapper.appendChild(icons);

    const info = document.createElement('div');
    info.className = 'game-info';

    const title = document.createElement('h3');
    title.textContent = game.title_sv || game.title_en || 'Untitled Game';
    info.appendChild(title);

    const description = document.createElement('p');
    description.textContent = game.description_sv || game.description_en || 'No description available.';
    info.appendChild(description);

    const details = document.createElement('p');
    details.innerHTML = `
        ${getTranslation('ui.players')}: ${game.min_players || '-'}-${game.max_players || '-'}<br>
        ${getTranslation('ui.play_time')}: ${game.play_time || '-'} min<br>
        ${getTranslation('ui.age')}: ${game.age || '-'}+
    `;
    info.appendChild(details);

    const orderBtn = document.createElement('button');
    orderBtn.className = 'order-button';
    orderBtn.textContent = getTranslation('ui.order_to_table');
    orderBtn.onclick = () => showOrderModal(game);
    info.appendChild(orderBtn);

    card.appendChild(thumbnailWrapper);
    card.appendChild(info);

    return card;
}

function showOrderModal(game) {
    const modal = document.getElementById('orderModal');
    const title = document.getElementById('orderGameTitle');
    if (!modal || !title) return;

    title.textContent = `Order ${game.name || game.title_en || 'Game'}`;
    modal.style.display = 'flex';
}

function bindOrderButtons() {
    const buttons = document.querySelectorAll(".order-button");
    buttons.forEach(button => {
        button.addEventListener("click", (e) => {
            const userData = localStorage.getItem("userData");
            const gameCard = e.target.closest(".game-card");
            const gameId = gameCard.dataset.gameId;

            const modal = document.getElementById("orderModal");
            const userFields = document.getElementById("userFields");
            const notice = document.getElementById("loggedInNotice");
            const orderForm = document.getElementById("orderForm");

            orderForm.reset();
            modal.dataset.gameId = gameId;

            if (userData) {
                if (userFields) {
                    userFields.style.display = "none";
                    // disable all inputs and selects inside userFields
                    const inputs = userFields.querySelectorAll("input, select");
                    inputs.forEach(input => input.disabled = true);
                }
                if (notice) notice.style.display = "block";
            } else {
                if (userFields) {
                    userFields.style.display = "block";
                    // enable all inputs and selects inside userFields
                    const inputs = userFields.querySelectorAll("input, select");
                    inputs.forEach(input => input.disabled = false);
                }
                if (notice) notice.style.display = "none";
            }

            modal.style.display = "flex";
        });
    });
} 
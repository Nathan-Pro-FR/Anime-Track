import { myAnimes, setMyAnimes } from './config.js';
import { saveAndRender } from './dom.js';

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let debounceTimer;

// Initialisation des écouteurs de la recherche
export function initSearch() {
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();
        if (query.length < 3) { searchResults.style.display = 'none'; return; }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=6`);
                const data = await response.json();
                displaySearchResults(data.data);
            } catch (error) { console.error("Erreur API:", error); }
        }, 400);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-input') && !e.target.closest('#search-results')) {
            searchResults.style.display = 'none';
        }
    });
}

function displaySearchResults(animes) {
    searchResults.innerHTML = '';
    if (!animes || animes.length === 0) { searchResults.style.display = 'none'; return; }

    animes.forEach(anime => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="">
            <div class="info-box">
                <span class="title">${anime.title}</span>
                <span class="meta">${anime.type || 'TV'} • ${anime.episodes || '?'} éps</span>
            </div>
        `;
        div.onclick = () => addAnime(anime);
        searchResults.appendChild(div);
    });
    searchResults.style.display = 'block';
}

function addAnime(apiAnime) {
    if (myAnimes.some(a => a.id === apiAnime.mal_id)) { alert("Anime déjà ajouté."); return; }

    const newAnime = {
        id: apiAnime.mal_id,
        title: apiAnime.title,
        image: apiAnime.images.jpg.image_url,
        synopsis: apiAnime.synopsis || "Pas de synopsis.",
        status: "Pas commencé",
        rating: 0,
        currentEpisode: 0,
        totalEpisodes: apiAnime.episodes || 12,
        notes: "",
        addedAt: Date.now()
    };

    myAnimes.push(newAnime);
    saveAndRender();
    searchInput.value = '';
    searchResults.style.display = 'none';
}
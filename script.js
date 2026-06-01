let myAnimes = JSON.parse(localStorage.getItem('myAnimesPro')) || [];
let currentLayout = 'grid';

// Objet temporaire pour mémoriser quels blocs de notes sont actuellement ouverts par l'utilisateur
const openedNotesBlocks = {};

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const animeListContainer = document.getElementById('anime-list');

const statusColors = {
    "Pas commencé": "var(--color-pas-commence)",
    "En cours": "var(--color-en-cours)",
    "Vu": "var(--color-vu)",
    "En pause": "var(--color-en-pause)",
    "Abandonné": "var(--color-abandonne)"
};

// --- LOGIQUE API JIKAN ---
let debounceTimer;
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

// --- COMPTEURS INCREMENTAUX ANIMÉS ---
function animateCounter(id, targetValue, isFloat = false) {
    const el = document.getElementById(id);
    if (!el) return;
    const startValue = parseFloat(el.innerText) || 0;
    if (startValue === targetValue) return; // Évite de relancer l'animation inutilement
    
    const duration = 600;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = progress * (2 - progress);
        const currentValue = startValue + (targetValue - startValue) * easeProgress;

        el.innerText = isFloat ? currentValue.toFixed(1) : Math.floor(currentValue);

        if (progress < 1) window.requestAnimationFrame(step);
        else el.innerText = isFloat ? targetValue.toFixed(1) : targetValue;
    }
    window.requestAnimationFrame(step);
}

function updateDashboard() {
    animateCounter('stat-total', myAnimes.length);
    animateCounter('stat-watching', myAnimes.filter(a => a.status === 'En cours').length);
    animateCounter('stat-completed', myAnimes.filter(a => a.status === 'Vu').length);

    const ratedAnimes = myAnimes.filter(a => a.rating > 0);
    const avg = ratedAnimes.length ? parseFloat((ratedAnimes.reduce((sum, a) => sum + a.rating, 0) / ratedAnimes.length).toFixed(1)) : 0.0;
    animateCounter('stat-average', avg, true);
}

// --- INTERRUPTEUR DE VUE LAYOUT ---
function switchView(view) {
    currentLayout = view;
    document.getElementById('view-grid-btn').classList.toggle('active', view === 'grid');
    document.getElementById('view-list-btn').classList.toggle('active', view === 'list');
    renderList();
}

// --- FONCTIONS LOGIQUES ET STOCKAGE ---
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

function updateEpisode(id, increment) {
    myAnimes = myAnimes.map(anime => {
        if (anime.id === id) {
            let current = (anime.currentEpisode || 0) + increment;
            let total = anime.totalEpisodes || 12;

            if (current < 0) current = 0;
            if (current > total) current = total;

            let status = anime.status;
            if (current > 0 && status === "Pas commencé") status = "En cours";
            if (current === total && total > 0) status = "Vu";
            if (current === 0 && status === "En cours") status = "Pas commencé";

            return { ...anime, currentEpisode: current, status: status };
        }
        return anime;
    });
    
    // CORRECTION : Si le statut change à cause des épisodes, on doit réordonner/refiltrer, sinon un re-rendu ciblé suffit
    saveAndRender(); 
}

function changeTotalEpisodes(id, newTotal) {
    let total = parseInt(newTotal) || 0;
    if (total < 1) total = 1;

    myAnimes = myAnimes.map(anime => {
        if (anime.id === id) {
            let current = anime.currentEpisode || 0;
            if (current > total) current = total;
            let status = (current === total) ? "Vu" : anime.status;
            return { ...anime, totalEpisodes: total, currentEpisode: current, status: status };
        }
        return anime;
    });
    saveAndRender();
}

function changeStatus(id, newStatus) {
    myAnimes = myAnimes.map(anime => {
        if (anime.id === id) {
            let current = anime.currentEpisode || 0;
            if (newStatus === "Vu") current = anime.totalEpisodes || 12;
            if (newStatus === "Pas commencé") current = 0;
            return { ...anime, status: newStatus, currentEpisode: current };
        }
        return anime;
    });
    saveAndRender();
}

function changeRating(id, ratingValue) {
    myAnimes = myAnimes.map(a => a.id === id ? { ...a, rating: ratingValue } : a);
    saveAndRender(); // Nécessaire car impacte la note moyenne globale et le tri
}

function saveNotes(id, text) {
    myAnimes = myAnimes.map(anime => anime.id === id ? { ...anime, notes: text } : anime);
    localStorage.setItem('myAnimesPro', JSON.stringify(myAnimes));
    
    // Met à jour dynamiquement la couleur du bouton de note sans recharger la carte
    const btn = document.getElementById(`note-btn-${id}`);
    if (btn) {
        btn.classList.toggle('has-notes', text.trim().length > 0);
    }
}

function deleteAnime(id) {
    if (confirm("Supprimer cet anime de ta liste ?")) {
        myAnimes = myAnimes.filter(a => a.id !== id);
        if (openedNotesBlocks[id]) delete openedNotesBlocks[id];
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('myAnimesPro', JSON.stringify(myAnimes));
    renderList();
}

// --- ALGORITHMES DE RENDU ET INJECTION DOM ---
function renderList() {
    updateDashboard();
    animeListContainer.innerHTML = '';

    if (currentLayout === 'list') animeListContainer.classList.add('list-view');
    else animeListContainer.classList.remove('list-view');

    const activeFilter = document.getElementById('filter-status').value;
    const activeSort = document.getElementById('sort-by').value;

    let filteredList = myAnimes.filter(anime => activeFilter === "Tous" || anime.status === activeFilter);

    filteredList.sort((a, b) => {
        if (activeSort === 'rating-desc') return b.rating - a.rating;
        if (activeSort === 'rating-asc') return a.rating - b.rating;
        if (activeSort === 'title-asc') return a.title.localeCompare(b.title);
        return b.addedAt - a.addedAt;
    });

    if (filteredList.length === 0) {
        animeListContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:60px 0;"><i class="fa-solid fa-folder-open" style="font-size:3rem; margin-bottom:15px; display:block;"></i>Aucun anime trouvé.</div>`;
        return;
    }

    filteredList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';

        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            let fillPercent = 0;
            if (anime.rating >= i) fillPercent = 100;
            else if (anime.rating === i - 0.5) fillPercent = 50;

            starsHTML += `<div class="star-item" style="background: linear-gradient(90deg, var(--star-color) ${fillPercent}%, #374151 ${fillPercent}%);" onclick="handleStarClick(${anime.id}, ${i}, event)"></div>`;
        }

        const currentBadgeColor = statusColors[anime.status] || "gray";
        const currentEp = anime.currentEpisode || 0;
        const totalEp = anime.totalEpisodes || 12;
        const userNotes = anime.notes || "";
        
        // CORRECTION : Restaure l'état d'ouverture de la boîte de note enregistré
        const isNotesDisplayBlock = openedNotesBlocks[anime.id] ? 'display: block;' : 'display: none;';

        card.innerHTML = `
                <div class="anime-cover-wrapper">
                    <span class="status-badge-pill" style="background:${currentBadgeColor}; color:#111;">${anime.status}</span>
                    <img src="${anime.image}" alt="">
                </div>
                <div class="anime-content">
                    <div class="anime-title" title="${anime.title}">${anime.title}</div>
                    <div class="anime-synopsis" onclick="this.classList.toggle('expanded')" title="Cliquez pour étendre">
                        ${anime.synopsis}
                    </div>
                    
                    <div class="episode-tracker">
                        <span class="episode-label">Progression</span>
                        <div class="episode-controls">
                            <button class="ep-btn" onclick="updateEpisode(${anime.id}, -1)">-</button>
                            <div class="episode-display">
                                <span>${currentEp}</span> / 
                                <input type="number" class="ep-total-input" value="${totalEp}" onchange="changeTotalEpisodes(${anime.id}, this.value)">
                            </div>
                            <button class="ep-btn" onclick="updateEpisode(${anime.id}, 1)">+</button>
                        </div>
                    </div>

                    <select class="status-select-custom" onchange="changeStatus(${anime.id}, this.value)">
                        <option value="Pas commencé" ${anime.status === 'Pas commencé' ? 'selected' : ''}>⏳ Pas commencé</option>
                        <option value="En cours" ${anime.status === 'En cours' ? 'selected' : ''}>👀 En cours</option>
                        <option value="Vu" ${anime.status === 'Vu' ? 'selected' : ''}>✅ Vu</option>
                        <option value="En pause" ${anime.status === 'En pause' ? 'selected' : ''}>⏸️ En pause</option>
                        <option value="Abandonné" ${anime.status === 'Abandonné' ? 'selected' : ''}>❌ Abandonné</option>
                    </select>

                    <div class="rating-block">
                        <div class="stars-container">${starsHTML}</div>
                        <span class="rating-value">${anime.rating} / 5</span>
                    </div>

                    <div class="actions-row">
                        <button class="notes-toggle-btn ${userNotes.trim() ? 'has-notes' : ''}" id="note-btn-${anime.id}" onclick="toggleNotesBlock(${anime.id})" title="Mon avis et commentaires">
                            <i class="fa-solid fa-comment-dots"></i>
                        </button>
                        <button class="btn delete-btn" onclick="deleteAnime(${anime.id})"><i class="fa-solid fa-trash-can"></i> <span>Retirer</span></button>
                    </div>

                    <div class="notes-container" id="notes-block-${anime.id}" style="${isNotesDisplayBlock}">
                        <div class="notes-header">
                            <span>Mon avis / Notes perso :</span>
                            <i class="fa-solid fa-pen-to-square"></i>
                        </div>
                        <textarea class="notes-textarea" placeholder="Ex: Arc 2 incroyable, chef d'oeuvre..." oninput="saveNotes(${anime.id}, this.value)">${userNotes}</textarea>
                    </div>
                </div>
            `;
        animeListContainer.appendChild(card);
    });
}

function handleStarClick(animeId, starIndex, event) {
    const rect = event.target.getBoundingClientRect();
    const isHalf = (event.clientX - rect.left) < (rect.width / 2);
    let finalRating = isHalf ? starIndex - 0.5 : starIndex;

    const current = myAnimes.find(a => a.id === animeId);
    if (current && current.rating === finalRating) finalRating = 0;

    changeRating(animeId, finalRating);
}

function toggleNotesBlock(id) {
    const block = document.getElementById(`notes-block-${id}`);
    if (!block) return;
    
    if (block.style.display === 'block') {
        block.style.display = 'none';
        openedNotesBlocks[id] = false;
    } else {
        block.style.display = 'block';
        openedNotesBlocks[id] = true;
    }
}

// --- ENTRÉES ET SORTIES EXPORT JSON / CSV ---
function exportData(format) {
    if (myAnimes.length === 0) return alert("Aucune donnée à exporter.");
    let dataStr = "";
    let filename = `mon_anime_tracker_${Date.now()}`;

    if (format === 'json') {
        dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(myAnimes, null, 2));
        filename += ".json";
    } else if (format === 'csv') {
        let csvContent = "id,title,status,rating,currentEpisode,totalEpisodes,notes,addedAt\n";
        myAnimes.forEach(a => {
            let safeTitle = a.title.replace(/"/g, '""');
            let safeNotes = (a.notes || "").replace(/"/g, '""').replace(/\n/g, ' ');
            csvContent += `${a.id},"${safeTitle}","${a.status}",${a.rating},${a.currentEpisode || 0},${a.totalEpisodes || 12},"${safeNotes}",${a.addedAt}\n`;
        });
        dataStr = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvContent);
        filename += ".csv";
    }

    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", filename);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

// CORRECTION : Prise en charge de l'import JSON OU de la détection CSV de base sécurisée
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop().toLowerCase();

    reader.onload = function (e) {
        try {
            if (extension === 'json') {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) { 
                    myAnimes = imported; 
                    saveAndRender(); 
                } else {
                    alert("Le fichier JSON n'a pas un format valide.");
                }
            } else if (extension === 'csv') {
                // Analyse basique d'un CSV exporté pour reconstruire le tableau d'objets
                const lines = e.target.result.split('\n');
                if (lines.length <= 1) return;
                
                const importedAnimes = [];
                for(let i = 1; i < lines.length; i++) {
                    if(!lines[i].trim()) continue;
                    
                    // Regex pour isoler les colonnes gérant les guillemets du CSV
                    const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
                    if (matches.length >= 6) {
                        importedAnimes.push({
                            id: parseInt(matches[0]),
                            title: matches[1].replace(/^"|"$/g, '').replace(/""/g, '"'),
                            status: matches[2].replace(/^"|"$/g, ''),
                            rating: parseFloat(matches[3]),
                            currentEpisode: parseInt(matches[4]),
                            totalEpisodes: parseInt(matches[5]),
                            notes: matches[6] ? matches[6].replace(/^"|"$/g, '').replace(/""/g, '"') : "",
                            addedAt: matches[7] ? parseInt(matches[7]) : Date.now()
                        });
                    }
                }
                if (importedAnimes.length > 0) {
                    myAnimes = importedAnimes;
                    saveAndRender();
                }
            } else {
                alert("Pour l'import, merci d'utiliser un fichier au format .json ou .csv.");
            }
        } catch (err) { 
            console.error(err);
            alert("Erreur lors de l'importation du fichier."); 
        }
    };
    reader.readAsText(file);
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-input') && !e.target.closest('#search-results')) {
        searchResults.style.display = 'none';
    }
});

// Lancement initial au chargement du script
renderList();

import { myAnimes, currentLayout, openedNotesBlocks, statusColors, setCurrentLayout, setMyAnimes } from './config.js';

const animeListContainer = document.getElementById('anime-list');

// --- SYSTÈME DE POPUPS : TOAST NOTIFICATION ---
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    
    let icon = '<i class="fa-solid fa-circle-info"></i>';
    let bgColor = '#5e72e4'; 
    if (type === 'success') { icon = '<i class="fa-solid fa-circle-check"></i>'; bgColor = '#0acf97'; }
    if (type === 'error') { icon = '<i class="fa-solid fa-circle-exclamation"></i>'; bgColor = '#fa5c7c'; }
    if (type === 'warning') { icon = '<i class="fa-solid fa-triangle-exclamation"></i>'; bgColor = '#ffaa00'; }

    toast.style.cssText = `
        background: #171725;
        color: #fff;
        padding: 14px 20px;
        border-radius: 10px;
        border-left: 4px solid ${bgColor};
        box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        min-width: 250px;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    toast.innerHTML = `<span style="color: ${bgColor}; font-size: 1.1rem; display: flex;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 50);

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => { toast.remove(); }, 300);
    }, 3500);
}

export function animateCounter(id, targetValue, isFloat = false) {
    const el = document.getElementById(id);
    if (!el) return;
    const startValue = parseFloat(el.innerText) || 0;
    if (startValue === targetValue) return;
    
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

export function updateDashboard() {
    animateCounter('stat-total', myAnimes.length);
    animateCounter('stat-watching', myAnimes.filter(a => a.status === 'En cours').length);
    animateCounter('stat-completed', myAnimes.filter(a => a.status === 'Vu').length);

    const ratedAnimes = myAnimes.filter(a => a.rating > 0);
    const avg = ratedAnimes.length ? parseFloat((ratedAnimes.reduce((sum, a) => sum + a.rating, 0) / ratedAnimes.length).toFixed(1)) : 0.0;
    animateCounter('stat-average', avg, true);
}

export function renderList() {
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

            starsHTML += `<div class="star-item" style="background: linear-gradient(90deg, var(--star-color) ${fillPercent}%, #374151 ${fillPercent}%);" data-id="${anime.id}" data-star="${i}"></div>`;
        }

        const currentBadgeColor = statusColors[anime.status] || "gray";
        const currentEp = anime.currentEpisode || 0;
        const totalEp = anime.totalEpisodes || 12;
        const userNotes = anime.notes || "";
        const isNotesDisplayBlock = openedNotesBlocks[anime.id] ? 'display: block;' : 'display: none;';

        card.innerHTML = `
            <div class="anime-cover-wrapper">
                <span class="status-badge-pill" style="background:${currentBadgeColor}; color:#111;">${anime.status}</span>
                <img src="${anime.image}" alt="">
            </div>
            <div class="anime-content">
                <div class="anime-title" title="${anime.title}">${anime.title}</div>
                <div class="anime-synopsis" title="Cliquez pour étendre">
                    ${anime.synopsis}
                </div>
                
                <div class="episode-tracker">
                    <span class="episode-label">Progression</span>
                    <div class="episode-controls">
                        <button class="ep-btn btn-minus" data-id="${anime.id}">-</button>
                        <div class="episode-display">
                            <span>${currentEp}</span> / 
                            <input type="number" class="ep-total-input" value="${totalEp}" data-id="${anime.id}">
                        </div>
                        <button class="ep-btn btn-plus" data-id="${anime.id}">+</button>
                    </div>
                </div>

                <select class="status-select-custom" data-id="${anime.id}">
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
                    <button class="notes-toggle-btn ${userNotes.trim() ? 'has-notes' : ''}" id="note-btn-${anime.id}" data-id="${anime.id}" title="Mon avis et commentaires">
                        <i class="fa-solid fa-comment-dots"></i>
                    </button>
                    <button class="btn delete-btn" data-id="${anime.id}"><i class="fa-solid fa-trash-can"></i> <span>Retirer</span></button>
                </div>

                <div class="notes-container" id="notes-block-${anime.id}" style="${isNotesDisplayBlock}">
                    <div class="notes-header">
                        <span>Mon avis / Notes perso :</span>
                        <i class="fa-solid fa-pen-to-square"></i>
                    </div>
                    <textarea class="notes-textarea" placeholder="Ex: Arc 2 incroyable..." data-id="${anime.id}">${userNotes}</textarea>
                </div>
            </div>
        `;
        
        card.querySelector('.anime-synopsis').addEventListener('click', (e) => e.currentTarget.classList.toggle('expanded'));
        card.querySelector('.btn-minus').addEventListener('click', () => updateEpisode(anime.id, -1));
        card.querySelector('.btn-plus').addEventListener('click', () => updateEpisode(anime.id, 1));
        card.querySelector('.ep-total-input').addEventListener('change', (e) => changeTotalEpisodes(anime.id, e.target.value));
        card.querySelector('.status-select-custom').addEventListener('change', (e) => changeStatus(anime.id, e.target.value));
        card.querySelectorAll('.star-item').forEach(star => {
            star.addEventListener('click', (e) => handleStarClick(anime.id, parseInt(star.dataset.star), e));
        });
        card.querySelector('.notes-toggle-btn').addEventListener('click', () => toggleNotesBlock(anime.id));
        card.querySelector('.notes-textarea').addEventListener('input', (e) => saveNotes(anime.id, e.target.value));
        card.querySelector('.delete-btn').addEventListener('click', () => deleteAnime(anime.id));

        animeListContainer.appendChild(card);
    });
}

export function saveAndRender() {
    localStorage.setItem('myAnimesPro', JSON.stringify(myAnimes));
    renderList();
}

function updateEpisode(id, increment) {
    const list = myAnimes.map(anime => {
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
    setMyAnimes(list);
    saveAndRender(); 
}

function changeTotalEpisodes(id, newTotal) {
    let total = parseInt(newTotal) || 0;
    if (total < 1) total = 1;

    setMyAnimes(myAnimes.map(anime => {
        if (anime.id === id) {
            let current = anime.currentEpisode || 0;
            if (current > total) current = total;
            return { ...anime, totalEpisodes: total, currentEpisode: current, status: (current === total) ? "Vu" : anime.status };
        }
        return anime;
    }));
    saveAndRender();
}

function changeStatus(id, newStatus) {
    setMyAnimes(myAnimes.map(anime => {
        if (anime.id === id) {
            let current = anime.currentEpisode || 0;
            if (newStatus === "Vu") current = anime.totalEpisodes || 12;
            if (newStatus === "Pas commencé") current = 0;
            return { ...anime, status: newStatus, currentEpisode: current };
        }
        return anime;
    }));
    saveAndRender();
}

function handleStarClick(animeId, starIndex, event) {
    const rect = event.target.getBoundingClientRect();
    const isHalf = (event.clientX - rect.left) < (rect.width / 2);
    let finalRating = isHalf ? starIndex - 0.5 : starIndex;

    const current = myAnimes.find(a => a.id === animeId);
    if (current && current.rating === finalRating) finalRating = 0;

    setMyAnimes(myAnimes.map(a => a.id === animeId ? { ...a, rating: finalRating } : a));
    saveAndRender();
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

function saveNotes(id, text) {
    setMyAnimes(myAnimes.map(anime => anime.id === id ? { ...anime, notes: text } : anime));
    localStorage.setItem('myAnimesPro', JSON.stringify(myAnimes));
    const btn = document.getElementById(`note-btn-${id}`);
    if (btn) btn.classList.toggle('has-notes', text.trim().length > 0);
}

// --- LOGIQUE DE SUPPRESSION PAR MODAL PERSO ---
function deleteAnime(id) {
    const modal = document.getElementById('custom-confirm-modal');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    const deleteBtn = document.getElementById('confirm-delete-btn');
    
    if (!modal) return;

    modal.style.display = 'flex';

    // Sécurité anti-doublons d'écouteurs de clics
    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

    cancelBtn.onclick = () => { modal.style.display = 'none'; };

    newDeleteBtn.onclick = () => {
        setMyAnimes(myAnimes.filter(a => a.id !== id));
        if (openedNotesBlocks[id]) delete openedNotesBlocks[id];
        saveAndRender();
        modal.style.display = 'none';
        showToast("L'anime a été retiré de votre liste.", "error");
    };
}
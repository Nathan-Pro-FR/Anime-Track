import { myAnimes, setMyAnimes, setCurrentLayout } from './config.js';
import { initSearch } from './api.js';
import { renderList, saveAndRender, showToast } from './dom.js'; // 👈 Import de showToast

// Initialisation globale au chargement
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    
    // Branchement des filtres globaux
    document.getElementById('filter-status').addEventListener('change', renderList);
    document.getElementById('sort-by').addEventListener('change', renderList);
    
    // Branchement du Layout Switcher
    document.getElementById('view-grid-btn').addEventListener('click', () => switchView('grid'));
    document.getElementById('view-list-btn').addEventListener('click', () => switchView('list'));

    // Branchement moderne de l'import/export
    document.getElementById('btn-export-json').addEventListener('click', () => exportData('json'));
    document.getElementById('btn-export-csv').addEventListener('click', () => exportData('csv'));
    document.getElementById('btn-trigger-import').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', importData);

    renderList();
});

function switchView(view) {
    setCurrentLayout(view);
    document.getElementById('view-grid-btn').classList.toggle('active', view === 'grid');
    document.getElementById('view-list-btn').classList.toggle('active', view === 'list');
    renderList();
}

function exportData(format) {
    if (myAnimes.length === 0) {
        return showToast("Aucune donnée à exporter.", "warning"); // 👈 Toast au lieu de l'alert
    }
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
    showToast("Données exportées !", "success");
}

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
                    setMyAnimes(imported); 
                    saveAndRender(); 
                    showToast("Données JSON importées avec succès !", "success"); // 👈 Toast de succès
                } else {
                    showToast("Le fichier JSON n'a pas un format valide.", "error"); // 👈 Toast au lieu de l'alert
                }
            } else if (extension === 'csv') {
                const lines = e.target.result.split('\n');
                if (lines.length <= 1) return;
                
                const importedAnimes = [];
                for(let i = 1; i < lines.length; i++) {
                    if(!lines[i].trim()) continue;
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
                    setMyAnimes(importedAnimes);
                    saveAndRender();
                    showToast("Données CSV importées avec succès !", "success"); // 👈 Toast de succès
                }
            }
        } catch (err) { 
            console.error(err);
            showToast("Erreur lors de l'importation du fichier.", "error"); // 👈 Toast au lieu de l'alert
        }
    };
    reader.readAsText(file);
}
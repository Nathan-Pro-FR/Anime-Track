// Stockage local de la liste d'animes et configuration du layout
export let myAnimes = JSON.parse(localStorage.getItem('myAnimesPro')) || [];
export let currentLayout = 'grid';

// Objet temporaire pour mémoriser les blocs de notes ouverts
export const openedNotesBlocks = {};

// Couleurs associées aux statuts
export const statusColors = {
    "Pas commencé": "var(--color-pas-commence)",
    "En cours": "var(--color-en-cours)",
    "Vu": "var(--color-vu)",
    "En pause": "var(--color-en-pause)",
    "Abandonné": "var(--color-abandonne)"
};

// Fonctions pour mettre à jour l'état depuis l'extérieur
export function setMyAnimes(newList) {
    myAnimes = newList;
}

export function setCurrentLayout(layout) {
    currentLayout = layout;
}
# 🎬 Anime Track

![GitHub release (latest by date)](https://img.shields.io/github/v/release/Nathan-Pro-FR/Anime-Track?color=71d87f&label=Version&style=for-the-badge)
![GitHub top language](https://img.shields.io/github/languages/top/Nathan-Pro-FR/Anime-Track?color=5e72e4&style=for-the-badge)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/Nathan-Pro-FR/Anime-Track?color=fa5c7c&style=for-the-badge)
![License](https://img.shields.io/github/license/Nathan-Pro-FR/Anime-Track?color=ffaa00&style=for-the-badge)

Une application web moderne, fluide et performante pour gérer, trier et suivre votre progression d'Animes en temps réel. Conçue avec une architecture modulaire en Vanilla JavaScript et un design sombre premium inspiré des tableaux de bord SaaS de pointe.

## 📖 Sommaire Global

* [1. ✨ Fonctionnalités Clefs](#1--fonctionnalités-clefs)
  * [I. 📊 Dashboard Analytique Dynamique](#i--dashboard-analytique-dynamique)
  * [II. 🎛️ Gestion et Layout de l'Affichage](#ii--gestion-et-layout-de-laffichage)
  * [III. 📝 Tracking Avancé & Notes Personnelles](#iii--tracking-avancé--notes-personnelles)
  * [IV. 🔒 Expérience Utilisateur UI/UX Premium](#iv--expérience-utilisateur-uiux-premium)
* [2. 📂 Architecture du Projet](#2--architecture-du-projet)
  * [I. Rôle des modules JavaScript](#i-rôle-des-modules-javascript)
* [3. 🎨 Guide des Styles & Design](#3--guide-des-styles--design)
  * [I. Palette de Couleurs Globale](#i-palette-de-couleurs-globale)
* [4. 🛠️ Installation et Démarrage](#4--installation-et-démarrage)
* [5. 🚀 Utilisation du Système de Popups](#5--utilisation-du-système-de-popups)
  * [1. Déclencher un Toast Flottant](#1-déclencher-un-toast-flottant)
  * [2. Fonctionnement de la Modal de Confirmation](#2-fonctionnement-de-la-modal-de-confirmation)
* [6. 📄 Licence](#6--licence)


## 1. ✨ Fonctionnalités Clefs

### I. 📊 Dashboard Analytique Dynamique
* **Compteurs Animés :** Suivi en temps réel du nombre total d'animes, des séries en cours de visionnage et des séries terminées.
* **Moyenne Intelligente :** Calcul automatique et dynamique de la moyenne globale de vos notes avec une précision à une décimale.

### II. 🎛️ Gestion et Layout de l'Affichage
* **Mode Grille (Grid View) :** Une vue immersive mettant en valeur les affiches des animes, idéale pour la découverte visuelle.
* **Mode Liste (Tableau Premium) :** Une vue compacte ultra-optimisée alignant les données sous forme de tableau responsive (Titre, Progression, Statut, Note, Actions).
* **Filtres et Tri :** Filtrage instantané par statut (*En cours, Vu, En pause, Abandonné, Pas commencé*) et tri avancé (par note croissante/décroissante, titre alphabétique ou date d'ajout).

### III. 📝 Tracking Avancé & Notes Personnelles
* **Gestionnaire d'Épisodes :** Incrémentation et décrémentation rapides avec ajustement intelligent et automatique du statut (ex: passer à *Vu* dès que le dernier épisode est atteint).
* **Notation par Étoiles :** Système de notation premium prenant en charge les **demi-étoiles** grâce à un calcul précis de la position du curseur.
* **Bloc de Notes Perso :** Zone de texte rétractable persistante permettant d'ajouter vos remarques, théories ou avis sur chaque œuvre.

### IV. 🔒 Expérience Utilisateur UI/UX Premium
* **Toasts de Notification Flottants :** Messages d'information interactifs dotés d'une animation physique fluide (effet d'élévation 3D et lueur diffuse colorée au survol).
* **Modal de Confirmation Personnalisée :** Remplacement des alertes de navigateur basiques par une boîte de dialogue modale élégante avec arrière-plan flouté (`backdrop-filter`) pour sécuriser les suppressions.
* **Persistance locale :** Sauvegarde automatique et transparente de l'intégralité de votre liste via l'API `localStorage`.


## 2. 📂 Architecture du Projet

Le projet applique une séparation stricte des concepts (**SoC**) en divisant le JavaScript en modules autonomes et réutilisables :

```tree
├── index.html          # Structure de base de l'application et squelette HTML
├── style.css           # Design global, variables CSS, animations & responsive
├── api.js              # API : Communication avec l'API Jikan pour la recherche d'animes
├── config.js           # Source de vérité : État global, constantes et configuration
├── dom.js              # Moteur de rendu : Manipulation du DOM, cartes, toasts et modals
└── app.js              # Chef d'orchestre : Initialisation et écouteurs d'événements globaux
```

### I. Rôle des modules JavaScript :

* **`config.js` :** Gère la structure de données des animes et exporte l'état (`myAnimes`). Il centralise également les configurations comme la palette de couleurs des statuts et fait le pont avec le stockage local.
* **`dom.js` :** Injecte et construit dynamiquement les cartes d'animes. Il contient la logique comportementale isolée (clics d'étoiles, calcul d'épisodes) ainsi que le cycle de vie visuel des Toasts et des Modals.
* **`app.js` :** Intercepte les événements de premier niveau (soumission du formulaire de recherche, changement des filtres principaux de la page, boutons d'export). C'est lui qui lance le premier rendu au chargement complet du DOM.
* **`api.js` :** Centralise les requêtes HTTP asynchrones. Il communique avec l'API publique Jikan (MyAnimeList) pour récupérer les métadonnées des animes (titres, images, synopsis, épisodes) de manière asynchrone avec un système d'anti-rebond (*debounce*).


## 3. 🎨 Guide des Styles & Design

L'interface repose sur une architecture CSS moderne utilisant massivement les **variables natives** (`:root`) pour assurer une cohérence visuelle parfaite.

### I. Palette de Couleurs Globale

| Élément / Statut | Code Hex / RGBA | Rendu Visuel |
| --- | --- | --- |
| **Fond Général** | `#0b0b0f` à `#14141f` | Dégradé sombre angulaire (135°) |
| **Arrière-plan Carte** | `#171725` | Couleur unie premium |
| **Accentuation (Hover)** | `#5e72e4` | Violet électrique |
| **Statut : En cours** | `#39b5ff` | Bleu ciel lumineux |
| **Statut : Vu** | `#0acf97` | Émeraude |
| **Statut : En pause** | `#ffaa00` | Ambre |
| **Statut : Abandonné** | `#fa5c7c` | Rose corail / Danger |


## 4. 🛠️ Installation et Démarrage

Puisque l'application utilise les modules JavaScript natifs d'ES6 (`import / export`), elle nécessite d'être exécutée à travers un serveur local pour des raisons de sécurité liées aux politiques CORS des navigateurs.

1. **Cloner le dépôt :**

```bash
git clone [https://github.com/Nathan-Pro-FR/Anime-Track.git](https://github.com/Nathan-Pro-FR/Anime-Track.git)
cd Anime-Track

```

2. **Lancer un serveur local :**

* Si vous utilisez **VS Code**, faites un clic droit sur `index.html` et sélectionnez **Open with Live Server**.
* Ou utilisez **Node.js** (`http-server`) :

```bash
npx http-server .
```
* Ou utilisez **Python** :
```bash
python -m http.server 8000
```

3. Ouvrez votre navigateur sur l'adresse locale fournie (ex: `http://localhost:8000`).


## 5. 🚀 Utilisation du Système de Popups

L'application expose des utilitaires globaux prêts à l'emploi au sein du module `dom.js` pour communiquer proprement avec l'utilisateur.

### 1. Déclencher un Toast Flottant
La fonction `showToast` accepte deux arguments : le message textuel et le type visuel (`info`, `success`, `warning`, `error`).

```javascript
import { showToast } from './dom.js';

// Exemples d'utilisation :
showToast("Série ajoutée avec succès !", "success");
showToast("Épisode décrémenté.", "info");
showToast("Une erreur est survenue lors de la recherche.", "error");

```

### 2. Fonctionnement de la Modal de Confirmation

La modal de suppression intercepte dynamiquement le clic d'un bouton, génère une barrière visuelle opaque floutée, et isole l'identifiant de la cible :

```javascript
// La modal nettoie ses propres écouteurs d'événements à chaque appel 
// pour éviter les fuites de mémoire et les déclenchements multiples.
deleteAnime(animeId);

```


## 6. 📄 Licence

Ce projet est sous licence MIT. Consultez le fichier [LICENSE](https://github.com/Nathan-Pro-FR/Anime-Track/blob/main/LICENSE) pour plus de détails.

---

Ménagé avec ❤️ pour les passionnés d'animation. Donnez une ⭐️ au projet si vous l'utilisez !



## Plan : Index des comparatifs + Sidebar dynamique

### 1. Nouvelle page `ComparesIndexPage.tsx` — route `/:lang/comparatifs`

Page d'index SEO listant tous les comparatifs disponibles. Structure :

- **Hero** : H1 "Comparatifs d'outils SaaS", sous-titre, badge "Expert Analysis"
- **Grille de cards** : une card par comparaison existante (8 statiques + comparatifs dynamiques populaires). Chaque card affiche les 2 logos outils côte à côte, les noms "X vs Y", les prix, un extrait du verdict, et un lien vers `/comparatif/slug-a-vs-slug-b`
- **Section "Créer un comparatif"** : sélecteur de 2 outils (combobox searchable) avec bouton "Comparer" qui redirige vers la route dynamique
- **SEO** : H1 unique, meta title/description, JSON-LD CollectionPage, hreflang FR/EN

### 2. Route dynamique universelle pour `ComparePage`

Modifier `ComparePage.tsx` pour accepter **n'importe quelle paire de slugs** (pas seulement les 8 hardcodées) :

- Garder `COMPARISONS[]` comme "featured" mais ne plus bloquer si le slugPair n'est pas dedans
- Parser `slugPair` → extraire `slugA` et `slugB` via split sur `-vs-`
- Chercher les 2 outils dans le catalogue par slug/id
- Si les 2 outils existent → afficher la comparaison dynamique complète
- Si un outil manque → redirect vers l'index `/comparatifs`

### 3. Sidebar fonctionnelle avec sélecteur d'outils

Refactorer `CompareSidebar.tsx` :

- **Catégories** : cliquer filtre la liste des comparaisons affichées (pas de navigation, juste un filtre local)
- **Outils sélectionnés** : afficher les 2 outils actuels avec bouton X pour retirer
- **Sélecteur "Ajouter un outil"** : ouvre un combobox/dropdown searchable avec tous les outils du catalogue. Sélectionner un outil redirige vers le nouveau comparatif `slugA-vs-slugB`
- **Liste "Tous les comparatifs"** : affiche les 8 featured + highlight l'actif

### 4. Routes et navigation

- `App.tsx` : ajouter `<Route path="comparatifs" element={<ComparesIndexPage />} />`
- `Navbar.tsx` : ajouter lien "Comparatifs" dans le méga-menu Ressources
- Sitemap : ajouter `/fr/comparatifs` et `/en/comparatifs`

### Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/pages/ComparesIndexPage.tsx` |
| Modifier | `src/pages/ComparePage.tsx` — accepter paires dynamiques |
| Modifier | `src/components/compare/CompareSidebar.tsx` — sélecteur fonctionnel |
| Modifier | `src/App.tsx` — nouvelle route |
| Modifier | `src/components/Navbar.tsx` — lien méga-menu |


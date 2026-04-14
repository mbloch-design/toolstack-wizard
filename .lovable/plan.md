

## Plan : Comparaisons EN + Nouvelles paires + Sitemap

### 1. Internationalisation de `ComparesIndexPage.tsx`

Le contenu est déjà bilingue via `t()` pour les textes principaux. Corrections à apporter :
- La fonction `getPrice()` retourne "Gratuit" en dur → utiliser `t("Gratuit", "Free")`
- Vérifier que tous les labels statiques utilisent bien `t()`

### 2. Nouvelles comparaisons featured

Ajouter 6 nouvelles paires pertinentes (dans les deux fichiers `COMPARISONS` / `FEATURED_COMPARISONS`) :

| Paire | Catégorie |
|-------|-----------|
| `slack-vs-teams` (slack vs confluence) | Communication — **Non**, plutôt `slack` vs un concurrent direct. Pas de "teams" dans le catalogue → **slack-vs-discord** non plus. Utiliser **notion-vs-coda** (notion vs airtable n'est pas mieux). |
| `figma-vs-canva` | Design |
| `linear-vs-jira` | Project Management |
| `notion-vs-airtable` | Productivity |
| `vercel-vs-replit` | Dev Platforms |
| `semrush-vs-similarweb` | Marketing/SEO |
| `stripe-vs-razorpay` | Payments |
| `slack-vs-front` | Communication |

→ 8 nouvelles paires (total : 16 featured)

### 3. Synchronisation des listes

Les arrays `COMPARISONS` et `FEATURED_COMPARISONS` existent en doublon dans `ComparePage.tsx` et `ComparesIndexPage.tsx`. Extraire dans un fichier partagé `src/data/comparisons.ts` pour éviter la désynchronisation.

### 4. Mise à jour du sitemap (`vite.config.ts`)

Ajouter les 8 nouvelles paires dans le tableau `COMPARISONS` du plugin sitemap pour indexation bilingue.

### Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/data/comparisons.ts` — liste centralisée |
| Modifier | `src/pages/ComparesIndexPage.tsx` — importer liste + fix i18n prix |
| Modifier | `src/pages/ComparePage.tsx` — importer liste centralisée |
| Modifier | `vite.config.ts` — ajouter nouvelles paires au sitemap |


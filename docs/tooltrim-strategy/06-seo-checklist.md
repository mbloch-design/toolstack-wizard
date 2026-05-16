# ToolTrim — Checklist SEO technique

> À valider pour chaque nouvelle page avant mise en ligne.

---

## 1. Meta tags

### Title

Format : `[Sujet principal] — [Bénéfice / angle] [Année] | ToolTrim`

| Type de page | Format | Exemple |
|-------------|--------|---------|
| Stack | `Stack [Persona] [Sous-profil] [Année] | ToolTrim` | `Stack Créateur Newsletter 2026 | ToolTrim` |
| Comparatif | `[A] vs [B] — Lequel choisir en [Année] ? | ToolTrim` | `Notion vs Airtable — Lequel choisir en 2026 ? | ToolTrim` |
| Outil | `[Nom] — Avis, prix et alternatives [Année] | ToolTrim` | `Notion — Avis, prix et alternatives 2026 | ToolTrim` |
| Guide | `[Objectif] — Guide complet [Année] | ToolTrim` | `Créer du contenu — Guide complet 2026 | ToolTrim` |
| Index | `[Sujet] — Comparer et choisir | ToolTrim` | `Comparatifs outils — Comparer et choisir | ToolTrim` |

**Limites :**
- Max 60 caractères (affiché en entier dans Google)
- Ne jamais dépasser 70 caractères

### Meta description

- 140–155 caractères
- Inclure le mot-clé principal
- Terminer par un appel à l'action implicite
- Pas de ponctuation de fin

**Exemples :**

```
Stack Newsletter Créateur : les outils qu'on utiliserait en 2026 pour créer, gérer et monétiser ta newsletter. Budget estimé : 89€/mois.

Notion vs Airtable en 2026 : on tranche. Notion gagne pour l'éditorial, Airtable pour les bases de données relationnelles. Verdict complet ici.
```

---

## 2. Structure HTML

- [ ] Un seul `<h1>` par page
- [ ] Hiérarchie H1 → H2 → H3 sans saut
- [ ] `<main>` wrapping le contenu principal
- [ ] `<nav>` avec `aria-label` pour breadcrumb et navigation principale
- [ ] `lang="fr"` sur `<html>`
- [ ] `<title>` et `<meta name="description">` présents

---

## 3. URLs

- [ ] Kebab-case uniquement (`notion-vs-airtable`, pas `Notion_vs_Airtable`)
- [ ] Pas de paramètres superflus dans l'URL canonique
- [ ] URL canonique définie (`<link rel="canonical">`)
- [ ] Redirects 301 configurés pour les variantes (`b-vs-a` → `a-vs-b`)
- [ ] Pas d'underscores dans les URLs

---

## 4. Images

- [ ] Attribut `alt` descriptif sur chaque image (pas `alt=""` sauf images décoratives)
- [ ] Format WebP préféré pour les photos/illustrations
- [ ] SVG pour les logos et icônes
- [ ] Nom de fichier descriptif (`notion-vs-airtable-comparatif.webp`, pas `img-1.png`)
- [ ] Dimensions `width` et `height` spécifiées (évite le layout shift)
- [ ] `loading="lazy"` sur les images below the fold

---

## 5. Liens

- [ ] Liens internes avec ancres descriptives (pas "cliquez ici")
- [ ] Liens externes : `rel="noopener noreferrer"` sur `target="_blank"`
- [ ] Liens affiliate/sponsorisés : `rel="sponsored"` + disclosure textuelle
- [ ] Pas de liens cassés (vérifier avant publication)

---

## 6. Schema.org (données structurées)

### Pages Stacks

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Stack Newsletter Créateur",
  "description": "La stack optimisée pour créer, gérer et monétiser une newsletter.",
  "dateModified": "2026-05-16",
  "author": {
    "@type": "Organization",
    "name": "ToolTrim"
  },
  "publisher": {
    "@type": "Organization",
    "name": "ToolTrim",
    "url": "https://tooltrim.com"
  }
}
```

### Pages Comparatifs

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Notion vs Airtable — Lequel choisir en 2026 ?",
  "description": "Comparatif éditorial Notion vs Airtable avec verdict, scores et recommandations.",
  "dateModified": "2026-05-16",
  "about": [
    { "@type": "SoftwareApplication", "name": "Notion" },
    { "@type": "SoftwareApplication", "name": "Airtable" }
  ]
}
```

### Pages Outils

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Notion",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Plan gratuit disponible"
  },
  "url": "https://notion.so"
}
```

### Breadcrumb (toutes les pages internes)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://tooltrim.com/fr" },
    { "@type": "ListItem", "position": 2, "name": "Comparatifs", "item": "https://tooltrim.com/fr/comparatifs" },
    { "@type": "ListItem", "position": 3, "name": "Notion vs Airtable" }
  ]
}
```

---

## 7. Performance (Core Web Vitals)

Cibles :

| Métrique | Cible | Critique |
|----------|-------|---------|
| LCP | < 2.5s | > 4.0s |
| INP | < 200ms | > 500ms |
| CLS | < 0.1 | > 0.25 |

Vérifications :
- [ ] Pas de `font-display: block` (utiliser `swap`)
- [ ] CSS critique inline ou preloaded
- [ ] JavaScript non critique : `defer` ou `async`
- [ ] Images above the fold : pas de `loading="lazy"`
- [ ] Pas de layout shift sur les logos ou images chargées async

---

## 8. Open Graph (réseaux sociaux)

```html
<meta property="og:title" content="Notion vs Airtable — Lequel choisir en 2026 ? | ToolTrim" />
<meta property="og:description" content="Comparatif éditorial avec verdict, scores et recommandations." />
<meta property="og:image" content="https://tooltrim.com/og/comparatif-notion-vs-airtable.png" />
<meta property="og:url" content="https://tooltrim.com/fr/comparatif/airtable-vs-notion" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
```

Image OG : 1200×630px, texte lisible, logo ToolTrim visible.

---

## 9. Sitemap XML

- [ ] `sitemap.xml` à la racine, soumis à Google Search Console
- [ ] Toutes les pages canoniques incluses
- [ ] `<lastmod>` = date de dernière modification réelle (pas la date de génération)
- [ ] Pages noindex exclues du sitemap
- [ ] Mise à jour du sitemap à chaque publication de page

---

## 10. Robots et crawl

- [ ] `robots.txt` : autoriser tous les bots sur les pages de contenu
- [ ] Bloquer `/api/`, `/_/`, `/admin/` si applicable
- [ ] Pages de test et pages vides : `noindex`
- [ ] Pagination : `rel="next"` / `rel="prev"` si applicable

---

## Checklist rapide pré-publication

```
[ ] Title < 60 caractères avec année
[ ] Meta description 140–155 caractères
[ ] H1 unique et contient le mot-clé principal
[ ] Canonical défini
[ ] Au moins 1 image avec alt text
[ ] Schema.org du bon type
[ ] OG image définie
[ ] Lien dans le sitemap
[ ] Pas de lien cassé (interne)
[ ] updatedAt mis à jour dans les données
```

---

_Dernière mise à jour : 2026-05-16_

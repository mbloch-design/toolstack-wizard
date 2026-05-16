# ToolTrim — Règles de maillage interne

> Stratégie de liens internes par type de page. Maximise le SEO et l'UX.

---

## Principes généraux

1. **Tout lien doit avoir une ancre descriptive** — jamais "cliquez ici" ou "en savoir plus"
2. **Lier vers le bas de la hiérarchie** (index → page) est prioritaire sur le contraire
3. **Lier vers le haut** (page → index) uniquement via breadcrumb
4. **Maximum 5–8 liens internes par page** (hors navigation et breadcrumb)
5. **Les liens doivent être contextuels** — ils apparaissent dans le texte, pas en liste d'URLs

---

## Matrice de maillage par type de page

### Page Index Stacks (`/fr/stacks`)

**Liens sortants :**
- → Pages stacks individuelles (via les cards)
- → Page guide par objectif (depuis le sidebar ou le CTA)
- → Page comparatifs index (lien contextuel dans l'intro)

**Liens entrants attendus :**
- ← Navbar
- ← Homepage (section CTA ou featured)
- ← Pages guides (section "Stacks recommandées")

---

### Page Stack individuelle (`/fr/stack/[id]`)

**Liens sortants :**
- → Pages outils (`/fr/outil/[slug]`) — depuis chaque outil de la stack (obligatoire)
- → Comparatifs liés — depuis la section "Comparer les outils de cette stack"
- → 2–3 stacks alternatives — depuis la section "Tu pourrais aussi regarder"
- → Guide de l'objectif principal — lien contextuel dans "Pourquoi cette stack"

**Exemple de liens pour "Stack Newsletter Créateur" :**
```
→ /fr/outil/beehiiv        (outil de la stack)
→ /fr/outil/notion         (outil de la stack)
→ /fr/outil/canva          (outil de la stack)
→ /fr/comparatif/beehiiv-vs-kit   (comparatif lié)
→ /fr/stack/createur-social-intermediaire  (alternative)
→ /fr/guide/creer-du-contenu    (guide objectif)
```

**Règle d'ancre :**
- Outil : "voir [Nom de l'outil]" ou le nom de l'outil directement
- Comparatif : "notre comparatif [A] vs [B]"
- Stack alternative : le titre de la stack
- Guide : "le guide complet [objectif]"

---

### Page Index Comparatifs (`/fr/comparatifs`)

**Liens sortants :**
- → Pages comparatifs individuelles (via les cards)
- → Pages outils des outils populaires (via les chips du VS module)

**Liens entrants attendus :**
- ← Navbar
- ← Homepage
- ← Pages outils (section "Comparer [Outil]")
- ← Pages stacks (section "Comparer les outils de cette stack")

---

### Page Comparatif individuel (`/fr/comparatif/[slug-pair]`)

**Liens sortants :**
- → Page outil A (`/fr/outil/[slug-a]`) — obligatoire
- → Page outil B (`/fr/outil/[slug-b]`) — obligatoire
- → 2–4 comparatifs similaires — depuis la section "À lire aussi"
- → 3–6 stacks utilisant ces outils — depuis la section dédiée
- → Site officiel de chaque outil (lien externe)

**Exemple de liens pour "Notion vs Airtable" :**
```
→ /fr/outil/notion          (obligatoire)
→ /fr/outil/airtable        (obligatoire)
→ /fr/comparatif/airtable-vs-coda    (similaire)
→ /fr/comparatif/notion-vs-obsidian  (similaire)
→ /fr/stack/consultant-ops-intermediaire  (stack utilisant les deux)
```

**Règle : comparatifs similaires**

Définition de "similaire" : même catégorie d'outil (productivity, marketing, dev...) ou même segment de marché.

Ne pas lier vers un comparatif non publié. Vérifier dans `FEATURED_COMPARISONS`.

---

### Page Outil (`/fr/outil/[slug]`)

**Liens sortants :**
- → Comparatifs impliquant cet outil (section "Comparer [Nom]")
- → 3–4 stacks utilisant cet outil (section "Dans les stacks ToolTrim")
- → 2–4 pages outils alternatives (section "Alternatives")
- → Site officiel de l'outil (lien externe, rel="noopener")

**Exemple de liens pour Notion :**
```
→ /fr/comparatif/airtable-vs-notion   (comparatif)
→ /fr/comparatif/notion-vs-obsidian   (comparatif)
→ /fr/stack/consultant-ops-intermediaire  (stack utilisant Notion)
→ /fr/outil/airtable       (alternative)
→ /fr/outil/coda           (alternative)
```

---

### Page Guide (`/fr/guide/[objectif]`)

**Liens sortants :**
- → 3–6 stacks recommandées (section dédiée)
- → 5–8 pages outils mentionnés dans le contenu
- → 2–3 comparatifs liés aux outils mentionnés
- → Index stacks (CTA final)

**Règle :** chaque outil mentionné dans le texte doit avoir un lien vers sa page outil.

---

## Règles d'ancres

### ✅ Formules acceptées

```
"notre comparatif Notion vs Airtable"
"la page de Notion"
"la stack Newsletter Créateur"
"le guide Créer du contenu"
"[Nom de l'outil]"           (le nom seul comme ancre)
"les stacks pour Créateurs"
```

### ❌ Formules interdites

```
"cliquez ici"
"en savoir plus"
"lire la suite"
"voir plus"
"ici"
"ce lien"
"notre page"    (sans préciser quoi)
```

---

## Breadcrumb (liens de navigation hiérarchique)

Structure obligatoire par type de page :

| Type | Breadcrumb |
|------|-----------|
| Stack individuelle | Accueil > Stacks > [Persona] > [Titre stack] |
| Comparatif | Accueil > Comparatifs > [A] vs [B] |
| Outil | Accueil > Outils > [Catégorie] > [Nom] |
| Guide | Accueil > Guides > [Objectif] |

Le breadcrumb compte comme lien interne mais n'est pas dans le quota 5–8.

---

## Liens entrants prioritaires (à construire)

Pages à fort potentiel d'entrée SEO — s'assurer qu'elles reçoivent des liens depuis les contenus pertinents :

| Page cible | Pages sources prioritaires |
|-----------|--------------------------|
| `/fr/comparatif/airtable-vs-notion` | Stacks utilisant Notion ou Airtable, pages outils des deux |
| `/fr/outil/notion` | Toutes les stacks incluant Notion, comparatifs Notion |
| `/fr/stacks` | Homepage, guides, toutes les pages internes |
| `/fr/comparatifs` | Homepage, pages outils, stacks |
| `/fr/guide/creer-du-contenu` | Stacks Créateur, page index stacks |

---

## Suivi et audit du maillage

À vérifier trimestriellement :

```
[ ] Chaque page outil a au moins 2 liens entrants internes
[ ] Chaque comparatif a au moins 1 lien entrant depuis une stack ou outil
[ ] Aucune page "orpheline" (0 lien entrant, hors nav)
[ ] Aucun lien cassé (404) dans les liens internes
[ ] Les pages à fort volume de recherche ont le plus de liens entrants
```

---

_Dernière mise à jour : 2026-05-16_

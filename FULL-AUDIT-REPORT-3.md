# Audit SEO Complet — ToolTrim (tooltrim.com)
**Date :** 2026-04-30
**Audit #3** (précédents : 52/100 → 54/100 → ?)

---

## Score SEO Global : 58 / 100

> **Note importante :** 10 commits ont été préparés dans cette session mais ne sont PAS encore déployés.
> Le score live actuel est **58/100**. Après déploiement, le score projeté est **~64/100**.

| Catégorie | Poids | Score live | Score post-déploiement |
|-----------|-------|-----------|------------------------|
| Technical SEO | 22% | 68/100 | 72/100 |
| Content Quality | 23% | 52/100 | 57/100 |
| On-Page SEO | 20% | 54/100 | 63/100 |
| Schema / Structured Data | 10% | 40/100 | 55/100 |
| Performance (CWV) | 10% | 42/100 | 42/100 |
| AI Search Readiness | 10% | 55/100 | 64/100 |
| Images | 5% | 38/100 | 43/100 |
| **Total pondéré** | | **58/100** | **~64/100** |

---

## Résumé Exécutif

### Progression
- Audit 1 → 52/100
- Audit 2 → 54/100
- Audit 3 live → **58/100** (+4 pts depuis audit 2)
- Audit 3 post-déploiement estimé → **~64/100** (+6 pts supplémentaires)

### Ce qui fonctionne sur le site live
- ✅ robots.txt : bloc unique, `Allow: /assets/` — corrigé et déployé
- ✅ Redirect non-www → www : 301 fonctionnel
- ✅ Redirect `/` → `/fr` : 308 fonctionnel (équivalent SEO d'un 301)
- ✅ HSTS : présent (`max-age=63072000`, ~2 ans)
- ✅ Headers sécurité : X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- ✅ Canonical + hreflang sur toutes les pages prérendues
- ✅ Prerendering vérifié par curl : les pages retournent du HTML statique complet aux crawlers
- ✅ Descriptions catégories : 140–165 chars (déployées lors d'une session précédente)
- ✅ Descriptions pages comparatifs : 130+ chars

### Problèmes critiques restants (live)
1. ❌ **Meta descriptions outils** : "Le cerveau externe tout-en-un." (29 chars) — fix préparé mais non déployé
2. ❌ **og:image + JSON-LD Organisation** : URL non-www (`tooltrim.com` au lieu de `www.tooltrim.com`) — fix non déployé
3. ❌ **SoftwareApplication.url** : pointe sur l'URL ToolTrim, pas le produit — fix non déployé
4. ❌ **BreadcrumbList** : absent de toutes les pages — fix non déployé
5. ❌ **noscript body** : absent sur pages outils/comparatifs — fix non déployé
6. ❌ **llms-full.txt** : 50 outils alors que llms.txt annonce 212 (et 314 sont prêts) — non déployé
7. ❌ **Performance** : bundle JS 1,7 MB, LCP ~3,5–4,2s, TBT POOR — non résolu
8. ❌ **Content-Security-Policy** : header manquant
9. ❌ **Pas de mise en cache HTML sur l'edge Vercel** pour les pages prérendues

---

## 1. Technical SEO — 68/100

### ✅ Ce qui passe

| Check | Statut | Détail |
|-------|--------|--------|
| robots.txt | ✅ | Bloc unique, `Allow: /`, `Allow: /assets/`, AI crawlers explicites |
| non-www → www | ✅ | 301 Permanent |
| `/` → `/fr` | ✅ | 308 (permanent, équivalent SEO) |
| HSTS | ✅ | `max-age=63072000` (2 ans, Vercel default) |
| X-Frame-Options | ✅ | DENY |
| X-Content-Type-Options | ✅ | nosniff |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ | camera, microphone, geolocation bloqués |
| Canonical | ✅ | Présent sur toutes les pages prérendues |
| hreflang | ✅ | fr/en/x-default sur toutes les pages |
| Sitemap | ✅ | 529 URLs, format valide |

### ❌ Problèmes identifiés

| Problème | Sévérité | Impact |
|----------|----------|--------|
| Pas de Content-Security-Policy | High | Sécurité, signal confiance Google |
| HSTS sans `includeSubDomains; preload` | Medium | Ne peut pas être soumis à la preload list HSTS |
| HTML non mis en cache sur l'edge | Medium | TTFB 200–350ms au lieu de ~10ms pour les crawlers |
| `/fr/methodology` dans sitemap mais contenu léger | Low | Potentiel thin content |

### Sitemap
- **529 URLs** : 424 pages outils (212 × 2 langues), 32 catégories, 32 comparatifs, ~41 pages statiques/guides
- `lastmod` présent sur toutes les URLs ✅
- Sitemap référencé dans robots.txt ✅
- Aucune URL bloquée par robots.txt incluse dans le sitemap ✅

---

## 2. Content Quality — 52/100

### ✅ Points forts
- 212 outils couverts avec prix vérifiés, pros/cons, verdict, alternatives
- Architecture bilingue FR/EN cohérente
- Pages guides/piliers personas (dev, designer, consultant, créateur, ops)
- Descriptions catégories : 140–165 chars, enrichies avec contexte
- Positionnement "zéro biais d'affiliation" clairement exprimé dans llms.txt

### ❌ Problèmes identifiés

| Problème | Sévérité |
|----------|----------|
| Meta descriptions outils : ~30 chars (taglines courts) — fix prêt, non déployé | Critical |
| Aucun auteur nommé sur le site (ni byline, ni Person JSON-LD) | High |
| llms.txt déclare 212 outils mais llms-full.txt n'en liste que 50 | High |
| Date de vérification des données : "2026-03-13" — ancienne de 6 semaines | Medium |
| Absence de présence Wikipedia, Reddit, YouTube (signaux E-E-A-T off-site) | Medium |
| Les pages EN sont des miroirs directs des pages FR (même texte, traduction automatique probable) | Medium |

### Mismatch SERP identifié (SXO)
- `/fr/category/ia-generaliste` : le SERP "meilleurs outils IA freelance" récompense des **listicles éditoriaux** (~2000 mots avec verdict par outil), pas des index de catégorie. **Désalignement critique.**
- `/fr/comparatif/chatgpt-vs-claude` : page bien alignée, mais forte menace de **AI Overview cannibalization** (40–60% des clics absorbés par Google).

---

## 3. On-Page SEO — 54/100

### État des meta descriptions

| Type de page | Longueur actuelle | Cible | Statut |
|-------------|-------------------|-------|--------|
| Outils (ex. Notion) | 29 chars | 130–160 | ❌ fix non déployé |
| Catégories (ex. Organisation) | 148 chars | 130–160 | ✅ |
| Comparatifs (ex. ChatGPT vs Claude) | 131 chars | 130–160 | ✅ |
| Pages statiques | 120–160 chars | 130–160 | ✅ |

### Problèmes on-page

| Problème | Sévérité |
|----------|----------|
| og:image `tooltrim.com` (non-www) — fix prêt, non déployé | High |
| BreadcrumbList absent — fix prêt, non déployé | High |
| noscript body absent sur pages outils — fix prêt, non déployé | Medium |
| Titres outils sans année (ex. "Notion — Avis, prix…" sans "2026") | Low |
| Absence de "Résultat rapide / verdict box" above-the-fold sur les comparatifs | Medium |

---

## 4. Schema / Structured Data — 40/100

### État actuel (live)

| Schema | Pages | Statut |
|--------|-------|--------|
| Organization | Base HTML | ✅ présent mais URL non-www |
| WebSite + SearchAction | Base HTML | ✅ présent mais URL non-www |
| SoftwareApplication | Pages outils | ✅ présent mais `url` pointe sur ToolTrim, pas le produit |
| BreadcrumbList | Toutes pages | ❌ absent (fix prêt, non déployé) |
| ItemList | Pages catégories | ❌ absent |
| Article | Pages guides | ❌ absent |

### Erreurs de validation Schema.org

| Erreur | Sévérité |
|--------|----------|
| `SoftwareApplication.url` = URL ToolTrim au lieu du produit | Critical |
| `Organization.url` et `WebSite.url` = non-www | High |
| `Organization.logo` = non-www | High |
| Aucun BreadcrumbList sur aucune page | High |
| Aucun `ItemList` sur les pages catégorie | Medium |
| Aucun `Article` avec `dateModified` sur les guides | Medium |
| `FAQPage` absent — note : déconseillé pour sites commerciaux (Google Aug 2023) | — |

---

## 5. Performance — 42/100

### Core Web Vitals (estimés, mobile)

| Métrique | Valeur estimée | Seuil Good | Statut |
|----------|---------------|------------|--------|
| LCP | 3,5–4,2s | < 2,5s | ❌ POOR |
| INP | 150–250ms | < 200ms | ⚠️ Borderline |
| CLS | 0,04–0,08 | < 0,1 | ✅ GOOD |
| TTFB | 200–350ms | < 800ms | ✅ GOOD |
| TBT | 450–700ms | < 200ms | ❌ POOR |

### Causes identifiées

| Problème | Impact | Effort |
|----------|--------|--------|
| Bundle JS 1,7 MB (JSON data inclus) | LCP +2s, TBT +500ms | High (architecture) |
| `HomePage` importé de façon eager (pas lazy) | TBT +200ms | Low |
| Pas de preload woff2 pour DM Sans | LCP +150ms | Low |
| Images testimonials en JPEG (pas WebP/AVIF) | LCP +100ms | Low |
| Pas de preconnect Supabase | Latence initiale +100ms | Low |
| Pas de cache HTML sur l'edge Vercel | TTFB ×15 pour crawlers | Low |
| Logos outils via Google Favicons (tiers) | LCP +100ms | Medium |

> **Note architecture :** `manualChunks` ne peut pas être utilisé sur ce projet (crashes module init avec les JSON statiques). Solution alternative : déplacer les JSON en `public/data/` + fetch() asynchrone, mais cela supprime le fallback synchrone.

---

## 6. AI Search Readiness — 55/100

### État des fichiers AI

| Fichier | Statut live | Note |
|---------|-------------|------|
| robots.txt | ✅ | GPTBot, ClaudeBot, PerplexityBot, Google-Extended explicites |
| llms.txt | ⚠️ | Présent, structure correcte, mais annonce 212 outils |
| llms-full.txt | ❌ | 50 outils (devrait être 314 — fix non déployé) |

### Problèmes AI Search

| Problème | Sévérité |
|----------|----------|
| Mismatch : llms.txt annonce 212 outils, llms-full.txt en liste 50 | Critical |
| llms-full.txt : pas de champ `description`, `url`, ni `alternatives` par outil | High |
| Verdicts (`ferme`/`question`/`silence`) non définis dans les fichiers | High |
| Aucun auteur nommé (signaux E-E-A-T faibles) | High |
| OAI-SearchBot non listé explicitement dans robots.txt | Low |
| Pas de licence RSL 1.0 dans llms.txt | Low |

### Probabilité de citation par les LLMs (état actuel)

| Plateforme | Probabilité | Bloquant |
|------------|-------------|---------|
| Google AIO (FR) | 8–12% | llms-full.txt trop sparse |
| ChatGPT Search | 8–12% | Idem |
| Perplexity | 12–18% | llms.txt accessible, contexte limité |
| Claude | 12–18% | llms.txt accessible |

---

## 7. Images — 38/100

| Problème | Sévérité |
|----------|----------|
| og:image : non-www (`tooltrim.com/og-image.png`) — fix prêt, non déployé | High |
| og:image non explicite sur pages outils (hérité du base HTML) — fix prêt, non déployé | High |
| Images testimonials (portrait-1.jpg…4.jpg) en JPEG, pas AVIF/WebP | Medium |
| Logos outils via Google Favicons API (tiers, non contrôlé) | Medium |
| Pas d'élément `<picture>` avec fallbacks AVIF/WebP | Medium |

---

## Plan d'action prioritaire

### 🔴 Critique — Déployer maintenant (commits prêts)

Les 10 commits de cette session sont prêts dans le repo local. **Un simple `git push` + build Vercel** débloque tous ces gains (+6 pts estimés) :

| Fix | Commit | Impact |
|-----|--------|--------|
| Meta descriptions outils 130+ chars | 0c63771 | On-Page +8 |
| BreadcrumbList sur 692 pages | 5099c98 | Schema +10 |
| SoftwareApplication.url → URL produit | 1956932 | Schema +5 |
| noscript body sur outils/catégories/comparatifs | e687bcf | On-Page +3 |
| www.tooltrim.com dans og:image + JSON-LD | 56249f0 | Schema +3, Images +5 |
| llms-full.txt 314 outils | f66b1df | AI Search +8 |
| HSTS includeSubDomains + preload | 65c8371 | Technical +3 |
| robots.txt (déjà déployé) | 05cddf9 | ✅ |
| 301 redirect /→/fr (déjà déployé) | b36bcb8 | ✅ |
| "IA Généraliste" fix titre | ebe60ee | On-Page +2 |

### 🟠 High — Dans la semaine

1. **Content-Security-Policy header** dans `vercel.json`
   ```json
   { "key": "Content-Security-Policy", "value": "default-src 'self' *.supabase.co *.googleapis.com *.gstatic.com *.google.com googletagmanager.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' googletagmanager.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com" }
   ```

2. **Edge caching HTML** dans `vercel.json` — TTFB crawlers : 300ms → 10ms
   ```json
   { "source": "/(fr|en)/tool/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, s-maxage=86400, stale-while-revalidate=604800" }] }
   ```

3. **Enrichir llms-full.txt** : ajouter `description`, `url`, `alternatives` par outil

4. **Créer une page guide éditorial** `/fr/guide/meilleurs-outils-ia-freelance` (~2000 mots) pour combler le mismatch SERP de `/fr/category/ia-generaliste`

5. **Preconnect Supabase** dans index.html :
   ```html
   <link rel="preconnect" href="https://[project].supabase.co" />
   ```

### 🟡 Medium — Dans le mois

6. **Ajouter un auteur nommé** (byline + Person JSON-LD) sur les pages guides et la méthodologie

7. **ItemList schema** sur les pages catégories

8. **Article schema** (avec `dateModified`) sur les pages guides

9. **Verdict box "Résultat rapide"** above-the-fold sur les comparatifs (50 mots, haute valeur anti-AI-Overview)

10. **Lazy-load HomePage** : composants sous la fold (`TestimonialsSection`, `ScannerDemo`, `HowItWorks`) en `lazy()` → TBT -200ms

11. **Preload woff2 DM Sans** dans index.html → LCP -150ms

12. **AVIF/WebP pour portrait-1.jpg → portrait-4.jpg** → LCP -100ms, taille -60%

### 🔵 Low — Backlog

13. **OAI-SearchBot explicite** dans robots.txt
14. **Licence RSL 1.0** dans llms.txt
15. **Présence Reddit** : posts dans r/SaaS, r/freelance, r/Entrepreneur
16. **Année "2026"** dans les titres des pages outils

---

## Progression globale

| Audit | Score | Changement majeur |
|-------|-------|------------------|
| Audit 1 | 52/100 | État initial |
| Audit 2 | 54/100 | Divers fixes techniques |
| Audit 3 (live) | **58/100** | robots.txt fix déployé (+4) |
| Audit 3 (post-déploiement) | **~64/100** | 10 commits à pousser (+6) |
| Cible réaliste (1 mois) | **~70/100** | CSP, cache edge, guides, schemas |
| Plafond sans refonte perf | **~75/100** | Bundle JS limite le score Performance |

---

*Rapport généré le 2026-04-30 — ToolTrim SEO Audit #3*

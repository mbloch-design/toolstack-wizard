# ToolTrim — Backlog éditorial et produit

> Liste vivante des tâches. Mettre à jour à chaque sprint.
> Dernière révision : 2026-05-16

---

## Légende

| Priorité | Label | Description |
|----------|-------|-------------|
| 🔴 | Critique | Bloque le lancement ou cause une régression |
| 🟠 | Haute | Impact direct sur la qualité ou le SEO |
| 🟡 | Moyenne | Amélioration notable, pas urgente |
| 🟢 | Basse | Nice-to-have, backlog long terme |
| 🚫 | À éviter | Décision prise de NE PAS faire |

---

## 🔴 Critique

### C1 — Créer `tools.ts` (Sprint 6)
**Pourquoi critique :** Les pages outils sont référencées partout (stacks, comparatifs) mais n'existent pas encore. Les StackTool.id ne sont pas validés contre un fichier source.

**Action :** Créer `src/data/tools.ts` avec les 50 outils les plus utilisés dans `stacks.ts`. Commencer par les outils avec `required: true`.

**Critères de done :**
- [ ] 50+ outils définis avec id, name, category, verdict, bestFor, alternatives
- [ ] Route `/fr/outil/[slug]` fonctionnelle
- [ ] Page listing `/fr/outils` avec filtre par catégorie

---

### C2 — Redirects pour comparatifs bidirectionnels
**Pourquoi critique :** `/fr/comparatif/notion-vs-airtable` doit rediriger vers `/fr/comparatif/airtable-vs-notion`. Sans ça, duplicate content et liens cassés.

**Action :** Implémenter dans le router (React Router) ou au niveau serveur (Vercel rewrites).

**Critères de done :**
- [ ] Toutes les variantes `b-vs-a` redirigent 301 vers `a-vs-b`
- [ ] Testé pour les 20+ comparatifs existants

---

### C3 — Sitemap XML
**Pourquoi critique :** Sans sitemap, Google découvre les pages au hasard. Freine l'indexation.

**Action :** Générer `sitemap.xml` au build (script Node.js ou plugin Vite). Inclure stacks, comparatifs, outils, guides.

**Critères de done :**
- [ ] `sitemap.xml` généré automatiquement à chaque build
- [ ] Soumis à Google Search Console
- [ ] `<lastmod>` = `updatedAt` de chaque entité

---

## 🟠 Haute priorité

### H1 — Enrichir comparisons.ts (20 → 50 paires)
**Contexte :** Seulement ~20 comparatifs éditoriaux dans `FEATURED_COMPARISONS`. L'index est pauvre.

**Action :** Ajouter 30 nouveaux comparatifs. Prioriser les paires à fort volume de recherche.

**Paires prioritaires :**
- notion-vs-confluence
- zapier-vs-make
- figma-vs-adobe-xd
- linear-vs-jira
- slack-vs-teams
- hubspot-vs-salesforce
- webflow-vs-framer
- clickup-vs-asana
- beehiiv-vs-substack
- cursor-vs-github-copilot

---

### H2 — Pages outils pour les 10 outils les plus utilisés
**Contexte :** Notion, Airtable, Figma, Canva, Zapier, Slack, Linear, Beehiiv, Webflow, Cursor sont mentionnés dans 20+ stacks.

**Action :** Créer les pages avec contenu éditorial complet (verdict, bestFor, alternatives, pricing).

---

### H3 — Meta tags sur toutes les pages existantes
**Contexte :** Stacks et comparatifs n'ont pas encore de meta title/description individuels.

**Action :** Ajouter `<title>` et `<meta name="description">` dynamiques dans chaque page React.

**Format attendu :** voir `06-seo-checklist.md` section 1.

---

### H4 — Schema JSON-LD sur les pages comparatifs et outils
**Contexte :** Rich results non exploités = CTR réduit.

**Action :** Ajouter BreadcrumbList + Article (comparatifs) + SoftwareApplication (outils).

---

### H5 — Données Open Graph pour partage social
**Contexte :** Partage sur LinkedIn/Twitter sans OG image = lien texte brut.

**Action :** Générer des OG images statiques pour chaque comparatif et outil. Format 1200×630px.

---

## 🟡 Priorité moyenne

### M1 — Section FAQ sur les pages comparatifs
**Contexte :** Les requêtes "est-ce que Notion est gratuit" ou "Airtable est-il meilleur que Notion" arrivent sur les pages comparatifs. Une FAQ répond à ces questions et améliore la densité de mots-clés.

**Note :** Ne pas utiliser `FAQPage` Schema (non recommandé hors gov/health). Structurer en H2/H3 pour les LLM uniquement.

---

### M2 — Filtres sur l'index outils (Sprint 6)
**Contexte :** Listing `/fr/outils` avec 100+ outils non filtrables = UX pauvre.

**Action :** Reprendre le système de facettes `sk-*` de StacksPage pour les outils. Facettes : Catégorie, Prix (Free/Payant), Persona recommandé.

---

### M3 — "Stack recommandée" par persona dans la navigation
**Contexte :** Un Créateur qui arrive sur le site ne sait pas par où commencer.

**Action :** Dropdown dans la nav principale avec les 6 personas → stack recommandée (`recommended: true` + persona).

---

### M4 — Tracking des pages vues et des clics sur comparatifs
**Contexte :** On ne sait pas quels comparatifs sont les plus consultés.

**Action :** Intégrer Plausible (privacy-first) ou Fathom. Tracker les clics sur le bouton "Comparer" du module VS.

---

### M5 — Révision trimestrielle du pricing des outils
**Contexte :** Les prix changent régulièrement (Notion, Airtable, Zapier ont tous augmenté en 2025).

**Action :** Créer un process de révision : script qui affiche tous les `updatedAt` > 90 jours + liste des outils à re-vérifier.

---

## 🟢 Basse priorité (backlog long terme)

### L1 — Version anglaise complète
**Contexte :** Le contenu EN existe (`titleEn`, `descriptionEn`) mais les pages EN ne sont pas stylées au même niveau.

**Action :** Passer en revue les pages `/en/stacks` et `/en/comparatifs` pour s'assurer de la parité avec FR.

---

### L2 — Système de notation communautaire
**Contexte :** Permettre aux visiteurs de noter les stacks (1–5 étoiles).

**Note :** Nécessite un backend. À évaluer selon la traction du site.

---

### L3 — Newsletter ToolTrim
**Contexte :** Capturer les emails des visiteurs pour fidéliser.

**Action :** Intégrer Beehiiv ou Kit (ConvertKit). CTA dans le footer et pages stacks.

---

### L4 — Comparaison de plus de 2 outils
**Contexte :** Certains visiteurs veulent comparer 3 outils simultanément (ex: Notion vs Airtable vs Coda).

**Note :** Complexité produit élevée. Reporter après Sprint 7.

---

### L5 — Mode sombre
**Contexte :** 30–40% des utilisateurs préfèrent le dark mode.

**Note :** Design system actuel est light-only. Ajouter dark mode nécessite de retravailler tous les tokens CSS. Sprint 9+ ou jamais selon les priorités.

---

## 🚫 À éviter — Décisions prises

### NE PAS — Utiliser FAQPage Schema sur les pages commerciales
**Raison :** Google a retiré FAQPage rich results pour les sites commerciaux en août 2023. Risque de pénalité.

### NE PAS — Ajouter des popups ou modales au premier chargement
**Raison :** Impact négatif sur le CLS (Core Web Vitals) et l'expérience utilisateur. Contraire au positionnement de ToolTrim.

### NE PAS — Créer des pages outils sans contenu éditorial
**Raison :** Pages vides ou avec juste le nom de l'outil = thin content = pénalité SEO. Minimum : verdict + bestFor + alternatives.

### NE PAS — Recommander des outils non testés
**Raison :** Compromet l'intégrité éditoriale. Si un outil n'est pas vérifié, il peut apparaître dans `alternatives` mais pas dans `bestFor` ou une stack `recommended`.

### NE PAS — Mettre du contenu payant derrière un paywall
**Raison :** Le modèle de ToolTrim est la confiance. Contenu accessible = référencement + réputation.

### NE PAS — Importer des données de prix depuis des APIs tierces non fiables
**Raison :** Les APIs de pricing ne sont pas stables. Vérification manuelle obligatoire.

---

## Historique des décisions (ADR — Architecture Decision Records)

| Date | Décision | Raison |
|------|----------|--------|
| 2026-05 | Pas de blue sur les CTAs | Différentiation visuelle, identité ToolTrim |
| 2026-05 | Tutoiement partout | Proximité avec le public indépendant |
| 2026-05 | Slugs comparatifs en ordre alphabétique | Évite le duplicate content |
| 2026-05 | Budget arrondi au 5€ | Simplicité, pas de fausse précision |
| 2026-05 | Max 8 outils par stack | Au-delà, la stack devient illisible |
| 2026-05 | FacetGroup<T> générique | Réutilisable pour les outils, guides, etc. |

---

_Dernière mise à jour : 2026-05-16_

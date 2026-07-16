# ToolTrim — Prompts Claude / Codex par cas d'usage

> Prompts optimisés pour accélérer la production de contenu et de code ToolTrim.
> Utiliser avec Claude Sonnet ou Claude Opus selon la complexité.

Pour la reprise complète et le scraping sourcé des fiches outils, utiliser le brief opérationnel canonique :
`docs/CLAUDE_CODE_TOOL_ENRICHMENT_BRIEF.md`.

---

## Conventions

- `[VARIABLE]` = à remplacer avant d'envoyer le prompt
- Toujours fournir le contexte du site en début de session longue
- Préférer des sessions dédiées par type de tâche (code / éditorial / SEO)

---

## A. Prompts — Contenu éditorial

### A1. Créer une nouvelle stack

```
Tu es l'éditeur de ToolTrim, un guide de stacks d'outils SaaS pour indépendants et petites équipes.

Crée une entrée de stack pour `stacks.ts` avec ces caractéristiques :
- Persona : [PERSONA]
- Stade : [STADE]
- Sous-profils : [SOUS-PROFILS]
- Objectif principal : [OBJECTIF]
- Budget cible : [BUDGET €/mois]

Règles :
- id en kebab-case : [persona]-[sous-profil]-[stade]
- description : 80–120 caractères, mentionne persona + objectif
- tools : 3–6 outils, chacun avec id, name, role, priceLabel
- monthlyBudget : arrondi au 5€ le plus proche
- Inclure descriptionEn et titleEn

Format de sortie : TypeScript valide, prêt à copier dans stacks.ts.
```

---

### A2. Écrire le verdict d'un comparatif

```
Tu es un éditeur tech opiné, pas neutre. Tu dois trancher.

Comparatif : [OUTIL A] vs [OUTIL B]
Contexte : outils utilisés par [PERSONAS] pour [CAS D'USAGE]

Écris le champ `verdict` pour comparisons.ts :
- winner : le gagnant par défaut
- keepIf : 2–4 raisons de garder le gagnant (commencer par un verbe à l'infinitif)
- switchIf : 1–3 cas où le perdant gagne (spécifiques, honnêtes)

Puis écris les scores sur 10 (granularité 0.5) pour :
- ease (facilité d'utilisation)
- features (richesse)
- price (rapport qualité/prix)
- support (support + documentation)
- integrations (écosystème)

Format de sortie : TypeScript valide pour comparisons.ts.
```

---

### A3. Rédiger la section "Notre avis" d'une page outil

```
Tu es l'éditeur de ToolTrim. Ton ton est direct, bienveillant, sans langue de bois.

Outil : [NOM DE L'OUTIL]
Catégorie : [CATÉGORIE]
Public cible : [PERSONAS]

Rédige la section "Notre avis" en français :
1. Un paragraphe de 100–150 mots avec un verdict tranché (positive ET limite réelle)
2. Une liste "Idéal pour" : 3–4 items, commencent par un verbe
3. Une liste "Pas adapté si" : 2 items, honnêtes et spécifiques

Ton : tutoyer le lecteur, pas de superlatifs creux, avoir une opinion.
```

---

### A4. Écrire la meta description d'une page

```
Écris la meta description pour cette page ToolTrim.

Type de page : [TYPE : stack / comparatif / outil / guide]
Sujet : [SUJET]
Mot-clé principal : [MOT-CLÉ]
Verdict ou angle éditorial : [ANGLE]

Contraintes :
- 140–155 caractères exactement
- Pas de ponctuation de fin
- Inclure le mot-clé principal
- Inclure un élément différenciant (verdict, budget, année)
- Pas de "Découvrez" ou "Cliquez ici"

Propose 3 variantes avec le nombre de caractères pour chacune.
```

---

## B. Prompts — Données structurées

### B1. Générer une entrée `tools.ts`

```
Génère une entrée TypeScript pour tools.ts (ToolTrim) pour l'outil suivant :

Outil : [NOM]
URL officielle : [URL]
Pricing vérifié : [FREE/PRO/BUSINESS avec prix]
Catégorie : [CATÉGORIE]
Alternatives connues : [LISTE]

Structure attendue (interface Tool) :
- id, name, tagline (FR + EN)
- category, subcategory, tags
- hasFree, startingPrice, pricingUrl
- verdict (100–150 mots, opinion tranchée)
- bestFor (2–4 items), notFor (1–3 items)
- alternatives (slugs), url, logoUrl
- updatedAt = aujourd'hui, featured = false

Format : TypeScript valide.
```

---

### B2. Générer le schema JSON-LD d'une page

```
Génère le JSON-LD Schema.org pour cette page ToolTrim.

Type de page : [comparatif / outil / stack / guide]
Données :
- Titre : [TITRE]
- Description : [DESCRIPTION]
- URL canonique : [URL]
- Date de mise à jour : [DATE]
- [Données spécifiques au type : noms d'outils, catégorie, pricing...]

Inclure :
1. Schema principal (Article / SoftwareApplication / selon type)
2. BreadcrumbList
3. Vérifier que c'est valide dans Rich Results Test

Format : balise <script type="application/ld+json"> complète.
```

---

## C. Prompts — Développement React

### C1. Créer un nouveau composant de page

```
Tu travailles sur ToolTrim, un SPA React 18 + TypeScript + Tailwind v3 + Vite.

Contexte technique :
- CSS via @layer components dans index.css, préfixe de classes : [PRÉFIXE]-
- Tokens : --navbar-h, --layout-content, --layout-gutter, --font-brand, --font-ui
- Couleurs : #222222 (noir), #F8F8F4 (cream), #EDEDE8 (medium cream), #DADAD4 (borders), #6F6F68 (secondary)
- Pas de bleu sur les CTAs
- Data source : src/data/[fichier].ts

Crée la page [NOM] pour la route [ROUTE] :
[DESCRIPTION FONCTIONNELLE]

Livrables :
1. Fichier TypeScript complet src/pages/[Nom]Page.tsx
2. Classes CSS @layer components à ajouter dans index.css (préfixe [PRÉFIXE]-)
3. Notes d'intégration (route à ajouter dans App.tsx si applicable)
```

---

### C2. Ajouter un composant UI réutilisable

```
Tu travailles sur ToolTrim (React 18 + TypeScript + Tailwind v3).

Crée un composant réutilisable : [NOM DU COMPOSANT]

Props attendues :
[LISTE DES PROPS]

Comportement :
[DESCRIPTION]

Contraintes :
- TypeScript strict (pas de any)
- Accessibilité : aria-* appropriés
- Keyboard navigation si interactif
- Classes CSS dans index.css avec préfixe [PRÉFIXE]-
- Export named depuis src/components/[Nom].tsx
```

---

### C3. Debug d'un composant

```
Tu travailles sur ToolTrim (React 18 + TypeScript + Tailwind v3).

Fichier concerné : [FICHIER]
Comportement observé : [BUG]
Comportement attendu : [ATTENDU]

[CODE DU COMPOSANT]

Diagnostique le problème et propose un fix minimal. 
Explique pourquoi le bug se produit en 2 phrases maximum.
```

---

## D. Prompts — SEO et contenu longue traîne

### D1. Identifier les opportunités de comparatifs

```
Tu es un expert SEO pour ToolTrim, un site de stacks et comparatifs d'outils SaaS.

Voici les outils déjà dans notre catalogue :
[LISTE D'OUTILS]

Identifie les 20 paires de comparatifs avec le plus fort potentiel SEO :
- Volume de recherche estimé élevé (requêtes "[outil-a] vs [outil-b]")
- Intention claire de comparaison (pas juste mentionnés ensemble)
- Les deux outils sont dans le même segment

Format : tableau avec | Slug pair | Motif SEO | Personas cibles |
Trier par potentiel décroissant.
```

---

### D2. Analyse de la structure d'une page concurrente

```
Tu es un analyste SEO pour ToolTrim.

URL concurrente : [URL]
[CONTENU DE LA PAGE]

Analyse :
1. Structure H1/H2/H3 et angle éditorial
2. Mots-clés ciblés (primaire + secondaires)
3. Ce qui manque ou pourrait être amélioré par ToolTrim
4. Format de contenu : tableau, liste, verdict, FAQ ?
5. Longueur estimée et section avec le plus de valeur

Donne 3 recommandations concrètes pour dépasser cette page avec ToolTrim.
```

---

## E. Prompts — Maintenance et qualité

### E1. Audit d'une stack existante

```
Audite cette stack ToolTrim pour en vérifier la cohérence :

[DONNÉES DE LA STACK]

Vérifie :
1. monthlyBudget : cohérent avec la somme des prix des outils ?
2. subProfiles : alignés avec OBJECTIVE_SUBPROFILES dans StacksPage.tsx ?
3. description : 80–120 caractères, mentionne persona + objectif ?
4. tools : entre 3 et 8 ? Tous avec id, name, role, priceLabel ?
5. Stage vs complexité des outils : cohérent ?

Rapport : Problèmes trouvés + corrections suggérées (format diff TypeScript).
```

---

### E2. Révision d'une entrée comparatif

```
Révise cette entrée comparatif pour ToolTrim :

[DONNÉES DU COMPARATIF]

Vérifie :
1. slugPair en ordre alphabétique ?
2. winner clairement défini ?
3. keepIf commence par un verbe à l'infinitif ?
4. Scores cohérents avec le verdict (le gagnant ne perd pas tous les critères) ?
5. forPersonas : au moins 1 persona valide ?

Rapport : Problèmes + corrections directement dans le TypeScript.
```

---

_Dernière mise à jour : 2026-05-16_

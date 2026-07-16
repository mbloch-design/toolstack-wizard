# Brief Claude Code — Refonte éditoriale et enrichissement sourcé des fiches outils

> Document d’exécution. À donner tel quel à Claude Code avec une liste explicite de slugs.
> Objectif : transformer les fiches outils en référentiel ToolTrim fiable, éditorial et réutilisable par le site, l’audit de stack et les futurs produits.

Architecture cible : Supabase doit devenir l’unique source éditoriale. La trajectoire de migration et les contraintes SEO sont définies dans `docs/SUPABASE_TOOL_CATALOG_MIGRATION.md` et font partie intégrante de ce brief.

## 1. Mission

Tu travailles dans le dépôt ToolTrim, un guide éditorial de comparaison d’outils SaaS destiné aux indépendants et petites équipes.

Ta mission est de reprendre les fiches outils à partir de données récentes et sourcées, puis de placer chaque information dans le bon champ et dans la bonne section de page. Tu ne dois pas produire une fiche marketing ni remplir des champs pour atteindre un quota.

Le résultat attendu pour chaque outil est :

1. un dossier de recherche traçable, avec une source pour chaque fait volatil ou contestable ;
2. des données normalisées utilisables par les autres fonctionnalités ToolTrim ;
3. une synthèse éditoriale ToolTrim directe, contextualisée et honnête ;
4. une fiche sans répétition, où chaque information n’apparaît qu’à l’endroit qui sert la décision ;
5. des sous-pages Prix, Alternatives, Avis et FAQ qui répondent chacune à une intention distincte ;
6. une validation technique, éditoriale, SEO et GEO avant toute écriture distante.

## 2. Ordre de priorité

En cas de conflit, respecte cet ordre :

1. exactitude et traçabilité ;
2. utilité pour une décision de stack ;
3. cohérence avec le modèle de données ToolTrim ;
4. lisibilité humaine ;
5. SEO/GEO ;
6. exhaustivité.

Une information absente mais assumée vaut mieux qu’une valeur inventée, extrapolée ou périmée.

## 3. Fichiers à lire avant toute modification

Lis complètement :

- `AGENTS.md`
- `docs/tooltrim-strategy/00-positioning.md`
- `docs/tooltrim-strategy/05-tool-page-template.md`
- `docs/tooltrim-strategy/06-seo-checklist.md`
- `docs/tooltrim-strategy/08-editorial-guidelines.md`
- `docs/tooltrim-strategy/09-internal-linking.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SYSTEM.md`
- `src/data/types.ts`
- `src/pages/ToolDetailPage.tsx`
- les composants de `src/components/tool/`
- `src/lib/pricing.ts`
- `scripts/sync-json-to-supabase.mjs`
- `scripts/sync-supabase-to-json.mjs`
- `docs/SUPABASE_TOOL_CATALOG_MIGRATION.md`

Le code actuel est la référence pour les noms de champs et les comportements réels. Les anciens documents qui mentionnent `/fr/outil/` ou `tools.ts` sont historiques : les routes actuelles sont sous `/fr/tool/` et le catalogue local est `src/data/tools_v4.json`.

## 4. Source de vérité et sécurité d’écriture

- Supabase est déjà la source primaire au runtime et doit devenir l’unique source éditoriale.
- `src/data/tools_v4.json` est encore un fallback local transitoire, utilisé par le build, certains hooks, le diagnostic et des tests. Ne le supprime pas avant les gates du plan de migration.
- Pendant la transition, un mode `APPLY_LOCAL` peut encore produire un diff JSON. Dans la cible, la recherche va dans des tables privées Supabase et la publication dans la vue/catalogue publié.
- Le script `sync-json-to-supabase.mjs` est en dry-run par défaut et accepte une liste de slugs.
- Son `FIELD_MAP` ne couvre pas automatiquement tous les champs de `Tool`. Avant un sync, comparer les champs modifiés au mapping réel et signaler ceux qui resteraient uniquement locaux.
- Ne lance jamais `--apply`, un upsert massif ou une migration distante sans autorisation explicite.
- Ne modifie jamais les catégories, relations, clusters ou politiques de prescription par simple intuition éditoriale.
- Ne remplace pas une valeur distante non vide sans montrer l’ancienne valeur, la nouvelle valeur et la source qui justifie le changement.

## 5. Architecture cible de la donnée

### 5.1 Séparer recherche et publication

Tant que les tables privées décrites dans le plan Supabase n’existent pas, utilise ce format de transition non importé par le client :

```text
research/tool-pages/
  index.json
  <slug>.json
```

Ce dossier conserve temporairement les preuves et notes de recherche. Le bundle client ne doit jamais importer ces fichiers. Il doit ensuite être importé dans `tool_sources`, `tool_claims` et `tool_research_runs`, puis cesser d’être une source éditée manuellement.

`index.json` sert de file de production et contient, pour chaque slug : `status`, `priority`, `researchedOn`, `editoriallyReviewedOn`, `nextReviewOn`, `openConflicts` et `assignedTo`. Les statuts autorisés sont : `todo`, `researching`, `needs_review`, `approved`, `published`, `stale`, `blocked`.

Pendant la transition, les champs validés peuvent être reportés dans `tools_v4.json` puis synchronisés par slug. Dans la cible, ils sont publiés directement via le workflow Supabase avec révision et rollback ; un snapshot généré au build remplace le fallback JSON sans sacrifier le prerender.

### 5.2 Format du dossier de recherche

Utilise ce contrat. Tu peux l’étendre, mais pas supprimer la provenance des affirmations.

```json
{
  "schemaVersion": 1,
  "slug": "framer",
  "researchedOn": "YYYY-MM-DD",
  "researcher": "Claude Code",
  "status": "draft",
  "identity": {
    "officialName": "Framer",
    "vendor": "Framer B.V.",
    "officialUrl": "https://www.framer.com/",
    "pricingUrl": "https://www.framer.com/pricing/",
    "docsUrl": "https://www.framer.com/help/",
    "changelogUrl": null
  },
  "claims": [
    {
      "id": "pricing.entry-plan",
      "value": "Mini à 5 €/mois",
      "sourceUrl": "https://www.framer.com/pricing/",
      "sourceTier": 1,
      "accessedOn": "YYYY-MM-DD",
      "evidence": "Résumé factuel court, sans copier un long passage",
      "confidence": "high",
      "volatility": "high"
    }
  ],
  "pricing": {
    "originalCurrency": "EUR",
    "billingContext": "mensuel",
    "taxIncluded": null,
    "freePlan": null,
    "plans": [],
    "seatMinimum": null,
    "usageLimits": [],
    "cautions": []
  },
  "capabilities": [],
  "limitations": [],
  "integrations": [],
  "audiences": [],
  "useCases": [],
  "alternatives": [],
  "editorialNotes": [],
  "unknowns": [],
  "conflicts": []
}
```

### 5.3 Règle de provenance

Chaque fait doit être relié à un `claim.id`. Sont obligatoirement sourcés :

- prix, noms de plans, périodicité, minimum de sièges et limites d’usage ;
- disponibilité d’un plan gratuit ou d’un essai ;
- nombre de pages, projets, utilisateurs, crédits, stockage ou exécutions ;
- fonctionnalités incluses ou exclues d’un plan ;
- intégrations natives, API, export, hébergement, sécurité et conformité ;
- date de lancement, arrêt, renommage ou changement majeur ;
- toute statistique ou comparaison chiffrée.

Un verdict ToolTrim est une synthèse éditoriale et n’a pas besoin d’être présenté comme un fait officiel. En revanche, les faits utilisés pour le justifier doivent être présents dans le dossier de recherche.

### 5.4 Fraîcheur attendue

| Type de donnée | Revue maximale | Devient bloquante si |
|---|---:|---|
| Pricing, quotas, sièges | 90 jours | la fiche affiche un montant précis périmé |
| Fonctionnalités et intégrations | 180 jours | une décision dépend de leur présence |
| Positionnement et verdict | 365 jours | le produit ou sa cible a changé |
| Sécurité, conformité, disponibilité | 180 jours | une affirmation explicite est publiée |

Une date récente n’est pas une preuve de fraîcheur si la source n’a pas été rouverte.

## 6. Hiérarchie des sources

### Niveau 1 — source principale

À utiliser en priorité :

- page tarifaire officielle ;
- documentation et centre d’aide officiels ;
- changelog, release notes ou blog produit officiel ;
- documentation API ou intégrations officielle ;
- conditions commerciales, pages sécurité ou statut officielles.

### Niveau 2 — source indépendante

À utiliser pour compléter un angle non documenté officiellement :

- documentation d’un partenaire d’intégration reconnu ;
- publication technique de référence ;
- test éditorial récent avec protocole explicite ;
- retours utilisateurs agrégés, uniquement pour identifier une piste à vérifier.

### Niveau 3 — découverte seulement

Résultats Google, snippets, comparateurs affiliés, listicles, vidéos non officielles, forums et réseaux sociaux peuvent aider à trouver une question. Ils ne suffisent pas à valider un prix, une limite ou une fonctionnalité.

### Sources interdites comme preuve unique

- texte généré par une IA ;
- contenu sans date ni auteur ;
- copie d’une autre fiche ToolTrim ;
- snippet de moteur sans ouverture de la page ;
- page archivée utilisée comme état actuel ;
- avis isolé présenté comme comportement général.

### Conflits

Si deux sources se contredisent :

1. privilégie la source officielle la plus récente ;
2. vérifie la région, la devise, la facturation annuelle/mensuelle et le plan concerné ;
3. conserve les deux valeurs dans `conflicts` ;
4. n’écrase pas la donnée publiée tant que le conflit n’est pas résolu ;
5. ajoute la valeur au rapport de revue manuelle.

## 7. Protocole de collecte

Pour chaque slug :

1. identifier le site officiel et éviter les domaines homonymes ;
2. consulter la page produit, la page tarifaire, la documentation et le changelog ;
3. relever les faits avec URL exacte et date d’accès ;
4. noter les informations inconnues au lieu de les déduire ;
5. comparer les faits au record actuel dans `tools_v4.json` et, si accessible, au record Supabase ;
6. produire un diff de recherche avant de modifier le contenu publié ;
7. rédiger la synthèse ToolTrim seulement après la collecte factuelle ;
8. valider le dossier de recherche ;
9. intégrer les champs éditoriaux ;
10. construire et vérifier la page.

Le collecteur ne doit jamais écrire directement dans `tools_v4.json` ni dans la table publiée `tools`. Il écrit dans le dossier de transition ou dans les tables privées de recherche. Une étape de compilation/revue distincte transforme les claims approuvés en champs publiables.

Respecte `robots.txt`, les conditions d’utilisation et un rythme de requêtes raisonnable. N’essaie jamais de contourner un captcha, une authentification, une protection anti-bot ou un paywall. Si une source bloque l’accès, note-la comme inaccessible et cherche une autre source autorisée.

## 8. Modèle éditorial : quoi écrire et où le placer

| Information | Champ principal | Emplacement visible | Règle |
|---|---|---|---|
| Positionnement factuel | `shortDescription` / `shortDescriptionEn` | Hero | Une phrase, fonction de l’outil, pas un verdict |
| Analyse et contexte | `longDescription` / `longDescriptionEn` | « Comprendre [outil] » | 2–4 paragraphes, niche, logique produit, compromis |
| Public concret | `relevantFor`, `soloRelevance`, `teamRelevance`, `seo.idealForFr/En` | Début de fiche | Rôles ou équipes identifiables, pas « professionnels » |
| Fonctions couvertes | `covers`, `functional_needs` | « Ce que fait l’outil » | Capacités structurantes, pas catalogue exhaustif |
| Cas d’usage | `useCases` / `useCasesEn` | « Usages concrets » | Production + résultat, ex. « Portfolio — vitrine animée » |
| Avantages | `pros` / `prosEn` | « Avantages » | Bénéfices observables, non redondants avec les fonctions |
| Inconvénients | `cons` / `consEn` | « Inconvénients » | Limites réelles, périmètre et conséquences |
| Décision | `verdict.keepIf`, `avoidIf`, `threshold` | « Quand ça a du sens » | Choisir, challenger et seuil de décision |
| Rentabilité | `verdict.profitableIf`, `tooExpensiveIf` | Seuil de rentabilité | Fréquence, taille d’équipe, temps gagné, coût total |
| Pièges contractuels | `verdict.billingTraps` | Prix | Mécanique factuelle distincte du jugement budgétaire |
| Prix canonique | `pricing_v5.compare_price_monthly_eur` | Hero, Prix, audit | Prix du plan de comparaison ToolTrim, pas nécessairement le moins cher absolu |
| Contexte du prix | `pricing_v5.*`, `pricing`, `pricingEn` | Prix | Plan, période, sièges, limites, devise et source |
| Coût par équipe | `pricing_v5.costTable` | Prix | Seulement si calcul vérifiable et utile |
| Alternatives | `alternatives`, `betterAlternative`, `freeAlternative` | Alternatives | Même besoin principal, raison explicite, slug valide |
| Intégrations | données existantes de relation | Détails | Uniquement intégrations vérifiées et utiles à une stack |
| FAQ | données factuelles + verdict | Sous-page FAQ | Réponse directe, autonome, spécifique à l’outil |
| Meta | `seo.metaDescription`, titres générés | Head | Même faits que la page, aucune promesse supplémentaire |

### Ne pas dupliquer

- Le hero explique ce qu’est l’outil ; il ne répète pas le verdict.
- `pros` ne répète pas `covers`.
- `keepIf/avoidIf` décrit l’adéquation ; `profitableIf/tooExpensiveIf` décrit le seuil économique.
- `billingTraps` décrit le contrat ; `cons` décrit l’expérience ou le périmètre produit.
- La FAQ répond à une question ; elle ne recopie pas un paragraphe entier.
- Les sous-pages ne doivent pas réafficher la totalité de la fiche principale.
- Ne crée pas de contenu caché uniquement pour les moteurs. Le JSON-LD doit refléter le contenu réellement disponible.

## 9. Ligne éditoriale ToolTrim

Écris pour un indépendant ou une équipe de 1 à 5 personnes qui arbitre sa stack.

- ton direct, précis, calme et non commercial ;
- tutoiement dans les conseils adressés au lecteur ;
- opinion claire, toujours accompagnée du contexte où elle cesse d’être vraie ;
- une limite réelle pour chaque outil recommandé ;
- cas d’usage avant listes de fonctionnalités ;
- montants et seuils plutôt que « abordable » ou « cher » ;
- phrases courtes, paragraphes de 3 à 5 phrases ;
- aucun superlatif générique ;
- pas de « puissant », « robuste », « flexible », « révolutionnaire », « intuitif » sans preuve et contexte précis ;
- pas de comparaison universelle : préciser persona, usage, équipe, volume ou budget.

### Exemple de bonne formulation

> Framer est un bon choix pour un designer qui veut publier un portfolio ou une landing page très visuelle sans passer par un développeur. Il devient moins pertinent dès que le projet dépend d’un gros catalogue éditorial, d’un e-commerce avancé ou d’une logique applicative.

### Exemple à refuser

> Framer est une solution puissante, intuitive et flexible adaptée à tous les professionnels.

## 10. Traitement du pricing

Le pricing est la donnée la plus volatile. Pour chaque plan, capture :

- nom officiel ;
- prix original et devise ;
- facturation mensuelle ou annuelle ;
- prix par siège, workspace, usage ou volume ;
- minimum de sièges ;
- plan gratuit versus essai gratuit ;
- principales limites qui changent la décision ;
- région et taxes si précisées ;
- URL officielle et date de vérification.

Règles :

- `pricing_v5.compare_price_monthly_eur` est la valeur canonique consommée par ToolTrim ;
- `defaultMonthlyPrice` ne sert que de fallback historique et doit rester cohérent ;
- ne convertis pas une devise sans conserver le montant original, la date et la règle de conversion ;
- ne mélange jamais prix mensuel réel et équivalent mensuel d’un engagement annuel ;
- « gratuit » signifie un plan durablement utilisable, pas un essai ;
- si le prix dépend d’un devis, d’un volume ou d’une région non vérifiable, publie « Sur devis » ou une prudence, pas zéro ;
- toute opération de multiplication par utilisateur doit respecter `minSeats` et les limites du plan.

## 11. Alternatives et relations utiles aux autres produits

Une alternative doit couvrir le même besoin principal. Une intégration, un plugin ou un outil complémentaire n’est pas une alternative.

Pour chaque relation candidate, qualifier :

- `alternative` : remplace le besoin principal ;
- `complement` : travaille avec l’outil sans le remplacer ;
- `host_app` : application hôte d’un plugin ;
- `bundle_parent` : produit inclus dans une suite ;
- `integrates_with` : connexion native ou officiellement documentée.

Ne modifie `substitution_cluster_v2`, `prescription_quality`, `prescription_output` ou `decision_policy_v3` qu’après audit de la logique de diagnostic. Ces champs influencent les recommandations produit, pas seulement la page éditoriale.

## 12. SEO et GEO

Chaque page doit pouvoir répondre rapidement à ces questions :

- qu’est-ce que l’outil et à quoi sert-il ?
- pour qui est-il pertinent ?
- combien coûte-t-il, avec quel plan et quelles limites ?
- quels sont ses avantages et ses inconvénients ?
- quand faut-il le garder ou le challenger ?
- quelles alternatives couvrent réellement le même besoin ?

Exigences :

- un H1 correspondant à l’intention de la route ;
- une seule URL canonique ;
- title et description spécifiques, sans contradiction avec la page ;
- réponses directes dans la première phrase des FAQ ;
- source officielle proche des données tarifaires ;
- date de vérification du prix et date de révision éditoriale distinctes si nécessaire ;
- données structurées limitées aux faits visibles et vérifiables ;
- aucun faux `AggregateRating`, faux volume d’avis ou auteur fictif ;
- liens internes vers alternatives, comparatifs et stacks réellement publiés ;
- pas de pages quasi identiques entre vue générale, Prix, Avis et FAQ.

Pour les sources visibles, lier la page précise qui porte le fait, pas seulement la homepage du fournisseur. Les citations doivent rester proches de l’information concernée sans transformer la fiche en bibliographie illisible.

### Langues

- La recherche factuelle est partagée entre FR et EN.
- Les textes FR et EN sont deux rédactions cohérentes, pas une duplication aveugle.
- Conserver les noms officiels de plans et produits dans leur langue de marque.
- Ne jamais laisser du français dans un champ `*En` pour remplir un manque.
- Si la version anglaise n’est pas validée, conserver le fallback existant et le signaler dans le rapport.

## 13. Workflow par lot

### Phase A — audit sans écriture

Pour `[SLUGS]`, produire :

- couverture actuelle de chaque champ ;
- contradictions de prix ;
- sources manquantes ou périmées ;
- répétitions de contenu ;
- alternatives douteuses ;
- champs sensibles utilisés par le diagnostic ;
- priorité `P0`, `P1`, `P2`.

Ne modifie aucun fichier durant cette phase.

### Phase B — lot pilote

Commencer par 5 outils maximum. Lot conseillé pour calibrer le template :

```text
framer, webflow, wix, squarespace, figma
```

Framer sert de fiche de référence de structure, pas de texte à recopier.

Pour chaque outil : créer le dossier de recherche, proposer le diff éditorial, puis attendre ou appliquer selon l’autorisation donnée.

### Phase C — industrialisation

Après validation du pilote :

- lots de 10 à 20 outils homogènes ;
- concurrence maximale de 2 à 3 requêtes par domaine ;
- cache local des pages consultées ;
- reprise idempotente ;
- journal des erreurs ;
- validation complète par lot ;
- aucun push Supabase global.

## 14. Contrôles automatiques à créer ou utiliser

Le système doit pouvoir signaler :

- URL officielle, pricing ou date de vérification absente ;
- `compare_price_monthly_eur` contradictoire avec le texte ;
- essai gratuit présenté comme plan gratuit ;
- devise ou période ambiguë ;
- alternative dont le slug n’existe pas ;
- même texte dans `pros`, `covers`, `keepIf` ou FAQ ;
- verdict uniquement positif ;
- contenu générique applicable à n’importe quel outil ;
- fait volatil sans claim sourcé ;
- source de niveau 3 utilisée seule ;
- page sans lien interne contextuel ;
- JSON-LD contenant une donnée absente de la page ;
- route avec et sans slash produisant deux intentions différentes ;
- champ éditorial français copié tel quel dans la version anglaise.

## 15. Validation obligatoire avant livraison

Pour chaque lot :

```bash
git diff --check
npx tsc --noEmit
npm run build
```

Puis :

1. lancer les validateurs de recherche et de catalogue disponibles ;
2. vérifier les sorties pré-rendues de la vue générale, Prix, Alternatives, Avis et FAQ ;
3. ouvrir au moins une fiche du lot dans un navigateur ;
4. contrôler title, H1, canonical, source tarifaire et absence d’overlay ;
5. vérifier mobile et desktop si le template a changé ;
6. mettre à jour `docs/CHANGELOG_AI.md` ;
7. produire un rapport des tests en échec en distinguant régression et dette préexistante.

## 16. Format de compte rendu attendu

À la fin de chaque phase, répondre avec :

```text
LOT
- slugs traités
- slugs ignorés et motif

SOURCES
- nombre de claims niveau 1 / niveau 2
- sources inaccessibles
- conflits non résolus

DONNÉES
- champs ajoutés ou corrigés
- champs laissés inconnus
- champs sensibles non modifiés

ÉDITORIAL
- angle retenu par outil
- limite principale
- persona et cas d’usage principal

VALIDATION
- commandes exécutées
- résultats
- pages vérifiées dans le navigateur

ÉCRITURE DISTANTE
- non effectuée / dry-run / appliquée
- slugs concernés
```

## 17. Prompt maître à coller dans Claude Code

```text
Tu dois exécuter le brief `docs/CLAUDE_CODE_TOOL_ENRICHMENT_BRIEF.md` dans le dépôt ToolTrim.

Slugs du lot : [SLUGS]
Mode : [AUDIT_ONLY | RESEARCH | APPLY_LOCAL | SUPABASE_STAGE | SYNC_DRY_RUN]
Langues : [FR | FR_EN]

Commence par lire tous les fichiers imposés par le brief et inspecter l’état Git. Ne touche pas aux changements existants sans rapport.

Contraintes absolues :
- aucune donnée inventée ;
- une provenance pour chaque fait volatil ;
- sources officielles en priorité ;
- aucun contournement de protection ou de paywall ;
- aucune écriture Supabase avec `--apply` ;
- respecter toutes les phases et gates de `docs/SUPABASE_TOOL_CATALOG_MIGRATION.md` ;
- aucune modification des champs de prescription sans audit explicite ;
- pas de refonte visuelle globale : placer les données dans le template actuel ;
- ne pas dupliquer la même information dans plusieurs sections ;
- conserver les montants originaux, devises, périodes et limites de plans ;
- montrer le diff et les conflits avant toute intégration locale.

Exécute les phases correspondant au mode demandé. Termine par le compte rendu standard du brief et la liste exacte des fichiers modifiés.
```

## 18. Critère de réussite global

Le chantier n’est pas terminé lorsque les fiches sont simplement plus longues. Il est terminé lorsque :

- un fait publié peut être retracé jusqu’à une source et une date ;
- la donnée structurée est réutilisable par la fiche, l’audit de stack et les comparatifs ;
- le verdict ToolTrim permet de décider pour un persona, un usage et un budget précis ;
- chaque information est placée une seule fois, dans la section qui répond à la question du lecteur ;
- le processus peut traiter un nouveau lot sans dégrader la qualité ni écraser silencieusement la production.

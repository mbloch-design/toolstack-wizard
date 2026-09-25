# Brief cloud : dossiers de recherche outils (schéma v2)

Document d'exécution pour une session Claude Code dans le cloud. Il se suffit
à lui-même : ne lis pas les autres documents du dépôt, sauf ceux cités ici.
Le brief complet de référence reste `docs/CLAUDE_CODE_TOOL_ENRICHMENT_BRIEF.md` ;
celui-ci en est la version d'exécution, allégée pour tenir un budget.

## 0. Mode cloud : les faits seulement (à lire en premier)

Les sessions cloud tournent sur un crédit très limité. Elles font **uniquement
la collecte des faits**, sur les lots `c1`, `c2`… de `research/queue.json`
(`cloudBatches` : 3 outils par lot jusqu'à `c10`, 10 outils par lot à partir
de `c11`). La note, la cible et les textes bilingues sont rédigés ensuite en
local, hors crédit.

Avec 10 outils par lot, garde la conversation courte : pas de résumé entre
deux outils, et écris chaque dossier dès que ses faits sont réunis.

Dans ce mode, remplis seulement :
- `identity`, `sources`, `pricing` (complet, section 5) ;
- `product.capabilities`, `product.limitations` (au moins 2 chacun),
  `product.integrations`, `product.platforms` ;
- `alternatives` et `missingAlternatives` ;
- `unknowns`, `conflicts`.

Règles propres à ce mode :
- **Anglais seulement** : chaque texte est `{ "en": "…" }`, sans `fr`.
- `status` vaut `"facts_collected"`.
- **Ne remplis pas** `rating`, `audience`, `useCases`, `editorial`.
- Pour chaque page, **extrais seulement ce qu'il faut** (plans, prix, unités,
  limites, fonctionnalités clés) au lieu de charger la page entière : c'est
  ce qui coûte le plus.
- Validation : `node scripts/research/validate.mjs --stage facts <slugs>`.
- Sois bref dans tes réponses intermédiaires : pas de résumé entre deux
  outils, seulement le compte rendu final.

Le reste du brief (budget, prix, identité, alternatives) s'applique tel quel.

## 1. Mission

Pour chaque outil d'un lot, produire **un dossier de recherche** dans
`research/dossiers/<slug>.json` : des faits sourcés et datés, la grille de
prix complète, la note ToolTrim sur 5 axes justifiée, et les textes de la
fiche en anglais puis en français.

Ce dossier est une **donnée structurée réutilisable** (fiche, pages prix,
comparatifs, budgets de stacks, filtres, futurs produits). Il ne modifie pas
le site : une étape séparée, locale et relue par un humain, le fusionne.

Priorité en cas de conflit : exactitude, puis utilité pour décider, puis
complétude. Une information absente et assumée vaut mieux qu'une valeur
inventée, extrapolée ou périmée.

## 2. Budget : règles non négociables

La session tourne sur un crédit limité. Chaque action coûte.

- Ne lis **jamais** `src/data/tools_v4.json` ni `tools_index.json` (3 Mo). Les
  données existantes du lot sont fournies par `scripts/research/seed.mjs`.
- Ne lance pas `npm install`, `npm run build`, ni le serveur. Les scripts de
  ce brief tournent avec Node seul.
- Au plus **8 pages web par outil**. Ne rouvre pas une page déjà lue.
- Commence par la page tarifs officielle, puis la page produit, puis la
  documentation ou le changelog. Arrête dès que les champs requis sont
  couverts.
- Pas de contournement : captcha, connexion, anti-bot ou paywall rendent la
  source inaccessible. Note-la dans `unknowns` et passe à la suivante.
- Si un outil bloque (site mort, prix introuvable), ne t'acharne pas : remplis
  ce qui est sûr, documente le reste dans `unknowns`, passe à l'outil suivant.

## 3. Déroulé d'une session

On travaille **directement sur `main`**, sans branche : les dossiers ne sont
pas lus par le site, et un envoi qui ne touche que `research/` ou `docs/` ne
déclenche aucun déploiement (règle `ignoreCommand` de `vercel.json`).

```bash
node scripts/research/seed.mjs --batch <ID>      # données existantes du lot
# … recherche, un fichier par outil …
node scripts/research/validate.mjs --stage facts <slug1> <slug2> …   # zéro erreur
git add research/dossiers/<slug1>.json research/dossiers/<slug2>.json …
git commit -m "research(<ID>): <slugs>"
git pull --rebase origin main    # d'autres sessions ont pu pousser entre-temps
git push origin main             # si refusé : refais pull --rebase puis push
```

Ne commite **que** les fichiers des slugs du lot : jamais `git add .` ni `-a`.

Ne modifie **aucun autre fichier** que `research/dossiers/<slug>.json` des
slugs du lot. **Ne touche jamais `research/tool-pages/`** : ce dossier
appartient au circuit d'attestation, et certains fichiers y sont des données
de production. Termine par le compte rendu de la section 11.

## 4. Contrat du dossier (schemaVersion 2)

Deux niveaux, indiqués dans `research/queue.json` :

- **Tier A** : dossier complet, tous les blocs ci-dessous.
- **Tier B** : `identity`, `sources`, `pricing`, `alternatives`, `rating`,
  `editorial.tagline`, `editorial.shortDescription`, `unknowns`.

Exemple abrégé. Les « … » sont à remplir, et les montants sont illustratifs :
revérifie tout sur la source. Le tier A exige au moins 2 éléments dans
`capabilities`, `limitations`, `useCases`, `pros` et `cons`.

```json
{
  "schemaVersion": 2,
  "slug": "freshservice",
  "tier": "A",
  "researchedOn": "2026-09-25",
  "status": "needs_review",
  "identity": {
    "officialName": "Freshservice",
    "vendor": "Freshworks Inc.",
    "officialUrl": "https://www.freshworks.com/freshservice/",
    "docsUrl": "https://support.freshservice.com/",
    "changelogUrl": null,
    "urlStatus": "ok",
    "productStatus": "active",
    "statusNote": null
  },
  "sources": [
    { "id": "s1", "url": "https://www.freshworks.com/freshservice/pricing/", "tier": 1, "accessedOn": "2026-09-25", "title": "Freshservice pricing" },
    { "id": "s2", "url": "https://www.freshworks.com/freshservice/features/", "tier": 1, "accessedOn": "2026-09-25", "title": "Freshservice features" },
    { "id": "s3", "url": "https://www.freshworks.com/apps/freshservice/", "tier": 1, "accessedOn": "2026-09-25", "title": "Freshservice marketplace" },
    { "id": "s4", "url": "https://api.freshservice.com/", "tier": 1, "accessedOn": "2026-09-25", "title": "Freshservice API" }
  ],
  "pricing": {
    "model": "per_seat",
    "currency": "USD",
    "pricingUrl": "https://www.freshworks.com/freshservice/pricing/",
    "verifiedOn": "2026-09-25",
    "region": "US",
    "taxIncluded": false,
    "freePlan": { "exists": false, "limits": null, "sourceIds": ["s1"] },
    "trial": { "days": 14, "sourceIds": ["s1"] },
    "plans": [
      {
        "key": "starter",
        "name": "Starter",
        "unit": "seat",
        "minSeats": 1,
        "price": { "monthly": 29, "annualPerMonth": 19, "oneTime": null },
        "onQuote": false,
        "keyLimits": [{ "en": "Incident management only", "fr": "Gestion des incidents uniquement" }],
        "sourceIds": ["s1"]
      }
    ],
    "comparePlanKey": "starter",
    "addOns": [],
    "cautions": [
      { "en": "Price per agent: a 5-agent desk costs five times the list price.", "fr": "Prix par agent : un support à 5 agents coûte cinq fois le tarif affiché.", "sourceIds": ["s1"] }
    ]
  },
  "product": {
    "capabilities": [{ "en": "…", "fr": "…", "sourceIds": ["s2"] }],
    "limitations": [{ "en": "…", "fr": "…", "sourceIds": ["s2"] }],
    "integrations": [{ "name": "Slack", "slug": "slack", "sourceIds": ["s3"] }],
    "platforms": ["web", "ios", "android"]
  },
  "audience": {
    "persona": "CLAIRE",
    "description": { "en": "…", "fr": "…" },
    "soloRelevance": "low",
    "teamRelevance": "high"
  },
  "useCases": [{ "en": "…", "fr": "…" }],
  "alternatives": [
    { "slug": "zendesk", "reason": { "en": "…", "fr": "…" } }
  ],
  "missingAlternatives": [
    { "name": "Jira Service Management", "officialUrl": "https://www.atlassian.com/software/jira/service-management", "reason": "Main ITSM competitor, not in the catalogue" }
  ],
  "rating": {
    "valeurAjoutee": 3, "simplicite": 3, "utilisation": 4, "puissance": 4, "reversibilite": 3,
    "evidence": {
      "valeurAjoutee": { "en": "…", "fr": "…", "sourceIds": ["s1"] },
      "simplicite": { "en": "…", "fr": "…", "sourceIds": ["s2"] },
      "utilisation": { "en": "…", "fr": "…", "sourceIds": ["s2"] },
      "puissance": { "en": "…", "fr": "…", "sourceIds": ["s2"] },
      "reversibilite": { "en": "…", "fr": "…", "sourceIds": ["s4"] }
    },
    "lastActivityVerifiedOn": "2026-09-10"
  },
  "editorial": {
    "tagline": { "en": "IT helpdesk", "fr": "Helpdesk IT" },
    "shortDescription": { "en": "…", "fr": "…" },
    "longDescription": { "en": "…", "fr": "…" },
    "pros": [{ "en": "…", "fr": "…" }],
    "cons": [{ "en": "…", "fr": "…" }],
    "verdict": {
      "keepIf": { "en": "…", "fr": "…" },
      "avoidIf": { "en": "…", "fr": "…" },
      "threshold": { "en": "…", "fr": "…" },
      "billingTraps": { "en": "…", "fr": "…" }
    }
  },
  "unknowns": ["Tax treatment outside the US not stated on the pricing page"],
  "conflicts": []
}
```

Tout fait daté ou chiffré porte des `sourceIds` qui renvoient à `sources`.
Sources de niveau 1 : page officielle (tarifs, produit, docs, changelog).
Niveau 2 : source indépendante reconnue, seulement pour compléter. Un
comparateur, un listicle ou une IA ne valent jamais preuve.

## 5. Prix : la rigueur avant tout

Chaque outil a sa logique. Ne la force jamais dans un moule.

### 5.1 Modèle (`pricing.model`, liste fermée)

| Valeur | Quand |
|---|---|
| `free` | entièrement gratuit, sans offre payante |
| `freemium` | plan gratuit durable + plans payants par compte |
| `subscription` | abonnement par compte, sans plan gratuit |
| `per_seat` | le prix dépend du nombre d'utilisateurs |
| `usage` | le prix dépend de la consommation (requêtes, stockage, MAU…) |
| `one_time` | licence achetée une fois |
| `subscription_and_perpetual` | abonnement et licence perpétuelle proposés en parallèle |
| `quote` | aucun prix public, sur devis |
| `open_source` | logiciel libre, éventuellement une offre cloud payante |
| `bundle_only` | vendu uniquement dans une suite (ex. inclus dans Adobe CC) |

Un outil gratuit avec des extensions payantes à l'unité (plugin gratuit,
packs payants) est `freemium`, et les packs vont dans `addOns`.

### 5.2 Chaque plan

- `unit` : `account`, `seat`, `workspace`, `site`, `usage`, `one_time`.
- `price.monthly` : prix réellement facturé au mois.
- `price.annualPerMonth` : équivalent mensuel d'un engagement annuel.
  **Ne mélange jamais les deux.** Si la page n'en montre qu'un, l'autre est
  `null`.
- `price.oneTime` : licence à vie.
- Montants dans la **devise d'origine** de la page (`pricing.currency`), sans
  conversion. Si la page change de devise selon le pays, note la région vue.
- `minSeats` : obligatoire pour `seat` (1 s'il n'y a pas de minimum).
- `onQuote: true` pour un plan sans prix public : aucun montant.
- `keyLimits` : les limites qui changent la décision (projets, pages,
  crédits, stockage, membres), pas la liste des fonctionnalités.

### 5.3 Pièges à traiter

- **Essai n'est pas gratuit** : un essai de 14 ou 30 jours va dans `trial`,
  jamais dans `freePlan`.
- **Usage** : ne présente pas un palier d'exemple comme un prix fixe. Donne
  le plan d'entrée et le mécanisme dans `cautions`.
- **Options payantes** (IA, stockage, sièges invités) : dans `addOns`, avec
  leur unité.
- **Promotions temporaires** et prix de lancement : exclus. Si seul un prix
  promotionnel est visible, note-le dans `unknowns`.
- **Taxes** : `taxIncluded` seulement si la page le dit, sinon `null`.
- **Prix non public** : `quote`, jamais 0.

### 5.4 Plan de comparaison (`comparePlanKey`)

C'est le plan qui sert au tri du catalogue et aux budgets des stacks. Règle :
le **plan payant le moins cher qu'une seule personne de la cible peut acheter
et utiliser pour la fonction principale de l'outil**. Un plan d'appel qui
retire la fonction principale ne compte pas. Le montant retenu à la fusion
sera `annualPerMonth` s'il existe, sinon `monthly`, pour un siège. Pour
`free`, `open_source` et `quote`, `comparePlanKey` peut être `null`.

Cas particuliers :
- **Usage** : le plus petit palier payant qui fait tourner un vrai projet de
  la cible (ex. un palier « Flex » avant un palier dédié), pas le palier
  « production » le plus courant.
- **Gratuit + achats à l'unité** (plugin gratuit, packs payants) : le plan
  gratuit, car l'usage courant ne coûte rien chaque mois ; les packs restent
  dans `addOns` ou dans des plans `one_time`.
- **Prix promotionnel** (bannière, offre 2 ans, « -60 % ») : il ne va jamais
  dans `price`. Relève le prix hors promotion. S'il n'est publié nulle part,
  mets le prix promotionnel dans `promoPrice` du plan (même forme que
  `price`), laisse `price` à `null`, passe `pricing.regularPriceUnknown` à
  `true` et `comparePlanKey` à `null`.

## 6. Note ToolTrim (5 axes, entiers de 1 à 5)

Chaque axe a une preuve en anglais et en français, reliée à des sources.

| Axe | Mesure | 5 | 1 |
|---|---|---|---|
| `valeurAjoutee` | gain réel (temps, argent) rapporté au coût pour la cible | rentabilisé vite, sans alternative équivalente moins chère | coût difficile à justifier face aux alternatives |
| `simplicite` | temps et compétence pour un premier résultat utile | résultat utile en moins d'une heure sans formation | nécessite un spécialiste ou des jours de mise en place |
| `utilisation` | réalise l'objectif annoncé sans contournement | tient sa promesse telle quelle | contournements ou outils tiers indispensables |
| `puissance` | plafond de capacité face à la catégorie | référence de la catégorie | couvre le strict minimum |
| `reversibilite` | portabilité si on quitte l'outil | export complet en formats ouverts + API | données enfermées, pas d'export |

- Aucune faveur : la note ne dépend ni d'un partenariat, ni d'un lien, ni de
  la complétude de la fiche.
- `lastActivityVerifiedOn` : date de la dernière mise à jour produit vue dans
  un changelog ou des release notes, sinon `null`.
- Une note de 5 exige une preuve forte ; en cas de doute, 3.

## 7. Alternatives

- Une alternative couvre **le même besoin principal**. Une intégration, un
  plugin ou un outil complémentaire n'en est pas une.
- Choisis dans `alternativeCandidates` du seed : seuls les slugs du catalogue
  sont acceptés. 3 à 6 pour le tier A, 2 à 4 pour le tier B.
- Un vrai concurrent absent du catalogue va dans `missingAlternatives` : c'est
  ainsi qu'on saura quelles fiches créer.

## 8. Identité et état du produit

- `urlStatus` : `ok`, `moved` (nouvelle adresse, mets-la dans `officialUrl`),
  `parked` (domaine en vente), `dead`, `blocked` (anti-bot).
- `productStatus` : `active`, `discontinued`, `acquired`, `renamed`, avec
  `statusNote` et une source dès que ce n'est pas `active`.
- Méfie-toi des homonymes : vérifie que le site est bien celui du produit
  décrit par le seed.

## 9. Rédaction

- **Anglais d'abord**, puis une vraie version française (pas une traduction
  mot à mot). Noms de plans et de produits dans leur langue de marque.
- Ton direct et calme, pour un indépendant ou une équipe de 1 à 5. En
  français, tutoiement dans les conseils.
- **Jamais de tiret cadratin (—).** Pas de « puissant », « robuste »,
  « révolutionnaire », « intuitif » sans preuve.
- **Aucune statistique inventée** ni attribuée à ToolTrim.
- **Une seule cible** par fiche : `audience.persona` parmi `THEO` (développeur),
  `SOFIA` (designer), `MARC` (consultant), `ALIX` (créateur de contenu),
  `CLAIRE` (ops, admin, petite équipe), sinon `OTHER` avec une description.
- `tagline` : ce que fait l'outil en 2 ou 3 mots (« IT helpdesk »,
  « Password manager »).
- `shortDescription` : une phrase factuelle, pas un verdict.
- `longDescription` : 2 à 3 paragraphes courts, logique produit et compromis.
- `pros` / `cons` : observables, non redondants avec `capabilities`.
- `verdict.keepIf` / `avoidIf` : adéquation ; `threshold` : seuil de
  décision chiffré quand c'est possible ; `billingTraps` : mécanique du
  contrat (engagement, sièges, dépassements), seulement si elle existe.

## 10. Validation

`node scripts/research/validate.mjs <slugs>` doit terminer sans erreur. Les
avertissements sont à lire : corrige-les s'ils révèlent une vraie faute.

## 11. Compte rendu de fin de session

```text
LOT <ID>
- traités : …
- partiels (et pourquoi) : …
PRIX
- modèles rencontrés : …
- cas ambigus laissés dans unknowns : …
ÉTAT DES PRODUITS
- URL corrigées, domaines parqués, produits arrêtés : …
CATALOGUE
- concurrents manquants (missingAlternatives) : …
VALIDATION
- résultat de validate.mjs
BRANCHE
- research/batch-<ID>, commit …
```

## 12. Prompt à coller dans la session cloud

Réglages : modèle Sonnet, effort **Bas**, environnement avec accès Internet
complet. Remplace `c1` par le numéro du lot.

```text
Exécute docs/CLOUD_RESEARCH_BRIEF.md en mode cloud (section 0, faits seulement) pour le lot c1 de research/queue.json (cloudBatches).
Lis uniquement ce brief, puis lance `node scripts/research/seed.mjs --batch c1`.
Respecte strictement la section 2 (budget) et la section 0. Un fichier research/dossiers/<slug>.json par outil, status "facts_collected", en anglais seulement. Ne touche jamais research/tool-pages/.
Valide avec `node scripts/research/validate.mjs --stage facts <les slugs du lot>` jusqu'à zéro erreur.
Commite uniquement ces fichiers directement sur main (pas de branche), puis `git pull --rebase origin main` et `git push origin main` (section 3).
Termine par le compte rendu de la section 11, en bref.
```

## 13. Mode enchaîné : plusieurs lots dans une seule session

Pour traiter une série de lots (par exemple `c3` à `c10`) sans lancer une
session par lot. La session principale est un **chef d'orchestre** : elle ne
fait aucune recherche elle-même.

Règles :
- Pour **chaque lot**, lance **un sous-agent** (outil Agent/Task) qui reçoit
  uniquement le prompt de la section 12 adapté au lot (mode faits seulement).
  Un sous-agent repart d'une conversation vide : c'est ce qui garde le coût
  par fiche au niveau d'une session courte. Ne fais jamais la recherche dans
  la session principale.
- Les lots s'enchaînent **l'un après l'autre**, jamais en parallèle.
- Tout se fait **directement sur `main`**, sans branche. Chaque sous-agent
  commite ses fichiers, et la session principale **pousse après chaque lot**
  (`git pull --rebase origin main` puis `git push origin main`) : si la
  session s'arrête, les lots finis sont conservés.
- Le sous-agent ne crée pas de branche et ne pousse pas lui-même.
- La session principale ne garde de chaque lot que son compte rendu bref
  (section 11). Elle ne relit pas les dossiers.
- Si un lot échoue deux fois à la validation, note-le et passe au suivant.
- À la fin : un compte rendu global, avec un tableau lot par lot (outils,
  erreurs, cas ambigus, concurrents manquants).

Prompt à coller (remplace `c3` et `c10`) :

```text
Exécute la section 13 de docs/CLOUD_RESEARCH_BRIEF.md (mode enchaîné) pour les lots c3 à c10 de research/queue.json (cloudBatches), directement sur main.
Tu es le chef d'orchestre : pour chaque lot, lance un sous-agent qui exécute le prompt de la section 12 pour ce lot, sur main, sans créer de branche ni pousser. Un lot après l'autre. Après chaque lot, vérifie que `node scripts/research/validate.mjs --stage facts` passe sur ses slugs, commite si besoin, puis `git pull --rebase origin main` et `git push origin main`.
Ne fais aucune recherche toi-même. Termine par le compte rendu global de la section 13.
```

# ToolTrim — Roadmap

État d'avancement et prochaines phases.

> Ce document conserve l’historique général du site.
>
> Le suivi technique actif et ses prochaines priorités figurent ci-dessous.
> Les autres roadmaps actives et décisionnelles sont :
> - [`ROADMAP_DIAGNOSTIC.md`](../ROADMAP_DIAGNOSTIC.md) pour le diagnostic adaptatif ;
> - [`MA_STACK_ROADMAP.md`](./MA_STACK_ROADMAP.md) pour Ma stack et l’exploration contextuelle.

## Livraison A — comptes et stack enregistrée (20 octobre 2026)

Implémentation locale derrière flags désactivés : état personnel complet v4, synchronisation avec révision, Google/GitHub/e-mail avec mot de passe, confirmation et récupération, isolation des comptes et suppression reprenable ; consultation comptes/stacks dans le back-office courant. Catalogue JSON conservé, livraison éditeur B séparée. Expérience complète du 21 octobre : formulaire partagé, avatar/menu, paramètres, nom facultatif, identités réellement associées, préférences sur cet appareil et export. Persona/métier/entreprise et qualification progressive restent des évolutions ultérieures.

Recette automatique locale : `npm run test:e2e:accounts` ; [conception](superpowers/specs/2026-10-19-accounts-stack-design.md), [user stories](superpowers/specs/tooltrim-user-stories-mvp.md) et [guide d'exploitation](STACK_ACCOUNT_OPERATIONS.md) versionnés. **Reste ouvert avant activation :** configuration Google/GitHub et e-mail/SMTP réelle, variables serveur/Vercel, migrations sur recette Supabase isolée, permissions/RLS avec rôles réels, concurrence multi-connexion, conseillers après migration et validation fournisseur FR/EN mobile/bureau. Les recettes locales et SQL embarquées ne ferment pas ces points. La recette du serveur généré est distincte et s’exécute sur le dist du build final, via `playwright.accounts-generated.config.ts` ; elle ne certifie pas le CDN réel. Activation et publication seront des opérations distinctes.

---

<a id="suivi-technique-actif"></a>

## État actif consolidé — 17 octobre 2026

[Suivi du 16 octobre](POST_R11_SUIVI_2026-10-16.md) : soumissions publiées (`0cdd87898b`), CI/Vercel et 16 parcours publics avec API simulée PASS. Recherche FR/EN publiée sur `d4fd0a8ec4`, CI réussie et six scénarios publics réussis. Rotation Redis effectuée par le propriétaire puis variable Production remplacée ; redéploiement Vercel `4tPsXg2QfHMKieypDsaUKWq2cq9Z` prêt. Contrôle public `replayOnly` d’un UUID fictif absent : 404 `submission_not_found` après déploiement, contre 503 avant ; lecture Redis rétablie sans création de soumission, email ni paiement. La copie privée locale de l’ancien jeton reste à actualiser.

Maintenance authentifiée et sauvegarde locale hors worktree vérifiées. Les deux propriétés GA4 montrent `explorer_view` sur les 14–15 octobre ; `save/back` non observés, aucune conversion déduite. R10/R11 publiés sur `ffbb3f7ac7`, CI/Vercel et 21 contrôles publics R11 réussis. Sponsoring reporté explicitement jusqu’à une vente ; offre conservée.

Ce tableau pilote la suite ; les bilans et tableaux datés du 9 octobre plus bas sont des états historiques.

| Chantier | État actuel et prochaine condition |
|---|---|
| Hygiène du dépôt — 16 octobre | Repasse fichiers, code, dépendances et références validée (installation propre, tests, types, build, 27 contrôles navigateur, relecture) : 171 anciens fichiers suivis retirés ; 35 dépendances directes inutilisées retirées, anciennes UI/homepage et reliquats Lovable/Bun retirés ; consignes Codex/Claude consolidées, README relié aux références actives. Environ 2,04 Go logiques de copies et dépendances locales supprimés. Preuves recherche, catalogue, migrations actives et builds Claude en cours préservés. Nettoyage publié sur `e4a0e1e8b0` ; déploiement réussi, puis 13 contrôles publics recherche/découverte réussis. La livraison suivante `f87ce293d8`, qui le contient, a aussi passé CI et Vercel. |
| Parcours Ma Stack → Explorer → enregistrement → retour | Publié ; contrôles techniques FR/EN mobile/ordinateur intégrés à la CI. Ils ne prouvent pas la valeur perçue des relations. |
| R8 — Clavier et filtres | Trois scénarios obsolètes repris, deux panneaux sans nom accessible corrigés ; 21 contrôles Chromium et 42 passages publics réussis. CI du correctif tokens `b7fa441935` réussie. Couverture exhaustive, WebKit et lecteurs d’écran restent différés. |
| R9 — Instrumentation | Publié, 19 contrôles publics réussis. Les trois événements sont acceptés par les deux flux GA4 existants (HTTP 204 avec accord) ; visibilité dans les rapports et exploitation de l’entonnoir restent à vérifier. [Contrat et limites](R9_RECETTE_UTILISATEURS.md#mesure-technique-du-parcours--14-octobre-2026). |
| R9 — Utilisateurs | Protocole prêt ; essais réels reportés par le propriétaire. Aucun participant observé ni critère quatre sur cinq acquis. |
| R5/R6 — Relations et catalogue | Différés ; travail local conservé, aucune publication des quatorze fiches. Registre réaligné au checkpoint de 1 349 entrées versionnées : couverture et idempotence vérifiées ; 172 ajouts en attente, 72 validations invalidées conservées comme STALE. Aucune campagne de fiches relancée. Revoir le processus et le budget avant reprise. |
| R3/R7 — Architecture et chargement catalogue | Validés localement, publication en attente : catalogue public JSON sans nouvelle base ; retour distant opt-in. Puis transport de l’index sans perte : **−18,33 % décompressé / −6,77 % gzip local**, objets et sources conservés. 463 tests app, 198 Ma Stack (couverture recoupée), 39 contrats SEO, 105 scénarios navigateur, build/types PASS ; 13 184 HTML équivalents et 34 captures sans appel Supabase ni perte de sélection. [Mesures, limites et retour arrière](PROJECTION_INDEX_NAVIGATEUR_2026-10-08.md#r7-compact-2026-10-17). |
| R10 — Chaîne de build | Remédiation publiée (`ffbb3f7ac7`, CI/Vercel et recette publique réussis) : Tailwind 4.3.3, plugins obsolètes retirés, tests alignés sur le plugin React actif et fusionneur de classes compatible. Audit npm **9 → 0** ; build Node 20 et budgets validés, cascade et tokens conservés. [Bilan et preuves](R10_R11_CLOTURE_2026-10-15.md). |
| R11 — SEO/GEO et médias | Correctifs techniques publiés (`ffbb3f7ac7`, CI/Vercel et recette publique réussis) : descriptions/LLM, 62 références corrigées sur 54 outils, filtre des captures invalides, vrais 404 conservés après hydratation, sept traductions libérées des redirections obsolètes. Sitemap/routing contrôlés ensemble ; Search Console consultée. Publication et réexploration Google restent des états distincts. [Bilan](R10_R11_CLOTURE_2026-10-15.md). |
| Soumissions et paiement | Chantier séparé. Cette passe ne recertifie pas son fonctionnement et n’effectue aucun paiement. Rotation Production déjà vérifiée le 16 octobre ; copie privée locale du jeton à actualiser séparément. |
| Axe agentique et MCP — 16 novembre | Angle décidé : attribut des fiches d'abord. Schéma du bloc `agent` proposé, à valider ; rien d'implémenté. [Plan et schéma](#axe-agentique-mcp). |

**Suite :** publier les deux lots locaux R3/R7 après revue, puis contrôler les parcours, requêtes, compression et cache CDN en production. Le transport commun est désormais réduit sans suppression de champs ; un fractionnement supplémentaire n’est pas requis pour clôturer ce canary et ne sera ouvert que sur un besoin mesuré. L’exploitation GA4 et les essais utilisateurs restent distincts ; R5/R6 éditoriaux ne sont pas relancés.

<a id="axe-agentique-mcp"></a>

## Axe agentique et MCP — 16 novembre 2026

**Décision (Michael, 16/11) :** le MCP entre d'abord comme attribut de décision des fiches existantes, pas comme annuaire dédié. L'intégration à Ma Stack et à l'Explorer vient après la mission Ma Stack en cours ; le cadrage du bloc de faits et le pilote peuvent avancer en parallèle. Rien n'est implémenté à cette date.

### État des lieux (relevé le 16/11)

- Référence : [Toolfolio, Agent Resources](https://toolfolio.com/agent-resources/mcp-servers). 335 serveurs MCP et 146 skills dans leur sitemap. Fiche : description, éditeur officiel ou non, connexion distante/locale, authentification, clients compatibles, commande d'installation, date de vérification. Aucun verdict, public développeur ; rien sur le forfait requis ni sur l'accès en écriture. Leur catalogue est lui-même exposé en serveur MCP (lecture seule).
- ToolTrim : `form_factor = 'mcp'`, la route `/mcp/:slug`, `guard-plugins.mjs` et la règle éditoriale de `scripts/repass/SPEC.md` existent. Aucune fiche de l'index JSON (1 360) ne porte `formFactor` ni `worksWith` : ces champs ne viennent que de Supabase, donc les pages hôtes restent vides avec la source publique par défaut. 16 fiches mentionnent MCP, en prose seulement.
- Recouvrement : 119 des 335 serveurs Toolfolio correspondent par slug ou nom exact à une fiche du catalogue ; quelques autres existent sous un autre slug (Mailchimp, HubSpot, Jira, Wix, Softr), soit environ 130. Correspondance automatique, non relue fiche par fiche.

### Étapes

| Étape | Livrable | Condition de sortie |
|---|---|---|
| M0 — Cadrage | Schéma du bloc `agent` (ci-dessous) validé ; choix de la source structurée de contrôle (registre MCP officiel à évaluer, non consulté à ce jour) | Schéma validé par Michael, vocabulaires fermés ajoutés au garde-fou |
| M1 — Pilote | 20 outils les plus présents dans les stacks, faits vérifiés sur la documentation officielle ; bloc sur la fiche ; guide pilier FR/EN « MCP pour freelances non-développeurs » | 20 blocs sourcés et datés, projection JSON, rendu fiche validé |
| M2 — Extension | Les ~130 recouvrements ; filtre Explorer « connectable à mon assistant » ; signal Ma Stack ; critère dans les comparatifs | Après la mission Ma Stack ; contrôle de fraîcheur automatisé en place |
| M3 — Fiches MCP autonomes | Serveurs sans outil hôte au catalogue (`form_factor = 'mcp'`), pages `/mcp/<client>` au seuil de 3 | Demande constatée sur M1/M2 |
| M4 — Serveur MCP ToolTrim | Catalogue et Ma Stack interrogeables depuis un assistant | À décider après M2 |

**Risque principal : la fraîcheur.** Ces faits changent vite ; c'est le motif qui a fait différer R5/R6. Pas de passage à M2 sans contrôle automatisé et sans budget convenu.

### Schéma proposé du bloc `agent` (à valider, M0)

Écrit dans le fichier de recherche de la fiche (`facts.agent`), projeté en `agentAccess` dans `tools_v4.json` et en version réduite dans `tools_index.json`.

```jsonc
"agent": {
  "mcp": "official",            // official | community | none ; bloc absent = non vérifié
  "verified_on": "2026-11-16",  // obligatoire, y compris pour "none"
  "sources": [{ "label": "…", "url": "…" }],   // au moins une source éditeur, sauf "none"
  "servers": [{                 // vide si "none" ; plusieurs possibles (Cloudflare, Mailchimp)
    "name": "GitHub MCP",
    "transport": "remote",      // remote | local
    "auth": ["oauth", "token"], // oauth | api_key | token | none
    "access": "read_write",     // read | read_write | docs_only
    "plan": "all",              // all | paid | specific | unknown
    "plan_note": "…", "plan_note_en": "…",     // requis si "specific"
    "clients": ["claude", "cursor"],            // slugs du catalogue, attestés par l'éditeur uniquement
    "docs_url": "…"
  }]
}
```

Règles : vocabulaires fermés, contrôlés par le garde-fou comme `form_factor` ; `none` signifie « vérifié, pas de serveur » et se distingue du bloc absent ; aucun client listé sans attestation de l'éditeur ; pas de commande d'installation recopiée (lien vers la documentation). `form_factor` et `works_with` ne changent pas : ils restent réservés aux fiches MCP autonomes de M3. Index réduit : `mcp`, `transport`, `access`, `clients`, `verifiedOn`.

Schéma accepté à titre provisoire (Michael, 16/11), à éprouver avant d'être figé. Trois champs sont incertains : `plan` (souvent non documenté par les éditeurs, risque de `unknown` en masse), `clients` (un serveur distant fonctionne en principe avec tout client MCP ; premier champ à retirer s'il coûte trop), `access` (dépend souvent des permissions du compte ; une valeur supplémentaire peut être nécessaire).

### Prochaine action — essai du schéma sur cinq outils (brief de reprise)

Tâche d'exécution, autonome, à faire dans une session neuve à partir de ce seul brief.

- **But :** savoir quels champs du bloc `agent` se remplissent proprement depuis les documentations officielles, avant le pilote de 20.
- **Outils :** `notion`, `stripe`, `canva`, `figma`, plus un outil du catalogue sans serveur MCP (candidat non vérifié : `hotjar` ; en changer s'il en a un) pour éprouver la valeur `none`.
- **Sources :** uniquement la documentation ou le site de l'éditeur, consultés le jour même. Toolfolio sert à repérer, jamais de preuve. Un fait introuvable s'écrit `unknown` ou se note comme manquant ; ne rien déduire.
- **Sortie :** un fichier par outil dans `research/agent-trial/<slug>.json`, contenant le seul bloc `agent` au format ci-dessus. Ne toucher ni à `research/dossiers/`, ni à `research/bundle-editorial/`, ni à `src/data/`, ni au code. Pas de commit sur la branche Ma Stack.
- **Bilan attendu, en réponse et non en fichier :** pour chaque champ, combien d'outils sur cinq l'ont rempli avec une source ; les cas qui n'entrent pas dans le vocabulaire ; une recommandation garder / modifier / retirer pour `plan`, `clients` et `access`.
- **Terminé quand :** cinq fichiers sourcés et datés existent, le bilan est rendu, et la section « Schéma proposé » ci-dessus est corrigée selon ce que Michael retient.

### Règles d'arbitrage pour la suite (écrites le 16/11 pour décider sans nouvelle session de cadrage)

**Après l'essai sur cinq outils, pour chaque champ incertain :**
- `plan` : le garder si au moins 3 outils sur 5 le remplissent avec une source éditeur ; sinon le retirer du schéma et dire le forfait en prose dans le verdict quand il est connu.
- `clients` : le garder seulement si les éditeurs restreignent réellement certains clients. S'ils disent « tout client MCP », le remplacer par rien pour les serveurs distants et ne le conserver que pour les serveurs locaux.
- `access` : si plusieurs outils répondent « selon les permissions du compte », ajouter la valeur `account_scoped` plutôt que de forcer `read_write`.
- Tout autre champ rempli sur moins de 3 outils sur 5 sort du schéma. Dans le doute, retirer : un bloc court et vrai vaut mieux qu'un bloc complet à moitié `unknown`.

**Choix des 20 outils du pilote M1 :** partir de `research/agent-trial/toolfolio-overlap-2026-11-16.json`, croiser avec la présence dans les stacks (`src/data/stacks-catalog-index.json`) et les impressions (`src/data/tool_demand.json`), puis équilibrer les catégories. Écarter les outils pour développeurs (Terraform, Redis, Playwright…) : le public est le freelance non-développeur. Inclure deux ou trois outils `none`.

**Rendu sur la fiche (M1) :** le bloc dit une décision, pas une fiche technique. Une phrase de verdict (« pilotable depuis votre assistant, en lecture et écriture, sur tous les forfaits »), puis les faits, la date de vérification et le lien vers la documentation. Pas de badge, pas de logo de client, pas de commande d'installation (règles de `PRODUCT.md`). Composant dans `src/ds/`, stories d'abord. Un outil `none` l'affiche aussi : « pas de serveur MCP officiel au JJ/MM ».

**Guide pilier (M1) :** répond à « qu'est-ce que ça change pour moi ? » pour un freelance sans code : ce qu'un assistant peut faire dans ses outils, ce qu'il faut vérifier avant de connecter (accès en écriture, forfait), trois exemples tirés des fiches du pilote. Ton et format des guides existants.

**Critère pour passer à M2 :** les 20 blocs tiennent sans correction un mois après leur vérification, ou un contrôle automatisé signale les écarts ; et le guide ou les fiches du pilote montrent des impressions ou des clics. Sans l'un des deux, s'arrêter à M1.

**Ce que ToolTrim ne fait pas sur cet axe :** annuaire neutre de serveurs, classement par popularité, skills, commandes d'installation. C'est le terrain de Toolfolio.

## Priorité révisée — 13 octobre 2026

R5/R6 éditoriaux différés : le travail préparé est conservé localement, sans nouvelle campagne de fiches/tarifs. Priorité au parcours Ma Stack → Explorer → enregistrement → retour et à ses essais utilisateurs. Le fil global réutilise les routes existantes ; la migration catalogue ne bloque pas ce travail local-first. Avant reprise catalogue : tri par impact, contrôles structurels automatisés, lots cohérents, une revue/bilan consolidés et budget convenu. [Parcours et protocole](MA_STACK_ROADMAP.md).


## Bilan technique au 9 octobre 2026 (historique)

**Bilan de référence : [état des lieux, gains et découpage des lots au 9 octobre](ETAT_DES_LIEUX_ET_ROADMAP_2026-10-09.md).** Les mesures ci-dessous décrivent ce checkpoint historique. Pour les statuts courants, consulter le tableau consolidé en tête de document.

### Situation vérifiée au 9 octobre 2026 (historique)

| Niveau | État vérifié |
|---|---|
| Socle publié | Code `4601f877cf` (R1), après contrats API `13b631bc1d` (R0) : CI complètes et statuts Vercel réussis, recette API publique conforme. Socle frontend Router `88d7f5d7a5` conservé : prix/navigation/stockage, SSR/SEO, dépendances compatibles, compactage et hydratation FR/EN. |
| Publié et vérifié | R1 `4601f877cf` : contrat HTTP compatible, retrait du SDK de types ; 82 contrats/types et tests app/SEO passent. Build, CI, Vercel et recette publique réussis. |
| Hors de ces lots | Refonte locale catégories et travaux catalogue/médias non suivis, préservés. |
| Non certifié | Contre-audit R2 partiel : projet public Supabase INACTIVE, écarts applicatifs reproduits ; permissions/code distant/WAF non certifiés. Relations et valeur utilisateur restent à valider. |

Gains mesurés : **24,62 MiB de formatage HTML**, **5,59 MiB de bootstrap**, et **17 595 octets / 4,99 % gzip CDN** sur l’index navigateur. Ce sont des métriques distinctes, pas un gain global de vitesse. Audit npm actualisé : **9 entrées complètes / 7 omit-dev, zéro critique**, après retrait du SDK dans R1. Dernier artefact local validé : **824,8 MiB**, dont **713,2 MiB HTML** (budgets 831/716). Dernière CI complète R1 : 266 tests applicatifs, 82 contrats API, 23 contrats SEO, 99 tests Ma Stack et 56 hydratations en 5,2 min ; les suites ne sont pas additionnées.

### Suivi des lots au 9 octobre 2026 (historique)

| Lot | Prochaine décision / dépendance |
|---|---|
| R0 — Publication des contrats API | Publié ; nouvelle étape API verte. CI complète et déploiement Vercel réussis. |
| R1 — Réduction SDK | Terminé et publié `4601f877cf` : audit 15 → 9, 104 entrées lock retirées ; CI et recette publique réussies. |
| R2 — Contre-vérification backend manuel | Audit distant partiel ; correctif de preuve paiement et reprise implémenté/validé localement, activation Creem à attester. Badge gratuit imposé côté serveur et validé localement ; déduplication atomique et reprises email implémentées et vérifiées localement sans Supabase ; activation Upstash/Creem/Vercel et quota restent ouverts. [Bilan](BILAN_SOUMISSIONS_2026-10-09.md). [Correctif local](CORRECTIF_CREEM_2026-10-09.md), [R2a–R2c](CONTRE_AUDIT_BACKEND_2026-10-09.md). |
| R3 — Baseline API catalogue saine | Backend public déclaré INACTIVE ; accès fonctionnel requis avant baseline ou décision d’architecture distante. |
| R4 — Promesse Ma Stack | Aligner coûts, recoupements et économies avec ce qui est réellement démontré. |
| R5 — Relations Explorer | Pilote éditorial de référence et explication des liens. |
| R6 — Catalogue factuel / canary | Base commune existante, identités, faits sourcés, projection et rollback ; coordination requise. |
| R7 — Chargement suivant | Mesure et canary après R3/R6 ; aucune suppression sur gain théorique seul. |
| R8 — Accessibilité / Safari | Parcours stabilisés, focus, clavier, mobile et overlays. |
| R9 — Mesure / utilisateurs | Observer la valeur de la boucle Explorer → ajout → retour, avec consentement respecté. |
| R10 — Tailwind / outils de build | Lot conditionnel, isolé ; coût de migration à comparer au bénéfice réel. |
| R11 — SEO/GEO / médias | Revalider les défauts actuels, corriger les fiches prioritaires, observer l’indexation si accès disponible. |

Le [bilan complet](ETAT_DES_LIEUX_ET_ROADMAP_2026-10-09.md#4-roadmap-complète-proposée-par-lots) décrit pour chaque lot son livrable, sa dépendance, son critère de sortie et l’effort relatif. Les propositions ne valent pas autorisation d’implémentation. Aucun gain Core Web Vitals ou de classement Google n’est établi. Comptes/synchronisation, personnalisation avancée, diagnostic/nouvelles verticales et dark mode restent séparés.

---

## Phase 1 — Composants éditoriaux ✅ (Sessions 1–3)

| Item | Statut |
|---|---|
| StickyDecisionCard redesign | ✅ Fait |
| ToolDetailPage hero simplifié | ✅ Fait |
| Section Décision rapide (3 blocs) | ✅ Fait |
| Onglets renforcés (72px, 16px, 2px underline) | ✅ Fait |
| Bande Audit de stack (full-width) | ✅ Fait |
| Footer CTA ToolTrim (full-width) | ✅ Fait |
| GuidesPage éditorial (gi-*) | ✅ Fait |
| GuideDetailPage article éditorial (ga-*) | ✅ Fait |
| Variable --header-height dans :root | ✅ Fait |

---

## Phase 2 — Stabilisation structurelle (Sprint 1) ✅

| Item | Statut | Notes |
|---|---|---|
| Mobile menu full-screen | ✅ Corrigé | Panel 1023px → full-width, scrollable |
| Variable --navbar-h | ✅ Corrigé | Alias de --header-height |
| Sticky sidebar vérifié | ✅ Vérifié | Pattern correct depuis Session 1 |
| CLAUDE.md créé | ✅ Fait | Guide pour Claude |
| docs/AI_HANDOFF.md créé | ✅ Fait | Handoff opérationnel |
| docs/ROADMAP.md créé | ✅ Fait | Ce fichier |
| ToolCardEditorial (orphelin) | 📋 Documenté | Migration Phase 3 |
| Dark mode gi-*/ga-* | 📋 Dette technique | Phase 6 |

---

## Sprint 2 — Refonte template page outil ✅

| Item | Statut | Notes |
|---|---|---|
| H1 conditionnel noms courts (≤5 chars → max 104px) | ✅ Fait | `clamp(4.5rem, 8vw, 6.5rem)` |
| Sidebar sticky top offset | ✅ Fait | `calc(var(--navbar-h, 68px) + 20px)` |
| Label "Prix à partir de" sidebar | ✅ Fait | Conditionnel si displayPrice > 0 |
| Responsive td-dr-grid, td-diag-inner, td-footer-inner | ✅ Vérifié | Breakpoints 768px/900px existants OK |

---

## Sprint 3 — Guides + Articles ✅

| Item | Statut | Notes |
|---|---|---|
| Hero metadata tags → dot-séparés | ✅ Fait | CSS `::before` |
| Titres lignes articles (30px→42px) | ✅ Fait | `gi-row-title` |
| Bloc featured agrandi | ✅ Fait | `gi-featured-title` |
| H2 articles (42px→56px) | ✅ Fait | `ga-content h2` |
| H3 articles (28px→34px) | ✅ Fait | `ga-content h3` |
| TOC sticky offset → var(--navbar-h) | ✅ Fait | `ga-toc-col` |
| TOC links couleur (#6F6F68) | ✅ Fait | `ga-toc-link` |
| Encadrés "À retenir" | ✅ Fait | parser Markdown → ga-takeaway |
| Module outils — badge prix | ✅ Fait | `ToolRow` amélioré |
| Correction CTA /diagnostic → /selector | ✅ Fait | GuidesPage + GuideDetailPage |
| eh-description standardisée | ✅ Fait | 19px, #6F6F68, 680px |

---

## Sprint Guides v2 — Filtres, logos, section Commencer ici ✅

| Item | Statut | Notes |
|---|---|---|
| Barre de filtres éditoriaux | ✅ Fait | 7 filtres, pills noirs, zéro bleu |
| Tri discret | ✅ Fait | Récents / Sélection / Lecture courte |
| Logos outils cités (pastilles) | ✅ Fait | `tool-logo-stack`, max 5, +N overflow |
| Rows guides améliorées | ✅ Fait | type + intent + logos dans chaque row |
| Section "Commencer ici" | ✅ Fait | 3 angles, `gi-start-here-grid` |
| Load more (12 par défaut) | ✅ Fait | `gi-load-more`, reset sur filtre/tri |
| Hero right module synchro | ✅ Fait | Partage le même `activeFilter` |
| Responsive filtres scroll horizontal | ✅ Fait | `≤700px` |

---

## Sprint Grid — Système de grille global ✅

| Item | Statut | Notes |
|---|---|---|
| Tokens `--layout-*` dans `:root` | ✅ Fait | max, content, article, sidebar, gutter |
| Overrides responsive `--layout-gutter` | ✅ Fait | 48px → 32px (≤1023) → 20px (≤767) |
| Classes utilitaires `.layout-*` | ✅ Fait | shell, content, article-grid, tool-grid |
| `eh-container` 1440px → 1280px | ✅ Corrigé | Aligne hero vs body sur GuidesPage |
| `ga-body-grid` 1120px → 1280px | ✅ Corrigé | Aligne body article vs hero |
| `ga-cta-inner` 1120px → 1280px | ✅ Corrigé | Aligne CTA band vs body |
| Containers tokenisés (`gi-*`, `ga-*`, `td-*`) | ✅ Fait | Utilisent `var(--layout-*)` |

---

## Sprint 5b — Stacks : refonte éditoriale ✅

| Item | Statut | Notes |
|---|---|---|
| StacksPage réécriture (`sk-*`) | ✅ Fait | Hero inline, profils grid, pills filtres, cards pastilles |
| StackDetailPage réécriture (`sd-*`) | ✅ Fait | Hero brand, subnav noir, summary métriques, tool rows, CTA band |
| Fix React hooks violation (useMemo avant return) | ✅ Corrigé | `relatedStacks` déplacé avant `if (!stack)` |
| Suppression `Button` / `ArrowRight` (bleu) | ✅ Fait | Remplacés par boutons noirs inline ou `<Link>` |
| ToolPanel / Sheet conservé intact | ✅ Vérifié | Aucun changement |

---

## Sprint Comparatif v2 — Renforcement affordance de comparaison ✅

| Item | Statut | Notes |
|---|---|---|
| Section "Ce que fait chaque outil" (cp-overview-grid) | ✅ Fait | 2 cards symétriques, desc + cas d'usage |
| Section "Avantages et limites" (cp-pros-cons-grid) | ✅ Fait | Remplace "Limites" seule, pros + cons séparés |
| Section "Ce qui doit te faire choisir" (cp-decision-list) | ✅ Fait | Rows contexte → choix |
| Interface CompareEditorialContent étendue | ✅ Fait | toolADesc/UseCases, prosA/B, decisionRows |
| Subnav 7 ancres | ✅ Fait | Ajout "Ce que font les outils" + "Avantages" |
| Labels verdict plus explicites ("Prends X si…") | ✅ Fait | |
| buildFallbackContent mis à jour | ✅ Fait | Nouveaux champs dérivés des données outil |
| CSS cp-overview-* + cp-pros-cons-* + cp-decision-* | ✅ Fait | ~130 lignes |

---

## Sprint Comparatif — Refonte /fr/comparatif/:pair ✅

| Item | Statut | Notes |
|---|---|---|
| Hero 2 colonnes (cp-hero-inner) | ✅ Fait | H1 font-brand, module VS sticky |
| Subnav 6 ancres (cp-subnav) | ✅ Fait | Zéro bleu, underline noir |
| Verdict rapide 3 colonnes (cp-verdict-grid) | ✅ Fait | |
| Tableau comparatif 10 lignes (cp-table) | ✅ Fait | Responsive data-label mobile |
| Profils 6 cartes (cp-profile-grid) | ✅ Fait | |
| Prix avec bold (PricingNote) | ✅ Fait | Composant interne regex |
| Limites 2 colonnes (cp-limits-grid) | ✅ Fait | `::before "—"` |
| Alternatives 5 lignes (cp-alt-row) | ✅ Fait | Link DB / div statique |
| CTA band fond #EDEDE8 (cp-cta-band) | ✅ Fait | |
| FAQ accordion (FaqItem) | ✅ Fait | `<details>/<summary>` natif |
| Registre éditorial + fallback générique | ✅ Fait | `EDITORIAL_CONTENT` + `buildFallbackContent()` |
| Système CSS `cp-*` (~300 lignes) | ✅ Fait | Ajouté dans `index.css` |
| Documentation CHANGELOG/DESIGN_SYSTEM/ARCHITECTURE/ROADMAP | ✅ Fait | Ce sprint |

---

## Sprint Stack Detail — Refonte éditoriale StackDetailPage ✅

| Item | Statut | Notes |
|---|---|---|
| Hero 2 colonnes (sd-hero-grid) + Snapshot sticky (sd-snapshot) | ✅ Fait | Logos outils pastilles, métriques, verdict court |
| Subnav 6 ancres (sd-nav) | ✅ Fait | Vue d'ensemble / Outils / Budget / Risques / Alternatives / FAQ |
| Section Vue d'ensemble : intro + grille 3 col + note expert | ✅ Fait | sd-overview-grid, sd-expert-note |
| Section Outils : groupes par couche + labels Essentiel/Optionnel/À challenger | ✅ Fait | PERSONA_LAYERS pour persona contenu |
| Section Priorités 3 colonnes (sd-priority-grid) | ✅ Fait | Codes couleur vert/gris/rouge |
| Section Budget 3 niveaux (sd-budget-list) | ✅ Fait | Minimal / Recommandé / À surveiller |
| Section Risques (sd-risk-enhanced-row) | ✅ Fait | Format Problème / Conséquence / Recommandation |
| Section Alternatives 3 variantes (sd-alt-grid) | ✅ Fait | Minimale / Recommandée / Intensive |
| CTA band fond #EDEDE8 (sd-cta-band + sd-cta-inner) | ✅ Fait | |
| Section FAQ accordéon (sd-faq-list) | ✅ Fait | details/summary natif + ChevronDown |
| Registre éditorial EDITORIAL_REGISTRY + buildFallbackEditorial() | ✅ Fait | Contenu complet pour createur-contenu-operateur |
| PERSONA_LAYERS — couches thématiques persona contenu | ✅ Fait | Remplace STACK_LAYERS générique |
| ~297 classes CSS sd-* ajoutées dans index.css | ✅ Fait | |

---

## Sprint Stacks Facettes — Sidebar de facettes ✅

| Item | Statut | Notes |
|---|---|---|
| Layout 2 colonnes `sk-listing-layout` (256px + 1fr) | ✅ Fait | Gap 48px, align-items start |
| Sidebar sticky + scrollable (`sk-sidebar`) | ✅ Fait | max-height viewport, overflow-y auto, scrollbar thin |
| 4 groupes de facettes : Profil / Objectif / Budget / Complexité | ✅ Fait | `sk-facet-group`, `sk-facet-option`, `sk-facet-count` |
| `FacetGroup<T>` composant générique | ✅ Fait | TypeScript generic, réutilisable desktop + mobile |
| `SidebarContent` composant partagé | ✅ Fait | Utilisé dans sk-sidebar ET sk-mobile-panel |
| Filtrage combinatoire `stackMatchesFacets` | ✅ Fait | Profile × Objectif × Budget × Complexité × Query |
| Dérivation objectifs depuis `subProfiles` | ✅ Fait | `OBJECTIVE_SUBPROFILES` + `getStackObjectives()` |
| Compteurs dynamiques par facette | ✅ Fait | Sur l'ensemble STACKS, pas la sélection courante |
| Panneau mobile full-screen (`sk-mobile-panel`) | ✅ Fait | Fixed, scrollable, Escape key, body overflow lock |
| Bouton "Filtres (N)" avec badge count | ✅ Fait | `sk-mobile-trigger-row`, masqué >= 1024px |
| Barre résultats (count + tri) | ✅ Fait | `sk-results-header`, search desktop dans `sk-results-search` |
| Tags cards : budget tier + complexité + outils | ✅ Fait | `sk-card-tags-row`, `sk-card-tag` |
| Empty state + reset button | ✅ Fait | `sk-empty-state`, `sk-empty-reset` |
| Suppression `FILTER_PILLS` / `StackFilterId` | ✅ Fait | Remplacés par sidebar facettes |

---

## Sprint Stacks v2 — Filtre + tri ✅

| Item | Statut | Notes |
|---|---|---|
| Contrôle de tri (Recommandé / Budget / Outils) | ✅ Fait | `gi-sort-select`, même ligne que filtres |
| `StackSortId` type + `sortBy` state | ✅ Fait | `"recommended" \| "budget" \| "tools"` |
| Logique de tri dans `filteredStacks` useMemo | ✅ Fait | Budget croissant, outils décroissant, recommended = FEATURED_STACK_SLUGS |
| `sk-filter-row` layout filtre + tri | ✅ Fait | `display: flex; flex-wrap: wrap; gap: 8px` |
| Empty state amélioré avec reset button | ✅ Fait | Reset filtre + query + tri en un clic |

---

## Sprint Comparatifs Index v2 — Refonte éditoriale ✅

| Item | Statut | Notes |
|---|---|---|
| Hero inline (sans EditorialHero) | ✅ Fait | `cix-hero`, H1 2 lignes, zéro badge |
| Barre de recherche 56px (`cix-search-input`) | ✅ Fait | Filtering temps réel sur nom d'outil |
| Chips de suggestion (`cix-suggestion-chip`) | ✅ Fait | 5 suggestions, injectées dans searchQuery |
| Filtres catégorie (`cix-filter-pill`) | ✅ Fait | IA / Productivité / Design / Automatisation / CRM |
| `getSlugCategory()` détection auto par slug | ✅ Fait | Pas de modification de comparisons.ts |
| `deriveCardDesc()` description contextuelle | ✅ Fait | verdict.keepIf → shortDescription → fallback |
| Grille 2 colonnes (`cix-grid`) | ✅ Fait | Gap 24px, ≤900px → 1 colonne |
| Cards redessinées (`cix-card`) | ✅ Fait | VS block, logos pastilles, cta arrow hover |
| Comparateur custom conservé et restyled | ✅ Fait | `cix-comparator-band`, fond #F8F8F4 |
| Système CSS `cix-*` (~280 lignes) | ✅ Fait | Ajouté dans `index.css` |

---

## Sprint 5a — Responsive / QA global (à faire)

| Item | Priorité | Notes |
|---|---|---|
| CategoryPage sidebar sticky offset | HAUTE | `sticky top-6` → `calc(var(--navbar-h, 68px) + 20px)` |
| Nettoyage CSS `tc-list-row` orphelin | MOYENNE | Remplacé par `tcr-*`, anciens sélecteurs à supprimer |
| Suppression dead code `ToolCard` default/list-row | MOYENNE | Variants dépréciés mais encore présents dans le fichier |
| Audit breakpoints 1440→375px sur toutes les pages | HAUTE | 10 breakpoints, vérification visuelle |
| GuidesPage filtres scroll horizontal ≤700px | MOYENNE | Vérifier que le scroll fonctionne sur iOS |
| Accessibilité : focus rings, Escape menus, labels boutons | MOYENNE | |

---

## Phase 3 — Cards / Listings ✅ Sprint 4

| Item | Statut | Notes |
|---|---|---|
| Migration ToolCardEditorial → remplace ToolCard default | ✅ Fait | ToolsPage grille principale |
| Score ToolTrim visible sur card grid | ✅ Fait | prescription_quality → score numérique |
| ToolRowEditorial (list row éditorial) | ✅ Fait | Remplace list-row dans CategoryPage |
| Stack cards contextuelles (`sk-card`) | ✅ Fait | StacksPage sélection profil / budget / niveau |
| ResultsPage : intégrer editorial card | 📋 Backlog | Après validation sur ToolsPage |

**Système de cards stabilisé :**
- `ToolCardEditorial` — grille outils (ToolsPage) — **actif**
- `ToolRowEditorial` — liste catégorie (CategoryPage) — **actif**  
- `sk-card` — stacks contextuelles (StacksPage) — **actif**
- `ToolCard variant="featured"` — sélection éditoriale (ToolsPage) — conservé
- `ToolCard variant="list-row"` — déprécié (remplacé par ToolRowEditorial)
- `ToolCard variant="default"` — déprécié (remplacé par ToolCardEditorial)

---

## Phase 4 — Homepage

| Item | Priorité |
|---|---|
| Vérifier cohérence typographique eh-hero-title vs td-hero | HAUTE |
| Standardiser H1 hero home avec --font-brand, ls -0.07em | MOYENNE |
| Améliorer section "Stacks en vedette" | BASSE |

---

## Phase 5 — Performance

| Item | Priorité | Notes |
|---|---|---|
| Chargement catalogue : projections et shards | HAUTE | Ancienne mesure 3,3 MB obsolète ; shards outil/stack déjà générés. Mesurer les téléchargements réels avant le prochain découpage ; voir le suivi technique actif. |
| Lazy loading des sections ToolDetail | MOYENNE | ToolVerdictBlock, ToolAlternativesSection |
| Images WebP + srcset | MOYENNE | Logos outils |

---

## Phase 6 — Dark mode

| Item | Statut | Notes |
|---|---|---|
| Préférence clair/sombre persistante | ✅ Fait | Sélecteur dans la sidebar, fallback sur la préférence système |
| Guides `gi-*` en sombre | ✅ Vérifié | Index contrôlé visuellement dans le shell desktop |
| Audit global des pages historiques | 📋 Dette technique | Vérifier les anciennes surfaces non migrées vers les tokens |
| Prévention du flash de thème au chargement | 📋 À évaluer | Ajouter un script de pré-hydratation uniquement si le flash est perceptible en production |

---

## Backlog

- Colonnes thèmes GuidesPage dynamiques (actuellement statiques/hardcodées)
- TOC de GuideDetailPage : tester avec accents dans les titres H2
- Mobile menu : skeleton ou état de chargement dans panel-content (données Supabase tardives)
- Submit tool flow : vérifier le flux complet
- Ajouter `llms.txt` pour GEO readiness


## 5 octobre 2026 — Mon Stack V1

- Expérience personnelle locale : Stack/Map, recherche directe, inspection contextuelle et retrait annulable. Voir `docs/MON_STACK_V1.md`.
- Dette dark mode : les nouvelles classes ms-* utilisent les tokens du thème ; validation visuelle sombre détaillée différée.
- Dette transverse : vérificateur TypeScript strict et baseline design-tokens déjà en échec hors périmètre. Aucun nouveau rayon littéral ni couleur hex dans ce chantier.

### Suite des soumissions — implémentation locale sans Supabase

Le propriétaire choisit Upstash Redis gratuit et conserve le traitement manuel par email. Le [plan préparé](superpowers/plans/2026-10-09-submission-idempotency.md) couvre réservation atomique, reprises des deux emails, identifiants stables gratuit/payant et recette. Exécuté localement : 175 tests API avec Redis réel, 287 app, 23 SEO, 14 Chromium, types et build PASS. Relecture indépendante suivie de corrections vérifiées. Aucun compte/raccordement distant créé ni publication. Configuration Upstash/Creem/Vercel, quota, sauvegarde distante et rétention restent à attester. [Bilan et décisions](BILAN_SOUMISSIONS_2026-10-09.md).

### Back-office — dette visuelle (25 octobre 2026)

Le nouveau workspace bo-* utilise les tokens existants. La validation visuelle détaillée du thème sombre reste différée ; les parcours de lecture et de déconnexion sont contrôlés dans les deux préférences. GA4 et le regroupement leads/soumissions restent des intégrations distinctes, signalées dans le workspace. L’éditeur de fiches JSON et la publication groupée sont implémentés le 26 octobre ; leur activation nécessite un jeton GitHub serveur dédié (voir docs/BACKOFFICE_CATALOG_EDITOR.md).

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
| Axe agentique et MCP — 16 novembre | Angle décidé : attribut des fiches d'abord. Décision révisée : le MCP devient un pilier, avec une section `/agents` (serveurs MCP et skills) sur la logique de Toolfolio. S1 livré en local le 17/11 sur `claude/distracted-grothendieck-64ebde` (non poussé) : 19 fiches serveur, 60 skills officiels, `/agents`, `/mcp`, `/skills` et leurs fiches FR/EN, passerelle sur les 20 fiches outils. Reste : validation de Michael, publication, puis [critère de passage à S2](#critere-s2). [Plan et schéma](#axe-agentique-mcp). |

**Suite :** publier les deux lots locaux R3/R7 après revue, puis contrôler les parcours, requêtes, compression et cache CDN en production. Le transport commun est désormais réduit sans suppression de champs ; un fractionnement supplémentaire n’est pas requis pour clôturer ce canary et ne sera ouvert que sur un besoin mesuré. L’exploitation GA4 et les essais utilisateurs restent distincts ; R5/R6 éditoriaux ne sont pas relancés.

<a id="axe-agentique-mcp"></a>

## Axe agentique et MCP — 16 novembre 2026

**Décision révisée (Michael, 16/11, en fin de journée) :** le MCP devient un **pilier du site**, avec sa propre section et la même logique que la référence [Toolfolio, Agent Resources](https://toolfolio.com/agent-resources/mcp-servers) : un index des serveurs MCP filtrable et une fiche par serveur. Chaque fiche dit ce que fait le serveur, liste les outils documentés, donne la connexion, l'authentification, les clients compatibles, l'installation et la date de vérification. Elle va au-delà de Toolfolio sur la décision : verdict, forfait et quotas, risque d'écriture, de suppression ou de paiement, garde-fous, branchement depuis ChatGPT ou Claude, lien avec la fiche de l'outil et les comparatifs. Le bloc `agent` des fiches outils reste, comme passerelle vers la fiche serveur. Cette décision remplace la première du même jour (« attribut des fiches d'abord, pas d'annuaire »). Même logique ne veut pas dire copie : aucun texte de Toolfolio n'est repris ; les faits viennent de l'éditeur, et les descriptions sont écrites par ToolTrim.

### État des lieux (relevé le 16/11)

- Référence : [Toolfolio, Agent Resources](https://toolfolio.com/agent-resources/mcp-servers). 335 serveurs MCP et 146 skills dans leur sitemap. Fiche : description, éditeur officiel ou non, connexion distante/locale, authentification, clients compatibles, commande d'installation, date de vérification. Aucun verdict, public développeur ; rien sur le forfait requis ni sur l'accès en écriture. Leur catalogue est lui-même exposé en serveur MCP (lecture seule).
- ToolTrim : `form_factor = 'mcp'`, la route `/mcp/:slug`, `guard-plugins.mjs` et la règle éditoriale de `scripts/repass/SPEC.md` existent. Aucune fiche de l'index JSON (1 360) ne porte `formFactor` ni `worksWith` : ces champs ne viennent que de Supabase, donc les pages hôtes restent vides avec la source publique par défaut. 16 fiches mentionnent MCP, en prose seulement.
- Recouvrement : 119 des 335 serveurs Toolfolio correspondent par slug ou nom exact à une fiche du catalogue ; quelques autres existent sous un autre slug (Mailchimp, HubSpot, Jira, Wix, Softr), soit environ 130. Correspondance automatique, non relue fiche par fiche.

### Étapes

| Étape | Livrable | Condition de sortie |
|---|---|---|
| M0 — Cadrage | Schéma du bloc `agent` et de la fiche serveur (ci-dessous) | Fait le 16/11 ; schéma serveur à éprouver en S1 |
| S1 — Section MCP et skills, fondation | Hub `/agents` (tout, serveurs MCP, skills), index `/mcp` et `/skills` filtrables, fiches `/mcp/<serveur>` et `/skills/<skill>`, les 19 serveurs des 20 outils du pilote, les skills officiels de leurs éditeurs, bloc passerelle sur la fiche outil, entrée de navigation, guide pilier FR/EN | 19 fiches serveur et les fiches skills sourcées et datées, rendu validé, contrôles DS et build verts |
| S2 — Extension | Les ~130 recouvrements, puis les serveurs officiels sans outil hôte au catalogue ; filtre Explorer « connectable à mon assistant » ; signal Ma Stack ; critère dans les comparatifs | Contrôle de fraîcheur automatisé en place ; Ma Stack/Explorer après la mission en cours |
| S3 — Serveur MCP ToolTrim | Catalogue et Ma Stack interrogeables depuis un assistant | À décider après S2 |

**Risque principal : la fraîcheur.** Ces faits changent vite ; c'est le motif qui a fait différer R5/R6. Pas de passage à M2 sans contrôle automatisé et sans budget convenu.

### Schéma du bloc `agent` (arbitré le 16/11 après l'essai et le relevé des 20 outils)

Écrit dans le fichier de recherche de la fiche (`facts.agent`), projeté en `agentAccess` dans `tools_v4.json` et en version réduite dans `tools_index.json`.

```jsonc
"agent": {
  "mcp": "official",            // official | none ; bloc absent = non vérifié
  "verified_on": "2026-11-16",  // obligatoire, y compris pour "none"
  "sources": [{ "label": "…", "url": "…" }],   // sources éditeur ; pour "none", la recherche faite chez l'éditeur
  "servers": [{                 // vide si "none" ; plusieurs possibles (Figma : distant et bureau)
    "name": "…",
    "transport": "remote",      // remote | local ; absent si l'éditeur ne le dit pas
    "auth": ["oauth", "key"],   // oauth | key | none ; absent si l'éditeur ne nomme pas la méthode
    "access": "read_write",     // read | read_write | docs_only : le maximum exposé, toujours borné par les droits du compte
    "plan": "all",              // all | paid | specific | unknown
    "plan_note": "…", "plan_note_en": "…",     // requis si "specific" ; admis avec "all" ou "paid" pour dire ce qui reste payant ou plafonné
    "clients": ["claude", "cursor"],            // seulement si l'éditeur restreint les clients ; absent = tout client MCP
    "docs_url": "…"
  }]
}
```

Règles : vocabulaires fermés, contrôlés par le garde-fou comme `form_factor` ; `none` signifie « vérifié, pas de serveur officiel » et se distingue du bloc absent ; un serveur tiers ne compte pas ; aucun client listé sans attestation de l'éditeur, et seulement des slugs du catalogue ; pas de commande d'installation recopiée (lien vers la documentation). `form_factor` et `works_with` ne changent pas : ils restent réservés aux fiches MCP autonomes de M3. Index réduit : `mcp`, `transport`, `access`, `verifiedOn`.

**Arbitrages (Claude, 16/11, en autonomie demandée par Michael ; à revoir s'il le souhaite) :**
- `access` : `account_scoped`, ajouté après l'essai, est retiré. Tous les serveurs distants relevés sont bornés par les droits du compte ; la valeur ne distinguait donc rien et masquait l'écriture, qui est le fait utile au verdict. `access` dit le maximum exposé.
- `api_key` et `token` fusionnés en `key` : chez Notion, Stripe, Airtable, Make et Tally, c'est une clé envoyée en jeton porteur.
- `community` retiré : aucune source éditeur ne peut l'établir. Hotjar et Milanote ont des serveurs tiers ou des demandes ; ils sont `none`.
- `clients` gardé seulement quand l'éditeur restreint (5 serveurs sur 19) et retiré de l'index réduit.

### Section MCP : fiche serveur (schéma S1)

Un fichier par serveur dans `research/mcp/<serveur>.json` (slug `<outil>-mcp`, suffixe pour un deuxième serveur : `figma-mcp-desktop`), projeté en `src/data/mcp_index.json` (cartes de l'index) et en données de fiche, selon le principe du catalogue JSON public (R3). Le bloc `agent` de la fiche outil renvoie aux slugs serveur.

```jsonc
{
  "slug": "notion-mcp", "name": "Notion MCP",
  "publisher": "Notion", "official": true, "host_tool": "notion",   // slug catalogue, ou null
  "category": "productivity",                                     // catégories du catalogue
  "summary": { "fr": "…", "en": "…" },          // 2 phrases, écrites par ToolTrim depuis la doc éditeur
  "verified_on": "2026-11-16", "status": "ga",  // ga | beta
  "transport": "remote", "auth": ["oauth", "key"],
  "access": "read_write", "plan": "all", "plan_note": {"fr": "…", "en": "…"},
  "capabilities": [ { "kind": "read", "fr": "…", "en": "…" } ],   // read | write | delete | send | pay
  "tools": [ { "name": "notion-create-pages", "kind": "write", "fr": "…", "en": "…" } ],  // catalogue documenté par l'éditeur ; kind pour signaler le risque
  "setup": [ { "assistant": "claude", "how": "connector" } ],     // assistants grand public
  "install": [ { "client": "claude-code", "type": "command", "value": "…" },  // recopié de la doc éditeur, jamais composé
               { "client": "any", "type": "url", "value": "https://mcp.notion.com/mcp" } ],
  "clients": ["claude", "cursor", "vs-code"],   // attestés par l'éditeur ; les clients sans fiche catalogue gardent un libellé
  "safeguards": ["admin_controls"],
  "docs_url": "…", "sources": [ { "label": "…", "url": "…" } ]
}
```

Rendu : **index** (cartes : nom, éditeur, officiel, résumé, connexion, authentification ; filtres catégorie, connexion, authentification, compatible avec, et en plus forfait, « peut supprimer ou payer », « en un clic depuis ChatGPT ou Claude ») ; **fiche** (verdict en tête, ce que ça fait, ce que l'assistant peut faire par niveau de risque, branchement et installation avec copie, catalogue d'outils repliable, forfait et garde-fous, date et sources, lien vers la fiche outil et ses alternatives qui ont un serveur). Système de design : hiérarchie typographique, pas de badges (`PRODUCT.md`). Route : `/mcp` et `/mcp/:slug` remplacent la page hôte `HostPage famille="mcp"`, à retirer avec sa règle de seuil pour cette famille.

### Section skills : fiche skill (schéma S1, décision Michael du 16/11 : skills dès S1)

Même mécanique que les serveurs : `research/skills/<skill>.json`, projeté en `src/data/skills_index.json`. Périmètre S1 : les skills **officiels** publiés par les éditeurs des 20 outils du pilote (repérés le 16/11 dans leurs docs : Notion Skills, skills Figma, Stripe, Webflow, Miro, Slack, Make, Google Analytics ; Airtable et HubSpot à vérifier). Inventaire exhaustif sur la doc éditeur au moment de S1.

```jsonc
{
  "slug": "figma-implement-design", "name": "…",
  "publisher": "Figma", "official": true, "host_tool": "figma",
  "server": "figma-mcp",                        // serveur MCP qu'il utilise, ou null
  "category": "design",
  "summary": { "fr": "…", "en": "…" },          // écrit par ToolTrim
  "does": [ { "fr": "…", "en": "…" } ],         // 2 à 4 tâches que le skill guide
  "agents": ["claude-code", "cursor", "codex"], // attestés par l'éditeur
  "install": [ { "client": "claude-code", "type": "command", "value": "…" } ],  // recopié de la doc éditeur
  "requires": { "fr": "…", "en": "…" },         // forfait, siège ou serveur requis, si l'éditeur le dit
  "verified_on": "2026-11-16", "status": "ga",
  "docs_url": "…", "sources": [ { "label": "…", "url": "…" } ]
}
```

Rendu : cartes et fiches sur les mêmes composants que les serveurs ; la fiche serveur liste ses skills, la fiche skill renvoie à son serveur et à la fiche outil. Hub `/agents` : onglets Tout, Serveurs MCP, Skills.

### Mieux que Toolfolio : enrichissement du bloc (Michael, 16/11)

**Constat (fiche Notion de Toolfolio, vérifiée le 23/10) :** description de ce que fait le serveur, catalogue des 52 outils techniques, connexion, authentification, clients pour développeurs (Claude Code, Cursor, Codex, VS Code), commande d'installation, date de vérification. C'est plus riche que notre bloc, mais tourné vers le développeur. Toolfolio ne dit rien des points suivants : forfait requis et quotas, risque d'écriture ou de suppression, garde-fous, branchement depuis ChatGPT ou Claude grand public, statut bêta. Il ne formule pas non plus de verdict.

**Décision :** battre Toolfolio sur la décision du freelance non-développeur, pas sur le catalogue technique. Ajouts au bloc, au niveau de l'outil :

```jsonc
"status": "ga",                 // ga | beta
"capabilities": [               // 2 à 5 lignes en langage métier, tirées de la référence d'outils de l'éditeur
  { "kind": "read", "fr": "…", "en": "…" }      // read | write | delete | send | pay
],
"setup": [                      // comment le brancher depuis un assistant grand public
  { "assistant": "claude", "how": "connector" } // assistant : claude | chatgpt | gemini | copilot | other
],                                              // how : connector | plugin | url | local
"safeguards": ["human_confirmation"]            // human_confirmation | admin_controls | scoped_keys | no_delete ; [] si l'éditeur n'en documente aucun
```

Ce qui reste exclu, et pourquoi : le catalogue nominatif des outils (`notion-create-pages`…) et la commande d'installation n'aident pas un non-développeur à décider, et vieillissent vite. Le décompte des outils n'est pas repris : il ne dit rien du risque ni de l'utilité.

**Essai (16/11) sur Notion, Stripe, Calendly :** les quatre champs se remplissent sur les trois outils, depuis la référence d'outils et la page d'aide « connecter à votre assistant ». `pay` n'apparaît que chez Stripe (Treasury, avec confirmation humaine) et `delete` chez Notion et Calendly : ce sont précisément les faits que Toolfolio ne signale pas. Calendly ne documente aucun garde-fou (`[]`), ce qui est aussi une information.

**Reste à faire :** remplir ces champs pour les 17 autres outils du pilote, avant le rendu sur la fiche. Le verdict s'appuie dessus. Exemples : « depuis Claude ou ChatGPT en un clic ; peut réserver et annuler vos rendez-vous ; aucune confirmation avant action » ; « peut envoyer de l'argent, avec confirmation humaine ; bêta ».

### Relevé du pilote M1 : 20 outils (16/11)

Fichiers : `research/agent-trial/<slug>.json`, non commités. Sources éditeur consultées le 16/11 (pages ouvertes, ou extraits de pages éditeur par recherche restreinte au domaine de l'éditeur).

**Choix des 20** (recouvrement Toolfolio × présence dans les 212 stacks × impressions, outils pour développeurs écartés) : notion, airtable, canva, figma, miro, hubspot, stripe, make, google-analytics, webflow, clickup, zapier, calendly, tally, shopify, slack, ahrefs, buffer ; `none` : hotjar, milanote. CapCut, troisième outil le plus présent hors recouvrement, est écarté : ses pages « MCP » sont des pages de référencement sans documentation technique ; bloc non écrit (non vérifié).

**Remplissage, sur 19 serveurs (18 outils, Figma en a deux) :** `access` 18 ; `transport` 17 ; `plan` 15 renseignés hors `unknown` (Stripe, Google Analytics, Shopify, Slack restent `unknown`) ; `auth` 14 ; `clients` 5 (Canva, Figma ×2, Shopify, Slack). Tous les champs gardés dépassent le seuil de 3 sur 5 de la règle d'arbitrage.

**Cas limites à connaître pour le rendu :**
- Shopify : intégrations officielles installées depuis chaque assistant, sans que l'aide les présente comme serveur MCP ; pas de transport ni d'authentification nommés.
- Slack : réservé aux applications publiées dans le Marketplace, aux applications internes et à quatre clients partenaires (Claude, Claude Code, Perplexity, Cursor ; Claude Code sans fiche au catalogue).
- Ahrefs : `access` non écrit ; la documentation liste des groupes d'outils dont un groupe « gestion » sans dire s'il écrit. Forfait payant dès Lite, appels décomptés en unités API.
- Google Analytics : serveur local seulement, en lecture ; authentification par identifiants Google Cloud (ADC ou compte de service), hors vocabulaire, champ non écrit. Le plus technique des 20 : à dire dans le verdict.
- Zapier : `auth` ne nomme que le jeton de connexion ; la connexion depuis un assistant de discussion passe par un connecteur dont la méthode n'est pas nommée.
- Bêta (Stripe, Tally, écriture Figma) : pas de champ ; le dire en prose dans le verdict.
- Hotjar a fusionné avec Contentsquare, qui a un serveur MCP : à dire en prose sur la fiche, pas dans le bloc.

### Fait — S1, section agents (16-17/11)

Branche `claude/distracted-grothendieck-64ebde`, tirée de `main`, non poussée. Documentation éditeur consultée le 16/11 ; un fait introuvable n'est pas écrit.

- **Données :** `research/mcp/<serveur>.json` (19) et `research/skills/<skill>.json` (60 : Figma 11, Stripe 11, Webflow 22, Make 7, Miro 3, Google Analytics 2, Zapier 2, Notion 1, Shopify 1). Les blocs `facts.agent` des 20 fiches portent les quatre champs « Mieux que Toolfolio ». `scripts/project-agents.mjs` projette `src/data/agents/{mcp_index,skills_index,catalog}.json` ; `scripts/project-agent-access.mjs` relie chaque serveur du bloc à sa fiche (`mcpSlug`). Vocabulaires et règles dans `scripts/lib/agent-access.mjs` ; `npm run guard:agent-access` (CI) contrôle les trois projections.
- **Composants :** `src/ds/AgentSheet` (fiche serveur et fiche skill : verdict, capacités du plus risqué au plus anodin, branchement et installation recopiée avec copie, catalogue d'outils replié, forfait et garde-fous, date et sources) ; `src/ds/AgentAccess` devient la passerelle (verdict, trois faits, lien vers la fiche). L'index réutilise le catalogue du système (`CatalogTitle`, `FilterBar`, `Chip`, `LinkRow`).
- **Pages :** `/agents` (onglets Tout, Serveurs MCP, Skills), `/mcp`, `/skills`, `/mcp/:slug`, `/skills/:slug`, FR/EN, rendu serveur (`renderAgentsPage`), sitemap. `HostPage` ne sert plus la famille `mcp` (route, `hosts-eligibles.mjs`, réécriture Vercel). Entrée « Agents IA » dans la navigation. Le méga-panneau Explorer n'a pas été touché.
- **Guide pilier** relié à la section et aux fiches Notion, Canva, Calendly.

**Manques notés (champ non écrit) :** `status` dit par 5 éditeurs seulement (`ga` : Notion, Calendly, HubSpot ; `beta` : Stripe, Tally). Canva : `setup` et `safeguards` (page d'aide en 403). Slack : `setup` (clients partenaires nommés sans méthode) et noms d'outils (deux seulement nommés). Outils non nommés par l'éditeur : Tally, Ahrefs (pages en 404), Make (outils générés depuis les scénarios). Skills : aucun identifiable chez Airtable (le plugin Claude Code en contient, non nommés), HubSpot, Slack, Calendly (deux outils de skills non décrits).

**Arbitrages (Claude, 16-17/11) :**
- Le `kind` de chaque outil est classé par ToolTrim d'après le nom et la description de l'éditeur, qui ne le donne pas ; un outil groupé (Webflow) prend son action la plus risquée.
- `install` recopié tel quel ; type `steps` ajouté pour les parcours sans commande (« Customize > Connectors… »).
- Google Analytics : la page Google (lecture seule) prime sur le README, qui décrit trois outils d'écriture facultatifs ; dit dans `tools_note`.
- Webflow : 19 de ses 22 skills n'ont qu'un nom d'affichage ; leur slug est composé par ToolTrim (`webflow-…`).
- Zapier : les deux skills livrés sur chaque serveur sont repris (onboarding, construction de workflow), pas le skill humoristique.
- `capabilities` accepte 1 à 5 lignes (Google Analytics n'en a qu'une).
- Champs `note` (bloc) et `tools_note` (fiche) pour ce que les champs ne portent pas.
- Les commandes d'installation s'affichent en Inter dans un cadre défilant : l'audit typographique n'admet aucune police à chasse fixe, et les invariants refusent une ligne coupée au milieu d'un mot.

**Reste à faire :** remplacé par [S1 bis](#s1-bis) (le méga-panneau Explorer est fait : « Agents IA » dans le groupe Explorer du menu téléphone, commit `924f7db0`).

<a id="agents-analyse-produit"></a>

### Analyse produit de la section agents (17/11, cadre validé par Michael ; étape 1 lancée : « Oui, étape 1 »)

Demandée par Michael après « tu as mal réfléchi à ce que doit être cette page… ça n'a aucun sens » : une vue d'ensemble, l'objectif, puis chaque section dans le fond et la forme, comment on la consomme et comment on aide à utiliser. Elle remplace la logique des briefs S1 bis, qui empilaient des correctifs sans cadre commun.

**1. L'objectif.** ToolTrim aide un freelance à décider quels logiciels garder, remplacer ou ajouter. Dans cette section, l'objectif est le même, avec un critère en plus : *mon assistant IA peut-il travailler dans mes outils, sans risque, et qu'est-ce que j'y gagne ?* On n'est pas un annuaire de serveurs. On ne pousse pas à adopter un outil parce qu'il se branche. Le critère « se branche » sert la décision, il ne la remplace pas.

**2. Les quatre moments où la question se pose.**
| Moment | Ce que la personne pense | Où elle arrive | Ce qu'on lui doit |
|---|---|---|---|
| A. J'ai mes outils | « Qu'est-ce que je peux brancher à Claude / ChatGPT ? » | Ma stack, ou le hub | Un bilan de *sa* stack, outil par outil |
| B. Je cherche comment brancher X | « brancher Notion à ChatGPT » sur Google | La fiche serveur, directement | La marche à suivre pour *son* assistant, en premier, puis le risque |
| C. Je choisis un outil | « Notion ou ClickUp ? » | Fiche outil, comparatif | « Se branche à votre assistant » comme critère, avec la différence qui compte |
| D. C'est branché, j'en fais quoi | « Et maintenant ? » | La fiche, après la copie ; Ma stack | Des premières demandes sûres, et des recettes qui combinent ses outils |

**3. D'où vient le trafic, donc quelles pages comptent.** Par ordre d'audience attendue :
1. Les fiches serveur, depuis la recherche (moment B) : c'est la page la plus vue.
2. La passerelle sur les fiches outils, qui ont déjà leur trafic (moment C).
3. Ma stack (moments A et D) : la seule page qui connaît les outils de la personne.
4. Le hub en dernier : on y vient par la navigation, il doit renvoyer vers 1 et 3.

On a dessiné le hub en premier et la fiche comme un annuaire. Il faut l'inverse.

**4. Section par section.**

*Fiche serveur `/mcp/:slug` : la page qui doit être parfaite.*
- **Fond.** Elle répond dans cet ordre :
  - qu'est-ce que ça me permet (deux ou trois demandes types) ;
  - comment je branche, avec *mon* assistant ;
  - qu'est-ce qu'il peut casser et comment garder la main ;
  - quel forfait ;
  - pour qui c'est utile.
  
  Un fait n'apparaît qu'une fois. Pas de fiche technique en grille. La liste des actions reste disponible pour qui veut vérifier.
- **Forme.**
  - Un seul bord gauche. En-tête calme : logo et titre sur une ligne, une phrase d'accroche, une action principale, une ligne de confiance.
  - Des phrases, pas de colonnes de libellés en capitales.
  - Au premier écran sur téléphone : le titre, la phrase et le bouton.
- **Consommation.** La personne arrive de Google avec un assistant en tête : la fiche le reconnaît (choix retenu) et montre ses étapes tout de suite. Le menu « Copier pour votre assistant » sert ceux qui veulent déléguer la mise en place à l'assistant lui-même.
- **Aider à utiliser.** Après la copie ou l'ouverture, un bloc « Vos premières demandes » : trois demandes en lecture seule à essayer d'abord, puis une qui écrit, avec ce qu'il faut vérifier. Puis « Si ça ne marche pas » : seulement ce que l'éditeur documente (droits du compte, invités, forfait).

*Passerelle sur la fiche outil, le bloc « Assistant IA ».*
- **Fond.** Une ligne de verdict (« Se branche à Claude et ChatGPT en un clic, peut supprimer des pages »), une demande type, un lien vers la fiche serveur. Pour un outil sans branchement officiel (Hotjar, Milanote), le dire sans détour et nommer les alternatives de la même catégorie qui se branchent : c'est une vraie information de décision.
- **Forme.** Un bloc court, au même niveau que les autres critères de la fiche, pas une page dans la page.
- **Comparatifs.** La même ligne, outil par outil, avec la différence qui compte (« ClickUp peut aussi envoyer des messages »).

*Ma stack : le bilan côté assistant (nouveau).*
- **Fond.** Un chapitre « Votre assistant » dans le récit de Ma stack :
  - la question de l'assistant (Claude, ChatGPT, Gemini, Copilot), posée une fois et retenue ;
  - le verdict en une phrase (« 4 de vos 9 outils se branchent à Claude, dont 3 en un clic ; 1 peut payer ») ;
  - au détail, outil par outil : statut, une demande type, risque, « Brancher » ;
  - les outils sans branchement, avec leur alternative.
- **Recettes.** Des demandes qui combinent *ses* outils, par exemple Calendly avec Notion : « prépare une page de notes pour chacun de mes rendez-vous de demain ». N'utiliser que des capacités documentées des deux côtés, et dire quels branchements il faut.
- **Forme.** Une tuile question du bento (« Quel assistant utilisez-vous ? ») qui part une fois répondue, puis le chapitre. Mêmes règles que Ma stack.

*Hub `/agents`.*
- **Fond.** C'est le même bilan que Ma stack, ouvert à qui n'a pas de stack.
  - Deux questions : votre assistant ; vos outils, repris de Ma stack, ou cochés parmi les logos.
  - Puis le verdict et la liste par outil.
  - La liste complète en bas, rangée par catégorie (notes, CRM, paiement…), avec un seul filtre : « avec mon assistant ».
  - Un lien vers le guide pour comprendre.
- **On retire :** le sélecteur de besoins (il poussait à adopter un outil), les filtres techniques (en ligne / sur l'ordinateur / connexion), les skills.
- **Forme.** Un outil, pas une page éditoriale : le premier écran pose les deux questions.

*Index `/mcp`.* Il devient la liste complète du hub, en page propre pour le référencement. Même rangement par catégorie.

*Skills `/skills` et leurs fiches.*
- Sur les 60 skills, l'essentiel vise les développeurs (« figma-swiftui », « connect-required-verification-information ») et ne s'installe que dans Claude Code, Codex ou Cursor. Les pages sont gardées pour le référencement, marquées « Pour développeurs », et on les sort du hub et de la navigation.
- Sur la fiche serveur, on ne les montre que s'il y en a un utile à un non-développeur (Notion Skills, par exemple).
- La fiche skill reste en anglais technique sur son nom ; elle doit dire en une phrase ce que ça fait, et pour qui.

*Guide pilier.* C'est le « pourquoi » et les bonnes habitudes (lecture d'abord, garder la main). Le hub et les fiches y renvoient une fois, pas à chaque bloc.

*Navigation.* « Agents IA » ne parle pas à la cible. On propose « Votre assistant IA ». L'entrée mène au hub ; Ma stack porte le chapitre.

**5. Une contrainte qui change tout : la couverture.** 20 outils sur 1 360 ont un bloc agent. Dans un bilan de stack, la plupart des outils seront « pas encore vérifié ». Il faut le dire honnêtement, en proposant de signaler l'outil. Le passage à S2 doit donc vérifier en premier les outils les plus présents dans les stacks et les catalogues de besoins, pas les ~130 recouvrements Toolfolio dans l'ordre alphabétique.

**6. Règles de forme pour toute la section.**
- Un fait, une seule place. Il apparaît seulement s'il aide à décider ou à agir.
- Un seul bord gauche par page.
- Des phrases, pas des libellés en capitales.
- Une seule action principale par bloc.
- Sur téléphone, le premier écran répond à la question de la page.
- Les mots de la personne (« brancher », « votre compte ») ; le jargon (MCP, OAuth, serveur) seulement dans le titre SEO et la liste des actions.
- Pas de séparateur ; le rythme vient de l'agencement.

**7. Ordre de travail proposé.**
1. Fiche serveur : en-tête, chapitre des risques en phrases, retrait de la grille technique, liste des actions structurée, « Vos premières demandes ».
2. Passerelle de la fiche outil, avec les alternatives pour les outils sans branchement.
3. Chapitre « Votre assistant » dans Ma stack.
4. Hub en bilan, `/mcp` par catégorie.
5. Skills retirés du hub et de la navigation, marqués « Pour développeurs ».
6. Recettes entre outils.
7. Comparatifs.
8. S2, par ordre de présence dans les stacks.

Chaque étape : stories, contrôles, commit, captures, puis relecture de Michael avant l'étape suivante.

**Étape 1 bis : la mise en page de la fiche serveur (Michael, 17/11 : « ça commence à devenir vraiment le bordel. J'aime que ce soit clean, mais aussi qu'il y ait de la structure et du rythme visuel. Apple style »).**

*Constat sur `/fr/mcp/notion-mcp` à 1440 px.* La fiche compte 12 blocs, et chacun a son propre traitement :
- **Trois styles de conteneur sans logique.** Tuile grise pour Brancher et les actions, cartes grises pour l'avis, rien du tout pour les risques et l'en-tête.
- **Des titres de 4 tailles,** tantôt hors de la tuile, tantôt dedans. Il y a aussi des sous-titres en gras de 14 px et des libellés en capitales.
- **Une largeur de contenu qui change à chaque bloc.** Accroche à 640, citations pleine largeur, risques sur la moitié de la page en longues lignes, cartes à un tiers de la largeur avec deux tiers vides (« L'outil », « Savoir-faire », « Alternatives », une carte orpheline chacun).
- **Deux blocs qui disent la même chose :** « Ce que ça change » et « Vos premières demandes » sont tous deux des demandes types.
- **Pas de rythme :** tout est en 14-16 px, avec des écarts égaux.

*Système, appliqué à toute la fiche et réutilisable pour la fiche skill.*
1. **Deux largeurs seulement.**
   - Colonne de lecture de 720 px pour le texte.
   - Grille large de 1080 px, en 3 colonnes, pour les rangées d'objets.
   - Tout s'aligne sur le même bord gauche.
2. **Les tailles de l'échelle du système** (option A, 17/11 : on ne touche ni aux tokens ni à l'audit) : 64 pour le titre de page au bureau et 42 sur téléphone, en deux lignes équilibrées si besoin ; 42 pour le titre de chapitre au bureau et 21 sur téléphone ; 21 pour l'accroche et le chapeau ; 16 pour le corps et 17 pour les blocs de lecture ; 14 pour les métadonnées. Plus de libellés en capitales, plus de sous-titres en gras de 14 px.
3. **Un modèle de chapitre unique :** titre en 42 (21 sur téléphone), chapeau d'une phrase en 21, contenu.
   - Les titres sont toujours hors des conteneurs.
   - Écarts : 96 px entre chapitres, 24 du titre au contenu, 8 entre objets. Ce sont les quatre distances du 09/11 ; sur téléphone, 64 entre chapitres.
4. **Le rythme vient des bandes, pas des boîtes.**
   - Les chapitres alternent un fond blanc et une bande gris clair qui s'étend sur toute la largeur de la feuille, comme sur une page produit.
   - Les tuiles sont réservées aux objets qu'on manipule : étape, bloc à copier, carte, demande.
   - Une seule forme de carte : fond blanc sur bande grise (ou gris clair sur blanc), rayon 20, padding 24, sans ombre.
5. **Six chapitres au lieu de douze blocs :**
   1. **En-tête** (blanc). Logo et titre de 64 (42 sur téléphone), accroche en 21, bouton principal et « Voir les étapes », ligne de confiance en 14.
   2. **« Ce que vous pourrez lui demander »** (gris). Fusion de « Ce que ça change » et de « Vos premières demandes ». Trois cartes de demande sur la grille de 3, chacune avec sa pastille (Lit / Modifie) : les demandes de lecture d'abord, celle qui écrit en dernier, avec sa ligne « À vérifier ».
   3. **« Brancher Notion »** (blanc).
      - Choix de l'assistant en contrôle segmenté sur une ligne : Claude, ChatGPT, Gemini, puis « Autres » (outils de développeur et autre outil).
      - Les étapes en 3 colonnes au bureau, avec un grand numéro (42) au-dessus de chaque étape, et en pile sur téléphone.
      - « Si ça ne marche pas » en lien dépliable sous les étapes.
   4. **« Ce qu'il peut faire, et comment garder la main »** (gris).
      - Deux colonnes : à gauche, les trois niveaux (pastille et phrase) ; à droite, les gestes pour garder la main.
      - Le forfait en une ligne sous les deux colonnes.
   5. **« Notre avis »** (blanc). Deux colonnes, « Utile si » et « Moins utile si », puis une rangée de 3 cartes sur la grille : la fiche outil, une alternative qui se branche, un savoir-faire de l'éditeur. Les places vides sont comblées par d'autres alternatives. Plus de carte orpheline.
   6. **Annexes** (gris, texte en 14-16) : « Les 70 actions » en dépliant, puis les sources sur une ligne de liens et « Signaler une erreur ».
6. **Téléphone.** Même ordre ; une colonne de 16 px de marge ; le contrôle segmenté défile ; les grilles passent en pile. Au premier écran : titre, accroche, bouton.

*Correction de Michael, 17/11 : pas de bandes grises.* Le gris des tuiles est réservé à la navigation : « cette couleur ne doit jamais être utilisée en background ». Les chapitres restent donc tous sur la feuille blanche, et le point 4 ci-dessus est remplacé. Le rythme vient de trois choses :
- l'échelle de titres, avec des chapitres en 42 ;
- les écarts : 96 entre chapitres, 48 avant les notes, 24 du titre au contenu ;
- des objets posés sur le blanc, avec le bord et l'ombre de repos du système (`--tt-row-rest`).

Les pastilles et les blocs de code ne prennent pas non plus ce gris comme fond de zone.

*Méthode.* Un composant de chapitre du système (`Chapter`, avec ses variantes de bande blanche ou grise) porte le modèle, et la fiche ne fait que l'assembler. Une story « Fiche complète » sert de référence à Michael, en 1440 et 375. Le test de contrat vérifie l'ordre des 6 chapitres.

**Attention Ma stack (Michael, 17/11).** La page Ma stack a été revue sur une autre branche, `mission/m01-ma-stack` : 46 commits Ma stack absents de `main`, dont le bento, le récit et le contrat de contenu. La branche agents est tirée de `main` et n'a donc pas cette version. Avant l'étape 3, il faut partir de `mission/m01-ma-stack`, ou de `main` une fois cette branche fusionnée, et relire ses décisions dans DESIGN_DECISIONS (« Ma stack : structure », « Contrat de contenu »). On ne touche à aucun fichier Ma stack depuis la branche agents. Le serveur de développement de cette branche est http://localhost:3000. Il tourne dans `~/code/toolstack-wizard-clean`, et c'est sur lui qu'on regarde Ma stack. Les fichiers communs (coquille, `ShellMenuBody.tsx`, `Navbar.tsx`) seront à réconcilier à la fusion.

**Cadence en autonomie (Michael, 17/11 : « une fois cette partie finie, passe la suite de la roadmap en autonomie, avec les agents, cadence le reste jusqu'au bout »).** Claude orchestre, la session S1 exécute, et chaque étape suit le même cycle :
1. brief dans ce document ;
2. stories ;
3. relecture par Claude dans le navigateur, à 1440 et 375 px, avec les règles de DESIGN_DECISIONS : pas de gris de navigation en fond, un fait à une seule place, vocabulaire de conséquence, copie en un clic, chapitres sur `Chapter` ;
4. corrections ;
5. contrôles complets ;
6. commit.

Rien n'est poussé ni fusionné dans `main`. L'ordre tient compte de la branche Ma stack :
- **2. Fiche outil** (passerelle « Assistant IA »), sur la branche agents.
- **4. Hub `/agents` en bilan**, et `/mcp` par catégorie, sur la branche agents. Le bilan lit la stack par `useStackPins` sans toucher aux fichiers de Ma stack.
- **5. Skills.** On les sort du hub et de la navigation, avec la mention « Pour développeurs ». « Votre assistant IA » remplace « Agents IA » dans la navigation, comme proposé ; Michael pourra revenir dessus.
- **3. Chapitre « Votre assistant » dans Ma stack.** Il se fait sur une branche d'intégration tirée de `mission/m01-ma-stack` (la bonne version de Ma stack, modifiée hier, 63 commits d'avance sur `main`). La branche agents y est fusionnée, avec l'accord de Michael (voir point 8). Ma stack est contrôlée sur http://localhost:3000.
- **6. Recettes entre outils**, dans Ma stack, sur la même branche d'intégration.
- **7. Comparatifs**, sur la branche agents. Ils seront reportés dans l'intégration ensuite.
- **8. S2**, par ordre de présence dans les stacks. Ce sera un chantier de recherche à part, cadré à la fin.

**Étape 2 : le bloc « Assistant IA » de la fiche outil (brief du 17/11).** Constat sur `/fr/tool/notion` à 1440 px :
- Le bloc arrive juste après la section éditoriale « Les IA qui comptent ici » (Notion AI, ChatGPT, Claude) : deux blocs IA se suivent sans lien entre eux.
- Il garde l'ancienne forme : une carte bordée et une colonne de libellés en capitales (ACTIONS, FORFAIT). On y lit encore du jargon (« Jetons MCP »), et des faits déjà donnés ailleurs, comme le forfait.

Cible :
1. **Un bloc court, dans la grammaire de la fiche outil.** Il reprend le style de titre de section de la fiche, sans carte bordée ni fond gris. Il contient :
   - une phrase de verdict dans le vocabulaire de conséquence (« Se branche en un clic à Claude, ChatGPT et Gemini. Peut supprimer des données. ») ;
   - une demande type avec « Copier la demande » ;
   - une action principale « Brancher Notion à votre assistant → » vers la fiche serveur.
   
   Le forfait n'y figure que s'il restreint l'accès (« Forfait payant requis »).
2. **Avec la section « Les IA qui comptent ici ».** Le bloc agents se place juste après et la complète. La section éditoriale dit quelle IA sert l'usage ; le bloc dit si votre assistant peut travailler dans l'outil. Mettez une transition d'une phrase, et pas deux titres IA collés. Si la fiche n'a pas de section éditoriale IA, le bloc garde sa place actuelle.
3. **Outil sans branchement officiel** (`mcp: none`, par exemple Hotjar ou Milanote) : une phrase (« Hotjar ne se branche pas à un assistant IA. »), puis les alternatives de la même catégorie qui se branchent. Ce sont 2 ou 3 petits liens avec logo vers leur fiche outil, choisis dans les données agents, sans recommandation inventée.
4. **Outil non vérifié** : rien du tout. Aucune mention « pas encore vérifié » sur la fiche outil.
5. **Règles.** Avant de toucher la fiche outil, lire les décisions de la fiche outil dans DESIGN_DECISIONS et les règles d'AGENTS.md : pas de métadonnée répétée dans le hero et la barre latérale, pas de bouton bleu. Relire aussi les règles de la section agents : pas de gris de navigation en fond, copie en un clic.
6. **Stories** : Notion (connecteur, demande), Stripe (paiement), Hotjar (aucun branchement, avec alternatives), Ahrefs (forfait payant requis). **Contrat** : le bloc ne répète aucun fait de la fiche.

**Étape 4 : le hub `/agents` en bilan, puis `/mcp` par catégorie (brief du 17/11).** Le hub devient un outil : le bilan de votre stack côté assistant. Ce n'est plus une page éditoriale ni un annuaire.
1. **En-tête.** Le titre « Votre assistant IA » (64), une phrase d'accroche (« Ce que votre assistant peut faire dans vos outils, et avec quelle prudence. »), puis deux questions :
   - **Votre assistant** : un contrôle segmenté avec Claude, ChatGPT, Gemini, Copilot et Autre. Le choix est retenu par la même clé que celle de la fiche serveur.
   - **Vos outils** : repris de Ma stack (`useStackPins`), sans toucher aux fichiers de Ma stack. Sans stack, une grille de logos à cocher, faite des 20 outils vérifiés et du catalogue en recherche. Le choix n'est pas enregistré dans Ma stack ; un lien « Enregistrer dans Ma stack » le propose.
2. **Le verdict**, une phrase en 42 : « 4 de vos 9 outils se branchent à Claude, dont 3 en un clic. 1 peut engager un paiement. » Il est calculé depuis les données, dans le vocabulaire de conséquence.
3. **Une ligne par outil** de la stack, dans l'ordre suivant : en un clic, à configurer, sans branchement officiel, pas encore vérifié. Chaque ligne donne :
   - le logo et le nom ;
   - le statut pour l'assistant choisi ;
   - la conséquence la plus forte, avec son icône ;
   - une demande type copiable ;
   - « Brancher → », qui mène à la fiche serveur.
   
   Pour un outil sans branchement : une phrase, et une alternative qui se branche. Pour un outil non vérifié : « Pas encore vérifié », et « Signaler cet outil ».
4. **La liste complète**, sous le sous-titre « Tous les outils qui se branchent ». Elle est rangée par catégorie du catalogue (notes, CRM, paiement…), avec un seul filtre : « avec mon assistant ». On utilise les cartes homogènes de l'étape 1 bis.
5. **Ce qui disparaît du hub** : le sélecteur de besoins, les filtres techniques (en ligne / sur l'ordinateur / connexion), « Par où commencer » (remplacé par un lien unique vers le guide) et les skills.
6. **`/mcp`.** C'est la liste complète du point 4, en page propre, avec le même rangement par catégorie.
7. **Règles.** Les chapitres reposent sur `Chapter`, sur la feuille blanche. Pas de gris de navigation en fond. Le vocabulaire de conséquence et la copie en un clic s'appliquent aussi ici. Sur téléphone, le premier écran pose les deux questions.
8. **Stories.** Sans stack ; stack de 9 outils mêlant en un clic, à configurer, sans branchement et non vérifié ; assistant ChatGPT ; assistant Autre. **Contrat** : le verdict et les lignes concordent, et aucun outil n'est classé sans donnée.

**Étape 5 : skills et navigation (brief du 17/11).**
- Les skills sortent du hub et de la navigation.
- `/skills` et les fiches skill restent, marquées « Pour développeurs » dans le titre et l'accroche. Leur mise en page passe sur le modèle de chapitre de l'étape 1 bis.
- Sur la fiche serveur, un skill ne paraît dans « Pour aller plus loin » que s'il sert un non-développeur (par exemple Notion Skills).
- L'entrée de navigation « Agents IA » devient « Votre assistant IA » partout : barre latérale, menu téléphone, ancien panneau, fil d'Ariane. Les fichiers communs (coquille, menu) ne changent que pour ce libellé.

**Étape 3 : « Votre assistant » dans Ma stack (brief du 18/11).**
- **Branche.** `integration/agents-ma-stack`, tirée de `mission/m01-ma-stack` (fusion autorisée par Michael le 17/11), dans un worktree à part. On y fusionne `claude/distracted-grothendieck-64ebde` à jour, puis on règle les conflits :
  - coquille et navigation : on garde la version de Ma stack, on y ajoute le libellé « Votre assistant IA » ;
  - `docs/DESIGN_DECISIONS.md` et `docs/ROADMAP.md` : on réunit les deux versions, rien n'est perdu.
  
  On ne pousse rien, et `mission/m01-ma-stack` reste intacte. Ma stack se contrôle sur le serveur de cette intégration (un port libre) et se compare à http://localhost:3000.
- **Avant de coder.** Relire les décisions Ma stack de la branche mission (DESIGN_DECISIONS : « Ma stack : structure », « Contrat de contenu », les règles du bento et du récit). Ne casser aucun test de contrat Ma stack.
- **Fond.** L'assistant devient un constat de Ma stack, avec les mêmes mécaniques que les autres constats (`StackFindings`). Pas de nouvelle boîte.
  - Une question « Quel assistant utilisez-vous ? » (Claude, ChatGPT, Gemini, Copilot, Autre), posée une fois, partant une fois répondue (règle du 09/11 : la tuile question part), et partagée avec la clé `tooltrim.agents.client`.
  - Le constat dit le même verdict que le hub (`agentReport`), par exemple « 4 de vos 9 outils se branchent à Claude, dont 3 en un clic ; 1 peut engager un paiement ». Son détail mène au hub `/agents`, où les lignes par outil sont déjà faites.
  - Dans la fiche d'un outil de la stack (`StackToolSheet`), une ligne « Avec votre assistant » : statut, conséquence la plus grave, « Brancher → ».
  - Les outils non vérifiés ne comptent pas dans le verdict, et le constat le dit (« 3 outils pas encore vérifiés »).
- **Stories et tests** : un test de contrat ajoute l'invariant « le constat assistant = le verdict du hub pour la même stack ». Puis les captures de Ma stack avant et après, à 1440 et 375 px.

**Étape 6 : recettes entre outils (brief du 18/11, sur `integration/agents-ma-stack`).**
- **Ce qu'est une recette.** Une demande qui combine deux outils de la stack, branchés tous les deux pour l'assistant choisi. Exemple : Calendly avec Notion : « Prépare une page de notes Notion pour chacun de mes rendez-vous Calendly de demain. »
- **Données.** `research/agents/recipes.json`, écrit par ToolTrim. Chaque recette nomme les deux serveurs et les outils documentés qu'elle mobilise de chaque côté. Un garde-fou refuse toute recette qui cite un outil absent de la fiche serveur. On en vise 8 à 12, pour les paires les plus courantes du catalogue.
- **Affichage.** Dans le constat assistant de Ma stack et sur le hub, 3 au plus, seulement si les deux outils sont dans la stack. Chacune porte la demande copiable, les deux logos, et la conséquence la plus grave des deux côtés.

**Étape 7 : comparatifs (brief du 18/11, sur la branche agents, puis reporté dans l'intégration).**
- Sur les pages comparatif (`ComparisonDecisionPage` et les duels), une ligne « Avec votre assistant » dans le tableau de décision, pour chaque outil qui a des données :
  - le statut ;
  - la conséquence la plus grave ;
  - une phrase de différence quand elle existe, par exemple « ClickUp peut aussi envoyer des messages en votre nom ».
- Sans donnée pour un des deux outils, pas de ligne. Un seul vocabulaire, celui de la conséquence. Avant de toucher les comparatifs, relire leurs décisions dans DESIGN_DECISIONS.

**Étape 8 : `/agents` et `/mcp` sur le gabarit des hubs (Michael, 18/11 : « cette page n'utilise pas encore les codes du hub… es-tu sûr de ton travail ? » ; plan accepté : « Oui, refais-le »).**

*Constat.* Les hubs Outils, Stacks, Comparatifs et Guides partagent un gabarit, et `/agents` s'en écarte. Chaque étape avait été relue contre son propre brief, jamais contre les pages sœurs.
- En ouverture, un outil (deux questions, une grille de 20 logos, un bilan) au lieu de l'entrée d'un hub.
- Les rayons sont de grandes cartes, alors que les hubs sœurs utilisent des lignes compactes.
- Un pied de carte répété, « Non documenté pour Gemini · Supprime des données », sur chaque carte.

*Cible : le gabarit des hubs, avec ses composants (ceux de `StacksPage`, `ComparesIndexPage` et de la page Outils).*
1. **Titre et barre d'outils.**
   - Le titre « Votre assistant IA », en grand titre de catalogue, et une phrase courte.
   - `CatalogToolbar` collante (`useCatalogStickyToolbar`). Les puces : Tout, puis les 5 rayons. À droite, le choix de l'assistant, au format du contrôle « Filtres » ou « Trier » (« Avec Claude ▾ »), partagé par la clé `tooltrim.agents.client`.
2. **Ligne de stack (si une stack existe).** Une seule ligne sous la barre, dans la grammaire du message d'accueil du site : « 4 de vos 8 outils se branchent à Claude · Voir le bilan → », vers la tuile « Votre assistant IA » de Ma stack. Sans stack, cette ligne n'apparaît pas. La grille de logos à cocher disparaît : c'est Ma stack qui compose la stack. Le chapitre bilan du hub disparaît aussi ; la logique `agentReport` reste.
3. **« À la une ».** 3 ou 4 cartes riches, avec le même composant que « À la une » d'Outils ou de Stacks : les outils les plus utiles qui se branchent en un clic à l'assistant choisi, ordonnés par présence dans les stacks du catalogue.
4. **Les rayons**, en lignes compactes, avec le même composant que les rayons de Comparatifs et d'Outils, et « Voir tout » quand un rayon dépasse sa rangée. Une ligne donne :
   - le logo et le nom ;
   - une phrase de 56 signes au plus ;
   - à droite, une seule information pour l'assistant choisi : « En un clic », « À configurer » ou « Non documenté ».
   
   La conséquence la plus grave ne s'affiche que si elle est « Supprime des données », « Engage un paiement » ou « Envoie en votre nom », en petit, avec son icône. Plus de pied répété sur chaque carte.
5. **Les puces filtrent** les rayons comme sur les autres hubs (`runCatalogFilter`), et l'assistant choisi met à jour les informations de droite.
6. **`/mcp`** : même gabarit, sans « À la une ». **Recettes** : elles restent dans Ma stack et quittent le hub, sauf une ligne « Avec deux de vos outils » si la stack existe. Sinon, elles n'y sont pas.
7. **Relecture.** Chaque écran est comparé à 1440 et 375 px, côte à côte avec `/fr/stacks` et `/fr/comparatifs` : mêmes marges, même titre, même barre, mêmes rayons. Un test de contrat vérifie que `/agents` utilise `CatalogToolbar` et le composant de rayon commun.

**8. À trancher par Michael.**
- ~~Autoriser la fusion de la branche agents dans une nouvelle branche d'intégration tirée de `mission/m01-ma-stack`~~ : accordé par Michael le 17/11 (« Oui, fusionne »). La fusion se fera au début de l'étape 3, sur la branche agents à jour. `mission/m01-ma-stack` reste intacte, et rien n'est poussé.
- Le nom dans la navigation : « Votre assistant IA » ?
- Les skills sortis du hub et marqués « Pour développeurs » ?
- Les recettes entre outils : dans ce chantier, ou après S2 ?

<a id="s1-bis"></a>

### Prochaine action — S1 bis : une section qui accompagne (Michael, 17/11)

Retour de Michael sur S1 : « un peu brut de décoffrage. On doit accompagner, pas faire un énième annuaire » (règle dans `docs/DESIGN_DECISIONS.md`, « Section agents »). Plan accepté par Michael le 17/11 (« Oui, lance »). Même branche, les données de S1 restent ; on refait l'entrée et le récit.

**Hub `/agents` : partir de la personne, pas du catalogue.** Ordre de la page :
1. « Que voulez-vous que votre assistant fasse ? » : 6 à 8 besoins concrets (préparer ses rendez-vous, retrouver une info dans ses notes, suivre ses paiements, lire ses stats de trafic, publier sur ses réseaux, gérer ses projets, créer des visuels…). Chaque besoin mène à une recommandation : l'outil, l'assistant, le risque en mots, le branchement en trois étapes, le lien vers la fiche.
2. « Avec votre stack » si Ma stack contient des outils (même source que Ma stack) : « N de vos outils se branchent à votre assistant », chacun avec un avis (à brancher / avec prudence / pas encore). Sans stack : une invitation courte vers Ma stack, pas un bloc vide.
3. « Par où commencer » : trois points (choisir son assistant ; brancher d'abord en lecture ; garder la main sur ce qui modifie, supprime ou paie), lien vers le guide `mcp-freelances-non-developpeurs`.
4. La liste complète (serveurs et skills, filtres) en bas, pour qui cherche un outil précis. `/mcp` et `/skills` restent des index, mais ouvrent sur une phrase d'accompagnement.

**Fiche serveur et fiche skill : un récit en chapitres** (esprit Ma stack, « notre page doit raconter une histoire ») :
1. Ce que ça change pour vous : 2 ou 3 demandes types en langage courant (« Résume mes notes de réunion de la semaine »), tirées uniquement des outils documentés par l'éditeur.
2. Notre avis : pour qui c'est utile, pour qui ça ne l'est pas.
3. Le brancher en 3 étapes, selon l'assistant choisi (Claude, ChatGPT ; Gemini ou Copilot si l'éditeur le dit).
4. Ce qu'il peut faire et comment garder la main : risques et garde-fous réunis.
5. Pour aller plus loin, replié en fin de fiche : commandes d'installation, liste des outils, clients, sources et date.

**Brancher et « Pour aller plus loin » : revus par Michael le 17/11** (« on peut mieux accompagner encore, plus digest, l'action copier-coller »). Aujourd'hui la fiche empile toutes les entrées `install` brutes (Notion : 7 blocs, dont deux « any ») ; c'est un mur.
- **Un seul chapitre « Brancher Notion »**, qui fusionne les 3 étapes et l'installation. En tête, un choix « Où utilisez-vous l'IA ? » : Claude, ChatGPT, Gemini d'abord ; puis, derrière « Outils de développeur », Claude Code, Cursor, VS Code, Codex ; « Autre outil » en dernier, qui regroupe les entrées `any`. On ne montre que les choix que la fiche peut servir. Le choix est retenu d'une fiche à l'autre (stockage navigateur, en `try/catch`, la page marche sans).
- **Pour le choix fait, une seule carte d'étapes numérotées**, jamais plus de 4 :
  1. Préalable s'il existe, en une ligne : forfait requis, Node.js pour une config `npx`, application de bureau ouverte pour un serveur local.
  2. L'action : un bouton principal « Ouvrir dans Claude » quand l'éditeur donne un lien d'annuaire (Stripe). Sinon le bloc à copier, avec un bouton nommé selon ce qu'il copie (« Copier la commande », « Copier l'adresse », « Copier la configuration ») et un état « Copié » de 2 s, annoncé aux lecteurs d'écran (`aria-live`). Une configuration JSON est affichée indentée.
  3. Où le coller, dit concrètement : terminal, réglages, fichier de configuration du client. Cette consigne tient au client, pas au serveur : une table commune par client, sourcée sur la doc du client (Cursor, VS Code, Claude Code, Codex), écrite une fois.
  4. Connexion au compte quand `auth = oauth` ou `key`, puis « Vérifiez : demandez à votre assistant… », avec une des demandes types de la fiche.
- **« Pour aller plus loin » ne garde que la fiche technique**, compacte et repliée : connexion, authentification, accès maximum, liste des outils, clients, sources et date. Plus aucun bloc d'installation à cet endroit.
- **Sur téléphone**, les bascules de choix défilent sur une ligne, le bloc copiable ne déborde pas (retour à la ligne pour la config, défilement pour une commande), et le bouton de copie fait 44 px.
- **À corriger :** sur `/fr/mcp/notion-mcp`, « Déplier la partie technique » n'a rien ouvert au clic le 17/11 (vérifié pendant la refonte en cours, peut-être un rechargement à chaud). À vérifier et à couvrir par une story avec test d'interaction.
- **Liste des outils, revue par Michael le 17/11** (« ça aussi », sur la capture de « Créer et modifier · 26 » de Notion). Aujourd'hui, c'est une grille de 26 identifiants techniques (`notion-create-comment`…) en titre, avec la traduction en dessous. On la refait :
  - **Ranger par sujet, en mots de tous les jours**, et non par niveau de risque seul. Pour Notion : Pages, Bases et vues, Commentaires et discussions, Fichiers, Skills et agents. Chaque sujet a un titre et son nombre d'actions ; il est replié s'il dépasse 5 actions.
  - **Le titre de chaque ligne est l'action en français** (« Commenter ou répondre à une discussion »). L'identifiant technique passe en petit, en couleur atténuée, en fin de ligne ou au survol. On ne le montre jamais en titre.
  - **Le risque est porté par chaque ligne** : une pastille « Modifie », « Supprime » ou « Paie » à côté de l'action, dans le vocabulaire des capacités, et rien pour la lecture. En tête de liste, une phrase de synthèse : « 26 actions, dont 2 qui suppriment ».
  - **Une ligne par action** sur une colonne, plutôt qu'une grille à deux colonnes qui se lit mal. La liste reste dans « Pour aller plus loin ».
  - Le regroupement par sujet est un classement ToolTrim, dit comme tel dans `tools_note` ou dans une note de méthode. Si l'éditeur ne nomme pas ses outils, on garde la phrase actuelle.
- **Sources, revues par Michael le 17/11** (sa capture : le bloc « Documentation de l'éditeur » de Notion). Aujourd'hui, quatre titres anglais bruts en corps 16, qu'on ne reconnaît pas comme des liens, et une phrase défensive (« sans reprise d'autres annuaires ») qui s'adresse à un concurrent, pas au lecteur.
  - **Le titre devient « Sources »**, et la phrase sert le lecteur : « Vérifié le 16 novembre 2026 chez Notion », avec la fraîcheur en clair (« il y a 1 jour »). On retire la mention des autres annuaires. La règle de ne rien reprendre reste dans la méthode, pas sur la fiche.
  - **Chaque source se lit comme un lien**, sur une ligne de `LinkRow` ou équivalent du système, avec l'icône de lien externe. Le libellé est traduit et court (« Présentation », « Connexion et forfaits », « Liste des outils »). Le domaine (`developers.notion.com`) apparaît en petit. Le titre anglais d'origine reste dans les données. On fusionne les doublons proches : les deux « Supported tools » de Notion.
  - **Une action « Signaler une erreur »** en fin de bloc, qui renvoie au contact ou au formulaire existant avec la fiche en contexte. Le bloc reste en fin de fiche, avec un poids typographique inférieur aux chapitres.
- **Fonctionnel et lisible, à la manière de Toolfolio (Michael, 17/11, captures Toolfolio à l'appui : « je veux que ce soit ici plus fonctionnel et lisible »).** On reprend leurs fonctions, jamais leurs textes.
  - **Un bouton d'action en tête de fiche, « Copier pour votre assistant »**, avec un menu déroulant :
    - copier toute la fiche en Markdown pour la donner à l'assistant (ce que fait le serveur, le branchement par client, les risques et les garde-fous, les sources), généré depuis les données ;
    - « Ouvrir dans ChatGPT » et « Ouvrir dans Claude », avec une question pré-remplie sur la fiche (adresse de la page dans le texte) ;
    - « Copier la commande d'installation » (Claude Code) ;
    - « Brancher à Cursor » et « Brancher à VS Code », par lien direct d'installation si la doc du client le documente.
    
    Chaque entrée n'apparaît que si la fiche peut la servir, et la retenue « Copié » s'affiche en aria-live. Les formats de lien (requête pré-remplie, liens d'installation Cursor et VS Code) sont vérifiés sur la doc de chaque client et notés dans la table commune par client.
  - **Une ligne de faits sous le titre**, avec icônes : « Vérifié le … », Connexion (en ligne / sur votre ordinateur), Compte (connexion au compte / clé / aucune), Fonctionne avec (logos des assistants, nom en infobulle et en texte pour les lecteurs d'écran). Ces faits ne se répètent pas plus bas.
  - **Cartes des fiches liées** (alternatives, skills de l'éditeur, et sur le hub) : logo, nom, « Par Notion · Officiel », résumé en 2 ou 3 lignes, puis deux faits (connexion, compte) ou « Skill · thème ». Ajouter un bouton « Ajouter à ma stack » sur l'outil hôte, à la place du marque-page de Toolfolio, si Ma stack l'accepte.
  - **Liste des outils** : la capture de Michael montre encore l'ancienne grille (70 outils, identifiants en titre). La refonte décrite plus haut est attendue telle quelle.
- **Passe de mise en page et de design (demandée par Michael le 17/11, relevé de Claude sur `/fr/agents` et `/fr/mcp/notion-mcp`, à 1440 px et 375 px).** Le contenu est bon. La forme reste celle d'une fiche de données : mêmes tuiles grises, même titre de 21 px, colonnes de libellés en petites capitales partout, liens sans signe qu'on peut cliquer. Règles touchées : « il doit y avoir du rythme » (09/11), « notre page doit raconter une histoire » (11/11), et « un bouton est un objet qui répond » (planche du 30/10).
  
  *Hub*
  1. **La réponse à un besoin devient une vraie recommandation.**
     - En tête : le logo de l'outil (40 px), son nom en titre, puis la demande type mise en avant (citation large).
     - Ensuite, trois faits sur une ligne avec icônes : assistant, risque, avis. Ils remplacent les lignes AVEC, LE RISQUE et NOTRE AVIS.
     - Puis les 3 étapes, et un bouton principal « Brancher Calendly → » à la place du lien texte.
     - « Aussi pour ce besoin : HubSpot » devient une petite carte avec logo.
  2. **Choix du besoin.** Sur téléphone, les 8 puces s'empilent et occupent tout l'écran avant la réponse. Il faut une rangée qui défile, ou une grille compacte de 2 colonnes avec icône, et la réponse doit commencer au-dessus de la ligne de flottaison. Sur bureau, garder une seule rangée si la largeur le permet.
  3. **« Avec votre stack » sans stack.** Un vrai bouton « Composer ma stack », pas un lien texte, avec la phrase à côté. Le bloc ne doit pas ressembler à un paragraphe orphelin.
  4. **Liens d'action.** Tous les liens d'action (« Tout savoir pour brancher », « Le guide pour freelances… », « Voir tout ») portent une flèche et un état de survol.
  5. **Cartes de la liste.**
     - Le résumé est coupé à 2 lignes, sur une phrase écrite pour la carte : plus de « … » au milieu d'une phrase.
     - Les faits sont posés en bas de carte, sur une ligne, avec les icônes de la ligne de faits de la fiche, pour que tous les bas de cartes s'alignent.
     - Les noms sont ceux de ToolTrim : « Figma, application de bureau », pas « Figma MCP server (desktop) ».
  6. **Filtres.** À 1440 px, la rangée de filtres déborde et défile. La ranger en deux groupes (« Comment » et « Avec quel assistant »), ou derrière un bouton « Filtrer ».
  
  *Fiche*
  7. **En-tête.**
     - « Copier pour votre assistant » est l'action principale : bouton sombre, aligné à droite du titre sur bureau, pleine largeur sous le titre sur téléphone.
     - Dans « Fonctionne avec », un logo est vide (cercle blanc) : le corriger ou l'enlever.
     - Les logos passent de 14 à 20 px.
     - Le paragraphe d'introduction répète le sous-titre : les fusionner.
  8. **Rythme entre les chapitres.** Il ne faut plus cinq tuiles grises identiques.
     - « Ce que ça change » : les trois demandes en cartes de citation côte à côte (3 colonnes sur bureau, défilement sur téléphone).
     - « Notre avis » : deux colonnes « Utile si » et « Moins utile si », avec icônes oui/non, sans colonne de libellés.
     - « Brancher » : reste la tuile principale.
     - Risques : les mêmes pastilles Supprime / Modifie / Lit que la liste des actions, au lieu des libellés en petites capitales.
  9. **Brancher.**
     - Sur téléphone, les puces de client sur une seule rangée qui défile : aujourd'hui « Autre outil » et « Codex » tombent seuls sur leur ligne.
     - Le bloc de configuration défile horizontalement : l'URL se coupe en « …/mc p ».
     - Réduire les marges imbriquées (carte dans tuile dans page) sur téléphone.
     - Séparer l'étape 3 en « Connectez votre compte » et « Vérifiez ».
  10. **Risques.** « Forfait » répète « Tous les forfaits » en valeur, puis en début de note : n'en garder qu'un.
  11. **« Pour aller plus loin ».** La tuile n'a qu'un lien. En faire une rangée pleine largeur avec chevron et un résumé de ce qu'elle cache : « 70 actions, 12 assistants, détails techniques ».
  
  Les correctifs passent par les composants du système (stories d'abord) et respectent la règle « pas de séparateur, agencement et espace ». Il faut des captures avant/après à 1440 et 375 px pour Michael.
- **Emprunts au répertoire Claude (Michael, 17/11, d'après la fiche Airtable `claude.ai/directory/cb504fab-…` : « la structure est intelligente »).** Accepté par Michael (« Oui, transmets »).
  1. **Grille de faits en pied de fiche, toujours visible.** Six cases en 3 colonnes sur bureau, 2 sur téléphone : connexion, compte, accès maximum, éditeur, vérifié le, URL du serveur (copiable). Elle remplace la tuile « Pour aller plus loin » repliée. Seule la liste détaillée des actions reste repliable, sous la grille. Les faits de la ligne d'en-tête ne s'y répètent pas : en-tête = les 3 faits clés, grille = le détail.
  2. **Logo de l'outil à côté du titre de la fiche** (48 px, cadre clair, comme sur les cartes). Le bouton « Copier pour votre assistant » reste la seule action en tête.
  3. **« Ouvrir dans Claude » vers la page du répertoire Claude** de chaque serveur qui y figure. Relever le lien `claude.ai/directory/<id>` des 15 serveurs qui n'en ont pas (Notion, Canva, HubSpot, Figma, Calendly, ClickUp, Webflow, Zapier, Make, Slack, Buffer, Google Analytics, Ahrefs, Tally, Figma bureau). Le relevé se fait sur le répertoire même, page ouverte et nom vérifié, et rien n'est mis si le serveur n'y est pas. La source est notée « Répertoire Claude » avec la date. Ce répertoire vaut pour le lien et la date d'ajout, pas pour la liste des outils : la doc éditeur reste la référence (Airtable : 41 outils documentés contre 12 dans le répertoire).
- **Stories :** fiche Notion (connecteur, choix Claude puis Cursor), Stripe (lien d'annuaire), Figma bureau (serveur local avec préalable), un serveur sans entrée pour le client choisi, avec renvoi à la doc éditeur.

**Passerelle de la fiche outil** : même ton (une demande type, l'avis, le lien « Brancher Notion à votre assistant »).

**Vocabulaire de surface :** « brancher à votre assistant » plutôt que « serveur MCP » ; « connexion à votre compte » plutôt que « OAuth » ; « sur votre ordinateur » / « en ligne » plutôt que « local » / « distant » ; « savoir-faire » ou « mode d'emploi pour l'assistant » pour les skills, à trancher en relisant. « MCP » reste dans le titre SEO et la balise, au second plan.

**Contenu nouveau, écrit par ToolTrim :** les demandes types (`examples` fr/en par fiche serveur, 2-3), l'avis pour qui / pas pour qui (`for` / `not_for` fr/en), la table besoins → outils (`src/data/agents/needs.json` ou équivalent, projetée). Aucun fait éditeur inventé : une demande type n'utilise qu'un outil listé ou une capacité documentée ; si rien ne permet d'écrire, le champ reste absent.

**Méthode :** stories d'abord (hub par besoin, avec et sans stack ; fiche en récit, Notion, Stripe, Ahrefs sans liste d'outils, une skill) ; `lint:ds`, `test:ds`, `test:visual` (Storybook sur un port libre, pas 6006/6007 tenus par d'autres worktrees) ; contrat de contenu testé pour le hub (un besoin mène toujours à une fiche) et la fiche (l'avis et le branchement précèdent la technique). Mettre à jour `DESIGN_DECISIONS.md` (« À arbitrer ») et la section « Fait » ci-dessus. Commits sur la branche, rien de poussé ni de fusionné.

**Sortie :** Michael revoit `/fr/agents`, une fiche serveur et une fiche outil, et dit si ça accompagne.

### Fait — S1 bis (17/11)

Même branche, rien de poussé ni de fusionné. Les données de S1 restent ; l'entrée et le récit sont refaits.

- **Contenu ToolTrim :** `examples` (2-3 demandes types), `for` et `not_for` (fr/en) sur les 19 fiches `research/mcp/`, écrits à partir des outils et capacités documentés seulement ; besoins du hub dans `research/agents/needs.json` (8 besoins, chacun mène à une fiche et cite une de ses demandes ; `also` pour les autres fiches du même besoin). Garde-fou : `validateNeeds` et les règles `examples` / `for` / `not_for` dans `scripts/lib/agent-access.mjs`, testés (contrat : un besoin mène toujours à une fiche).
- **Projection :** `src/data/agents/needs.json`, `advice.json` (une demande et l'avis, pour la passerelle des fiches outils), `checked_none.json` (outils vérifiés sans serveur : Hotjar, Milanote) ; cartes de `mcp_index.json` enrichies de `setup`, `safeguards`, `for`, `not_for` et `capability_kinds` (le risque en mots suit les lignes de capacités affichées, pas les outils mineurs).
- **Composants :** `src/ds/AgentHub/` (`NeedPicker` : besoins en puces, conseil sous le choix avec la demande type, l'assistant, le risque, notre avis, trois étapes et la fiche ; `StackAgents` : avis « À brancher / Avec prudence / Pas encore » sur Ma stack, invitation sans stack ; `StartHere` : trois points et le guide). `AgentSheet` réécrit en chapitres (`data-chapter` : change, view, plug, control, further), choix de l'assistant pour les trois étapes, technique repliée dans « Pour aller plus loin ». `AgentAccess` : une demande type, l'avis, « Brancher Notion à votre assistant ». Aides partagées dans `src/lib/agents.ts` (`plugSteps`, `riskSentence`, `stackCall`, `assistantWords`).
- **Pages :** `/agents` dans l'ordre besoins → « Avec votre stack » (même source que Ma stack) → « Par où commencer » → toute la liste (filtres sur place, sans remontée) ; `/mcp` « Outils à brancher » et `/skills` « Savoir-faire » ouvrent sur une phrase d'accompagnement ; fiche serveur titrée « Brancher Notion à votre assistant ». « MCP » et « skills » restent dans les titres SEO.
- **Vocabulaire :** « en ligne », « connexion à votre compte », « clé d'accès », « outils à brancher », « savoir-faire » (retenu pour les skills ; « mode d'emploi pour l'assistant » sert dans la phrase d'ouverture de `/skills`).
- **Stories :** « Agents / Hub » (par besoin, avec et sans stack), « Agents / Fiche » (Notion avec contrat d'ordre des chapitres, Stripe, Ahrefs sans liste d'outils, Figma bureau, deux skills), « Fiche outil / Assistant IA » ; toutes marquées `a-valider` (pas de référence avant validation).

- **Revue de Michael du 17/11 (branchement, outils, sources, « fonctionnel et lisible ») :**
  - Chapitre unique « Brancher Notion » : choix « Où utilisez-vous l'IA ? » (Claude, ChatGPT, Gemini, Copilot ; outils de développeur Claude Code, Cursor, VS Code, Codex ; « Autre outil »), retenu d'une fiche à l'autre (`localStorage`, en `try/catch`) ; une carte de 1 à 4 étapes (préalable, action « Ouvrir dans Claude » ou copie nommée avec « Copié » en `aria-live`, où coller, connexion puis demande de vérification). Table commune par client : `src/lib/agentClients.ts`, sourcée sur la doc lue le 17/11 (Claude, Claude Code, VS Code, Codex).
  - Fiche technique repliée (accès maximum, outils cités, liste des actions), plus aucun bloc d'installation à cet endroit. Liste des actions par sujet (classement ToolTrim, dit sur la fiche), une colonne, l'action en français, `Tag` « Modifie / Supprime / Envoie / Paie », l'identifiant en petit et atténué, phrase de synthèse (« 70 actions, dont 4 qui suppriment »), sujet replié au-delà de 5 actions. Le pli « Déplier la fiche technique » est couvert par la story Notion.
  - Bloc « Sources » : « Vérifié le … chez Notion (il y a 1 jour) », libellés courts traduits avec domaine et icône externe, doublons fusionnés, « Signaler une erreur » vers `/contact` avec la fiche en sujet.
  - En tête de fiche : ligne de faits à icônes (date, en ligne / sur votre ordinateur, compte, « Fonctionne avec » en logos nommés) et menu « Copier pour votre assistant » (fiche en Markdown, commande Claude Code, « Brancher à VS Code » par le lien `vscode:mcp/install` documenté, « Brancher à Cursor » quand l'éditeur donne un lien de la place de marché Cursor).
  - Cartes `AgentCard` (logo, nom, « Par Notion · Officiel », résumé sur 3 lignes, deux faits) sur le hub et pour les fiches liées ; « Ajouter à ma stack » sur la carte de l'outil hôte.
  - Table par client sourcée le 17/11 : Claude (connecteur personnalisé), ChatGPT (« Add custom MCP server » sur chatgpt.com/plugins), Claude Code, Cursor (`~/.cursor/mcp.json` ou `.cursor/mcp.json`, lien `cursor://anysphere.cursor-deeplink/mcp/install`), VS Code (`vscode:mcp/install`, « MCP: Open User Configuration »), Codex (`~/.codex/config.toml`). Manques : l'aide Gemini n'a pas pu être lue, donc une carte Gemini sans entrée de l'éditeur le dit et renvoie à sa documentation ; aucune question pré-remplie n'est documentée par ChatGPT ni par Claude, donc pas d'« Ouvrir dans ChatGPT / Claude avec une question » dans le menu.
  - Relecture de la session « Axe agentique » (17/11) : valeurs anglaises brutes des `agents` de trois skills ramenées à `any` (« Tout client MCP ») ; « Autres assistants cités par l'éditeur » ne garde que ceux absents de « Fonctionne avec » ; « Importer une Skill » rangé dans Skills et agents, les dossiers dans « Pages et dossiers ».

- **Passe de mise en page (17/11, les 11 points ci-dessus) :** faite, avec deux écarts dits dans `DESIGN_DECISIONS.md` (grilles compactes au lieu de rangées qui défilent ; flèche des liens texte au survol). Captures avant/après à 1440 et 375 px dans le dossier de notes de la session.

- **Emprunts au répertoire Claude (17/11) :** fiche technique toujours visible en pied de fiche (accès maximum, éditeur, vérifié le, répertoire Claude avec le mois d'ajout, actions documentées, adresse du serveur copiable), 3 colonnes sur bureau et 2 sur téléphone ; seule la liste des actions reste repliable. L'en-tête garde trois faits (connexion, compte, « Fonctionne avec ») et la date passe dans la grille, pour ne rien répéter. Logo de l'outil à 48 px à côté du titre (taille 48 ajoutée au `Logo` du système). « Ouvrir dans Claude » vers la page du répertoire : 17 serveurs sur 19, relevés page par page le 17/11 sur `claude.ai/directory/<slug>` (nom, éditeur et adresse du connecteur vérifiés), champ `claude_directory` et source « Répertoire Claude (relevé le 17/11/2026) ». Absents : Google Analytics (seuls des connecteurs tiers sortent à la recherche) et l'application de bureau de Figma (la page Figma décrit le serveur en ligne). Buffer y figure avec la mention « Communautaire ».

- **Liste des actions en rangées (17/11, « des bouts de texte mis bout à bout ») :** une action par rangée blanche sur la tuile, 8 px entre deux, sans filet ; l'action en 16 px au-dessus de l'identifiant en 12 px atténué ; la pastille dans une colonne alignée sur toute la liste, lecture comprise (« Lit ») ; sur téléphone, la pastille passe sous les mots. Filtre par risque en puces du système avec leur compte (Tout, Supprime, Paie, Envoie, Modifie, Lit, selon ce que le serveur fait) ; pas de filtre quand le serveur ne fait que lire (Google Analytics). Stories « Notion Actions » et « Google Analytics Read Only ».

- **Étape 1 de l'analyse produit, la fiche serveur (17/11) :** en-tête calme sur un seul bord gauche (logo 40 et titre 42 sur une ligne au bureau ; une phrase d'accroche composée depuis les données, `hookSentence` ; « Copier pour votre assistant » et « Voir les étapes ↓ » ; ligne de confiance « Officiel, publié par Notion · vérifié le … ») ; ligne de faits, pastilles « Fonctionne avec », logos flottants et grille « Fiche technique » retirés ; citations sans ombre. Chapitres : ce que ça change, Brancher (l'adresse copiable sous « Autre outil »), « Vos premières demandes » (trois en lecture puis une qui écrit, avec ce qu'il faut vérifier), « Si ça ne marche pas » (seulement ce que l'éditeur documente), « Ce qu'il peut faire, et comment garder la main » en phrases (une par niveau avec sa pastille, « restaurer » sorti de « Supprime » chez Notion ; gestes concrets ; forfait : options avancées), notre avis, la liste des actions en rangées avec filtre par risque (repliée), les sources (sans redire la date). Contenu des 19 fiches relu sur la doc éditeur le 17/11 : `control`, `plan_words`, `first_requests`, `troubleshoot`, au garde-fou ; absents quand l'éditeur ne dit rien (ClickUp sans geste de contrôle, Stripe, Shopify, Slack, Webflow et Google Analytics sans forfait documenté). Contrat testé dans la story Notion : l'en-tête et Brancher précèdent la technique, la date, le forfait et « Officiel » n'apparaissent qu'une fois.

- **Étape 1 bis, la mise en page de la fiche serveur (17/11) :** composant `Chapter` du système (`src/ds/Chapter` : titre 42, 21 sur téléphone ; chapeau 21, 17 sur téléphone ; colonne de lecture 720 ou grille 1080 ; 96 entre chapitres, 64 sur téléphone, 48 avant les notes, 24 et 8 ; variante `notes` sans titre). Tous les chapitres sur la feuille blanche (« cette couleur ne doit jamais être utilisée en background », Michael, 17/11) : le rythme vient de l'échelle, des écarts et des objets, posés sur le blanc avec le bord et l'ombre de repos du système (`--tt-row-rest`) : cartes de demande, étapes, cartes de l'avis, dépliant des actions ; bloc de code en filet ; passerelle de la fiche outil et tuiles du hub sorties du gris de la même façon. Les pastilles, le contrôle segmenté, le bouton désactivé et le survol du menu gardent la teinte que le système leur donne. Garde-fou : `src/ds/Chapter/surfaces.test.ts` refuse `--tt-tile` ou `--tt-chrome` en fond dans les styles de la section (hors survol). La fiche en six chapitres : en-tête (logo de 40 au-dessus du titre), « Ce que vous pourrez lui demander » (trois cartes, lecture d'abord, l'écriture en dernier avec sa vérification), Brancher (contrôle segmenté Claude, ChatGPT, Gemini, « Autres » à la largeur de son contenu ; étapes en cartes côte à côte avec grand numéro ; bloc à copier en pleine largeur dessous, « Copiez la commande ci-dessous » ; « Si ça ne marche pas » en dépliant), « Garder la main » en deux colonnes puis le forfait (pastille au-dessus de sa phrase sur téléphone), « Notre avis » en deux colonnes puis trois cartes (outil, alternative, savoir-faire), annexes en notes (actions repliées, sources et « Signaler une erreur » sur une ligne). Espaces insécables dans les guillemets et devant : ; ? ! par un utilitaire commun (`typo`, appliqué par `say`). Story « Fiche complète » ; contrat testé : l'ordre des six chapitres, aucun fond gris, trois cartes sous l'avis.
- **Même passe, trois retours de Michael (17/11) :** (1) l'action d'une étape est dans l'étape : bouton principal « Copier la commande / la configuration / l'adresse » avec « Copié » en aria-live ; quand le client documente un lien direct (VS Code, Cursor), « Ouvrir dans … » devient l'action et la copie passe dessous (« ou copier la configuration ») ; le bloc de code reste en aperçu pleine largeur, sans bouton à lui. (2) Toute demande proposée a son bouton de copie : composant `Prompt` du système (`src/ds/Prompt`, story d'interaction : le presse-papiers reçoit la demande sans guillemets), utilisé dans « Vérifiez en lui demandant : », les cartes de demande, la recommandation du hub et la passerelle. (3) Un vocabulaire de conséquence pour toute la section (`CONSEQUENCE` dans `src/lib/agents.ts` : Lecture seule, Modifie vos données, Envoie en votre nom, Supprime des données, Engage un paiement) ; la liste des actions rangée par conséquence, du plus grave au plus anodin, sections dépliées pour supprimer, payer, envoyer, « Modifie » dépliée jusqu'à 10 actions, « Lecture seule » repliée (« Sans effet sur vos données ») ; sujets en sous-titres, lignes denses sur deux colonnes sans cadre ni pastille ; plus de filtre. Stories « Notion Actions », « Stripe Actions », « Google Analytics Read Only », « Copier depuis l'étape » ; la story « Fiche complète » refuse l'ancien vocabulaire.
- **Même passe, cinq retours de plus (17/11) :** (1) « Garder la main » en deux colonnes bâties pareil : « Ce qu'il peut faire » et « Vos garde-fous », chaque entrée avec une icône de 20 dans un rond de 40, un titre en 17 gras et une phrase (garde-fous désormais `{ title, icon, fr, en }` dans les 19 fiches, au garde-fou) ; plus de colonne de pastilles ; le forfait quitte le chapitre et passe en « Selon votre forfait. … » à la fin de Brancher. (2) La liste des actions entre dans « Garder la main » : chaque conséquence porte son nombre et ses actions dessous ; supprimer, payer, envoyer toujours visibles ; « Modifie » montre 6 actions puis « Voir les 26 actions » ; « Lecture seule » repliée ; les actions repliées restent dans le HTML ; « Vos garde-fous » collée en haut à droite au bureau ; le dépliant d'annexe disparaît. (3) Menu « Copier pour votre assistant » ancré au bord gauche du bouton, 360 au moins, jamais plus large que la zone de contenu moins 32 ; sous 768, le `Drawer` du système depuis le bas ; story : le menu reste dans la zone de contenu. (4) « Voir les étapes » retiré : une seule action en tête, contrat testé. (5) « Notre avis » en deux cartes teintées (`ToneCard`, nouveau composant du système : gain et prudence, icône de 24 dans un rond de 48, texte en 21) puis « Pour aller plus loin » en trois cartes d'un seul gabarit (`RelatedCard` : logo de 40, rôle, nom en 21, une phrase complète ou rien, un lien d'action aligné en pied ; « Ajouter à ma stack » en second lien discret si l'outil n'y est pas).
- **Même passe, copie en un clic (17/11) :** composant `CopyText` du système (`src/ds/CopyText`, story « Molécules/Texte copiable ») : le nom technique est lui-même le bouton (« Copier notion-delete-pages »), icône de copie et teinte légère au survol et au focus, coche et « Copié » 2 s après le clic, 44 de hauteur tactile sans grandir la ligne. Il sert aux identifiants des lignes d'action (le libellé français ne se copie pas) et à l'adresse du serveur sous les étapes ; le bouton de l'étape reste quand copier est l'action principale. Story d'interaction dans « Agents / Fiche » (`CopierDepuisLEtape` : le presse-papiers reçoit exactement `notion-delete-pages`).
- **Même passe, liste des actions revue (17/11, « on est d'accord qu'on n'y est pas ? » sur ClickUp) :** un fait à une seule place : pas de phrase de synthèse au-dessus d'une liste de 6 actions ou moins ; au-delà, une ligne résume par sujets seulement ce qui est replié (« Et aussi : … », « Lit : … »). Deux colonnes alignées sur toute la liste : libellé en 16, identifiant en 14 couleur méta avec `CopyText`, colonne calée sur l'identifiant le plus long de la fiche ; sous le libellé quand la colonne fait moins de 560. Icône de copie visible au repos (atténuée), pleine au survol et au focus. 8 entre lignes, 48 entre conséquences, titre centré sur l'icône. « Garder la main » en 3/5 actions et 2/5 garde-fous ; sans garde-fous documentés (ClickUp, `control` absent : à enrichir), les actions seules sur 720. Vérifié sur ClickUp, Notion et Stripe à 1440 et 375.
- **Étape 2, le bloc « Assistant IA » de la fiche outil (17/11) :** `AgentAccess` réduit à un verdict dans le vocabulaire de conséquence (où il se branche, la conséquence la plus grave, le forfait seulement s'il restreint : « Forfait payant requis »), une demande avec « Copier la demande » et le lien d'action « Brancher Notion à votre assistant → » (flèche visible au repos, `LinkArrow shown`, aussi sur les cartes liées de la fiche serveur). Plus de carte, de grille de libellés, de date ni d'avis. Dans la section « L'IA » quand elle existe (`ToolAiBlock` reçoit le bloc en enfant, transition « Et votre propre assistant ? »), sous son propre titre sinon (ClickUp, Tally). Sans branchement officiel : la phrase, puis les alternatives de l'outil (celles que la fiche affiche) qui se branchent, 3 au plus, sans repli par catégorie (`src/lib/agentAlternatives.ts` : Hotjar n'en a aucune, Milanote a Notion, Figma, Miro). Stories Notion, Stripe, Ahrefs, Hotjar, Milanote avec le contrat « ne répète aucun fait de la fiche ».
- **Étape 4, le hub en bilan et /mcp par catégorie (17/11) :** `/agents` s'ouvre sur « Votre assistant IA » et deux questions : l'assistant (contrôle segmenté Claude, ChatGPT, Gemini, Copilot, Autre, variante `compact` de `Segmented`, même clé que la fiche serveur) et les outils (Ma stack lue sans être modifiée ; sans stack, `ToolChecklist` : les 20 outils vérifiés à cocher et le catalogue en recherche, choix gardé dans ce navigateur, « Enregistrer dans Ma stack » le propose). Le bilan est un chapitre dont le titre est le verdict calculé (`src/lib/agentReport.ts` : « 4 de vos 9 outils se branchent à Claude, dont 3 en un clic. 1 peut engager un paiement. »), puis une ligne par outil (`StackReport`) : en un clic, à configurer, non documenté pour cet assistant, sans branchement officiel (avec l'une de ses alternatives qui se branche), pas encore vérifié (« Signaler cet outil »). Chaque ligne porte la conséquence la plus grave avec son icône, une demande copiable et « Brancher → ». Puis « Tous les outils qui se branchent », par famille (`src/lib/agentShelves.ts` : les univers de besoin d'Explorer, `needUniverses.ts` ; deux univers qui se citent l'un l'autre partagent un rayon, une catégorie hors univers part dans « Autres outils », en dernier ; 6 rayons pour 19 serveurs), avec un seul filtre « Avec Claude ». Retirés du hub : besoins, filtres techniques, « Par où commencer » (remplacé par le lien du guide), skills. `/mcp` affiche la même liste. Au passage, dans le système : `useToolLogoSource` montre aussi un logo local déjà en cache (il restait masqué quand le même logo était affiché plus haut) ; `Logo` garde l'initiale tant que l'image charge, jamais un carré vide ; `Segmented` prend la largeur de ses options (`width: fit-content`), jamais celle de la ligne, partout où il sert. Contrat testé : le verdict et les lignes concordent pour chaque assistant ; aucun outil n'est classé sans donnée.
- **Étape 4, la liste revue (17/11) :** Slack rejoint Communication (sous-besoin « Chat d'équipe ») et Stripe le rayon de Shopify (sous-besoin « E-commerce » ; aucun univers Finance) : 5 rayons, plus de « Autres outils » d'un seul outil. Phrases de carte entières, 56 signes au plus (12 réécrites dans `research/mcp/`, règle `CARD_MAX` dans le validateur et un test), cartes jamais plus étroites que 280 px. Pied de toutes les cartes de serveur (`serverFoot`) : « En un clic avec Claude », « À configurer » ou « Non documenté pour Claude », puis la conséquence la plus grave avec son icône, pour l'assistant retenu (`useAgentAssistant`, partagé avec la fiche serveur) ; plus de « En ligne » ni « Votre compte ».
- **Étape 5, skills et navigation (17/11) :** « Votre assistant IA » remplace « Agents IA » dans la barre latérale, le menu téléphone, l'ancien panneau et les fils d'Ariane (fichiers communs : libellé seul). Les skills sortent du hub et de la navigation (plus d'onglets de rubriques). Règle `forEveryone` (`src/lib/agents.ts`, projetée en `everyone` dans `skills_index.json`) : un skill sert un non-développeur quand il n'y a rien à installer, il vient avec le serveur branché (Notion Skills et les deux skills Zapier) ; les autres passent par un outil de code. `/skills` devient « Savoir-faire pour développeurs », accroche « Pour développeurs : … », rayons par outil (ceux sans installation d'abord). La fiche skill passe au modèle de chapitre de l'étape 1 bis : en-tête (« X, pour développeurs » et accroche, ou « sans rien installer »), « Ce qu'il apprend à votre assistant », « L'ajouter » (une carte par outil avec sa commande à copier), « Pour aller plus loin » en cartes plates, sources en notes. Sur la fiche serveur, « Pour aller plus loin » ne propose plus qu'un skill pour tous. Une carte ne montre une phrase tirée d'un texte non écrit pour elle (résumé de skill, description d'outil) que si sa première phrase tient (`cardLine`), jamais coupée. Ménage : 321 lignes de CSS mortes retirées de `AgentSheet.module.css` (Part, Further, Sources, Facts et leurs styles). Reste : les instructions d'installation des skills Figma sont en anglais dans les données (« When you install the Figma plugin… »), à traduire au prochain enrichissement. Pied des cartes de skill (`skillFoot`) : « Sans installation », ou les outils de code documentés (« Dans Claude Code, Codex, Cursor », quatre nommés au plus) ; plus de « Savoir-faire » ni d'éditeur, déjà sur la carte.
- **Étape 3, « Votre assistant » dans Ma stack (18/11, `integration/agents-ma-stack`) :** fusion de la branche agents dans une branche tirée de `mission/m01-ma-stack` (364d4eb5 ; un conflit, `docs/ROADMAP.md`, résolu sans perte). Dans « Ma stack en bref », une tuile « Votre assistant IA » de la même mécanique que les autres : tuile question « Quel assistant utilisez-vous ? » (Claude, ChatGPT, Gemini, Copilot, Autre) qui part une fois répondue, puis tuile constat « 4 sur 8 » avec le verdict du hub mot pour mot (`reportVerdict`) ; « Outil par outil » mène au bilan de `/agents`, « Changer d'assistant » repose la question. Le choix est partagé avec la fiche serveur et le hub (`useAgentAssistant`, clé `tooltrim.agents.client`). Dans la fiche d'un outil de la stack (`StackToolSheet`), une section « Avec votre assistant » : statut et conséquence la plus grave (`serverFoot`), puis « Brancher Notion → ». Le verdict ne compte plus les outils non vérifiés et le dit (« 1 outil pas encore vérifié », accord et espace insécable), sur le hub comme dans Ma stack. Test de contrat : le constat de Ma stack égale le verdict du hub pour la même stack (`StackAssistant.test.tsx`). En développement, `/fr/ma-stack?demo=stack9` charge la stack de relecture de 9 outils (tous les statuts pour Claude) par l'état de Ma stack. Écarts typographiques déjà présents sur la mission (story « Proposition M01 », texte gris), non corrigés ici.
- **Étape 6, recettes entre outils (18/11, `integration/agents-ma-stack`) :** 11 recettes écrites par ToolTrim dans `research/agents/recipes.json`, sur les paires les plus fréquentes des stacks du catalogue (Notion avec Airtable, Canva, Miro, Figma, Calendly, Stripe, HubSpot, Google Analytics ; Buffer et Canva ; Airtable et Miro ; Calendly et Stripe), hors concurrents et hors serveurs sans liste d'outils (Tally, Ahrefs ; Slack n'a qu'un envoi de fichier). Chaque recette nomme ses deux serveurs et les outils documentés qu'elle mobilise ; le garde-fou `validateRecipes` refuse un outil absent de la fiche (test). Projection `src/data/agents/recipes.json` avec, de chaque côté, la conséquence la plus grave des outils utilisés (pas du serveur entier). `recipesFor` : les deux outils dans la stack et branchés pour l'assistant choisi, trois au plus. Affichage `RecipeCards` (deux logos, la demande à copier, la conséquence de chaque côté) dans la tuile assistant de Ma stack et sous le bilan du hub (« Avec deux de vos outils ») ; test de contrat : les mêmes recettes que le hub pour la même stack.
- **Étape 7, comparatifs (18/11, `integration/agents-ma-stack`) :** dans le tableau « Comparez selon votre usage » de `ComparisonDecisionPage` (comparatifs et duels), une ligne « Avec votre assistant » pour l'assistant choisi sur le site (`useAgentAssistant`) : de chaque côté le statut et la conséquence la plus grave (« En un clic avec Claude · Supprime des données », « Pas de branchement officiel »), et sous le libellé une phrase de différence quand elle existe, dans cet ordre : un seul des deux se branche (« Seul Google Analytics se branche à Claude. »), une conséquence de plus d'un côté (« Zapier peut aussi supprimer des données. »), un seul en un clic (« Seul Notion se branche en un clic à Claude. »). Sans donnée pour un des deux outils (non vérifié), pas de ligne. `compareAssistant` dans `src/lib/agentReport.ts`, testé. Relu avant : « Comparatifs éditoriaux » (la situation du scénario au-dessus du choix), non touché.
- **Étape 8, `/agents` et `/mcp` sur le gabarit des hubs (18/11, `integration/agents-ma-stack`) :** même gabarit qu'Outils : `CatalogTitle` (titre et une phrase, « officiellement » dit une fois), `CatalogToolbar` collante avec Tout et les 5 rayons (nom court : le premier univers, `?rayon=` dans l'adresse), et à droite le choix de l'assistant au format de « Trier » (« Avec Claude », panneau « Quel assistant utilisez-vous ? », clé `tooltrim.agents.client`). Avec une stack, une seule ligne `Notice` « 4 de vos 8 outils se branchent à Claude · Voir le bilan → » (`stackHeadline`) vers `/ma-stack#assistant`, qui arrive sur la tuile. Les questions, la grille de logos et le bilan quittent le hub ; `HubQuestion(s)`, `ToolChecklist`, `StackReport` et leurs stories sont retirés du système, la logique reste dans `agentReport`. « À la une » : `MediaCards` d'Outils, les serveurs en un clic pour l'assistant, ordonnés par présence dans les stacks du catalogue (`in_stacks`, projeté par `project-agents.mjs`), 4 au plus, rien pour `/mcp`. Rayons : `CatalogSection` et `ToolRow` du catalogue ; à droite du nom, un seul statut (« En un clic », « À configurer », « Non documenté », prop `aside` ajoutée à `ToolRow`), sous la phrase la conséquence seulement si elle supprime, paie ou envoie ; « Voir tout » au-delà de 6. Recettes : « Avec deux de vos outils » seulement avec une stack. Dans Ma stack, le lien de la tuile devient « Tous les outils à brancher → » (`/agents`), puisque le détail outil par outil a quitté le hub. Test de contrat `AgentsIndexPage.test.tsx` (barre du catalogue, « À la une » = `featuredServers`, un statut par ligne, pas de questions ; `/mcp` sans « À la une »), story `Agents/Hub/Rayons`. Relu côte à côte avec `/fr/stacks` et `/fr/comparatifs` à 1440 et 375 (captures `s8-captures/`).
- **Étape 8b, retours de Michael du 18/11 (`integration/agents-ma-stack`) :** les cartes de la section viennent du catalogue : serveurs et skills en `ToolRow` avec une seule ligne de méta (`AgentRowNote` : statut 16 px, conséquence seulement si grave, « où il marche » pour un skill), sur le hub, `/skills` et la fiche skill ; `AgentCard`, `AgentShelf` et `RelatedCard` retirés. « Pour aller plus loin » de la fiche serveur : `MediaCards` taille s (`ToolMediaCard` pour l'outil et l'alternative, avec le bouton « Ajouter à ma stack » du système ; `MediaCard` simple pour un savoir-faire), surtitre en tag (« La fiche de l'outil », « Se branche aussi », « Savoir-faire »). Un seul contrôle d'assistant, `AssistantChoice` (puces du système, choix unique, « Pour développeurs » atténué avant les outils de code, « Autre outil » en dernier), dans « Brancher » et dans le panneau « Avec Claude » du hub (`CatalogToolbar` accepte un panneau sans tri). « Garder la main » : un vrai tableau par conséquence, composant système `Table` (« Action » | « Identifiant », lignes séparées, empilées sur téléphone, en-têtes gardés pour les lecteurs d'écran, au-delà de 6 lignes repliées mais présentes dans le HTML), la note des outils groupés sous le titre du premier tableau ; sous-titres de colonne en 21, 24 jusqu'au contenu, 48 entre conséquences, titre d'entrée centré sur son rond ; 1 ou 2 garde-fous en rangée pleine largeur au-dessus des actions. Invariant `test:ds` : aucun écart de 96 entre enfants d'un chapitre (`chapterGaps`). Fiche outil : « Avec votre assistant » remonté après la vue d'ensemble, avant le pour et le contre, en carte (surtitre, marques des assistants en un clic, verdict en 21 avec l'assistant du lecteur en premier, demande à copier, « Brancher Airtable à votre assistant » en bouton secondaire) ; version courte pour un outil sans branchement, rien sans vérification.
- **Étape 8c, ergonomie des choix et des demandes (18/11, `integration/agents-ma-stack`) :** (1) le choix de l'assistant devient des onglets, composant système `Tabs` (`role="tablist"`, flèches, Début/Fin, logos de 20 px, aspect du contrôle segmenté) : Claude, ChatGPT, Gemini (ceux que l'éditeur documente), puis « Outil de code ▾ » qui ouvre un menu (fenêtre sur ordinateur, feuille du bas sur téléphone) avec Claude Code, Cursor, VS Code, Codex et « Adresse du serveur (autre outil) » ; l'onglet retenu s'ouvre d'office ; sur une colonne étroite, logo au-dessus du nom court, quatre onglets de 44 px sur une ligne. Même composant dans le panneau « Avec Claude » du hub (Claude, ChatGPT, Gemini, puis « Autre ▾ » : Copilot, un autre assistant), `CatalogToolbar` accepte un panneau sans tri. (2) Le repli d'un tableau d'actions devient la dernière ligne du tableau (`<tfoot>`, « Voir les 20 autres actions », puis « Réduire », `aria-expanded`/`aria-controls`), les lignes se déplient sur place, regroupées par sujet en lignes de section (`th scope="rowgroup"`) au-delà de 12 lignes ; plus de phrase « Et aussi ». (3) `Prompt` devient un message : bulle sur un lavis d'encre (`--tt-message-bg`), logo de l'assistant choisi, texte en encre pleine sans guillemets, note « À vérifier » avec coche, « Copier la demande » en bouton secondaire du système calé en bas ; les cartes « Ce que vous pourrez lui demander » reprennent le gabarit de Brancher (numéro, « Pour commencer » / « Ensuite », conséquence avec icône et teinte). Invariant `chapterGaps` : un bouton calé au pied d'une carte (`data-foot`) n'est pas un écart.
- **Étape 8d, « À la une » sans trou (18/11, `integration/agents-ma-stack`) :** dans le système, `MediaCards` remplit toujours sa rangée : `auto-fit`, et pour 3 cartes 3 ou 1 par ligne, pour 4 cartes 4, 2 ou 1 (un `clamp` sur la largeur de la rangée, sans point de rupture) ; la description tient en deux lignes (`--tt-caption-reason`) ; l'étiquette posée sur la capture a un fond plein (`--tt-tag-solid`), sur `/tools` comme sur `/agents`. Invariant `test:ds` `emptyColumns` : aucune colonne vide dans une rangée de 4 cartes ou moins. `/agents` vise 4 cartes : en un clic d'abord, puis « À configurer » pour l'assistant choisi, chacune par présence dans les stacks du catalogue (`featuredServers`, testé) ; avec Gemini, seuls 3 serveurs le documentent et la rangée en tient 3 sur toute la largeur. Phrases de carte des serveurs ramenées à 50 signes (`CARD_MAX`, garde-fou des données) pour tenir en deux lignes dans la carte la plus étroite. Dans la même étape : la ligne de stack du hub et le verdict de Ma stack en mots simples (« Nous n'avons pas encore vérifié si Google Sheets et Asana se branchent à Claude · Nous le signaler → », sinon « 1 de vos 2 outils se branche à Claude ; nous n'avons pas encore regardé Asana · Voir le bilan → »), plus jamais « vérifié » comme état ; la tuile « Votre assistant IA » disparaît quand aucun outil de la stack n'a été regardé, et son constat compte tous les outils (« 1 sur 2 ») ; plus de rangée vide sous son surtitre. Rangées : le logo calé en haut (`ToolRow`, comme sur `/tools`), une seule ligne de méta qui nomme l'assistant (« Non documenté pour Claude »), la conséquence grave réduite à son icône (libellé lu et au survol). « Ce qu'il peut faire » : un seul tableau par serveur, colonnes fixes (`table-layout: fixed`, identifiant à 40 %), une section par conséquence ouverte par sa ligne de section (icône de 20, libellé en gras, nombre, « Sans effet sur vos données » pour la lecture), le repli dans la section ; invariant `misalignedColumns`. Navigation : « Outils pour l'IA » / « Tools for AI », juste après Outils (barre latérale, menu téléphone, ancien panneau, fils d'Ariane, titre et SEO du hub) ; l'adresse `/agents` et la tuile de Ma stack ne changent pas. Démo de revue en développement : `?demo=unchecked2` et `?demo=mixed2` sur Ma stack.

**Reste à faire :** Michael revoit `/fr/agents`, `/fr/mcp/notion-mcp` et `/fr/tool/notion#assistant-ia` et dit si ça accompagne ; références visuelles après validation ; publication. Puis le [critère de passage à S2](#critere-s2).

### Brief d'origine — S1, section MCP (exécuté les 16-17/11)

Tâche d'exécution sur une branche dédiée tirée de `main` (rien sur `mission/m01-ma-stack`).

0. **Données :** inventorier les skills officiels des éditeurs du pilote et écrire `research/skills/<skill>.json` ; pour les 19 serveurs du relevé, écrire `research/mcp/<serveur>.json` au schéma « fiche serveur », à partir des fichiers `research/agent-trial/` et de la documentation éditeur consultée le jour même. Remplir notamment `tools` depuis la référence d'outils, `install` recopié tel quel, `setup`, `capabilities`, `safeguards` et `status`. Fait introuvable : champ absent et manque noté. Résumés écrits par ToolTrim, rien de Toolfolio. Vocabulaires au garde-fou.
1. **Projection :** `src/data/mcp_index.json` et données de fiche ; bloc `agent` réduit sur les 20 fiches outils, avec lien vers le serveur.
2. **Composants `src/ds/`, stories d'abord :** carte serveur, filtres de l'index, fiche serveur, bloc passerelle, catalogue d'outils repliable. Fixtures : Notion, Figma (deux serveurs), Stripe (paiement, bêta), Ahrefs (payant), Hotjar (`none`, côté bloc).
3. **Pages et routes :** hub `/agents`, `/mcp`, `/mcp/:slug`, `/skills`, `/skills/:slug` FR/EN, SEO et prérendu ; retirer `HostPage` pour la famille `mcp` ; entrée dans la navigation et le méga-panneau Explorer.
4. **Guide pilier FR/EN** « MCP pour freelances non-développeurs », lié à la section.
5. **Vérification :** `npm run lint:ds`, `npm run test:ds`, `npm run build-storybook && npm run test:visual`, `npm run build` ; captures de l'index, des fiches Notion, Stripe et Figma, et du bloc sur la fiche Hotjar.

Terminé quand la section est servie en local avec ses 19 fiches, les contrôles passent, et cette section renvoie au critère de passage à S2.

### Règles d'arbitrage pour la suite (écrites le 16/11 pour décider sans nouvelle session de cadrage)

**Après l'essai sur cinq outils, pour chaque champ incertain :**
- `plan` : le garder si au moins 3 outils sur 5 le remplissent avec une source éditeur ; sinon le retirer du schéma et dire le forfait en prose dans le verdict quand il est connu.
- `clients` : le garder seulement si les éditeurs restreignent réellement certains clients. S'ils disent « tout client MCP », le remplacer par rien pour les serveurs distants et ne le conserver que pour les serveurs locaux.
- `access` : si plusieurs outils répondent « selon les permissions du compte », ajouter la valeur `account_scoped` plutôt que de forcer `read_write`.
- Tout autre champ rempli sur moins de 3 outils sur 5 sort du schéma. Dans le doute, retirer : un bloc court et vrai vaut mieux qu'un bloc complet à moitié `unknown`.

**Choix des 20 outils du pilote M1 :** partir de `research/agent-trial/toolfolio-overlap-2026-11-16.json`, croiser avec la présence dans les stacks (`src/data/stacks-catalog-index.json`) et les impressions (`src/data/tool_demand.json`), puis équilibrer les catégories. Écarter les outils pour développeurs (Terraform, Redis, Playwright…) : le public est le freelance non-développeur. Inclure deux ou trois outils `none`.

**Bloc passerelle sur la fiche outil :** une phrase de verdict, trois faits et le lien vers la fiche serveur. Un outil `none` l'affiche aussi : « pas de serveur MCP officiel au JJ/MM ». Le détail (outils, installation) vit sur la fiche serveur. Composant dans `src/ds/`, stories d'abord.

**Guide pilier (M1) :** répond à « qu'est-ce que ça change pour moi ? » pour un freelance sans code : ce qu'un assistant peut faire dans ses outils, ce qu'il faut vérifier avant de connecter (accès en écriture, forfait), trois exemples tirés des fiches du pilote. Ton et format des guides existants.

<a id="critere-s2"></a>
**Critère pour passer à S2 :** un contrôle automatisé de fraîcheur signale les écarts sur les fiches serveur ; et la section S1 montre des impressions ou des clics après un mois.

**Ce que ToolTrim ne fait pas sur cet axe :** classement par popularité, serveurs et skills tiers non officiels (S1 et S2), reprise de textes de Toolfolio. Les commandes d'installation et le catalogue d'outils, exclus le matin du 16/11, sont réintégrés par la décision révisée.

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

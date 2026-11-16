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
| Axe agentique et MCP — 16 novembre | Angle décidé : attribut des fiches d'abord. Décision révisée : le MCP devient un pilier, avec une section `/agents` (serveurs MCP et skills) sur la logique de Toolfolio. 20 outils relevés sur sources éditeur (non commités) ; S1 en cours sur une branche dédiée. [Plan et schéma](#axe-agentique-mcp). |

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

### Prochaine action — S1, section MCP (brief de reprise)

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

# ToolTrim : to-do

Liste vivante des chantiers et des constats en attente. Mise à jour à chaque
session : on ajoute ce qu'on repère, on coche ce qui est fait (avec la date et
le commit), on ne supprime pas l'historique récent.

Légende : **[décision]** = attend un arbitrage de Michael.

## En cours

### Recherche des fiches outils (crédit cloud de 100 $)
Brief : `docs/CLOUD_RESEARCH_BRIEF.md`. File : `research/queue.json`.
Budget : test 10 $ max, production 70 $ max, marge 20 $ intouchable.
- [x] Préparation : brief allégé, schéma v2, `scripts/research/validate.mjs`, `scripts/research/seed.mjs`, file de priorité (25/09/2026)
- [x] Pousser la préparation sur `main` pour que les sessions cloud la lisent (25/09/2026, `ed584dd3`)
- [x] Lot test (lot 0) produit le 25/09/2026 : 10 dossiers tier A, 0 erreur, 32 pages web ouvertes. Branche `research/batch-0`, copiés dans `research/dossiers/`.
- [x] Le lot test a tourné en local, pas dans le cloud. Réglé : Michael lance les sessions depuis claude.ai/code (environnement cloud avec accès Internet, Sonnet).
- [x] Dossiers v2 déplacés de `research/tool-pages/` vers `research/dossiers/` : le lot avait écrasé `notion.json`, fichier du circuit d'attestation (`scripts/research-attest.mjs`), comme il l'aurait fait pour framer, figma, linear, loom, n8n, webflow, wix, squarespace, calendly, google-workspace.
- [ ] Points de relecture du lot test **[décision]** : NordPass Premium 1,99 €/mois vu sous une bannière promo (prix hors promo à revérifier) ; MongoDB Atlas comparé sur le palier dédié M10 (57 $) plutôt que Flex (8 $), règle précisée depuis ; Freshservice et Capture One sans tarif mensuel sans engagement (pages par défaut en annuel).
- [ ] Relecture du lot test par Michael **[décision]** : qualité suffisante pour lancer la production ?
- [x] Lot 1 fait en session cloud le 25/09/2026 : 10 dossiers valides, **coût 10 $ (1 $ par outil), jugé trop cher**. Trouvé : Hotjar racheté (Contentsquare), Remix fusionné dans React Router, Topaz Video AI renommé.
- [x] Nouveau découpage décidé le 25/09/2026 : le crédit ne sert qu'aux 100 outils les plus cherchés (72 % de la demande), en mode « faits seuls » (section 0 du brief), 3 outils par session, effort bas. Lots `c1` à `c27` dans `research/queue.json` (`cloudBatches`).
- [x] Lot test `c1` fait le 25/09/2026 (branche `research/c1`) : coût par fiche jugé acceptable par Michael. Limites : 1 source par outil, et pour Adobe un seul prix sur trois (22,99 $ = annuel payé au mois, noté « mensuel »).
- [x] Script de fusion `scripts/research/merge.mjs` écrit et appliqué aux 20 dossiers complets (lots 0 et 1) le 25/09/2026, en local
- [x] 26 fiches en ligne le 25/09/2026 (`cb0cefc0`) : lots 0, 1, c1, c2. NordPass sans prix promotionnel dans la grille (`promoPrice`), MongoDB Atlas comparé sur Flex.
- [x] Coût mesuré : 0,50 $ par fiche en mode « faits seuls » (c1 et c2), solde 87 $ après c2.
- [ ] Session enchaînée c3 à c10 (24 outils) en cours, directement sur `main`
- [ ] Lots c11 à c21 (10 outils chacun, 110 outils) : d'abord c11 à c13, vérifier le coût par fiche, puis c14 à c21
- [ ] Compléter en local puis fusionner chaque lot reçu (c3 et suivants)
- [x] Lot local M, N, O (01/10/2026) : 24 fiches fusionnées (173 en tout). Retenues : browzwear, autocad-lt, gmail (prix sans source officielle) ; tubebody, adobe-acrobat, stripe (`hold`).
- [ ] Prix à vérifier sur le site de l'éditeur : Rydoo (forfait de comparaison à 5 postes minimum), Microsoft Defender et Adobe Acrobat (mensuel = annuel), Restream Business (239 $ pour 2 postes, pas un vrai prix par poste), Stripe (taux public classé « sur devis »), TubeBuddy (prix Pro/Legend non confirmés)
- [ ] Doublon catalogue : `tubebody` et `tubebuddy`
- [x] Lot local P à X (01/10/2026) : 54 fiches fusionnées sur 70. Retenues (prix sans source officielle) : yousign, octane-render, arnold, crowdfire-inc, streamelements, billo, leonardo-ai, gelato, clo-3d, ableton-live, udio, highcharts ; `hold` : plasticity, luminar-neo, payhawk ; skribble en CHF.
- [ ] Prix à vérifier : D5 Render (unité Teams), Indy (prix auto-entrepreneur seulement), Doola (mensuel non publié), Descript (annuel), Superlist (annuel recalculé), Ignition (aucun prix au dossier)
- [ ] Doublon catalogue : `descript` et `descript-ai`
- [x] Fragments du catalogue client répartis par hachage du slug (48 fichiers, 0,3 Mo max) au lieu de la première lettre (le « u » dépassait 1 Mo à cause des 106 `universal-*`)
- [x] Lot local Y à AB (01/10/2026) : 28 fiches fusionnées sur 40 (255 en tout). Retenues (prix sans source officielle) : procreate, prezi, midjourney, ownr ; `hold` : tradingview, bloom-crm, legalplace, dext, format, aloware, wolters-kluwer, bots-discord.
- [ ] Bots Discord : domaine qui ne répond plus, produit sans source **[décision]** (à joindre aux produits arrêtés)
- [ ] Wolters Kluwer : holding à plusieurs produits traitée comme un outil unique **[décision]** : découper ou retirer la fiche
- [ ] Prix à vérifier : Unity Pro (annuel divisé par 12), NetSuite (estimations tierces seulement)
- [x] Dernier lot local AC à AJ (01/10/2026) : 38 fiches fusionnées sur 53. **Complétion terminée : 293 fiches recherchées en ligne**, 41 dossiers en `hold`, n8n exclu. Retenues (prix sans source officielle) : gusto, apollo-io, microsoft-dynamics-365-finance-operations, cinema-4d, photopea, redshift, roam-research, vimeo ; `hold` : lottie, substance-3d-designer, archicad, dashlane, lightroom-mobile, artlist, ae-newton3.
- [ ] Vérification manuelle des prix retenus : tous les dossiers avec `hold` ou « compared price has no official source » (`node scripts/research/merge.mjs` en simulation les liste)
- [ ] Doublons catalogue : `apollo` / `apollo-io`, `lottie` / `lottiefiles`
- [ ] Apollo : l'agent a remplacé HubSpot, Pipedrive, lemlist, La Growth Machine par des alternatives plus faibles ; restaurer avant fusion
- [ ] Prix à vérifier : Smartsuite (minimum 3 sièges sur tous les plans), Kajabi (179 $ contre 55 $ dans l'ancien catalogue)
- [x] Vérification des prix sur pages officielles (02/10/2026, brief `docs/PRICE_CHECK_BRIEF.md`) : 58 fiches sur 69 débloquées et fusionnées (348 fiches recherchées en ligne). Plusieurs passées en EUR (page officielle géolocalisée sans sélecteur).
- [ ] Prix encore à vérifier par un humain (navigateur ordinaire) : Arnold et Autodesk Flow Studio (widget de prix Autodesk bloqué), Patreon (support.patreon.com refusé), Vimeo (compte obligatoire), Billo (page de connexion), Dynamics 365 (Team Member et option non confirmés)
- [ ] Crowdfire (site pivoté, plus de prix) et StreamElements (aucune grille Plus) **[décision]** : produits encore vivants ?
- [ ] Newton 3 vendu sous le nom Newton 4 **[décision]** : renommer la fiche `ae-newton3`
- [ ] Stripe : commission en pourcentage impossible à saisir dans le schéma v2 ; ajouter un champ de taux (aussi utile pour Shopify Payments, aujourd'hui « sur devis »)
- [ ] Afficher le champ `tagline` des fiches dans le catalogue (aujourd'hui `toolTaglines.ts`) et un badge « produit arrêté / racheté » depuis `lifecycle`
- [ ] Compléter en local chaque dossier « faits » : note sur 5 axes, cible, textes EN puis FR (hors crédit)
- [ ] Outils au-delà du top 100 : recherche en local, lot par lot, dans l'ordre de `batches`
- [ ] 638 outils sans impression Google : non planifiés

### Mesure SEO
- [ ] Entre le 9 et le 23/10/2026 : comparer un nouvel export Search Console non filtré sur les requêtes visées par le commit `9b3f179f` (nordpass pricing, is dependabot free, mongodb atlas prix, motion bro free, lightroom pricing, capture one price, enscape pricing)

## SEO

- [ ] Pages alternatives vides ou hors sujet : 814 outils sans `alternatives` (Freshservice n'en cite aucune, ESLint renvoie vers ACF ou Appsmith). Couvert en partie par la recherche cloud.
- [ ] Pages prix minces : un bloc de tarifs puis « Et maintenant ? ». À enrichir avec la grille complète issue de la recherche.
- [ ] 689 `seo.metaDescription` rédigées mais jamais utilisées (français seulement, qualité inégale) **[décision]** : les brancher, les réécrire ou les supprimer
- [ ] Pages par intention (« meilleurs logiciels de montage vidéo pour freelances »), construites sur les usages des filtres : seul moyen de viser les requêtes génériques
- [ ] Slugs français dans les URL anglaises des catégories (`/en/category/gestion-projet`), à traiter avec les pages par intention (301)
- [ ] `x-default` des pages piliers persona pointe vers le français, contraire à « anglais d'abord »
- [ ] Maillage vers les sous-pages prix et alternatives depuis fiches, comparatifs et catégories

## Données du catalogue

- [ ] Vérifier les URL officielles des 1 177 outils : domaines parqués, redirections, 404, annonces de fermeture (script local, léger)
- [ ] TrueCoach et Surfer AI pointent vers un domaine parqué (truecoach.com, surferai.com) : trouver la bonne adresse
- [ ] Produits arrêtés **[décision]** : Avocode (fermé le 01/10/2023), MagicBrief, Premiere Rush. Retirer, rediriger ou marquer « arrêté » ?
- [ ] Concurrents manquants au catalogue : Jira Service Management, TOPdesk, GLPI (face à Freshservice), Biome, Oxlint (face à ESLint). La recherche cloud en listera d'autres (`missingAlternatives`).
- [ ] 57 couvertures inutilisables (vérification Cloudflare, domaine parqué, page vide) passées sur la tuile logo : récupérer l'image de partage officielle ou refaire la capture
- [ ] Devise USD ou EUR du catalogue **[décision]** : 214 outils tarifés en dollars stockés dans un champ `_eur`
- [ ] `compare_plan_kind` a une trentaine de valeurs pour une dizaine de réalités (`seat`, `per_user`, `paid_per_seat`…) : remplacer par la liste fermée du schéma v2
- [ ] `relevantFor` est en texte libre (des centaines de variantes) et `personas` mélange deux taxonomies : ramener à une cible parmi THEO, SOFIA, MARC, ALIX, CLAIRE
- [ ] Autres outils peut-être mal rangés : Sellsy (CRM ou finance), Pterocos, Upwork (communication), Relume
- [ ] 38 budgets de stacks sous-estimés
- [ ] Streamelements et TikTok : l'affirmation « gratuit uniquement » contredit la fiche
- [ ] n8n : fiche très demandée, refonte en cours (voir mémoire n8n)
- [ ] Réinjection Supabase au retour du service : liste dans `docs/SUPABASE_REPRISE.md`

## Catalogue et interface

- [ ] Accroches de 2 ou 3 mots : 92 outils sur 1 177 (le champ `editorial.tagline` de la recherche les apportera)
- [ ] Besoins « IA » et « Admin & Finance » ajoutés au catalogue sans validation explicite **[décision]** : les garder ?
- [ ] Pages catégorie d'un besoin à une seule catégorie (Content Creation, Automation, Analytics, AI) : la rangée de pilules est vide, seul le bouton Filtres reste
- [ ] Emplacements sponsorisés prêts (`catalogPlacements.ts`) mais aucun partenaire : à activer au premier contrat, avec l'étiquette « Sponsorisé »

## Technique

- [ ] 4 erreurs TypeScript préexistantes dans `ToolDetailPage.tsx` (ToolSummary contre Tool, `category` possiblement indéfini)
- [ ] 7 erreurs TypeScript préexistantes dans `HomePageV2.tsx`
- [ ] Budget de fichiers du build à 12 900 : les variantes de CSS critique des pages catégorie en consomment une vingtaine
- [ ] Contenu des pages piliers persona dupliqué entre `PersonaPillarPage.tsx` et `vite.config.ts`

## Fait récemment

- 25/09/2026 `9b3f179f` : titres et descriptions des fiches unifiés (`toolSeo.ts`), titres des pages prix qui répondent, H1 des sous-pages
- 25/09/2026 `82b0ee6c` : pages catégorie alignées sur /tools, index A à Z, noindex des catégories minces, 57 couvertures bloquées
- 25/09/2026 `511c528b` : catalogue /tools (besoins, filtres, sponsoring), barres de filtres sur une ligne, 7 recatégorisations, 5 URL réparées

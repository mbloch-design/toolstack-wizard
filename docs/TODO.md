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
- [ ] Script de fusion des dossiers validés vers `tools_v4.json` (prix de comparaison calculé depuis `comparePlanKey`, conversion de devise, note v2, alternatives), à écrire après le test
- [x] Lot 1 fait en session cloud le 25/09/2026 : 10 dossiers valides, **coût 10 $ (1 $ par outil), jugé trop cher**. Trouvé : Hotjar racheté (Contentsquare), Remix fusionné dans React Router, Topaz Video AI renommé.
- [x] Nouveau découpage décidé le 25/09/2026 : le crédit ne sert qu'aux 100 outils les plus cherchés (72 % de la demande), en mode « faits seuls » (section 0 du brief), 3 outils par session, effort bas. Lots `c1` à `c27` dans `research/queue.json` (`cloudBatches`).
- [ ] Lot test `c1` (cargo-site, adobe-premiere-pro, adobe-photoshop) pour mesurer le coût du nouveau mode
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

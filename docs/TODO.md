# ToolTrim : to-do

Liste vivante des chantiers et des constats en attente. Mise à jour à chaque
session : on ajoute ce qu'on repère, on coche ce qui est fait (avec la date et
le commit), on ne supprime pas l'historique récent.

Légende : **[décision]** = attend un arbitrage de Michael.

## En cours

### Recherche des fiches outils
Briefs : `docs/CLOUD_RESEARCH_BRIEF.md`, `docs/LOCAL_COMPLETION_BRIEF.md`, `docs/PRICE_CHECK_BRIEF.md`.
- [x] 370 dossiers « faits » produits en cloud (25 au 30/09/2026, ~0,19 $/fiche), complétés en local par Sonnet (01/10/2026), prix revérifiés sur pages officielles (02/10/2026) : **environ 350 fiches recherchées en ligne**
- [x] Décisions de Michael appliquées le 02/10/2026 (`5107c24b`) : doublons retirés (tubebody, lottie, apollo, descript), produits arrêtés retirés avec 301 (Avocode, InVision, Twitch Studio, PluralEyes, Premiere Rush, Bots Discord, MagicBrief, Dovetail AI), Newton 3 → Newton 4, Wolters Kluwer en une fiche
- [x] Règle de devise (02/10/2026) : jamais de conversion ; dollars seulement = dollars partout ; les deux = dollars en anglais, euros en français (`pricing.secondaryPrices`)
- [ ] En cours : grilles en dollars pour 25 fiches enregistrées en euros par géolocalisation ; 7 sans grille dollars accessible (GitLens, Gmail, Linktree, Luminar Neo, Motion Array, NordPass, Notion)
- [ ] Prix à vérifier par un humain (navigateur ordinaire) : Arnold, Autodesk Flow Studio, Patreon, Vimeo (compte obligatoire), Billo
- [ ] Prix publiés mais douteux : Rydoo (5 postes minimum), Microsoft Defender (mensuel = annuel), Restream Business, D5 Render (unité Teams), Indy (auto-entrepreneur seulement), Doola, Descript, Superlist, Unity Pro, NetSuite (estimations tierces), Smartsuite (3 sièges minimum), Kajabi
- [ ] Crowdfire (site pivoté, plus de prix) et StreamElements (aucune grille Plus) **[décision]** : produits encore vivants ?
- [ ] Stripe : commission en pourcentage impossible à saisir dans le schéma v2 ; ajouter un champ de taux (aussi Shopify Payments, aujourd'hui « sur devis »)
- [ ] Devises non gérées : Razorpay (INR), Skribble (CHF), Ownr (CAD)
- [ ] Afficher le champ `tagline` dans le catalogue (aujourd'hui `toolTaglines.ts`) et un badge « racheté / renommé » depuis `lifecycle`
- [ ] n8n : exclu de la recherche automatique (refonte dédiée)
- [ ] 638 outils sans impression Google : non planifiés

### Mesure SEO
- [ ] Entre le 9 et le 23/10/2026 : comparer un nouvel export Search Console non filtré sur les requêtes visées par le commit `9b3f179f` (nordpass pricing, is dependabot free, mongodb atlas prix, motion bro free, lightroom pricing, capture one price, enscape pricing)

## SEO

- [ ] Pages alternatives vides ou hors sujet : 814 outils sans `alternatives` (Freshservice n'en cite aucune, ESLint renvoie vers ACF ou Appsmith). Couvert en partie par la recherche cloud.
- [ ] Pages prix minces : un bloc de tarifs puis « Et maintenant ? ». À enrichir avec la grille complète issue de la recherche.
- [ ] 689 `seo.metaDescription` rédigées mais jamais utilisées (français seulement, qualité inégale) **[décision]** : les brancher, les réécrire ou les supprimer
- [x] Pilote des pages par intention (02/10/2026) : 5 comparatifs sous /guide/ (plugins After Effects, gestion de projet freelance, second cerveau, moteurs de rendu 3D avec angle IA, hébergement cloud), classés sur la note ToolTrim, prix réels sans conversion, encadré « L'avis ToolTrim ». Config `src/data/bestOfGuides.json`
- [ ] Pages par intention : mesurer les impressions 3 à 4 semaines après la mise en ligne, puis élargir à 20-30 pages (temps réel pour l'architecture, facturation à rattacher au guide existant, notes avec Evernote/OneNote une fois au catalogue)
- [ ] Slugs français dans les URL anglaises des catégories (`/en/category/gestion-projet`), à traiter avec les pages par intention (301)
- [ ] `x-default` des pages piliers persona pointe vers le français, contraire à « anglais d'abord »
- [ ] Maillage vers les sous-pages prix et alternatives depuis fiches, comparatifs et catégories

## Données du catalogue

- [ ] Vérifier les URL officielles des 1 177 outils : domaines parqués, redirections, 404, annonces de fermeture (script local, léger)
- [ ] TrueCoach et Surfer AI pointent vers un domaine parqué (truecoach.com, surferai.com) : trouver la bonne adresse
- [ ] Concurrents manquants au catalogue : Jira Service Management, TOPdesk, GLPI (face à Freshservice), Biome, Oxlint (face à ESLint). La recherche cloud en listera d'autres (`missingAlternatives`).
- [ ] 57 couvertures inutilisables (vérification Cloudflare, domaine parqué, page vide) passées sur la tuile logo : récupérer l'image de partage officielle ou refaire la capture
- [ ] `compare_plan_kind` a une trentaine de valeurs pour une dizaine de réalités (`seat`, `per_user`, `paid_per_seat`…) : remplacer par la liste fermée du schéma v2
- [ ] `relevantFor` est en texte libre (des centaines de variantes) et `personas` mélange deux taxonomies : ramener à une cible parmi THEO, SOFIA, MARC, ALIX, CLAIRE
- [ ] Autres outils peut-être mal rangés : Sellsy (CRM ou finance), Pterocos, Upwork (communication), Relume
- [ ] 38 budgets de stacks sous-estimés
- [ ] Streamelements et TikTok : l'affirmation « gratuit uniquement » contredit la fiche
- [ ] n8n : fiche très demandée, refonte en cours (voir mémoire n8n)
- [ ] Réinjection Supabase au retour du service : liste dans `docs/SUPABASE_REPRISE.md`

## Catalogue et interface

- [x] US-NAV-01 navigation (02/10/2026) : barre du haut qui se replie au scroll, recherche toujours accessible et ⌘K branché, menu mobile à niveaux (préférences et « Soumettre » enfin accessibles en mobile), colonne réduite avec libellés, dépliable par-dessus le contenu de 641 à 1 180 px, « déplier » au survol (visible en tactile), pictos revus (grille, paquets, colonnes, ampoule, symbole de devise), infobulle qui passait sous le contenu corrigée
- [ ] US-NAV-01, reste : fil d'Ariane compact en mobile ; vérifier le mode sombre de la nouvelle navigation ; navigation locale des fiches qui prend le relais quand la barre du haut se replie
- [ ] Accroches de 2 ou 3 mots : 92 outils sur 1 177 (le champ `editorial.tagline` de la recherche les apportera)
- [ ] Besoins « IA » et « Admin & Finance » ajoutés au catalogue sans validation explicite **[décision]** : les garder ?
- [ ] Pages catégorie d'un besoin à une seule catégorie (Content Creation, Automation, Analytics, AI) : la rangée de pilules est vide, seul le bouton Filtres reste
- [ ] Emplacements sponsorisés prêts (`catalogPlacements.ts`) mais aucun partenaire : à activer au premier contrat, avec l'étiquette « Sponsorisé »

## Technique

- [ ] Poids du build : la CSS de la colonne réduite (US-NAV-01) est écrite deux fois (réduction manuelle et plage imposée 641-1 180 px) et recopiée en CSS critique dans ~13 100 pages (+24 Mo de HTML). La factoriser (une classe posée au rendu serveur) pour revenir sous 925 Mo de HTML
- [x] Test `alternativesCoverage.spec.ts` réparé le 02/10/2026 : 138 effets Maxon (Universe, Red Giant) classés par famille avec alternatives entre eux (`scripts/classify-maxon-effects.mjs`), 317 → 175 fiches sans voisin

- [ ] 4 erreurs TypeScript préexistantes dans `ToolDetailPage.tsx` (ToolSummary contre Tool, `category` possiblement indéfini)
- [ ] 7 erreurs TypeScript préexistantes dans `HomePageV2.tsx`
- [ ] Budget de fichiers du build à 12 900 : les variantes de CSS critique des pages catégorie en consomment une vingtaine
- [ ] Contenu des pages piliers persona dupliqué entre `PersonaPillarPage.tsx` et `vite.config.ts`

## Fait récemment

- 25/09/2026 `9b3f179f` : titres et descriptions des fiches unifiés (`toolSeo.ts`), titres des pages prix qui répondent, H1 des sous-pages
- 25/09/2026 `82b0ee6c` : pages catégorie alignées sur /tools, index A à Z, noindex des catégories minces, 57 couvertures bloquées
- 25/09/2026 `511c528b` : catalogue /tools (besoins, filtres, sponsoring), barres de filtres sur une ligne, 7 recatégorisations, 5 URL réparées

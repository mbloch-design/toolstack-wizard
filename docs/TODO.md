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

- [ ] **Prix en dollars affichés en euros (2 oct.)** : 143 fiches sans plan attesté ont un texte tarifaire en dollars seulement, mais leur prix vit dans `compare_price_monthly_eur`, tantôt recopié tel quel (3ds Max 149, Apollo 49, Albato 15), tantôt converti (AdCreative 18,19 pour 21 $, AutoCAD 190,53 pour 235 $). Servi : « 149 € » en FR. Le code n'a pas le droit de deviner la devise (règle « que l'attesté », pas d'heuristique). Correction = donnée : 141 n'ont pas de dossier de recherche, liste dans `research/batches/devise-usd-sans-plan-2026-10-02.txt`. Décision du 2 oct. : recherche lancée, limitée aux 36 fiches qui ont des impressions (1 563 au total ; les 105 sans impression ne sont pas planifiées, comme pour le chantier cloud). Liste triée par impressions dans le fichier ci-dessus. Lot 1 fait (2 oct.) : 12 fiches fusionnées, prix attestés en dollars sur la page officielle (TubeBuddy, LottieFiles, Landingi, Maya, Readymag, Youform, 17hats, Balsamiq, Base44, BlueInk, Fathom, FlowMapp). Retenues, dossiers écrits mais non fusionnés : Squarespace et PhantomBuster (seule la grille euros lisible depuis un accès européen, grille US à vérifier depuis les États-Unis), Nuke (dollars tirés de la presse, la page officielle n'affichait que 449 €/an). Maya Indie : prix non relevé (page 403), le texte ne dit plus « sans prix public ». Lot 2 fait (7 oct.) : 17 fiches fusionnées en dollars (Loom, Cal.com, Vmake, Grok, Hex, Fillout, Marmoset Toolbag, Manifest AI, Superwhisper, Gemini, TimeCamp, Typefully, Notionlytics, SuiteDash, Dubsado, ChartMogul, Superhuman). Retenues : Shield (arrêté en mai 2026 ; doublon probable avec la fiche `shield`, à déprécier), Process Street et Sweep (page officielle passée sur devis uniquement), Pabbly Connect (grille en roupies, devise INR non gérée par le site). Les 36 fiches avec impressions sont traitées. Fait côté code : le bloc tarifs et le titre utilisent le même calcul sans conversion (le titre disait « €149 » sous un bloc « $149 »).

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

- [ ] **Fiche outil, refonte UX (2 oct.)** : le contenu sert à choisir avant l'achat, la sidebar à explorer (décision de Michael), le tout simple et lisible. Ordre du contenu : médias, À propos, avantages/inconvénients, quand ça a du sens, prix, alternatives, avis, approfondir, FAQ, guides ; en-tête à deux actions (« Visiter le site », « Ajouter à ma stack ») ; au défilement, l'en-tête ne se replie plus (saut de page, blanc avant les onglets) : navigation locale calée sur apple.com (mesures du 2 oct. dans le commentaire CSS) : apparaît en glissant dès 769 px quand les boutons de l'en-tête sortent de l'écran, verre dépoli, logo + nom cliquables, liens 12 px avec la page courante en bleu ToolTrim, « Ajouter à ma stack » en lien, un seul petit bouton « Visiter » ; les onglets restent dans le contenu (essai « barre toujours présente » refusé) ; barre d'action mobile en lecture. Sidebar dès 1 024 px : encart de notation, « Explorer autour de… », 3 outils « Souvent utilisé avec » d'autres domaines, partage/signalement en pied. Données : `npm run gen:tool-explore` (src/data/toolExplore, à relancer quand les stacks changent ; 327 outils couverts, les autres n'ont que le bouton Explorer). Refusés : bande récap en tête, sommaire à droite, sidebar trop chargée (stacks, domaines). Tarifs en colonnes (nom, prix + condition, apports ; repère « Prix retenu par ToolTrim » ; un seul lien « Tarifs officiels » + date en pied, info-bulle du titre retirée ; au-delà de 4 plans la colonne suivante dépasse pour inviter à faire défiler). Fraîcheur (2 oct., non poussé) : apparitions douces au défilement (sections, jauge de note) et couleur d'accent tirée du logo (`npm run gen:tool-accents`, 946 outils sur 1 348, les logos noirs ou gris restent neutres) sur le cadre du logo, les onglets actifs, les intitulés de section et le plan de référence. Séparateurs retirés : trait vertical de la colonne de droite, trait au-dessus de Partager/Signaler, cadre haut/bas de « À propos ». Pas encore poussé. À suivre : devise des fiches sans plan attesté (voir ci-dessous) ; défilement des plans à la souris peu naturel au-delà de 4 plans (flèches ?) ; exploration absente en mobile/tablette ; « Task management » en anglais sur une fiche FR ; catégorie « Organisation » non traduite en EN.
- [ ] **À vérifier : devise des cartes en anglais.** `tools_index.json` ne porte pas la devise native : sur une page EN, une carte d'outil tarifé en dollars (Notion, Obsidian) semble afficher l'euro. Vérifier le servi avant de corriger.

- [x] Fiche outil responsive (02/10/2026) : deux colonnes dès 1 181 px quand la barre latérale est réduite, vide de 134 px sous « Tarifs » en mobile supprimé, accord « 1 outil », icônes de la section IA alignées, FAQ avec repère + / −, cartes « Pour qui » adoucies
- [ ] Fiche mobile très longue (~11 300 px) : replier les sections secondaires (« Ce que comprend », « Résumé »), masquer « Les outils de X » quand il n'y a qu'un élément
- [ ] Fiche mobile : flèches ‹ › du carrousel d'alternatives inutiles au doigt (garder points et glissement)
- [ ] Fiche entre 1 181 et 1 350 px, barre dépliée : une colonne de ~970 px, limiter la largeur de lecture
- [x] Page Outils responsive (02/10/2026) : étiquettes techniques retirées des filtres, « À la une » et « Les plus recherchés » en 3 colonnes dès 860 px sinon carrousel, titre contextuel (« Création · 341 outils ») sans doublon, « Voir N outils » dans le panneau de filtres, fond de la barre collée réparé en mobile, cibles tactiles 40-44 px
- [ ] Page Outils : libellés d'usage encore en anglais dans l'interface française (« Creator Workflow », « Video Creation ») : traduire la taxonomie des tags fonctionnels
- [ ] Page Outils mobile : le catalogue complet n'arrive qu'après six étagères (~3 200 px) ; ajouter un raccourci « Tout le catalogue » sous les pastilles
- [ ] Page Outils mobile : la deuxième colonne des étagères coupe les noms en plein mot ; colonnes plus larges ou une seule colonne
- [x] US-NAV-01 navigation (02/10/2026) : barre du haut qui se replie au scroll, recherche toujours accessible et ⌘K branché, menu mobile à niveaux (préférences et « Soumettre » enfin accessibles en mobile), colonne réduite avec libellés, dépliable par-dessus le contenu de 641 à 1 180 px, « déplier » au survol (visible en tactile), pictos revus (grille, paquets, colonnes, ampoule, symbole de devise), infobulle qui passait sous le contenu corrigée
- [x] US-NAV-01 suite (02/10/2026) : « ‹ Parent » à la place du logo en mobile sur les pages profondes, onglets de fiche collants en mobile, barre du haut mobile réduite à deux zones (repère, trois actions identiques), mode sombre vérifié
- [ ] Accroches de 2 ou 3 mots : 92 outils sur 1 177 (le champ `editorial.tagline` de la recherche les apportera)
- [ ] Besoins « IA » et « Admin & Finance » ajoutés au catalogue sans validation explicite **[décision]** : les garder ?
- [ ] Pages catégorie d'un besoin à une seule catégorie (Content Creation, Automation, Analytics, AI) : la rangée de pilules est vide, seul le bouton Filtres reste
- [ ] Emplacements sponsorisés prêts (`catalogPlacements.ts`) mais aucun partenaire : à activer au premier contrat, avec l'étiquette « Sponsorisé »

## Technique

- [x] Poids du build (02/10/2026) : les deux logos étaient recopiés en data URI cinq fois par page (limite d'intégration de Vite) ; servis en fichiers : HTML 931 → 726 Mo, build 1 042 → 837 Mo. Le CSS du shell, lui, était déjà mutualisé
- [x] Test `alternativesCoverage.spec.ts` réparé le 02/10/2026 : 138 effets Maxon (Universe, Red Giant) classés par famille avec alternatives entre eux (`scripts/classify-maxon-effects.mjs`), 317 → 175 fiches sans voisin

- [ ] 4 erreurs TypeScript préexistantes dans `ToolDetailPage.tsx` (ToolSummary contre Tool, `category` possiblement indéfini)
- [ ] 7 erreurs TypeScript préexistantes dans `HomePageV2.tsx`
- [ ] Budget de fichiers du build à 12 900 : les variantes de CSS critique des pages catégorie en consomment une vingtaine
- [ ] Contenu des pages piliers persona dupliqué entre `PersonaPillarPage.tsx` et `vite.config.ts`

## Fait récemment

- 25/09/2026 `9b3f179f` : titres et descriptions des fiches unifiés (`toolSeo.ts`), titres des pages prix qui répondent, H1 des sous-pages
- 25/09/2026 `82b0ee6c` : pages catégorie alignées sur /tools, index A à Z, noindex des catégories minces, 57 couvertures bloquées
- 25/09/2026 `511c528b` : catalogue /tools (besoins, filtres, sponsoring), barres de filtres sur une ligne, 7 recatégorisations, 5 URL réparées

## Ma stack en tableau de bord (7 oct. 2026)
- Ordre validé (parcours) : hero inchangé, puis Recoupements (ce que je peux simplifier), puis Budget (anneau par domaine ou par outil, zoom local par domaine) puis Mes outils. Fil conducteur : combien je paie, et combien je paie en double. La question freemium se pose une fois (bandeau après le hero, fenêtre « Lesquels payez-vous ? », mémorisée par outil) ; les recoupements sont chiffrés (« ≈ X €/mois en double ») et triés par montant. Bandeau de bulles retiré. Commits locaux non poussés.
- E2E `catalogue refresh updates the same saved selection` échoue : il attend le prix Supabase sur la carte, or la carte lit désormais `nativePrices` attestés. Réécrire le test (constat, pas encore fait).
- Fait (7 oct.) : composants morts supprimés (`StackToolInspector`, `StackTelescope`, `StackUsageExplorer`, `StackBubblePeek`, `StackAreaBoard`, `StackAccountDialog`, `StackNeedsManagerDialog`, `StackSaveMenu`, `lib/stackBudget.ts` et son test) ; `AREA_COLORS` et `Territory` dans `lib/stackAreas.ts` ; 386 règles CSS `ms-` mortes retirées. Reste à voir : `useStackAccount` n'a peut-être plus d'appelant.
- CHANGELOG_AI à compléter pour toute la série Ma stack avant le push.

## Ma stack, recul produit (7 oct. 2026)
Constats :
- Seul `add_to_stack` est mesuré : on ne sait pas si la page est vue, si la feuille outil s'ouvre, si « Comparer » est cliqué, si la question freemium reçoit une réponse.
- Prix attestés (`nativePrices`) sur 375 outils sur 1 348 (28 %) : beaucoup de « Tarif non relevé », donc coût et « payé en double » partiels.
- Le coût suppose l'offre d'entrée, une place : faux pour une équipe ou un plan supérieur ; « payé en double » est un plafond.
- La boucle s'arrête à « Comparer » : rien pour dire « je remplace X par Y » ni voir l'économie.
- Stack seulement dans le navigateur : perdue en changeant d'appareil, impossible à partager (`useStackAccount` sans appelant).
Prochaines étapes proposées, dans l'ordre :
1. Mesurer (page vue, feuille ouverte, comparer, freemium répondu, retrait, remplacement) ; décider ensuite sur données.
2. Chiffre juste, volet produit fait (8 oct.) : « Ajuster mon coût » dans la feuille outil (plan du catalogue, places si par utilisateur, ou montant réellement payé, mensuel ou annuel) ; prime sur l'offre d'entrée, la note du budget compte les coûts ajustés. Plans du catalogue non vérifiés en image : Supabase injoignable depuis la machine ce jour-là, à recontrôler en ligne. Volet recherche : liste prioritaire `research/batches/prix-ma-stack-prioritaires-2026-10-08.txt` (257 outils cités dans les Stacks sans prix vérifié ; n8n à exclure), lancement à décider (crédit cloud).
3. Fait (7 oct.) : boucle fermée. « Décider » sur chaque paire (menu : garder l'un, garder les deux) et bandeau « Ma stack » sur les comparatifs (garder l'un, remplacer, garder). Annulable, « Déjà ≈ X €/mois en moins », paires gardées sorties du payé en double (« Revoir »). Événements : stack_tool_open, stack_compare_click, stack_profile_click, stack_decision, stack_decision_undo, stack_remove, stack_freemium_open, stack_freemium_answer. À relire dans GA4 vers le 21/10.
4. Garder et partager : lien de partage lecture seule (boucle d'acquisition), puis synchronisation par compte.

## Tests E2E désynchronisés (constat du 8 oct. 2026)
- `e2e/sidebar-preferences.spec.ts` (2 tests) : suppose un menu replié par défaut et cherche « Préférences » dans la barre ; le shell est déplié par défaut et « Préférences » n'est plus que dans le menu mobile. Non modifié depuis le 13 sept. À réécrire sur le comportement actuel.
- `e2e/mon-stack-v1.spec.ts` « catalogue refresh » : attend le prix Supabase sur la carte (voir plus haut).

## Footer et mentions légales (8 oct. 2026)
- [x] Mentions légales : forme juridique SAS (et non micro-entreprise), hébergeur Vercel (et non Lovable).
- [ ] Michael : les mentions LCEN complètes d'une SAS (dénomination, siège, capital, RCS, directeur de publication) restent à décider ; il ne veut pas les afficher pour l'instant.
- [ ] Michael : dire quels profils sociaux existent vraiment ; `sameAs` de `OrganizationSchema.tsx` en liste 5 non vérifiés.
- [ ] Tests lents en suite complète, proches de la limite de 5 s : `useToolBySlug.test.tsx` (restores the SSR record) et `usePosts.test.tsx` (local guide catalogue). Passent seuls.
- [x] Footer : « Gérer les cookies » rouvre le bandeau (retrait du consentement coupe la mesure GA4), bascule FR/EN, ligne de preuve (nombre d'outils calculé au build, arrondi à la centaine). Bandeau cookies traduit en anglais.
- [x] Footer : colonne Catégories (IA généraliste, Finance et facturation, Gestion de projet, Automatisation, CRM, toutes). À revoir avec les clics GSC vers le 21/10.

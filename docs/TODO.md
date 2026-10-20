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
- [x] Crowdfire marqué arrêté (le site annonce sa transformation en média), 5 alternatives ; StreamElements gratuit à vie selon l'éditeur, ancienne offre à 10 $ retirée (20/10).
- [ ] Stripe : commission en pourcentage impossible à saisir dans le schéma v2 ; ajouter un champ de taux (aussi Shopify Payments, aujourd'hui « sur devis »)
- [ ] Devises non gérées : Razorpay (INR), Skribble (CHF), Ownr (CAD)
- [ ] Afficher le champ `tagline` dans le catalogue (aujourd'hui `toolTaglines.ts`) et un badge « racheté / renommé » depuis `lifecycle`
- [ ] n8n : exclu de la recherche automatique (refonte dédiée)
- [ ] 638 outils sans impression Google : non planifiés

### Mesure d'audience et cookies (constat du 19/10/2026)
- Cause du « GA4 vide » depuis le 02/10 (`c7ff058d`) : sans clic sur « Accepter », GA4 reçoit des pings refusés (`gcs=G100`, vérifié en prod). GA4 ne les affiche pas dans ses rapports : ils ne servent qu'à la modélisation, qui exige au moins 1 000 utilisateurs consentants par jour. Seuls les visiteurs qui acceptent apparaissent. Vercel compte tout le monde, sans cookie.
- Le bandeau est discret (bas à droite, non bloquant), son texte est confus (« reçoit des signaux même si vous refusez ») : peu de visiteurs cliquent.
- Mode avancé (pings envoyés à Google avant consentement) fragile au regard de la CNIL : GA4 n'est pas exemptable.
- Code maison complexe : `window.name`, minuteur 60 s, rechargement au refus.
- Le tag `G-DL5MJKQ3JE` envoie aussi vers `G-PQPPPH19MH` (configuré dans l'admin GA) : vérifier quelle propriété on consulte.
- [x] Bandeau remplacé par CookieConsent v3 (open source, auto-hébergé) le 19/10/2026 : barre en bas, Accepter / Refuser au même poids, préférences en pied de page, choix gardé six mois dans le cookie `tooltrim_consent`, anciens choix datés repris. Michael garde le mode avancé de Consent Mode.
- [ ] Vers le 02/11 : comparer dans GA4 les utilisateurs par jour à ceux de Vercel pour mesurer le taux d'acceptation du nouveau bandeau
- [ ] Prendre Vercel Analytics comme compteur du trafic total ; GA4 sert au comportement des visiteurs consentants
- [x] DataFast retiré le 19/10/2026 (ne fonctionnait plus) : script, CSP, politique de confidentialité, tests

### Mesure SEO
- [ ] Entre le 9 et le 23/10/2026 : comparer un nouvel export Search Console non filtré sur les requêtes visées par le commit `9b3f179f` (nordpass pricing, is dependabot free, mongodb atlas prix, motion bro free, lightroom pricing, capture one price, enscape pricing)

## SEO

- [ ] Pages alternatives vides ou hors sujet : 814 outils sans `alternatives` (Freshservice n'en cite aucune, ESLint renvoie vers ACF ou Appsmith). Couvert en partie par la recherche cloud.
- [ ] Pages prix minces : un bloc de tarifs puis « Et maintenant ? ». À enrichir avec la grille complète issue de la recherche.
- [ ] Titres et meta descriptions rédigés des fiches (20/10) : 4 pages × 2 langues par fiche, jetons {price} {verified} {rating}, outils dans `scripts/seo-meta/`, ordre par impressions GSC. 615 fiches faites sur 1 247 (n8n exclu, chantier dédié) ; mesurer le CTR GSC par moitié 3 semaines après.
- [ ] Prix à revérifier, la grille contredit le texte de la fiche : Postman (grille 9 $, texte 11 $), Sprout Social (79 $ contre 99 $ en mensuel), ElevenLabs (grille 5 $, texte 6 $), Octane Render (19,99 € contre 23,95 €), Reflect (10 $ contre 12 $), Xero (hausse annoncée au 1er octobre 2026), Riverside (24 $ contre 29 $), Udio (8 $ contre 10 $), Firecrawl (16 $ contre 19 $) : vérifier annuel ou mensuel. EmberGen : licence perpétuelle à 300 $ rangée comme prix mensuel, le titre de modèle annonce « /mo ».
- [ ] WeTransfer : grille à 7 € alors que la fiche indique un Starter passé à 8 € ; revérifier la page officielle.
- [ ] Indicateur « gratuit » faux (relevé pendant la rédaction des metas, 20/10) : free=false alors que l'outil est gratuit ou open source pour Chrome DevTools, p5.js, Playwright, Prettier, OpenCutList, Burp Suite (Community), LanguageTool, Genially, GrabCAD, FontBase, Vitest, FastAPI, PureRef, React Native, Three.js, Babylon.js, Algolia, Contentful, UptimeRobot, Kling, Node.js, Strapi, Tailwind CSS, Curviloft, Grafana, VoiceOver, Poetry, Pabbly Connect, The Design Futurist, Bloc, Lunatask, Pytest, Radix UI, Adobe Express, Advanced Custom Fields, Airbyte, Appsmith, Auth.js, Avaaatars, AWeber, Axe DevTools, Bear, Better Stack, CapCut, Capsule, Cavalry, Celery, Chromatic, Client-First, Craft ; Gumloop, ActiveCampaign et Breezy HR sont free=true alors que la fiche dit qu'il n'y a pas d'offre gratuite permanente ; Meltwater affiche un Starter à 438 € alors que la fiche le dit entièrement sur devis. Les metas évitent le mot « gratuit » en attendant.
- [ ] Fiches incohérentes entre elles (20/10) : Sweep (description carbone/ESG, avantages paiements et notes de frais), PipelinePRO (description pipeline commercial, keepIf studio d'animation/VFX, « sur devis » alors que la grille donne Cloud à 25 €), Cision (Entry à 525,60 € dans la grille, fiche « sur devis uniquement »), Campaigner (plan « Free » mais « No free plan »), Claude (description et keepIf orientés API, plan retenu Pro des applis, free=false alors que les applis ont un gratuit).
- [ ] Cudekai **[décision]** (20/10) : keepIf vise l'« humanisation » de textes IA pour des rendus académiques et les avantages vantent le contournement de Turnitin et GPTZero. Angle à revoir ou fiche à retirer ; les metas rédigées restent neutres et signalent le risque.
- [ ] 689 `seo.metaDescription` rédigées mais jamais utilisées (français seulement, qualité inégale) **[décision]** : les brancher, les réécrire ou les supprimer
- [x] Pilote des pages par intention (02/10/2026) : 5 comparatifs sous /guide/ (plugins After Effects, gestion de projet freelance, second cerveau, moteurs de rendu 3D avec angle IA, hébergement cloud), classés sur la note ToolTrim, prix réels sans conversion, encadré « L'avis ToolTrim ». Config `src/data/bestOfGuides.json`
- [ ] Pages par intention : mesurer les impressions 3 à 4 semaines après la mise en ligne, puis élargir à 20-30 pages (temps réel pour l'architecture, facturation à rattacher au guide existant, notes avec Evernote/OneNote une fois au catalogue)
- [ ] Slugs français dans les URL anglaises des catégories (`/en/category/gestion-projet`), à traiter avec les pages par intention (301)
- [ ] `x-default` des pages piliers persona pointe vers le français, contraire à « anglais d'abord »
- [ ] Maillage vers les sous-pages prix et alternatives depuis fiches, comparatifs et catégories
- [x] Audit guides et stacks (19/10/2026, HTML servi à Googlebot + GSC du 18/07 au 17/10) : stacks 1 clic / 350 impressions, guides 20 clics / 5 500 impressions. Livré le 19/10 (branche `seo/guides-stacks-2026-10`) :
  - Maillage : bloc « Stacks » sur la fiche outil (212 stacks sur 212 liées depuis au moins une fiche, `src/data/tool_stacks_index.json`), « Les guides pour choisir » sur 182 stacks, « Les stacks qui les utilisent » sur les guides, « Autres stacks » choisies par outils partagés (stacks sans lien entrant venant d'une autre stack : 188 → 20).
  - Données structurées au prérendu : BreadcrumbList et ItemList sur les 424 stacks, les 5 comparatifs « meilleurs outils » et les 10 piliers persona.
  - Titres des stacks (`src/lib/stackSeo.ts`, partagé prérendu/client) : « Stack X : meilleurs outils et budget 2026 » / « X stack: best tools and budget (2026) » ; descriptions FR sans la phrase de remplissage (> 160 car. : 171 → 38) ; H1 complet quand l'accroche éditoriale n'est qu'un profil ; sigles corrigés (« Stack RH », « Stack IA »).
  - 456 rôles d'outils restés en français dans les pages anglaises traduits.
  - 20 guides anglais renommés avec slug anglais, 301 dans les deux langues (`vercel.json`), tables FR/EN des trois fichiers à jour.
  - Guide Loom : prix revérifiés le 19/10 (Business + AI à 24 $/mois en mensuel), titre et description sur « loom pricing », « is loom free » ; guide court Loom relié au guide complet (FR et EN). Pas de cannibalisation avec `/tool/loom/pricing`, absente de ces requêtes.
  - Guide alternatives Notion : liens vers les fiches Obsidian, Logseq, Notion.
  - `/ma-stack` et `/my-stack` en noindex, follow.
  - 96 emplacements de stacks pointaient vers 27 fiches retirées le 02/10 (`descript`, `topaz-video`, `capcut-ai`…), affichées en slug brut sans lien : 79 remplacés par la fiche de destination de la 301, 17 retirés car l'outil cible était déjà dans la stack ; un HubSpot en double retiré.
  - Index guides ↔ outils : les articles anglais à slug français qui redirigent ne sont plus liés.
- [ ] Mesurer l'effet sur GSC entre le 9 et le 23/11/2026 : impressions des stacks (base 350 sur 3 mois), position du guide Loom (base 48-54), « notion alternative freelancer » (base 6).
- [ ] Slugs anglais des stacks (136 URL `/en/stacks/` à slug français) : reporté le 19/10. Coût élevé (20 constructions d'URL, routage, hreflang, sitemap, ~270 redirections), slugs générés trop génériques (`/en/stacks/seo`), et le seul slug visible (`consultant-seo-editorial`, pos. 9) y perdrait. À rouvrir si les titres ne suffisent pas.
- [ ] **[décision]** Guides courts sur la même intention que des guides complets : `pourquoi-payer-loom` / `why-pay-for-loom` (180 à 290 mots) contre `loom-prix-alternatives`, `canva-pro-rentable` (250 mots). Fusionner en 301 ou étoffer.
- [ ] Guides sans aucune fiche liée : `stack-minimaliste-freelance-2026`, `auditer-stack-saas-45-minutes`, `stack-redactrice-freelance`, les portraits. Ajouter `toolId`/tags ou des liens dans le texte.
- [ ] Guides datés par leur titre : `claude-opus-4-6-guide-complet-freelances` (slug EN déjà neutre : `claude-opus-guide-freelancers`), `claude-sonnet-4-6-vs-...-fevrier-2026`.
- [ ] Table `posts` de Supabase : porte encore les anciens slugs anglais des 20 guides renommés et l'ancien texte du guide Loom. Sans effet tant que `VITE_CATALOG_READ_SOURCE` n'est pas `supabase` (vérifié en production le 19/10 : aucun appel), à réinjecter avant de le rebrancher.
- [ ] Anytype, Capacities et Tana cités dans le guide alternatives Notion mais absents du catalogue.

### Audit SEO du site complet (19/10/2026, 4 agents : CTR, technique, maillage, contenu)
Base saine (397 URL live : 200, canonical, H1, hreflang réciproque, JSON-LD valide). Les pertes viennent des prix affichés, des gabarits de titre et du maillage. Attention : la fenêtre GSC (18/07-17/10) est surtout antérieure au gabarit du 25/09, à relire sur 26/09-23/10.
- [x] **P0 Prix faux servis à Google** (19/10) : 42 surcharges `seo.*` contraires à la grille retirées (ZBrush, Cinema 4D, Maxon One, Redshift, Red Giant en € pour des plans en $ ; GitLens « $10 » contre 8 €), le gabarit les remplace ; garde-fou `src/test/seo/seoOverridePrices.spec.ts` ; FAQ Maxon en devise du plan (`toolFaq.ts`) ; Logic Pro : grille vérifiée sur apple.com (199,99 $ achat unique, Apple Creator Studio 12,99 $/mois) ; Jest : open source MIT, plus de « Paid plan » ; licence unique lue sur le plan de référence (TouchDesigner « $600 one-time »).
- [x] « Gratuit » réservé aux cas confirmés (`hasConfirmedFreeTier`, `isPlaceholderPricingText` dans `src/lib/pricing.ts`) : titres, descriptions, FAQ visible, FAQ JSON-LD du prérendu et bloc tarifs n'utilisent plus les textes génériques (« Gratuit ou open source selon usage » ×104…) ; « Prix vérifié par ToolTrim » seulement avec une date de vérification.
- [x] 66 fiches à prix générique « N €/mois pour version Pro » / « Version payante disponible » (Salesforce « 15 € »…) : prix et phrases de prix retirés (19/10), puis recherche sur pages officielles (20/10) : 37 grilles vérifiées, 16 « sur devis », 2 arrêtés (ResponseTap, BoomPop), 5 en texte seul (Ownr en CAD, Razorpay à la commission, MASV au Go, Moosend devise non lue, Katana). Restent sans prix : Pipedrive (page bloquée par Cloudflare), Omniconvert (calculateur), vcita (deux prix contradictoires sur la page), Leadflow et Liquid Web Partner (identité de la fiche à vérifier), Crowdfire (pivot, décision en attente).
- [x] MongoDB Atlas (20/10) : grille officielle ; le 8 $/mois de Flex est le calcul publié par MongoDB sur 30 jours, dit comme tel, plafond 30 $/mois.
- [x] **P0 NordPass** (20/10) : grille officielle relevée (Premium 1,39 €/$ par mois en tarif promotionnel sur 2 ans payés d'avance, renouvellement non affiché, signalé en mise en garde), offre gratuite décrite ; plus de « ne publie pas de grille ».
- [x] **Magnific** (20/10) : la page officielle (« Magnific, formerly Freepik ») n'affiche que des euros : Premium 12 €/mois en annuel ou 16 € en mensuel, Premium+ 27/36 €, Pro Starter 66/88 € HT, facturation en crédits. L'ancienne grille en $ avec « offre de lancement à 7,25 $ » était fausse. Fiche réécrite (ex-Freepik, coût en crédits par action, MCP/ComfyUI/API), titre et meta dédiés, FAQ prix « dépend-il de l'usage ? ». Le doublon masqué `magnific-ai` (redirigé en 308) sortait encore dans le pilote prix et dans les alternatives de Krea, Figma Weave et Topaz Gigapixel : repointé vers `magnific`.
- [ ] Magnific : aucun prix en dollars vérifié (pas de sélecteur de devise) ; offre gratuite citée par des sites tiers (environ 20 images par jour) absente de la grille officielle, à confirmer depuis un compte gratuit ; palier Pro Starter 4 M de crédits non relevé ; onglet Équipes non relevé.
- [x] P1 Gabarit `toolSeo.ts` (19/10) : prix exact sans arrondi, licence unique avec son prix, descriptions plafonnées à 155 car. (variantes sans extrait puis sans plan, jamais de mot coupé), plus de parenthèses imbriquées dans le nom du plan. Le titre de fiche donnait déjà le prix quand il est connu.
- [x] P1 BreadcrumbList des fiches : slug public de la catégorie au lieu de l'id (19/10). Reste ouvert : fil d'Ariane visible non rendu au prérendu.
- [x] P1 Alternatives hors sujet (19/10) : la cause était la donnée, pas le tri. 53 outils de dev partageaient le besoin et le groupe de substitution fourre-tout `nocode-web` (Jest, ESLint, Postman, Strapi, ACF…) ; reclassés en 14 groupes réels (`code-testing`, `api-client`, `headless-cms`, `wordpress-building`…). Leur catégorie reste `nocode-web`, à revoir.
- [x] P2 Pilote sous-pages prix (20/10) : 20 fiches (`PRICING_DETAIL_PILOT`, `src/lib/toolPricingDetail.ts`) reçoivent une phrase-réponse, un coût par sièges calculé sur le prix publié et une FAQ tarifaire (FAQPage au prérendu), tirés de la grille vérifiée seulement. Mesurer avant d'étendre.
- [x] P2 `/explorer/around/*` en noindex, follow et hors sitemap (20/10).
- [x] P2 Catégories en noindex, follow (`CATEGORY_PAGES_INDEXED = false`, `src/lib/categorySeo.ts`, 20/10). Refonte à faire pour celles qui porteront un « meilleurs outils » (slugs EN, critères, top 5).
- [ ] P2 Alternatives : noindex sous 3 alternatives de même fonction ; ajouter tableau et « pourquoi partir de X ». Outils absents cités par toute la SERP : Proton Pass, Keeper, AEJuice, Wouter, Auth0, Kinde.
- [ ] P2 Maillage : fait le 20/10 pour les sous-pages prix et alternatives (liens vers les mêmes sous-pages des 5 premières alternatives, ancre « X pricing ») ; reste : guides persona orphelins et absents de `/guides` ; 96 pages inatteignables (9 outils B2B liés seulement par des catégories en noindex) ; 917 pages à plus de 3 clics.
- [x] P2 `llms-full.txt` : ne liste plus que les outils du sitemap (1 245 au lieu de 1 354, 218 URL non canoniques retirées), 20/10.
- [ ] P3 Comparatifs (médiane 361 mots, prix du 13/03, 1 FAQ) : prix depuis `pricing_v5`, tableau, 4 à 6 FAQ, liens depuis les deux fiches. `lastmod` du sitemap = date du build sur 13 090 URL. CSS 1,09 Mo et JS 661 Ko bruts.
- [ ] P3 Pages « meilleurs outils » : gestionnaires de mots de passe publiée le 20/10 (NordPass, 1Password, Bitwarden, Dashlane, LastPass ; Bitwarden et LastPass sans note ToolTrim, à noter sur preuve). Proton Pass et Keeper ajoutés le 20/10 (grilles officielles $ et €, sans note ToolTrim faute de preuve d'usage). Éditeurs RAW, sites portfolio et sculpture 3D publiées le 20/10. Suivantes : plugins Premiere/color grading, nettoyage audio IA, extensions VS Code, upscalers IA, projection mapping, authentification SaaS (FR).

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
- [ ] Dépôt local déplacé le 20/10/2026 vers `/Users/mike/toolstack-wizard-clean` : iCloud avait vidé (dataless) des fichiers et objets git de l'ancien dossier `~/Documents/toolstack-wizard-clean`, ce qui figeait git et les builds. Ne plus travailler dans `~/Documents`. À reconstituer : 3 fichiers du skill `.claude/skills/seo-brief-generator` (`README.md`, `reference/voice-tone.md`, `reference/brand-positioning.md`) et les skills `.agents/skills` (réinstallables via `skills-lock.json`)

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
- [x] Footer refait sur une grille de 12 colonnes (8 oct.) : carte « Ma stack » (outils, coût, payé en double) lue depuis un instantané écrit par Ma stack, sélecteur FR | EN, badges en cellules uniformes (2 rangées de 10).
- [x] Revue design du footer (design-review, 8 oct.) : trois tons (#0F0F0F, #424245, #6F6F68), tokens `--tt-footer-*`, tuile neutre blanche décorative et prérendue vide (budget HTML : le footer est répété sur 13 162 pages, 12,8 Ko chacune).
- [x] Budget HTML : badges ramenés à une image chacun (variantes sombres jamais affichées), footer 12,8 → 8,4 Ko par page, HTML 760 → 705 Mo (limite 745). Badges gardés dans le HTML prérendu, car les annuaires vérifient leur présence.

## Accueil, revue design (8 oct. 2026)
- [x] Gouttière alignée sur le site (48px au lieu de 32), recherche alignée à gauche, liens « Tout voir » sur la ligne de base du titre, compteurs des univers au bord, onglets « Travailler avec » au style de Ma stack, titres de cartes alignés, cibles de 24px, mobile raccourci (8 482 → 6 671px).
- [x] CTA unifié : « Construire ma stack » (hero et footer).
- Décision Michael (8 oct.) : le hero garde son image en dégradé avec logos, par exception aux règles « pas de gradient » et « pas de grands logos ».
- [ ] « Les outils qu'on surveille » : les visuels sont les images OG des éditeurs (texte anglais sur la page FR, collages chargés). Choisir des captures d'interface recadrées ou passer au format liste des univers.
- [x] Bloc « Trouvez le bon outil » retiré de l'accueil (9 oct., Michael) : doublon de la recherche permanente (barre du haut, loupe mobile, barre latérale) ; il n'était pas mesuré dans GA4.
- [ ] Tutoiement dans 169 lignes de src/data/stacks.ts (subtitle, q, hint, reason, avoidIf) : le site vouvoie partout ailleurs. La stack automatisation-legere-freelance est passée au vous (9 oct.). Chantier éditorial à planifier.
- [x] « Compatible avec » retiré de l'accueil (9 oct.) : données de compatibilité insuffisantes (seuls After Effects et React). Remplacé par « Lequel garder ? », 8 comparatifs existants en rangée. Compléter worksWith dans Supabase reste utile pour les pages explorer.
- [ ] Noms de catégories en anglais ou en Title Case dans les données (« Legal & Contracts », « Communication Équipe », « IA Généraliste ») : à corriger dans Supabase, pas dans le JSON.

## Navigation, revue design (9 oct. 2026)
Mesures Playwright à 1440, 1024 et 390 px. Tout appliqué le 9 oct. (« go sur tout »), non commité.
- [x] P1 Bandeau cookies sous les dialogues : menu mobile et recherche à z-index 1100 (la recherche, à 200, passait aussi sous la colonne tablette ouverte) ; sur mobile le bandeau se pose au-dessus de la barre du bas
- [x] P1 Barre repliée : page active plus marquée (pastille plus sombre, libellé en 650), survol plus léger
- [x] P1 Onglets du haut supprimés ; filtre « Payant » devenu « Payant uniquement » (sans plan gratuit, `isPaidOnly`)
- [x] P2 Recherche : loupe de la barre latérale retirée ; « Ctrl K » hors Mac
- [x] P2 Haut de page aligné sur le conteneur des pages (`--layout-content`, `--layout-gutter`)
- [x] P2 « Déplier » : déjà visible au survol de toute la barre, au focus et en permanence sur écran tactile (constat initial erroné)
- [x] P2 Menu mobile : ne garde que Outils et Guides (sous-niveaux), préférences et « Soumettre »
- [x] P2 « Ma stack » : bouton à contour partout
- [x] P3 Libellés sous icône en 11 px ; icônes par zone : 16 en haut, 18 dans la barre, 20 sur mobile (prop `size`, plus de style inline)
- [x] P3 Infobulles des réglages = l'action (« Passer en anglais », « Changer de devise ») ; plus de valeur « EN » cachée
- [x] P3 CSS `asv2-*` : 59 déclarations écrasées supprimées, 0 différence de style calculé sur 18 états
- [x] Barre repliée : au survol, le picto « déplier » se plaçait 16 px au-dessus du logo (`top: 0` d'une règle du 8 oct.) ; centré sur le logo, avec fondu croisé et mise à l'échelle en 160 ms (coupé si mouvement réduit)
- [x] Accueil : le champ de recherche (36 px, contour, loupe en tête) remplace le vide laissé par les onglets, aligné sur le contenu
- [x] Colonne imposée 641 à 1 180 px : double pastille sur l'entrée active supprimée
- [x] Recherche globale refaite : une colonne de 720 px ; avant la frappe « Essayez », « Par besoin », « Lequel garder ? », « Partir d'une stack », « Reprendre votre stack » ; pendant la frappe, résultats groupés par type ; plus de « Plateformes », « Fonctionne avec », « Collections »
- [x] Revue design de la recherche (9 oct.) : liste de résultats conforme ARIA (axe 0), nombre de résultats annoncé, piège de focus réparé (`[href]` attrapait les `<use href>` du sprite, aussi dans `StackSaveDialog`), « notion » ne tire plus Motion (faute tolérée seulement en second recours), tokens d'espacement et de typo, cibles de 44 px sur mobile, sortie animée
- [x] Ma stack : valeurs en mots (« Cost unknown », « Rien ») ne débordent plus ; carte « Doublons » à zéro = « ✓ Aucun » + « Aucun outil ne fait doublon », jauges vides masquées
- [ ] Recherche : « appointment scheduling » ne renvoie rien en anglais (« booking » trouve Calendly) ; « alternative à Notion » met Notionlytics en tête
- [ ] Reste : la fiche outil a son propre conteneur (`td-hero`), décalé de 16 px du haut de page à 1440 px
- [ ] Reste : les règles « colonne réduite » sont écrites deux fois (réduite à la main, imposée de 641 à 1 180 px) ; les fusionner demande une classe posée en JS, au prix d'un saut au premier affichage
- [ ] Reste : `e2e/sidebar-preferences.spec.ts` déjà désynchronisé avant cette passe (textes « Préférences », « Passer le site en anglais »)

## Mode sombre, revue design (10 oct. 2026)
16 pages × 1440 et 390 px, axe + captures. Corrigé le 10 oct. : environ 400 échecs de contraste → 0 sur toutes les pages, desktop et mobile.
- [x] P0 Footer : variante sombre de ses jetons `--tt-footer-*`
- [x] P0 Accueil : `--h-ink` suit `--color-text-strong`
- [x] P0 Hero : jetons clairs rétablis dans `.hv2-band` (le dégradé reste clair)
- [x] P0 Comparatif : pastilles prix et note sur fond sombre translucide
- [x] P0 Couvertures de guides : légende sombre fixe sur les tuiles pastel
- [x] P1 Ma stack : valeur en mots passe à la ligne ; nouveau jeton `--color-alert` (#BE490A clair, #F0874A sombre) pour l'orange des doublons
- [x] P1 Liens bleus de /submit éclaircis en sombre, « Trier » en `--color-text-meta`
- [x] P2 Petits textes (conditions de prix, pièges de facturation, compteurs, langue du footer) en `--color-text-secondary`
- [ ] Non retenu : les boutons ronds blancs au survol des cartes outils restent blancs (ils flottent sur l'image, contraste correct dans les deux thèmes)

## Recherche, esprit Apple (14 oct. 2026)
- [x] Une seule grille de deux colonnes, lignes de 40 px, icône à x = 33 et libellé à x = 77, alignés sur la loupe et le texte du champ
- [x] Gris neutres (#F5F5F7) au lieu du gris chaud ; bouton fermer rond gris plein ; champ rempli de 52 px, texte 19 px
- [x] Retirés : « Reprendre votre stack » (doublon du bouton Ma stack, pas une intention de recherche) et l'exemple « ChatGPT vs Claude » (doublon du duel)
- [x] Deux logos par ligne partout, espace de 13 px avant le libellé
- [x] Logos en mode sombre : plaque claire sur chaque logo chargé ; 23 logos illisibles sur 400 → 0
- [x] Recherches récentes (4, sans doublon, navigateur seulement) à la place de « Essayez » dès qu'on a cherché ; « Effacer » rend les exemples

- [ ] /submit (14/10) : passer les emails de prospection sur `/en/submit?tool={{tool}}&site={{domain}}`, puis comparer `submit_priority_checkout` lien perso vs lien nu sur 2 à 3 semaines. Voir docs/SUBMIT_REDESIGN_2026-10-14.md.
- [ ] /submit (14/10) : en local (localhost/127.0.0.1), le formulaire appelle les API de production (submission-progress, contact, verify-*). Tester l'étape 1 en local peut envoyer de vrais emails. Prévoir un mode test local (stub ou API de preview) avant de nouveaux essais du tunnel.
- [ ] /submit (14/10) : la page vend désormais une « mise en avant home page et stacks, signalée comme sponsorisée ». Avant la première vente : prévoir un emplacement visiblement étiqueté « Sponsorisé » (home, stacks, comparatifs et articles), séparé des recommandations éditoriales, et des liens en rel="sponsored". Sinon la promesse « le classement ne dépend jamais du paiement » devient fausse.
- [ ] Fiches outils (15/10) : 342 fiches EN ne déclarent plus de prix dans le JSON-LD (elles annonçaient « 0 € » sur des outils payants). Saisir les vrais prix publiés (pricing_v5 avec nativeAmount/nativeCurrency ou nativePrices.ts), en commençant par les 80 prix connus mal saisis ; CommuteBar = 6,99 $ licence à vie. Chaque prix saisi rend la fiche à nouveau éligible au résultat enrichi.
- [ ] Fiches FR (15/10) : choix « tutoiement partout ». 684 fiches ont leur verdict (keepIf/avoidIf/threshold) au vouvoiement dans tools_v4.json. La carte de verdict utilise des libellés neutres (« À garder si / À éviter si ») en attendant la réécriture au tutoiement. Fiche Notion : verdict.threshold EN affiche des EUR (règle devise) et n'est pas un verdict « pour qui » : à réécrire.

## Fiche outil : contenu des cartes d'alternatives (constat 15/10/2026)
- Les cartes « Alternatives » affichent la description générique de l'outil (« Asana est un outil de gestion de projets… »), pas la raison de le choisir à la place de l'outil de la page. Écrire une phrase « pourquoi basculer » par paire (le champ `betterAlternative` n'existe que pour une paire par fiche).
- Libellés de fonctionnalités : plusieurs fiches réutilisent la même icône pour des fonctions différentes (Figma : Logos, Prototypage, Design UI ; Notion : coche pour Collaboration). Compléter la table d'icônes.
- Textes d'offres (`featureHighlights`) : les écrire directement en courtes listes ; le découpage automatique ne peut pas tout corriger (« Inclut A, B, C » perd son verbe).

## Explorer : libellés des besoins (constat 16/10/2026)
- Les raisons des cartes Explorer hors pilote ne s'affichent que si l'usage partagé a un libellé FR/EN validé (`LABEL_OVERRIDES`, src/lib/featureLabels.ts). Pixieset (galerie-client, livraison-client, vente-prints) n'en a aucun : 0 raison sur 32 cartes. Ajouter les libellés des besoins les plus fréquents pour rendre ces pages précises.

## Catalogue : accents manquants dans les descriptions courtes (constat 16/10/2026)
- Vues sur l'Explorer autour d'Adobe Photoshop : Affinity Photo « Editeur … developpement RAW … entierement gratuit ». Corriger dans Supabase (source de vérité), puis regénérer le JSON ; ne pas éditer le JSON à la main.
- Ideogram : l'image OG stockée est une page « Performing security verification » (Cloudflare) et non une capture du produit. À remplacer dans le catalogue (constat 16/10/2026, Explorer autour d'Adobe Photoshop).

## Registre des prix (src/data/pricing_truth.csv), constat 16/10/2026
- Le registre du dépôt est la source des prix attestés indépendante de Supabase (fiche outil pour les lignes mensuelles, Ma stack pour toutes les périodes). Test de garde : src/test/ma-stack/pricingRegister.test.ts. Après ajout : `node scripts/gen-native-prices.mjs`.
- Ajoutés le 16/10 : Granola (14 $/utilisateur/mois), ShotDeck (12,95 $/mois), Pixelmator Pro (49,99 $ achat unique), vcita (35 $/mois facturé annuellement, 420 $/an).
- vcita : la fiche catalogue dit « Gratuit : toutes les fonctionnalités », la page officielle ne propose qu'un essai de 14 jours. À corriger.
- Restent sans prix attesté : Adobe Stock (seulement des prix en euros géolocalisés, 29,99 €/mois avec engagement annuel) et Squarespace (euros géolocalisés + promotion -50 %). Relever le prix en dollars depuis une page US avant d'ajouter.

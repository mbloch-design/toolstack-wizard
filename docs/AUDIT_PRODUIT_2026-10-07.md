# Audit ToolTrim — 7 octobre 2026

La priorité est la fiabilité des décisions tarifaires. Les parcours testés permettent d’ajouter, consulter et retirer des outils, mais certains affichages donnent un coût ou une économie trompeurs. Corriger ces états avant d’enrichir les recommandations.

## Périmètre et méthode

- État local au commit `36fdbb549bbcf80c095cdeab8a20e1aeca2a6f8d`, avec les changements préexistants du dossier conservés.
- 11 routes contrôlées à 1440 et 390 px : accueil FR, catalogue FR, fiche Figma FR/EN, prix Figma FR, comparatifs ChatGPT/Claude et Notion/Airtable FR, Ma Stack FR/EN, Explorer autour de ChatGPT FR, guides FR.
- Lecture des conventions, des composants, des données et des calculs ; captures, erreurs JavaScript et réponses HTTP en navigateur Chromium.
- Le serveur Vite habituel démarrait sans répondre à une requête HTTP sous huit secondes. Un serveur temporaire sur 5198 a servi les mêmes sources avec React, les deux alias réels et les fichiers publics. Il ne valide pas les plugins de build, le prérendu, les en-têtes de production ou le déploiement.
- Les reproductions ciblées utilisent un navigateur isolé, des sélections fictives et le catalogue local, avec requêtes Supabase bloquées. Elles prouvent le comportement du fallback ; les données distantes peuvent différer.
- Aucun changement du code applicatif, aucune migration, aucun commit ni déploiement. Seuls ce rapport et son dossier de preuves ont été ajoutés.

Les constats suivants portent sur des incohérences internes reproduites. Les prix et capacités actuels des éditeurs n’ont pas été revérifiés sur leurs sites officiels.

## Constats prioritaires

### 1. P1 — Un achat unique devient un abonnement dans le comparateur

**Reproduction :** ouvrir `/fr/comparatif/ableton-live-vs-logic-pro` avec le catalogue local. Le descriptif Ableton annonce une licence à vie, mais la carte Tarifs affiche **99 $US/mois**, avec `one_time` dans la ligne de plan.

**Cause :** `src/components/compare/ComparisonDecisionPage.tsx:208` distingue seulement annuel et « tout le reste = mensuel ». Un plan à achat unique tombe dans le second cas.

**Impact :** la personne peut croire qu’un coût ponctuel revient chaque mois.

**Correction attendue :** respecter explicitement la période du plan, y compris l’achat unique et les périodes absentes ; traduire l’unité technique.

**Acceptation :** la même route affiche « 99 $US, achat unique » selon le plan enregistré ; aucun `/mois` pour une licence ponctuelle, en FR comme en EN. Les plans annuels et mensuels gardent leur période.

Preuves : [capture](../output/tooltrim-audit-2026-10-07/one-time-comparison.png), [texte rendu](../output/tooltrim-audit-2026-10-07/one-time-case.json).

### 2. P1 — Zéro coût mensuel est interprété comme un plan gratuit dans les comparatifs automatiques

**Reproduction :** sur la même route, le tableau « Coût réel » annonce **Plan gratuit possible selon volume** pour Ableton Live. Le catalogue dit pourtant « Pas de plan gratuit permanent, essai de 90 jours ». Logic Pro est affiché « Gratuit » alors que son verdict parle d’un achat unique côté Mac.

**Cause :** `src/pages/ComparePage.tsx:1869` traite un montant mensuel nul comme un signal de gratuité lorsque le prix n’est pas marqué confidentiel. D’autres branches du fallback font la même assimilation (`priceSentence`, notes tarifaires). La carte du comparateur réutilise également un libellé de prix à contrôler.

**Impact :** une licence ponctuelle, une donnée absente et une vraie offre gratuite deviennent difficiles à distinguer. Le noindex des comparatifs automatiques n’empêche pas leur consultation depuis Ma Stack.

**Correction attendue :** dériver séparément gratuité attestée, essai, achat unique, devis et prix inconnu ; contrôler tous les blocs tarifaires, pas seulement la grande carte.

**Acceptation :** cette route ne présente plus de plan gratuit sur la seule base de `compareMonthlyPrice = 0` ; un essai reste un essai, un prix inconnu reste inconnu.

Preuves : mêmes capture et texte que le constat 1.

### 3. P1 — Ma Stack annonce « Gratuit » pour un outil sur devis

**Reproduction :** enregistrer une stack contenant uniquement `adp-workforce`, puis ouvrir `/fr/ma-stack`. Le hero affiche **Coût mensuel : Gratuit / rien de payant**. Plus bas, le budget précise **1 sans prix relevé** ; le catalogue contient « Sur devis / prix non public ».

**Cause :** `src/pages/CartPage.tsx:248` affiche « Gratuit » dès que `stackCost.paid` vaut zéro, sans tenir compte de `stackCost.unknown`. Le titre du bloc budget utilise aussi l’absence de montant comme absence de paiement.

**Impact :** le résumé principal contredit le détail et promet une gratuité que le catalogue ne prouve pas.

**Correction attendue :** un état « Coût non renseigné » pour une stack sans montant exploitable ; un total explicitement partiel lorsque des montants connus coexistent avec des inconnus.

**Acceptation :** une stack avec seulement ADP ne dit plus « Gratuit » ou « rien de payant » ; une stack réellement gratuite conserve ce libellé. Ne pas modifier la règle déjà choisie des freemium comptés gratuits jusqu’à déclaration.

Preuves : [capture](../output/tooltrim-audit-2026-10-07/unknown-price.png), [reproduction](../output/tooltrim-audit-2026-10-07/cases.json).

### 4. P1 — Les économies enregistrées changent de symbole sans conversion

**Reproduction :** stack Figma + Canva, les deux déclarés payants, devise EUR ; décider de garder Figma. L’interface affiche **Déjà ≈ 9 €/mois en moins**. Choisir USD puis recharger : **Déjà ≈ 9 $US/mois en moins**.

**Cause :** `src/hooks/useStackDecisions.ts:20` persiste `saving: 9.17` sans devise. `src/components/stack/StackOverlapPairs.tsx:93` additionne ces montants et les formate dans la devise courante. `StackCompareDecision` utilise également la valeur persistée dans la devise courante.

**Impact :** les économies deviennent incorrectes après un changement de devise ; plusieurs décisions prises dans des devises différentes peuvent être additionnées.

**Correction attendue :** conserver une base monétaire stable ou le montant et sa devise, avec un traitement explicite des anciennes décisions dont la devise est inconnue.

**Acceptation :** une économie de 9,17 EUR est convertie avec le taux du site lors du passage en USD ; elle ne devient pas 9,17 USD. Tester aussi plusieurs décisions et le rechargement.

Preuves : [EUR](../output/tooltrim-audit-2026-10-07/saving-eur.png), [USD](../output/tooltrim-audit-2026-10-07/saving-usd.png), [stockage et résultats](../output/tooltrim-audit-2026-10-07/cases.json).

### 5. P2 — Le comparatif Claude mélange application web et plateforme API

**Observation rendue :** `/fr/comparatif/chatgpt-vs-claude` décrit Claude comme une **plateforme API**, puis précise « Applications ChatGPT et Claude · offres web en USD » et compare **Claude Pro à 20 $US/mois**. Le catalogue local décrit une facturation API au token.

**Cause du mélange :** `ComparisonDecisionPage` prend le descriptif du catalogue pour le duel, et le guide éditorial dédié pour les offres et les conditions. Ces deux sources ne décrivent plus le même périmètre.

**Impact :** la personne ne sait plus quel produit ni quelle offre sont évalués.

**Correction attendue :** choisir explicitement le périmètre du comparatif, aligner son identité, ses descriptifs et ses offres sur ce périmètre. Ne pas réécrire les données tarifaires avant vérification officielle.

**Acceptation :** hero, tableau, tarifs et sources parlent tous du même produit et des mêmes offres.

Preuve : [capture](../output/tooltrim-audit-2026-10-07/_fr_comparatif_chatgpt-vs-claude-1440.png).

## Arbitrage produit à prévoir

**« Payé en double » affirme plus que le calcul ne démontre.** `StackOverlapPairs.tsx:68` prend le moins cher des deux outils payants partageant un usage ou une relation d’alternative. Cela identifie un recoupement potentiel ; cela ne prouve ni la redondance dans le travail de la personne, ni une économie réalisable en supprimant l’un des deux. Le texte explicatif nuance déjà ce point, mais le chiffre du hero reste affirmatif.

Recommandation : présenter ce montant comme un budget lié aux recoupements à examiner, puis réserver l’économie à une décision explicite. C’est un arbitrage de promesse produit, distinct des quatre bugs tarifaires reproduits.

## Ce qui fonctionne et limites de validation

- Les 22 rendus ont un H1 et du contenu ; aucune erreur `pageerror` ni débordement horizontal du document sur cet échantillon. Cela ne garantit pas tous les sous-conteneurs, toutes les interactions ou toutes les pages.
- `npm run test:ma-stack` : **74 tests / 9 fichiers passent**. La configuration ne couvre pas directement les nouveaux stores de décisions ni les calculs de `stackCost`/`scoreOverlapPairs`.
- Quatre tests navigateur existants sélectionnés : **3 passent, 1 échoue** au premier passage. Ajout → inspection → retrait → annulation → persistance, ajout depuis fiche → retour au contexte et mobile FR passent.
- Mobile EN : un échec sur la fermeture par Échap ; **deux répétitions isolées passent**. À conserver comme signal intermittent, sans cause confirmée ni correction proposée à ce stade.
- Des requêtes de logos renvoient 404 : 30 réponses sur le catalogue desktop, 12 sur Explorer desktop et 2 sur la page prix Figma desktop. Les chaînes de fallback peuvent multiplier les essais pour un même outil ; ces nombres ne sont pas des nombres de cartes cassées. Priorité secondaire, les pages rendent leur contenu.
- Pas de build production, d’audit exhaustif SEO/accessibilité, de mesure de performance, de contrôle Safari ou d’observation d’utilisateurs réels. Pas de conclusion sur le site déployé.

Résumé des routes : [scan-summary.json](../output/tooltrim-audit-2026-10-07/scan-summary.json).

## Ordre d’intervention proposé

1. Un premier lot corrige les contrats tarifaires : constats 1 à 3, avec cas gratuits, essais, devis, périodes et données absentes.
2. Un deuxième lot corrige la monnaie des décisions persistées : constat 4, avec migration et validations de changement de devise.
3. Aligner le périmètre Claude : constat 5, puis arbitrer le libellé « Payé en double ».
4. Contre-audit ciblé de ces critères sur le build destiné à la publication. Traiter les logos et le signal clavier intermittent dans un lot séparé si leur reproduction le justifie.

Claude peut prendre ces lots d’exécution ; Codex garde le suivi des constats et la vérification des critères. Le présent audit n’autorise aucune publication.


## Suivi — corrections du 7 octobre 2026

Les défauts tarifaires, coûts inconnus, devises persistées et périmètre Claude web décrits ci-dessus sont corrigés localement. Neuf régressions navigateur passent, dont le remplacement vers un prix inconnu. Le catalogue n’a pas été réécrit ; les informations absentes restent absentes. La revue élargie, les validations et risques encore ouverts figurent dans [REVUE_TECHNIQUE_2026-10-07.md](REVUE_TECHNIQUE_2026-10-07.md). Aucune publication.

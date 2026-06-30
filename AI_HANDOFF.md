# Tooltrim — Diagnostic handoff

> Mise à jour : 30 juin 2026 — Phase 4C bêta privée Créatif prête côté opérations, G4 non accepté.
>
> Mémoire de référence unique : ce fichier. `AI_HANDOFF 2.md` est une ancienne version incomplète.

## Pilotage obligatoire

- La roadmap décisionnelle est `ROADMAP_DIAGNOSTIC.md`.
- `AI_HANDOFF.md` décrit l’état réel et les décisions déjà prises ; il ne choisit plus seul le prochain chantier.
- Le développement fonctionnel au fil de l’eau est arrêté.
- Une seule phase de roadmap peut être active.
- Aucun lot ne commence sans problème observé, résultat attendu, métrique, dépendances et critères d’acceptation.
- La **Phase 0 — Reprise de contrôle** a atteint sa porte G0 au 29 juin 2026.
- La porte G0 produit est acceptée avec réserves après reprise complète G0-R1 à G0-R8, et la porte technique `npm run validate:g0` est verte.
- Le mode autonomie interne a autorisé le passage à la Phase 2 après G1 autonome accepté avec réserves ; ne pas confondre avec G1 terrain.
- La verticale Créatif reste le seul périmètre produit actif jusqu’à la porte G5.

## Avancement Phase 0 — 29 juin 2026

La Phase 0 — Reprise de contrôle — a atteint sa porte produit G0 avec réserves. Le prochain travail autorisé est la préparation de la **Phase 1 — Parcours Créatif candidat**, sans extension de verticale.

Livrables Phase 0 ajoutés :

- commande quotidienne `npm run validate:diagnostic` ;
- commande expérimentale UI `npm run validate:diagnostic:ui` ;
- commande de porte complète `npm run validate:g0` ;
- orchestrateur `scripts/validate-creative-diagnostic.mjs` ;
- build reproductible `scripts/build-production.mjs` ;
- garde-fou readiness produit `scripts/validate-g0-product-readiness.mjs` ;
- protocole `docs/diagnostic/PHASE0_G0_PROTOCOL.md` ;
- matrice métier `docs/diagnostic/CREATIVE_REFERENCE_SCENARIOS.md` ;
- recette produit `docs/diagnostic/G0_PRODUCT_RECIPE.md` ;
- décision produit `docs/diagnostic/G0_PRODUCT_DECISION.md` ;
- recette jouée `docs/diagnostic/G0_PRODUCT_RUN_2026-06-29.md` ;
- baseline `docs/diagnostic/G0_BASELINE_REPORT.md`.

## Avancement Phase 1 — ouverte le 29 juin 2026

La Phase 1 est ouverte comme **parcours Créatif candidat observé**. Le premier livrable n’est pas une correction UX, mais un protocole d’observation.

Livrables Phase 1 ajoutés :

- protocole `docs/diagnostic/PHASE1_CREATIVE_CANDIDATE_PROTOCOL.md` ;
- grille `docs/diagnostic/PHASE1_OBSERVATION_GRID.md` ;
- run pack `docs/diagnostic/PHASE1_USER_RUN_2026-06-29.md` ;
- décision `docs/diagnostic/PHASE1_G1_DECISION.md` ;
- garde-fou `scripts/validate-phase1-readiness.mjs` ;
- commande `npm run validate:phase1`.

Avancement Phase 1 autonome — 29 juin 2026 :

- cinq replays proxy ont été observés : P1-UI, P1-Brand, P1-Photo, P1-Video et P1-3D ;
- P1-SocialAudio n’a pas été observé en Phase 1, car le navigateur est devenu instable après tentative de test viewport ; ne pas l’inventer dans les résultats ;
- le mobile/petit écran n’est pas prouvé dans ce run Phase 1 ;
- G1 autonome est accepté avec réserves fortes pour continuer le travail interne ;
- G1 terrain n’est pas accepté : il faut encore six sessions modérées si l’objectif est une validation utilisateur réelle.

Correctifs appliqués pendant Phase 1 autonome :

- plafonnement du score sous “Optimisée/Optimized” dès qu’un prix, mode ou contrat reste à préciser ;
- ouverture de restitution non bloquée quand l’email optionnel est coché mais vide ;
- suppression des questions commerciales adaptatives redondantes après mode commercial déjà déclaré ;
- tests ajoutés pour protéger ces contrats UX.

Décision de pilotage Phase 1 :

- observer six sessions créatives avant de revendiquer G1 terrain ;
- transformer les réserves P2 G0 en risques observables : moment contrat, IA hybride, outil inconnu, reprise, zones sautées, outil multi-usage ;
- ne corriger immédiatement qu’un P0 reproductible ;
- ne pas enrichir le catalogue pour faire passer une session ;
- ne pas ouvrir Tech, Conseil, Content ou Ops ;
- garder `npm run validate:g0` comme porte technique avant toute livraison, et `npm run validate:phase1` comme garde-fou documentaire Phase 1.

Prochain travail autorisé :

1. rejouer P1-SocialAudio et un petit écran si l’on veut clôturer la Phase 1 terrain ;
2. en autonomie interne, poursuivre la roadmap Créatif en Phase 2 puis Phase 3 selon les portes ;
3. ne pas ouvrir Tech, Conseil, Content ou Ops ;
4. ouvrir un lot court seulement si une preuve d’observation ou un scénario obligatoire le justifie.

## Avancement Phase 2 — ouverte le 30 juin 2026

La Phase 2 — Vérité catalogue et commerciale — est ouverte en autonomie interne. Elle ne valide pas le terrain ; elle solidifie le modèle commercial pour la suite de la roadmap Créatif.

Livrables Phase 2 ajoutés :

- protocole `docs/diagnostic/PHASE2_COMMERCIAL_TRUTH_PROTOCOL.md` ;
- décision `docs/diagnostic/PHASE2_G2_DECISION.md` ;
- garde-fou `scripts/validate-phase2-readiness.mjs` ;
- commande `npm run validate:phase2`.

G2 autonome accepté avec réserves :

- plusieurs contrats dans une même famille sont supportés ;
- `CommercialAccessReview` garde un bloc fournisseur unique avec plusieurs lignes d’accès ;
- les plans `client_paid` et `included_elsewhere` sont disponibles dans les familles configurées pertinentes ;
- les scénarios G2 obligatoires sont protégés par tests : Adobe Photography + application client, Creative Cloud employeur + plugin personnel, Figma équipe + Midjourney personnel, Canva Pro + Canva AI, Maxon One + Octane, outil gratuit + crédits variables ;
- les coûts variables et enveloppes IA restent rattachés au contrat concerné ;
- les produits couverts par un contrat confirmé restent à coût marginal nul.

Validation Phase 2 observée le 30 juin 2026 :

- `npm run validate:phase2` : PASS, 9 checks ;
- `npm run validate:diagnostic` : PASS, 129 tests métier ciblés + garde-fous ;
- `npm run validate:g0` : PASS, build production inclus.

Réserves Phase 2 :

- édition fine des produits couverts par ligne d’accès encore limitée ;
- audit exhaustif `provider_id`, `commercial_family`, `host_app` encore à faire avant bêta ;
- exposition UX de la fraîcheur et des sources tarifaires encore perfectible ;
- plusieurs payeurs complexes ou refacturations partielles non modélisés finement.

Prochain travail autorisé :

1. relancer `validate:phase2`, `validate:diagnostic` et `validate:g0` ;
2. si tout est vert, passer en Phase 3 — Diagnostic et restitution de confiance — en autonomie interne ;
3. garder P1-SocialAudio/mobile comme validation terrain à part ;
4. ne pas ouvrir Tech, Conseil, Content ou Ops.

## Avancement Phase 3 — ouverte le 30 juin 2026

La Phase 3 — Diagnostic et restitution de confiance — est passée en autonomie interne. Elle ne valide pas le terrain ; elle solidifie la cohérence entre score, constats, décisions, recommandations et export.

Livrables Phase 3 ajoutés :

- protocole `docs/diagnostic/PHASE3_TRUSTED_RESTITUTION_PROTOCOL.md` ;
- décision `docs/diagnostic/PHASE3_G3_DECISION.md` ;
- garde-fou `scripts/validate-phase3-readiness.mjs` ;
- commande `npm run validate:phase3` ;
- source de vérité `src/utils/diagnosticDecisionPlan.ts`.

G3 autonome accepté avec réserves :

- la restitution principale est limitée à trois décisions maximum ;
- `DashOverview`, `DashActions` et `DashPdfExport` utilisent le même plan de décisions ;
- `DashActions` n’affiche plus une checklist ouverte, mais les trois décisions les plus utiles ;
- `DashOptimisations` n’affiche plus les recommandations sans preuve lisible ;
- `DashPdfExport` exporte `primaryDecisions` et seulement les recommandations prouvées ;
- une friction déclarée sur un usage existant prime sur une recommandation primaire d’un nouvel outil ;
- la calibration signale les recommandations sans preuve via `recommendation_without_evidence`.

Validation Phase 3 observée le 30 juin 2026 :

- `npx tsc --noEmit` : PASS ;
- `npx vitest run --config vitest.diagnostic.config.ts src/test/diagnostic/diagnosticRender.spec.tsx` : PASS, 31 tests.
- `npm run validate:phase3` : PASS, 11 checks ;
- `npm run validate:diagnostic` : PASS, 131 tests métier ciblés + garde-fous ;
- `npm run validate:g0` : PASS, build production inclus ;
- `git diff --check` : PASS.

Réserves Phase 3 :

- la revue experte métier G3 prévue par la roadmap n’est pas effectuée ;
- G1 terrain reste non validé, notamment Social/Audio et mobile ;
- la qualité des preuves dépend encore des mappings catalogue/workflow ;
- le rendu PDF généré côté fonction Supabase doit être relu visuellement avant livraison externe.

Prochain travail autorisé :

1. relancer `validate:phase3`, `validate:diagnostic` et `validate:g0` ;
2. si tout est vert, préparer la Phase 4 — bêta privée Créatif — sans revendiquer de validation terrain préalable ;
3. garder P1-SocialAudio/mobile comme validation terrain à part ;
4. ne pas ouvrir Tech, Conseil, Content ou Ops.

## Avancement Phase 4A/4B/4C — ouverte le 30 juin 2026

La Phase 4 — Bêta privée Créatif — est préparée et sécurisée en autonomie interne. Elle ne valide pas G4 ; elle rend le recrutement, les sessions terrain, les dry-runs, la qualité des logs, la synthèse de vague et l’évaluation de porte jouables proprement.

Livrables Phase 4A ajoutés :

- protocole `docs/diagnostic/PHASE4_PRIVATE_BETA_PROTOCOL.md` ;
- panel de recrutement `docs/diagnostic/PHASE4_RECRUITMENT_PANEL.md` ;
- grille d’observation `docs/diagnostic/PHASE4_OBSERVATION_GRID.md` ;
- décision de préparation `docs/diagnostic/PHASE4_G4_PREP_DECISION.md` ;
- journal structuré `docs/diagnostic/PHASE4_BETA_SESSIONS.json` ;
- décision G4 `docs/diagnostic/PHASE4_G4_DECISION.md` ;
- garde-fou `scripts/validate-phase4-readiness.mjs` ;
- évaluation `scripts/assess-phase4-g4.mjs` ;
- commande `npm run validate:phase4` ;
- commande `npm run assess:g4` ;
- dry-runs `src/test/diagnostic/phase4BetaReadiness.spec.tsx`.
- kit recrutement `docs/diagnostic/PHASE4B_RECRUITMENT_KIT.md` ;
- script session `docs/diagnostic/PHASE4B_SESSION_SCRIPT.md` ;
- tracker vague 1 `docs/diagnostic/PHASE4B_WAVE1_TRACKER.md` ;
- modèle JSON session `docs/diagnostic/PHASE4B_SESSION_LOG_TEMPLATE.json` ;
- consentement `docs/diagnostic/PHASE4B_CONSENT_AND_PRIVACY_BRIEF.md` ;
- messages de suivi `docs/diagnostic/PHASE4B_FOLLOWUP_MESSAGES.md`.
- protocole opérations `docs/diagnostic/PHASE4C_BETA_OPERATIONS_PROTOCOL.md` ;
- pipeline candidat `docs/diagnostic/PHASE4B_CANDIDATE_PIPELINE.json` ;
- modèle de synthèse vague 1 `docs/diagnostic/PHASE4C_WAVE1_SYNTHESIS_TEMPLATE.md` ;
- validation qualité session `scripts/validate-phase4-session-log.mjs` ;
- synthèse sessions `scripts/summarize-phase4-wave.mjs` ;
- commandes `npm run validate:phase4:sessions` et `npm run summarize:phase4`.

Décision Phase 4A :

- Phase 4A prête pour recrutement ;
- G4 non accepté ;
- aucun participant réel Phase 4 n’a encore été observé ;
- les métriques G4 ne sont pas mesurées ;
- `npm run assess:g4` refuse la porte tant que les sessions réelles et les seuils ne sont pas atteints ;
- dry-runs internes disponibles : Social/Audio, rendu restauré/mobile-sensible, payload PDF ;
- Phase 4B est prête à envoyer : invitation, screener, confirmation, relance, consentement, modération, tracker et modèle de session ;
- Phase 4C est prête à opérer : pipeline candidat vide, règles de session réelle, validation qualité des logs et synthèse de vague ;
- la prochaine action produit n’est pas d’ajouter du code par défaut, mais de jouer les premières sessions bêta ;
- aucun candidat, contact ou participant fictif ne doit être ajouté pour satisfaire les quotas ;
- les données personnelles de recrutement restent hors dépôt ;
- les retours doivent être classés P0/P1/P2/P3 ;
- seuls les P0/P1 reproductibles peuvent interrompre la bêta ;
- ne pas ouvrir Tech, Conseil, Content ou Ops.

Panel cible Phase 4 :

- 12 participants minimum, 18 recommandés ;
- segments : UI / produit, identité / édition, photo, vidéo / motion, 3D / espaces, social / audio ;
- mix obligatoire : indépendants, petites équipes, stacks Adobe fortes, stacks non-Adobe, IA intensive, IA occasionnelle, contrats flous, usages atypiques.

Réserves Phase 4A :

- G1 terrain reste non validé ;
- Social/Audio et mobile restent des angles morts à observer ;
- revue experte métier G3 encore à organiser ;
- environnement préprod/stable et consentement utilisateur à préparer avant première session.

Validation Phase 4C observée le 30 juin 2026 :

- `npm run validate:phase4:sessions` : PASS, journal prêt et vide, aucune session réelle enregistrée ;
- `npm run summarize:phase4` : PASS, décision attendue “poursuivre le recrutement, ne pas accepter G4” ;
- `npm run validate:phase4` : PASS, 23 checks ;
- `npm run assess:g4` : PASS d’exécution, verdict attendu `G4 NON ACCEPTÉ` faute de sessions réelles ;
- `npx vitest run --config vitest.diagnostic.config.ts src/test/diagnostic/phase4BetaReadiness.spec.tsx` : PASS, 3 tests ;
- `npm run validate:diagnostic` : PASS, 134 tests métier ciblés + garde-fous ;
- `npm run validate:g0` : PASS, build production inclus ;
- `git diff --check` : PASS.

Prochain travail autorisé :

1. recruter les 6 premiers participants en couvrant au moins 4 segments ;
2. suivre les candidats dans `PHASE4B_CANDIDATE_PIPELINE.json` sans données personnelles ;
3. jouer les premières sessions bêta avec `PHASE4_OBSERVATION_GRID.md` ;
4. remplir `PHASE4_BETA_SESSIONS.json` uniquement avec des sessions réelles ;
5. lancer `validate:phase4:sessions`, `summarize:phase4` et `assess:g4` après chaque session ou vague ;
6. ne corriger que les P0/P1 reproductibles ;
7. maintenir `validate:phase4`, `validate:diagnostic` et `validate:g0` verts ;
8. ne pas ouvrir Tech, Conseil, Content ou Ops.

Décision de pilotage technique héritée de G0 :

- `validate:diagnostic` vérifie TypeScript, les tests ciblés du diagnostic Créatif, la restitution, le catalogue et les modèles commerciaux ;
- les tests UI jsdom `profileGoalUx` et `topBarPricingUx` sont isolés car ils bloquent le runner local au lieu de produire un verdict ;
- `validate:g0` ajoute le build de production et représente la porte G0 complète ;
- le build écarte maintenant `dist` et `dist-ssr` dans `.build-trash` avant reconstruction, au lieu de tenter une suppression récursive fragile ; cela contourne les artefacts locaux du type `index 2.html`, `fr 2` ou dossiers de build gonflés par synchro ;
- si `validate:diagnostic` échoue, on corrige avant tout autre travail ;
- si le build échoue à nouveau uniquement pour une raison environnementale documentée, G0 devra être recontrôlée avant toute livraison ;
- aucune amélioration UX ou moteur ne doit reprendre avant lecture du protocole G0 et de la matrice de scénarios.

Événements déjà identifiés pour la mesure :

- `step_viewed`, `step_completed`, `step_back` ;
- `session_resumed` ;
- abandon via `abandoned_at` et raisons `visibility_hidden` / `page_hide` ;
- `session_completed` ;
- `report_requested` ;
- `restitution_tab_viewed`, `restitution_share_opened`, `restitution_pdf_export_clicked`.

Décision de recette produit mise à jour :

- G0-R1 — UI Figma / Sketch : PASS post-correction avec réserves P2 ;
- G0-R2 — Adobe et suites : PASS post-correction ;
- G0-R3 — usages atypiques : PASS après correction du faux positif Microsoft Project ;
- G0-R4 — 3D Blender / Cinema 4D : PASS après correction Redshift/Blender ;
- G0-R5 — social Canva / CapCut / publication : PASS après retrait de Canva Pro des compléments workflow ;
- G0-R6 — IA hybride : PASS après correction i18n LLM, accès IA intégré et double comptage contrat ;
- G0-R7 — outil inconnu : PASS avec réserve P2 sur libellé/cliquabilité du plan gratuit ;
- G0-R8 — reprise : PASS ;
- moyenne post-correction estimée : `13,5/16` ;
- décision écrite dans `docs/diagnostic/G0_PRODUCT_DECISION.md` : **G0 produit accepté avec réserves**.

Validation observée :

- `npm run validate:phase1` : PASS, 13 checks ;
- `npm run validate:phase2` : PASS, 9 checks ;
- `npm run validate:diagnostic` : PASS ;
- `npm run validate:g0` : PASS, build production inclus ;
- tests métier ciblés Créatif : 129 tests passés ;
- garde-fou readiness produit G0 : PASS ;
- build SSR/client : PASS.
- tests ciblés Phase 1 du 29 juin 2026 : PASS, 57 tests (`workflowUsageContracts`, `diagnosticRender`, `preVerdictContracts`).

Attention :

- la baseline technique est validée et la décision produit G0 est acceptée avec réserves ;
- G0-R1 révélait deux P1 : mélange FR/EN dans le parcours anglais et contradiction score parfait / stack fragile ;
- G0-R2 révélait des P1 structurels : mélange FR/EN répété, Adobe Creative Cloud proposé comme outil de workflow, contradiction score/risque, budget Adobe confirmé puis perdu dans la restitution ;
- un lot court de correction P1 a été appliqué le 29 juin 2026 et les P1 observés sur G0-R1/G0-R2 ont été rejoués en navigateur ;
- G0-R3 à G0-R8 ont été repris en navigateur et documentés ;
- prochaine action autorisée : soit rejouer Social/Audio + mobile pour une validation terrain, soit passer en Phase 3 en mode autonomie interne ; la porte complète `npm run validate:g0` est verte après Phase 2 autonome au 30 juin 2026 ;
- `validate:diagnostic:ui` reste isolé car les tests UI jsdom bloquent le runner local.

## Lot court P1 — appliqué le 29 juin 2026

Objectif : corriger les blocages de confiance observés dans G0-R1 et G0-R2 sans ouvrir une nouvelle phase fonctionnelle.

Correctifs appliqués :

- traduction anglaise des questions utiles, sous-titres, options et transition “tools to analyze” ;
- traduction centralisée du verdict santé dans le pré-verdict, le dashboard, l’overview et le payload PDF ;
- propagation des contrats commerciaux confirmés dans le pré-verdict, la restitution, les panneaux latéraux, les actions de stack et l’export ;
- exclusion des conteneurs commerciaux des suggestions de workflow et d’écosystème, y compris autour d’Adobe Illustrator ;
- plafonnement du score des petites stacks légères afin d’éviter un `100/100` “Optimisée/Optimized” quand la restitution signale une fondation fragile ;
- distinction en restitution entre budget déclaré et budget catalogue/à confirmer ;
- sécurisation de l’index des questions adaptatives pendant les reprises de session ;
- tests ajoutés pour protéger le scénario Adobe Illustrator + InDesign + contrat Creative Cloud All Apps à `70 €/mo`.

Validation automatique après correction :

- tests ciblés P1 : PASS, 57 tests ;
- `npm run validate:diagnostic` : PASS, 119 tests métier ciblés + garde-fous GO58/GO59/GO60/GO61 + readiness G0 ;
- `npm run validate:g0` : PASS, build production inclus ;
- `git diff --check` sur les fichiers touchés : PASS.

Replay navigateur post-correction :

- G0-R2 — Adobe et suites : replay ciblé PASS sur les P1 initiaux ;
- “Around Adobe Illustrator” ne propose plus Adobe Creative Cloud comme outil ;
- le contrat Adobe All Apps est demandé une seule fois pour Illustrator + InDesign ;
- la question tarifaire redondante outil par outil et la question Adobe héritée sont supprimées après contrat confirmé ;
- le suffixe anglais affiche `€/mo`, plus `€/mois` ;
- pré-verdict : `74/100`, “Good”, budget `70 €/mo`, `0` plan à clarifier ;
- restitution finale : `74/100`, “Good”, budget et budget déclaré `70 €/mo`, pas de `0 €/mo`, pas de “Optimized/Optimisée”.

Replay navigateur post-correction :

- G0-R1 — UI Figma : replay ciblé PASS sur les P1 initiaux ;
- le parcours anglais ne montre plus de fuite FR évidente sur le chemin rejoué ;
- Figma reste une entrée unique malgré plusieurs usages confirmés ;
- la branche “Around Figma” propose des compléments Figma, pas des plugins Sketch ;
- le pré-verdict affiche `74/100`, “Good”, profil fragile assumé, sans `100/100` ni “Optimized/Optimisée” ;
- la restitution finale affiche `74/100`, “Good”, Figma en production/review/secure et Iconify + Tokens Studio en satellites ;
- quand le prix Figma reste catalogue ou inconnu, la restitution affiche “Budget to confirm” et non “Declared budget” ;
- le micro-crash possible lors d’une reprise de questions utiles filtrées a été neutralisé.

Prouvé manuellement :

- G0-R3 à G0-R8 ont été rejoués dans le navigateur ;
- `docs/diagnostic/G0_PRODUCT_RUN_2026-06-29.md` contient les replays post-correction complets ;
- `docs/diagnostic/G0_PRODUCT_DECISION.md` accepte G0 avec réserves ;
- seulement la Phase 1 Créatif candidat est envisageable ensuite.

## Objectif

Analyser la stack réelle d’un utilisateur pour identifier les besoins couverts ou manquants, les doublons, les outils complémentaires, les plans surdimensionnés et les recommandations adaptées au métier et à l’objectif déclaré.

## Direction produit validée — première implémentation terminée

### L’unité centrale n’est plus l’outil

- Tooltrim doit cartographier des **objectifs et des usages réels**, puis observer avec quels outils, méthodes et fonctions ils sont accomplis.
- L’ordre conceptuel cible devient : objectif → tâche réelle → résultat attendu → méthode actuelle → outil ou combinaison d’outils → rôle de l’IA → fréquence → importance → satisfaction/friction → contrat qui finance l’ensemble.
- Un outil ne possède aucun usage exclusif. Les usages suggérés par le catalogue sont des aides, jamais une liste fermée.
- Les usages atypiques sont des données valides : devis dans InDesign, moodboard dans Illustrator, présentation dans Figma, CRM dans Notion, montage dans Blender, etc.
- Tooltrim enregistre d’abord la réalité sans la juger. Il ne recommande un changement que si l’usage actuel crée une friction vérifiable : temps, qualité, coût, collaboration, fiabilité, dépendance ou insatisfaction.
- Un même outil reste une seule entrée, reliée à autant d’objectifs et de tâches que nécessaire.
- L’utilisateur doit toujours pouvoir rattacher un besoin à un outil déjà sélectionné, choisir plusieurs outils, indiquer une méthode manuelle ou saisir un usage libre.

### L’IA est transversale, pas une rubrique

- La question générique « Quels outils IA utilises-tu ? » ne doit plus constituer la principale capture de l’IA.
- Pour chaque objectif ou tâche, Tooltrim doit pouvoir comprendre comment l’IA intervient :
  - aucune IA ;
  - fonction IA intégrée dans l’outil principal ;
  - outil IA séparé ;
  - plugin ou extension IA ;
  - automatisation ou chaîne de plusieurs IA ;
  - génération complète puis finition humaine ;
  - assistance ponctuelle, exploration ou contrôle qualité.
- Une même IA peut avoir plusieurs rôles selon l’étape : recherche, idéation, génération, retouche, déclinaison, transcription, animation, contrôle, livraison ou automatisation.
- Tooltrim doit distinguer l’outil visible de la capacité réellement utilisée. Exemple : Photoshop peut être utilisé avec ou sans Firefly ; Premiere avec ou sans transcription IA ; Notion avec ou sans Notion AI.
- Les fonctions IA incluses dans un produit ou un contrat ne doivent pas être comptées comme un abonnement séparé.
- Les crédits, quotas, limites d’usage et achats à la consommation doivent être rattachés au contrat ou à la fonction IA concernée.
- La valeur différenciante attendue de Tooltrim est de reconstruire la chaîne réelle humain + outils classiques + IA, puis d’identifier :
  - les étapes encore manuelles qui pourraient être accélérées ;
  - les IA redondantes ;
  - les fonctions IA déjà incluses mais ignorées ;
  - les ruptures de workflow entre génération et production finale ;
  - les risques de qualité, confidentialité, droits et dépendance.
- Cette profondeur est maintenant modélisée par acteur IA et par objectif avec :
  - source `integrated`, `external` ou `automation` ;
  - outil ou application hôte ;
  - capacités réellement utilisées ;
  - fréquence ;
  - crédits, quota, fiabilité, confidentialité et droits ;
  - indication de données sensibles.
- Les capacités suivent une grammaire commune indépendante des logiciels : recherche/idéation, texte, visuel, composition, code/handoff, 3D, tri, transcription/traduction, correction, suppression/extension, animation, rendu/upscale, contrôle qualité, automatisation et usage libre.
- Les options dépendent à la fois de l’objectif et des métadonnées de l’acteur. ChatGPT ne reçoit pas artificiellement les capacités de rendu de Photoshop ; une chaîne automatisée conserve néanmoins les usages déjà attribués à ChatGPT.

### Le contrat commercial est séparé de l’usage

- Tooltrim doit distinguer fournisseur, contrat payé, formule, payeur, produits inclus, produits disponibles et produits réellement utilisés.
- Le choix d’un outil ne doit pas être bloqué par le choix immédiat d’un plan.
- Un plan doit être demandé une seule fois au niveau commercial pertinent : suite Adobe, formule Microsoft 365, Maxon One, licence Figma, crédits Runway, plugin acheté séparément, etc.
- Sélectionner une suite ne signifie pas utiliser toutes ses applications. Les produits inclus sont proposés comme raccourcis de confirmation, sans être ajoutés automatiquement à la stack active.
- Une application incluse porte un coût marginal nul ; le coût appartient au contrat parent.
- Les cas « payé par mon entreprise/client », « inclus ailleurs » et « je ne sais pas » sont des états normaux, pas des erreurs.

### Conséquence UX

- La capture ne doit plus ressembler à une succession de fiches logiciels suivies d’un choix de plan.
- L’utilisateur doit pouvoir décrire rapidement « comment je fais cette chose aujourd’hui », y compris avec un bricolage, plusieurs outils ou une fonction IA intégrée.
- La précision commerciale vient ensuite, regroupée par contrat, uniquement lorsqu’elle peut changer le diagnostic.
- Les questions suivantes doivent réduire l’incertitude sur le travail réel, pas compléter mécaniquement une taxonomie d’outils.

## Logique métier en place

- Le chantier actif porte uniquement sur la verticale Créatif. Les autres profils restent fonctionnels mais ne doivent pas être étendus avant validation de cette verticale.
- Chaque parcours pose des questions métier propres et remonte des outils classés selon références explicites, `functional_needs`, type d’outil et pertinence persona.
- Le parcours créatif part des productions réelles : UI, identité, photo, vidéo, motion, illustration, 3D, architecture, audio ou social.
- La calibration Créatif tient désormais en trois étapes : profil → production principale → priorité. Les champs personnels optionnels ne bloquent plus l’accès à la cartographie.
- Les dix productions sont présentées dans une grille compacte. Les productions secondaires restent repliées jusqu’à l’action « J’ai aussi d’autres productions ».
- Depuis la capture, « Modifier mes productions » ouvre un éditeur dédié en une seule étape et conserve la stack et les usages déjà saisis.
- La capture suit désormais : production → objectifs prioritaires → façon réelle de faire → outils et usages multiples → rôle de l’IA dans cet objectif → écosystème → zones inconnues → contrats regroupés → diagnostic.
- Le parcours principal est limité par défaut à 6 zones. Les besoins de production critiques sont garantis ; brief, IA, assets et livraison peuvent être reportés dans une vérification secondaire optionnelle.
- Le score des prochaines zones combine priorité métier, incertitude, impact diagnostic, outil hôte confirmé et fatigue. L’ordre visible reste stable pendant les réponses.
- Un outil reste unique dans la stack mais peut couvrir plusieurs besoins via `toolUsageMap`.
- `workflowUsages` ajoute maintenant une couche structurée par objectif : méthode manuelle/outillée/mixte/externalisée, outils associés, méthode libre, rôle de l’IA, outils IA et satisfaction.
- Chaque `workflowUsage` peut contenir plusieurs `aiActors`. Une seule étape peut donc combiner Photoshop intégré pour le remplissage génératif et ChatGPT séparé pour l’idéation, sans dupliquer ni l’application ni l’outil IA.
- Les modes IA sont stables pendant la saisie. Choisir Photoshop après « intégrée + séparée » ne fait plus disparaître la partie séparée ; passer en chaîne automatisée transforme l’acteur ChatGPT sans perdre ses capacités déclarées.
- La méthode libre est affichée avant la recherche d’outils. Le catalogue vient ensuite comme aide, pas comme point de départ imposé.
- Les outils connus cités dans la phrase libre sont détectés et proposés à la liaison en un clic. Ils ne sont jamais ajoutés automatiquement.
- Les usages atypiques sont capturés comme des faits. Ils ne provoquent une recommandation que si l’utilisateur déclare une friction ou un blocage.
- Après l’ajout d’un outil, l’interface propose de confirmer ses autres usages pertinents sans l’ajouter une deuxième fois.
- Une étape n’est validée que par l’action explicite « Zone suivante » ; ajouter un outil ne coche pas automatiquement les autres étapes.
- Les applications hôtes ouvrent des branches d’écosystème ciblées. La branche n’affiche que ses relations explicites et n’affiche plus l’application hôte elle-même.
- Une branche d’écosystème ne reste ouverte que si l’application hôte sert encore une production active. Changer de 3D vers photo ne conserve plus artificiellement « Autour de Blender ».
- Modifier les productions nettoie aussi les outils, usages, contrats et couvertures liés uniquement aux productions retirées. Les outils transverses encore utiles sont conservés.
- La grammaire commune de relations couvre `plugin_of`, `included_in`, `complements`, `alternative_to` et `integrates_with`. `host_app`, bundle, alternatives et relations explicites sont normalisés dans cette grammaire.
- Les données Supabase enrichissent désormais le catalogue local au lieu d’écraser ses métadonnées structurelles.
- Un outil inconnu peut être ajouté par son nom sans demander à l’utilisateur de comprendre la taxonomie ; Tooltrim infère le besoin courant, le rôle probable et la relation hôte disponible.
- La sélection d’un outil est immédiate. Aucun choix de formule ne bloque plus la progression.
- Les contrats sont clarifiés dans la revue finale, regroupés par famille commerciale. Adobe, Maxon, Microsoft, Affinity, Figma et Canva ont des règles dédiées ; les autres fournisseurs utilisent une grammaire générique.
- Un contrat confirmé porte son coût une seule fois. Ses applications couvertes passent à coût marginal nul et gardent un lien vers le contrat parent.
- Adobe distingue notamment toutes les apps, Photography, Photography + autres apps, applications seules, licence employeur et formule inconnue. Photography seule ne couvre pas artificiellement InDesign ou Illustrator.
- Règle cible : les conteneurs commerciaux comme Adobe Creative Cloud, Maxon One ou Microsoft 365 doivent être exclus des suggestions de workflow ; Tooltrim doit proposer les applications réellement utilisées, puis traiter la suite dans la revue commerciale. La recette G0-R2 a révélé une régression visible avec Adobe Creative Cloud proposé dans “Around Adobe Illustrator”.
- La barre supérieure n’affiche plus une somme catalogue provisoire comme un budget fiable. Elle indique « accès à préciser » tant que les contrats ne sont pas clarifiés.
- Le nombre d’accès à préciser est dédupliqué par outil : une offre inconnue et une estimation catalogue sur le même produit ne comptent plus comme deux outils à vérifier.
- Blender et Cinema 4D sont des pairs pour la création 3D. Création, rendu et écosystème sont traités séparément.
- Le parcours Espaces/architecture sépare maintenant conception spatiale, production des plans/dossiers techniques, rendu et écosystème.
- SketchUp utilise son identifiant réel `sketchup-pro`. Son écosystème relie LayOut, les extensions SketchUcation/Fredo, les outils de préparation de modèle et les moteurs de rendu pertinents.

### Restitution IA désormais active

- `aiAnalysis` transforme les acteurs IA capturés en lecture métier structurée, au lieu de conserver l’IA comme simple donnée de formulaire.
- Chaque objectif restitue les acteurs, leur source — intégrée, séparée ou automatisée —, leur fréquence et leurs capacités exactes.
- Les risques confidentialité/données sensibles, droits, fiabilité et crédits/quota deviennent des constats explicites et des actions priorisées.
- Un chevauchement IA n’est signalé que si deux acteurs couvrent la même capacité exacte dans le même objectif.
- Une fonction intégrée et un outil séparé ayant des rôles distincts restent complémentaires. Leur simple coexistence n’est jamais considérée comme un doublon.
- Une étape manuelle déclarée pénible ou bloquée sans IA peut produire une opportunité d’automatisation, sans imposer arbitrairement un logiciel.
- Les recommandations de rationalisation protègent d’abord l’acteur le plus utilisé ; à usage égal, elles challengent le coût le plus élevé.
- Le dashboard expose maintenant une section « AI read » centrée sur ce que l’IA fait réellement, les zones à sécuriser et les décisions à prendre.
- Les mêmes constats alimentent le pré-verdict, les actions et le rapport PDF.
- Un risque IA élevé passe avant une question tarifaire dans la thèse, le risque principal et la liste d’actions.
- Le score santé est pénalisé et plafonné en présence d’un risque IA élevé. Tooltrim ne peut donc plus annoncer une stack « optimisée » alors qu’un traitement de données sensibles reste non cadré.
- La maturité reste « émergente » pour une petite stack avant d’évaluer une éventuelle surconstruction, afin d’éviter les verdicts contradictoires « fragile » et « overbuilt ».

### Fonctions IA intégrées et accès économique

- Une application hôte et sa fonction IA sont maintenant deux objets distincts mais reliés dans le workflow : Photoshop peut porter Adobe Firefly sans ajouter Firefly comme deuxième outil de production.
- L’acteur IA peut conserver `featureToolId` et `featureName`. Le logiciel hôte reste dans `toolId`.
- Les fonctions IA intégrées sont suggérées depuis le catalogue et le contexte commercial commun : application hôte explicite, produit enfant, bundle, fournisseur ou famille commerciale partagée.
- La pertinence de la fonction dépend aussi de l’objectif courant. Adobe Podcast AI n’est pas proposé artificiellement dans une étape de retouche photo simplement parce qu’il appartient à Adobe.
- La sélection du nom de la fonction reste facultative et ne bloque jamais la cartographie. L’utilisateur peut continuer à dire seulement « IA intégrée » s’il ignore le nom marketing.
- Les fonctions réellement utilisées rejoignent la revue commerciale comme capacités à couvrir, sans entrer dans le compteur des outils de production.
- La revue distingue visuellement les applications actives et les capacités IA utilisées, tout en ne demandant le contrat qu’une fois par famille.
- Le diagnostic calcule maintenant un statut d’accès pour chaque acteur IA :
  - inclus dans le contrat ;
  - inclus avec quota ou crédits ;
  - abonnement séparé ;
  - facturé à l’usage ou en crédits ;
  - payé par l’équipe ou un client ;
  - gratuit ;
  - accès à préciser.
- Une capacité IA systématique, à crédits ou à quota dont le financement reste inconnu produit un signal « accès IA à préciser ».
- Le dashboard et le PDF affichent désormais la fonction, l’application hôte, le statut d’accès et le contrat qui la finance.
- Adobe Firefly peut être couvert par le contrat Adobe Photography sans être compté comme abonnement supplémentaire.
- Canva AI est regroupé avec Canva via le même écosystème commercial.
- Figma AI intégré et Midjourney séparé restent économiquement distincts, même lorsqu’ils interviennent dans le même objectif.

### Pression des crédits et coût variable

- Tooltrim ne demande pas à l’utilisateur de connaître un nombre de crédits, de tokens ou de générations.
- La revue commerciale pose une question de conséquence observable uniquement pour les familles réellement concernées par un quota ou un modèle à crédits :
  - l’enveloppe suffit ;
  - elle limite parfois ;
  - elle bloque souvent ;
  - l’utilisateur rachète des crédits ou dépasse son forfait ;
  - l’utilisateur ne sait pas.
- Cette question reste au niveau du contrat et n’est jamais répétée dans chaque objectif métier.
- Le champ `CommercialContract.aiAllowanceStatus` porte cet état. `variableMonthlyPrice` stocke seulement la moyenne mensuelle des recharges ou dépassements lorsqu’elle existe.
- Le montant variable est ajouté au coût total réel du contrat et de la stack, sans créer un second abonnement.
- Un quota déclaré suffisant ne produit plus de faux risque, même si l’acteur IA est utilisé systématiquement.
- Une limite occasionnelle reste un signal faible à surveiller.
- Une limite fréquente ou des recharges régulières deviennent un constat `usage_pressure` actionnable dans la restitution.
- Tooltrim recommande alors de comparer le coût total réel à un palier supérieur ou à une autre capacité avant d’ajouter un nouvel outil.
- Le dashboard et le PDF affichent l’état de l’enveloppe et, lorsqu’il est connu, le surcoût mensuel moyen.
- Les champs de consommation survivent à la reprise de session.

### Synthèse IA multi-objectifs

- La restitution sépare maintenant deux niveaux :
  - le rôle local, attaché à une étape et conservé comme preuve ;
  - l’acteur global, affiché une seule fois avec tous ses rôles.
- L’identité globale est fondée sur la fonction IA nommée ou le produit réel, jamais sur le nom de la question.
- ChatGPT utilisé manuellement dans un brief puis dans une automatisation de déclinaison reste un seul acteur.
- Les modes `integrated`, `external` et `automation` sont conservés dans chaque rôle. Un acteur qui change de mode affiche « plusieurs modes » dans sa synthèse globale.
- `actorCount` compte désormais les acteurs uniques. `actorOccurrenceCount` conserve le nombre total d’interventions dans les étapes.
- `globalActors` contient pour chaque acteur :
  - ses sources ;
  - ses objectifs ;
  - ses capacités cumulées ;
  - sa fréquence la plus forte ;
  - son accès et son contrat ;
  - ses contraintes et son éventuel surcoût.
- Le dashboard est désormais organisé par acteur global. Chaque carte liste ensuite les étapes, capacités, fréquences et modes associés.
- Le PDF utilise la même lecture globale, avec un fallback sur l’ancien format par étape pour les anciens diagnostics.
- Les constats sont dédupliqués selon leur vraie unité :
  - risque et rôle manquant par acteur ;
  - accès et pression de crédits par contrat ;
  - chevauchement par paire d’acteurs et capacité ;
  - opportunité d’automatisation par étape.
- Un constat regroupé conserve la liste des objectifs concernés, son nombre d’occurrences, la sévérité la plus forte et toutes les actions distinctes.
- Les risques différents du même acteur — par exemple confidentialité dans une étape et droits dans une autre — restent présents dans le détail d’un seul constat global.
- Un même quota Runway utilisé dans plusieurs étapes produit une seule action contractuelle.
- Un chevauchement ChatGPT/Claude répété sur plusieurs objectifs produit une seule prescription, fondée sur la fréquence la plus forte observée.
- Le plan d’action ne répète plus un chevauchement IA une fois comme prescription puis une seconde fois comme signal de workflow.
- Les priorités du dashboard ne réinjectent plus le même risque via les focus areas après l’avoir déjà affiché comme signal IA.

## Règles présentes

- Doublons classiques : règles explicites ou similarité fonctionnelle élevée.
- Doublons IA : même objectif et même capacité exacte. La présence de deux outils IA dans une étape ne suffit pas.
- `toolUsageMap` neutralise un doublon si deux outils similaires servent des besoins déclarés distincts.
- Cette neutralisation s’applique aussi aux outils IA partageant le même cas d’usage technique mais affectés à des rôles créatifs différents.
- Les relations hôte/plugin, bundle/enfant et outils inclus ne sont pas considérées comme des doublons.
- Deux clusters de substitution différents ne sont plus considérés automatiquement comme complémentaires. Seules les relations structurelles réelles protègent un couple du diagnostic de doublon.
- Détection des outils dormants, mauvais fit persona et possibilités de downgrade.
- Priorisation selon l’objectif : coûts, simplification, temps ou qualité.
- Reprise de session : usages multiples, offre choisie, métadonnées de prix et couverture des zones sont conservés.
- Une restitution terminée propose « Nouveau diagnostic » sur desktop et mobile ; cette action efface la reprise locale et revient à la calibration.
- Les questions adaptatives sont restaurées avec leurs options et outils concernés : une réponse garde donc sa signification après reprise.
- Une réponse explicite « plan payant justifié » protège l’outil contre une recommandation contradictoire de downgrade ou d’alternative gratuite.
- Pendant la capture, les outils affichés sont uniquement des exemples d’outils existants possibles. Les recommandations arrivent après l’analyse.
- Pour Créatif, une recommandation d’ajout n’apparaît que pour un besoin de production déclaré sans outil. Elle est supprimée si la zone est hors activité, si la capture est incomplète, si un outil existant peut déjà couvrir l’usage ou si l’outil est inclus dans une suite sélectionnée.
- Chaque recommandation possède une preuve lisible (`recommendationEvidence`) affichée dans le dashboard et exportée dans le rapport.

## Audit utilisateur en cours

- Persona de référence : créatif pressé, interrompu par des retours client, qui ne connaît pas toujours le nom exact de son plan et utilise souvent un même outil à plusieurs étapes.
- Promesse de confiance : toute action présentée comme enregistrée doit survivre immédiatement à un rechargement ou une fermeture.
- Défaut critique reproduit le 18 juin : un outil ajouté et son plan disparaissaient après rechargement si « Zone suivante » n’avait pas encore été cliqué.
- Correction terminée : chaque ajout, retrait, changement de plan, usage, validation et skip est synchronisé avec la session centrale dès l’action.
- Défaut UX ciblé le 19 juin : demander une formule au moment de chaque sélection obligeait l’utilisateur à penser comme l’éditeur du logiciel, répétait Adobe application par application et cassait son fil métier.
- Correction terminée : ajout immédiat pendant la cartographie, puis revue commerciale regroupée une seule fois par contrat.

## Fichiers clés

- `src/lib/personaAdaptiveEngine.ts`
- `src/lib/creativeAdaptiveEngine.ts`
- `src/lib/toolRelations.ts`
- `src/lib/workflowUsage.ts`
- `src/lib/aiWorkflow.ts`
- `src/lib/aiDiagnostic.ts`
- `src/lib/commercialAccess.ts`
- `src/components/diagnostic/DiagStepProfileGoal.tsx`
- `src/components/diagnostic/DiagStepStackScan.tsx`
- `src/components/diagnostic/CommercialAccessReview.tsx`
- `src/components/diagnostic/DiagTopBar.tsx`
- `src/lib/diagnosticRecovery.ts`
- `src/utils/diagnosticPricing.ts`
- `src/utils/scoring.ts`
- `src/types/diagnostic.ts`
- `src/test/diagnostic/adaptiveJourney.spec.ts`
- `src/test/diagnostic/creativeAdaptiveEngine.spec.ts`
- `src/test/diagnostic/diagnosticRender.spec.tsx`
- `src/test/diagnostic/diagnosticRecovery.spec.ts`
- `src/test/diagnostic/workflowUsageContracts.spec.ts`
- `src/test/diagnostic/profileGoalUx.spec.tsx`
- `src/test/diagnostic/topBarPricingUx.spec.tsx`
- `vitest.diagnostic.config.ts`

## Cas validés

- Matrice complète des dix productions créatives : identité/visuel, UI/produit, photo, vidéo, motion, illustration, 3D, espaces/architecture, audio et contenus sociaux.
- Chaque production ouvre uniquement ses besoins métier propres, plus les étapes transverses de brief, IA, assets et validation/livraison.
- Les suggestions proviennent du vrai catalogue `tools_v4.json`, avec au moins deux options réelles pour chaque besoin principal.
- Plusieurs productions peuvent être combinées sans dupliquer les questions transverses.
- Les outils proposés changent réellement selon la question.
- Réutilisation d’un outil sur plusieurs besoins sans duplication.
- Blender et Cinema 4D proposés comme options 3D comparables.
- Blender réutilisable pour le rendu puis ouverture de son écosystème.
- Écosystèmes validés pour Figma, Canva, After Effects, Premiere Pro, Photoshop, Lightroom, Capture One, Blender, Cinema 4D, 3ds Max, Maya et Houdini.
- La branche Sketch ne reçoit pas les plugins Figma ; Blender et Cinema 4D gardent des compléments propres ; Lightroom ouvre Nik Collection et Pixieset sans outils UI parasites.
- Écosystèmes validés aussi pour SketchUp Pro et Revit.
- Le parcours Espaces/architecture propose SketchUp Pro et Revit pour la conception, LayOut/AutoCAD/Revit/Acrobat pour la documentation, puis Enscape/Twinmotion/Lumion/D5 Render/V-Ray pour le rendu.
- LayOut est déclaré comme satellite inclus avec SketchUp Pro (`host_app` et `bundle_parent`), avec option bilingue « Inclus avec SketchUp Pro / Included with SketchUp Pro » et sans double coût.
- Le scénario social commence par la création/déclinaison des formats sociaux ; le montage vidéo reste une branche complémentaire.
- Le scénario social couvre maintenant aussi planification, publication multi-plateformes et analytics avec le vrai catalogue.
- Le scénario audio couvre maintenant hébergement, flux RSS, diffusion et analytics podcast.
- La validation finale inclut livraison, versions, sauvegarde et archivage.
- Pas de faux doublon entre rôles distincts, application/plugin ou bundle.
- Navigation directe entre questions visible et fonctionnelle.
- Affichage desktop et mobile vérifié.
- Chaque objectif accepte une méthode libre, une méthode manuelle et une mesure de satisfaction.
- L’IA est capturée dans chaque objectif : sans IA, fonction intégrée, outil séparé ou chaîne/automatisation. Un outil IA sélectionné reste unique et est relié à l’objectif courant.
- Le rôle précis de chaque acteur IA est capturé. Le scénario photo validé associe Photoshop intégré à « supprimer, détourer ou étendre » et ChatGPT à « recherche et idéation ».
- Les acteurs IA portent leur fréquence et leurs limites. Crédits, quota, fiabilité, confidentialité ou droits alimentent un signal de revue au lieu d’un badge IA générique.
- Les transitions intégré → mixte → automatisé conservent les capacités déjà saisies. Une chaîne ChatGPT n’affiche que ses capacités plausibles, plus l’automatisation et l’usage libre.
- La question transverse générique `creative-ai` n’est plus injectée dans le parcours Créatif principal.
- Adobe multi-apps est regroupé sous un seul contrat. Le plan Photography couvre Photoshop/Lightroom, mais signale les autres applications non couvertes ; le mode Photography + autres applications couvre le cas mixte.
- Les contrats, usages structurés et liens outil-contrat survivent à la reprise de session et sont exportés dans le rapport.
- Le coût du diagnostic compte un contrat confirmé une seule fois, sans sommer ses applications incluses.
- Un usage inhabituel déclaré satisfaisant ne déclenche aucune « correction ». Une alternative testable n’apparaît qu’en cas de friction déclarée.
- Une phrase comme « je trie dans Capture One puis je termine dans Photoshop » fait proposer la liaison de Photoshop au même objectif, sans doublon ni ajout automatique.
- Les suites commerciales ne remontent plus comme outils de production. Lightroom ou Capture One sont proposés pour le développement photo ; Creative Cloud reste un contrat.
- Les suggestions principales sont limitées à quatre options visibles, avec ouverture explicite des alternatives supplémentaires.

## Validation historique jusqu’au 20 juin 2026

- La suite complète de 124 tests passait avant les derniers raffinements de hiérarchie et de déduplication tarifaire.
- Après ces raffinements : 15 tests métier `workflowUsageContracts`, 19 tests de rendu `diagnosticRender` et TypeScript passent.
- À cette date, certaines relances longues pouvaient rester bloquées par des fichiers de dépendances `node_modules` déchargés par iCloud (`compressed,dataless`), notamment dans la chaîne PostCSS/Tailwind. Ce point est historique : la porte G0 complète du 29 juin 2026 passe.
- La matrice Créatif contient 54 scénarios ciblés, dont le budget de questions, Figma/Sketch, Blender/Cinema 4D, Lightroom, usages multiples, recommandations justifiées, zones hors activité et relations catalogue mal formées.
- Les validateurs GO58 (moteur Créatif) et GO60 (catalogue Créatif) passent.
- Les faux doublons IA entre rôles créatifs distincts sont maintenant couverts.
- La couverture des zones est maintenant restaurée par la reprise de session.
- Auto-sauvegarde vérifiée en navigateur sur desktop : Figma Professional à 16 €/mois survit à un rechargement avant « Zone suivante » et son écosystème reste présent.
- Reprise vérifiée après validation UI et skip 3D : les états « remplie » et « marquée vide » sont restaurés et le parcours reprend sur le brief.
- Reprise mobile vérifiée en 390 × 844 sans erreur applicative pertinente.
- Parcours social vérifié avec Buffer, Metricool, Later, Hootsuite, Sprout Social et Planoly.
- Parcours audio vérifié avec Spotify for Podcasters, Buzzsprout, Ausha, Acast et Podbean.
- La chaîne créative du dashboard est maintenant reconstruite depuis `toolUsageMap`, avec une étape « Diffuser » et la possibilité pour un outil polyvalent d’apparaître dans plusieurs maillons.
- L’arbitrage des doublons IA protège d’abord l’outil le plus utilisé ; à usage égal, il challenge le plus cher.
- Le pré-verdict utilise la même classification que le dashboard : Audacity + Buzzsprout produit bien 1 outil de production et 1 outil de diffusion.
- Recette après rechargement : le plan Buzzsprout déclaré justifié reste protégé, Buzzsprout apparaît dans « Diffuser » et aucune alternative gratuite contradictoire n’est recommandée.
- Recette Espaces/architecture complète en anglais :
  - « Nouveau diagnostic » efface une ancienne restitution et repart de zéro ;
  - SketchUp Pro est ajouté immédiatement sans interrompre la cartographie par une formule ;
  - la documentation est une étape distincte et propose LayOut ;
  - LayOut est reconnu comme inclus avec SketchUp Pro dans la clarification commerciale, sans double coût ;
  - le rendu propose Enscape, Lumion, Twinmotion, D5 Render, V-Ray et Blender ;
  - l’écosystème SketchUp Pro propose LayOut, Fredo6, Joint Push Pull, FredoCorner, Enscape et Curviloft ;
  - après rechargement, les deux outils, le contrat, le budget et les zones remplies/vides sont restaurés.
- Aucun faux doublon entre SketchUp Pro et LayOut inclus, ni entre application hôte et plugin.
- Aucun log d’erreur applicative observé pendant cette recette ; seulement les avertissements locaux Analytics/React Router déjà connus.
- Une recette navigateur supplémentaire a validé :
  - 6 zones principales avec 2 zones secondaires optionnelles ;
  - l’écosystème réel de SketchUp Pro ;
  - LayOut conservé comme entrée unique puis associé à plusieurs usages ;
  - l’ajout d’un outil inconnu prérempli comme plugin de SketchUp Pro ;
  - la revue finale à 6/6 puis l’ouverture volontaire des zones secondaires ;
  - un compteur mobile fondé sur les zones vérifiées, y compris les zones volontairement vides.
- Cette recette a révélé puis corrigé un crash sur les relations catalogue reçues sous forme d’objet. La frontière de données accepte maintenant identifiants texte, numériques ou objets structurés.
- TypeScript passe sans erreur.
- Build production réussi le 19 juin 2026, avec pages SEO et sitemap générés.
- Les validateurs GO58 (moteur Créatif) et GO60 (catalogue Créatif) passent après la refonte.
- Recette navigateur du nouveau modèle :
  - sélection d’un outil sans modale de formule ;
  - saisie libre « Revit pour le plan, Illustrator pour un moodboard client » ;
  - ajout de ChatGPT comme IA séparée pour cet objectif ;
  - revue finale affichant la méthode libre et la mention « avec IA » ;
  - Illustrator, Creative Cloud et InDesign regroupés dans un seul bloc Adobe ;
  - formule Adobe All Apps et montant global saisis une seule fois ;
  - compteur de contrats fondé sur la couverture réelle des produits, pas sur le nombre d’outils.
- Passe UX terrain UI / 3D / photo :
  - calibration Créatif réduite de quatre à trois étapes ;
  - suppression du formulaire prénom/email/TJM avant la cartographie ;
  - choix des productions compact et productions secondaires repliées ;
  - édition des productions en une seule étape depuis la stack ;
  - Blender et Cinema 4D restent des pairs dans le scénario 3D ;
  - une ancienne branche Blender disparaît après passage à un parcours photo ;
  - les outils exclusivement liés à l’ancienne production disparaissent aussi de la stack et de la revue commerciale ;
  - Adobe Creative Cloud n’est plus proposé comme outil de développement photo ;
  - méthode libre placée avant le catalogue ;
  - Capture One et Photoshop reliés au même objectif depuis une phrase libre ;
  - montant catalogue masqué dans la barre supérieure tant que le contrat reste inconnu.
- Aucun log d’erreur applicative observé pendant cette recette.
- Recette IA précise photo :
  - Capture One et Photoshop associés au développement photo ;
  - mode « intégrée + séparée » conservé pendant le choix successif de Photoshop et ChatGPT ;
  - capacités de Photoshop contextualisées à la photo ;
  - capacités de ChatGPT filtrées à recherche, texte et usage libre, sans faux rendu/upscale ;
  - passage à « chaîne / automatisation » sans perte de l’usage « recherche et idéation » ;
  - affichage mobile vérifié en 390 × 844 et bureau en 1280 × 800 ;
  - URL, titre, contenu et interactions vérifiés ; aucun log navigateur de niveau erreur.
- TypeScript, build production, GO58 et GO60 passent après cette recette.
- Nouvelle recette navigateur Illustration/IA :
  - Illustrator couvre la production d’illustration ;
  - une fonction IA intégrée « supprimer, détourer ou étendre » et Midjourney séparé « générer des directions visuelles » restent deux rôles distincts ;
  - un risque de confidentialité avec données sensibles remonte avant les sujets de prix ;
  - le pré-verdict affiche 69/100, santé « Correcte », maturité « Emerging », 2 capacités IA et 1 étape IA ;
  - le dashboard restitue 1 étape, 2 acteurs, 2 capacités et 1 risque, avec la source et la fréquence de chaque acteur ;
  - le risque IA devient la première décision et la première priorité ;
  - aucun faux doublon n’est créé entre Illustrator intégré et Midjourney.
- Le compteur commercial qui affichait 4 outils à vérifier pour 2 outils sélectionnés a été corrigé et couvert par un test : un outil ne compte désormais qu’une fois.
- Les validateurs GO58 et GO60 passent le 20 juin 2026 après ces changements.
- `git diff --check` et TypeScript passent.
- Nouvelle passe « accès économique IA » :
  - 19 tests métier `workflowUsageContracts` passent ;
  - 19 tests de rendu `diagnosticRender` passent ;
  - les 38 tests ciblés passent ensemble ;
  - TypeScript, `git diff --check`, GO58 et GO60 passent ;
  - Firefly est proposé pour Photoshop dans un objectif photo, tandis qu’Adobe Podcast AI est écarté ;
  - Notion AI est reconnu comme capacité enfant de Notion par la grammaire commune ;
  - Firefly couvert par Adobe est restitué « inclus avec quota ou crédits » ;
  - Canva + Canva AI ne créent qu’une famille commerciale ;
  - Figma intégré et Midjourney séparé conservent deux statuts économiques distincts ;
  - le test de rendu vérifie la capture « Si tu connais le nom de la fonction IA » ainsi que l’affichage fonction + hôte + accès dans le dashboard.
- Historique : la recette visuelle locale de cette passe n’a pas pu être exécutée sur `http://127.0.0.1:8080/en/selector`, refusé par la politique du navigateur intégré. Le 29 juin 2026, la recette G0 a ensuite fonctionné via `http://localhost:8080/en/selector`.
- Nouvelle passe « crédits et dépassements IA » :
  - 21 tests métier `workflowUsageContracts`, 20 tests de rendu `diagnosticRender` et 1 test de reprise passent ;
  - les 42 tests ciblés passent ensemble ;
  - TypeScript, `git diff --check`, GO58 et GO60 passent ;
  - une enveloppe Firefly déclarée suffisante ne crée aucun signal quota ;
  - un abonnement Runway à 15 € avec 18 € de recharges produit un coût réel de 33 €/mois ;
  - ce cas génère un constat « Coût IA variable — Runway » sans inventer un second contrat ;
  - la revue commerciale affiche la question en langage utilisateur et masque le montant tant qu’aucun rachat n’est déclaré ;
  - le dashboard restitue « recharges ou dépassements » et le surcoût moyen ;
  - `aiAllowanceStatus`, `variableMonthlyPrice`, `featureToolId` et `featureName` sont couverts par la reprise de session.
- Historique : une tentative de lancer toute la matrice avec la configuration diagnostic s’était suspendue sans sortie et avait été interrompue après les tests ciblés. La validation G0 complète du 29 juin 2026 passe désormais avec la commande dédiée.
- Nouvelle passe « synthèse IA multi-objectifs » :
  - 24 tests métier `workflowUsageContracts`, 22 tests de rendu/actions `diagnosticRender` et 1 test de reprise passent ;
  - les 47 tests ciblés passent ensemble ;
  - TypeScript, `git diff --check`, GO58 et GO60 passent ;
  - ChatGPT utilisé comme outil séparé puis comme automatisation devient 1 acteur, 2 interventions, 2 rôles et plusieurs modes ;
  - un quota Runway partagé par deux objectifs produit 1 constat, 2 preuves et 1 signal d’action ;
  - un chevauchement ChatGPT/Claude présent dans deux objectifs produit 1 constat et 1 prescription ;
  - le plan d’action ne crée qu’une action « résoudre le doublon » ;
  - le dashboard affiche une carte par acteur avec les rôles « Brief créatif » et « Déclinaisons sociales » ;
  - le PDF consomme `globalActors` et conserve un fallback compatible avec les anciennes sessions.
- Historique : la matrice élargie de sept fichiers avait de nouveau suspendu Vitest sans sortie. Les fichiers directement concernés passaient isolément ; la commande G0 dédiée remplace cette tentative large.

## Anciennes priorités recommandées — désormais subordonnées à la roadmap

Ces idées restent pertinentes, mais ne sont plus le prochain chantier par défaut. Elles doivent être reprises seulement si elles entrent dans la Phase 1 — parcours Créatif candidat observé — ou dans une phase ultérieure validée par `ROADMAP_DIAGNOSTIC.md`.

- Enrichir le catalogue de fonctions IA nommées là où la donnée est fiable : transcription Premiere, Generative Fill, Canva Magic Studio, Figma AI, fonctions Lightroom, outils Maxon, etc.
- Tester visuellement la capture de fonction et la nouvelle section « AI read » sur mobile dans une session Phase 1 observée.
- Permettre plusieurs contrats simultanés dans une même famille lorsque les produits sont réellement financés par des payeurs ou formules différents.
- Remplacer progressivement le registre commercial codé en dur par les relations et plans du catalogue.
- Tester la synthèse globale sur des parcours combinant plusieurs productions créatives, pas seulement plusieurs objectifs d’une même production.

## Sujets encore perfectibles

- `toolUsageMap` reste conservé comme couche de compatibilité ; `workflowUsages` est la nouvelle vérité métier. Il faudra progressivement faire consommer cette dernière par tout le dashboard.
- La satisfaction est facultative. Il faudra décider à quels moments elle apporte assez de valeur pour être demandée sans allonger le parcours.
- La capacité IA est maintenant précise, mais elle reste générique. Le catalogue pourra ensuite fournir le nom commercial de la fonction réellement utilisée — Generative Fill, transcription Premiere, Denoise, Magic Design — sans rendre le moteur dépendant de ces noms.
- Les contraintes IA et leur effet économique sont reliés aux contrats, mais la consommation reste volontairement qualitative. Il faudra valider avec des utilisateurs si une mesure plus précise apporte assez de valeur pour justifier une question supplémentaire.
- Le modèle commercial sait regrouper les familles et les suites principales, mais une famille ne gère encore qu’un contrat actif dans l’interface. Les cas de plusieurs contrats simultanés chez le même fournisseur devront devenir des lignes distinctes.
- Les crédits, quotas et consommation variable ont une interface qualitative dédiée. Il reste à vérifier sur le terrain que ses quatre réponses sont comprises sans aide.
- Les configurations commerciales connues sont encore codées comme un registre. À terme elles doivent venir des données catalogue (`provider_id`, `commercial_family`, plans et inclusions) pour éviter de modifier le moteur.
- La qualité des branches dépend des `functional_needs`, `host_app` et outils réellement présents dans le catalogue.
- Le surdimensionnement reste principalement fondé sur prix, usage, palier et fit persona ; il pourra être enrichi par des critères métier plus fins.
- La couverture métier et la maturité restent partiellement fondées sur des catégories génériques ; elles doivent être confrontées à des stacks réelles avant recalibrage.
- Plusieurs écosystèmes reposent encore sur des overrides comme filet de sécurité lorsque `host_app` ou les relations manquent. Il faut continuer à normaliser le catalogue, puis réduire progressivement ces overrides.
- Le code historique des anciennes questions Créatif existe encore dans `DiagStep6Discovery.tsx`, mais n’est plus exécuté. Il peut être supprimé lors d’un nettoyage dédié.
- Quand un outil existant peut couvrir une zone déclarée vide, le moteur évite désormais d’en ajouter un autre. Il reste à transformer ce cas en action explicite du type « active cet usage dans ton outil actuel » dans la restitution.
- Les autres profils utilisent encore leur parcours générique fixe. L’architecture est compatible, mais la méthode adaptative ne doit leur être appliquée qu’après validation terrain du modèle Créatif.
- Le lint ciblé lancé après cette passe est resté bloqué sans sortie et a été interrompu ; TypeScript, les 120 tests, GO58, GO60 et le build production passent.

## Prochaine action recommandée

Préparer la Phase 1 — parcours Créatif candidat observé. Le premier travail n’est pas d’ajouter une nouvelle capacité moteur, mais de transformer les réserves P2 en protocole d’observation : moment contrat, IA hybride, outil inconnu, reprise de session, fatigue sur zones sautées et lisibilité des décisions finales. Les chantiers comme plusieurs contrats Adobe simultanés ou catalogue commercial source de vérité restent importants, mais doivent être priorisés à partir des observations Phase 1.

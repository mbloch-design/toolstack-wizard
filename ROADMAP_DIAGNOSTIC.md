# Tooltrim — Roadmap produit du diagnostic

> Version de référence : 20 juin 2026
> Démarrage opérationnel : 22 juin 2026
> Périmètre pilote : verticale Créatif
> Autorité : ce document décide de l’ordre des travaux. `AI_HANDOFF.md` conserve l’état opérationnel.

## 1. Décision de pilotage

Le développement fonctionnel au fil de l’eau est arrêté.

À partir du 22 juin 2026 :

- une seule phase produit peut être active ;
- chaque phase possède un objectif utilisateur, des livrables et une porte de sortie mesurable ;
- une amélioration intéressante mais extérieure à la phase retourne au backlog ;
- aucune nouvelle verticale n’est développée avant validation terrain du profil Créatif ;
- les fonctionnalités déjà construites sont considérées comme des hypothèses à valider, pas comme des acquis produit définitifs ;
- les dates donnent une direction, mais seule la validation d’une porte autorise la phase suivante.

## 2. Vision produit

Tooltrim doit aider un professionnel à comprendre sa chaîne de travail réelle et à prendre une décision fiable sur ses outils.

La valeur n’est pas :

- de compter les logiciels ;
- d’afficher un catalogue ;
- de reproduire les plans marketing des éditeurs ;
- de recommander systématiquement de nouveaux outils.

La valeur est :

1. comprendre ce que l’utilisateur produit ;
2. reconstruire comment il travaille réellement, y compris ses usages atypiques ;
3. identifier le rôle de chaque outil, fonction IA, plugin, ressource et service ;
4. relier les usages aux contrats qui les financent ;
5. repérer les frictions, risques, manques et chevauchements démontrables ;
6. réduire l’analyse à quelques décisions expliquées.

## 3. Cible pilote et promesse

### Cible pilote

Professionnels Créatif indépendants ou petites équipes produisant principalement :

- interfaces et produits numériques ;
- identité, illustration et édition ;
- photographie ;
- vidéo et motion ;
- 3D et espaces ;
- audio et contenus sociaux.

### Job principal

> « Aide-moi à reconstruire ma stack telle que je l’utilise réellement, puis dis-moi ce que je dois garder, clarifier, mieux exploiter ou remettre en question. »

### Promesse de la version Créatif

En moins de dix minutes, l’utilisateur obtient :

- une cartographie qu’il reconnaît comme la sienne ;
- une lecture de ses outils principaux et de leur écosystème ;
- une compréhension des fonctions IA réellement utilisées ;
- un budget séparant coûts confirmés et incertitudes ;
- trois décisions maximum, ordonnées et justifiées.

## 4. Indicateurs de succès

Ces valeurs sont des cibles de validation, pas des résultats actuellement mesurés.

### Indicateur principal

**Diagnostic actionnable :** part des utilisateurs terminant le parcours et capables de citer au moins une décision concrète qu’ils prendraient après la restitution.

Objectif de sortie bêta : **70 % ou plus**.

### Indicateurs du parcours

| Indicateur | Cible bêta Créatif |
|---|---:|
| Temps médian jusqu’au pré-verdict | ≤ 8 minutes |
| Diagnostics terminés en moins de 10 minutes | ≥ 80 % |
| Taux de complétion après choix du profil Créatif | ≥ 70 % |
| Utilisateurs jugeant la cartographie fidèle | ≥ 85 % |
| Utilisateurs signalant une question répétitive | ≤ 15 % |
| Sessions restaurées correctement après rechargement | 100 % des scénarios de recette |

### Indicateurs de confiance

| Indicateur | Cible |
|---|---:|
| Recommandations avec preuve lisible | 100 % |
| Contradictions score / risque / action dans les scénarios de référence | 0 |
| Double comptage d’un outil, contrat ou coût | 0 |
| Faux doublons application/plugin, bundle ou rôles IA distincts | 0 |
| Scénarios métier de référence sans régression | ≥ 95 % |

### Indicateurs de fatigue

| Indicateur | Cible |
|---|---:|
| Zones principales demandées par défaut | ≤ 6 |
| Clarifications commerciales répétées pour une même famille | 0 |
| Questions sans impact possible sur le diagnostic | 0 |
| Recommandations affichées pendant la cartographie | 0 |

## 5. État actuel classé

### Construit et à préserver

- entrée par la production réelle ;
- moteur adaptatif Créatif couvrant dix productions ;
- outil unique relié à plusieurs objectifs ;
- méthode manuelle, libre, atypique ou multi-outils ;
- écosystèmes dépendant de l’application hôte ;
- séparation cartographie / recommandation ;
- contrats regroupés par famille ;
- fonctions IA intégrées, séparées ou automatisées ;
- capacités IA, risques, quotas et coûts variables ;
- synthèse IA multi-objectifs ;
- sauvegarde et reprise de session ;
- pré-verdict, dashboard, actions et PDF.

### Construit mais non validé sur le terrain

- budget de six zones principales ;
- compréhension des libellés IA ;
- question qualitative sur les crédits ;
- densité de la revue commerciale ;
- lisibilité de la synthèse IA globale ;
- hiérarchie entre risque, coût et recommandation ;
- pertinence des trois décisions finales ;
- ajout et rattachement d’un outil inconnu.

### Partiel ou encore dépendant de règles codées

- plans Adobe, Maxon, Microsoft, Figma, Canva et Affinity ;
- plusieurs contrats dans une même famille ;
- fonctions IA nommées par application ;
- relations catalogue incomplètes compensées par des overrides ;
- `toolUsageMap` encore présent à côté de `workflowUsages` ;
- anciennes questions Créatif encore présentes dans le code historique.

### Vigilances de qualité

- anciens artefacts locaux de build ou de synchro peuvent ralentir un nettoyage récursif ; le build archive désormais `dist` et `dist-ssr` dans `.build-trash` avant reconstruction ;
- G0 produit accepté avec réserves le 29 juin 2026 après reprise complète G0-R1 à G0-R8 ;
- les P1 initiaux de G0-R1/G0-R2 puis les P1 découverts sur G0-R3 à G0-R8 ont été corrigés et protégés par tests ciblés ;
- la vigilance reste ouverte sur les fuites FR/EN, les contradictions score/verdict/risque, les budgets non confirmés et les conteneurs commerciaux proposés comme outils de workflow ;
- charge commerciale encore sensible quand des plugins ou compléments gratuits/freemium sont ajoutés.

## 6. Roadmap par phases

| Phase | Dates cibles | Résultat attendu | Porte |
|---|---|---|---|
| 0. Reprise de contrôle | 22–26 juin 2026 | Base mesurable et environnement fiable | G0 |
| 1. Parcours Créatif candidat | 29 juin–10 juillet 2026 | Capture courte, compréhensible et stable | G1 |
| 2. Vérité catalogue et commerciale | 13–24 juillet 2026 | Outils, suites, IA et coûts correctement reliés | G2 |
| 3. Diagnostic et restitution de confiance | 27 juillet–7 août 2026 | Verdict cohérent, expliqué et non répétitif | G3 |
| 4. Bêta privée Créatif | 10–28 août 2026 | Validation avec utilisateurs réels | G4 |
| 5. Créatif V1 | 31 août–11 septembre 2026 | Version exploitable et observable | G5 |
| 6. Extension des verticales | À partir du 14 septembre 2026 | Réutilisation du moteur sans réécriture | G6 |

## 7. Phase 0 — Reprise de contrôle

### Objectif

Obtenir une base de travail reproductible avant toute nouvelle fonctionnalité.

### Documents actifs

- Protocole G0 : `docs/diagnostic/PHASE0_G0_PROTOCOL.md`.
- Scénarios de référence : `docs/diagnostic/CREATIVE_REFERENCE_SCENARIOS.md`.
- Recette produit G0 : `docs/diagnostic/G0_PRODUCT_RECIPE.md`.
- Décision produit G0 : `docs/diagnostic/G0_PRODUCT_DECISION.md`.
- Recette jouée : `docs/diagnostic/G0_PRODUCT_RUN_2026-06-29.md`.
- Baseline G0 : `docs/diagnostic/G0_BASELINE_REPORT.md`.

### Décision du 29 juin 2026

G0 produit est accepté avec réserves.

La baseline technique passe. La recette navigateur locale a d’abord atteint deux seuils de refus :

- deux sessions avec P1 ;
- score moyen provisoire de `11,5/16`.

Un lot court de corrections P1 puis une reprise complète G0-R3 à G0-R8 ont levé les P1 ouverts. La moyenne post-correction est estimée à `13,5/16`.

Un lot court de corrections P1 a été appliqué le 29 juin 2026 :

- fuites FR/EN du parcours anglais et de la restitution ;
- contradiction score/verdict/fragilité sur petites stacks ;
- conteneurs commerciaux proposés comme outils de workflow ;
- budget confirmé en revue commerciale puis perdu en restitution.

La suite de la Phase 0 a été une reprise navigateur de G0-R1 à G0-R8.

Statut post-correction :

- G0-R2 Adobe a été rejoué en navigateur et passe les P1 ciblés observés ;
- G0-R1 Figma a été rejoué en navigateur et passe les P1 ciblés observés ;
- G0-R3 à G0-R8 ont été rejoués et documentés ;
- la restitution distingue maintenant “budget déclaré” et “budget à confirmer” quand le montant vient d’un prix catalogue ou d’un mode non clarifié ;
- G0 est accepté avec réserves ; la Phase 1 peut être préparée comme parcours Créatif candidat observé.

### Travaux autorisés

1. Rendre les tests et le build reproductibles hors des fichiers iCloud déchargés. **Fait le 29 juin 2026.**
2. Créer une commande de validation unique pour le diagnostic Créatif.
3. Établir une matrice de scénarios de référence versionnée.
4. Vérifier les événements déjà capturés et documenter les métriques disponibles.
5. Étiqueter le backlog selon la roadmap.
6. Déclarer les documents de référence et archiver les roadmaps obsolètes.
7. Corriger les P1 bloquants de G0 avant toute Phase 1. **Fait le 29 juin 2026.**
8. Rejouer G0-R3 à G0-R8 après correction avant tout nouveau lot fonctionnel. **Fait le 29 juin 2026.**

### Matrice minimale de référence

- UI avec Figma ;
- UI avec Sketch ;
- identité avec Illustrator et InDesign ;
- moodboard dans Illustrator ;
- devis dans InDesign ;
- photo avec Lightroom / Photoshop ;
- photo avec Capture One / Photoshop ;
- vidéo avec Premiere / After Effects ;
- 3D avec Blender ;
- 3D avec Cinema 4D / Redshift ;
- espaces avec SketchUp / LayOut / Enscape ;
- social avec Canva / CapCut / outil de publication ;
- IA intégrée + IA séparée ;
- suite Adobe avec plusieurs applications ;
- outil inconnu rattaché à un besoin ;
- sauvegarde, rechargement et reprise mobile.

### Hors périmètre

- nouvelle fonction IA ;
- nouveau moteur de scoring ;
- nouvelle verticale ;
- enrichissement général du catalogue ;
- refonte visuelle.

### Porte G0

La phase 1 ne démarre que si :

- la commande de validation diagnostique est documentée et reproductible ;
- TypeScript passe ;
- les scénarios de référence passent ;
- le build de production est exécutable dans un environnement sain ;
- les événements de début, progression, abandon et fin sont identifiés ;
- la roadmap est reconnue comme source de priorité.

Statut au 29 juin 2026 : porte G0 acceptée avec réserves. `npm run validate:g0` est vert après la mise à jour documentaire et le correctif de build.

## 8. Phase 1 — Parcours Créatif candidat

### Documents actifs

- Protocole Phase 1 : `docs/diagnostic/PHASE1_CREATIVE_CANDIDATE_PROTOCOL.md`.
- Grille d’observation : `docs/diagnostic/PHASE1_OBSERVATION_GRID.md`.
- Run pack actif : `docs/diagnostic/PHASE1_USER_RUN_2026-06-29.md`.
- Décision G1 autonome : `docs/diagnostic/PHASE1_G1_DECISION.md`.
- Garde-fou documentaire : `npm run validate:phase1`.

### Objectif

Valider que l’utilisateur comprend le parcours sans avoir à penser comme Tooltrim ou comme un éditeur logiciel.

### Statut du 29 juin 2026

La Phase 1 a été poussée en autonomie par replay proxy :

- cinq scénarios observés : UI, Brand, Photo, Vidéo et 3D ;
- Social/Audio et mobile non prouvés dans ce run ;
- deux P1 de confiance corrigés : verdict optimisé malgré prix incertain, email optionnel bloquant ;
- une friction commerciale réduite : plus de question “catalog pricing may be wrong” après mode commercial déclaré ;
- G1 autonome accepté avec réserves fortes ;
- G1 terrain non accepté tant que les six sessions modérées ne sont pas jouées.

### Questions auxquelles répondre

- L’entrée par la production suffit-elle à lancer la réflexion ?
- Les objectifs proposés correspondent-ils aux mots du métier ?
- L’utilisateur comprend-il qu’il décrit l’existant, pas une stack idéale ?
- Peut-il réutiliser un outil sans croire qu’il le sélectionne deux fois ?
- Le passage aux contrats arrive-t-il au bon moment ?
- Les zones secondaires sont-elles utiles ou perçues comme une rallonge ?

### Lots

#### 1A. Architecture du parcours

- Statut : replay proxy effectué, corrections P1 appliquées, validation terrain restante.
- figer le nombre maximal de zones principales ;
- supprimer toute question sans effet possible sur le diagnostic ;
- définir les règles de saut, reprise et modification ;
- stabiliser la distinction « rempli », « volontairement vide » et « inconnu ».

#### 1B. Langage utilisateur

- Statut : replay proxy effectué, P2 wording encore ouverts.
- réécrire les questions autour du résultat produit ;
- éliminer les formulations dépendant d’un logiciel ;
- tester les usages atypiques sans les présenter comme des anomalies ;
- rendre la méthode libre immédiatement compréhensible.

#### 1C. Charge cognitive

- Statut : replay proxy effectué, charge commerciale allégée mais zones sautées à rejouer.
- réduire les choix visibles ;
- éviter les sous-formulaires ouverts simultanément ;
- regrouper les précisions rares derrière une action secondaire ;
- préserver le contexte lors des retours en arrière.

### Validation

Tests modérés avec six utilisateurs :

- UI / produit ;
- identité / illustration ;
- photo ;
- vidéo / motion ;
- 3D / espaces ;
- social / audio.

### Porte G1

- temps médian du parcours ≤ 8 minutes ;
- au moins cinq utilisateurs sur six jugent la cartographie fidèle ;
- aucun utilisateur ne pense recevoir des recommandations pendant la capture ;
- aucun blocage critique sur mobile ;
- pas plus d’une question jugée répétitive par session ;
- les usages atypiques sont capturés sans correction automatique.

## 9. Phase 2 — Vérité catalogue et commerciale

### Statut du 30 juin 2026

Phase 2 passée en autonomie interne.

- G2 autonome accepté avec réserves.
- Plusieurs contrats dans une même famille sont supportés et protégés par tests.
- La revue commerciale garde un bloc fournisseur unique, avec plusieurs lignes d’accès si nécessaire.
- Les scénarios obligatoires Adobe Photography + app client, Creative Cloud employeur + plugin personnel, Figma équipe + Midjourney personnel, Canva Pro + Canva AI, Maxon One + Octane et outil gratuit + crédits variables sont couverts par tests.
- G1 terrain reste non validé : cette décision autorise la suite interne, pas une promesse de validation utilisateur.

### Objectif

Garantir qu’un outil, une fonction, un plugin, une suite et un contrat ont chacun une place claire.

### Lots

#### 2A. Grammaire catalogue

- rendre `provider_id`, `commercial_family`, `host_app`, type et relations fiables ;
- définir le schéma des fonctions IA intégrées ;
- documenter la stratégie d’un outil inconnu ;
- mesurer les overrides encore nécessaires.

#### 2B. Contrats multiples

- permettre plusieurs contrats dans une même famille ;
- rattacher chaque produit ou fonction au bon contrat ;
- gérer plusieurs payeurs ;
- éviter tout double coût ;
- garder une revue Adobe unique avec plusieurs lignes de financement.

#### 2C. Prix et fraîcheur

- distinguer montant confirmé, estimation, coût variable et inconnu ;
- exposer la date et la source des données tarifaires ;
- définir la politique de données obsolètes ;
- ne jamais bloquer le diagnostic faute de prix.

### Scénarios obligatoires

- Adobe Photography personnel + Illustrator payé par un client ;
- Creative Cloud employeur + plugin acheté personnellement ;
- Figma payé par l’équipe + Midjourney personnel ;
- Canva Pro + Canva AI incluse ;
- Cinema 4D + Maxon One + Octane séparé ;
- outil gratuit avec crédits payants ponctuels.

### Porte G2

- zéro double comptage dans les scénarios obligatoires ;
- plusieurs contrats d’une famille sont éditables et restaurés ;
- chaque capacité IA utilisée possède un statut d’accès ;
- les plans codés en dur sont soit supprimés, soit explicitement documentés comme fallback ;
- les outils inconnus n’interrompent jamais le parcours.

## 10. Phase 3 — Diagnostic et restitution de confiance

### Statut du 30 juin 2026

Phase 3 passée en autonomie interne.

- G3 autonome accepté avec réserves.
- La restitution principale est limitée à trois décisions maximum.
- `DashOverview`, `DashActions` et `DashPdfExport` utilisent une source de vérité commune pour les décisions.
- Les recommandations outil sans preuve lisible sont retirées des affichages et signalées par la calibration.
- Une friction sur un usage existant est traitée avant toute recommandation primaire d’un nouvel outil.
- La revue experte prévue par la roadmap G3 reste non effectuée ; cette décision autorise la suite interne, pas une validation métier terrain.

Documents actifs :

- Protocole Phase 3 : `docs/diagnostic/PHASE3_TRUSTED_RESTITUTION_PROTOCOL.md`.
- Décision G3 autonome : `docs/diagnostic/PHASE3_G3_DECISION.md`.
- Garde-fou documentaire : `npm run validate:phase3`.

### Objectif

Faire en sorte que score, constats, recommandations et actions racontent exactement la même histoire.

### Lots

#### 3A. Calibration

- établir les règles de priorité entre risque, friction, coût et manque ;
- définir quand Tooltrim doit rester prudent ;
- éviter les verdicts contradictoires ;
- calibrer les scores sur les scénarios de référence.

#### 3B. Recommandations

- exiger une preuve pour toute recommandation ;
- recommander l’activation d’un usage existant avant l’ajout d’un outil ;
- distinguer essai, migration, suppression et simple vérification ;
- limiter la restitution principale à trois décisions.

#### 3C. Restitution

- tester la lecture en trois minutes ;
- garder les détails comme preuves ou annexes ;
- dédupliquer acteurs, contrats, risques et actions ;
- rendre les incertitudes explicites sans affaiblir le verdict.

### Revue experte

Chaque scénario de référence est relu par au moins une personne connaissant le métier concerné.

### Porte G3

- zéro contradiction bloquante dans les scénarios de référence ;
- 100 % des recommandations possèdent une preuve ;
- maximum trois décisions dans le rapport principal ;
- aucune action répétée sous deux formulations ;
- les experts jugent au moins 80 % des décisions raisonnables sans correction majeure.

## 11. Phase 4 — Bêta privée Créatif

### Statut du 30 juin 2026

Phase 4A, 4B et 4C préparées et sécurisées en autonomie interne.

- Phase 4A prête pour recrutement.
- G4 non accepté : aucune session réelle Phase 4 n’a encore été jouée.
- Le protocole, le panel, la grille d’observation et la décision de préparation sont prêts.
- Un journal structuré des sessions et une évaluation G4 scriptable sont prêts.
- Des dry-runs internes couvrent Social/Audio, rendu restauré et payload PDF.
- Phase 4B ajoute le kit opérationnel de recrutement, modération, consentement, suivi vague 1 et relance.
- Phase 4C ajoute la couche opérations bêta : pipeline candidat privé, validation qualité des logs et synthèse de vague.
- Les réserves Social/Audio, mobile et revue experte métier restent ouvertes.
- La prochaine action produit est d’envoyer les invitations et d’observer de vrais créatifs, pas d’ajouter du code par défaut.

Documents actifs :

- Protocole Phase 4 : `docs/diagnostic/PHASE4_PRIVATE_BETA_PROTOCOL.md`.
- Panel de recrutement : `docs/diagnostic/PHASE4_RECRUITMENT_PANEL.md`.
- Grille d’observation : `docs/diagnostic/PHASE4_OBSERVATION_GRID.md`.
- Décision de préparation : `docs/diagnostic/PHASE4_G4_PREP_DECISION.md`.
- Journal des sessions : `docs/diagnostic/PHASE4_BETA_SESSIONS.json`.
- Décision de porte : `docs/diagnostic/PHASE4_G4_DECISION.md`.
- Kit recrutement : `docs/diagnostic/PHASE4B_RECRUITMENT_KIT.md`.
- Script session : `docs/diagnostic/PHASE4B_SESSION_SCRIPT.md`.
- Tracker vague 1 : `docs/diagnostic/PHASE4B_WAVE1_TRACKER.md`.
- Modèle session JSON : `docs/diagnostic/PHASE4B_SESSION_LOG_TEMPLATE.json`.
- Consentement : `docs/diagnostic/PHASE4B_CONSENT_AND_PRIVACY_BRIEF.md`.
- Messages de suivi : `docs/diagnostic/PHASE4B_FOLLOWUP_MESSAGES.md`.
- Protocole opérations bêta : `docs/diagnostic/PHASE4C_BETA_OPERATIONS_PROTOCOL.md`.
- Pipeline candidat vague 1 : `docs/diagnostic/PHASE4B_CANDIDATE_PIPELINE.json`.
- Modèle de synthèse vague 1 : `docs/diagnostic/PHASE4C_WAVE1_SYNTHESIS_TEMPLATE.md`.
- Garde-fou documentaire : `npm run validate:phase4`.
- Validation qualité sessions : `npm run validate:phase4:sessions`.
- Synthèse sessions : `npm run summarize:phase4`.
- Évaluation de porte : `npm run assess:g4`.

### Objectif

Valider le produit avec des stacks réelles, pas seulement avec des fixtures.

### Panel

Douze à dix-huit participants :

- 3 UI / produit ;
- 3 identité / illustration / édition ;
- 3 photo ;
- 3 vidéo / motion ;
- 3 3D / espaces ;
- 3 audio / social si le panel atteint dix-huit personnes.

Le panel doit mélanger :

- indépendants ;
- petites équipes ;
- stacks Adobe et non-Adobe ;
- utilisateurs IA intensifs et occasionnels ;
- utilisateurs connaissant mal leurs contrats.

### Protocole

1. Observation sans aide.
2. Entretien court sur les incompréhensions.
3. Notation de fidélité de la cartographie.
4. Lecture du verdict à voix haute.
5. Identification de la première décision envisagée.
6. Vérification manuelle de la stack et des coûts.

### Règle de tri des retours

- P0 : bloque la fin, perd des données ou produit une décision dangereuse ;
- P1 : fausse la cartographie ou la confiance ;
- P2 : ralentit ou crée une ambiguïté contournable ;
- P3 : préférence visuelle ou enrichissement.

Seuls P0 et P1 peuvent interrompre la bêta.

### Porte G4

- diagnostic actionnable ≥ 70 % ;
- fidélité perçue ≥ 85 % ;
- complétion ≥ 70 % ;
- temps médian ≤ 8 minutes ;
- zéro P0 ouvert ;
- moins de trois P1 ouverts ;
- les principaux abandons sont compris et instrumentés.

## 12. Phase 5 — Créatif V1

### Objectif

Rendre la version validée exploitable en production.

### Lots

- performance et poids du catalogue ;
- accessibilité clavier et mobile ;
- fiabilité sauvegarde / reprise ;
- observabilité et alertes ;
- cohérence dashboard, PDF et email ;
- politique de confidentialité des données saisies ;
- documentation support et récupération d’erreur ;
- nettoyage du code historique non exécuté.

### Porte G5

- build et tests fiables en CI ;
- aucun P0/P1 ouvert ;
- parcours mobile et desktop recettés ;
- suivi des abandons opérationnel ;
- PDF et reprise testés ;
- version Créatif déployable sans intervention manuelle.

## 13. Phase 6 — Extension à d’autres verticales

### Ordre proposé

1. Content ;
2. Tech ;
3. Conseil ;
4. Ops.

L’ordre peut changer selon les données d’acquisition, mais une seule verticale est ajoutée à la fois.

### Règle architecturale

Une nouvelle verticale doit être ajoutée par :

- productions ou résultats ;
- besoins ;
- poids de priorité ;
- vocabulaire ;
- données catalogue ;
- scénarios de validation.

Elle ne doit pas nécessiter :

- un nouveau moteur ;
- un nouvel arbre manuel par logiciel ;
- une nouvelle logique de contrats ;
- une nouvelle restitution.

### Porte G6

La verticale est acceptée si au moins 80 % de son comportement repose sur les primitives existantes et si aucune réécriture du moteur central n’est nécessaire.

## 14. Chantiers transverses

### A. Produit et UX

- questions métier ;
- fatigue ;
- reprise ;
- distinction cartographie / recommandation ;
- restitution actionnable.

### B. Moteur

- planification adaptative ;
- vérité `workflowUsages` ;
- scoring ;
- recommandations ;
- déduplication.

### C. Catalogue

- besoins ;
- relations ;
- écosystèmes ;
- IA intégrée ;
- sources et fraîcheur.

### D. Commercial

- familles ;
- contrats multiples ;
- payeurs ;
- inclusions ;
- coûts variables.

### E. Qualité

- scénarios métier ;
- tests ;
- navigateur ;
- calibration ;
- observabilité.

## 15. Règles de priorité

### P0 — Confiance ou sécurité

- perte de données ;
- crash ;
- coût compté deux fois ;
- recommandation dangereuse ;
- risque élevé masqué ;
- impossibilité de terminer.

### P1 — Fidélité du diagnostic

- mauvaise compréhension d’un usage ;
- outil ou contrat dupliqué ;
- question répétitive ;
- écosystème incorrect ;
- recommandation sans preuve ;
- verdict contradictoire.

### P2 — Fluidité

- friction UX contournable ;
- information secondaire difficile à trouver ;
- wording perfectible ;
- manque de couverture non critique.

### P3 — Enrichissement

- nouvelle fonction IA nommée ;
- nouvel écosystème ;
- nouveau détail tarifaire ;
- polish visuel ;
- nouveau profil avant G5.

## 16. Processus de décision pour chaque lot

Aucun lot ne commence sans une fiche contenant :

1. problème utilisateur observé ;
2. preuve ou scénario qui le démontre ;
3. résultat attendu ;
4. métrique affectée ;
5. dépendances ;
6. critères d’acceptation ;
7. tests à ajouter ;
8. éléments explicitement hors périmètre.

Une intuition non observée peut devenir une hypothèse de recherche, pas directement une fonctionnalité.

## 17. Cadence de travail

### Cycle hebdomadaire

- lundi : données, retours et choix du lot ;
- mardi : spécification et critères d’acceptation ;
- mercredi–jeudi : réalisation ;
- vendredi : tests, recette, mesure et décision de poursuivre ou corriger.

### Limite de travail en cours

- un lot produit principal ;
- un correctif P0/P1 éventuel ;
- aucun troisième chantier.

### Compte rendu obligatoire

À la fin de chaque lot :

- ce qui a été appris ;
- métrique ou scénario affecté ;
- tests exécutés ;
- dette créée ;
- décision pour le lot suivant.

## 18. Ce qui est gelé immédiatement

Jusqu’à la porte G1 :

- nouvelles verticales ;
- nouveaux modèles de scoring ;
- nouvelles catégories IA ;
- nouvelles branches d’écosystème non nécessaires aux scénarios de référence ;
- suivi précis des crédits ;
- redesign du dashboard ;
- enrichissement massif du catalogue ;
- fonctionnalités de croissance non liées à la mesure de la bêta.

## 19. Plan des cinq premiers jours

### Lundi 22 juin 2026

- déclarer cette roadmap comme référence ;
- créer la commande de validation Créatif ;
- inventorier les tests bloqués par l’environnement.

### Mardi 23 juin 2026

- figer les scénarios de référence ;
- associer chaque scénario à ses attentes métier ;
- inventorier les événements analytics disponibles.

### Mercredi 24 juin 2026

- rendre l’environnement de test reproductible ;
- établir le rapport de base : durée, étapes, abandon, complétion.

### Jeudi 25 juin 2026

- préparer le protocole des six premiers tests utilisateurs ;
- créer la grille d’observation et de notation.

### Vendredi 26 juin 2026

- exécuter la porte G0 ;
- décider explicitement si la phase 1 peut commencer ;
- ne développer aucune nouvelle fonctionnalité si G0 échoue.

## 20. Définition de « terminé »

Un lot n’est terminé que si :

- le comportement est implémenté ;
- les scénarios concernés passent ;
- la reprise de session est vérifiée si l’état change ;
- desktop et mobile sont vérifiés si l’interface change ;
- la restitution et le PDF sont vérifiés si le diagnostic change ;
- l’événement de mesure existe si le comportement doit être observé ;
- la documentation de référence est mise à jour ;
- aucune contradiction connue n’est reportée silencieusement au lot suivant.

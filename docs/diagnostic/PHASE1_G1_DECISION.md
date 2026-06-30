# Tooltrim — Décision G1 Phase 1, parcours Créatif candidat

> Date : 29 juin 2026
> Périmètre : Créatif uniquement
> Type de décision : replay autonome proxy, pas test utilisateur externe
> Run source : `docs/diagnostic/PHASE1_USER_RUN_2026-06-29.md`

## Décision

**G1 autonome : accepté avec réserves fortes.**

Le parcours Créatif candidat est assez cohérent pour poursuivre la roadmap en mode interne, à condition de ne pas prétendre que la validation utilisateur réelle est faite.

**G1 terrain : non accepté à ce stade.**

Il manque encore six sessions modérées avec de vrais créatifs, dont Social/Audio et au moins un petit écran. Le replay autonome a permis de trouver et corriger des P1 de confiance, mais il ne mesure pas la compréhension spontanée d’un utilisateur réel.

## Ce qui est réellement prouvé

- L’entrée par production fonctionne sur UI, Brand, Photo, Vidéo et 3D dans les replays proxy.
- Les outils ne sont pas traités comme des points de départ uniques : Figma, Adobe, Cinema 4D, Redshift, Lightroom, Photoshop et Premiere Pro sont reliés à des besoins et usages.
- Un même outil peut couvrir plusieurs usages sans duplication visible dans les cas rejoués.
- Les usages atypiques sont acceptés : devis dans InDesign, moodboards dans Illustrator.
- Les suites Adobe et Maxon sont globalement regroupées au niveau contrat.
- L’IA est reliée à des étapes de travail, pas seulement à une rubrique séparée.
- Les écosystèmes dépendent du bon hôte dans les replays observés.

## Ce qui a été corrigé pendant la Phase 1 autonome

### P1 — contradiction score / incertitude commerciale

Avant correction, le replay Photo pouvait afficher `100/100 Optimized` et “Healthy stack” tout en signalant un prix ou accès à préciser.

Correction appliquée :

- si au moins un prix, mode ou contrat reste à vérifier, le score santé est plafonné sous le seuil “Optimisée/Optimized” ;
- les vues pré-verdict, dashboard, export et insights héritent de ce score corrigé à la source.

Critère protégé :

- un diagnostic commercialement incertain ne peut plus se présenter comme optimisé.

### P1 — email optionnel bloquant la restitution

Avant correction, le replay Vidéo pouvait bloquer l’ouverture de la restitution quand la case “Send me a copy of the report” était cochée mais l’email vide, alors que l’interface disait que l’ouverture restait possible.

Correction appliquée :

- un email vide ne bloque plus l’ouverture ;
- un email invalide saisi reste bloquant uniquement si l’utilisateur demande réellement l’envoi d’une copie.

Critère protégé :

- l’email reste une option, jamais une barrière d’accès à la restitution.

### P2/P1 — question prix redondante après mode déclaré

Avant correction, la question “catalog pricing may be wrong” pouvait revenir après une réponse commerciale déjà donnée.

Correction appliquée :

- les questions commerciales adaptatives ne ciblent plus un outil dont le mode commercial est déjà déclaré (`free`, `paid`, `included`, `team`, etc.) ;
- elles restent actives si Tooltrim n’a qu’un prix catalogue ou un mode `unknown`.

Critère protégé :

- Tooltrim ne redemande pas un plan déjà clarifié au niveau outil ou contrat.

## Ce qui n’est pas encore prouvé

- P1-SocialAudio n’a pas été observé dans ce run Phase 1.
- Le petit écran/mobile n’a pas été validé dans ce run, car l’automatisation navigateur est devenue instable après changement de viewport.
- Les scores `/20` restent des scores proxy, pas des scores d’utilisateurs.
- La fatigue réelle, les verbatims et la compréhension spontanée ne peuvent pas être mesurés sans participants.

## P2 ouverts

- Remplacer les libellés techniques `tool(s)` / `1 tools` par du français/anglais naturel.
- Rendre la question sur zones sautées moins insistante quand l’utilisateur a déjà indiqué “non applicable”.
- Clarifier visuellement “IA intégrée”, “outil IA séparé” et “fonction incluse dans une suite”.
- Expliquer les montants estimés sans donner l’impression que Tooltrim connaît déjà la facture réelle.

## Autorisé après cette décision

En mode autonomie interne :

- démarrer la Phase 2 “vérité catalogue et commerciale” sur les points déjà prouvés ;
- garder Phase 1 ouverte pour rejouer Social/Audio, mobile et une reprise propre ;
- ne pas ouvrir Tech, Conseil, Content ou Ops ;
- ne pas prétendre que G1 terrain est validé.

En mode validation produit réelle :

- organiser les six sessions modérées prévues ;
- utiliser cette décision comme baseline de candidat corrigé ;
- accepter G1 terrain seulement si les métriques du protocole sont atteintes.

## Validation technique associée

Garde-fous ajoutés ou confirmés :

- score non optimisé si prix/accès à préciser ;
- question commerciale non répétée après mode déclaré ;
- email optionnel non bloquant quand vide.

Commandes à exécuter avant livraison :

- `npm run validate:phase1`
- `npm run validate:diagnostic`
- `npm run validate:g0`

## Décision finale

La Phase 1 autonome est considérée comme **traitée** pour la suite du travail interne : elle a permis de challenger l’orientation, observer cinq scénarios proxy, corriger les P1 de confiance et documenter les limites.

La Phase 1 utilisateur réelle reste **à jouer** si l’objectif est de revendiquer une validation terrain.

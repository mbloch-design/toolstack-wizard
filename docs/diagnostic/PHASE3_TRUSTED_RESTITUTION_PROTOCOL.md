# Tooltrim — Protocole Phase 3, diagnostic et restitution de confiance

> Statut : actif en autonomie interne
> Date d’ouverture : 30 juin 2026
> Périmètre : verticale Créatif uniquement
> Pré-requis : G2 autonome accepté avec réserves, sans revendiquer G1/G2 terrain.

## 1. Objectif Phase 3

Faire en sorte que score, constats, recommandations et actions racontent la même histoire.

Le diagnostic ne doit pas donner l’impression de “trouver des outils”. Il doit aider l’utilisateur créatif à savoir quoi décider maintenant, quoi vérifier, et quoi garder comme piste optionnelle.

## 2. Contrat de confiance

La restitution principale doit respecter cinq règles :

1. Trois décisions maximum.
2. Une preuve lisible pour chaque décision.
3. Aucune recommandation outil sans preuve métier.
4. Une étape existante à tester ou activer avant d’ajouter un outil.
5. Une seule formulation par même problème.

Les détails restent disponibles comme preuves ou annexes : budget, contrats, signaux IA, couverture métier, risques et options.

## 3. Hiérarchie de décision

Tooltrim doit prioriser dans cet ordre :

1. Risque bloquant ou confiance faible.
2. Doublon, coût ou contrat à arbitrer.
3. Friction déclarée dans une étape réelle.
4. Usage existant à mieux activer.
5. Piste outil optionnelle prouvée.

Une piste outil ne doit jamais remplacer une décision plus proche du workflow réel.

Exemple :

- Si l’utilisateur fait des interfaces dans InDesign et dit que ça fonctionne, Tooltrim ne corrige pas.
- Si l’utilisateur signale une friction, Tooltrim propose d’abord de tester/améliorer l’étape.
- Figma ou Sketch peuvent rester des pistes optionnelles seulement si le besoin et la preuve existent.

## 4. Règles de recommandation

Une recommandation est affichable uniquement si elle possède :

- le besoin concerné ;
- la raison métier ;
- le niveau de confiance ;
- une formulation qui explique qu’il s’agit d’un essai, pas d’un remplacement automatique.

Si la preuve manque, la recommandation est retirée de la restitution principale et la calibration doit signaler l’anomalie.

## 5. Règles de déduplication

Tooltrim doit éviter :

- un doublon IA affiché à la fois comme prescription et comme action workflow ;
- une friction métier et une recommandation outil pour le même besoin dans les trois décisions principales ;
- un même outil répété sous plusieurs formulations commerciales ;
- une piste “explorer X” sans expliquer le besoin couvert.

## 6. Implémentation Phase 3 autonome

Le lot autonome du 30 juin 2026 introduit :

- une source de vérité `buildDiagnosticDecisionPlan` ;
- un filtre `getProvenRecommendations` ;
- un plan d’action limité à trois décisions ;
- un overview branché sur le même plan que l’onglet actions ;
- un export PDF contenant les mêmes décisions principales ;
- une calibration qui signale les recommandations sans preuve ;
- des tests de restitution pour les décisions prouvées et les workflows atypiques avec friction.

## 7. Critères de validation autonome

- `npm run validate:phase3` passe ;
- `npm run validate:diagnostic` passe ;
- `npm run validate:g0` passe avant livraison ;
- les recommandations affichées ont une preuve ;
- le rapport principal contient trois décisions maximum ;
- les workflows atypiques ne sont pas corrigés automatiquement ;
- G1/G2 terrain restent explicitement non revendiqués.

# Missions — comment on travaille

Cadre posé le 14/11/2026. Une mission = un objectif produit, une branche, une mise en ligne.

## Le cycle d'une mission

| Étape | Ce qu'on produit | Qui décide |
|---|---|---|
| 1. Objectif | Une phrase : quel changement pour qui. Ce qui est hors périmètre. | Michael valide |
| 2. KPI | 2 à 4 indicateurs mesurables, avec leur valeur de départ et leur cible. Comment on les mesure. | Michael valide |
| 3. Réflexion | État des lieux factuel (captures, chiffres, docs existants), problèmes classés, hypothèses à vérifier. | Claude propose |
| 4. Conception | Le parcours cible écran par écran, les choix et leurs alternatives écartées, les maquettes Storybook. | Michael valide |
| 5. Plan de mise en œuvre | Lots ordonnés, chacun avec son critère « fini ». Tests à écrire. | Claude propose |
| 6. Réalisation | Commits sur une seule branche `mission/<nom>`. Rien n'est poussé en cours de route. | — |
| 7. Recette | Toute la CI en local, parcours vérifié dans le navigateur, KPI instrumentés. | Claude vérifie |
| 8. Mise en ligne | Un push, une PR, une fusion, sur accord explicite. | Michael donne le feu vert |
| 9. Bilan | KPI relevés 2 à 4 semaines après, décision : on garde, on ajuste, on retire. | Michael tranche |

On ne passe à l'étape 6 qu'avec les étapes 1, 2 et 4 validées.

## Règles de publication

- **Mission** : un seul push à la fin, quand l'objectif est atteint et vérifié.
- **Correctif** : uniquement pour un vrai bug visible en production. Branche `fix/<nom>`, push seul, avec accord.
- Les petits défauts trouvés en chemin partent avec la mission en cours.
- Jamais de push ni de fusion sans accord explicite.

## Définition de « fini »

- L'objectif est atteint sur le parcours réel, vérifié dans le navigateur (FR/EN, 390 et 1440 px).
- Toutes les étapes de la CI passent en local, y compris les tests de compte et la base de données.
- Les tests qui décrivent l'ancien comportement sont réécrits ou retirés dans la même branche.
- Les événements qui mesurent les KPI sont en place.
- Storybook à jour pour tout composant touché.

## Missions

| N° | Mission | État |
|---|---|---|
| M01 | [Ma stack : une page qui aide à décider](M01-ma-stack.md) | Cadrage — en attente de validation |

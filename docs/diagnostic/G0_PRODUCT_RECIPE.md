# Tooltrim — Recette métier G0

> Statut : actif
> Phase : 0 — Reprise de contrôle
> Périmètre : Créatif
> But : décider si la Phase 1 peut commencer sans repartir dans du développement au fil de l’eau.

## 1. Décision à prendre

Cette recette ne cherche pas à prouver que le parcours est parfait. Elle doit répondre à une question plus simple :

> Le diagnostic Créatif est-il assez stable, compréhensible et fidèle pour être testé avec des utilisateurs en Phase 1 ?

La réponse possible est :

- **G0 accepté** : on peut préparer les tests utilisateurs Phase 1 ;
- **G0 accepté avec réserves** : on peut préparer Phase 1, mais seulement avec une liste courte de corrections P0/P1 avant observation ;
- **G0 refusé** : on reste en Phase 0, car le parcours ne peut pas encore être observé proprement.

## 2. Règle de neutralité

Pendant cette recette, on ne corrige pas le produit en direct.

On note :

- ce que l’utilisateur voulait produire ;
- ce qu’il a compris ;
- où Tooltrim a été fidèle ;
- où Tooltrim a forcé une logique logiciel ;
- où une question a semblé répétitive ;
- où la partie plan / contrat a créé de la complexité ;
- où une recommandation est arrivée trop tôt ou sans preuve.

## 3. Pré-requis

Avant de démarrer :

- `npm run validate:g0` doit passer ;
- le testeur doit avoir la matrice `CREATIVE_REFERENCE_SCENARIOS.md` ouverte ;
- aucune nouvelle fonctionnalité ne doit être ajoutée pendant la recette ;
- les retours doivent être classés P0/P1/P2/P3 selon `ROADMAP_DIAGNOSTIC.md`.

## 4. Scénarios à jouer pour décider G0

La recette G0 ne rejoue pas les 18 scénarios en détail. Elle rejoue les huit scénarios qui couvrent les risques produit les plus importants.

| Session | Scénarios | Risque testé | Décision attendue |
|---|---|---|---|
| G0-R1 | CR-01 / CR-02 | même besoin, outils différents | Figma et Sketch restent deux réponses au même objectif |
| G0-R2 | CR-06 / CR-17 | suite Adobe et plans | Adobe est demandé une fois, sans ajouter les apps non utilisées |
| G0-R3 | CR-03 / CR-04 / CR-05 | usages atypiques | devis InDesign et moodboard Illustrator sont capturés sans jugement |
| G0-R4 | CR-10 / CR-11 / CR-12 | 3D et écosystèmes hôtes | Blender, Cinema 4D, Redshift, Octane et plugins ne se mélangent pas |
| G0-R5 | CR-14 | social, templates, IA, publication | Canva et CapCut couvrent leurs vrais rôles sans duplication |
| G0-R6 | CR-15 | IA transversale | IA intégrée et IA séparée sont reliées à l’objectif, pas comptées deux fois |
| G0-R7 | CR-16 | outil inconnu | l’outil libre est accepté, rattaché au besoin courant et marqué incertain |
| G0-R8 | CR-18 | reprise | la session revient sans perdre productions, usages, IA, contrats et couverture |

## 5. Script d’observation

Pour chaque session :

1. lancer le parcours Créatif ;
2. choisir la production réelle correspondant au scénario ;
3. verbaliser la tâche comme un utilisateur la dirait ;
4. sélectionner ou saisir les outils réellement utilisés ;
5. ajouter un usage libre si le scénario est atypique ;
6. préciser l’IA uniquement à l’étape où elle intervient ;
7. aller jusqu’à la revue commerciale ;
8. vérifier si les contrats sont regroupés au bon niveau ;
9. ouvrir le pré-verdict puis la restitution ;
10. noter la première décision proposée par Tooltrim.

## 6. Grille de notation

Chaque session reçoit une note de 0 à 2 sur huit dimensions.

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Entrée par production | l’utilisateur pense devoir choisir un logiciel | ambigu | clair |
| Langage métier | jargon ou mauvais besoin | partiel | naturel |
| Outil multi-usage | duplication ou confusion | visible mais fragile | compris |
| Usage atypique | corrigé ou jugé | accepté mais peu clair | capturé comme fait |
| IA dans le flux | absente ou séparée artificiellement | partielle | liée à l’objectif |
| Écosystème hôte | mauvais plugins ou mauvais host | incomplet | cohérent |
| Contrats / plans | répété ou bloquant | compréhensible mais lourd | regroupé et fluide |
| Restitution | générique ou contradictoire | utile mais confuse | reconnaissable et actionnable |

Score maximum par session : 16.

## 7. Seuils G0

| Résultat | Décision |
|---|---|
| Une session contient un P0 | G0 refusé |
| Deux sessions ou plus contiennent un P1 | G0 refusé |
| Une session contient un P1 isolé, mais contournable | G0 accepté avec réserves |
| Score moyen inférieur à 12/16 | G0 refusé |
| Score moyen entre 12 et 14/16 | G0 accepté avec réserves |
| Score moyen supérieur ou égal à 14/16, zéro P0, maximum un P1 | G0 accepté |

## 8. Définitions P0/P1 appliquées à la recette

### P0 — bloque G0

- impossible de terminer ;
- perte de données à la reprise ;
- outil ajouté deux fois avec deux coûts ;
- recommandation dangereuse ou sans preuve ;
- plan Adobe / Maxon / Figma demandé plusieurs fois au point de bloquer ;
- IA incluse comptée comme abonnement séparé alors qu’elle est déclarée incluse.

### P1 — peut bloquer G0 si répété

- question répétitive ;
- mauvais écosystème proposé ;
- usage atypique reformulé comme erreur ;
- confusion cartographie vs recommandation ;
- outil inconnu mal rattaché ;
- suite commerciale qui ajoute des apps non utilisées ;
- restitution qui ne raconte pas la stack réelle.

## 9. Fiche de résultat par session

À copier pour chaque session :

```md
### G0-RX — titre

- Date :
- Testeur :
- Scénarios couverts :
- Production choisie :
- Stack déclarée :
- Score : /16
- P0 :
- P1 :
- P2/P3 :
- Première incompréhension :
- Moment de fatigue :
- Contrat ou plan problématique :
- Restitution reconnue ? oui / partiel / non
- Première décision proposée :
- Décision session : PASS / PASS avec réserve / FAIL
```

## 10. Décision finale G0

À la fin des huit sessions, remplir :

```md
## Décision G0 produit

- Score moyen :
- Nombre de P0 :
- Nombre de sessions avec P1 :
- Scénarios non joués :
- Décision : accepté / accepté avec réserves / refusé
- Conditions avant Phase 1 :
- Lot Phase 1 proposé :
```

## 11. Ce qu’il ne faut pas faire pendant cette recette

- Ajouter un outil au catalogue pour “faire passer” un scénario.
- Réécrire une question sans avoir noté le problème.
- Corriger un plan commercial avant d’avoir identifié le niveau de contrat.
- Transformer un usage atypique en recommandation automatique.
- Ouvrir une nouvelle verticale.
- Ajouter une nouvelle catégorie IA.

## 12. Sortie attendue

La recette G0 produit doit produire un seul artefact de décision :

- `G0_PRODUCT_DECISION.md` si la recette est jouée ;
- ou une note explicite indiquant pourquoi elle ne peut pas être jouée.

Sans cet artefact, la Phase 1 ne doit pas démarrer.

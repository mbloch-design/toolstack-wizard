# GO54-GO56 - Continuité rapport vers action

## Intention UX

Après la restitution, l'utilisateur ne doit pas tomber dans un tableau de tâches froid. Il doit comprendre :

- quelle action traiter en premier ;
- pourquoi cette action est proposée ;
- où retrouver la preuve dans le diagnostic ;
- quand le prix est fiable, et quand il doit être vérifié.

## Changements livrés

- Ajout d'une carte "Prochaine action utile" en haut du plan d'action.
- Chaque action affiche maintenant une justification courte issue du diagnostic.
- Les actions peuvent renvoyer vers l'onglet de preuve pertinent : vue d'ensemble, gaspillage, stack ou optimisation.
- Le suivi de progression est basé sur les actions réellement cochées, pas sur un faux total financier.
- L'état persisté passe en `v2` avec une politique explicite : `source_currency_or_verify`.
- Les gains liés à un plan ou une devise incertaine sont affichés comme `gain à vérifier`.

## Décision produit

ToolTrim ne doit pas inventer une économie certaine si l'utilisateur a indiqué un plan incertain, une devise manquante ou un prix catalogue. Le plan d'action peut prioriser, mais il doit rester honnête sur le niveau de preuve.

## Validation

Commande ajoutée :

```bash
npm run validate:go54
```

Elle vérifie que :

- le plan expose une prochaine action claire ;
- les actions expliquent leur raison d'être ;
- la progression ne promet pas un potentiel financier sécurisé ;
- la persistance ne stocke plus de totaux mixtes comme vérité ;
- les prix incertains sont traités comme un point à vérifier.

## Recette préprod

Une recette navigateur sur `https://preprod.tooltrim.com/fr/selector` a aussi fait ressortir trois ajustements UX :

- le CTA `Passer cette zone` pouvait faire croire à une boucle, car il avançait sans marquer la zone comme volontairement vide ;
- dans les questions utiles, le focus navigateur pouvait rester sur une option et ressembler à une réponse déjà choisie ;
- le libellé `Voir la preuve` était trop fort pour une piste optionnelle.

Corrections apportées :

- une zone vide utilise maintenant le même chemin explicite que `Je n’utilise rien ici` ;
- les questions utiles replacent le focus sur le titre de la nouvelle question ;
- les pistes optionnelles parlent de `contexte`, pas de preuve.

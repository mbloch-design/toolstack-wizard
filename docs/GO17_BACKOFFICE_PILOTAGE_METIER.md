# GO17 - Back-office pilotage metier

## Objectif

GO17 transforme le back-office en file de decision operationnelle. Les sessions ne sont plus seulement listees: elles sont classees par urgence, valeur economique, risque qualite, incident email et besoin de relance.

## Decisions couvertes

- `email` : job echoue ou rapport non envoye.
- `quality` : calibration incertaine, confiance basse, flag critique ou session non recalibree.
- `recovery` : tunnel abandonne ou encore actif.
- `value` : economie potentielle elevee.
- `watch` : session sans alerte majeure.

## Score de priorite

Le score combine :

- gaspillage mensuel estime ;
- score sante bas ;
- incident email ;
- revue humaine conseillee ;
- flags de calibration ;
- tunnel abandonne ou en cours ;
- persona incertaine ou hybride.

Le back-office affiche ensuite les niveaux `critical`, `high`, `medium` et `low`.

## Back-office

Un nouvel onglet `Pilotage` devient l'entree principale du back-office. Il affiche :

- priorites critiques ;
- priorites hautes ;
- sessions a revue humaine ;
- relances tunnel ;
- valeur economique mensuelle ;
- file de decision triee avec raisons et action conseillee.

L'export CSV `tooltrim-backoffice-pilotage` permet de traiter la file hors outil si besoin.

## Verification

Commande cible :

```bash
npm run test:go17 -- --environment node
```

# GO14 - Banc de recette metier

## Objectif

GO14 met en place un banc de recette metier rejouable pour verifier que le moteur diagnostic reste coherent quand on fait evoluer scoring, tunnel, insights, calibration et restitution.

Le but est de detecter une regression produit avant production, pas seulement une regression technique.

## Ce qui est inclus

- jeu de scenarios metier par persona (`THEO`, `SOFIA`, `MARC`, `ALIX`, `CLAIRE`) ;
- catalogue d'outils de reference minimal mais representatif ;
- regles de doublons et questions discovery dediees au banc de recette ;
- attentes explicites par scenario :
  - plage de score sante ;
  - profil / maturite attendus ;
  - economie annuelle attendue ;
  - confiance minimale ;
  - calibration (`reviewRequired`) ;
  - signaux et risques attendus.

## Fichiers

- [go14Fixtures.ts](/Users/mbloch/Documents/New%20project/src/test/diagnostic/go14Fixtures.ts)
- [go14.diagnostic.spec.ts](/Users/mbloch/Documents/New%20project/src/test/diagnostic/go14.diagnostic.spec.ts)

## Execution

Commande dediee :

```bash
npm run test:go14
```

## Pourquoi ce format

Le banc GO14 cible le coeur produit (`runDiagnostic`) avec des attentes metier stables. Cela permet :

- de proteger la roadmap des regressions silencieuses ;
- d'accelerer les iterations scoring sans perte de lisibilite ;
- d'alimenter ensuite des checks back-office et deploiement avec des cas de reference partages.

# GO21 - Recette end-to-end

## Objectif

GO21 ajoute une recette transverse qui verifie le chainage metier : diagnostic, qualite email, pilotage back-office et alerte admin.

## Scenario couvert par le test

1. Une session completee a forte valeur et email en erreur est creee en fixture.
2. Le pilotage GO17 la classe en priorite `email`.
3. Le controle GO16 valide qu'un email correct passerait la quality gate.
4. Le digest GO19 remonte la session dans les alertes admin.

## Commande

```bash
npm run test:go21 -- --environment node
```

Cette recette ne remplace pas une recette navigateur complete, mais elle protege le coeur fonctionnel du tunnel operations.

# GO22 - Polish UI/UX back-office

## Objectif

GO22 finalise l'ergonomie du back-office pour une utilisation quotidienne : l'onglet Pilotage devient plus lisible, plus filtrable et plus confortable sur petits ecrans.

## Ajustements

- Les onglets peuvent revenir a la ligne sur mobile.
- La file Pilotage a deux filtres directs :
  - type de decision : email, qualite, relance, valeur, suivi ;
  - niveau de priorite : critical, high, medium, low.
- L'export CSV Pilotage respecte les filtres actifs.
- Les tableaux conservent leur overflow horizontal, sans casser la mise en page.

## Verification UI

Le serveur local ne peut pas toujours etre lance dans le sandbox courant. La verification faite ici repose donc sur :

- typage TypeScript ;
- build Vite ;
- tests de recette ;
- inspection code responsive.

Avant de livrer en production, ouvrir le back-office en large desktop, tablette et mobile pour verifier :

- lisibilite des badges ;
- absence de chevauchement ;
- acces aux filtres ;
- ouverture du panneau detail ;
- export CSV depuis chaque onglet.

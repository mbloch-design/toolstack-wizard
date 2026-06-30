# GO51-GO53 — Restitution plus claire

## Objectif

La restitution doit etre percue comme un rapport guide, pas comme un dashboard SaaS a explorer. L'utilisateur doit comprendre en moins de trois minutes :

1. ce que ToolTrim a compris ;
2. quelle premiere decision prendre ;
3. quelles preuves soutiennent le verdict ;
4. quels montants ou modes d'usage restent a verifier.

## GO51 — Rapport guide

- Ajout d'un chemin de lecture en trois temps en haut du rapport.
- La synthese garde la logique : contexte, verdict, premiere decision, preuves.
- Les chiffres restent secondaires.

## GO52 — Prix et confiance

- Le rapport affiche un bloc dedie quand des prix, modes d'usage ou montants variables restent incertains.
- Les outils concernes sont visibles avec leur statut : prix catalogue, mode a verifier, montant a preciser.
- Le verdict et le budget ne sont plus melanges.

## GO53 — Annexes

- La navigation de restitution separe le rapport principal des annexes.
- Les vues detaillees sont utiles pour verifier, pas obligatoires pour comprendre.

## Recette

1. Lancer `npm run validate:go51`.
2. Lancer `npm run validate:go49` et `npm run validate:go50`.
3. Lancer `npx tsc --noEmit`.
4. Lancer `npm run build`.
5. En preprod, terminer un diagnostic avec :
   - au moins un outil a abonnement ;
   - un outil gratuit ;
   - un mode d'usage incertain ;
   - un outil ajoute manuellement avec montant estime.

Le rapport final doit faire apparaitre la lecture en 3 minutes et le bloc prix a confirmer.

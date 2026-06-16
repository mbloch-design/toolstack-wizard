# GO62 — Routage créatif par spécialité

Objectif : sortir du persona créatif trop généraliste. Un designer UI, une DA marque, un motion designer, un photographe et un studio créa n'ont pas le même parcours, pas les mêmes oublis probables et pas les mêmes outils périphériques.

## Décision produit

On garde une entrée simple : l'utilisateur choisit d'abord son profil, puis seulement si le profil est créatif, il choisit son métier dominant.

Spécialités ajoutées :

- Identité / direction artistique
- UI / produit
- Motion / vidéo
- Photo / retouche
- Contenu social
- Illustration / 3D
- Studio / ops créa

## Impact tunnel

La spécialité est persistée dans la session via primarySpecialty. Elle modifie ensuite :

- l'ordre des zones de capture de stack ;
- le ranking des suggestions ;
- la remontée des outils périphériques, plugins, add-ons, fonts, mockups, validation client, droits et mesure.

## Pourquoi

La valeur de ToolTrim ne doit pas être de retrouver seulement Figma, Canva ou Adobe. Elle doit faire émerger les outils satellites et les modes d’usage réellement oubliés : plugins Figma, extensions After Effects, gestion de fonts, banques d’assets, droits, review client, retouche, livraison et mesure.

## Validation

- npm run validate:go58
- npm run validate:go62
- npx tsc --noEmit
- npm run build

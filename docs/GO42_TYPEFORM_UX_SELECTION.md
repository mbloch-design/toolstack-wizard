# GO42 - UX Typeform du selecteur de stack

## Objectif

Rendre le selecteur guide plus fluide et moins dense visuellement.

La logique GO37-GO41 a ajoute une couverture intelligente par moments de travail. GO42 change la presentation pour se rapprocher des principes qui rendent Typeform efficace :

- une question principale a la fois ;
- progression claire ;
- logique conditionnelle implicite ;
- moins de bruit visuel ;
- revue finale avant continuation ;
- recherche globale uniquement quand l'utilisateur en a besoin.

## Changements UX

### 1. Question active d'abord

L'ecran principal se concentre sur une seule zone :

```text
Quels assistants IA ou outils de recherche utilises-tu vraiment ?
```

Les suggestions sont limitees a la zone active. L'utilisateur choisit, passe a la question suivante, ou indique qu'il n'est pas concerne.

### 2. Catalogue secondaire

Le catalogue complet n'est plus visible par defaut. Il est accessible via :

```text
Chercher un outil
```

Cela evite l'effet liste interminable et garde l'utilisateur dans le flux conversationnel.

### 3. Revue avant scoring

Avant de passer au profil, l'utilisateur voit :

- le nombre d'outils retenus ;
- les zones couvertes ;
- le niveau de confiance ;
- les zones non verifiees ;
- les outils selectionnes.

Il peut revenir corriger un oubli avant de confirmer.

### 4. Progression douce

La progression n'est pas seulement un compteur technique. Elle indique la couverture de la stack :

```text
4/10 zones verifiees
```

## Critere UX

Le premier ecran doit maintenant ressembler a un assistant qui pose une question utile, pas a un outil d'administration.

Un utilisateur doit pouvoir :

1. choisir quelques outils suggérés ;
2. passer les zones non pertinentes ;
3. chercher un outil absent seulement si besoin ;
4. revoir sa stack ;
5. confirmer sans anxiete.

## Recette

Tester sur preprod :

```text
https://preprod.tooltrim.com/fr/selector
```

Verifier :

- le catalogue n'apparait pas par defaut ;
- la question active est claire ;
- "Pas concerne" avance bien ;
- "Revoir ma stack" ouvre la synthese ;
- un clic sur une zone de revue ramene au bon moment ;
- "Confirmer et continuer" passe bien au profil detecte ;
- `npm run validate:go28` passe apres un diagnostic complet.

# GO73 - Continuité du tunnel

## Problème traité

Un changement d'étape ne doit pas seulement remplacer le contenu à l'écran. Il doit
repositionner l'utilisateur au début de la nouvelle demande, annoncer le nouveau
contexte aux technologies d'assistance et conserver une sortie rassurante.

## Décisions

- Remonter au début de page à chaque étape visible.
- Déplacer le focus sur le nouveau contenu sans provoquer un second scroll.
- Annoncer le nom de l'étape dans une zone `aria-live`.
- Préciser que quitter le diagnostic conserve la progression.
- Ne pas toucher à la persistance et à la reprise existantes.

## Critère de réussite

Après chaque clic sur Continuer ou Retour, l'utilisateur comprend immédiatement
qu'une nouvelle demande commence, y compris au clavier ou avec un lecteur d'écran.

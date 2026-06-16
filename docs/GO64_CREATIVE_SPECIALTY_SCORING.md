# GO64 — Creative specialty scoring

## Objectif

GO62/GO63 faisaient comprendre au tunnel et à la restitution la spécialité créative choisie. GO64 relie cette information au moteur de score, pour éviter une lecture créative trop générique.

## Ce qui change

- Chaque spécialité créative expose une liste d’outils et de mots-clés à protéger/prioriser.
- Le score de pertinence reçoit maintenant la spécialité créative quand le persona est SOFIA.
- Les recommandations peuvent inclure des plugins, outils spécialisés et périphériques métier quand ils sont cohérents avec la spécialité.
- Les signaux d’onboarding gardent l’angle de lecture dans le résultat final.
- Les swaps de la restitution utilisent le même scoring spécialisé.

## Pourquoi c’est important

Un créatif UI, motion, photo ou studio n’a pas la même périphérie utile. L’objectif est d’éviter de sous-noter un plugin, un preset, un outil de review ou une ressource métier simplement parce que ce n’est pas un gros logiciel évident.

## Validation

`npm run validate:go64`

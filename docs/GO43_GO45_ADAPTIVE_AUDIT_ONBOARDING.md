# GO43-GO45 - Onboarding d'audit adaptatif

## Objectif

Transformer le tunnel ToolTrim en experience d'audit guide :

1. l'utilisateur comprend ou il est ;
2. il voit sa stack se construire ;
3. seules les questions qui changent le verdict apparaissent.

Cette passe applique la strategie GO42 : **adaptive guided audit onboarding**.

## GO43 - Histoire du tunnel

La progression cote utilisateur raconte maintenant :

1. **Calibrage** : on comprend le profil et l'objectif.
2. **Stack** : on capture les outils reels.
3. **Questions utiles** : on verifie seulement ce qui change le verdict.
4. **Lecture** : on prepare la comprehension avant le rapport.
5. **Restitution** : on livre l'histoire et le plan.

Changement de posture :

- on parle d'**audit guide** plutot que de diagnostic formulaire ;
- le mot **dashboard** disparait des CTA utilisateur ;
- la fin du parcours annonce une **restitution**, pas un espace complexe a explorer.

## GO44 - Stack builder vivant

La selection d'outils gagne un bandeau stable :

- toujours visible dans la carte principale ;
- hauteur fixe pour eviter les sauts de layout ;
- logos de la stack captee ;
- budget mensuel avec devise source ;
- feedback texte quand un outil est ajoute ;
- rappel de la zone en cours.

Intention UX :

> L'utilisateur doit sentir que sa stack prend forme sous ses yeux, pas qu'il coche une liste.

Ce bandeau complete le panneau lateral. Il sert surtout aux utilisateurs qui gardent les yeux sur la question active.

## GO45 - Questions adaptatives

L'etape de verification genere maintenant des questions depuis la stack :

- plusieurs outils IA selectionnes ;
- prix ou plan encore estimes ;
- outil avec version gratuite ou palier inferieur ;
- plusieurs zones sautees.

Les questions adaptatives passent avant les questions catalogue, avec une limite courte.

Elles sont aussi conservees dans la session pour etre relues par le moteur de scoring. Une reponse utilisateur devient donc un signal de diagnostic, pas seulement un feedback d'interface.

Principe :

> Si une question ne change pas le verdict, elle ne doit pas etre posee.

Exemples :

- "Tu as plusieurs outils IA. Comment les utilises-tu vraiment ?"
- "Pour ces outils, le prix catalogue peut etre faux pour toi. Tu es sur quel cas ?"
- "Tu as passe plusieurs zones sans outil. C'est bien volontaire ?"

Chaque question explique pourquoi elle existe.

## Recette UX

Tester un diagnostic complet sur preprod.

Verifier :

- la barre haute raconte bien calibrage -> stack -> questions -> lecture -> restitution ;
- l'ajout d'un outil donne un feedback visible sans deplacer les cartes ;
- la stack reste visible meme si le panneau lateral n'est pas regarde ;
- le passage a une nouvelle zone remet la recherche a zero ;
- les questions apres la selection semblent justifiees ;
- le CTA final parle de restitution, pas de dashboard ;
- la restitution reste accessible sans email obligatoire.

## Recette technique

Commandes locales :

```bash
npx tsc --noEmit
npx vitest run src/test/diagnostic/go14.diagnostic.spec.ts
npm run build
```

Commandes preprod apres deploiement :

```bash
npm run validate:preprod-app
npm run validate:preprod-write
npm run validate:preprod
npm run validate:go28
```

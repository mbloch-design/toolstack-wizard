# GO28 - Recette utilisateur end-to-end

## Objectif

GO28 valide le parcours reel ToolTrim sur preprod : utilisateur, diagnostic, restitution, email, back-office et donnees capturees.

## Pre-requis

- `npm run validate:preprod-app` passe.
- `npm run validate:preprod` passe avec `warnings: 0`.
- La preprod Vercel est accessible.
- Le chemin d'ecriture diagnostic passe :

```bash
npm run copy:go28-rls-sql
npm run validate:preprod-write
```

Le premier script copie le SQL GO28. Il faut le coller dans le SQL Editor Supabase puis cliquer sur Run avant de relancer la validation.

## Parcours utilisateur

1. Ouvrir la preprod :

```text
https://preprod.tooltrim.com/fr
```

2. Lancer un diagnostic complet.
3. Utiliser un email preprod/test.
4. Aller jusqu'a la restitution finale.

La validation GO28 attend une session **terminee** : il faut arriver au dashboard de resultat final, pas seulement ouvrir le tunnel ou quitter pendant les questions.

## Points a verifier dans l'interface

- onboarding clair ;
- questions coherentes avec le persona ;
- stack/outils bien captures ;
- score visible et comprehensible ;
- recommandations exploitables ;
- restitution mobile et desktop lisible ;
- aucun blocage de navigation.

## Points a verifier en back-office

- session visible ;
- email et persona presents ;
- contexte onboarding present ;
- stack/profile/risques renseignes ;
- restitution presente ;
- email job cree ;
- actions ou notes admin modifiables si besoin.

## Checks techniques apres parcours

```bash
npm run validate:preprod
npm run validate:preprod-write
npm run validate:go28
```

Si le diagnostic a ete fait il y a plus de 2 jours :

```bash
GO28_DAYS=7 npm run validate:go28
```

Option worker email seulement sur queue controlee :

```bash
npm run validate:preprod -- --email-worker
```

## Gate GO28

GO28 est valide si :

- le diagnostic complet aboutit ;
- la session remonte en back-office ;
- les donnees utiles sont capturees ;
- la restitution correspond au parcours ;
- aucun warning bloquant n'apparait ;
- les validations GO26/GO27 restent vertes.

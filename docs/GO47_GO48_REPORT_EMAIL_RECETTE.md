# GO47-GO48 - Rapport guide et email coherent

Objectif du bloc 1 : verrouiller la nouvelle restitution comme experience principale, puis aligner l'email sur la meme histoire.

## GO47 - Recette preprod du rapport

Le rapport final doit etre compris comme une lecture guidee :

1. ce que ToolTrim a compris ;
2. le verdict ;
3. la premiere decision ;
4. les preuves ;
5. les annexes.

La restitution dashboard stocke maintenant des metadonnees explicites :

- `report_pattern = guided_report`
- `report_sections`
- `currency_policy = source_currency_or_verify`
- `understood_context`

Commande de verification :

```bash
npm run validate:go47
```

Important : cette validation attend une session terminee apres deploiement GO47. Si elle echoue sur une ancienne session, refaire un diagnostic complet en preprod puis relancer.

## GO48 - Email de restitution

L'email ne doit plus etre une promesse comptable basee sur des montants agreges fragiles. Il doit prolonger le rapport :

- sujet clair : verdict + premiere decision ;
- bloc "ce que j'ai compris" ;
- bloc "premiere decision" ;
- CTA "Lire mon rapport" ;
- pas de conversion arbitraire en euros ;
- gains presentes comme potentiel a verifier quand la devise/le plan ne sont pas certains.

Le template email passe en :

```txt
go48-guided-email-v2
```

Commande de verification :

```bash
npm run validate:go48
npm run test:go16
```

## Recette preprod recommandee

1. Deployer l'app et les Edge Functions.
2. Completer un diagnostic avec email en preprod.
3. Lancer :

```bash
npm run validate:preprod-app
npm run validate:preprod
npm run validate:go47
npm run validate:go48
```

4. Si un email doit vraiment partir, lancer explicitement :

```bash
npm run validate:preprod -- --email-worker
```

Le worker email peut envoyer des emails reels, donc il reste volontairement hors recette automatique.

# GO26 - Recette preprod live

## Objectif

GO26 valide la preprod reelle apres merge/deploiement : Supabase, RLS, vues back-office, Edge Functions, alertes admin et worker email.

## Script ajoute

```text
scripts/validate-preprod.mjs
```

Commande :

```bash
npm run validate:preprod
```

Le script charge automatiquement `.env.preprod` si le fichier existe. Sinon, il lit les variables exportees dans le shell.

## Variables requises

Voir `.env.preprod.example`.

Minimum pour la recette :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `BACKOFFICE_ADMIN_KEY`
- `BACKOFFICE_ALERT_WORKER_KEY`
- `DIAGNOSTIC_EMAIL_WORKER_KEY`

Optionnel mais conseille :

- `PREPROD_APP_URL`
- `TOOLTRIM_APP_URL`

## Checks executes

Par defaut, le script verifie :

1. l'app preprod repond si `PREPROD_APP_URL` ou `TOOLTRIM_APP_URL` existe ;
2. `anon` peut lire le catalogue public `tools` ;
3. `anon` ne peut pas lire `vw_backoffice_diagnostic_sessions` ;
4. `anon` ne peut pas lire `vw_backoffice_email_health` ;
5. `anon` ne peut pas inserer dans `tools` ;
6. `backoffice-diagnostic` refuse une requete sans admin key ;
7. `backoffice-diagnostic` accepte une requete avec `BACKOFFICE_ADMIN_KEY` ;
8. `service_role` peut lire les vues back-office ;
9. `send-backoffice-alerts` fonctionne en `dryRun`.

## Worker email

Le worker email est volontairement ignore par defaut, car il peut envoyer de vrais emails si la queue contient des jobs.

Pour l'inclure :

```bash
npm run validate:preprod -- --email-worker
```

ou :

```bash
GO26_RUN_EMAIL_WORKER=true npm run validate:preprod
```

## Verdict

Le script sort :

```text
GO26 preprod verdict: PASS
```

ou :

```text
GO26 preprod verdict: FAIL
```

Un `FAIL` bloque la promotion production.

## Recette manuelle complementaire

Apres un `PASS`, faire aussi :

1. ouvrir la preprod mobile et desktop ;
2. completer un diagnostic ;
3. verifier que la session apparait dans le back-office ;
4. ouvrir le detail session ;
5. verifier Pilotage, Emails, Restitutions, Qualite ;
6. exporter un CSV ;
7. verifier qu'une mauvaise cle admin est refusee.

## Gate prod

La prod n'est autorisee que si :

- `npm run verify:preprod` passe ;
- `npm run validate:preprod` passe ;
- la recette manuelle complementaire est OK ;
- `npm audit` a ete lance hors sandbox et ne remonte pas de faille critical/high ;
- le worker email a ete teste sur une queue preprod controlee.

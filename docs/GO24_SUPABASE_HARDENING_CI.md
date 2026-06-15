# GO24 - Hardening Supabase et CI minimale

## Objectif

GO24 corrige les deux blocages GO23 avant toute preprod :

- supprimer les anciennes policies publiques d'ecriture/suppression du catalogue ;
- verrouiller les vues back-office ;
- ajouter une CI minimale qui protege les branches de travail et la branche preprod.

## Migration ajoutee

```text
supabase/migrations/20260528230000_go24_security_hardening.sql
```

Elle fait trois choses :

1. supprime les policies historiques :
   - `Anyone can insert categories`
   - `Anyone can insert tools`
   - `Anyone can delete categories`
   - `Anyone can delete tools`
2. conserve la lecture publique de `categories` et `tools` ;
3. verrouille les vues back-office :
   - `vw_backoffice_diagnostic_sessions`
   - `vw_backoffice_email_health`

## CI ajoutee

```text
.github/workflows/preprod-ci.yml
```

La CI lance :

- `npm ci`
- `npm test -- --environment node`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`

Elle tourne sur :

- pull request vers `main` ou `preprod` ;
- push sur `codex/**` ou `preprod`.

## Verification preprod

Apres application des migrations sur le projet Supabase preprod :

```bash
npm test -- --environment node
npx tsc --noEmit
npm run build
git diff --check
```

Puis tester les Edge Functions :

```bash
curl -X POST "$SUPABASE_URL/functions/v1/send-backoffice-alerts" \
  -H "x-worker-key: $BACKOFFICE_ALERT_WORKER_KEY" \
  -H "content-type: application/json" \
  -d '{"days":1,"limit":12,"locale":"fr","dryRun":true}'
```

```bash
curl -X POST "$SUPABASE_URL/functions/v1/process-diagnostic-email-jobs" \
  -H "x-worker-key: $DIAGNOSTIC_EMAIL_WORKER_KEY" \
  -H "content-type: application/json" \
  -d '{"batchSize":1,"maxAttempts":1}'
```

## Points a verifier dans Supabase

- `anon` ne peut plus inserer/supprimer `tools`.
- `anon` ne peut plus inserer/supprimer `categories`.
- `anon` ne peut pas lire `vw_backoffice_diagnostic_sessions`.
- `anon` ne peut pas lire `vw_backoffice_email_health`.
- `service_role` peut toujours lire les deux vues via `backoffice-diagnostic`.

## Limite locale

Le CLI Supabase n'est pas disponible dans ce sandbox. La migration a donc ete creee manuellement et devra etre appliquee/verifiee sur preprod.

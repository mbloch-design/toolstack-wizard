# GO20 - Process de deploiement

## Objectif

GO20 met de cote le processus de deploiement propre pour la stack diagnostic ToolTrim : base de donnees, edge functions, secrets, workers, alertes et recette avant mise en production.

## Ordre recommande

1. Appliquer les migrations Supabase.
2. Verifier les vues back-office : `vw_backoffice_diagnostic_sessions`, `vw_backoffice_email_health`.
3. Deployer les Edge Functions :
   - `backoffice-diagnostic`
   - `process-diagnostic-email-jobs`
   - `diagnostic-email-webhook`
   - `generate-report`
   - `send-backoffice-alerts`
4. Configurer les secrets.
5. Declencher un `dryRun` des alertes admin.
6. Declencher un batch email avec `batchSize: 1` sur une session de test.
7. Ouvrir le back-office et verifier Pilotage, Emails, Restitutions, Qualite.
8. Lancer la recette GO21.
9. Deployer le frontend.
10. Verifier les flux publics : diagnostic, restitution, reprise, email, back-office.

## Secrets a verifier

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `DIAGNOSTIC_EMAIL_FROM`
- `DIAGNOSTIC_EMAIL_WORKER_KEY`
- `BACKOFFICE_ADMIN_KEY`
- `BACKOFFICE_ALERT_WORKER_KEY`
- `BACKOFFICE_ALERT_EMAILS`
- `TOOLTRIM_APP_URL`
- `RESEND_WEBHOOK_SECRET`

## Workers a planifier

Email jobs :

```bash
curl -X POST "$SUPABASE_URL/functions/v1/process-diagnostic-email-jobs" \
  -H "x-worker-key: $DIAGNOSTIC_EMAIL_WORKER_KEY" \
  -H "content-type: application/json" \
  -d '{"batchSize":20,"maxAttempts":5}'
```

Alertes admin :

```bash
curl -X POST "$SUPABASE_URL/functions/v1/send-backoffice-alerts" \
  -H "x-worker-key: $BACKOFFICE_ALERT_WORKER_KEY" \
  -H "content-type: application/json" \
  -d '{"days":1,"limit":12,"locale":"fr","dryRun":true}'
```

## Gate avant production

Commandes locales :

```bash
npm run test:go21 -- --environment node
npx tsc --noEmit
npm run build
git diff --check
```

Gate fonctionnel :

- une session diagnostic completee est visible en back-office ;
- un email report-ready est envoye ou bloque par GO16 avec raison claire ;
- une restitution email est versionnee ;
- Pilotage remonte l'incident ou la valeur ;
- le digest GO19 contient la priorite attendue en `dryRun`.

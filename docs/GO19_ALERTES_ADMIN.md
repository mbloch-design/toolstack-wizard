# GO19 - Alertes admin internes

## Objectif

GO19 ajoute un digest d'alertes pour les priorites back-office critiques et hautes. Le but est de ne pas attendre qu'un humain ouvre le back-office pour voir qu'un rapport n'est pas parti, qu'une calibration est douteuse ou qu'une session a une forte valeur economique.

## Fonction ajoutee

Edge Function :

```text
supabase/functions/send-backoffice-alerts
```

Elle lit `vw_backoffice_diagnostic_sessions`, calcule un digest via `supabase/functions/_shared/admin-alerts.ts`, puis envoie un email Resend aux adresses configurees.

## Secrets requis

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `DIAGNOSTIC_EMAIL_FROM`
- `BACKOFFICE_ALERT_EMAILS` : liste separee par virgules
- `BACKOFFICE_ALERT_WORKER_KEY` ou `DIAGNOSTIC_EMAIL_WORKER_KEY`

## Payload

```json
{
  "days": 1,
  "limit": 12,
  "locale": "fr",
  "dryRun": false
}
```

`dryRun: true` renvoie le digest sans envoyer d'email.

## Verification

```bash
npm run test:go19 -- --environment node
```

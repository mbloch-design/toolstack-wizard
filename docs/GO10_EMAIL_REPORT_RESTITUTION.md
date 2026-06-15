# GO10 - Restitution email, rapport et relance

Date: 2026-05-27  
Scope: emails de restitution, PDF, suivi de relance, traces back-office.

---

## Delivered

### Emails contextualisés

Le worker email ne restitue plus seulement un score et un coût. Il injecte maintenant:

- profil de stack
- maturité
- risque principal
- premières priorités fonctionnelles
- progression sur les actions déjà cochées
- lien CTA conservé dans les métadonnées du job

Templates enrichis:

- `diagnostic_report_ready`
- `diagnostic_followup_24h`
- `diagnostic_followup_7d`
- `diagnostic_reactivation_30d`

Updated:

- `supabase/functions/process-diagnostic-email-jobs/index.ts`

### Cycle de relance

Après l'envoi du rapport, le worker planifie maintenant:

- relance action à 24h si `email_preferences.actions` est actif
- check-in à 7 jours si `email_preferences.checkIn` est actif
- réactivation à 30 jours si `email_preferences.checkIn` est actif

Chaque job garde une metadata `trigger: go10_followup` et `template_version: go10-email-v1`.

### Restitution tracée en base

Chaque email envoyé crée une ligne `diagnostic_restitutions` avec:

- version de template
- sujet
- destinataire
- profil/maturité/risque principal
- nombre de focus areas
- nombre d'actions complétées
- économies récupérées et totales si disponibles
- snapshot score/coût/risque

### PDF enrichi

L'export PDF embarque maintenant les insights GO7:

- lecture ToolTrim
- profil
- maturité
- risque principal
- priorités fonctionnelles

Updated:

- `src/components/dashboard/DashPdfExport.tsx`
- `supabase/functions/generate-report/index.ts`

---

## Notes

Le process de déploiement reste volontairement de côté pour la phase dédiée.  
Le prochain GO peut porter sur la qualité back-office de lecture des emails, ou sur l'orchestration IA du diagnostic si on veut pousser l'aspect fonctionnel.

# GO11 - Back-office restitution ops

Date: 2026-05-28  
Scope: pilotage back-office des emails, jobs, restitutions et versions.

---

## Delivered

### API back-office enrichie

La réponse dashboard expose maintenant:

- jobs email récents avec `metadata`
- restitutions récentes
- versions de templates
- CTA stockés
- signaux GO10 dans `summary` et `score_snapshot`

Updated:

- `supabase/functions/backoffice-diagnostic/index.ts`
- `src/lib/backofficeApi.ts`

### Onglet Restitutions

Nouveau tab back-office:

- total restitutions
- ventilation email/dashboard/pdf
- comptage versions GO10
- table des restitutions récentes
- ouverture directe de la session liée
- accès CTA quand présent
- export CSV dédié

Updated:

- `src/pages/BackOfficePage.tsx`

### Email operations

L'onglet email est plus opérationnel:

- jobs en file d'attente
- jobs à traiter maintenant
- jobs en traitement
- échecs récents
- jobs annulés
- version de template
- déclencheur de relance
- erreur courte visible
- CTA accessible

### Detail session

Le panneau session affiche mieux:

- jobs email avec version/trigger/schedule/actions
- relance et annulation depuis le détail
- historique de transitions email
- restitutions enrichies avec template, sujet, score et CTA

---

## Notes

Pas de nouvelle migration requise: GO11 exploite les tables et champs déjà posés par GO2, GO4, GO7, GO8 et GO10.  
Le déploiement reste hors scope, conformément à la consigne de le traiter dans une phase dédiée.

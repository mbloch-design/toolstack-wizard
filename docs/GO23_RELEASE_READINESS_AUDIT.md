# GO23 - Release readiness audit

## Verdict

Statut global : **pas encore pret pour production sans GO24**.

Le coeur applicatif compile, les tests locaux passent et le build est generable. En revanche, deux sujets doivent etre traites avant une vraie mise en production :

1. **Securite Supabase historique** : des policies anciennes autorisent encore `anon` / `authenticated` a inserer et supprimer `tools` / `categories`.
2. **Vues back-office** : les vues `vw_backoffice_*` contiennent des donnees operationnelles et PII. Elles doivent etre explicitement protegees via `REVOKE`/`GRANT` ou `security_invoker`, puis revalidees.

## Matrice release

| Domaine | Statut | Decision | Notes |
|---|---:|---|---|
| Build frontend | OK | Non bloquant | `npm run build` passe. Warnings Vite sur gros chunks uniquement. |
| Tests locaux | OK | Non bloquant | `npm test -- --environment node` : 7 fichiers, 19 tests, tous OK. |
| TypeScript | OK | Non bloquant | `npx tsc --noEmit` passe. |
| Diff hygiene | OK | Non bloquant | `git diff --check` passe. |
| Email quality gate | OK | Non bloquant | GO16 protege les emails avant Resend. |
| Pilotage back-office | OK | Non bloquant | GO17 + GO22 testés. |
| Alertes admin | OK local | A valider en staging | GO19 teste le digest, mais l'envoi Resend doit etre teste en `dryRun` puis reel. |
| Recette metier | OK local | Non bloquant | GO21 couvre diagnostic -> email quality -> pilotage -> alerte. |
| Secrets prod | Risque | A verifier | Tous les secrets sont identifies, mais leur presence prod n'est pas verifiable localement. |
| RLS / vues Supabase | Bloquant | GO24 | Risque d'exposition ou mutation non voulue via Data API. |
| CI/CD | Risque | Fortement conseille | Aucun workflow CI/CD repo detecte hors `node_modules`. |
| Audit dependances | Angle mort | A refaire hors sandbox | `npm audit` et `npm outdated` echouent car le sandbox ne resout pas `registry.npmjs.org`. |
| Verification navigateur | Angle mort | A refaire local/staging | Le serveur local reste bloque par sandbox sur les ports. |

## Validations executees

```bash
npm test -- --environment node
npx tsc --noEmit
npm run build
git diff --check
npm audit --json
npm outdated --json
```

Resultats :

- Tests : **OK**, 19 tests.
- TypeScript : **OK**.
- Build : **OK**, dist environ 116 MB, sitemap/prerender OK.
- Diff whitespace : **OK**.
- `npm audit` : **non verifiable**, erreur DNS `ENOTFOUND registry.npmjs.org`.
- `npm outdated` : **non verifiable**, erreur DNS `ENOTFOUND registry.npmjs.org`.

## Secrets requis

### Frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Note : le code contient des fallbacks vers le projet Supabase actuel et une cle publishable. Ce n'est pas un secret critique, mais en prod il vaut mieux tout fournir par env pour eviter une derive d'environnement.

### Edge Functions diagnostic / email

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `DIAGNOSTIC_EMAIL_FROM`
- `DIAGNOSTIC_EMAIL_WORKER_KEY`
- `DIAGNOSTIC_EMAIL_WEBHOOK_KEY` ou `RESEND_WEBHOOK_SECRET`
- `TOOLTRIM_APP_URL`

### Back-office

- `BACKOFFICE_ADMIN_KEY`
- `BACKOFFICE_ALERT_WORKER_KEY`
- `BACKOFFICE_ALERT_EMAILS`

### Seed / contenu

- `SEED_ADMIN_KEY`
- `LOVABLE_API_KEY` pour certaines fonctions d'enrichissement/traduction.

## Edge Functions

Configurees dans `supabase/config.toml` :

- `backoffice-diagnostic`
- `diagnostic-email-webhook`
- `enrich-tools`
- `generate-report`
- `process-diagnostic-email-jobs`
- `seed-content`
- `seed-diagnostic`
- `seed-tools-enrichment`
- `seed-tools-v4`
- `send-backoffice-alerts`
- `sitemap`
- `translate-tools`

Toutes ont `verify_jwt = false`. C'est acceptable uniquement si chaque fonction non publique applique une authentification applicative robuste.

Fonctions avec garde explicite :

- `backoffice-diagnostic` : `BACKOFFICE_ADMIN_KEY`.
- `process-diagnostic-email-jobs` : `DIAGNOSTIC_EMAIL_WORKER_KEY`.
- `send-backoffice-alerts` : `BACKOFFICE_ALERT_WORKER_KEY` ou `DIAGNOSTIC_EMAIL_WORKER_KEY`.
- `diagnostic-email-webhook` : `RESEND_WEBHOOK_SECRET` ou `DIAGNOSTIC_EMAIL_WEBHOOK_KEY`.
- seed functions : `SEED_ADMIN_KEY`.

Fonctions volontairement publiques a confirmer :

- `generate-report`
- `sitemap`

## Risques bloquants

### R1 - Policies publiques sur `tools` et `categories`

Migrations concernees :

- `20260312093240_2c4cde60-a5fc-45a8-bc7a-fb264adca420.sql`
- `20260312093851_27a5e255-f937-42bd-89cd-a22e26a048af.sql`

Risque :

- `anon` et `authenticated` peuvent inserer des `tools` / `categories`.
- `anon` et `authenticated` peuvent supprimer des `tools` / `categories`.

Impact :

- corruption catalogue ;
- suppression publique de donnees ;
- potentiel abus SEO / contenu.

Decision :

- **bloquant production**.

Correction GO24 :

- drop des policies `Anyone can insert categories`, `Anyone can insert tools`, `Anyone can delete categories`, `Anyone can delete tools`.
- garder uniquement SELECT public si le catalogue doit rester public.
- faire passer les seeds par Edge Function service role + `SEED_ADMIN_KEY`.

### R2 - Vues back-office non verrouillees explicitement

Vues concernees :

- `vw_backoffice_diagnostic_sessions`
- `vw_backoffice_email_health`

Risque :

- les vues sont dans le schema `public`, contiennent emails, sessions, metadonnees, statuts email et signaux de diagnostic.
- aucune ligne `REVOKE` ou `security_invoker` n'a ete trouvee dans les migrations.

Impact :

- exposition potentielle via Data API si privileges publics herites ou mal configures.

Decision :

- **bloquant production tant que non verifie dans Supabase**.

Correction GO24 :

- ajouter une migration de durcissement :
  - `REVOKE ALL ON public.vw_backoffice_diagnostic_sessions FROM anon, authenticated;`
  - `REVOKE ALL ON public.vw_backoffice_email_health FROM anon, authenticated;`
  - `GRANT SELECT ... TO service_role;`
- verifier si Postgres cible supporte `security_invoker = true`; sinon garder les vues non exposees au public.

## Risques importants non bloquants immediats

### R3 - Pas de CI/CD detecte

Aucun workflow `.github`, GitLab, CircleCI, etc. detecte hors `node_modules`.

Impact :

- les checks passent localement, mais rien ne les impose avant merge/deploy.

GO24/GO25 :

- ajouter workflow CI : install, tests, typecheck, build, diff check.

### R4 - Audit dependances non execute

Le sandbox ne peut pas joindre `registry.npmjs.org`.

GO24 ou pre-prod :

- relancer `npm audit --json` et `npm outdated --json` sur une machine avec reseau.
- corriger toute faille critical/high avant prod.

### R5 - Bundle volumineux

Build OK, mais Vite signale plusieurs gros chunks :

- `data-tools` environ 3.3 MB minifie ;
- `data-stacks` environ 1.8 MB minifie ;
- chunk principal environ 631 KB.

Impact :

- non bloquant pour back-office/diagnostic, mais peut peser sur UX publique.

Post-prod possible :

- code splitting data ;
- chargement lazy des gros index ;
- split back-office si necessaire.

### R6 - Verification navigateur non faite

Le sandbox bloque le lancement fiable d'un serveur local. Le build compile, mais il faut valider en staging :

- onboarding mobile ;
- back-office Pilotage ;
- drawer detail session ;
- exports CSV ;
- email CTA.

## Ce qui est solide

- Le tunnel diagnostic a une persistance robuste : sessions, events, snapshots, restitutions.
- Les emails sont asynchrones, retries, quality gate et historiques.
- Le back-office couvre sessions, emails, restitutions, qualite, pilotage.
- Les alertes admin existent avec mode `dryRun`.
- La recette GO21 protege le chainage metier critique.
- Les scripts de tests GO14-GO22 sont disponibles.

## Gate GO24 recommandee

Avant de parler de deploiement :

1. Corriger les policies publiques `tools` / `categories`.
2. Verrouiller les vues back-office.
3. Ajouter ou documenter la CI minimum.
4. Rejouer `npm audit` avec reseau.
5. Tester `send-backoffice-alerts` en `dryRun`.
6. Tester `process-diagnostic-email-jobs` sur une session staging.
7. Verifier le back-office en navigateur.

## Verdict final GO23

Le produit est **fonctionnellement proche de la prod**, mais **securitairement pas encore deployable** tant que R1 et R2 ne sont pas corriges ou infirmes directement dans Supabase.

Prochaine etape conseillee : **GO24 - hardening Supabase + CI minimum**.

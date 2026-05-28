# GO27 - Vercel preprod app validation

## Objectif

GO27 valide la couche Vercel preprod apres le PASS Supabase GO26 : URL publique, HTML servi, assets charges, puis recette globale sans warning applicatif.

## Situation de depart

GO26 peut passer avec un warning si `.env.preprod` pointe vers un domaine qui n'existe pas encore, par exemple :

```text
PREPROD_APP_URL=https://preprod.tooltrim.com
```

Dans ce cas, utiliser d'abord l'URL Vercel Preview reelle du deploiement de branche.

## Recuperer l'URL Vercel Preview

Dans Vercel :

1. ouvrir le projet ToolTrim ;
2. aller dans Deployments ;
3. ouvrir le dernier deploiement de la branche `codex/go25-preprod-hardening` ou `preprod` ;
4. copier l'URL Preview en `https://...vercel.app`.

## Enregistrer l'URL localement

```bash
npm run set:preprod-url -- https://your-preview-url.vercel.app
```

Cette commande met a jour localement :

- `PREPROD_APP_URL`
- `TOOLTRIM_APP_URL`

Le fichier `.env.preprod` reste ignore par Git.

## Verifier l'app

```bash
npm run validate:preprod-app
```

Le script verifie :

1. statut HTTP 2xx/3xx ;
2. contenu HTML ;
3. presence du root Vite ;
4. chargement de quelques assets JS/CSS.

## Recette globale

Quand GO27 passe :

```bash
npm run validate:preprod
```

Le warning `preprod app responds` doit disparaitre.

## Resultat preprod du 2026-05-28

URL verifiee :

```text
https://toolstack-wizard-get2jswpl-mbloch-designs-projects.vercel.app/fr
```

Resultat app :

```text
GO27 preprod app verdict: PASS
```

Resultat global :

```text
GO26 preprod verdict: PASS
Checks: 10, failed: 0, warnings: 0, skipped: 1
```

Le `SKIP` restant concerne volontairement le worker email, qui peut envoyer des emails reels si une queue preprod contient des jobs.

## Preview Protection

Si Vercel Preview Protection est active, un fetch classique peut repondre en `401 Authentication Required`.

Dans ce cas, le script tente `vercel curl`, qui permet a une CLI Vercel authentifiee de verifier une preview protegee :

```bash
npm run login:vercel
npm run validate:preprod-app
```

Alternative pour une recette automatisee publique : desactiver temporairement la protection Preview ou utiliser un domaine preprod accessible.

Autre alternative recommandee pour garder la protection active :

1. Vercel > Project Settings > Deployment Protection.
2. Creer un `Protection Bypass for Automation`.
3. Ajouter la valeur dans `.env.preprod` :

```text
VERCEL_AUTOMATION_BYPASS_SECRET=...
```

4. Relancer :

```bash
npm run validate:preprod-app
```

## Suite

Si Vercel Preview est protege par authentification, le script peut echouer en 401/403. Pour la recette automatisee, utiliser un domaine preprod accessible ou desactiver temporairement la protection Preview sur cet environnement.

# GO16 - Controle qualite email et restitution

## Objectif

GO16 ajoute un garde-fou avant l'envoi des emails de diagnostic. Le worker verifie maintenant que chaque restitution email contient un sujet exploitable, un HTML suffisamment complet, un fallback texte, un CTA valide et aucune valeur non resolue.

## Ce qui est controle

- Sujet trop court ou trop long.
- Corps HTML trop faible.
- Fallback texte trop faible.
- CTA absent, invalide, absent du HTML ou absent du texte.
- Lien HTML absent.
- Valeurs non resolues : `undefined`, `null`, `NaN`, `[object Object]`.

Un email avec erreur bloquante passe en `failed` sans appel Resend. Un email avec avertissement peut partir, mais le warning reste visible dans les metadonnees.

## Donnees stockees

Chaque job email enrichi contient maintenant :

- `metadata.email_quality.status`
- `metadata.email_quality.score`
- `metadata.email_quality.flags`
- `metadata.email_quality.metrics`
- `metadata.email_quality_summary`
- `metadata.template_version = go16-email-v1`

Les restitutions email envoyees stockent aussi le resume qualite dans `summary.email_quality` et le detail complet dans `details.email_quality`.

## Back-office

Le back-office affiche une colonne `Qualite` dans :

- la liste des jobs email recents ;
- le detail d'une session ;
- l'export CSV email.

Les flags restent accessibles au survol du badge qualite et dans le CSV.

## Verification

Commande cible :

```bash
npm run test:go16 -- --environment node
```

Cette suite couvre le validateur email et garde GO15 dans le meme filet de regression.
